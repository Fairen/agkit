# {{marketplaceName}}

{{description}}

A [plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces): a Git repository whose `.claude-plugin/marketplace.json` catalog is consumed by AI coding agents. Works from any Git host.

## Install

{{installSections}}

## Team setup (automatic installation)

{{teamSections}}

## Available plugins

<!-- agkit:plugins:start -->
_No plugins yet. Add one with `agkit add <template> <name>`._
<!-- agkit:plugins:end -->

## Development

This marketplace is managed with [agkit](https://www.npmjs.com/package/agkit):

```bash
agkit add skill my-skill      # scaffold a new plugin from a template
agkit sync                    # reconcile marketplace.json with plugins/
agkit validate                # check the catalog before pushing
agkit bump my-skill --tag     # version a plugin from conventional commits
```

The catalog lives in `.claude-plugin/marketplace.json`; each plugin lives in `plugins/<name>/` with its own `.claude-plugin/plugin.json` manifest. Target agents are recorded in `metadata.targets`.
