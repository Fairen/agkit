---
description: Register a plugin in the catalog — reference a remote repo or scaffold a template.
---

# agkit add

Register a plugin in the marketplace catalog and refresh the README table and
`AGENTS.md`. Run it from anywhere inside the marketplace.

```bash
agkit add [template|spec] [name] [options]
```

If you omit the spec and/or the name, agkit prompts for them interactively.

## Arguments

| Argument | Description |
| :--- | :--- |
| `[template\|spec]` | A built-in template name, a local path, or a remote git source. See [resolution](#how-the-spec-is-resolved). |
| `[name]` | Plugin name, kebab-case. |

## Options

| Option | Description |
| :--- | :--- |
| `-d, --description <text>` | One-line plugin description (skips the prompt). |
| `--vendor` | Clone the remote source and scaffold from its files, instead of referencing it. |
| `--ref <ref>` | Branch or tag to pin a **referenced** remote source to. |
| `--sha <sha>` | Commit hash (full 40 hex) to pin a **referenced** remote source to. |

## How the spec is resolved

agkit decides what to do from the shape of the spec:

| Spec | Mode | Result |
| :--- | :--- | :--- |
| `skill` / `command` / `agent` / `hook` / `mcp` | scaffold | built-in template → `plugins/<name>/`, `source: "./plugins/<name>"`, `version: "0.1.0"` |
| `./dir`, `/abs/dir`, `path:<dir>` | scaffold | local template directory → `plugins/<name>/` |
| `owner/repo`, `gh:…`, `gl:…`, git URL, `…//subdir` | **reference** (default) | object `source` (`github` / `url` / `git-subdir`); nothing cloned |
| any remote spec **+ `--vendor`** | vendor | clone + scaffold into `plugins/<name>/`, `source: "./plugins/<name>"` |

**A remote git source is referenced by default** — no clone, no files copied. The
agent fetches it at install time. Add `--vendor` to copy the upstream files into
your repo instead.

> `--vendor` needs an explicit `gh:` / `gl:` shorthand or a git URL. A **bare**
> `owner/repo` works only for *referencing*.

See the full grammar on [Template & source spec](../reference/template-spec.md).

## Behavior

* Fails if a plugin with the same name already exists, or if `name` is not
  kebab-case.
* **Reference mode** writes an object `source` (optionally pinned with
  `--ref` / `--sha`) and runs an internal `sync`. Nothing is cloned.
* **Scaffold / vendor mode** renders the template (`.tpl` files get
  `{{pluginName}}`, `{{pluginTitle}}`, `{{description}}`, `{{authorName}}` in
  contents and names; executable bits preserved), forces the manifest `name` to
  match, registers a relative `source`, and runs an internal `sync`.
* After `add`, if you target Codex/Cursor, run [`agkit build`](build.md) once so
  the new plugin is installable there (subsequent adds refresh it automatically).

## Examples

```bash
# Scaffold from a built-in template
agkit add skill tdd-coach -d "Coaches a strict red-green-refactor loop."

# Scaffold from a local template directory
agkit add ./shared-templates/hook-guard no-secrets

# Reference a remote plugin (no clone) — the repo IS the plugin
agkit add acme/deploy-plugin deploy
agkit add https://gitlab.com/team/plugin.git gl-tools

# Reference a plugin that is a subdirectory of a bigger repo
agkit add "https://gitlab.com/team/marketplace.git//my-plugin" my-plugin

# Pin a reference to a tag / commit
agkit add acme/deploy-plugin deploy --ref v2.0.0
agkit add acme/deploy-plugin deploy --sha a1b2c3…   # full 40-hex

# Vendor a remote template into the marketplace
agkit add gh:my-org/plugin-templates/kata-fr gilded-rose --vendor
```

## See also

* Guides: [Add a local plugin](../guides/add-a-local-plugin.md) ·
  [Add a remote plugin](../guides/add-a-remote-plugin.md)
* [`agkit sync`](sync.md) · [`agkit build`](build.md)
