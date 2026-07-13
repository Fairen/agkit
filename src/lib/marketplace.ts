import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_PLUGIN_ROOT,
  MARKETPLACE_DIR,
  MARKETPLACE_FILE,
  PLUGIN_MANIFEST_FILE,
} from "./constants.js";
import { readJson, writeJson } from "./fsutils.js";

export interface Person {
  name: string;
  email?: string;
  url?: string;
}

/**
 * Object source forms accepted by the official marketplace schema for plugins
 * hosted outside the marketplace repo (fetched by the agent at install time,
 * never vendored into the catalog). See `resolveRemoteSource`.
 */
export type RemotePluginSource =
  | { source: "github"; repo: string; ref?: string; sha?: string }
  | { source: "url"; url: string; ref?: string; sha?: string }
  | {
      source: "git-subdir";
      url: string;
      path: string;
      ref?: string;
      sha?: string;
    };

export interface PluginEntry {
  name: string;
  source: string | Record<string, unknown>;
  description?: string;
  version?: string;
  author?: Person;
  category?: string;
  keywords?: string[];
  homepage?: string;
  [key: string]: unknown;
}

export interface Marketplace {
  $schema?: string;
  name: string;
  owner: Person;
  metadata?: {
    description?: string;
    version?: string;
    pluginRoot?: string;
    targets?: string[];
    [key: string]: unknown;
  };
  plugins: PluginEntry[];
  [key: string]: unknown;
}

export interface PluginManifest {
  name: string;
  version?: string;
  description?: string;
  author?: Person;
  keywords?: string[];
  homepage?: string;
  [key: string]: unknown;
}

export function marketplacePath(root: string): string {
  return path.join(root, MARKETPLACE_DIR, MARKETPLACE_FILE);
}

/** Walk up from cwd until a .claude-plugin/marketplace.json is found. */
export function findMarketplaceRoot(startDir: string): string | undefined {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(marketplacePath(dir))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function readMarketplace(root: string): Marketplace {
  return readJson<Marketplace>(marketplacePath(root));
}

export function writeMarketplace(root: string, data: Marketplace): void {
  writeJson(marketplacePath(root), data);
}

export function pluginRootDir(root: string, mp: Marketplace): string {
  const rel = mp.metadata?.pluginRoot ?? DEFAULT_PLUGIN_ROOT;
  return path.resolve(root, rel);
}

/**
 * Resolve the on-disk directory of a plugin entry with a relative-path or
 * pluginRoot-relative source. Returns undefined for remote sources
 * (github, url, git-subdir, npm objects).
 */
export function resolveLocalPluginDir(
  root: string,
  mp: Marketplace,
  entry: PluginEntry,
): string | undefined {
  if (typeof entry.source !== "string") return undefined;
  if (entry.source.startsWith("./") || entry.source.startsWith("../")) {
    return path.resolve(root, entry.source);
  }
  return path.join(pluginRootDir(root, mp), entry.source);
}

export interface LocalPlugin {
  dir: string;
  dirName: string;
  manifest: PluginManifest;
}

/** Scan the plugin root for directories containing .claude-plugin/plugin.json. */
export function scanLocalPlugins(root: string, mp: Marketplace): LocalPlugin[] {
  const base = pluginRootDir(root, mp);
  if (!fs.existsSync(base)) return [];
  const result: LocalPlugin[] = [];
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(
      base,
      entry.name,
      MARKETPLACE_DIR,
      PLUGIN_MANIFEST_FILE,
    );
    if (!fs.existsSync(manifestPath)) continue;
    result.push({
      dir: path.join(base, entry.name),
      dirName: entry.name,
      manifest: readJson<PluginManifest>(manifestPath),
    });
  }
  return result;
}
