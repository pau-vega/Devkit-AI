---
phase: quick-260510-jtr
plan: 01
quick_id: 260510-jtr
subsystem: installer
tags: [npx, installer, multi-editor, github-packages, clack]
provides:
  - "npx-runnable installer for the three marketplace plugins"
  - "GitHub Packages publish workflow"
  - "consumer-facing .npmrc.example and README install docs"
requires:
  - ".claude-plugin/marketplace.json (plugin enumeration)"
  - "@clack/prompts ^0.10.0 (sole runtime dep)"
affects:
  - "package.json (newly introduced — first ever for this repo)"
  - ".gitignore (npm-related entries appended)"
  - "README.md (installer section prepended)"
tech_stack_added:
  - "Node.js >=20.11.0 (engine floor)"
  - "@clack/prompts (interactive CLI prompts)"
patterns:
  - "ESM-only single-package layout with bin entry pointing at .mjs"
  - "Idempotent delimited-block .gitignore management"
  - "Per-file conflict prompt with remember-for-this-run state"
key_files_created:
  - "package.json"
  - ".npmrc.example"
  - ".github/workflows/publish.yml"
  - "bin/install.mjs"
  - "src/installer/marketplace.mjs"
  - "src/installer/targets.mjs"
  - "src/installer/conflicts.mjs"
  - "src/installer/copy.mjs"
  - "src/installer/gitignore.mjs"
  - "src/installer/prompts.mjs"
  - "src/installer/summary.mjs"
key_files_modified:
  - ".gitignore"
  - "README.md"
decisions:
  - "Honor existing .cursor/skills/ collapse-vs-preserve precedent: single-skill plugins drop the inner skill-name segment, multi-skill plugins keep it"
  - "Pin @clack/prompts at ^0.10.0 in package.json (npm install resolved 0.10.1 locally; reverted to plan-spec range)"
  - "Bin script writes nothing on Ctrl-C: every prompt is gated by isCancel() and all filesystem writes happen after the final confirm"
  - "OpenCode hooks and Cursor agents skip with reason surfaced in summary, not silently"
metrics:
  duration_minutes: ~25
  tasks_completed: 3
  tasks_total_in_plan: 4
  files_created: 11
  files_modified: 2
  date_completed: "2026-05-10"
---

# Quick Task 260510-jtr: npx installer (multi-editor) Summary

A scoped npx installer (`@pau-vega/Devkit-AI`) that copies the three plugins
into Claude Code, Cursor, or OpenCode at any of three scopes, behind a calm
@clack/prompts UX with per-file conflict handling and a dry-run preview.

## What was built

- **`package.json`** — first ever in this repo. Scoped name
  `@pau-vega/Devkit-AI`, `bin` entry, `files` allowlist, Node engine floor
  `>=20.11.0`, `publishConfig` pointing at `https://npm.pkg.github.com`,
  `@clack/prompts` as the only runtime dependency.
- **`.github/workflows/publish.yml`** — triggered on `release: published`,
  authenticated via `GITHUB_TOKEN`, runs `npm pack --dry-run` (sanity log) then
  `npm publish` against GitHub Packages.
- **`.npmrc.example`** — consumer-facing scoped registry config with placeholder
  token + a one-line comment pointing at PAT setup.
- **`bin/install.mjs`** — entry point. Shebang on line 1, ESM, runtime Node
  version check, supports `--dry-run`, `--help`, `--version` and rejects
  unknown flags. Top-level try/catch prints `error.message` only.
- **`src/installer/marketplace.mjs`** — reads `.claude-plugin/marketplace.json`
  so the installer never hard-codes plugin names. Adding a 4th plugin to the
  manifest is zero-change for this module.
- **`src/installer/targets.mjs`** — pure mapping logic. Resolves per-editor x
  per-scope target roots, walks each plugin source dir, applies the documented
  skip rules (Cursor agents, OpenCode hooks), and honours the existing
  `.cursor/skills/<plugin>` collapse-vs-preserve precedent.
- **`src/installer/conflicts.mjs`** — per-file `[overwrite | skip | abort]`
  prompt with a confirm-driven remember-for-this-run toggle. Default is `skip`.
- **`src/installer/copy.mjs`** — performs the writes. `fs.copyFileSync`,
  `chmod 0o755` for hook scripts on non-Windows, dry-run mode that logs every
  intended write without touching disk. Friendly error message for `EACCES` on
  the target root.
- **`src/installer/gitignore.mjs`** — idempotent delimited block management
  for project-local scope. Replaces in place on re-run, never duplicates
  entries.
- **`src/installer/prompts.mjs`** — full clack flow with `isCancel` guards on
  every prompt; warns on Cursor user-global; final confirm before any write.
- **`src/installer/summary.mjs`** — single calm note covering written /
  skipped / errors / next-steps. No emoji.
- **`README.md`** — installer section prepended above the existing
  `typescript-rules` content. Covers both auth and zero-auth install paths,
  prompt flow, where files land, three known limitations, and a maintainer
  release note.

## Commits

| Task | Commit  | Message                                                                |
| ---- | ------- | ---------------------------------------------------------------------- |
| 1    | 980a8f2 | feat(260510-jtr): scaffold package.json + GitHub Packages publish workflow |
| 2    | c6b7341 | feat(260510-jtr): implement installer CLI with @clack/prompts and per-file conflict handling |
| 3    | bb6abcd | docs(260510-jtr): document npx install flow + scope/editor matrix in README |

All three commits live on the per-agent worktree branch
`worktree-agent-abbffbb9598f3b048`.

## Verification (automated)

