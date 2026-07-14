---
description: >-
  Reference a plugin that lives in its own repository — nothing is cloned, the
  agent fetches it at install time.
---

# Add a remote plugin

A **remote plugin** stays in its own repository. Your catalog only stores a
**reference** — an object `source` the agent resolves at install time. Nothing is
cloned, no files are added to your marketplace, and the upstream owner keeps
control of its version and manifest.

This is the **default** behavior for any remote git spec: if the thing you pass
to `agkit add` is a git repo (not a built-in template name and not a local path),
agkit references it. You only clone it if you explicitly ask with `--vendor`
(covered in [Add a local plugin](add-a-local-plugin.md#seed-a-local-plugin-from-a-remote-template-vendoring)).

Run these from inside your marketplace.

## The repo *is* the plugin

When a repository's root contains `.claude-plugin/plugin.json`, point straight at
it.

```bash
# GitHub — bare owner/repo shorthand:
agkit add acme/deploy-plugin deploy
#   → source: { "source": "github", "repo": "acme/deploy-plugin" }

# Any other forge — a full git URL:
agkit add https://gitlab.com/team/plugin.git gl-tools
#   → source: { "source": "url", "url": "https://gitlab.com/team/plugin.git" }
```

`gh:` / `gl:` shorthands work too (`gh:acme/deploy-plugin`,
`gl:team/plugin`). Nothing is written under `plugins/` — only the catalog entry:

```jsonc
// .claude-plugin/marketplace.json  (excerpt)
{
  "plugins": [
    {
      "name": "deploy",
      "source": { "source": "github", "repo": "acme/deploy-plugin" },
      "description": "…"
    }
  ]
}
```

## The plugin is a *subdirectory* of a bigger repo

When the plugin lives in a folder inside a monorepo or someone else's
marketplace, use the `//subdir` separator. The folder must contain
`.claude-plugin/plugin.json`.

```bash
agkit add "https://gitlab.com/team/marketplace.git//my-plugin" my-plugin
#   → source: { "source": "git-subdir",
#               "url": "https://gitlab.com/team/marketplace.git",
#               "path": "my-plugin" }
```

{% hint style="warning" %}
`git-subdir` points **directly at one plugin folder** — it does *not* read that
repo's own `marketplace.json`. Use it to **re-catalog a single plugin** from
someone else's marketplace into yours. If you just want to *use* their plugins,
add their marketplace directly instead:
`/plugin marketplace add team/marketplace`, then
`/plugin install my-plugin@their-marketplace`.
{% endhint %}

## Pinning to a branch, tag, or commit

By default the agent fetches the source's default branch at install time. Pin it
for reproducibility:

```bash
# branch or tag
agkit add acme/deploy-plugin deploy --ref v2.0.0
agkit add acme/deploy-plugin#v2.0.0 deploy        # equivalent, inline

# exact commit (full 40-char SHA)
agkit add acme/deploy-plugin deploy --sha a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

`--ref` and `--sha` are stored on the `source` object (`ref` / `sha`) and can be
combined. A `#ref` in the spec is a fallback for `--ref`.

## Spec grammar in one place

| You type | Resolves to |
| :--- | :--- |
| `owner/repo` | `{ source: "github", repo }` |
| `gh:owner/repo` | `{ source: "github", repo }` |
| `gl:owner/repo` | `{ source: "url", url: gitlab URL }` |
| `https://host/team/plugin.git` | `{ source: "url", url }` |
| `<git-url>//subdir` or `gh:owner/repo/subdir` | `{ source: "git-subdir", url, path }` |

Full details: [Template & source spec](../reference/template-spec.md).

## After referencing

A reference does not add local files, so there is nothing to `bump` (the upstream
owns the version). Just validate and publish:

```bash
agkit validate
git add -A && git commit -m "feat: reference acme/deploy-plugin"
git push
```

Consumers install exactly as they would any plugin — Claude Code fetches the
referenced repo at install time:

```text
/plugin marketplace add <your-marketplace>
/plugin install deploy@my-marketplace
```

## Reference vs. vendor — which do I want?

| | **Reference** (default) | **Vendor** (`--vendor`) |
| :--- | :--- | :--- |
| Files copied in? | ❌ no | ✅ yes, into `plugins/<name>/` |
| `source` | object (`github`/`url`/`git-subdir`) | relative `"./plugins/<name>"` |
| Who owns updates | upstream repo | you (`agkit bump`) |
| Use when | you want to catalog a plugin as-is | you want to fork/seed and evolve it yourself |

## Next

* Publish your marketplace: [Publish to GitHub or GitLab](publish-to-github-or-gitlab.md)
* Copy a remote template in instead: [Add a local plugin](add-a-local-plugin.md#seed-a-local-plugin-from-a-remote-template-vendoring)
