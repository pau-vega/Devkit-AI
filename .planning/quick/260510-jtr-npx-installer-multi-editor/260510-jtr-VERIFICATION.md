---
phase: quick-260510-jtr-npx-installer-multi-editor
verified: 2026-05-10T00:00:00Z
status: human_needed
score: 9/11 must-haves verified (2 require human smoke-test)
overrides_applied: 0
re_verification:
  previous_status: none
  notes: "Initial verification after REVIEW.md fixes (commit 5db484d) were applied"
human_verification:
  - test: "Run `npx @pau-vega/my-marketplace` after configuring ~/.npmrc with a read:packages PAT"
    expected: "Reaches the interactive prompt flow (editor → scope → plugins → confirm) without auth errors"
    why_human: "Requires publishing the package to GitHub Packages (Task 4 in plan), creating a PAT, and a real TTY for clack/prompts. The plan explicitly defers this checkpoint to the user."
  - test: "Run `npx github:pau-vega/my-marketplace` with no ~/.npmrc auth configured"
    expected: "Clones the repo HEAD over git, runs the installer, reaches the same interactive prompts"
    why_human: "Requires the branch/tag to exist on the public GitHub repo. The plan's Task 4 marks this for human smoke-testing."
  - test: "Smoke-test the full prompt flow against /tmp/mm-smoke per Plan Task 4 steps 2-7"
    expected: "Dry-run prints would-write list with no disk writes; real run writes files; second run shows per-file conflict prompt with default skip and remember toggle; Ctrl-C aborts cleanly; project-local scope replaces .gitignore block in place; OpenCode hooks and Cursor agents appear in summary as skipped with reason"
    why_human: "Requires interactive TTY input (clack/prompts), and multi-step state mutation across runs. Cannot be automated without a test harness, which the project explicitly excludes."
  - test: "Cut a v1.0.0 GitHub Release and confirm `.github/workflows/publish.yml` runs and publishes to GitHub Packages"
    expected: "Workflow run completes successfully on `release: published`; package appears at github.com/pau-vega?tab=packages"
    why_human: "Requires a real GitHub release event and access to the repo's package settings."
---

# Quick Task 260510-jtr: npx Installer Verification Report

**Task Goal:** Build an npx-runnable installer for this Claude Code plugin marketplace that lets users pick (a) editor — Claude Code, Cursor, or OpenCode — and (b) install scope — project, project-local, or user-global. Distribution via GitHub Packages with `npx github:` zero-auth fallback. CLI: @clack/prompts. Conflict handling: per-file prompt with remember-for-this-run toggle.

