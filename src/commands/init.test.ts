import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { initCommand } from "./init.js";

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});
afterEach(() => {
  process.exitCode = 0;
});

function tmp(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "agkit-init-"));
  tmpDirs.push(d);
  return d;
}

describe("initCommand --plugin (standalone plugin)", () => {
  it("scaffolds a plugin directory with no marketplace", async () => {
    const dir = path.join(tmp(), "my-skill");
    await initCommand(dir, {
      plugin: "skill",
      name: "my-skill",
      description: "std",
      owner: "Jane",
      yes: true,
    });

    const manifestPath = path.join(dir, ".claude-plugin", "plugin.json");
    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(
      fs.existsSync(path.join(dir, ".claude-plugin", "marketplace.json")),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(dir, "skills", "my-skill", "SKILL.md")),
    ).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    expect(manifest.name).toBe("my-skill");
    expect(manifest.description).toBe("std");
    expect(manifest.author.name).toBe("Jane");
    expect(process.exitCode).not.toBe(1);
  });

  it("refuses to overwrite an existing plugin", async () => {
    const dir = path.join(tmp(), "x");
    await initCommand(dir, {
      plugin: "skill",
      name: "x",
      description: "d",
      yes: true,
    });
    process.exitCode = 0;
    await initCommand(dir, {
      plugin: "command",
      name: "x",
      description: "d",
      yes: true,
    });
    expect(process.exitCode).toBe(1);
  });

  it("does not create a nested repo when scaffolded inside an existing one", async () => {
    const repo = tmp();
    fs.mkdirSync(path.join(repo, ".git"), { recursive: true });
    const inside = path.join(repo, "plugins", "inside");
    await initCommand(inside, {
      plugin: "skill",
      name: "inside",
      description: "d",
      yes: true,
    });
    expect(
      fs.existsSync(path.join(inside, ".claude-plugin", "plugin.json")),
    ).toBe(true);
    expect(fs.existsSync(path.join(inside, ".git"))).toBe(false);
  });
});
