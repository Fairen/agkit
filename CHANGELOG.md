# Changelog

## 0.9.0

### Added
- **`agkit init --plugin [template]` scaffolds a standalone plugin** (just `.claude-plugin/plugin.json` + the template content) in a directory, **without** a surrounding marketplace. The folder becomes its own git repo — unless it's already inside one (e.g. dropped into a marketplace's `plugins/`), avoiding a nested repo — so it can be pushed and then referenced from any catalog with `agkit add <owner/repo> <name>`. Template, name, description, and author come from `--plugin <template>` / `--name` / `-d` / `--owner` (prompted otherwise; `-y` defaults to the `skill` template).

### Changed
- **Node.js ≥ 22 is now required** (was ≥ 18). `engines.node` is `>=22.0.0`, the tsup build target is `node22`, TypeScript targets ES2023, and CI runs on Node 22.x/24.x. Node 18/20 are no longer supported.
- **`agkit add` references a remote git repo by default instead of cloning it.** Previously a git spec (`gh:`/`gl:`/URL, and now bare `owner/repo`) was always a *template*: agkit cloned it and vendored the files into `plugins/<name>/`. Now a remote source is registered as the schema's object `source` — `{ "source": "github", "repo": … }`, `{ "source": "url", "url": … }`, or `{ "source": "git-subdir", "url": …, "path": … }` — so the plugin stays in its own repo and the agent fetches it at install time. No files are created; `sync`/`validate` already leave remote sources untouched. Pin the fetch with `--ref <branch|tag>` and `--sha <commit>`.
- **`--vendor` opts back into the old clone-and-scaffold behavior** for a remote template repo (built-in names and local paths are still always scaffolded, unchanged).

### Internal
- **Command-level tests.** Added integration tests for `add` (github/url/git-subdir referencing, `#ref`/`--sha` pinning, built-in scaffolding, `--vendor` clone, duplicate-name guard), `init --plugin` (standalone scaffold, overwrite guard, no nested repo), `sync` (adopt/drift/orphan, remote sources untouched), and `validate` (well-formed vs. duplicate/missing/dangling sources, with the Claude CLI stubbed out). Suite is now 68 tests.

## 0.8.0

### Added
- **Generated documentation is now part of the lifecycle.** Alongside the README plugin table, agkit keeps two more docs in sync from the canonical catalog — no extra command, they refresh on every `add` / `bump` / `sync`:
  - **`AGENTS.md` plugin list** — the root `AGENTS.md` now carries an auto-maintained plugin list between `<!-- agkit:plugins:start -->` / `<!-- agkit:plugins:end -->` markers. Previously `AGENTS.md` was written once at init and drifted as plugins changed; it now stays current like the README table.
  - **Richer README table** — the plugin name links to its `homepage` when set, and a `Keywords` column appears when any plugin declares keywords.
- **Per-plugin `CHANGELOG.md` at `agkit bump`** — bump prepends a dated, newest-on-top entry to `plugins/<name>/CHANGELOG.md`, built from the same conventional-commit analysis that drives the version bump (previously computed only to pick the level, then discarded). `--dry-run` reports it; `--tag` commits it with the release. Falls back to a generic line when there is no git history.

### Fixed
- **Plugin sources are always marketplace-root-relative** (`./plugins/<name>`). When `metadata.pluginRoot` was set, `add`/`sync` registered a bare directory name (e.g. `"my-plugin"`), which the official `claude plugin validate` rejects with `plugins.N.source: Invalid input` — string sources must match `^\./`. Existing bare-name catalogs still resolve (backward compatible); agkit just no longer generates them.

### Internal
- New `src/lib/docs.ts` centralizes the catalog-derived doc renderers (plugin table, `AGENTS.md` list, changelog entry) and the marker replacement, covered by `src/lib/docs.test.ts`.

## 0.7.0

### Notes
- First release published to the public npm registry (name: `agkit`). Versions `0.1.0`–`0.6.0` were internal, pre-publish.

## 0.6.0

### Changed
- **Renamed to `agkit`** (**AG**ent marketplace **KIT**; single bin `agkit`). The previous name `souk` was rejected by the npm registry for being too similar to existing packages (`soap`/`socks`/`slug`/`auto`/`expo`). No behavior change — only the package name and CLI command.

## 0.5.0

### Added
- **`agkit build [--target <list>] [--check]`** — generates tier-2 agent artifacts from the Claude catalog (the single source of truth):
  - **Codex** — `.agents/plugins/marketplace.json` (object sources `{ source: "local", path }` + `policy` + `category`, top-level `name`) and per-plugin `plugins/<name>/.codex-plugin/plugin.json`. Format verified against the official OpenAI docs (developers.openai.com/codex/plugins/build).
  - **Cursor** — `.cursor-plugin/marketplace.json` (string sources, Claude-shaped) and per-plugin `plugins/<name>/.cursor-plugin/plugin.json`.
  - Per-plugin manifests are verbatim copies of the Claude manifest (no extra keys — those targets are strict).
  - `--check` verifies the generated files are up to date and exits non-zero on drift (CI). Default targets are the tier-2 entries in `metadata.targets`; `--target` overrides.