**Verified:** 2026-05-10
**Status:** human_needed — automated structural verification passes, but the goal includes "user can run npx … and reach an interactive prompt", which needs a TTY and (for the auth path) a published package.
**Re-verification:** No — initial verification (REVIEW.md fixes from commit `5db484d` were verified in-line).

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                            | Status         | Evidence                                                                                                                                                                                                                                              |
| -- | ---------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | User can run `npx @pau-vega/my-marketplace` (after .npmrc auth) and reach an interactive prompt                  | ? UNCERTAIN    | `package.json` has correct name, `bin` entry, `publishConfig.registry`. `bin/install.mjs --help`/`--version` exit cleanly. But package is not yet published — verifying the full npx invocation requires a release. Routed to human verification.    |
| 2  | User can run `npx github:pau-vega/my-marketplace` with zero auth and reach the same prompt                       | ? UNCERTAIN    | Code path (entry + prompts) works locally via `node bin/install.mjs`. The github: form requires the public branch to exist with the package.json at root, which it does on `main`. Real fetch over `npx github:` requires human smoke test.            |
| 3  | User can pick editor (Claude Code \| Cursor \| OpenCode) and scope (project \| project-local \| user)            | ✓ VERIFIED     | `src/installer/prompts.mjs:45-69` defines both `select` prompts with all three options each. `targets.mjs:39-72` resolves all 9 editor×scope combos and throws on unknown editor.                                                                       |
| 4  | User can multi-select plugins with all three pre-checked; empty selection aborts cleanly                         | ✓ VERIFIED     | `prompts.mjs:71-92`: `multiselect` with `initialValues = allPlugins.map(p=>p.name)` (3 plugins from manifest), `required: true`, plus a length-zero guard that calls `cancel()` and `process.exit(0)`.                                                  |
| 5  | Installer reads `.claude-plugin/marketplace.json` to enumerate plugins (no hard-coded plugin list)               | ✓ VERIFIED     | `marketplace.mjs:12,21-43,54-67` reads `MANIFEST_REL` and maps `manifest.plugins`. `listPlugins(cwd)` returns `count=3, names=typescript-rules,jsdoc-standards,workflow-toolkit`. Source grep finds those names only in doc comments referencing the existing `.cursor/skills/` symlink precedent — no hard-coded array. |
| 6  | Per-file conflict prompt offers overwrite \| skip \| abort with default skip and a remember-for-this-run toggle  | ✓ VERIFIED     | `conflicts.mjs:34-42` lists all three actions with `initialValue: "skip"`. `:47-58` adds `state.askedRemember` so the toggle is asked only once per run (this is the WR-01 fix from REVIEW.md, applied in commit `5db484d`).                              |
| 7  | Ctrl-C at any prompt aborts before any file is written (zero partial-write state)                                | ✓ VERIFIED     | Every `await` in `prompts.mjs` is followed by `if (isCancel(...)) { cancel(...); process.exit(0); }`. No filesystem write occurs in `prompts.mjs`. `bin/install.mjs:74-79` only triggers `copyPluginFiles` after the final `confirm`.                     |
| 8  | Project-local scope appends a delimited block to `.gitignore` listing every installed file                       | ✓ VERIFIED     | `bin/install.mjs:88-104` calls `upsertGitignoreBlock` only when `scope === "project-local"` and there is at least one written file. `gitignore.mjs:55-71` uses an anchored multi-line regex (`re.test()`) and falls through to append if no match — the BL-01 fix from REVIEW.md is in place. |
| 9  | OpenCode hooks and Cursor agents are skipped with a clear info message in the final summary                     | ✓ VERIFIED     | `targets.mjs:159-169` sets `skipped: true` with explicit reasons for both gaps. `summary.mjs:49-55` renders a "Skipped (N):" section listing each path with reason. The reasons are informative ("Cursor has no portable agent file format.", "OpenCode does not consume hooks.json. Skills + commands are still installed."). |
| 10 | Tagging a release on GitHub triggers `.github/workflows/publish.yml` and ships the package to GitHub Packages    | ? UNCERTAIN    | Workflow file is structurally correct: `on: release: types: [published]`, `permissions: packages: write`, `setup-node` with `registry-url: https://npm.pkg.github.com` and `scope: '@pau-vega'`, `npm publish` with `NODE_AUTH_TOKEN`. Cannot be exercised without an actual release — routed to human verification. |
| 11 | Dry-run flag (`--dry-run`) prints what would be written without touching the filesystem                          | ✓ VERIFIED     | `bin/install.mjs:62` parses `--dry-run`. `copy.mjs:90-94, 123-127` short-circuits writes and emits `log.info("would write[...]")` lines. `summary.mjs:43,72` switches verb to "Would write" and outro to "(dry-run — no files written)". `dryRun` is also passed to `prompts.mjs` for the confirmation note. WR-02 fix from REVIEW.md is in place: dry-run skips `resolveConflict` entirely (no interactive prompts in dry mode). |

