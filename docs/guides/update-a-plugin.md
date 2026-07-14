---
description: >-
  Change a local plugin, bump its version from your commits, keep the catalog in
  sync, and publish the release.
---

# Update a plugin & bump its version

This is the day-to-day loop for a plugin you own (a **local** plugin under
`plugins/<name>/`): edit it, cut a new version, let agkit propagate the change to
the catalog and docs, then push to your forge.

## 1. Make your changes

Edit the plugin's files under `plugins/<name>/`. If you change any manifest
field — description, keywords, homepage, author — edit
`plugins/<name>/.claude-plugin/plugin.json` (the **source of truth**), not the
catalog.

Commit with **conventional-commit** messages so agkit can pick the version bump
automatically:

```bash
git add plugins/tdd-coach
git commit -m "feat(tdd-coach): add a coverage gate step"
```

| Commit type | Resulting bump |
| :--- | :--- |
| `fix: …` (or anything not below) | **patch** — `0.1.0 → 0.1.1` |
| `feat: …` | **minor** — `0.1.0 → 0.2.0` |
| `feat!: …` / `BREAKING CHANGE:` | **major** — `0.1.0 → 1.0.0` |

agkit only counts commits that **touch the plugin's directory**, and only those
made **since its last release tag** (`<plugin>@x.y.z`).

## 2. Preview the bump

```bash
agkit bump tdd-coach --dry-run
```

This prints the current → next version, the level it chose, and the commits it
analysed — without writing anything. Use it to confirm the level before you
commit to a release.

## 3. Bump

```bash
agkit bump tdd-coach            # auto level from commits (default)
```

You can force a level instead of `auto`:

```bash
agkit bump tdd-coach minor      # or: major | patch
```

`agkit bump` does all of this in one shot:

1. writes the new `version` into `plugins/tdd-coach/.claude-plugin/plugin.json`;
2. prepends a dated entry to `plugins/tdd-coach/CHANGELOG.md`, built from your
   commit subjects;
3. runs `sync` internally, so the new version flows into
   `.claude-plugin/marketplace.json`, the README plugin table, the `AGENTS.md`
   list, and any already-built Codex/Cursor registries.

If `bump` reports *"nothing to bump"*, there were no qualifying commits since the
last tag — either commit your change first, or force a level explicitly.

## 4. Commit and tag the release

Let agkit commit and tag it for you with `--tag`:

```bash
agkit bump tdd-coach --tag
```

With `--tag` agkit stages everything, commits it as
`chore(release): tdd-coach@<version>`, and creates the tag `tdd-coach@<version>`.
That tag is the boundary the **next** `bump` measures from, so always tag your
releases.

Prefer to review the diff first? Bump without `--tag`, inspect, then commit and
tag by hand:

```bash
agkit bump tdd-coach
git add -A
git commit -m "chore(release): tdd-coach@0.2.0"
git tag tdd-coach@0.2.0
```

## 5. Push to your forge

Push the commit **and** the tag:

```bash
git push --follow-tags
```

(`--follow-tags` sends annotated/lightweight tags alongside the commit, so the
release tag lands on GitHub/GitLab too.) Your CI runs `agkit validate` and
`agkit build --check`; consumers pick up the new version the next time they
install or update the plugin.

## The whole loop, condensed

```bash
# edit plugins/tdd-coach/…, then:
git add plugins/tdd-coach
git commit -m "feat(tdd-coach): add a coverage gate step"

agkit bump tdd-coach --dry-run   # preview
agkit bump tdd-coach --tag       # bump + changelog + sync + commit + tag
git push --follow-tags           # publish
```

## Multiple plugins in one repo

Versions are **per plugin**: each plugin has its own manifest version, its own
`CHANGELOG.md`, and its own `<plugin>@x.y.z` tags. Bump each independently —
agkit scopes commit analysis to each plugin's directory, so unrelated plugins are
never dragged into a release.

## What about remote (referenced) plugins?

You cannot `bump` a referenced remote plugin — its version is owned by the
upstream repository, and agkit stores only a reference. To move to a newer
upstream version, re-pin the reference:

```bash
agkit add acme/deploy-plugin deploy --ref v2.1.0   # update the pin
```

See [Add a remote plugin](add-a-remote-plugin.md#pinning-to-a-branch-tag-or-commit).

## If you only hand-edited a manifest

No version change, just a description/keyword tweak in a plugin manifest? Skip
`bump` and reconcile directly:

```bash
agkit sync
git commit -am "docs(tdd-coach): clarify description"
git push
```

`sync` copies the manifest change into the catalog and refreshes the README /
`AGENTS.md` plugin lists.
