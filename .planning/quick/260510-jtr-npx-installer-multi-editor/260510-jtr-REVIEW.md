---
phase: 260510-jtr-npx-installer-multi-editor
reviewed: 2026-05-10T00:00:00Z
depth: quick
files_reviewed: 13
files_reviewed_list:
  - .github/workflows/publish.yml
  - .gitignore
  - .npmrc.example
  - README.md
  - bin/install.mjs
  - package.json
  - src/installer/conflicts.mjs
  - src/installer/copy.mjs
  - src/installer/gitignore.mjs
  - src/installer/marketplace.mjs
  - src/installer/prompts.mjs
  - src/installer/summary.mjs
  - src/installer/targets.mjs
findings:
  blocker: 1
  critical: 0
  warning: 7
  info: 6
  total: 14
status: issues_found
---

# Quick Task 260510-jtr: Code Review Report

**Reviewed:** 2026-05-10
**Depth:** quick
**Files Reviewed:** 13
**Status:** issues_found

## Summary

The installer is small, well-scoped, and uses safe primitives (no shell-out, no
eval, no user-supplied paths leaking into reads or writes outside the
editor/scope-derived target root). Security posture is reasonable: no
path-traversal vector from user input, no prompt-injection surface, the CI
publish workflow uses minimal `GITHUB_TOKEN` permissions, and the only network
trust is npm's existing transport. Single dependency footprint.

That said, the review surfaced one BLOCKER in `gitignore.mjs` (silent no-op
when existing markers are malformed/reversed), several WARNINGs around
edge-case handling (dry-run still mutates conflict-prompt state, README
mismatch with conflict-prompt behavior, marker-pair regex doesn't validate
order, summary path leak in skip-counter when source is missing), and a few
INFO items about defensive cleanups.

## Blockers

### BL-01: `upsertGitignoreBlock` silently fails when markers are present but unmatchable

**File:** `src/installer/gitignore.mjs:52-58`
**Issue:** The conditional `if (existing.includes(BEGIN) && existing.includes(END))` enters the "replace in place" branch as long as both substrings appear anywhere in the file. The non-greedy regex then requires `BEGIN ... END` in that order. If a user has a malformed `.gitignore` (e.g., the user manually rearranged or duplicated the block, leaving `END` before `BEGIN`, or two `BEGIN`s and one `END`), `String.prototype.replace` with a non-matching regex returns the input unchanged. `next` then equals `existing` (modulo a trailing newline), so the file is rewritten with **no block added** and **no error thrown**. The installer reports success while the gitignore is unchanged — the project-local install is silently un-ignored.

Reproduction: a `.gitignore` containing
```
# <<< AI-Devkit
foo
# >>> AI-Devkit
```
will trip the `.includes()` check, fail the regex, and produce no diff.

**Fix:** Verify the regex actually matched, and fall through to append behavior if it didn't. Also anchor markers to line starts to avoid matching them inside other content.

```javascript
let next;
const re = new RegExp(
  `^${escapeRegex(BEGIN)}\\n[\\s\\S]*?^${escapeRegex(END)}$`,
  "m",
);
if (re.test(existing)) {
  next = existing.replace(re, blockText);
} else {
  const trimmed = existing.replace(/\s+$/u, "");
  next = trimmed.length === 0 ? `${blockText}\n` : `${trimmed}\n\n${blockText}\n`;
}
```

## Warnings

### WR-01: README claims "first conflict only" but every non-remembered conflict re-asks the remember toggle

**File:** `README.md:48-49` and `src/installer/conflicts.mjs:43-51`
**Issue:** README states "The first conflict offers a 'remember for this run' toggle". The implementation actually asks the remember toggle on **every** conflict prompt where `state.remembered` is still null — i.e., on every conflict where the user previously declined to remember. This is a behavior/doc mismatch; users who decline once will be re-asked indefinitely.
**Fix:** Either (a) update the README to "every conflict offers a remember toggle until you accept it" or (b) introduce `state.askedRemember = true` once asked, so the toggle only appears once.

### WR-02: Dry-run still triggers interactive conflict prompts

