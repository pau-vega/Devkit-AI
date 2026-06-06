---
phase: quick-260510-jtr
plan: 01
type: execute
wave: 1
depends_on: []
quick_id: 260510-jtr
files_modified:
  - package.json
  - .npmrc.example
  - bin/install.mjs
  - src/installer/marketplace.mjs
  - src/installer/targets.mjs
  - src/installer/conflicts.mjs
  - src/installer/copy.mjs
  - src/installer/gitignore.mjs
  - src/installer/prompts.mjs
  - src/installer/summary.mjs
  - .github/workflows/publish.yml
  - .gitignore
  - README.md
autonomous: false
requirements:
  - quick-260510-jtr
user_setup:
  - service: github-packages
    why: "Publishing the installer to GitHub Packages requires repo packages permissions; consumers need a PAT with read:packages to install via the scoped registry."
    env_vars:
      - name: GITHUB_TOKEN
        source: "Auto-injected by GitHub Actions in publish workflow; no manual setup needed for CI."
    dashboard_config:
      - task: "Cut a tagged release on GitHub to trigger publish workflow"
        location: "GitHub repo -> Releases -> Draft a new release -> publish a v1.0.0 tag"
      - task: "(Consumer) Create a classic PAT with read:packages scope and add to ~/.npmrc"
        location: "github.com/settings/tokens (classic) -> generate -> append to ~/.npmrc as documented in README"

must_haves:
  truths:
    - "User can run `npx @pau-vega/Devkit-AI` (after .npmrc auth) and reach an interactive prompt"
    - "User can run `npx github:pau-vega/Devkit-AI` with zero auth and reach the same prompt"
    - "User can pick editor (Claude Code | Cursor | OpenCode) and scope (project | project-local | user)"
    - "User can multi-select plugins with all three pre-checked; empty selection aborts cleanly"
    - "Installer reads `.claude-plugin/marketplace.json` to enumerate plugins (no hard-coded plugin list)"
    - "Per-file conflict prompt offers overwrite | skip | abort with default skip and a remember-for-this-run toggle"
    - "Ctrl-C at any prompt aborts before any file is written (zero partial-write state)"
    - "Project-local scope appends a delimited block to `.gitignore` listing every installed file"
    - "OpenCode hooks and Cursor agents are skipped with a clear info message in the final summary"
    - "Tagging a release on GitHub triggers `.github/workflows/publish.yml` and ships the package to GitHub Packages"
    - "Dry-run flag (`--dry-run`) prints what would be written without touching the filesystem"
  artifacts:
    - path: "package.json"
      provides: "Package manifest with bin entry, files allowlist, publishConfig.registry, engines.node>=20.11.0"
      contains: "@pau-vega/Devkit-AI"
    - path: "bin/install.mjs"
      provides: "Installer entry point with shebang"
      min_lines: 40
    - path: "src/installer/marketplace.mjs"
      provides: "Reads .claude-plugin/marketplace.json and returns plugin list"
      exports: ["readMarketplace", "listPlugins"]
    - path: "src/installer/targets.mjs"
      provides: "Per-editor + per-scope target-path resolution and source-to-target file mapping"
      exports: ["resolveTargetRoot", "mapPluginFiles"]
    - path: "src/installer/conflicts.mjs"
      provides: "Per-file conflict prompt with remember-for-this-run state"
      exports: ["resolveConflict"]
    - path: "src/installer/copy.mjs"
      provides: "fs.cp wrapper that respects conflict resolution and dry-run mode"
      exports: ["copyPluginFiles"]
    - path: "src/installer/gitignore.mjs"
      provides: "Idempotent delimited-block management of .gitignore for project-local scope"
      exports: ["upsertGitignoreBlock"]
    - path: "src/installer/prompts.mjs"
      provides: "@clack/prompts flow: editor -> scope -> plugins, with isCancel guards"
      exports: ["runPromptFlow"]
    - path: "src/installer/summary.mjs"
      provides: "Final summary printer (written / skipped / errors / next steps)"
      exports: ["printSummary"]
    - path: ".github/workflows/publish.yml"
      provides: "Tagged-release publish workflow targeting GitHub Packages"
      contains: "registry-url: 'https://npm.pkg.github.com'"
    - path: ".npmrc.example"
      provides: "Consumer-facing scoped registry config (with placeholder token)"
      contains: "@pau-vega:registry=https://npm.pkg.github.com"
    - path: "README.md"
      provides: "Install instructions for both auth path and zero-auth `npx github:` fallback, plus what gets written where, plus known limitations (OpenCode hooks, Cursor agents, project-local gitignore behavior)"
      min_lines: 60
  key_links:
    - from: "bin/install.mjs"
      to: "src/installer/prompts.mjs"
      via: "import runPromptFlow"
      pattern: "import.*runPromptFlow.*prompts"
    - from: "src/installer/prompts.mjs"
      to: "@clack/prompts"
      via: "named imports (intro, outro, select, multiselect, confirm, isCancel, cancel, log, note, spinner)"
      pattern: "from ['\"]@clack/prompts['\"]"
    - from: "src/installer/marketplace.mjs"
      to: ".claude-plugin/marketplace.json"
      via: "fs.readFile + JSON.parse, path resolved from PACKAGE_ROOT"
      pattern: "marketplace\\.json"
    - from: "src/installer/copy.mjs"
      to: "src/installer/conflicts.mjs"
      via: "import resolveConflict"
      pattern: "resolveConflict"
    - from: "src/installer/copy.mjs"
      to: "src/installer/targets.mjs"
      via: "import mapPluginFiles, resolveTargetRoot"
      pattern: "mapPluginFiles|resolveTargetRoot"
    - from: ".github/workflows/publish.yml"
      to: "package.json"
      via: "npm publish using publishConfig.registry"
      pattern: "npm publish"
    - from: "package.json"
      to: "bin/install.mjs"
      via: "bin field"
      pattern: "\"bin\""
    - from: "src/installer/gitignore.mjs"
      to: ".gitignore"
      via: "fs.readFile + delimiter-marker write"
      pattern: ">>> Devkit-AI"
