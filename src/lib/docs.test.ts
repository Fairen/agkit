import { describe, expect, it } from "vitest";
import {
  CHANGELOG_HEADER,
  PLUGINS_END,
  PLUGINS_START,
  prependChangelogEntry,
  renderAgentsPluginList,
  renderChangelogEntry,
  renderPluginTable,
  replaceBetweenMarkers,
} from "./docs.js";
import type { PluginEntry } from "./marketplace.js";

function plugin(overrides: Partial<PluginEntry>): PluginEntry {
  return { name: "p", source: "p", ...overrides };
}

describe("replaceBetweenMarkers", () => {
  const doc = `a\n${PLUGINS_START}\nold\n${PLUGINS_END}\nb`;

  it("replaces the body between markers, preserving surrounding text", () => {
    expect(replaceBetweenMarkers(doc, PLUGINS_START, PLUGINS_END, "new")).toBe(
      `a\n${PLUGINS_START}\nnew\n${PLUGINS_END}\nb`,
    );
  });

  it("returns undefined when a marker is missing", () => {
    expect(
      replaceBetweenMarkers("no markers here", PLUGINS_START, PLUGINS_END, "x"),
    ).toBeUndefined();
  });

  it("returns undefined when markers are out of order", () => {
    const swapped = `${PLUGINS_END}\nx\n${PLUGINS_START}`;
    expect(
      replaceBetweenMarkers(swapped, PLUGINS_START, PLUGINS_END, "x"),
    ).toBeUndefined();
  });
});

describe("renderPluginTable", () => {
  it("shows a hint when empty", () => {
    expect(renderPluginTable([])).toMatch(/No plugins yet/);
  });

  it("renders a three-column table without a keywords column by default", () => {
    const out = renderPluginTable([
      plugin({ name: "alpha", version: "1.2.0", description: "does A" }),
    ]);
    expect(out).toContain("| Plugin | Version | Description |");
    expect(out).not.toContain("Keywords");
    expect(out).toContain("| `alpha` | 1.2.0 | does A |");
  });

  it("links the name to the homepage when present", () => {
    const out = renderPluginTable([
      plugin({ name: "alpha", homepage: "https://example.com" }),
    ]);
    expect(out).toContain("[`alpha`](https://example.com)");
  });

  it("adds a keywords column only when a plugin declares keywords", () => {
    const out = renderPluginTable([
      plugin({ name: "alpha", keywords: ["ai", "cli"] }),
      plugin({ name: "beta" }),
    ]);
    expect(out).toContain("| Plugin | Version | Description | Keywords |");
    expect(out).toContain("`ai` `cli`");
  });
});

describe("renderAgentsPluginList", () => {
  it("shows a hint when empty", () => {
    expect(renderAgentsPluginList([])).toBe("_No plugins yet._");
  });

  it("renders one bullet per plugin with version and description", () => {
    expect(
      renderAgentsPluginList([
        plugin({ name: "alpha", version: "1.0.0", description: "does A" }),
      ]),
    ).toBe("- `alpha` (1.0.0) — does A");
  });
});

describe("renderChangelogEntry", () => {
  it("bullets the commit subjects under a dated heading", () => {
    expect(
      renderChangelogEntry("1.1.0", ["feat: add x", "fix: y"], "2026-07-06"),
    ).toBe("## 1.1.0 — 2026-07-06\n\n- feat: add x\n- fix: y");
  });

  it("falls back to a generic line when there are no subjects", () => {
    expect(renderChangelogEntry("1.1.0", [], "2026-07-06")).toBe(
      "## 1.1.0 — 2026-07-06\n\n- Release 1.1.0",
    );
  });
});

describe("prependChangelogEntry", () => {
  it("creates a headered changelog when none exists", () => {
    const entry = "## 0.1.0 — 2026-07-06\n\n- feat: init";
    expect(prependChangelogEntry(undefined, entry)).toBe(
      `${CHANGELOG_HEADER}\n\n${entry}\n`,
    );
  });

  it("inserts the newest entry directly below the header", () => {
    const existing = `${CHANGELOG_HEADER}\n\n## 0.1.0 — 2026-01-01\n\n- feat: init\n`;
    const entry = "## 0.2.0 — 2026-07-06\n\n- feat: more";
    const out = prependChangelogEntry(existing, entry);
    expect(out).toBe(
      `${CHANGELOG_HEADER}\n\n${entry}\n\n## 0.1.0 — 2026-01-01\n\n- feat: init\n`,
    );
    expect(out.indexOf("0.2.0")).toBeLessThan(out.indexOf("0.1.0"));
  });
});
