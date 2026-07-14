---
description: The one grammar shared by add, init --plugin, and remote references.
---

# Template & source spec

A single, forge-agnostic grammar (degit-inspired) describes every "where does
this come from" argument in agkit — the `[template|spec]` of
[`agkit add`](../commands/add.md), the template of
[`agkit init --plugin`](../commands/init.md), and remote references.

## The grammar

```
skill | command | agent | hook | mcp          built-in template
./dir | /abs/dir | path:<dir>                  local directory
owner/repo                                     GitHub shorthand (reference only)
gh:owner/repo[/sub/dir][#ref]                  github.com shorthand
gl:owner/repo[/sub/dir][#ref]                  gitlab.com shorthand
<git-url>[//sub/dir][#ref]                     any forge (https / ssh / git / file, scp-style)
```

* `//sub/dir` — the plugin (or template) lives in a **subdirectory** of the repo.
  Note the **double slash** separating the clone URL from the subpath.
* `#ref` — a **branch or tag** to check out / pin.

## How a spec is interpreted

The same string means different things depending on the command and `--vendor`:

| Spec | `agkit add` (default) | `agkit add --vendor` | `agkit add`/`init --plugin` local scaffold |
| :--- | :--- | :--- | :--- |
| `skill` (built-in) | scaffold locally | — | scaffold locally |
| `./dir`, `path:dir` | scaffold locally | — | scaffold locally |
| `owner/repo` | **reference** (github) | ✗ (needs `gh:`/URL) | — |
| `gh:owner/repo` | **reference** (github) | clone + scaffold | — |
| `<git-url>` | **reference** (url) | clone + scaffold | — |
| `<git-url>//sub` | **reference** (git-subdir) | clone + scaffold from `sub` | — |

**Reference** = an object `source` written to the catalog, nothing cloned.
**Scaffold / vendor** = files rendered and copied into `plugins/<name>/`.

## Reference resolution

`agkit add <spec> <name>` (no `--vendor`) maps a remote spec to a schema object
`source`:

| Spec | `source` |
| :--- | :--- |
| `owner/repo`, `gh:owner/repo` | `{ "source": "github", "repo": "owner/repo" }` |
| `gl:owner/repo` | `{ "source": "url", "url": "https://gitlab.com/owner/repo.git" }` |
| `https://host/team/plugin.git` | `{ "source": "url", "url": "…" }` |
| `<git-url>//sub`, `gh:owner/repo/sub` | `{ "source": "git-subdir", "url": "…", "path": "sub" }` |

Pin with `--ref <branch|tag>` (or `#ref` in the spec) and `--sha <40-hex>`; both
land on the `source` object.

## Template resolution (scaffold / vendor)

For built-in, local, or `--vendor` remote templates, agkit needs a **template
directory**: any folder containing `.claude-plugin/plugin.json` **or**
`.claude-plugin/plugin.json.tpl`. Remote templates are shallow-cloned (honoring
`#ref`), the subdir is selected, and the clone's `.git` is discarded.

### `.tpl` rendering

Files whose name ends in `.tpl` are rendered and the suffix dropped. Placeholders
are substituted in **file contents and in file/directory names**:

| Placeholder | Value |
| :--- | :--- |
| `{{pluginName}}` | the kebab-case name you passed |
| `{{pluginTitle}}` | Title Case of the name |
| `{{description}}` | the `--description`, or a default |
| `{{authorName}}` | the marketplace owner's name |

Executable bits are preserved. A plain (non-`.tpl`) `plugin.json` in the template
is adopted with its `name` rewritten to match.

## Examples

```bash
# built-in template
agkit add skill tdd-coach

# local template directory
agkit add ./templates/hook-guard no-secrets
agkit add path:/abs/templates/kata my-kata

# reference (no clone)
agkit add acme/deploy deploy
agkit add "https://gitlab.com/team/marketplace.git//my-plugin" my-plugin
agkit add acme/deploy#v2.0.0 deploy

# vendor a remote template (clone + scaffold)
agkit add gh:my-org/templates/kata-fr gilded-rose --vendor
agkit add "https://gitlab.company.io/craft/templates//skill-ddd#v2" tactical-ddd --vendor
```

## See also

* [`agkit add`](../commands/add.md) · [marketplace.json](marketplace-json.md)
* Guides: [Add a local plugin](../guides/add-a-local-plugin.md) ·
  [Add a remote plugin](../guides/add-a-remote-plugin.md)