---

<objective>
Ship an `npx @pau-vega/Devkit-AI` installer that copies the three plugins (`typescript-rules`, `jsdoc-standards`, `workflow-toolkit`) from this repo into a user's chosen editor (Claude Code, Cursor, OpenCode) at a chosen scope (project, project-local, user-global), with `@clack/prompts` UX, per-file conflict handling, dry-run mode, and a CI publish workflow targeting GitHub Packages.

Purpose: Make these plugins one-command installable across the three editors the project supports, without forcing users to clone the repo or learn each editor's plugin layout. Enables the Phase 4 "Marketplace UI and Install Docs" outcome via a quick task slice.

Output: A runnable installer (`npx @pau-vega/Devkit-AI` and `npx github:pau-vega/Devkit-AI`), a publish workflow, and README docs. No edits to the existing plugin sources.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/quick/260510-jtr-npx-installer-multi-editor/260510-jtr-CONTEXT.md
@.planning/quick/260510-jtr-npx-installer-multi-editor/260510-jtr-RESEARCH.md
@.claude-plugin/marketplace.json
@scripts/build-marketplace.sh
@.gitignore
@CLAUDE.md

<interfaces>
<!-- Source-of-truth shapes the executor must use. Do not re-derive. -->

`.claude-plugin/marketplace.json` shape (relevant fields):
```json
{
  "name": "Devkit-AI",
  "plugins": [
    { "name": "typescript-rules", "source": "./typescript-rules", "version": "1.0.0", ... },
    { "name": "jsdoc-standards",  "source": "./jsdoc-standards",  "version": "0.1.0", ... },
    { "name": "workflow-toolkit", "source": "./workflow-toolkit", "version": "0.1.0", ... }
  ]
}
```
The installer enumerates plugins via `plugins[].name` + `plugins[].source` only. Do not hard-code names.

Plugin source layout (uniform across all three plugins):
```
<plugin>/
  .claude-plugin/plugin.json
  agents/*.md           (typescript-rules, jsdoc-standards only — none in workflow-toolkit)
  commands/*.md
  hooks/hooks.json + hooks/scripts/*.sh   (typescript-rules, jsdoc-standards only)
  skills/<skill-name>/SKILL.md            (+ optional references/*.md)
```

Editor target-path table (authoritative — from RESEARCH.md §3):
```
Claude Code:
  project       -> <cwd>/.claude/{skills,commands,agents,hooks}/
  project-local -> <cwd>/.claude/{skills,commands,agents,hooks}/  + .gitignore block
  user          -> ~/.claude/{skills,commands,agents,hooks}/

Cursor:
  project       -> <cwd>/.cursor/{commands,rules,skills/<plugin>/<skill>/SKILL.md,hooks.json,hooks/}
  project-local -> <cwd>/.cursor/...                                + .gitignore block
  user          -> ~/.cursor/{hooks.json,hooks/,commands/,rules/,skills/}   (warn: only hooks confirmed)
  agents        -> SKIP for all scopes (no portable agent file)

OpenCode:
  project       -> <cwd>/.opencode/{commands,agents,skills,plugins}/
  project-local -> <cwd>/.opencode/...                                + .gitignore block
  user          -> ~/.config/opencode/{commands,agents,skills,plugins}/
  hooks.json    -> SKIP for all scopes (not supported; print info)
```

Cursor namespacing for skills (precedent in scripts/build-marketplace.sh:295-328):
```
typescript-rules/skills/typescript-conventions/SKILL.md
  -> .cursor/skills/typescript-rules/SKILL.md
jsdoc-standards/skills/jsdoc-conventions/SKILL.md
  -> .cursor/skills/jsdoc-standards/SKILL.md
workflow-toolkit/skills/<name>/SKILL.md
  -> .cursor/skills/workflow-toolkit/<name>/SKILL.md
```
For Claude Code and OpenCode, preserve the source skill directory name (no plugin-name namespacing).

