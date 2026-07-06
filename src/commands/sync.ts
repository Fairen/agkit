import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import {
  PLUGINS_END,
  PLUGINS_START,
  renderAgentsPluginList,
  renderPluginTable,
  replaceBetweenMarkers,
} from "../lib/docs.js";
import {
  findMarketplaceRoot,
  readMarketplace,
  resolveLocalPluginDir,
  scanLocalPlugins,
  writeMarketplace,
} from "../lib/marketplace.js";
import { refreshBuiltTargets } from "./build.js";

export interface SyncOptions {
  quiet?: boolean;
}

/**
 * Re-inject the plugin list between agkit markers in a doc file, if present.
 * No-op when the file or the markers are missing.
 */
function refreshMarkedDoc(
  root: string,
  relPath: string,
  body: string,
  label: string,
  changes: string[],
): void {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) return;
  const content = fs.readFileSync(abs, "utf8");
  const updated = replaceBetweenMarkers(
    content,
    PLUGINS_START,
    PLUGINS_END,
    body,
  );
  if (updated !== undefined && updated !== content) {
    fs.writeFileSync(abs, updated);
    changes.push(`~ refreshed ${label}`);
  }
}

/**
 * Reconcile marketplace.json with the plugins on disk.
 * Source of truth: each plugin's .claude-plugin/plugin.json.
 * - Adds catalog entries for plugin directories not yet listed
 * - Updates version/description/author drifted from the manifest
 * - Warns about catalog entries whose local source no longer exists
 *   (remote sources — github/url/git-subdir/npm — are left untouched)
 * - Regenerates the plugin table in README.md between agkit markers
 */
export async function syncCommand(
  startDir: string,
  opts: SyncOptions = {},
): Promise<void> {
  const root = findMarketplaceRoot(startDir);
  if (!root) {
    p.log.error(
      "No .claude-plugin/marketplace.json found. Run `agkit init` first.",
    );
    process.exitCode = 1;
    return;
  }

  const mp = readMarketplace(root);
  const locals = scanLocalPlugins(root, mp);
  const changes: string[] = [];

  for (const local of locals) {
    const manifest = local.manifest;
    const entryName = manifest.name || local.dirName;
    let entry = mp.plugins.find((e) => e.name === entryName);

    if (!entry) {
      // Marketplace-root-relative source: the only string form the official
      // schema accepts (`^\./`). Bare names fail `claude plugin validate`.
      entry = {
        name: entryName,
        source: `./${path.relative(root, local.dir).split(path.sep).join("/")}`,
      };
      mp.plugins.push(entry);
      changes.push(`+ added "${entryName}" to the catalog`);
    }

    for (const field of [
      "version",
      "description",
      "author",
      "keywords",
      "homepage",
    ] as const) {
      const value = manifest[field];
      if (
        value !== undefined &&
        JSON.stringify(entry[field]) !== JSON.stringify(value)
      ) {
        entry[field] = value as never;
        changes.push(`~ updated ${field} of "${entryName}"`);
      }
    }
  }

  // Orphan detection for local sources only.
  for (const entry of mp.plugins) {
    const dir = resolveLocalPluginDir(root, mp, entry);
    if (dir && !fs.existsSync(dir)) {
      changes.push(
        `! "${entry.name}" points to missing directory ${path.relative(root, dir)} — remove the entry or restore the plugin`,
      );
    }
  }

  mp.plugins.sort((a, b) => a.name.localeCompare(b.name));
  writeMarketplace(root, mp);

  // Keep already-built tier-2 registries (codex/cursor) fresh.
  const refreshed = refreshBuiltTargets(root, mp);
  for (const id of refreshed)
    changes.push(`~ refreshed ${id} tier-2 artifacts`);

  // Auto-maintained plugin lists between agkit markers.
  refreshMarkedDoc(
    root,
    "README.md",
    renderPluginTable(mp.plugins),
    "plugin list in README.md",
    changes,
  );
  refreshMarkedDoc(
    root,
    "AGENTS.md",
    renderAgentsPluginList(mp.plugins),
    "plugin list in AGENTS.md",
    changes,
  );

  if (!opts.quiet) {
    if (changes.length === 0) {
      p.log.success("Catalog already in sync.");
    } else {
      p.log.success(`Sync complete:\n  ${changes.join("\n  ")}`);
      if (changes.some((c) => c.startsWith("!"))) process.exitCode = 1;
    }
  }
}
