---
description: Generate the Codex and Cursor registries from the catalog.
---

# agkit build

Generate the committed registries that **tier-2** agents (OpenAI Codex, Cursor)
install from, derived from the canonical catalog. Native agents (Claude Code,
GitHub Copilot) need no build.

```bash
agkit build [options]
```

## Options

| Option | Description |
| :--- | :--- |
| `--target <list>` | Comma-separated tier-2 targets to build. Default: the tier-2 targets in `metadata.targets`. |
| `--check` | Verify generated artifacts are up to date; **non-zero exit on drift** (for CI). Writes nothing. |

Buildable targets: `codex`, `cursor`. Other ids are ignored with a warning.

## What it generates

**Codex** (`codex`):

```
.agents/plugins/marketplace.json                 # registry: object sources { source:"local", path }, policy, category
plugins/<name>/.codex-plugin/plugin.json         # per-plugin manifest mirror
```

**Cursor** (`cursor`):

```
.cursor-plugin/marketplace.json                  # registry: string sources, same shape as the Claude catalog
plugins/<name>/.cursor-plugin/plugin.json        # per-plugin manifest mirror
```

Both derive entirely from `.claude-plugin/marketplace.json` and each plugin's
`.claude-plugin/plugin.json`. **Commit the generated files** so consumers can
install.

## Behavior

* With no `--target`, builds the tier-2 targets recorded in `metadata.targets`.
  If there are none, it prints a hint and does nothing.
* Generation is **opt-in**: run `agkit build` once to enable a target. After the
  first build, [`agkit add`](add.md), [`agkit bump`](bump.md), and
  [`agkit sync`](sync.md) refresh the already-built registries automatically, so
  they never drift.
* `--check` compares the on-disk files to what would be generated and reports
  `missing:` / `stale:` paths, exiting non-zero if any differ — the generated CI
  workflows run this.

## Examples

```bash
agkit build                          # build the targets in metadata.targets
agkit build --target codex,cursor    # build specific targets
agkit build --check                  # CI gate: fail if a committed registry is stale
```

## See also

* [Target agents](../reference/target-agents.md) ·
  [`agkit sync`](sync.md) · [`agkit validate`](validate.md)