`@clack/prompts` API surface used (from RESEARCH.md §4):
```js
import { intro, outro, cancel, isCancel, select, multiselect, confirm, log, note, spinner } from "@clack/prompts";
```
Cancellation rule: every prompt return value passes through `isCancel(value)`; on cancel, call `cancel("Cancelled.")` then `process.exit(0)`. All prompts complete before any filesystem write.

PACKAGE_ROOT resolution inside `bin/install.mjs`:
```js
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
```

Conflict-prompt state shape:
```js
// Resolved per file unless `remember` is set; once `remember` is true, the chosen action applies for the rest of the run.
type ConflictAction = "overwrite" | "skip" | "abort";
type ConflictState  = { remembered: ConflictAction | null };
```

`.gitignore` block delimiters (per RESEARCH.md P8):
```
# >>> Devkit-AI
.claude/skills/typescript-conventions/SKILL.md
.claude/commands/ts-review.md
...
# <<< Devkit-AI
```
Idempotent: re-running the installer replaces the block in place; never appends duplicates.

Node engine floor: `>=20.11.0` — installer prints a friendly upgrade message and exits 1 if `process.versions.node` is below this (one-liner runtime check).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold package + publish workflow + .npmrc.example</name>
  <files>package.json, .npmrc.example, .github/workflows/publish.yml, .gitignore</files>
  <action>
Create the npm package shell that makes `npx @pau-vega/Devkit-AI` and `npx github:pau-vega/Devkit-AI` both work.

1. Write `package.json` at repo root with exactly these fields (per RESEARCH.md §1, §5):
   - `"name": "@pau-vega/Devkit-AI"` (scoped — required for GitHub Packages)
   - `"version": "1.0.0"`
   - `"description": "Install the Devkit-AI plugins (typescript-rules, jsdoc-standards, workflow-toolkit) into Claude Code, Cursor, or OpenCode."`
   - `"type": "module"`
   - `"bin": { "Devkit-AI": "bin/install.mjs" }`
   - `"engines": { "node": ">=20.11.0" }`
   - `"files": ["bin/", "src/", "typescript-rules/", "jsdoc-standards/", "workflow-toolkit/", ".claude-plugin/marketplace.json", "README.md", "LICENSE"]`
   - `"publishConfig": { "registry": "https://npm.pkg.github.com", "access": "public" }`
   - `"repository": { "type": "git", "url": "git+https://github.com/pau-vega/Devkit-AI.git" }`
   - `"dependencies": { "@clack/prompts": "^0.10.0" }` (no other runtime deps)
   - `"scripts": { "pack:dry": "npm pack --dry-run" }` (sanity tool only — do not add a `prepublishOnly`)
   - `"author": "Pau Velasco Garrofe"`
   - `"license": "MIT"` (only declare; do not generate a LICENSE file unless one already exists; do NOT block on it)

   Do NOT add devDependencies, build steps, TypeScript, eslint config, or test runner — project has no test runner per constraints.

2. Write `.npmrc.example` at repo root containing exactly:
   ```
   @pau-vega:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```
   Document in a leading comment line (`# Copy to ~/.npmrc and replace ${GITHUB_TOKEN} with a classic PAT scoped to read:packages`).

3. Write `.github/workflows/publish.yml` matching RESEARCH.md §2 exactly: trigger on `release: [published]`, permissions `contents: read` + `packages: write`, steps `actions/checkout@v6` -> `actions/setup-node@v4` with `node-version: '20.x'`, `registry-url: 'https://npm.pkg.github.com'`, `scope: '@pau-vega'` -> `npm pack --dry-run` (sanity log) -> `npm publish` with `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`. No `npm ci` — there are no production deps to install pre-publish (the consumer installs them at npx-time).

4. Update `.gitignore` to add (in this order, preserving existing entries):
   ```
   # npm
   package-lock.json
   .npmrc
   *.tgz
   ```
   Rationale: we ship no committed lockfile (no production deps to lock at publish-time beyond `@clack/prompts`, and consumers resolve their own); `.npmrc` may contain real tokens locally; `*.tgz` covers `npm pack` artifacts. Do NOT remove any existing entries.

   NOTE: `package-lock.json` exclusion is intentional per project pattern (no test runner, no lockfile committed). If `npm install` is run locally for testing, the resulting lockfile is gitignored — this matches the no-build-step ethos in CLAUDE.md.

