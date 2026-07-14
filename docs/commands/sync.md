---
description: Reconcile the catalog and the docs with the plugins on disk.
---

# agkit sync

Reconcile `marketplace.json` and the generated docs with the plugins actually on
disk. The **source of truth** is each plugin's `.claude-plugin/plugin.json`.

```bash
agkit sync
```

`add` and `bump` run `sync` internally, so you call it directly mainly after
**hand-editing a plugin manifest** or moving files around.

## What it does

Scanning every directory under `pluginRoot` that has a
`.claude-plugin/plugin.json`, `sync`:

* **adds** catalog entries for plugin directories not yet listed (with a
  marketplace-root-relative `"./…"` source);
* **updates** any `version`, `description`, `author`, `keywords`, or `homepage`
  that drifted from the manifest into the catalog;
* **flags orphans** — catalog entries whose local source directory no longer
  exists (remote `github` / `url` / `git-subdir` sources are left untouched);
* **sorts** plugins by name and writes `marketplace.json`;
* **refreshes** any already-built Codex/Cursor registries;
* **regenerates** the plugin table in `README.md` and the plugin list in
  `AGENTS.md`, between the `<!-- agkit:plugins:start -->` /
  `<!-- agkit:plugins:end -->` markers.

{% hint style="info" %}
Drop the same `agkit:plugins` markers into any other Markdown file and `sync`
maintains the plugin list there too.
{% endhint %}

## Output & exit code

Prints the list of changes (or *"Catalog already in sync."*). If any **orphan**
is detected, it prints a `!` line telling you to remove the entry or restore the
plugin, and exits **non-zero**.

## Example

```bash
# after editing plugins/tdd-coach/.claude-plugin/plugin.json
agkit sync
# ~ updated description of "tdd-coach"
# ~ refreshed plugin list in README.md
```

## See also

* [`agkit add`](add.md) · [`agkit bump`](bump.md) · [`agkit validate`](validate.md)
* Reference: [marketplace.json](../reference/marketplace-json.md)