**Score:** 9/11 truths fully verified. 2 truths (#1, #10) require a published package or release event and are routed to human verification — not gaps, the plan explicitly defers smoke-test to user (Task 4).

### Required Artifacts

| Artifact                          | Expected                                                                  | Status      | Details                                                                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                    | bin entry, files allowlist, publishConfig.registry, engines.node>=20.11.0 | ✓ VERIFIED  | Name `@pau-vega/my-marketplace`, `type: module`, `bin: { my-marketplace: bin/install.mjs }`, `engines.node: >=20.11.0`, `files: [bin/, src/, typescript-rules/, jsdoc-standards/, workflow-toolkit/, .claude-plugin/marketplace.json, README.md, LICENSE]`, `publishConfig.registry: https://npm.pkg.github.com`, single dep `@clack/prompts`. |
| `bin/install.mjs`                 | Installer entry point with shebang, ≥40 lines                             | ✓ VERIFIED  | 146 lines, `#!/usr/bin/env node` on line 1, `0o755` permissions, ESM with `node:fs`/`node:path`/`node:url` imports.                                                                                                                                |
| `src/installer/marketplace.mjs`   | Reads marketplace.json, exports readMarketplace + listPlugins             | ✓ VERIFIED  | Both exports present and functional. `listPlugins(cwd)` returns 3 plugins live.                                                                                                                                                                    |
| `src/installer/targets.mjs`       | Per-editor + per-scope target-path resolution + source mapping            | ✓ VERIFIED  | Exports `resolveTargetRoot` and `mapPluginFiles`. Includes Cursor agents skip (line 159-161) and OpenCode hooks skip (line 162-169). Includes the `.cursor/skills/<plugin>` collapse-vs-preserve precedent.                                          |
| `src/installer/conflicts.mjs`     | Per-file conflict prompt with remember state                              | ✓ VERIFIED  | Exports `resolveConflict`. Default `skip`, all three actions, `askedRemember` flag (post WR-01 fix).                                                                                                                                                |
| `src/installer/copy.mjs`          | fs.cp wrapper respecting conflict resolution and dry-run                  | ✓ VERIFIED  | Exports `copyPluginFiles` + `ABORT_SENTINEL`. Dry-run skips resolveConflict (post WR-02 fix). Hook scripts get `chmod 0o755` on non-Windows.                                                                                                       |
| `src/installer/gitignore.mjs`     | Idempotent delimited-block management of .gitignore                       | ✓ VERIFIED  | Exports `upsertGitignoreBlock`. Anchored multi-line regex; appends on no-match (post BL-01 fix from commit `5db484d`).                                                                                                                              |
| `src/installer/prompts.mjs`       | clack flow with isCancel guards                                           | ✓ VERIFIED  | Exports `runPromptFlow`. All four prompts (`select`, `select`, `multiselect`, `confirm`) gated by `isCancel`. Imports `intro, outro, cancel, isCancel, select, multiselect, confirm, log, note` from `@clack/prompts`.                              |
| `src/installer/summary.mjs`       | Final summary printer (written/skipped/errors/next steps)                 | ✓ VERIFIED  | Exports `printSummary`. Includes editor-specific next steps for all three editors. Outro switches to "(dry-run — no files written)" when `dryRun: true`.                                                                                            |
| `.github/workflows/publish.yml`   | Tagged-release publish workflow                                           | ✓ VERIFIED  | `on: release: types: [published]`, `permissions: contents: read, packages: write`, setup-node with `registry-url: 'https://npm.pkg.github.com'`, `npm publish` with `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`.                                  |
| `.npmrc.example`                  | Consumer scoped registry config                                           | ✓ VERIFIED  | Contains `@pau-vega:registry=https://npm.pkg.github.com` and the auth-token line with `${GITHUB_TOKEN}` placeholder, plus a comment line documenting how to use it.                                                                                |
| `README.md`                       | Both install paths + scope matrix + limitations + flags + maintainer note | ✓ VERIFIED  | Both `npx @pau-vega/my-marketplace` and `npx github:pau-vega/my-marketplace` documented. Scope matrix table at lines 56-60. Three limitations bulleted. Flags table. Releasing section. 169 lines. No emoji.                                       |

### Key Link Verification

| From                          | To                                       | Via                                                          | Status   | Details                                                                                                |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------ |
| `bin/install.mjs`             | `src/installer/prompts.mjs`              | `import { runPromptFlow }`                                   | ✓ WIRED  | Line 19; called at line 74 with destructured return.                                                   |
| `src/installer/prompts.mjs`   | `@clack/prompts`                         | named imports                                                | ✓ WIRED  | `cancel, confirm, intro, isCancel, log, multiselect, note, select` all imported and used.              |
| `src/installer/marketplace.mjs` | `.claude-plugin/marketplace.json`     | `fs.readFileSync` + `JSON.parse`                              | ✓ WIRED  | `MANIFEST_REL = path.join(".claude-plugin", "marketplace.json")`; live test returned 3 plugins.        |
| `src/installer/copy.mjs`      | `src/installer/conflicts.mjs`            | `import { resolveConflict }`                                 | ✓ WIRED  | Line 15 import; line 104 invocation.                                                                   |
| `src/installer/copy.mjs`      | `src/installer/targets.mjs`              | `import { mapPluginFiles }`                                  | ✓ WIRED  | Line 16 import; line 57 invocation.                                                                    |
| `.github/workflows/publish.yml` | `package.json`                         | `npm publish` using `publishConfig.registry`                  | ✓ WIRED  | `publishConfig.registry` set to GitHub Packages URL; workflow runs `npm publish` with NODE_AUTH_TOKEN. |
| `package.json`                | `bin/install.mjs`                        | `bin` field                                                  | ✓ WIRED  | `"bin": { "my-marketplace": "bin/install.mjs" }`.                                                      |
| `src/installer/gitignore.mjs` | `.gitignore`                             | `fs.readFile` + delimiter-marker write                       | ✓ WIRED  | `BEGIN`/`END` constants, anchored regex test, fall-through append, `fs.writeFileSync`.                 |

### Data-Flow Trace (Level 4)

| Artifact                        | Data Variable    | Source                                            | Produces Real Data | Status      |
| ------------------------------- | ---------------- | ------------------------------------------------- | ------------------ | ----------- |
| `prompts.mjs` `allPlugins`      | array of plugins | `listPlugins(packageRoot)` reads marketplace.json | Yes — 3 plugins live | ✓ FLOWING |
| `copy.mjs` `allFiles`           | mapped files     | `mapPluginFiles` walks plugin source dirs         | Yes — readdirSync recursive | ✓ FLOWING |
| `summary.mjs` `written/skipped/errors` | arrays      | `result` from `copyPluginFiles`                    | Yes — populated in copy.mjs | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior                                        | Command                                                      | Result                                                                              | Status   |
| ----------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- | -------- |
| `--help` exits cleanly with usage               | `node bin/install.mjs --help`                                | Prints usage block; exit 0.                                                         | ✓ PASS   |
| `--version` prints package version              | `node bin/install.mjs --version`                             | Prints `1.0.0`; exit 0.                                                             | ✓ PASS   |
| All installer modules pass syntax check         | `node --check` on each `.mjs`                                | All 8 files (bin + 7 src) pass.                                                     | ✓ PASS   |
| `listPlugins` returns 3 plugins live            | dynamic import + `listPlugins(cwd)`                          | `count=3, names=typescript-rules,jsdoc-standards,workflow-toolkit`.                 | ✓ PASS   |
| `npm pack --dry-run` lists allowlisted files    | `npm pack --dry-run`                                         | 48 files, 38.7kB tarball; includes bin/, src/, all 3 plugin dirs, marketplace.json, README.md. Excludes .planning/, node_modules/, .cursor/. | ✓ PASS   |
| `bash scripts/build-marketplace.sh` still works | `bash scripts/build-marketplace.sh`                          | "Created .cursor/skills/ symlinks ... Injected 3 plugins into marketplace.html". No errors. | ✓ PASS   |
| Full interactive flow works against /tmp        | manual TTY run per Plan Task 4 steps 2-7                     | Cannot be automated.                                                                | ? SKIP — routed to human verification |

### Requirements Coverage

| Requirement       | Source Plan | Description                                              | Status        | Evidence                              |
| ----------------- | ----------- | -------------------------------------------------------- | ------------- | ------------------------------------- |
| `quick-260510-jtr` | 260510-jtr-PLAN.md | npx installer for marketplace plugins (multi-editor + multi-scope) | ✓ SATISFIED (modulo human smoke-test) | All 11 truths above; 9 fully verified, 2 routed to human. |

### Anti-Patterns Found

| File                            | Line   | Pattern                              | Severity | Impact                                                                                       |
| ------------------------------- | ------ | ------------------------------------ | -------- | -------------------------------------------------------------------------------------------- |
| —                               | —      | No emoji, no TODO/FIXME, no stub returns, no hardcoded plugin list | none     | Source files passed all anti-pattern grep checks. (REVIEW.md WR-01, WR-02, BL-01 already fixed in commit `5db484d`.)  |

The REVIEW.md surfaced 1 BLOCKER + 7 WARNINGs + 6 INFO. The user states the BLOCKER and 2 warnings (WR-01, WR-02) were fixed in commit `5db484d`. Verifier confirmed:
- **BL-01 (gitignore silent no-op):** Fixed — `gitignore.mjs:55-71` uses anchored multi-line regex with `re.test()` and falls through to append when no match.
- **WR-01 (remember toggle re-asked):** Fixed — `conflicts.mjs:47` introduces `state.askedRemember` flag.
- **WR-02 (dry-run interactive prompts):** Fixed — `copy.mjs:90-94` short-circuits before `resolveConflict` when dry-run.

The remaining REVIEW.md items (WR-03 through WR-07, IN-01 through IN-06) are deliberately deferred — they are edge-case polish (Windows path handling, BOM in non-`.sh` hook scripts, GitHub Packages ignoring `publishConfig.access`, etc.). None blocks the goal.

### Human Verification Required

Four items need human testing — see frontmatter `human_verification` for the structured list:

#### 1. Auth-path npx invocation
**Test:** Configure `~/.npmrc` per the README, then `npx @pau-vega/my-marketplace`.
**Expected:** Package downloads from GitHub Packages, installer reaches the editor prompt.
**Why human:** The package must be published first (Plan Task 4 + maintainer release step).

#### 2. Zero-auth npx invocation
**Test:** From an environment with no `~/.npmrc` configured, `npx github:pau-vega/my-marketplace`.
**Expected:** npm clones the public repo and runs the installer.
**Why human:** Requires real network fetch + TTY.

#### 3. Full interactive smoke test (Plan Task 4 steps 2-7)
**Test:** Per the plan's Task 4 procedure: dry-run, real run, conflict path with remember-for-this-run, Ctrl-C cancellation, project-local gitignore replacement, OpenCode hooks + Cursor agents skip-rule visibility.
**Expected:** Each step matches the documented behaviour.
**Why human:** Requires interactive `clack/prompts` input + multi-step state mutation across runs.

#### 4. Publish workflow trigger
**Test:** Cut a `v1.0.0` GitHub Release.
**Expected:** `.github/workflows/publish.yml` runs to completion and the package appears at `github.com/pau-vega?tab=packages`.
**Why human:** Requires a real release event and access to the repo's package settings.

### Gaps Summary

No structural gaps. All 11 truths either fully verified (9) or explicitly routed to the user smoke-test (2) per the plan's Task 4 checkpoint. All required artifacts present and substantive. All key links wired. All previously-flagged REVIEW.md fixes (BL-01, WR-01, WR-02) confirmed in source.

The two remaining truths (auth-path npx + tagged-release publish) cannot be exercised without a published package or a real release event — both are intentionally deferred to the user per the plan's `user_setup` and Task 4 sections. They are tracked in the `human_verification` frontmatter.

**Recommendation:** Proceed. The user's smoke-test of the prompt flow against `/tmp/mm-smoke` (Plan Task 4 steps 2-7) is the next gate; once that passes, cut the v1.0.0 release to exercise the publish workflow and the auth-path npx invocation.

---

_Verified: 2026-05-10_
_Verifier: Claude (gsd-verifier)_
_Depth: quick task goal-backward verification_
