---
description: Validate the catalog — local checks plus the official validator.
---

# agkit validate

Validate the marketplace catalog. Runs agkit's local checks and, when the Claude
Code CLI is installed, delegates to the official `claude plugin validate`.

```bash
agkit validate [options]
```

## Options

| Option | Description |
| :--- | :--- |
| `--strict` | Treat warnings as errors in the official validator (forwarded to `claude plugin validate --strict`). |

## What it checks

Local checks (always run):

* `marketplace.json` is present and valid JSON;
* marketplace and plugin **names are kebab-case**;
* the name is not one of the [reserved marketplace names](../guides/create-a-marketplace.md#reserved-names);
* every plugin **source resolves** (local sources point at an existing directory;
  remote sources are well-formed);
* each local plugin has a `.claude-plugin/plugin.json` **manifest**;
* the catalog **version matches** the manifest (no drift).

Official validation (when `claude` is on the `PATH`):

* runs `claude plugin validate` and folds its findings in; `--strict` is
  forwarded.

## Output & exit code

Prints each warning and error. On any error it prints a summary and exits
**non-zero** — so `agkit validate` is a drop-in CI gate. On success it confirms
the catalog is valid, noting `[local checks only]` if the official validator was
not available.

## Examples

```bash
agkit validate            # local checks + claude plugin validate if installed
agkit validate --strict   # warnings become errors in the official validator
```

## See also

* [`agkit sync`](sync.md) · [`agkit build --check`](build.md)
* Guide: [Publish to GitHub or GitLab](../guides/publish-to-github-or-gitlab.md#3-validate-then-build-if-needed)