- Task 1 verify-block (package.json field shape, workflow file, .npmrc.example,
  .gitignore entries) — **passed**.
- Task 2 verify-block (8 files exist; shebang on line 1; ESM imports; no
  hard-coded plugin list; conflict actions present; gitignore delimiters; all
  three editors and scopes referenced; skip rules; no emoji; modules load and
  expose named exports; `listPlugins` returns exactly 3 plugins from
  `marketplace.json`; `--version` and `--help` exit cleanly) — **passed**.
- Task 3 verify-block (README contains both install paths, scoped registry
  line, `read:packages`, `--dry-run`, all three editor names, project-local +
  gitignore mentions, no emoji) — **passed**.
- `bash scripts/build-marketplace.sh` still injects 3 plugins into
  `marketplace.html` — **passed** (existing convention untouched).
- `git diff HEAD~3..HEAD -- typescript-rules jsdoc-standards workflow-toolkit`
  is empty — **plugin sources untouched** as required.
- `node bin/install.mjs --version` prints `1.0.0`; `--help` prints usage and
  exits 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cursor skill destination did not match the existing
`.cursor/skills/` precedent**
- **Found during:** Task 2 (after first wiring of `targets.mjs`)
- **Issue:** The first cut of `resolveDestination` always inserted the inner
  skill-name segment for Cursor (`.cursor/skills/<plugin>/<skill-name>/SKILL.md`).
  The existing `.cursor/skills/typescript-rules/SKILL.md` symlink in the repo
  collapses the inner segment when a plugin ships exactly one skill, and only
  preserves it for `workflow-toolkit` (5 skills). Without this fix, an installer
  run would land Cursor skills at paths Cursor's existing skill-discovery
  precedent does not match.
- **Fix:** Pre-counted skill directories per plugin in `mapPluginFiles`, then
  passed `collapseCursorSkill` into `resolveDestination` so single-skill plugins
  collapse and multi-skill plugins preserve. Confirmed with a smoke test against
  all three plugins.
- **Files modified:** `src/installer/targets.mjs`
- **Commit:** Folded into Task 2's commit (`c6b7341`) before that commit was
  created — change happened during the verify cycle.

### Process notes (no plan deviation, just transparency)

- The first attempt at writing Task 1 files landed in the **parent repo**
  working copy (`/Users/.../Devkit-AI/`) rather than the worktree
  (`.../Devkit-AI/.claude/worktrees/agent-abbffbb9598f3b048/`). The
  pre-commit HEAD-safety assertion correctly refused to commit on `main` and
  surfaced the mismatch. The parent-repo writes were reverted (`git checkout --
  .gitignore`, `rm` of the new files) and then re-written into the worktree.
  No commits were made on `main`. This is exactly the behaviour the
  worktree-branch-check is designed to enforce.
- `npm install --no-audit --no-fund --silent @clack/prompts` was run inside the
  worktree to satisfy the Task 2 verify-block's import smoke check. The
  resulting `node_modules/` is gitignored. `npm install` bumped the version
  range in `package.json` from `^0.10.0` to `^0.10.1`; this was reverted to the
  plan-spec `^0.10.0` before the Task 2 commit so the shipped manifest matches
  the planned spec.

## Auth gates encountered

None during execution. The plan's `user_setup` section documents post-execution
gates the user must clear (cutting a release on GitHub to trigger the publish
workflow; consumers configuring their own `.npmrc` with a `read:packages` PAT)
— neither of those blocks the installer's actual code from running locally
today.

## Deferred / Skipped

- **Task 4 (human checkpoint).** Per the orchestrator constraints, the smoke
  test against `/tmp/mm-smoke` is the user's job post-execution. The installer
  has been syntax-checked, modules import cleanly, `--version` and `--help`
  work, and structural verification passes — but interactive prompt-driven
  smoke tests (real run, conflict path, project-local gitignore replacement,
  Ctrl-C cancellation, `npm pack --dry-run` content listing) require a TTY and
  user input.

## Known Stubs

None.

## Next Steps for the User

1. Run the human checkpoint (Task 4 in the plan): smoke-test the installer
   against `/tmp/mm-smoke` per the steps in `260510-jtr-PLAN.md`.
2. (Optional) Push the branch and merge to `main`.
3. (Optional) Cut a `v1.0.0` GitHub Release to trigger
   `.github/workflows/publish.yml` and ship the package to GitHub Packages.
4. (Optional) After publish, append a row for `260510-jtr` to the `## Quick
   Tasks` table in `.planning/STATE.md` (per the plan's `<output>` section).

## Self-Check: PASSED

- `package.json` exists at `<worktree>/package.json`: **FOUND**
- `bin/install.mjs` exists, shebang on line 1: **FOUND**
- `src/installer/{marketplace,targets,conflicts,copy,gitignore,prompts,summary}.mjs`:
  **all 7 FOUND**
- `.github/workflows/publish.yml` exists: **FOUND**
- `.npmrc.example` exists: **FOUND**
- `README.md` modified with installer section: **FOUND**
- Commit `980a8f2` (Task 1): **FOUND in worktree git log**
- Commit `c6b7341` (Task 2): **FOUND in worktree git log**
- Commit `bb6abcd` (Task 3): **FOUND in worktree git log**
- No file under `typescript-rules/`, `jsdoc-standards/`, or `workflow-toolkit/`
  changed by these three commits: **VERIFIED** (`git diff HEAD~3..HEAD --
  typescript-rules jsdoc-standards workflow-toolkit` is empty).
- `bash scripts/build-marketplace.sh` still succeeds: **VERIFIED** (injects 3
  plugins into `marketplace.html`).
