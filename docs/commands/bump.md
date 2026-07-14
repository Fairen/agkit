---
description: Version a local plugin from its commits and sync everything downstream.
---

# agkit bump

Bump a **local** plugin's version — automatically from conventional commits, or
to an explicit level — then propagate the change to the catalog, docs, and any
built registries.

```bash
agkit bump [plugin] [level] [options]
```

## Arguments

| Argument | Description |
| :--- | :--- |
| `[plugin]` | Plugin name. Prompted if omitted. |
| `[level]` | `major` \| `minor` \| `patch` \| `auto`. Default `auto`. |

## Options

| Option | Description |
| :--- | :--- |
| `-t, --tag` | Commit the bump and create the release tag `<plugin>@<version>`. |
| `--dry-run` | Show what would change without writing anything. |

## How `auto` chooses a level

agkit inspects the commits that **touch the plugin's directory**, made **since
its last `<plugin>@x.y.z` tag**, and applies conventional-commit rules:

| Commits contain | Level | Example |
| :--- | :--- | :--- |
| a breaking change (`feat!:`, `BREAKING CHANGE:`) | **major** | `0.2.1 → 1.0.0` |
| a `feat:` (no breaking) | **minor** | `0.2.1 → 0.3.0` |
| only other types (`fix:`, `chore:`, …) | **patch** | `0.2.1 → 0.2.2` |

If there are no qualifying commits, `auto` reports *"nothing to bump"*. The
current version defaults to `0.1.0` when the manifest has none.

## What it writes

1. the new `version` in `plugins/<plugin>/.claude-plugin/plugin.json`;
2. a dated, newest-on-top entry in `plugins/<plugin>/CHANGELOG.md`, built from the
   analysed commit subjects;
3. an internal `sync`, propagating the version to `marketplace.json`, the README
   plugin table, the `AGENTS.md` list, and any built Codex/Cursor registries.

With **`--tag`** it then stages all changes, commits them as
`chore(release): <plugin>@<version>`, and creates the tag `<plugin>@<version>`
(push with `git push --follow-tags`). That tag is the boundary the next `auto`
bump measures from.

## Examples

```bash
agkit bump tdd-coach --dry-run     # preview the auto level and version
agkit bump tdd-coach               # bump + changelog + sync
agkit bump tdd-coach minor         # force a minor bump
agkit bump tdd-coach --tag         # bump, then commit + tag the release
```

## Notes

* Versions are **per plugin** — separate manifest versions, changelogs, and tags.
* You **cannot** bump a referenced remote plugin; its version is owned upstream.
  Re-pin it instead: `agkit add <spec> <name> --ref <tag>`.

## See also

* Guide: [Update a plugin & bump its version](../guides/update-a-plugin.md)
* [`agkit sync`](sync.md)
