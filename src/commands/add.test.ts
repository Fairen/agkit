import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { isGitAvailable } from "../lib/git.js";
import { readMarketplace, writeMarketplace } from "../lib/marketplace.js";
import { addPlugin } from "./add.js";

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});
afterEach(() => {
  process.exitCode = 0;
});

/** A minimal, valid marketplace on disk with an empty catalog. */
function newMarketplace(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "agkit-add-"));
  tmpDirs.push(root);
  writeMarketplace(root, {
    name: "test-market",
    owner: { name: "Tester" },
    metadata: { pluginRoot: "./plugins" },
    plugins: [],
  });
  fs.mkdirSync(path.join(root, "plugins"), { recursive: true });
  return root;
}

const opts = (extra: Record<string, unknown> = {}) => ({
  description: "d",
  interactive: false,
  ...extra,
});

describe("addPlugin — remote references (default)", () => {
  it("maps a bare owner/repo to a github source and vendors nothing", async () => {
    const root = newMarketplace();
    await addPlugin(root, "acme/deploy", "deploy", opts());
    const mp = readMarketplace(root);
    expect(mp.plugins).toHaveLength(1);
    expect(mp.plugins[0]?.source).toEqual({
      source: "github",
      repo: "acme/deploy",
    });
    expect(fs.existsSync(path.join(root, "plugins", "deploy"))).toBe(false);
    expect(process.exitCode).not.toBe(1);
  });

  it("maps a non-github URL to a url source", async () => {
    const root = newMarketplace();
    await addPlugin(root, "https://gitlab.com/team/plugin.git", "gl", opts());
    expect(readMarketplace(root).plugins[0]?.source).toEqual({
      source: "url",
      url: "https://gitlab.com/team/plugin.git",
    });
  });

  it("maps a //subdir spec to a git-subdir source", async () => {
    const root = newMarketplace();
    await addPlugin(
      root,
      "https://gitlab.com/team/marketplace.git//my-plugin",
      "my-plugin",
      opts(),
    );
    expect(readMarketplace(root).plugins[0]?.source).toEqual({
      source: "git-subdir",
      url: "https://gitlab.com/team/marketplace.git",
      path: "my-plugin",
    });
  });

  it("pins the source with #ref and --sha", async () => {
    const root = newMarketplace();
    const sha = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0";
    await addPlugin(root, "acme/deploy#v2", "deploy", opts({ sha }));
    expect(readMarketplace(root).plugins[0]?.source).toEqual({
      source: "github",
      repo: "acme/deploy",
      ref: "v2",
      sha,
    });
  });

  it("rejects a duplicate name without touching the catalog", async () => {
    const root = newMarketplace();
    await addPlugin(root, "acme/deploy", "deploy", opts());
    await addPlugin(root, "acme/other", "deploy", opts());
    expect(process.exitCode).toBe(1);
    const mp = readMarketplace(root);
    expect(mp.plugins).toHaveLength(1);
    expect(mp.plugins[0]?.source).toEqual({
      source: "github",
      repo: "acme/deploy",
    });
  });
});

describe("addPlugin — local scaffolding", () => {
  it("scaffolds a built-in template into plugins/<name> with a relative source", async () => {
    const root = newMarketplace();
    await addPlugin(root, "skill", "my-skill", opts());
    const mp = readMarketplace(root);
    expect(mp.plugins[0]?.source).toBe("./plugins/my-skill");
    expect(
      fs.existsSync(
        path.join(root, "plugins", "my-skill", ".claude-plugin", "plugin.json"),
      ),
    ).toBe(true);
  });
});

describe("addPlugin — vendoring", () => {
  it.skipIf(!isGitAvailable())(
    "clones a remote template and scaffolds it into the marketplace",
    async () => {
      // A throwaway git repo that is itself a plugin template.
      const tpl = fs.mkdtempSync(path.join(os.tmpdir(), "agkit-vendtpl-"));
      tmpDirs.push(tpl);
      fs.mkdirSync(path.join(tpl, ".claude-plugin"), { recursive: true });
      fs.writeFileSync(
        path.join(tpl, ".claude-plugin", "plugin.json"),
        JSON.stringify({
          name: "placeholder",
          version: "0.3.0",
          description: "t",
        }),
      );
      const git = (args: string[]) =>
        execFileSync("git", args, { cwd: tpl, stdio: "ignore" });
      git(["init"]);
      git(["add", "-A"]);
      git([
        "-c",
        "user.email=t@e.com",
        "-c",
        "user.name=t",
        "commit",
        "-m",
        "init",
      ]);

      const root = newMarketplace();
      await addPlugin(root, `file://${tpl}`, "vend", opts({ vendor: true }));

      const mp = readMarketplace(root);
      expect(mp.plugins[0]?.source).toBe("./plugins/vend");
      const manifest = JSON.parse(
        fs.readFileSync(
          path.join(root, "plugins", "vend", ".claude-plugin", "plugin.json"),
          "utf8",
        ),
      );
      expect(manifest.name).toBe("vend"); // identity forced to the chosen name
      // The clone's .git is never copied into the vendored plugin.
      expect(fs.existsSync(path.join(root, "plugins", "vend", ".git"))).toBe(
        false,
      );
    },
  );
});
