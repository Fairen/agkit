---
description: Requirements and the two ways to run agkit.
---

# Installation

## Requirements

* **Node.js ≥ 22** — check with `node --version`.
* **git** — required to `init` a repository, reference or vendor remote
  templates, and to tag releases with `agkit bump --tag`.
* *(optional)* the **Claude Code CLI** — when present, `agkit validate` also runs
  the official `claude plugin validate`.

## Run it

You do not have to install anything: run the latest version on demand with
`npx`.

```bash
npx agkit --help          # run without installing
```

Or install the `agkit` command globally so it is always on your `PATH`:

```bash
npm install -g agkit      # installs the `agkit` command
agkit --help
```

{% hint style="info" %}
The examples throughout these docs write `agkit …`. If you did not install
globally, prefix each command with `npx` (for example `npx agkit init`).
{% endhint %}

## Verify

```bash
agkit --version           # prints the installed version
agkit list                # lists the built-in plugin templates
```

If both print output, you are ready for the [Quick start](quickstart.md).

## Updating

```bash
npm install -g agkit@latest   # global install
# or nothing to do with npx — it always fetches the latest published version
```
