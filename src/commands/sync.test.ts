import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  type PluginEntry,
  readMarketplace,
  writeMarketplace,
} from "../lib/marketplace.js";
import { syncCommand } from "./sync.js";

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});
afterEach(() => {
  process.exitCode = 0;
});

function newMarketplace(plugins: PluginEntry[] = []): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "agkit-sync-"));
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

function writePluginDir(
  root: string,
  name: string,
  manifest: Record<string, unknown>,
): void {
  const dir = path.join(root, "plugins", name, ".claude-plugin");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "plugin.json"), JSON.stringify(manifest));
}

describe("syncCommand", () => {
  it("adds a catalog entry for a plugin dir and copies version/description", async () => {
    const root = newMarketplace();
    writePluginDir(root, "formatter", {
      name: "formatter",
      version: "1.2.0",
      description: "fmt",
    });
    await syncCommand(root, { quiet: true });
    const entry = readMarketplace(root).plugins.find(
      (p) => p.name === "formatter",
    );
    expect(entry?.source).toBe("./plugins/formatter");
    expect(entry?.version).toBe("1.2.0");
    expect(entry?.description).toBe("fmt");
  });

  it("flags an orphaned local source with a non-zero exit code", async () => {
    const root = newMarketplace([{ name: "ghost", source: "./plugins/ghost" }]);
    await syncCommand(root);
    expect(process.exitCode).toBe(1);
  });

  it("leaves a remote object source untouched", async () => {
    const root = newMarketplace([
      { name: "remote", source: { source: "github", repo: "a/b" } },
    ]);
    await syncCommand(root, { quiet: true });
    const entry = readMarketplace(root).plugins.find(
      (p) => p.name === "remote",
    );
    expect(entry?.source).toEqual({ source: "github", repo: "a/b" });
  });
});
