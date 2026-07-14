---
description: >-
  Scaffold and manage plugin marketplaces for Claude Code, GitHub Copilot,
  OpenAI Codex, and Cursor — distributed through any Git host.
---

# Introduction

**agkit** — *AGent marketplace KIT* — is a command-line tool that scaffolds and
maintains **plugin marketplaces** for AI coding agents. You keep **one canonical
catalog**, agkit derives everything else from it, and you distribute the whole
thing with a plain `git push` to **any** forge — GitHub, GitLab, Bitbucket,
Gitea, or a self-hosted server.

Think of it as **`ng` for Angular, but for agent plugin marketplaces**: `init`
gives you a push-ready repository, and `add` / `build` / `sync` / `bump` /
`validate` cover the whole life of the project afterwards.

> agkit is an unofficial community tool, not affiliated with Anthropic, GitHub,
> OpenAI, or Cursor.

## What it does

* 🧩 **Multi-agent** — one repository serves Claude Code, GitHub Copilot, OpenAI
  Codex, and Cursor.
* 🌐 **Forge-agnostic** — distribute via any Git host with a plain `git push`.
* 📁 **One source of truth** — a single `.claude-plugin/marketplace.json`;
  generated registries derive from it and never drift.
* 🔁 **Full lifecycle** — `init`, `add`, `build`, `sync`, `bump`, `validate`,
  `list`.
* 🔗 **Reference, vendor, or scaffold** — catalog a remote plugin *by reference*
  (no clone), *vendor* a template into your repo, or *scaffold* from a built-in
  template.
* ✅ **CI-ready** — generated GitHub Actions / GitLab CI with `validate` +
  `build --check` gates.

## How the pieces fit

```
agkit init · add · bump · sync
        │
        ▼
.claude-plugin/marketplace.json   ← the canonical catalog
      + plugins/<name>/
        │
        ├─ read as-is ─────────────►  Claude Code · GitHub Copilot   (native)
        │
        └─ agkit build ────────────►  OpenAI Codex · Cursor          (generated registry)
                                          │
                                          ▼
                                    git push → any forge → consumers install
```

* **Native agents** (Claude Code, GitHub Copilot) read the catalog directly —
  push the repo and it installs.
* **Generated-registry agents** (Codex, Cursor) install from their own committed
  registry, which `agkit build` derives from the same catalog.

## Where to go next

| I want to… | Start here |
| :--- | :--- |
| Install the CLI | [Installation](getting-started/installation.md) |
| Ship my first marketplace in four steps | [Quick start](getting-started/quickstart.md) |
| Understand the catalog, plugins, and agent tiers | [Core concepts](getting-started/concepts.md) |
| Follow a task end-to-end | [Guides](guides/create-a-marketplace.md) |
| Look up a command's flags | [Command reference](commands/README.md) |

Every guide is a runnable, copy-paste walkthrough. Start with
**[Create a marketplace](guides/create-a-marketplace.md)** and follow the guides
in order for the complete "create → add plugins → publish → update" loop.
