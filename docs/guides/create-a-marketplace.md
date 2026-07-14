---
description: Scaffold a push-ready marketplace repository with agkit init.
---

# Create a marketplace

A marketplace is just a git repository with a canonical catalog. `agkit init`
builds the whole thing for you.

## Interactive (recommended the first time)

```bash
agkit init my-marketplace
cd my-marketplace
```

agkit asks for a name, owner, description, git remote, CI system, and target
agents, then offers to add a starter plugin. Press <kbd>Enter</kbd> to accept the
sensible defaults. If you omit the directory (`agkit init`), it scaffolds into
the current folder.

## Non-interactive (scripts / CI)

Pass everything up front and add `-y` to accept defaults for anything you did not
specify:

```bash
agkit init my-marketplace \
  --name my-marketplace \
  --owner "Ada Lovelace" \
  --email ada@example.com \
  --description "A curated collection of agent plugins." \
  --repo https://github.com/ada/my-marketplace.git \
  --ci github \
  --agents claude-code,copilot \
  -y
```

See every flag on the [`agkit init`](../commands/init.md) page.

## What gets created

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # canonical catalog ($schema, owner, metadata, plugins: [])
├── plugins/
│   └── .gitkeep                   # your local plugins land here
├── AGENTS.md                      # repo context for agents (plugin list auto-maintained)
├── README.md                      # human docs (plugin table auto-maintained)
├── examples/
│   └── team-settings.json         # extraKnownMarketplaces block for teammates
├── .github/workflows/validate.yml # or .gitlab-ci.yml with --ci gitlab
└── .gitignore
```

`git init` runs automatically (unless the folder is already inside a repo). The
catalog starts with `metadata.version: "1.0.0"`, `pluginRoot: "./plugins"`, and
the `targets` you selected.

## Choosing target agents

The `--agents` flag records who you serve and adapts the scaffold. Default:
`claude-code,copilot`.

```bash
agkit init my-marketplace --agents claude-code,copilot,codex,cursor
```

* **claude-code, copilot** are *native* (tier 1) — nothing to generate.
* **codex, cursor** are *generated* (tier 2) — they need `agkit build` once
  (see [Add a local plugin](add-a-local-plugin.md#tier-2-agents-run-agkit-build)).

You can change targets later by editing `metadata.targets` in the catalog (then
run `agkit sync` / `agkit build`).

## Choosing CI

* `--ci github` → `.github/workflows/validate.yml` (GitHub Actions)
* `--ci gitlab` → `.gitlab-ci.yml` (GitLab CI)
* `--ci none` → no CI file

Both workflows run `agkit validate` and, when you have tier-2 targets,
`agkit build --check` to fail the pipeline if a generated registry drifts.

## Reserved names

Claude Code blocks a handful of names for third-party marketplaces. `init` and
`validate` reject them: `claude-code-marketplace`, `claude-code-plugins`,
`claude-plugins-official`, `anthropic-marketplace`, `anthropic-plugins`.

## Bonus: a standalone plugin (no marketplace)

If you only want to build a **single plugin** to publish on its own — and let
other marketplaces reference it — use `--plugin` instead:

```bash
agkit init --plugin skill ./my-skill
```

This scaffolds just `.claude-plugin/plugin.json` + the template content and makes
the folder its own git repo — no marketplace around it. Push it, then reference
it from any catalog (see [Add a remote plugin](add-a-remote-plugin.md)).

## Next

Your repository is ready but empty. Add your first plugin:

* [Add a local plugin](add-a-local-plugin.md) — scaffold your own from a template
* [Add a remote plugin](add-a-remote-plugin.md) — reference someone else's repo
