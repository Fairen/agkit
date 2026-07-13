import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import {
  AGENT_ADAPTERS,
  DEFAULT_AGENTS,
  getAdapter,
  parseAgentList,
  renderAgentsMd,
  renderInstallSections,
  renderTeamSections,
} from "../lib/agents.js";
import {
  DEFAULT_PLUGIN_ROOT,
  KEBAB_CASE_RE,
  MARKETPLACE_SCHEMA_URL,
  PLUGIN_TEMPLATES,
  RESERVED_MARKETPLACE_NAMES,
  TEMPLATE_DESCRIPTIONS,
} from "../lib/constants.js";
import {
  copyTemplateDir,
  readJson,
  renderTemplate,
  templatesDir,
  writeJson,
} from "../lib/fsutils.js";
import {
  getOriginUrl,
  gitInit,
  isGitAvailable,
  isGitRepo,
  isInsideGitRepo,
  parseRemoteUrl,
  type RemoteInfo,
} from "../lib/git.js";
import type { Marketplace } from "../lib/marketplace.js";
import { resolveTemplate } from "../lib/templates.js";
import { addPlugin } from "./add.js";

export interface InitOptions {
  name?: string;
  owner?: string;
  email?: string;
  description?: string;
  repo?: string;
  ci?: "github" | "gitlab" | "none";
  agents?: string;
  yes?: boolean;
  /**
   * Scaffold a standalone plugin (no marketplace) instead. `true` when `--plugin`
   * is passed without a value (template is then prompted / defaults to skill);
   * a string is the chosen template spec.
   */
  plugin?: string | boolean;
}