Reasoning on choices (locked decisions from CONTEXT.md, do not revisit):
- GitHub Packages registry per CONTEXT.md "Distribution + invocation form".
- Scoped name `@pau-vega/Devkit-AI` per CONTEXT.md.
- `@clack/prompts` per CONTEXT.md "CLI UX".
- `>=20.11.0` per RESEARCH.md §1 + P4 (May 2026, Node 18 EOL).
  </action>
  <verify>
    <automated>
      node -e "const p=require('./package.json');if(p.name!=='@pau-vega/Devkit-AI')process.exit(1);if(!p.bin||!p.bin['Devkit-AI'])process.exit(1);if(!p.publishConfig||p.publishConfig.registry!=='https://npm.pkg.github.com')process.exit(1);if(!p.engines||!p.engines.node.startsWith('>=20'))process.exit(1);if(!p.dependencies||!p.dependencies['@clack/prompts'])process.exit(1);if(!Array.isArray(p.files)||!p.files.includes('bin/')||!p.files.includes('typescript-rules/'))process.exit(1);console.log('OK')" && \
      grep -q "registry-url: 'https://npm.pkg.github.com'" .github/workflows/publish.yml && \
      grep -q "NODE_AUTH_TOKEN" .github/workflows/publish.yml && \
      grep -q "@pau-vega:registry=https://npm.pkg.github.com" .npmrc.example && \
      grep -v '^#' .gitignore | grep -q "^\.npmrc$" && \
      grep -v '^#' .gitignore | grep -q "^package-lock\.json$"
    </automated>
  </verify>
  <done>
    `package.json`, `.npmrc.example`, `.github/workflows/publish.yml` exist with the exact fields specified; `.gitignore` extended with npm-related entries; no LICENSE file invented; no test runner added.
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement installer CLI (bin + 7 src/installer modules)</name>
  <files>bin/install.mjs, src/installer/marketplace.mjs, src/installer/targets.mjs, src/installer/conflicts.mjs, src/installer/copy.mjs, src/installer/gitignore.mjs, src/installer/prompts.mjs, src/installer/summary.mjs</files>
  <action>
Build the installer. ESM, no TypeScript, no bundler. One file per concern; `bin/install.mjs` is glue only.

1. **`bin/install.mjs`** — entry. Order:
   - Line 1: `#!/usr/bin/env node` (must be the first line; no blank line before it).
   - Resolve `PACKAGE_ROOT` via `fileURLToPath(import.meta.url)` + `path.resolve(__dirname, "..")`.
   - Runtime Node version check: parse `process.versions.node`; if `<20.11.0`, log `Node >=20.11.0 required (you have ${process.versions.node}). Upgrade and retry.` and `process.exit(1)`.
   - Parse argv: support `--dry-run`, `--help`, `--version` only (no other flags). For `--help`, print short usage and exit 0. For `--version`, print version from package.json (read once via fs) and exit 0.
   - Call `runPromptFlow({ packageRoot, dryRun })` from `prompts.mjs` to get `{ editor, scope, plugins }` (or exit code if cancelled).
   - Call `copyPluginFiles({ ... })` from `copy.mjs`.
   - If scope is `project-local`, call `upsertGitignoreBlock(...)` from `gitignore.mjs`.
   - Call `printSummary(...)` from `summary.mjs`.
   - Wrap top-level in `try/catch`; on uncaught, log `error.message` (not the stack) and exit 1. Do NOT print `node:` internal stacks to users.

2. **`src/installer/marketplace.mjs`** — read `${PACKAGE_ROOT}/.claude-plugin/marketplace.json`. Export:
   - `readMarketplace(packageRoot)` -> parsed JSON object.
   - `listPlugins(packageRoot)` -> array of `{ name, source, version, displayName }`.
   Throw a descriptive error if the file is missing or malformed (`Marketplace manifest not found at <path>; the installer package may be corrupted.`).

3. **`src/installer/targets.mjs`** — pure functions, no I/O. Export:
   - `resolveTargetRoot({ editor, scope, cwd, home })` -> absolute path string. Logic per the table in `<interfaces>`. Use `path.join`, `os.homedir()`. For Cursor/OpenCode user scope, log a `note` (caller will pass logger; or just return an extra `warnings: string[]` on a result object — your choice, document in the export).
   - `mapPluginFiles({ editor, scope, pluginName, pluginSourceDir, targetRoot })` -> array of `{ src, dest, kind, skipped?, skipReason? }` where `kind ∈ { "skill", "command", "agent", "hooks-json", "hook-script", "plugin-manifest" }`. The mapper applies the SKIP rules: `agent` for Cursor (all scopes), `hooks-json` + `hook-script` for OpenCode (all scopes); set `skipped: true` and a human-readable `skipReason`. The mapper also handles Cursor's plugin-name namespacing for skills (per the "Cursor namespacing" block in `<interfaces>`).
   - The mapper walks `<pluginSourceDir>` synchronously using `fs.readdirSync({ recursive: true, withFileTypes: true })`. Skip dot-directories and the `.claude-plugin/plugin.json` manifest itself (not consumed by Claude Code standalone, Cursor, or OpenCode targets).

