import type { PluginEntry } from "./marketplace.js";

/**
 * Catalog-derived documentation. Every renderer here is a pure function of the
 * catalog (or a plugin's commit history), so the same output can be injected
 * between markers on every mutating command (`add`/`bump`/`sync`) and never
 * drifts. Heavier, opt-in artifacts belong in build-targets.ts instead.
 */

/** Markers delimiting the auto-maintained plugin list in README.md / AGENTS.md. */
export const PLUGINS_START = "<!-- agkit:plugins:start -->";
export const PLUGINS_END = "<!-- agkit:plugins:end -->";

export const CHANGELOG_HEADER = "# Changelog";

/**
 * Replace the text between `start` and `end` markers in `content`.
 * Returns the updated string, or `undefined` when the markers are absent or
 * out of order (caller then leaves the file untouched).
 */
export function replaceBetweenMarkers(
  content: string,
  start: string,
  end: string,
  body: string,
): string | undefined {
  const s = content.indexOf(start);
  const e = content.indexOf(end);
  if (s === -1 || e === -1 || e < s) return undefined;
  return `${content.slice(0, s + start.length)}\n${body}\n${content.slice(e)}`;
}

const EMPTY_HINT =
  "_No plugins yet. Add one with `agkit add <template> <name>`._";

/**
 * Markdown table of the catalog for README.md. A `Keywords` column is added
 * only when at least one plugin declares keywords, and the plugin name links to
 * its homepage when set.
 */
export function renderPluginTable(plugins: PluginEntry[]): string {
  if (plugins.length === 0) return EMPTY_HINT;
  const withKeywords = plugins.some((p) => (p.keywords?.length ?? 0) > 0);
  const header = withKeywords
    ? [
        "| Plugin | Version | Description | Keywords |",
        "| :----- | :------ | :---------- | :------- |",
      ]
    : [
        "| Plugin | Version | Description |",
        "| :----- | :------ | :---------- |",
      ];
  const rows = plugins.map((e) => {
    const name = e.homepage
      ? `[\`${e.name}\`](${e.homepage})`
      : `\`${e.name}\``;
    const cells = [name, e.version ?? "—", e.description ?? ""];
    if (withKeywords) {
      cells.push((e.keywords ?? []).map((k) => `\`${k}\``).join(" "));
    }
    return `| ${cells.join(" | ")} |`;
  });
  return [...header, ...rows].join("\n");
}

/** Compact agent-facing plugin list for AGENTS.md (context, not a table). */
export function renderAgentsPluginList(plugins: PluginEntry[]): string {
  if (plugins.length === 0) return "_No plugins yet._";
  return plugins
    .map((e) => {
      const version = e.version ? ` (${e.version})` : "";
      const desc = e.description ? ` — ${e.description}` : "";
      return `- \`${e.name}\`${version}${desc}`;
    })
    .join("\n");
}

/**
 * One dated changelog section (Keep a Changelog style, newest on top).
 * `subjects` are commit subject lines; falls back to a generic line when empty
 * (e.g. an explicit bump outside a git repo).
 */
export function renderChangelogEntry(
  version: string,
  subjects: string[],
  date: string,
): string {
  const bullets =
    subjects.length > 0
      ? subjects.map((s) => `- ${s}`).join("\n")
      : `- Release ${version}`;
  return `## ${version} — ${date}\n\n${bullets}`;
}

/**
 * Insert a new entry directly below the changelog header, creating the file
 * body when it is missing or headerless.
 */
export function prependChangelogEntry(
  existing: string | undefined,
  entry: string,
): string {
  if (!existing?.includes(CHANGELOG_HEADER)) {
    return `${CHANGELOG_HEADER}\n\n${entry}\n`;
  }
  const idx = existing.indexOf(CHANGELOG_HEADER) + CHANGELOG_HEADER.length;
  const before = existing.slice(0, idx);
  const after = existing.slice(idx).replace(/^\n+/, "");
  return `${`${before}\n\n${entry}\n\n${after}`.trimEnd()}\n`;
}
