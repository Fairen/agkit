---
description: The canonical catalog file and the per-plugin manifest.
---

# marketplace.json

`.claude-plugin/marketplace.json` is the **canonical catalog** — the single
source of truth every command reads and writes. It follows the official
[Claude Code marketplace schema](https://json.schemastore.org/claude-code-marketplace.json).
Prefer letting agkit maintain it; edit by hand only for fields agkit does not
manage (then run [`agkit sync`](../commands/sync.md)).

## Shape

```jsonc
{
  "$schema": "https://json.schemastore.org/claude-code-marketplace.json",
  "name": "my-marketplace",
  "owner": {
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  },
  "metadata": {
    "description": "A curated collection of agent plugins.",
    "version": "1.0.0",
    "pluginRoot": "./plugins",
    "targets": ["claude-code", "copilot", "codex", "cursor"]
  },
  "plugins": [
    // local plugin — files committed under plugins/<name>/
    {
      "name": "tdd-coach",
      "source": "./plugins/tdd-coach",
      "description": "Coaches a strict red-green-refactor loop.",
      "version": "0.2.0"
    },
    // remote plugin — referenced, fetched by the agent at install time
    {
      "name": "deploy",
      "source": { "source": "github", "repo": "acme/deploy-plugin", "ref": "v2.0.0" },
      "description": "One-command deploys."
    }
  ]
}
```

## Top-level fields

| Field | Type | Notes |
| :--- | :--- | :--- |
| `$schema` | string | The marketplace schema URL. Set by `init`. |
| `name` | string | Marketplace name, kebab-case. Not a [reserved name](../guides/create-a-marketplace.md#reserved-names). |
| `owner` | object | `{ name, email?, url? }`. |
| `metadata` | object | See below. |
| `plugins` | array | Catalog entries. Sorted by name on every `sync`. |

### `metadata`

| Field | Type | Notes |
| :--- | :--- | :--- |
| `description` | string | Human description. |
| `version` | string | Marketplace version. `init` starts at `1.0.0`. |
| `pluginRoot` | string | Where local plugins live. Default `./plugins`. |
| `targets` | string[] | Target agent ids. Drives which registries `build` generates and the docs `init` writes. |

## Plugin entries

Each entry needs a `name` and a `source`; the rest are optional and, for local
plugins, mirrored from the plugin's manifest by `sync`.

| Field | Type | Notes |
| :--- | :--- | :--- |
| `name` | string | Plugin name, kebab-case, unique in the catalog. |
| `source` | string \| object | Where the plugin's files come from — see below. |
| `description` | string | One-line summary. |
| `version` | string | Semver. For local plugins, mirrored from the manifest; bumped by [`agkit bump`](../commands/bump.md). |
| `author` | object | `{ name, email?, url? }`. |
| `keywords` | string[] | Adds a Keywords column to the generated README table. |
| `homepage` | string | Linked from the plugin's name in the README table. |
| `category` | string | Optional grouping. |

### `source` forms

**Local (string)** — files committed in your repo, relative to the marketplace
root (must start with `./`):

```json
"source": "./plugins/tdd-coach"
```

**Remote (object)** — referenced, nothing copied; the agent fetches at install
time. Three forms, each optionally pinned with `ref` (branch/tag) and/or `sha`
(40-hex commit):

```jsonc
{ "source": "github", "repo": "acme/deploy-plugin", "ref": "v2.0.0" }
{ "source": "url",    "url": "https://gitlab.com/team/plugin.git" }
{ "source": "git-subdir", "url": "https://gitlab.com/team/marketplace.git", "path": "my-plugin" }
```

agkit writes these for you from an [`agkit add`](../commands/add.md) spec — see
[Template & source spec](template-spec.md).

## The per-plugin manifest

Each local plugin carries `plugins/<name>/.claude-plugin/plugin.json`. **It is the
source of truth** for that plugin — `sync` copies its fields up into the catalog,
and `bump` writes its `version`.

```jsonc
{
  "name": "tdd-coach",
  "version": "0.2.0",
  "description": "Coaches a strict red-green-refactor loop.",
  "author": { "name": "Ada Lovelace" },
  "keywords": ["testing", "tdd"],
  "homepage": "https://github.com/ada/my-marketplace/tree/main/plugins/tdd-coach"
}
```

## Files agkit generates (do not hand-edit)

| Path | Written by | For |
| :--- | :--- | :--- |
| `.agents/plugins/marketplace.json` | `build` | Codex registry |
| `plugins/<name>/.codex-plugin/plugin.json` | `build` | Codex per-plugin mirror |
| `.cursor-plugin/marketplace.json` | `build` | Cursor registry |
| `plugins/<name>/.cursor-plugin/plugin.json` | `build` | Cursor per-plugin mirror |
| README plugin table / `AGENTS.md` list | `sync` (and `add`/`bump`) | humans & agents |

Change the catalog or manifests and re-run the relevant command; the generated
files follow.
