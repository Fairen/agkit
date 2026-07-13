import { readFileSync } from "node:fs";
import { Command } from "commander";
import { addPlugin } from "./commands/add.js";
import { buildCommand } from "./commands/build.js";
import { bumpCommand } from "./commands/bump.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { syncCommand } from "./commands/sync.js";
import { validateCommand } from "./commands/validate.js";

const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

const program = new Command();

program
  .name("agkit")
  .description(
    "Scaffold and manage plugin marketplaces for Claude Code and GitHub Copilot, distributed via any Git host.",
  )
  .version(version);

program
  .command("init")
  .argument("[dir]", "target directory (default: current directory)")
  .description(
    "Scaffold a new plugin marketplace (git-first), or a standalone plugin with --plugin",
  )
  .option(
    "-n, --name <name>",
    "marketplace (or plugin, with --plugin) name (kebab-case)",
  )
  .option("-o, --owner <owner>", "owner / plugin author name")
  .option("-e, --email <email>", "owner email")
  .option(
    "-d, --description <text>",
    "marketplace (or plugin, with --plugin) description",
  )
  .option("-r, --repo <url>", "git remote URL (any forge)")
  .option("--ci <ci>", "CI workflow: github | gitlab | none")
  .option(
    "--agents <list>",
    "comma-separated target agents (e.g. claude-code,copilot,codex)",
  )
  .option(
    "--plugin [template]",
    "scaffold a standalone plugin (skill|command|agent|hook|mcp, or a template spec) in [dir] instead of a marketplace",
  )
  .option("-y, --yes", "non-interactive, accept defaults")
  .action(async (dir, opts) => {
    await initCommand(dir, opts);
  });

program
  .command("add")
  .argument(
    "[template]",
    "built-in template name, local path, or remote git source (owner/repo, gh:/gl: shorthand, git URL). Remote sources are referenced, not cloned (see --vendor).",
  )
  .argument("[name]", "plugin name (kebab-case)")
  .description(
    "Register a plugin in the catalog: reference a remote git repo, or scaffold from a built-in/local template",
  )
  .option("-d, --description <text>", "one-line plugin description")
  .option(
    "--vendor",
    "clone the remote repo and scaffold from its files into the marketplace, instead of referencing it",
  )
  .option("--ref <ref>", "branch or tag to pin a referenced remote source to")
  .option(
    "--sha <sha>",
    "commit hash (40 hex) to pin a referenced remote source to",
  )
  .action(async (template, name, opts) => {
    await addPlugin(process.cwd(), template, name, {
      description: opts.description,
      interactive: opts.description === undefined,
      vendor: opts.vendor,
      ref: opts.ref,
      sha: opts.sha,
    });
  });

program
  .command("sync")
  .description("Reconcile marketplace.json and README with the plugins on disk")
  .action(async () => {
    await syncCommand(process.cwd());
  });

program
  .command("validate")
  .description(
    "Validate the catalog (local checks + `claude plugin validate` if available)",
  )
  .option("--strict", "treat warnings as errors in the official validator")
  .action(async (opts) => {
    await validateCommand(process.cwd(), { strict: opts.strict });
  });

program
  .command("bump")
  .argument("[plugin]", "plugin name (prompted if omitted)")
  .argument(
    "[level]",
    "major | minor | patch | auto (default: auto, from conventional commits)",
  )
  .description(
    "Bump a plugin version (conventional-commit aware) and sync the catalog",
  )
  .option(
    "-t, --tag",
    "commit the bump and create a release tag <plugin>@<version>",
  )
  .option("--dry-run", "show what would change without writing")
  .action(async (plugin, level, opts) => {
    await bumpCommand(process.cwd(), plugin, level, {
      tag: opts.tag,
      dryRun: opts.dryRun,
    });
  });

program
  .command("build")
  .description(
    "Generate tier-2 agent artifacts (codex, cursor) from the catalog",
  )
  .option(
    "--target <list>",
    "comma-separated tier-2 targets (default: those in metadata.targets)",
  )
  .option(
    "--check",
    "verify generated artifacts are up to date (CI); non-zero exit on drift",
  )
  .action(async (opts) => {
    await buildCommand(process.cwd(), {
      targets: opts.target,
      check: opts.check,
    });
  });

program
  .command("list")
  .description("List available plugin templates")
  .action(async () => {
    await listCommand();
  });

program.parseAsync().catch((err) => {
  console.error(err);
  process.exit(1);
});