- **Freshness kept automatically**: `sync` (and therefore `add` and `bump`, which call it) refresh any tier-2 registry that already exists, so a built target never drifts as plugins change. Generation is opt-in (run `agkit build` once); after that it stays fresh.
- Generated CI (GitHub Actions / GitLab CI) now runs `agkit build --check` after `agkit validate`.

### Notes
- Tier-2 targets are **in-place marketplaces** (Codex, Cursor): they reuse the shared `plugins/` content via a committed registry, so agkit generates declarative registries + manifest mirrors — not transformed content trees. Tier-3 agents (Gemini/Antigravity, OpenCode, Kiro), which need per-plugin content transforms, remain out of scope.

## 0.4.0

### Added
- **`agkit init --agents <list>`** — choose the target coding agents at init time (interactive multiselect, or comma-separated flag). Adapters are tiered by structural cost:
  - **Tier 1 (native)** — Claude Code, GitHub Copilot: fully wired. The `.claude-plugin/marketplace.json` is consumed as-is; init emits the right team-settings path per agent (`.claude/settings.json`, `.github/copilot/settings.json`) and a per-agent install section.
  - **Tier 2 (light registry)** — Codex, Cursor: recorded in `metadata.targets`, documented, but artifact generation deferred to a planned `agkit build`.
  - **Tier 3 (transform)** — Gemini/Antigravity, OpenCode, Kiro: recorded and documented; heavy per-plugin transforms are out of scope for init (that is aipm/build territory).
- **`AgentAdapter` architecture** (`src/lib/agents.ts`): a single seam that composes README install sections, team-setup sections, and the target list. Adding an agent is one entry.
- **`metadata.targets`** written to the catalog, recording the intended agents.
- **Root `AGENTS.md`** emitted at init — read natively by most agents (Claude Code, Codex, Cursor, Gemini, Copilot, OpenCode, …) for repo context.
- `agkit validate` notes (info, non-failing) when `metadata.targets` includes tier 2/3 agents that need generation.

### Notes
- agkit still does **not** generate per-target artifacts (Tier 2/3). It records intent and documents the install path; a dedicated `agkit build --target <agent>` is the planned home for generation, because those registries must be kept fresh by every lifecycle command — a build concern, not an init one.
- Gemini CLI is being retired (2026-06-18) for personal accounts in favour of Antigravity CLI; the Gemini adapter carries that caveat.

## 0.3.0

### Changed
- **Renamed to `souk`** (single bin `souk`). Repositioned as a lifecycle manager for plugin marketplaces targeting **both Claude Code and GitHub Copilot** — both agents read the `.claude-plugin/marketplace.json` format natively (Copilot CLI and Copilot in VS Code look for `marketplace.json` under `.claude-plugin/`), so one repo installs on both with no generation step.
- `init` now scaffolds a README with install instructions for **both** agents (`/plugin marketplace add …` for Claude Code, `copilot plugin marketplace add …` for Copilot CLI) and documents the two team-settings paths (`.claude/settings.json` and `.github/copilot/settings.json`, same `extraKnownMarketplaces` block).
- Added a **Scope** section making explicit that agkit does not generate per-target artifacts for non-native agents (Cursor, Codex, Gemini, OpenCode, Kiro); that remains a build/transform concern for tools like `aipm`.

## 0.2.0

### Added
- **`hook` template**: `hooks/hooks.json` in the officially documented format (outer `"hooks"` wrapper), with an executable `scripts/<name>.sh` (exec bit preserved) reading the event JSON on stdin and using exit code 2 to block with feedback.
- **`mcp` template**: `.mcp.json` plus a zero-dependency Node stdio MCP server (`servers/<name>.mjs`) implementing initialize / tools/list / tools/call — works out of the box, migrate to `@modelcontextprotocol/sdk` when it grows.
- **Remote and local templates** in `agkit add`, forge-agnostic:
  - `gh:owner/repo[/subdir][#ref]` and `gl:owner/repo[/subdir][#ref]` shorthands
  - any git URL (`https`, `ssh`, `scp-style`, `file`) with `//subdir` and `#ref`
  - local directories (`./dir`, `/abs/dir`, `path:dir`)
  Templates are materialized via `git clone --depth 1`; `.tpl` files are rendered with `{{pluginName}}`, `{{pluginTitle}}`, `{{description}}`, `{{authorName}}`; a plain `plugin.json` is adopted with its `name` forced to the chosen plugin name.
- **`agkit bump [plugin] [level]`**: semver bump driven by conventional commits scoped to the plugin directory since its last `<plugin>@x.y.z` release tag (`feat` → minor, `BREAKING CHANGE`/`!` → major, otherwise patch). Supports explicit `major|minor|patch`, `--dry-run`, and `--tag` (commit + release tag). Always propagates to `marketplace.json` and the README table via sync.
- **`agkit validate --strict`**: passes `--strict` to the official `claude plugin validate` to treat warnings as errors in CI.

### Fixed
- Executable permissions are now preserved when copying/rendering template files.

## 0.1.0

Initial release: `init` (git-first, multi-forge, CI GitHub/GitLab, team `extraKnownMarketplaces` snippet), `add` (skill/command/agent), `sync`, `validate`, `list`.