4. **`src/installer/conflicts.mjs`** — interactive per-file conflict resolver. Export:
   - `resolveConflict({ targetPath, oldSize, newSize, state })` where `state = { remembered: null | "overwrite" | "skip" | "abort" }`. If `state.remembered` is set, return it without prompting. Else show the `select` prompt (RESEARCH.md §4 example), then a `confirm` "Apply this choice to all remaining conflicts?" prompt. If confirmed, mutate `state.remembered = action`. Return `action`.
   - Handle `isCancel` on both prompts -> treat as `"abort"`.

5. **`src/installer/copy.mjs`** — does the writes. Export:
   - `copyPluginFiles({ packageRoot, plugins, editor, scope, cwd, home, dryRun })` -> `{ written: string[], skipped: Array<{path, reason}>, errors: Array<{path, error}> }`.
   - Build the file list across all selected plugins via `mapPluginFiles`.
   - Iterate. For each non-skipped entry: stat the destination; if it exists, call `resolveConflict` (with shared `state` object). On `"abort"`, throw a sentinel `Error("ABORTED_BY_USER")` (caller exits 0 with cancelled message). On `"skip"`, push to skipped. On `"overwrite"` or fresh write: ensure parent dir (`fs.mkdirSync({ recursive: true })`), then `fs.copyFileSync(src, dest)`. For shell scripts under `hooks/scripts/`, `fs.chmodSync(dest, 0o755)` after copy on non-Windows (`os.platform() !== "win32"`).
   - When `dryRun` is true, do NO writes; instead, log each intended action via `log.info` and aggregate the same return shape (treating all as "would-write").
   - Catch per-file errors (EACCES etc.) and push to `errors` with a friendly message; do not let one bad file abort the whole run unless it's `EACCES` on the target root itself (then surface "permission denied; try a different scope or sudo").

6. **`src/installer/gitignore.mjs`** — idempotent block manager. Export:
   - `upsertGitignoreBlock({ cwd, entries })` where `entries` is `string[]` of repo-relative paths. Read `<cwd>/.gitignore` (create if missing). If a block delimited by `# >>> Devkit-AI` and `# <<< Devkit-AI` exists, replace its contents; else append. Trailing newline preserved. No duplicate entries within the block.

7. **`src/installer/prompts.mjs`** — the `@clack/prompts` flow. Export:
   - `runPromptFlow({ packageRoot, dryRun })` -> `{ editor, scope, plugins }` or `process.exit(0)` on cancel.
   - Order: `intro("Devkit-AI installer")` -> `select` editor -> `select` scope -> `multiselect` plugins (initialValues = all 3 names from `listPlugins`, `required: true`) -> after each, `if (isCancel(v)) { cancel("Cancelled."); process.exit(0); }`.
   - On empty plugin selection (post-required), show `cancel("No plugins selected. Nothing to install.")` and exit 0.
   - Print a confirmation `note` listing the resolved target root (call into `targets.mjs`) and the plugin count, then a `confirm` "Proceed?" -> if not confirmed, exit 0.
   - Do NOT do any filesystem writes here.

8. **`src/installer/summary.mjs`** — final printer. Export:
   - `printSummary({ written, skipped, errors, targetRoot, dryRun })` using `note` and `outro`.
   - Sections: "Written" (count + first 5 paths, "+ N more"), "Skipped" (per file, with reason), "Errors" (if any), "Next steps" (editor-specific: Claude Code -> "run `/reload-plugins` or restart Claude"; Cursor -> "restart Cursor"; OpenCode -> "restart OpenCode session"). For dry-run, prefix outro with "(dry-run — no files written)".
   - No emoji anywhere (per CLAUDE.md).

Constraints (recap):
- No emoji in CLI output (per project instructions).
- All prompts gated by `isCancel`; all writes happen AFTER the final `confirm`. Ctrl-C at any earlier point is a clean exit (per CONTEXT.md "no partial writes").
- Path handling via `path.join` only; user-home via `os.homedir()`. (RESEARCH.md P3.)
- Read plugin list from `marketplace.json` — never hard-code (per CONTEXT.md canonical_refs).
- For OpenCode hooks and Cursor agents, mark skipped with reason and surface in summary (per RESEARCH.md P6, P7).
- Honor existing repo conventions: warm/calm copy in prompts (no marketing language; declarative phrasing). Example: not "Awesome! Let's go!" — instead "Done." or "Cancelled."

