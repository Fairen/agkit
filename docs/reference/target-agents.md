---
description: The agents agkit can serve, their tiers, and how consumers install.
---

# Target agents

`agkit init --agents <list>` records which agents a marketplace serves in
`metadata.targets`. Agents are grouped into **tiers** by how much structure they
need beyond the canonical catalog.

## Tiers

| Tier | Meaning | Agents |
| :--- | :--- | :--- |
| **1 · Native** | Reads `.claude-plugin/marketplace.json` as-is. No generated artifacts. | Claude Code, GitHub Copilot |
| **2 · Generated** | Needs a committed registry pointing at the shared `plugins/`. Built by [`agkit build`](../commands/build.md). | OpenAI Codex, Cursor |
| **3 · Transform** | Needs per-plugin transformed trees. Recorded as intent; generation is planned, not yet buildable. | Gemini, OpenCode, Kiro |

`init` fully wires **tier 1**. For **tier 2**, it records the target and you run
`agkit build` once; afterwards `add` / `bump` / `sync` refresh the registry
automatically. **Tier 3** targets are recorded and documented, but no artifacts
are generated yet.

## Agent ids

Use these ids with `--agents` and `--target`:

`claude-code`, `copilot`, `codex`, `cursor`, `gemini`, `opencode`, `kiro`.

Default for `init`: `claude-code,copilot`. Buildable by `build`: `codex`,
`cursor`.

## How consumers install

| Agent | Tier | Consumers install with |
| :--- | :--- | :--- |
| **Claude Code** | 1 | `/plugin marketplace add <owner/repo or URL>` → `/plugin install <plugin>@<marketplace>` |
| **GitHub Copilot** | 1 | `copilot plugin marketplace add …` → `copilot plugin install <plugin>@<marketplace>` |
| **OpenAI Codex** | 2 | `codex marketplace add …` (from the built `.agents/plugins/` registry) |
| **Cursor** | 2 | add the marketplace in Cursor, then install the plugin by name |

On GitHub the `owner/repo` shorthand works; on any other forge the full git URL
works everywhere.

## What `build` generates per tier-2 target

**Codex** — `.agents/plugins/marketplace.json` (object sources
`{ source: "local", path }`, with `policy` and `category`) plus per-plugin
`.codex-plugin/plugin.json` mirrors.

**Cursor** — `.cursor-plugin/marketplace.json` (string sources, same shape as the
Claude catalog) plus per-plugin `.cursor-plugin/plugin.json` mirrors.

Commit these generated files so consumers can install. Details:
[`agkit build`](../commands/build.md).

## Team auto-install

Agents that support it get an `extraKnownMarketplaces` block (from
`examples/team-settings.json`) so teammates receive the marketplace automatically
when they trust the repo:

| Agent | Settings file |
| :--- | :--- |
| Claude Code | `.claude/settings.json` |
| GitHub Copilot | `.github/copilot/settings.json` |

See [Publish → Team auto-install](../guides/publish-to-github-or-gitlab.md#team-auto-install).

## Changing targets later

Edit `metadata.targets` in `marketplace.json`, then run `agkit sync` (and
`agkit build` if you added a tier-2 target). Removing a tier-2 target leaves its
already-generated files in place — delete them by hand if you no longer want
them.
