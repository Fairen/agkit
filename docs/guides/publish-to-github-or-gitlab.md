---
description: Push your marketplace to any forge and let consumers install from it.
---

# Publish to GitHub or GitLab

agkit is **forge-agnostic**: a marketplace is a normal git repository, so
"publishing" is just `git push`. This guide covers GitHub and GitLab; the same
steps work for Bitbucket, Gitea, or a self-hosted server.

## 1. Create the empty remote repository

Create a new, empty repository on your forge (no README, no license — your local
repo already has them).

* **GitHub:** `https://github.com/new`, or with the CLI:
  ```bash
  gh repo create ada/my-marketplace --public --source=. --remote=origin
  ```
  (`gh repo create` also wires the `origin` remote — skip step 2 if you use it.)
* **GitLab:** `https://gitlab.com/projects/new`, or with the CLI:
  ```bash
  glab repo create ada/my-marketplace --public
  ```

## 2. Wire the remote

If your tool did not add `origin` for you:

```bash
# GitHub
git remote add origin https://github.com/ada/my-marketplace.git
# GitLab
git remote add origin https://gitlab.com/ada/my-marketplace.git
```

{% hint style="info" %}
If you passed `--repo <url>` to `agkit init`, the generated README and
team-settings already use your real `owner/repo` (GitHub) or git URL (any other
forge). Otherwise regenerate them after setting the remote — see
[Keeping install docs correct](#keeping-install-docs-correct) below.
{% endhint %}

## 3. Validate, then build if needed

Always gate before you push:

```bash
agkit validate
```

If your marketplace targets **Codex** or **Cursor**, generate (or refresh) their
committed registries and commit them so consumers can install:

```bash
agkit build            # writes .agents/plugins/ (Codex) and/or .cursor-plugin/ (Cursor)
```

Native agents (Claude Code, GitHub Copilot) need no build step.

## 4. Commit and push

```bash
git add -A
git commit -m "feat: initial marketplace"
git push -u origin main
```

That is it — the marketplace is live. Every future change is another
`git add / commit / push`.

## 5. How consumers install

Point people at your repo. The exact command depends on their agent:

| Agent | Install |
| :--- | :--- |
| **Claude Code** | `/plugin marketplace add ada/my-marketplace` → `/plugin install <plugin>@my-marketplace` |
| **GitHub Copilot** | `copilot plugin marketplace add ada/my-marketplace` → `copilot plugin install <plugin>@my-marketplace` |
| **OpenAI Codex** | `codex marketplace add ada/my-marketplace` (installs from the built registry) |
| **Cursor** | add the marketplace in Cursor, then install the plugin by name |

On GitHub they can use the `owner/repo` shorthand; on any other forge, the full
git URL works everywhere.

## Team auto-install

`init` wrote `examples/team-settings.json` with an `extraKnownMarketplaces`
block. Drop it into each agent's settings so teammates get the marketplace
automatically when they trust the repository:

* **Claude Code** — `.claude/settings.json`
* **GitHub Copilot** — `.github/copilot/settings.json`

```jsonc
{
  "extraKnownMarketplaces": {
    "my-marketplace": {
      "source": { "source": "github", "repo": "ada/my-marketplace" }
    }
  }
}
```

## CI on the forge

The workflow `init` generated runs on every push:

* **GitHub** — `.github/workflows/validate.yml`
* **GitLab** — `.gitlab-ci.yml`

Both run `agkit validate`, and — when you have tier-2 targets —
`agkit build --check`, which fails the pipeline if a committed Codex/Cursor
registry is out of date. This guarantees the registries you push always match the
catalog.

## Keeping install docs correct

The install snippets in your **generated README** derive from the git remote.
If you set or change the remote after `init`, refresh the docs so they show the
real `owner/repo` instead of placeholders — re-run `agkit init` into a scratch
dir to see the intended output, or simply edit the README header. The
auto-maintained **plugin table** (between the `agkit:plugins` markers) always
stays correct via `agkit sync`.

## Next

* Ship an update to a plugin you own:
  [Update a plugin & bump its version](update-a-plugin.md)
