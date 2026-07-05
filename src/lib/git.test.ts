import { describe, expect, it } from "vitest";
import { parseRemoteUrl } from "./git.js";

describe("parseRemoteUrl", () => {
  it("parses an https GitHub URL", () => {
    const info = parseRemoteUrl("https://github.com/owner/repo.git");
    expect(info?.host).toBe("github.com");
    expect(info?.slug).toBe("owner/repo");
    expect(info?.isGitHub).toBe(true);
    expect(info?.isGitLab).toBe(false);
    expect(info?.httpsUrl).toBe("https://github.com/owner/repo.git");
  });

  it("parses an scp-style SSH URL", () => {
    const info = parseRemoteUrl("git@github.com:owner/repo.git");
    expect(info?.host).toBe("github.com");
    expect(info?.slug).toBe("owner/repo");
    expect(info?.isGitHub).toBe(true);
  });

  it("parses an ssh:// URL with a port and strips it from host", () => {
    const info = parseRemoteUrl(
      "ssh://git@gitlab.example.com:2222/team/repo.git",
    );
    expect(info?.host).toBe("gitlab.example.com");
    expect(info?.slug).toBe("team/repo");
    expect(info?.isGitLab).toBe(true);
    expect(info?.httpsUrl).toBe(
      "https://gitlab.example.com:2222/team/repo.git",
    );
  });

  it("treats a self-hosted forge as neither GitHub nor GitLab", () => {
    const info = parseRemoteUrl("https://git.company.io/team/repo.git");
    expect(info?.host).toBe("git.company.io");
    expect(info?.isGitHub).toBe(false);
    expect(info?.isGitLab).toBe(false);
  });

  it("leaves the slug undefined for nested (3+ segment) paths", () => {
    const info = parseRemoteUrl("https://gitlab.com/group/subgroup/repo.git");
    expect(info?.host).toBe("gitlab.com");
    expect(info?.isGitLab).toBe(true);
    expect(info?.slug).toBeUndefined();
  });

  it("returns undefined for an unparseable remote", () => {
    expect(parseRemoteUrl("not a remote url")).toBeUndefined();
  });
});