**File:** `src/installer/copy.mjs:90-115` (interaction with `:117-121`)
**Issue:** In `--dry-run`, the code still calls `resolveConflict()` for every existing destination and can throw `ABORT_SENTINEL`, mutating control flow on what is supposed to be a read-only preview. The dry-run output therefore depends on what the user clicked in interactive prompts, and a dry-run can be "aborted" before showing the full would-write set. This contradicts the help text ("Print every file that would be written, without touching disk.") because the answer depends on synchronous user input.
**Fix:** In `dryRun` mode, skip the `resolveConflict` call entirely and annotate the dry-run line as `would write (overwrites existing)` so the user sees the conflict count without being prompted.

```javascript
if (existing && !dryRun) {
  const action = await resolveConflict({ ... });
  // ...
}
if (dryRun) {
  log.info(`would write${existing ? " (overwrites existing)" : ""}: ${entry.dest}`);
  result.written.push(entry.dest);
  continue;
}
```

### WR-03: Conflict prompt shows misleading "new 0B" when source stat fails

**File:** `src/installer/copy.mjs:91-97`
**Issue:** If `fs.statSync(entry.src)` throws (catch is empty), `newSize` stays at `0`. The prompt then reads "existing 1234B, new 0B", suggesting the new file is empty when the read simply failed. Users may incorrectly choose `overwrite` thinking they'll truncate, or `skip` thinking the new content is empty.
**Fix:** On stat failure, label as unknown size instead of zero.

```javascript
let newSize = null;
try { newSize = fs.statSync(entry.src).size; } catch {}
// ...
const sizeLabel = newSize === null ? "unknown" : `${newSize}B`;
```
And change the prompt message in `conflicts.mjs` to handle a `null` `newSize`.

### WR-04: `targetRoot.startsWith` prefix check is path-substring, not path-boundary

