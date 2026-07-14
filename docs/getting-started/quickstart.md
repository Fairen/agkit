---
description: Create and distribute your first marketplace in four steps.
---

# Quick start

This is the whole loop, top to bottom. Each step links to the guide that covers
it in depth.

```bash
npx agkit init my-marketplace   # 1. scaffold a push-ready repository
cd my-marketplace
agkit add skill tdd-coach       # 2. add a plugin from a built-in template
agkit validate                  # 3. check the catalog is valid
git remote add origin <your-git-url>
git add -A && git commit -m "feat: initial marketplace"
git push -u origin main         # 4. distribute via git
```

Once pushed, anyone can install your plugins straight from the repo.

## What just happened

1. **`agkit init my-marketplace`** created a git repository containing the
   canonical catalog (`.claude-plugin/marketplace.json`), a `plugins/` folder, a
   generated `README.md` and `AGENTS.md`, a CI workflow, and a team-settings
   example. It targets **Claude Code** and **GitHub Copilot** by default.
   → [Create a marketplace](../guides/create-a-marketplace.md)
2. **`agkit add skill tdd-coach`** scaffolded a plugin from the built-in `skill`
   template into `plugins/tdd-coach/` and registered it in the catalog.
   → [Add a local plugin](../guides/add-a-local-plugin.md)
3. **`agkit validate`** checked the catalog (and ran the official
   `claude plugin validate` if the Claude Code CLI is installed).
   → [`agkit validate`](../commands/validate.md)
4. **`git push`** published it. Distribution works from any forge.
   → [Publish to GitHub or GitLab](../guides/publish-to-github-or-gitlab.md)

## Install it as a consumer

In a Claude Code session, from the repo you just pushed:

```text
/plugin marketplace add <owner/repo or git URL>
/plugin install tdd-coach@my-marketplace
```

## Next: the four core tasks

The guides walk each of these end-to-end, in the order you would actually do
them:

1. [Create a marketplace](../guides/create-a-marketplace.md)
2. [Add a local plugin](../guides/add-a-local-plugin.md) (scaffold your own)
3. [Add a remote plugin](../guides/add-a-remote-plugin.md) (reference someone
   else's, no copy)
4. [Publish to GitHub or GitLab](../guides/publish-to-github-or-gitlab.md)
5. [Update a plugin & bump its version](../guides/update-a-plugin.md)
