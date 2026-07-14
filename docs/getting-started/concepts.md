---
description: The catalog, plugins, sources, and agent tiers — the model behind every command.
---

# Core concepts

A few ideas explain everything agkit does. Read this once and the commands stop
being magic.

## The canonical catalog

A marketplace is a git repository with **one source of truth**:

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json      ← the canonical catalog
├── plugins/                  ← local plugins live here (pluginRoot)
│   └── tdd-coach/
│       └── .claude-plugin/
│           └── plugin.json   ← that plugin's manifest
├── AGENTS.md                 ← repo context, read natively by most agents
├── README.md                 ← human docs (plugin table auto-maintained)
└── examples/team-settings.json
```

`marketplace.json` lists every plugin. Native agents read it directly; generated
registries (for Codex/Cursor) are derived from it. You never hand-edit the
derived files — see [marketplace.json](../reference/marketplace-json.md).

## Plugins: local vs. remote

A catalog entry's **`source`** decides where the plugin's files live. This is the
single most important distinction in agkit.

| | **Local plugin** | **Remote (referenced) plugin** |
| :--- | :--- | :--- |
| Files | committed inside your repo under `plugins/<name>/` | stay in **their own repo**, nothing is copied |
| `source` | a relative string, e.g. `"./plugins/tdd-coach"` | an object, e.g. `{ "source": "github", "repo": "acme/deploy" }` |
| Fetched | it is already there | by the agent, at install time |
| Created with | `agkit add skill …` / `agkit add ./tpl …` | `agkit add acme/deploy …` |
| Versioned with | `agkit bump` (you own it) | upstream owns the version |

A **remote git source is referenced by default** — no clone, no copy. Add
`--vendor` only when you want the upstream files copied into your repo (it then
becomes a local plugin). See [Add a local plugin](../guides/add-a-local-plugin.md)
and [Add a remote plugin](../guides/add-a-remote-plugin.md).

## Templates

When you scaffold a **local** plugin you start from a *template*. agkit ships
five built-ins:

| Template | What the plugin exposes |
| :--- | :--- |
| `skill` | an Agent Skill (`SKILL.md`) — knowledge or a repeatable procedure loaded on demand |
| `command` | a slash command (`commands/<name>.md`) invoked as `/<plugin>:<name>` |
| `agent` | a subagent (`agents/<name>.md`) — a named specialist with its own instructions |
| `hook` | an event handler (`hooks/hooks.json` + script) for Claude Code lifecycle events |
| `mcp` | a bundled MCP server (`.mcp.json` + a zero-dependency Node stdio server) |

You can also scaffold from a **local directory** or a **remote git repo used as a
template**. Any directory with a `.claude-plugin/plugin.json` (or a
`plugin.json.tpl`) is a valid template. See
[Template & source spec](../reference/template-spec.md).

## Target agents and tiers

`agkit init --agents <list>` records which agents you serve. Agents fall into
tiers by how much structure they need:

| Tier | Agents | How agkit serves them |
| :--- | :--- | :--- |
| **1 · Native** | Claude Code, GitHub Copilot | read `marketplace.json` as-is — nothing to generate |
| **2 · Generated** | OpenAI Codex, Cursor | `agkit build` writes a committed registry derived from the catalog |
| **3 · Transform** | Gemini, OpenCode, Kiro | recorded as intent; artifact generation is planned, not yet buildable |

The default is `claude-code,copilot` (both tier 1). Tier-2 targets need one
`agkit build`; after that `add` / `bump` / `sync` keep the registry fresh
automatically. See [Target agents](../reference/target-agents.md).

## The lifecycle commands, at a glance

```
init ──► add ──► (build) ──► validate ──► git push
             ▲                                 │
             └──────── bump / sync ◄───────────┘
```

* **`init`** scaffolds the repository.
* **`add`** registers a plugin (local or remote).
* **`build`** generates tier-2 registries (Codex/Cursor).
* **`sync`** reconciles the catalog with what is on disk and refreshes generated
  docs/registries.
* **`bump`** versions a local plugin from its commits and updates everything
  downstream.
* **`validate`** gates the catalog for CI.
* **`list`** shows the built-in templates.

Every command has its own page in the [Command reference](../commands/README.md).

## Generated docs never drift

agkit maintains a few human-facing artifacts from the catalog so they stay
correct:

* the **plugin table in `README.md`** and the **plugin list in `AGENTS.md`** are
  regenerated between `<!-- agkit:plugins:start -->` / `<!-- agkit:plugins:end -->`
  markers on every mutating command;
* each plugin's **`CHANGELOG.md`** gets a dated entry from `agkit bump`.

Edit the catalog or the per-plugin manifests (or run `agkit sync`) and the docs
follow.
