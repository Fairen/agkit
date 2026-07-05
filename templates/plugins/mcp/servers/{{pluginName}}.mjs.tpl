#!/usr/bin/env node
/**
 * {{pluginTitle}} — minimal MCP stdio server, zero dependencies.
 * Implements just enough JSON-RPC for Claude Code: initialize,
 * tools/list, tools/call. Replace the example tool with your own,
 * or migrate to @modelcontextprotocol/sdk when it grows.
 */
import { createInterface } from "node:readline";

const TOOLS = [
  {
    name: "{{pluginName}}_echo",
    description: "Example tool: echoes the provided text back. Replace me.",
    inputSchema: {
      type: "object",
      properties: { text: { type: "string", description: "Text to echo" } },
      required: ["text"],
    },
  },
];

async function callTool(name, args) {
  switch (name) {
    case "{{pluginName}}_echo":
      return { content: [{ type: "text", text: `Echo: ${args.text}` }] };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");

createInterface({ input: process.stdin }).on("line", async (line) => {
  if (!line.trim()) return;
  let req;
  try { req = JSON.parse(line); } catch { return; }
  const { id, method, params } = req;
  try {
    if (method === "initialize") {
      send({ jsonrpc: "2.0", id, result: {
        protocolVersion: params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "{{pluginName}}", version: "0.1.0" },
      }});
    } else if (method === "notifications/initialized") {
      // notification: no response
    } else if (method === "tools/list") {
      send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    } else if (method === "tools/call") {
      const result = await callTool(params.name, params.arguments ?? {});
      send({ jsonrpc: "2.0", id, result });
    } else if (id !== undefined) {
      send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (err) {
    if (id !== undefined) {
      send({ jsonrpc: "2.0", id, error: { code: -32000, message: String(err?.message ?? err) } });
    }
  }
});
