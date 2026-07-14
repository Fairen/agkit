---
description: >-
  Scaffold your own plugin from a built-in or local template — its files are
  committed inside your marketplace.
---

# Add a local plugin

A **local plugin** lives inside your marketplace: its files are committed under
`plugins/<name>/` and its catalog `source` is a relative path like
`"./plugins/tdd-coach"`. You own it, you version it with
[`agkit bump`](../commands/bump.md), and it releases together with the repo.

Run these commands from inside your marketplace (any subdirectory works — agkit
walks up to find the catalog).

## From a built-in template

```bash
agkit add skill tdd-coach
```

* `skill` is the template — one of `skill`, `command`, `agent`, `hook`, `mcp`
  (see [Core concepts → Templates](../getting-started/concepts.md#templates)).
* `tdd-coach` is the plugin name — must be **kebab-case** (lowercase, digits,
  hyphens).

agkit scaffolds the files and registers the entry:

```
plugins/
└── tdd-coach/
    ├── .claude-plugin/
    │   └── plugin.json         # name, version 0.1.0, description, author
    └── skills/…                # template content for a `skill`
```

```jsonc
// .claude-plugin/marketplace.json  (excerpt)
{
  "plugins": [
    {
      "name": "tdd-coach",
      "source": "./plugins/tdd-coach",
      "description": "…",
      "version": "0.1.0"
    }
  ]
}
```

Add a description up front to skip the prompt:

```bash
agkit add skill tdd-coach -d "Coaches a strict red-green-refactor loop."
```

Run without a name (or without a template) and agkit prompts you interactively.

## From a local template directory

Any directory containing `.claude-plugin/plugin.json` (or a `plugin.json.tpl`) is
a template. Point at it with a relative or absolute path:

```bash
agkit add ./shared-templates/hook-guard no-secrets
agkit add path:/abs/path/to/template my-plugin
```

Files ending in `.tpl` are rendered with `{{pluginName}}`, `{{pluginTitle}}`,
`{{description}}`, and `{{authorName}}` — in file **contents and names**.
Executable bits are preserved. See
[Template & source spec](../reference/template-spec.md).

## Seed a local plugin from a remote template (vendoring)

To copy a remote repo's files **into** your marketplace (instead of referencing
it), add `--vendor`. agkit shallow-clones it, renders any `.tpl` files, and drops
the result under `plugins/<name>/` — from then on it is a normal local plugin.

```bash
agkit add gh:my-org/plugin-templates/kata-fr gilded-rose --vendor
```

The clone's `.git` is never copied. Pin the clone with `#ref` in the spec
(e.g. `…/skill-ddd#v2`). Vendoring needs an explicit `gh:` / `gl:` shorthand or a
git URL — a bare `owner/repo` only works for *referencing*.

> The alternative — **referencing** a remote plugin with no copy — is its own
> guide: [Add a remote plugin](add-a-remote-plugin.md).

## Edit, then keep the catalog in sync

Open the generated files under `plugins/tdd-coach/` and make the plugin real.
The plugin's `.claude-plugin/plugin.json` is the **source of truth** for its
name, version, description, author, keywords, and homepage. After editing the
manifest, reconcile the catalog and the docs:

```bash
agkit sync
```

`sync` copies manifest changes into `marketplace.json` and refreshes the plugin
tables in `README.md` and `AGENTS.md`. (`add` already ran a sync for you; you run
it again whenever you hand-edit a manifest.)

## Tier-2 agents: run `agkit build`

If your marketplace targets **Codex** or **Cursor**, generate their registries
once so the new plugin is installable there too:

```bash
agkit build
```

This writes the Codex registry (`.agents/plugins/marketplace.json` + per-plugin
`.codex-plugin/plugin.json`) and/or the Cursor registry
(`.cursor-plugin/marketplace.json` + per-plugin `.cursor-plugin/plugin.json`).
After the first build, `add` / `bump` / `sync` refresh them automatically. Native
agents (Claude Code, Copilot) need no build.

## Validate and test locally

```bash
agkit validate
```

Then try it in a Claude Code session, pointing at your local repo:

```text
/plugin marketplace add /absolute/path/to/my-marketplace
/plugin install tdd-coach@my-marketplace
```

## Next

* Publish it: [Publish to GitHub or GitLab](publish-to-github-or-gitlab.md)
* Reference someone else's plugin instead: [Add a remote plugin](add-a-remote-plugin.md)
* Ship a new version later: [Update a plugin & bump its version](update-a-plugin.md)