**File:** `src/installer/copy.mjs:136`
**Issue:** `entry.dest.startsWith(targetRoot)` is a raw string-prefix compare. If `targetRoot = "/home/user/.claude"` and a sibling directory `/home/user/.claude-backup/...` were ever produced (it isn't today, but the guard exists for defense in depth), the check would silently match. Should compare path segments.
**Fix:** `entry.dest === targetRoot || entry.dest.startsWith(targetRoot + path.sep)`.

### WR-05: `entry.dest` listed as Skipped path is misleading for editor-incapability skips

**File:** `src/installer/targets.mjs:171-185` and `src/installer/copy.mjs:71-74`
**Issue:** When a file is `skipped` because the editor lacks the capability (Cursor agents, OpenCode hooks), the code still calls `resolveDestination` and stores a `dest` path. The summary then prints `Skipped: <some/dest/that/never/would/be/touched>`. For OpenCode hook scripts the `dest` is computed as if the editor consumed them, which is confusing — the user may believe the installer was about to touch that path.
**Fix:** Either skip the `resolveDestination` call for incapability-skipped entries and report the source path with the plugin name instead, or annotate the summary line with the reason inline (the reason is shown — but the path looks like a real install target, which it isn't).

### WR-06: Project-local skipped files are not re-added to the gitignore block

**File:** `bin/install.mjs:88-104`
**Issue:** Only `result.written` feeds `upsertGitignoreBlock`. On a re-run where the user picks `skip` for files that already exist (the default), those files are not added to the `.gitignore` block. If the previous install was via project-local and the block was lost (manual edit, branch switch, etc.), running the installer again with default `skip` results in an empty/incomplete block — the user thinks files are gitignored, but they're not.
**Fix:** Compute `repoRelEntries` from `[...result.written, ...result.skipped.filter(s => s.reason.startsWith("already exists"))]`. Skipped-because-incapability entries should remain excluded.

### WR-07: `package.json` has no `repository.directory` and no top-level `homepage`/`bugs`, but `publishConfig.access: "public"` is silently overridden by GitHub Packages

**File:** `package.json:22-25`
**Issue:** GitHub Packages **ignores** `publishConfig.access` — visibility is governed by the package's settings on github.com, not the manifest. Leaving `"access": "public"` in `publishConfig` gives a false sense that the manifest is controlling visibility. Not a security bug, but it has misled at least one operator into believing a package was public when it wasn't.
**Fix:** Remove the `access` field, and document in the README that visibility is set in GitHub package settings UI.

## Info

### IN-01: Hook-script chmod regex is anchored with `/\.sh$/` but doesn't strip BOM/permissions of non-`.sh` executables

**File:** `src/installer/copy.mjs:126-132`
**Issue:** Plugins could ship `hooks/scripts/foo.py` or `hooks/scripts/foo` (no extension) as executable hooks. They'll be copied without `+x`. Today all hooks are `.sh`, so this is documentation-of-current-behavior, not a bug.
**Fix:** If non-shell hook scripts ever ship, swap the test for "any file under `hooks/scripts/`" and respect the source mode.

### IN-02: `enforceNodeVersion` runs after top-level imports

**File:** `bin/install.mjs:13-22, 49-50`
**Issue:** `import` statements are evaluated before `main()` runs. If a user is on Node 18 and `@clack/prompts` or any imported `.mjs` uses a Node 20-only API at module top level, the friendly version error never prints — the user sees a stack trace from the import phase. Today the imports look safe, but the "friendly check" is one upgrade-of-a-dep away from being bypassed.
**Fix:** Move the version check into a tiny `bin/preflight.cjs` or `bin/install.mjs` body that does `process.versions.node` parsing before `await import("../src/installer/...")`. Lazy-import the rest.

### IN-03: `path.relative` filter on Windows can leak absolute paths past the `..` check

**File:** `bin/install.mjs:90-93`
**Issue:** On Windows, `path.relative("C:\\users\\foo", "D:\\bar")` returns `D:\\bar` (absolute), which does not start with `..`. If the user's `cwd` and `home` are on different drives and the project-local target somehow involves `home` (it doesn't today, since project-local is always under `cwd`), the filter would incorrectly include an absolute Windows path in the gitignore block.
**Fix:** Add `&& !path.isAbsolute(rel)` to the filter chain.

### IN-04: Conflict prompt's `initialValue: "skip"` plus `isCancel` returning `"abort"` is sensible, but the Ctrl-C semantics differ between `select` and `confirm`

**File:** `src/installer/conflicts.mjs:32-47`
**Issue:** Cancelling the **action** select returns `"abort"` (treated as abort by `copy.mjs`). Cancelling the **remember-toggle** confirm also returns `"abort"`, even though the user already chose an action. This means Ctrl-C on the remember prompt aborts the install and discards the action they just selected. Surprising.
**Fix:** Treat `isCancel(remember)` as "don't remember, but proceed with the chosen action": `if (isCancel(remember)) return action;`.

### IN-05: `existing.includes(BEGIN)` does not match line-anchored markers, so `# >>> AI-Devkit` appearing inside another comment trips replacement mode

**File:** `src/installer/gitignore.mjs:52`
**Issue:** If a user has `# Avoid the # >>> AI-Devkit block stuff` as a literal comment, the substring check will succeed. Combined with BL-01's regex matching, the comment block could be partially clobbered. Low likelihood, but the markers should be matched line-anchored to be safe.
**Fix:** Use `re.test(existing)` directly with line-anchored regex (see BL-01 fix); drop the `.includes` shortcut.

### IN-06: `engines.node` check is `>=20.11.0`, but `fs.readdirSync({ recursive: true, withFileTypes: true })` requires Node `20.1.0+` and `entry.parentPath` was added in `20.12.0`

**File:** `package.json:9-11`, `src/installer/targets.mjs:99-118`
**Issue:** The fallback to `entry.path` (deprecated) means `targets.mjs` works on 20.11, but stable behavior is on 20.12+. The engines floor matches the documented Node LTS at the time of the spec, so this is benign — flagged for future-proofing only.
**Fix:** Bump `engines.node` to `>=20.12.0` next time the floor moves, or drop the `entry.path` fallback.

---

_Reviewed: 2026-05-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: quick_
