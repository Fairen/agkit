export const MARKETPLACE_SCHEMA_URL =
  "https://json.schemastore.org/claude-code-marketplace.json";

export const MARKETPLACE_DIR = ".claude-plugin";
export const MARKETPLACE_FILE = "marketplace.json";
export const PLUGIN_MANIFEST_FILE = "plugin.json";
export const DEFAULT_PLUGIN_ROOT = "./plugins";

/** Names blocked by Claude Code for third-party marketplaces. */
export const RESERVED_MARKETPLACE_NAMES = [
  "claude-code-marketplace",
  "claude-code-plugins",
  "claude-plugins-official",
  "anthropic-marketplace",
  "anthropic-plugins",
];

export const KEBAB_CASE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const PLUGIN_TEMPLATES = ["skill", "command", "agent", "hook", "mcp"] as const;
export type PluginTemplate = (typeof PLUGIN_TEMPLATES)[number];

export const TEMPLATE_DESCRIPTIONS: Record<PluginTemplate, string> = {
  skill:
    "Plugin exposing an Agent Skill (SKILL.md): reference knowledge or a repeatable procedure Claude loads on demand.",
  command:
    "Plugin exposing a slash command (commands/<name>.md): a prompt shortcut invoked as /<plugin>:<name>.",
  agent:
    "Plugin exposing a subagent (agents/<name>.md): a named specialist with its own role and instructions.",
  hook:
    "Plugin exposing an event handler (hooks/hooks.json + script): deterministic automation on Claude Code lifecycle events.",
  mcp:
    "Plugin bundling an MCP server (.mcp.json + zero-dependency Node stdio server): external tools for Claude.",
};
