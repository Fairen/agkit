---
description: Scaffold a new plugin marketplace, or a standalone plugin.
---

# agkit init

Scaffold a new, push-ready plugin marketplace (git-first) — or, with `--plugin`,
a standalone plugin with no marketplace around it.

```bash
agkit init [dir] [options]
```

## Arguments

| Argument | Description |
| :--- | :--- |
| `[dir]` | Target directory. Defaults to the current directory. Created if missing. |

## Options

| Option | Description |
| :--- | :--- |
| `-n, --name <name>` | Marketplace (or plugin) name, kebab-case. Defaults to the directory name. |
| `-o, --owner <owner>` | Owner / author name. |
| `-e, --email <email>` | Owner email. |
| `-d, --description <text>` | Marketplace (or plugin) description. |
| `-r, --repo <url>` | Git remote URL (any forge). Used to fill in install docs and team settings. |
| `--ci <ci>` | CI workflow: `github` \| `gitlab` \| `none`. Default `github`. |
| `--agents <list>` | Comma-separated target agents. Default `claude-code,copilot`. |
| `--plugin [template]` | Scaffold a **standalone plugin** in `[dir]` instead of a marketplace. |
| `-y, --yes` | Non-interactive: accept defaults for anything not passed. |

Known agent ids for `--agents`: `claude-code`, `copilot`, `codex`, `cursor`,
`gemini`, `opencode`, `kiro`. Unknown ids are ignored with a warning.

## What it scaffolds (marketplace mode)

```
<dir>/
├── .claude-plugin/marketplace.json   # $schema, name, owner, metadata{version:"1.0.0", pluginRoot:"./plugins", targets}, plugins:[]
├── plugins/.gitkeep
├── README.md                         # install + team sections composed from --agents
├── AGENTS.md                         # repo context for agents
├── examples/team-settings.json       # extraKnownMarketplaces block
├── .github/workflows/validate.yml    # or .gitlab-ci.yml (--ci gitlab); none with --ci none
└── .gitignore
```

* Runs `git init` automatically (unless already inside a repo).
* **Interactive mode** additionally offers to add a starter plugin (runs
  [`agkit add`](add.md) for you).
* Rejects the [reserved marketplace names](../guides/create-a-marketplace.md#reserved-names).

## Standalone plugin mode (`--plugin`)

```bash
agkit init --plugin skill ./my-skill
agkit init --plugin ./my-template ./my-plugin
```

Scaffolds just `.claude-plugin/plugin.json` + the template content and makes the
folder its own git repo (unless it is already inside one) — **no marketplace**.
The template value accepts the same specs as [`agkit add`](add.md): a built-in
name (`skill`, `command`, `agent`, `hook`, `mcp`), a local path, or a remote git
spec. If omitted, agkit prompts (or defaults to `skill` with `-y`). Push the
result and reference it from any catalog — see
[Add a remote plugin](../guides/add-a-remote-plugin.md).

## Examples

```bash
# Interactive, into a new folder
agkit init my-marketplace

# Fully non-interactive, GitLab CI, four agents
agkit init my-marketplace -y \
  --owner "Ada" --repo https://gitlab.com/ada/my-marketplace.git \
  --ci gitlab --agents claude-code,copilot,codex,cursor

# A standalone skill plugin, no marketplace
agkit init --plugin skill ./tdd-coach
```

## See also

* Guide: [Create a marketplace](../guides/create-a-marketplace.md)
* [`agkit add`](add.md) · [Target agents](../reference/target-agents.md)
