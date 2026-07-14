---
description: Every agkit command at a glance.
---

# Command reference

Run `agkit <command> --help` for the built-in usage of any command. Each page
below documents arguments, options, behavior, and exit codes.

| Command | What it does |
| :--- | :--- |
| [`agkit init [dir]`](init.md) | Scaffold a git-first marketplace (or a standalone plugin with `--plugin`). |
| [`agkit add <spec> <name>`](add.md) | Register a plugin: reference a remote repo, or scaffold from a built-in / local template. |
| [`agkit build`](build.md) | Generate the Codex and Cursor registries from the catalog. |
| [`agkit sync`](sync.md) | Reconcile `marketplace.json` and the docs with the plugins on disk. |
| [`agkit bump [plugin] [level]`](bump.md) | Bump a plugin's version (conventional-commit aware) and sync everything. |
| [`agkit validate`](validate.md) | Validate the catalog (local checks + official `claude plugin validate`). |
| [`agkit list`](list.md) | List the available plugin templates. |

## Global options

| Option | Description |
| :--- | :--- |
| `-V, --version` | Print the installed agkit version. |
| `-h, --help` | Show help for agkit or a subcommand. |

## Conventions used on these pages

* **Plugin and marketplace names are kebab-case** — lowercase letters, digits,
  and hyphens (`^[a-z0-9]+(-[a-z0-9]+)*$`).
* Most commands **find the marketplace by walking up** from the current directory
  to the nearest `.claude-plugin/marketplace.json`, so you can run them from any
  subfolder.
* Commands that fail set a **non-zero exit code**, making them safe to gate CI
  on.
* Terminal output uses agkit's neon theme when the terminal supports color, and
  falls back to plain text under `NO_COLOR` or when piped.
