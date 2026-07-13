import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { type PluginEntry, writeMarketplace } from "../lib/marketplace.js";
import { validateCommand } from "./validate.js";

// Simulate the Claude CLI being absent so validation exercises the local checks
// only (and stays hermetic regardless of what's installed on the test machine).
vi.mock("node:child_process", () => ({
  execFileSync: () => {
    const err = new Error("not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    throw err;
  },
}));

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});
afterEach(() => {
  process.exitCode = 0;
});

function newMarketplace(plugins: PluginEntry[] = []): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "agkit-validate-"));
  tmpDirs.push(root);
  writeMarketplace(root, {
    name: "test-market",
    owner: { name: "Tester" },
    metadata: { pluginRoot: "./plugins" },
    plugins,
  });
  fs.mkdirSync(path.join(root, "plugins"), { recursive: true });
  return root;
}

describe("validateCommand", () => {
  it("passes a well-formed catalog", async () => {
    const root = newMarketplace();
    await validateCommand(root);
    expect(process.exitCode).not.toBe(1);
  });

  it("fails on duplicate plugin names", async () => {
    const root = newMarketplace([
      { name: "dup", source: { source: "github", repo: "a/b" } },
      { name: "dup", source: { source: "github", repo: "c/d" } },
    ]);
    await validateCommand(root);
    expect(process.exitCode).toBe(1);
  });

  it("fails when a plugin entry has no source", async () => {
    const root = newMarketplace([{ name: "nosrc" } as PluginEntry]);
    await validateCommand(root);
    expect(process.exitCode).toBe(1);
  });

  it("fails when a relative source points to a missing directory", async () => {
    const root = newMarketplace([{ name: "gone", source: "./plugins/gone" }]);
    await validateCommand(root);
    expect(process.exitCode).toBe(1);
  });
});