function titleCase(kebab: string): string {
  return kebab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function validateName(name: string): string | undefined {
  if (!KEBAB_CASE_RE.test(name)) {
    return "Name must be kebab-case (lowercase letters, digits, hyphens)";
  }
  if (RESERVED_MARKETPLACE_NAMES.includes(name)) {
    return `"${name}" is reserved by Claude Code and cannot be used`;
  }
  return undefined;
}

function marketplaceTpl(file: string): string {
  return fs.readFileSync(
    path.join(templatesDir(), "marketplace", file),
    "utf8",
  );
}

/** Build the argument for `/plugin marketplace add`, forge-agnostic. */
function addArgument(remote: RemoteInfo | undefined): string {
  if (!remote) return "<git-url-or-owner/repo>";
  return remote.isGitHub && remote.slug ? remote.slug : remote.httpsUrl;
}

/** Build the extraKnownMarketplaces source object, forge-agnostic. */
function teamSource(remote: RemoteInfo | undefined): string {
  const source =
    remote?.isGitHub && remote.slug
      ? { source: "github", repo: remote.slug }
      : {
          source: "url",
          url: remote?.httpsUrl ?? "https://<git-host>/<owner>/<repo>.git",
        };
  return JSON.stringify(source, null, 2)
    .split("\n")
    .map((line, i) => (i === 0 ? line : `      ${line}`))
    .join("\n");
}

/**
 * Scaffold a standalone plugin (a directory with `.claude-plugin/plugin.json`
 * and its content) without a surrounding marketplace. The result is its own
 * git repo, ready to be referenced from any marketplace with `agkit add`.
 */
async function initPlugin(
  targetDir: string,
  templateSpec: string | boolean,
  opts: InitOptions,
): Promise<void> {
  p.intro(pc.bgCyan(pc.black("  agkit init --plugin  ")));

  const defaultName = path
    .basename(targetDir)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Template: use the --plugin value, else prompt (or default to skill with -y).
  let spec = typeof templateSpec === "string" ? templateSpec : undefined;
  if (!spec) {
    if (opts.yes) {
      spec = "skill";
    } else {
      const answer = await p.select({
        message: "Plugin template",
        options: PLUGIN_TEMPLATES.map((t) => ({
          value: t as string,
          label: t,
          hint: TEMPLATE_DESCRIPTIONS[t],
        })),
      });
      if (p.isCancel(answer)) return cancel();
      spec = answer;
    }
  }

  let name = opts.name;
  if (!name && !opts.yes) {
    const answer = await p.text({
      message: "Plugin name (kebab-case)",
      initialValue: defaultName,
      validate: (v) =>
        KEBAB_CASE_RE.test(v)
          ? undefined
          : "Must be kebab-case (lowercase, digits, hyphens)",
    });
    if (p.isCancel(answer)) return cancel();
    name = answer;
  }
  name = name || defaultName;
  if (!KEBAB_CASE_RE.test(name)) {
    p.log.error(`Plugin name "${name}" must be kebab-case.`);
    process.exitCode = 1;
    return;
  }

  let description = opts.description;
  if (description === undefined && !opts.yes) {
    const answer = await p.text({
      message: "One-line description",
      defaultValue: "",
      placeholder: `What does ${name} do?`,
    });
    if (p.isCancel(answer)) return cancel();
    description = answer;
  }
  description = description || `TODO: describe what ${name} does.`;

  // Don't clobber an existing plugin (or marketplace) in the target dir.
  const manifestPath = path.join(targetDir, ".claude-plugin", "plugin.json");
  if (fs.existsSync(manifestPath)) {
    p.log.error(`A plugin already exists here: ${manifestPath}`);
    process.exitCode = 1;
    return;
  }

  const s = p.spinner();
  s.start("Scaffolding plugin");
  fs.mkdirSync(targetDir, { recursive: true });

  const vars = {
    pluginName: name,
    pluginTitle: titleCase(name),
    description,
    authorName: opts.owner || "Unknown",
  };

  let resolved: ReturnType<typeof resolveTemplate>;
  try {
    resolved = resolveTemplate(spec);
  } catch (err) {
    s.stop("Scaffolding failed");
    p.log.error((err as Error).message);
    process.exitCode = 1;
    return;
  }
  try {
    copyTemplateDir(resolved.dir, targetDir, vars);
  } finally {
    if (resolved.cleanup)
      fs.rmSync(resolved.cleanup, { recursive: true, force: true });
  }

  // Remote/local templates may ship a plain plugin.json: force the chosen name.
  if (!resolved.builtin && fs.existsSync(manifestPath)) {
    try {
      const manifest = readJson<Record<string, unknown>>(manifestPath);
      manifest.name = name;
      if (opts.description) manifest.description = description;
      writeJson(manifestPath, manifest);
    } catch {
      p.log.warn("Template plugin.json could not be parsed; left as-is.");
    }
  }

  // Make it its own repo so it can be pushed and referenced remotely — but only
  // when it isn't already inside one (e.g. dropped into a marketplace's
  // plugins/), to avoid creating a nested git repo.
  const standalone = !isInsideGitRepo(targetDir);
  if (standalone) {
    const gitignore = path.join(targetDir, ".gitignore");
    if (!fs.existsSync(gitignore)) {
      fs.writeFileSync(
        gitignore,
        ["node_modules/", ".DS_Store", "*.log", ""].join("\n"),
      );
    }
    if (isGitAvailable()) {
      try {
        gitInit(targetDir);
      } catch {
        p.log.warn("git init failed; initialize the repository manually.");
      }
    }
  }

  s.stop("Plugin scaffolded");

  const rel = path.relative(process.cwd(), targetDir) || ".";
  p.note(
    [
      `Standalone plugin "${name}" (${resolved.label}) — no marketplace was created.`,
      "",
      "Distribute it either way:",
      "  • Push this folder to its own git repo, then reference it from a",
      `    marketplace:  agkit add <owner/repo> ${name}`,
      "  • Or drop it into an existing marketplace's plugins/ and run:",
      "    agkit sync",
    ].join("\n"),
    `Next steps  (cd ${rel})`,
  );
  p.outro("Done ✔");
}

export async function initCommand(
  dirArg: string | undefined,
  opts: InitOptions,
): Promise<void> {
  const targetDir = path.resolve(dirArg ?? ".");

  // Standalone-plugin mode: scaffold just a plugin directory, no marketplace.
  if (opts.plugin) {
    return initPlugin(targetDir, opts.plugin, opts);
  }

  p.intro(pc.bgCyan(pc.black("  agkit init  ")));

  const defaultName = path
    .basename(targetDir)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Detect an existing git remote to prefill install instructions.
  const gitAvailable = isGitAvailable();
  const existingRemote =
    gitAvailable && fs.existsSync(targetDir)
      ? getOriginUrl(targetDir)
      : undefined;

  let name = opts.name;
  let owner = opts.owner;
  let email = opts.email;
  let description = opts.description;
  let repoUrl = opts.repo ?? existingRemote;
  let ci = opts.ci;
  let agentsRaw = opts.agents;

  if (!opts.yes) {
    if (!name) {
      const answer = await p.text({
        message:
          "Marketplace name (kebab-case, shown in /plugin install <plugin>@<name>)",
        initialValue: defaultName,
        validate: (v) => validateName(v),
      });
      if (p.isCancel(answer)) return cancel();
      name = answer;
    }
    if (!owner) {
      const answer = await p.text({
        message: "Owner name (person or team)",
        placeholder: "Your Team",
        validate: (v) => (v.trim() ? undefined : "Owner name is required"),
      });
      if (p.isCancel(answer)) return cancel();
      owner = answer;
    }
    if (email === undefined) {
      const answer = await p.text({
        message: "Owner email (optional)",
        defaultValue: "",
        placeholder: "team@example.com",
      });
      if (p.isCancel(answer)) return cancel();
      email = answer;
    }
    if (description === undefined) {
      const answer = await p.text({
        message: "Short description",
        defaultValue: "",
        placeholder: "A curated collection of Claude Code plugins",
      });
      if (p.isCancel(answer)) return cancel();
      description = answer;
    }
    if (repoUrl === undefined) {
      const answer = await p.text({
        message:
          "Git remote URL where this marketplace will be pushed (optional, any forge)",
        defaultValue: "",
        placeholder: "git@gitlab.example.com:team/my-marketplace.git",
      });
      if (p.isCancel(answer)) return cancel();
      repoUrl = answer || undefined;
    }
    if (!ci) {
      const answer = await p.select({
        message: "CI validation workflow",
        options: [
          { value: "github" as const, label: "GitHub Actions" },
          { value: "gitlab" as const, label: "GitLab CI" },
          { value: "none" as const, label: "None" },
        ],
        initialValue: parseRemoteUrl(repoUrl ?? "")?.isGitLab
          ? ("gitlab" as const)
          : ("github" as const),
      });
      if (p.isCancel(answer)) return cancel();
      ci = answer;
    }
    if (agentsRaw === undefined) {
      const answer = await p.multiselect({
        message: "Target coding agents (space to toggle)",
        options: AGENT_ADAPTERS.map((a) => ({
          value: a.id,
          label: `${a.label}${a.tier === 1 ? "" : `  (tier ${a.tier}, needs generation)`}`,
        })),
        initialValues: DEFAULT_AGENTS,
        required: true,
      });
      if (p.isCancel(answer)) return cancel();
      agentsRaw = (answer as string[]).join(",");
    }
  }

  // Non-interactive fallbacks and validation.
  name = name || defaultName;
  const nameError = validateName(name);
  if (nameError) {
    p.log.error(nameError);
    process.exitCode = 1;
    return;
  }
  owner = owner || "Unknown Owner";
  ci = ci ?? "github";

  // Resolve target agents.
  const { ids: agentIds, unknown } = parseAgentList(
    agentsRaw ?? DEFAULT_AGENTS.join(","),
  );
  if (unknown.length > 0) {
    p.log.warn(
      `Unknown agent(s) ignored: ${unknown.join(", ")}. Known: ${AGENT_ADAPTERS.map((a) => a.id).join(", ")}.`,
    );
  }
  const targets = agentIds.length > 0 ? agentIds : [...DEFAULT_AGENTS];

  const remote = repoUrl ? parseRemoteUrl(repoUrl) : undefined;
  if (repoUrl && !remote) {
    p.log.warn(
      `Could not parse remote URL "${repoUrl}"; install instructions will use placeholders.`,
    );
  }

  const s = p.spinner();
  s.start("Scaffolding marketplace");

  fs.mkdirSync(targetDir, { recursive: true });

  // 1. Catalog
  const marketplace: Marketplace = {
    $schema: MARKETPLACE_SCHEMA_URL,
    name,
    owner: { name: owner, ...(email ? { email } : {}) },
    metadata: {
      ...(description ? { description } : {}),
      version: "1.0.0",
      pluginRoot: DEFAULT_PLUGIN_ROOT,
      targets,
    },
    plugins: [],
  };
  writeJson(
    path.join(targetDir, ".claude-plugin", "marketplace.json"),
    marketplace,
  );

  // 2. Plugin root
  fs.mkdirSync(path.join(targetDir, "plugins"), { recursive: true });
  fs.writeFileSync(path.join(targetDir, "plugins", ".gitkeep"), "");

  // 3. README (install + team sections composed from the selected agents),
  //    AGENTS.md, and a team-settings example.
  const desc = description || "A curated collection of agent plugins.";
  const mktArg = addArgument(remote);
  const teamBlock = teamSource(remote);
  const vars = {
    marketplaceName: name,
    description: desc,
    addArgument: mktArg,
    teamSource: teamBlock,
    installSections: renderInstallSections(targets, mktArg, name),
    teamSections: renderTeamSections(targets, teamBlock, name),
  };
  fs.writeFileSync(
    path.join(targetDir, "README.md"),
    renderTemplate(marketplaceTpl("README.md.tpl"), vars),
  );
  fs.writeFileSync(
    path.join(targetDir, "AGENTS.md"),
    renderAgentsMd(name, desc, targets),
  );
  const exampleDir = path.join(targetDir, "examples");
  fs.mkdirSync(exampleDir, { recursive: true });
  fs.writeFileSync(
    path.join(exampleDir, "team-settings.json"),
    renderTemplate(marketplaceTpl("team-settings.json.tpl"), vars),
  );

  // 4. CI
  if (ci === "github") {
    const wfDir = path.join(targetDir, ".github", "workflows");
    fs.mkdirSync(wfDir, { recursive: true });
    fs.writeFileSync(
      path.join(wfDir, "validate.yml"),
      renderTemplate(marketplaceTpl("github-validate.yml.tpl"), vars),
    );
  } else if (ci === "gitlab") {
    fs.writeFileSync(
      path.join(targetDir, ".gitlab-ci.yml"),
      renderTemplate(marketplaceTpl("gitlab-ci.yml.tpl"), vars),
    );
  }

  // 5. .gitignore + git init
  fs.writeFileSync(
    path.join(targetDir, ".gitignore"),
    ["node_modules/", ".DS_Store", "*.log", ""].join("\n"),
  );
  if (gitAvailable && !isGitRepo(targetDir)) {
    try {
      gitInit(targetDir);
    } catch {
      p.log.warn("git init failed; initialize the repository manually.");
    }
  }

  s.stop("Marketplace scaffolded");

  // 6. Optional starter plugin
  if (!opts.yes) {
    const wantStarter = await p.confirm({
      message: "Add a starter plugin now?",
      initialValue: true,
    });
    if (!p.isCancel(wantStarter) && wantStarter) {
      await addPlugin(targetDir, undefined, undefined, { interactive: true });
    }
  }

  const rel = path.relative(process.cwd(), targetDir) || ".";
  p.note(
    [
      `cd ${rel}`,
      remote
        ? `git remote add origin ${remote.httpsUrl}  # if not already set`
        : "git remote add origin <your-git-url>",
      "agkit add skill my-first-skill",
      "agkit validate",
      "git add -A && git commit -m 'feat: initial marketplace'",
      "git push -u origin main",
      "",
      `Target agents: ${targets.map((id) => getAdapter(id)?.label ?? id).join(", ")}`,
      `Native install (no build): ${
        targets
          .filter((id) => getAdapter(id)?.tier === 1)
          .map((id) => getAdapter(id)?.label)
          .join(", ") || "none"
      }`,
    ].join("\n"),
    "Next steps",
  );

  const needBuild = targets.filter((id) => (getAdapter(id)?.tier ?? 1) > 1);
  if (needBuild.length > 0) {
    p.log.warn(
      `Recorded tier 2/3 target(s) in metadata.targets: ${needBuild.map((id) => getAdapter(id)?.label).join(", ")}.\n` +
        "These are NOT installable from the Claude catalog alone — they need generated per-agent artifacts. " +
        "agkit records the intent and documents it; artifact generation (`agkit build --target …`) is not implemented yet. " +
        "See README install notes.",
    );
  }
  p.outro("Done ✔");
}

function cancel(): void {
  p.cancel("Cancelled.");
  process.exitCode = 1;
}
