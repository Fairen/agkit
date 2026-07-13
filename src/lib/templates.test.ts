import { describe, expect, it } from "vitest";
import { PLUGIN_TEMPLATES } from "./constants.js";
import {
  isRemoteSpec,
  resolveRemoteSource,
  resolveTemplate,
} from "./templates.js";

describe("resolveTemplate", () => {
  it("resolves every built-in template to a shipped directory", () => {
    for (const name of PLUGIN_TEMPLATES) {
      const t = resolveTemplate(name);
      expect(t.builtin).toBe(true);
      expect(t.label).toBe(`built-in:${name}`);
      expect(t.dir.endsWith(`plugins/${name}`)).toBe(true);
    }
  });

  it("throws on an unrecognized spec", () => {
    expect(() => resolveTemplate("definitely-not-a-template")).toThrow(
      /Unrecognized template/,
    );
  });

  it("throws when a local template path does not exist", () => {
    expect(() => resolveTemplate("./nope-does-not-exist")).toThrow(/not found/);
  });
});

describe("isRemoteSpec", () => {
  it("treats built-in names and local paths as non-remote", () => {
    for (const name of PLUGIN_TEMPLATES) expect(isRemoteSpec(name)).toBe(false);
    expect(isRemoteSpec("./plugins/x")).toBe(false);
    expect(isRemoteSpec("../shared/x")).toBe(false);
    expect(isRemoteSpec("path:/abs/dir")).toBe(false);
    expect(isRemoteSpec("/abs/dir")).toBe(false);
  });

  it("treats git shorthands and URLs as remote", () => {
    expect(isRemoteSpec("acme/deploy-plugin")).toBe(true);
    expect(isRemoteSpec("gh:acme/deploy-plugin")).toBe(true);
    expect(isRemoteSpec("gl:team/plugin")).toBe(true);
    expect(isRemoteSpec("https://gitlab.com/team/plugin.git")).toBe(true);
  });
});

describe("resolveRemoteSource", () => {
  it("maps a bare owner/repo to a github source", () => {
    expect(resolveRemoteSource("acme/deploy-plugin").source).toEqual({
      source: "github",
      repo: "acme/deploy-plugin",
    });
  });

  it("maps the gh: shorthand to a github source", () => {
    expect(resolveRemoteSource("gh:acme/deploy-plugin").source).toEqual({
      source: "github",
      repo: "acme/deploy-plugin",
    });
  });

  it("maps a github URL to a github source, stripping .git", () => {
    expect(
      resolveRemoteSource("https://github.com/acme/deploy-plugin.git").source,
    ).toEqual({ source: "github", repo: "acme/deploy-plugin" });
  });

  it("maps a non-github git URL to a url source", () => {
    expect(
      resolveRemoteSource("https://gitlab.com/team/plugin.git").source,
    ).toEqual({ source: "url", url: "https://gitlab.com/team/plugin.git" });
  });

  it("maps the gl: shorthand to a url source", () => {
    expect(resolveRemoteSource("gl:team/plugin").source).toEqual({
      source: "url",
      url: "https://gitlab.com/team/plugin.git",
    });
  });

  it("maps a //subdir spec to a git-subdir source", () => {
    expect(
      resolveRemoteSource("https://github.com/acme/monorepo.git//tools/plugin")
        .source,
    ).toEqual({
      source: "git-subdir",
      url: "https://github.com/acme/monorepo.git",
      path: "tools/plugin",
    });
  });

  it("pins ref and sha, with #ref as a fallback for ref", () => {
    const sha = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0";
    expect(
      resolveRemoteSource("acme/plugin", { ref: "v2.0.0", sha }).source,
    ).toEqual({ source: "github", repo: "acme/plugin", ref: "v2.0.0", sha });
    expect(resolveRemoteSource("gh:acme/plugin#main").source).toEqual({
      source: "github",
      repo: "acme/plugin",
      ref: "main",
    });
    // #ref must also work on the bare owner/repo shorthand.
    expect(resolveRemoteSource("acme/plugin#v2.0.0").source).toEqual({
      source: "github",
      repo: "acme/plugin",
      ref: "v2.0.0",
    });
  });

  it("rejects a local path, a built-in name, and a bad sha", () => {
    expect(() => resolveRemoteSource("./plugins/x")).toThrow(/local path/);
    expect(() => resolveRemoteSource("skill")).toThrow(/built-in template/);
    expect(() => resolveRemoteSource("acme/plugin", { sha: "abc123" })).toThrow(
      /40-character/,
    );
  });
});