Do NOT:
- Add unit tests (no test runner per constraints).
- Modify any file under `typescript-rules/`, `jsdoc-standards/`, `workflow-toolkit/`.
- Symlink anywhere — copies only (RESEARCH.md P2).
- Fetch anything over the network at runtime.
  </action>
  <verify>
    <automated>
      # 1) Files exist
      test -f bin/install.mjs && \
      test -f src/installer/marketplace.mjs && \
      test -f src/installer/targets.mjs && \
      test -f src/installer/conflicts.mjs && \
      test -f src/installer/copy.mjs && \
      test -f src/installer/gitignore.mjs && \
      test -f src/installer/prompts.mjs && \
      test -f src/installer/summary.mjs && \
      # 2) Shebang is line 1 of bin
      head -1 bin/install.mjs | grep -q "^#!/usr/bin/env node$" && \
      # 3) ESM imports exist
      grep -q "from ['\"]@clack/prompts['\"]" src/installer/prompts.mjs && \
      grep -q "fileURLToPath" bin/install.mjs && \
      # 4) Marketplace.json is read, not hard-coded plugin list
      grep -q "marketplace.json" src/installer/marketplace.mjs && \
      ! grep -q "typescript-rules.*jsdoc-standards.*workflow-toolkit" src/installer/marketplace.mjs && \
      # 5) Conflict actions present
      grep -E "overwrite|skip|abort" src/installer/conflicts.mjs > /dev/null && \
      grep -q "isCancel" src/installer/conflicts.mjs && \
      # 6) gitignore delimiter present
      grep -q ">>> Devkit-AI" src/installer/gitignore.mjs && \
      grep -q "<<< Devkit-AI" src/installer/gitignore.mjs && \
      # 7) targets.mjs has all three editors and three scopes referenced
      grep -q "claude" src/installer/targets.mjs && \
      grep -q "cursor" src/installer/targets.mjs && \
      grep -q "opencode" src/installer/targets.mjs && \
      grep -E "project-local|projectLocal" src/installer/targets.mjs > /dev/null && \
      # 8) Skip rules present
      grep -q "agents" src/installer/targets.mjs && \
      grep -q "hooks" src/installer/targets.mjs && \
      # 9) No emoji in CLI source (rough check — common emoji codepoints)
      ! grep -P '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' src/installer/*.mjs bin/install.mjs && \
      # 10) Module loads without crashing (smoke)
      node --input-type=module -e "import('./src/installer/marketplace.mjs').then(m=>{if(typeof m.readMarketplace!=='function')process.exit(1);if(typeof m.listPlugins!=='function')process.exit(1);console.log('marketplace OK')})" && \
      node --input-type=module -e "import('./src/installer/targets.mjs').then(m=>{if(typeof m.resolveTargetRoot!=='function')process.exit(1);if(typeof m.mapPluginFiles!=='function')process.exit(1);console.log('targets OK')})" && \
      node --input-type=module -e "import('./src/installer/gitignore.mjs').then(m=>{if(typeof m.upsertGitignoreBlock!=='function')process.exit(1);console.log('gitignore OK')})" && \
      # 11) listPlugins returns 3 plugins from marketplace.json
      node --input-type=module -e "import('./src/installer/marketplace.mjs').then(({listPlugins})=>{const p=listPlugins(process.cwd());if(p.length!==3)process.exit(1);if(!p.find(x=>x.name==='typescript-rules'))process.exit(1);if(!p.find(x=>x.name==='workflow-toolkit'))process.exit(1);console.log('listPlugins OK')})" && \
      # 12) bin --version works (after npm install of @clack/prompts dep)
      (test -d node_modules/@clack/prompts || npm install --no-audit --no-fund --silent @clack/prompts) && \
      node bin/install.mjs --version > /dev/null && \
      node bin/install.mjs --help > /dev/null
    </automated>
  </verify>
  <done>
    All 8 files exist; bin shebang on line 1; modules load and export their named symbols; `listPlugins` reads exactly 3 plugins from `marketplace.json` (no hard-coded list); `--version` and `--help` exit cleanly without prompting; OpenCode hooks + Cursor agents skip rules visible in `targets.mjs`; no emoji in CLI source.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update README with install instructions, scope/editor matrix, limitations</name>
  <files>README.md</files>
  <action>
Update (or create, if absent) `README.md` at repo root with an installer section. Tone: calm, precise, unassuming. No marketing copy. No emoji. Match the brand voice in CLAUDE.md.

Sections to include (add at top of README, above any existing plugin docs; preserve existing content below):

1. **Install (one-liner with auth)** — explains the `~/.npmrc` setup with classic PAT (`read:packages` scope only) and then `npx @pau-vega/Devkit-AI`. Quote the two-line `.npmrc` block exactly:
   ```
   @pau-vega:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=<your-classic-pat>
   ```

2. **Install (zero-auth fallback)** — `npx github:pau-vega/Devkit-AI`. State the trade-off: clones HEAD, no version pinning, slightly slower first run.

3. **What gets prompted** — one paragraph each on editor (3 options), scope (3 options), plugins (multi-select default-all), conflicts (per-file overwrite/skip/abort with remember toggle).

4. **Where files land** — small table with the same shape as the table in RESEARCH.md §3 but condensed: editor x scope -> target root. State that for project-local scope, the installer maintains a delimited block in `.gitignore`.

5. **Known limitations** — three bullet items:
   - OpenCode hooks are skipped (port not yet shipped — link to a future ticket if relevant).
   - Cursor agents are skipped (no portable agent file format in Cursor as of now).
   - Cursor user-global scope only ships hooks reliably; commands/rules/skills global support is not formally documented (assumption A2 in RESEARCH.md).

6. **Flags** — `--dry-run` (no writes, prints intended actions), `--help`, `--version`.

7. **Releasing (maintainer note)** — One paragraph: cut a tagged release on GitHub; `publish.yml` ships to GitHub Packages on `release: published`.

Constraints:
- No emoji (per CLAUDE.md).
- Code blocks fenced with triple backticks; language hint where applicable (`bash`, `text`, `yaml`).
- Wrap prose at ~100 cols where natural; no hard requirement.
- Do NOT delete or reorder existing README content; insert the installer section at the top.
- If `README.md` does not yet exist, create it with the installer section as the entire content; do not invent unrelated badges or table-of-contents.
  </action>
  <verify>
    <automated>
      test -f README.md && \
      grep -q "npx @pau-vega/Devkit-AI" README.md && \
      grep -q "npx github:pau-vega/Devkit-AI" README.md && \
      grep -q "@pau-vega:registry=https://npm.pkg.github.com" README.md && \
      grep -q "read:packages" README.md && \
      grep -qi "dry-run" README.md && \
      grep -qi "OpenCode" README.md && \
      grep -qi "Cursor" README.md && \
      grep -qi "Claude Code" README.md && \
      grep -qi "project-local" README.md && \
      grep -qi "gitignore" README.md && \
      ! grep -P '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' README.md
    </automated>
  </verify>
  <done>
    README.md exists, contains both install paths (auth + zero-auth fallback), the prompt flow description, the where-files-land matrix, the three limitations, the flags list, the maintainer release note. No emoji.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Smoke-test the installer against a temp directory</name>
  <what-built>An installer script (`bin/install.mjs`) wired through 7 modules, packaged for GitHub Packages publish via `.github/workflows/publish.yml`, with README docs.</what-built>
  <how-to-verify>
1. Install the dev dep so the bin can run locally:
   ```
   npm install --no-audit --no-fund @clack/prompts
   ```

2. Dry-run against a temp project directory (no writes should happen):
   ```
   mkdir -p /tmp/mm-smoke && cd /tmp/mm-smoke && \
   node ~/Documents/Devkit-AI/bin/install.mjs --dry-run
   ```
   Expected:
   - Prompted for editor, scope, plugins.
   - Pick: Claude Code -> project -> all three plugins -> proceed.
   - Output lists every file it would write under `/tmp/mm-smoke/.claude/...`.
   - No files actually appear under `/tmp/mm-smoke/.claude/` (verify with `ls -la /tmp/mm-smoke`).

3. Real run, project scope:
   ```
   cd /tmp/mm-smoke && node ~/Documents/Devkit-AI/bin/install.mjs
   ```
   - Pick Claude Code -> project -> all three plugins.
   - Verify `/tmp/mm-smoke/.claude/skills/typescript-conventions/SKILL.md` exists.
   - Verify `/tmp/mm-smoke/.claude/commands/` has the expected `.md` files.

4. Re-run for conflict path (same directory):
   ```
   node ~/Documents/Devkit-AI/bin/install.mjs
   ```
   - Same answers. Confirm per-file conflict prompt appears.
   - Pick `skip` + remember-for-this-run. Confirm subsequent files skip without prompting.
   - Final summary lists everything skipped.

5. Cancellation path:
   - Run again, hit Ctrl-C at the editor prompt. Verify clean exit, no errors, no new files.

6. Project-local scope check:
   ```
   rm -rf /tmp/mm-smoke && mkdir -p /tmp/mm-smoke && cd /tmp/mm-smoke && \
   git init -q && touch .gitignore && \
   node ~/Documents/Devkit-AI/bin/install.mjs
   ```
   - Pick Claude Code -> project-local -> all three plugins.
   - Verify `/tmp/mm-smoke/.gitignore` has a `# >>> Devkit-AI` ... `# <<< Devkit-AI` block listing every installed file.
   - Re-run; verify the block is REPLACED (not duplicated).

7. Skip-rule visibility:
   - Run for OpenCode -> project. Confirm summary mentions hooks were skipped (and why).
   - Run for Cursor -> project. Confirm summary mentions agents were skipped.

8. Confirm publish workflow at least parses:
   ```
   cd ~/Documents/Devkit-AI && \
   npm pack --dry-run | tee /tmp/pack-output.txt | tail -50
   ```
   - Output should list all files from `package.json#files`. Verify `typescript-rules/skills/typescript-conventions/SKILL.md` and similar appear.

If anything above fails or the prompt UX feels off (wrong defaults, unhelpful errors, surprising skips), describe the failure mode and I will iterate. If everything passes, type "approved".
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| consumer system -> npm registry | User downloads our package; npm verifies registry TLS + package integrity hash |
| npm package -> consumer filesystem | `bin/install.mjs` runs with user's permissions; can write anywhere they can |
| installer prompts -> filesystem | User-controlled input determines target paths and overwrite decisions |
| GitHub Actions -> GitHub Packages | `publish.yml` runs with `GITHUB_TOKEN` to publish |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-jtr-01 | Tampering | source plugin files in npm tarball | mitigate | `files` allowlist in package.json prevents accidental inclusion of `.env`, `.npmrc`, or other secrets; verified via `npm pack --dry-run` in CI before `npm publish` |
| T-jtr-02 | Spoofing | publish workflow | mitigate | Workflow restricted to `release: published` event (cannot trigger from PR); uses `GITHUB_TOKEN` (auto-rotated, repo-scoped) — not a long-lived PAT |
| T-jtr-03 | Information Disclosure | consumer `.npmrc` with PAT | accept | We instruct consumer to use a classic PAT scoped only to `read:packages`; the `.npmrc.example` uses `${GITHUB_TOKEN}` placeholder, never a real token; `.gitignore` excludes `.npmrc` to prevent commit of the consumer's real file. README explicitly tells consumers not to commit their token |
| T-jtr-04 | Tampering | installer writing to user filesystem (e.g., overwriting unrelated files) | mitigate | Per-file conflict prompt (overwrite/skip/abort) puts the user in control of every overwrite; default is `skip` so accidental overwrites require explicit consent. `targets.mjs` produces deterministic paths derived from a fixed editor x scope x plugin matrix — no untrusted input determines destinations |
| T-jtr-05 | Denial of Service | malformed `marketplace.json` corrupting installer | accept | The manifest is bundled with the installer, not user-supplied; corruption requires tampering with the package itself, which is covered by npm's integrity hash |
| T-jtr-06 | Elevation of Privilege | hook scripts executed at install time | mitigate | We do NOT execute any hook script at install time — we only `cp` them to disk and `chmod 0o755`. The editor invokes them later, which is its trust boundary not ours |
| T-jtr-07 | Repudiation | user runs installer, can't tell what changed | mitigate | Final summary lists every file written, every file skipped (with reason), and every error. `--dry-run` flag lets users preview without committing. `.gitignore` block has explicit delimiters for project-local scope |
| T-jtr-08 | Tampering | symlink-following npm publish | mitigate | RESEARCH.md P2: npm dereferences symlinks during publish, baking targets as regular files. We don't ship any symlinks in `files`, and the installer uses `fs.copyFile` (not `fs.symlink`) — both directions covered |
| T-jtr-09 | Information Disclosure | logging full PAT or homedir paths in errors | mitigate | Top-level `try/catch` in `bin/install.mjs` logs only `error.message`, not stack. Targets module uses `os.homedir()` and writes paths in summary, but homedir leakage to local stdout is acceptable (user's own machine) |
| T-jtr-10 | Spoofing | typosquat (`@pau-vegaa/...`, etc.) | accept | Out of installer scope; relies on GitHub Packages namespace being owned by `pau-vega`. README links should always go to the official scoped name |
</threat_model>

<verification>
The plan is complete when:
1. Task 1 verify-block passes (package shell + workflow + npmrc.example + .gitignore).
2. Task 2 verify-block passes (all 8 installer files load, `listPlugins` reads marketplace.json, `--version` and `--help` work).
3. Task 3 verify-block passes (README has both install paths and limitations).
4. Task 4 (human checkpoint) returns "approved" — covers actual prompt flow, conflict resolution, project-local gitignore management, skip-rule visibility, and `npm pack --dry-run` output.

No automated test runner — verification is structural (grep/grep-c, module-loading smoke checks) plus a human checkpoint that exercises the CLI against `/tmp`. This matches the project's no-test-runner constraint.
</verification>

<success_criteria>
- `node bin/install.mjs --help` and `--version` work without `npm install` of project-internal deps (only `@clack/prompts` needed).
- `npx github:pau-vega/Devkit-AI` (after pushing) runs the installer for a user with no auth setup. (Verified manually post-merge — not in this plan's verify chain since it requires a push.)
- `npm pack --dry-run` lists `bin/`, `src/`, all three plugin dirs, `.claude-plugin/marketplace.json`, `README.md` — and does NOT list `.planning/`, `node_modules/`, `.cursor/`, or `.claude/`.
- A user running the installer cold reaches the editor prompt within ~5 seconds.
- Project-local scope re-run is idempotent (gitignore block replaced, not duplicated).
- OpenCode hooks and Cursor agents always skip with a clear reason in the summary.
- No file under `typescript-rules/`, `jsdoc-standards/`, or `workflow-toolkit/` is modified by this plan.
- `scripts/build-marketplace.sh` still runs successfully (no path conflicts introduced).
</success_criteria>

<output>
After completion, append a brief entry to `.planning/STATE.md` under `## Quick Tasks` for `260510-jtr` (one row: date, ID, type "build", description "npx installer with multi-editor + multi-scope support shipped to GitHub Packages", outcome summary of files added).

No SUMMARY.md required (per quick-task convention) unless the executor wants to leave one in `.planning/quick/260510-jtr-npx-installer-multi-editor/` for posterity.
</output>
