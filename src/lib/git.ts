import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface RemoteInfo {
  /** Normalized https clone URL, e.g. https://gitlab.example.com/team/repo.git */
  httpsUrl: string;
  /** Forge host, e.g. github.com, gitlab.com, git.mycompany.io */
  host: string;
  /** "owner/repo" when it can be derived from the URL path. */
  slug?: string;
  /** True only for github.com (enables the `owner/repo` shorthand). */
  isGitHub: boolean;
  isGitLab: boolean;
}

export function isGitAvailable(): boolean {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function isGitRepo(dir: string): boolean {
  return fs.existsSync(path.join(dir, ".git"));
}

/** True if `dir` or any of its ancestors is a git repo (walks up to the root). */
export function isInsideGitRepo(dir: string): boolean {
  let d = path.resolve(dir);
  for (;;) {
    if (fs.existsSync(path.join(d, ".git"))) return true;
    const parent = path.dirname(d);
    if (parent === d) return false;
    d = parent;
  }
}

export function gitInit(dir: string): void {
  execFileSync("git", ["init", "--initial-branch=main"], {
    cwd: dir,
    stdio: "ignore",
  });
}

export function getOriginUrl(dir: string): string | undefined {
  try {
    return execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: dir,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

/**
 * Parse any common Git remote URL into forge-agnostic info.
 * Supports: https://host/path.git, git@host:path.git, ssh://git@host/path.git
 */
export function parseRemoteUrl(raw: string): RemoteInfo | undefined {
  let host: string | undefined;
  let repoPath: string | undefined;

  const scp = raw.match(/^(?:[\w.-]+)@([\w.-]+):(.+?)(?:\.git)?\/?$/);
  const url = raw.match(
    /^(?:https?|ssh|git):\/\/(?:[\w.-]+@)?([\w.-]+(?::\d+)?)\/(.+?)(?:\.git)?\/?$/,
  );

  if (scp) {
    host = scp[1];
    repoPath = scp[2];
  } else if (url) {
    host = url[1];
    repoPath = url[2];
  }
  if (!host || !repoPath) return undefined;

  const bareHost = host.replace(/:\d+$/, "");
  const segments = repoPath.split("/").filter(Boolean);
  const slug =
    segments.length === 2 ? `${segments[0]}/${segments[1]}` : undefined;

  return {
    httpsUrl: `https://${host}/${repoPath}.git`,
    host: bareHost,
    slug,
    isGitHub: bareHost === "github.com",
    isGitLab: bareHost === "gitlab.com" || bareHost.startsWith("gitlab."),
  };
}
