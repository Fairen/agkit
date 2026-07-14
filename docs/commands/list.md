---
description: List the available plugin templates.
---

# agkit list

List the built-in plugin templates you can scaffold from with
[`agkit add`](add.md) or [`agkit init --plugin`](init.md).

```bash
agkit list
```

## Output

The five built-in templates and what each exposes:

| Template | Exposes |
| :--- | :--- |
| `skill` | an Agent Skill (`SKILL.md`) loaded on demand |
| `command` | a slash command (`commands/<name>.md`), invoked as `/<plugin>:<name>` |
| `agent` | a subagent (`agents/<name>.md`) with its own role |
| `hook` | an event handler (`hooks/hooks.json` + script) |
| `mcp` | a bundled MCP server (`.mcp.json` + a zero-dependency Node stdio server) |

`list` also reminds you that remote and local templates work too:

```bash
agkit add gh:owner/repo/dir my-plugin
agkit add gl:owner/repo#v2 my-plugin
agkit add https://git.company.io/team/templates.git//skill-fr my-plugin
agkit add ./local-template my-plugin
```

## See also

* [`agkit add`](add.md) · [Template & source spec](../reference/template-spec.md)
