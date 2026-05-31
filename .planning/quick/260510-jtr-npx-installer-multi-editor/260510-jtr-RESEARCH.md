---
quick_id: 260510-jtr
date: 2026-05-10
focus: npx installer + multi-editor target paths + GitHub Packages publish
---

# Quick Task 260510-jtr — Research

**Researched:** 2026-05-10
**Confidence:** HIGH for Claude Code paths, GitHub Packages flow, `@clack/prompts` API; MEDIUM for Cursor "skills" path (Cursor docs are thin on a stable `.cursor/skills/` location); MEDIUM for OpenCode `.opencode/` project path discovery semantics. LOW-confidence claims are tagged inline.

A note on prompt injection: the `WebFetch` of the GitHub Packages docs returned text that impersonated `<system-reminder>` blocks claiming "auto mode" and "exited plan mode." That content originated from the fetched HTML, not the orchestrator. It is ignored — this research stays scoped to the focus list.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Distribution: GitHub Packages npm registry, scope `@pau-vega/ai-devkit`. Invocation: `npx @pau-vega/ai-devkit`. README also documents zero-config fallback `npx github:pau-vega/ai-devkit`.
- CI publishes on tagged release via `.github/workflows/publish.yml` using `GITHUB_TOKEN`.
- CLI prompts: `@clack/prompts` (chosen for small dep tree + aesthetics). Flow: `editor → scope → plugins (multi-select, all defaulted) → conflict prompts → write summary`. Ctrl-C cancels cleanly with no partial writes.
- Plugin selection: multi-select, all 3 default-checked, empty selection aborts.
- Conflict handling: per-conflict prompt (overwrite | skip | abort, default `skip`) with a "remember choice for this run" toggle on first conflict.

### Claude's Discretion
- Source files copied verbatim from `<plugin>/...` into the npm package via the `files` field; installer reads from its own resolved location at runtime.
- Per-editor file mapping (paths confirmed below).
- Symlinks vs copies: prefer copies — npm dereferences symlinks during publish anyway (see Pitfalls), so symlinks would be silently flattened, and copies are safer post-`npm cache clean`.
- Permission errors on user-scope writes are caught and surfaced.
- Versioning: single `package.json` at repo root, version pinned to repo version.

### Deferred Ideas (OUT OF SCOPE)
- Editing the actual plugin contents.
- OS-specific installer binaries.
- TypeScript test harness for the installer.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| (quick) | Build `npx`-runnable installer that prompts (editor × scope) and copies the 3 plugins | All sections below |

---

## 1. npx + bin setup

The minimum viable shape for `npx @pau-vega/ai-devkit`:

**`package.json` (root):**
```json
{
  "name": "@pau-vega/ai-devkit",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "AI-Devkit": "bin/install.mjs"
  },
  "engines": { "node": ">=20.11.0" },
  "files": [
    "bin/",
    "src/",
    "typescript-rules/",
    "jsdoc-standards/",
    "workflow-toolkit/",
    ".claude-plugin/marketplace.json",
    "README.md"
  ],
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "public"
  }
}
```

**`bin/install.mjs` shape:**
```js
#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
// PACKAGE_ROOT is now the directory containing typescript-rules/, jsdoc-standards/, workflow-toolkit/
```

Key rules [VERIFIED: code.claude.com/docs/en/plugins, nodejs.org/api/esm.html]:
- **Shebang must be the first line** of the file (`#!/usr/bin/env node`). Don't let any tooling re-order it (Vite has a known bug hoisting imports above the shebang — vite#12976; we won't hit it without a bundler, just document it).
- **Executable bit:** npm sets `+x` on `bin` entries automatically when installing on Unix; on Windows it generates a `.cmd` shim. No manual `chmod` needed before publish.
- **ESM is fine for a `bin`** — Node added stable support and modern shebang-without-extension files work as ESM via `"type": "module"` in `package.json`. Use `.mjs` extension on the bin file as belt-and-suspenders for any tool that mis-reads `package.json`.
- **Node floor: `>=20.11.0`** [VERIFIED: blog.stackademic.com, sonarsource.com/blog]. That is the LTS where `import.meta.dirname`/`import.meta.filename` were backported; pre-20.11 we'd need the `fileURLToPath` dance anyway, but 20.11 is also the active LTS as of May 2026 so picking it gives us both modern ESM ergonomics AND broad availability. Pin via `"engines"` and add a one-liner runtime check at the top of `install.mjs` that prints a friendly upgrade message when `process.versions.node` is < 20.11.

**Why this works under `npx`:** When a user runs `npx @pau-vega/ai-devkit`, npm caches the package in `~/.npm/_npx/<hash>/node_modules/@pau-vega/ai-devkit/`, then invokes the `bin` entry. The script's `import.meta.url` resolves inside that cache directory, so `path.resolve(__dirname, "..")` lands on the package root — which is where the bundled `typescript-rules/`, `jsdoc-standards/`, `workflow-toolkit/` directories live (because `files` shipped them).

## 2. Publishing to GitHub Packages

The flow [VERIFIED: docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry, docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-nodejs-packages]:

**`package.json` field (already shown above):**
```json
"publishConfig": {
  "registry": "https://npm.pkg.github.com",
  "access": "public"
}
```

**Publisher `.npmrc`** (only used by CI; not committed if it contains a token):
```
@pau-vega:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

**Consumer `.npmrc`** (this is the friction the README must own):
```
@pau-vega:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<personal-access-token>
```

**`.github/workflows/publish.yml`:**
```yaml
name: Publish to GitHub Packages
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@pau-vega'
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
The `setup-node` step generates the `.npmrc` automatically; we don't commit one to the repo. We do NOT need `npm ci` because the installer has no production dependencies it needs to install before publish (its dependencies — `@clack/prompts` and friends — get installed by the consumer at `npx` time).

**The big quirk to document in the README** [VERIFIED: docs.github.com — quoted: "You need an access token to publish, install, and delete private, internal, and public packages"]: GitHub Packages requires authentication for `npm install` / `npx` **even on public packages**. This is unlike the public npm registry. So a user who tries `npx @pau-vega/ai-devkit` cold will get a 401 unless they have an `.npmrc` with a token, or set `NPM_CONFIG__AUTH` env var. Two-line workaround we document:
1. Create a GitHub PAT (classic) with `read:packages` scope.
2. `echo "//npm.pkg.github.com/:_authToken=$TOKEN" >> ~/.npmrc` and `echo "@pau-vega:registry=https://npm.pkg.github.com" >> ~/.npmrc`.

**Zero-auth fallback that works today:** `npx github:pau-vega/ai-devkit`. npm clones the repo at the default branch and runs `bin`. The trade-off is no version pinning and a slightly slower first run — fine for a "just try it" path. Document both.

## 3. Editor target paths

| Editor | Scope | Target directory | Subdirs the installer writes | Confidence |
|--------|-------|------------------|------------------------------|-----------|
| **Claude Code** | project | `<repo>/<plugin-name>/` (plugin lives anywhere; user adds it to their marketplace by running `claude --plugin-dir` against it OR by listing it in `.claude/settings.json`) | Each plugin gets its own dir containing `.claude-plugin/plugin.json`, `agents/`, `commands/`, `hooks/`, `skills/` | HIGH [VERIFIED: code.claude.com/docs/en/plugins] |
| **Claude Code** | project (alt: standalone) | `<repo>/.claude/` | `commands/`, `agents/`, `skills/`, `hooks/` (flat — no per-plugin subdir, namespaces flatten) | HIGH [CITED: code.claude.com/docs/en/plugins — "Standalone (.claude/ directory)"] |
| **Claude Code** | project-local (gitignored) | `<repo>/.claude/settings.local.json` for settings; the components themselves still live in `.claude/` | Claude Code auto-gitignores `settings.local.json` | HIGH [VERIFIED: code.claude.com/docs/en/settings — quoted: "Claude Code will configure git to ignore .claude/settings.local.json when it is created"] |
| **Claude Code** | user (global) | `~/.claude/` | `agents/`, `commands/`, `skills/`, `hooks/` (same shape as project standalone) | HIGH [VERIFIED: code.claude.com/docs/en/settings] |
| **Cursor** | project | `<repo>/.cursor/` | `commands/`, `rules/` (`.mdc` files), `skills/<plugin>/<skill>/SKILL.md` (precedent set by this repo's existing build script lines 295–328), `hooks.json` + `hooks/` for hook scripts | HIGH for `commands/` and `hooks.json` [VERIFIED: cursor.com/docs/hooks, search "Commands are stored as Markdown files in .cursor/commands/"]; HIGH for `rules/` [VERIFIED: cursor.com/docs/rules]; MEDIUM for `skills/` (Cursor docs don't formally specify `.cursor/skills/`, but precedent in this repo's existing build script + Cursor's "Skills are loaded dynamically" language confirms the path works in practice) |
| **Cursor** | project-local | No formal Cursor convention. Recommended: write to `<repo>/.cursor/` and append entries to `.gitignore` (e.g., `/.cursor/skills/typescript-rules/`). The installer can offer this in summary. | Same subdirs, just gitignored | LOW [ASSUMED — no Cursor doc covers a project-local-but-gitignored split] |
| **Cursor** | user (global) | `~/.cursor/` | `hooks.json`, `hooks/`, plus `commands/`, `rules/`, `skills/` mirroring project structure | HIGH for `hooks.json` and `hooks/` [VERIFIED: cursor.com/docs/hooks — quoted: `"~/.cursor/hooks.json"` and `"~/.cursor/hooks/"`]; MEDIUM for `commands/`/`rules/`/`skills/` (Cursor docs imply same shape as project, but don't enumerate user-global subdirs) |
| **OpenCode** | project | `<repo>/.opencode/` | `commands/`, `agents/`, `skills/<name>/SKILL.md`, `plugins/` (TypeScript files for hooks); `opencode.json` at project root for inline config | HIGH [VERIFIED: opencode.ai/docs/plugins, opencode.ai/docs/skills, opencode.ai/docs/commands; existing research in `.planning/research/STACK.md`] |
| **OpenCode** | project-local | No formal `.opencode.local/` convention — gitignore via `.gitignore` entry. OpenCode also reads `OPENCODE_CONFIG` env var pointing to a custom config file (precedence: between global and project), which can be used as a "personal override" mechanism. | Same as project, just gitignored | LOW [ASSUMED — OpenCode docs do not document a "local" scope] |
| **OpenCode** | user (global) | `~/.config/opencode/` (XDG-style, macOS + Linux) | `agents/`, `commands/`, `skills/`, `plugins/`, `opencode.json`, `AGENTS.md` | HIGH [VERIFIED: opencode.ai/docs/config, search confirmed `~/.config/opencode/opencode.json` and plural subdir names] |

**Cross-cutting observation:** Claude Code and Cursor both honor a "project standalone" path (`.claude/` and `.cursor/`) where components live as a flat tree, AND a "marketplace plugin" path where each plugin is its own dir with a manifest. For the installer, the simpler model is to copy each plugin's components flat into the editor's standalone dir. That is what users want when they say "install these three plugins" — they don't want three sibling marketplace directories, they want the skills, commands, and hooks to just work.

**Recommended file mapping for the installer:**
```
SOURCE (in npm package)            →  TARGET (in user's chosen scope, per editor)
typescript-rules/skills/typescript-conventions/SKILL.md
  ├─ Claude Code → .claude/skills/typescript-conventions/SKILL.md (project) or ~/.claude/skills/...
  ├─ Cursor      → .cursor/skills/typescript-rules/SKILL.md (preserve the namespace because Cursor's discovery is by directory; precedent: scripts/build-marketplace.sh:299–305)
  └─ OpenCode    → .opencode/skills/typescript-conventions/SKILL.md  or  ~/.config/opencode/skills/...

typescript-rules/commands/ts-review.md
  ├─ Claude Code → .claude/commands/ts-review.md
  ├─ Cursor      → .cursor/commands/ts-review.md
  └─ OpenCode    → .opencode/commands/ts-review.md  (with frontmatter caveat — see PITFALLS.md item 7)

typescript-rules/hooks/hooks.json
  ├─ Claude Code → .claude/hooks/hooks.json (or merge into existing settings.json hooks key)
  ├─ Cursor      → .cursor/hooks.json (Cursor uses a single root hooks.json, not a hooks/ subdir for the manifest)
  └─ OpenCode    → SKIP — hooks.json is unsupported. Either (a) skip with warning, (b) ship .opencode/plugins/hooks.ts that re-implements (out of installer scope per CONTEXT.md "no editing plugin contents")

typescript-rules/agents/ts-reviewer.md
  ├─ Claude Code → .claude/agents/ts-reviewer.md
  ├─ Cursor      → .cursor/agents/ — but Cursor lacks portable agent files (per Phase 1 research, Custom Modes are UI-only). Skip with informational message.
  └─ OpenCode    → .opencode/agents/ts-reviewer.md
```

The installer should display, in its final summary, what was skipped and why ("OpenCode hooks not supported — see README.md#opencode-limitations").

## 4. @clack/prompts patterns

API surface the installer needs [VERIFIED: github.com/natemoo-re/clack/blob/main/packages/prompts/README.md]:

```js
import {
  intro, outro, cancel, isCancel,
  select, multiselect, confirm,
  log, note, spinner, group
} from "@clack/prompts";

intro("AI-Devkit installer");

const editor = await select({
  message: "Which editor are you installing for?",
  options: [
    { value: "claude-code", label: "Claude Code" },
    { value: "cursor",      label: "Cursor" },
    { value: "opencode",    label: "OpenCode" },
  ],
});
if (isCancel(editor)) { cancel("Cancelled."); process.exit(0); }

const scope = await select({
  message: "Install scope?",
  options: [
    { value: "project",       label: "Project (committed to repo, shared with team)" },
    { value: "project-local", label: "Project-local (gitignored, just for me)" },
    { value: "user",          label: "User-global (every project)" },
  ],
});
if (isCancel(scope)) { cancel("Cancelled."); process.exit(0); }

const plugins = await multiselect({
  message: "Which plugins?",
  options: [
    { value: "typescript-rules", label: "typescript-rules", hint: "TS conventions" },
    { value: "jsdoc-standards",  label: "jsdoc-standards",  hint: "JSDoc rules" },
    { value: "workflow-toolkit", label: "workflow-toolkit", hint: "5 workflow skills" },
  ],
  initialValues: ["typescript-rules", "jsdoc-standards", "workflow-toolkit"],
  required: true,  // empty selection → re-prompt; we then check length and abort with friendly message
});
if (isCancel(plugins)) { cancel("Cancelled."); process.exit(0); }

// Per-conflict prompt — show only when target file exists
const action = await select({
  message: `${targetPath} already exists (existing ${oldSize}B, new ${newSize}B). Action?`,
  options: [
    { value: "skip",      label: "Skip (keep existing)" },
    { value: "overwrite", label: "Overwrite" },
    { value: "abort",     label: "Abort install" },
  ],
  initialValue: "skip",
});

const remember = await confirm({
  message: "Apply this choice to all remaining conflicts?",
  initialValue: false,
});

const s = spinner();
s.start("Copying files");
// ... copy work ...
s.stop("Copied 27 files");

outro("Done. Run `claude` to verify the plugins loaded.");
```

**Cancellation rule:** Every `select`/`multiselect`/`confirm` return value passes through `isCancel(value)`. On cancel, call `cancel("...")` and `process.exit(0)`. Because we do all prompts before any file write, Ctrl-C at any prompt naturally guarantees zero partial writes.

## 5. Bundling source files in the npm package

[VERIFIED: docs.npmjs.com/cli/v11/commands/npm-publish, docs.npmjs.com/cli/v11/configuring-npm/package-json]

**Use the `files` field, not `.npmignore`.** The `files` field is an allowlist (safer) and works with `npm pack` to produce the same tarball locally that gets published. List exactly what the installer needs to read at runtime.

```json
"files": [
  "bin/",
  "src/",
  "typescript-rules/",
  "jsdoc-standards/",
  "workflow-toolkit/",
  ".claude-plugin/marketplace.json",
  "README.md",
  "LICENSE"
]
```

`README.md`, `LICENSE`, `package.json`, and the file pointed to by `bin` are always included regardless of `files`.

**Resolving paths inside the bin script:** The package root in npx cache is `path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")` if `bin` is at `bin/install.mjs`. From there:
```js
const SOURCE_DIRS = {
  "typescript-rules": path.join(PACKAGE_ROOT, "typescript-rules"),
  "jsdoc-standards":  path.join(PACKAGE_ROOT, "jsdoc-standards"),
  "workflow-toolkit": path.join(PACKAGE_ROOT, "workflow-toolkit"),
};
const MARKETPLACE_JSON = path.join(PACKAGE_ROOT, ".claude-plugin", "marketplace.json");
```
The installer should read `marketplace.json` to enumerate plugins (per CONTEXT.md "never hard-code the list"). Reusing the existing manifest as the source of truth means adding a fourth plugin later requires zero installer changes.

**Verifying what shipped (recommended pre-publish step):**
```bash
npm pack --dry-run
# prints every file that would be in the tarball
```
Add this to the publish workflow before `npm publish` as a sanity check (only logs).

## 6. Conflict-prompt UX prior art

- **`create-vite`** [CITED: github.com/vitejs/vite/discussions/15341, vitejs/vite/issues/12958] — When the target dir is non-empty, prompts "Current directory is not empty. Please choose how to proceed:" with options like "Remove existing files and continue." Notably it operates at directory level (nuke or proceed), not per-file. Users have asked for finer-grained options. Our per-file `[overwrite | skip | abort]` model is more granular and user-friendlier; `create-vite` is the cautionary tale for why directory-level only is too coarse.
- **`create-next-app`** — Behaves similarly to `create-vite`: errors out or asks the user to pick a different directory; no per-file conflict resolution. Issue vercel/next.js#46651 documents EACCESS pain when running into existing git repo state.
- **`degit`** [CITED: github.com/Rich-Harris/degit] — By default refuses to write into a non-empty directory unless `--force` is passed. Force is binary: nuke or no-op. Again coarser than what we want.

**Takeaway:** Our per-conflict prompt with "remember choice for this run" is more user-respectful than the prevailing pattern. The closest precedent for the "remember" toggle is `npm install`'s `--yes` flag and rsync's interactive-update mode (`-i --update`). No popular scaffolder does it inline; we'd be borrowing from sysadmin tooling, which fits this installer's "thoughtful, calm" brand voice.

## 7. Pitfalls

### P1. GitHub Packages requires auth even for public packages [VERIFIED: docs.github.com]
Quoted: "You need an access token to publish, install, and delete private, internal, and public packages."
**Mitigation:** README documents both the `.npmrc` setup AND the `npx github:pau-vega/ai-devkit` zero-auth fallback. The two-step path is the headline; the fallback is the escape hatch.

### P2. npm dereferences symlinks during publish [VERIFIED: github.com/npm/cli/issues/6746, github.com/npm/npm/issues/3310]
`npm publish` follows symlinks and bakes the target contents into the tarball as regular files. The symlink itself is not preserved.
**Implication for this installer:** We were going to copy files anyway (per CONTEXT.md "prefer copies"). This pitfall reinforces that decision — even if we did `ln -s` inside the package source, npm would flatten it. So inside the installer's runtime logic we use `fs.copyFile`/`fs.cp({ recursive: true })`, not `fs.symlink`. Document this explicitly in the SUMMARY so users know "edits to these files don't update the source."

### P3. Cross-platform path handling
- Use `path.join` exclusively — never string-concatenate paths.
- `os.homedir()` for `~/`, NOT `process.env.HOME` (Windows uses `USERPROFILE`).
- Watch for case-sensitive filesystems on Linux vs case-insensitive macOS/Windows. Plugin file names are all lowercase already so this is theoretical.
- Windows `~/.claude/` resolves to `%USERPROFILE%\.claude\` [VERIFIED: code.claude.com/docs/en/settings]. Cursor + OpenCode user paths on Windows: not officially documented, but `os.homedir()` gives the right base. Initial release can target macOS + Linux only and skip-with-warning on Windows; cross-platform parity becomes a follow-up.
- File permission bits don't transfer cleanly to Windows. Hook scripts under `hooks/scripts/*.sh` need `chmod +x` at install time on Unix; on Windows they're effectively unusable (matches the editor's own constraints — Cursor and Claude Code on Windows generally invoke shell scripts via WSL or Git Bash, which is the user's problem to solve).

### P4. Node version: 20.11+ vs 18+
`import.meta.dirname`/`import.meta.filename` need 20.11+. We could target Node 18 by using `fileURLToPath(import.meta.url)`, which works in 18 too. Either choice is defensible; `>=20.11.0` is recommended because:
1. Node 18 entered maintenance mode 2025-04 and goes EOL 2025-04-30 [VERIFIED: nodejs.org release schedule]. By May 2026, 18 is past EOL.
2. Node 20 is current LTS through April 2026, then maintenance through April 2027.
3. Node 22 LTS is the active LTS as of late 2024.
Realistic floor: **`>=20.11.0`**, recommend **22 LTS** in the README. Add a `process.versions.node` runtime check at the top of `install.mjs` so users on stale Node get a friendly message.

### P5. Claude Code "plugin" vs "standalone" path confusion [VERIFIED: code.claude.com/docs/en/plugins]
Claude Code distinguishes between (a) a plugin tree (with `.claude-plugin/plugin.json` manifest, namespaced skill names like `/typescript-rules:ts-review`) and (b) standalone `.claude/` config (flat skills like `/ts-review`). Our installer copies into the standalone tree (`.claude/skills/`, `.claude/commands/`, etc.) — this gives shorter command names and the simplest path-to-success. We do NOT need to ship a `plugin.json` to the user's machine. Document this trade-off in the SUMMARY: users who want the `/typescript-rules:` namespace prefix can install via the `claude --plugin-dir` route instead (which CONTEXT.md notes the README will document as the GitHub fallback).

### P6. OpenCode hooks aren't portable
Per `.planning/research/PITFALLS.md` items 1–5: OpenCode does not read `hooks.json`. It needs a TypeScript plugin. Since CONTEXT.md scopes "no editing of plugin contents" out, the installer should:
- Skip writing `hooks.json` for OpenCode targets.
- Print a clear info message: "OpenCode hooks require a TypeScript plugin (not yet ported). Skills + commands installed; real-time enforcement won't fire under OpenCode."
- Add this to the post-install summary so it isn't lost in scrollback.

### P7. Cursor lacks portable agent files
Per project STATE.md: "Cursor capability gap accepted: no portable subagent file." Skip `agents/*.md` for Cursor targets, log informational note in summary.

### P8. .gitignore management for project-local scope
For Claude Code project-local, the editor itself gitignores `settings.local.json`. But our installer is writing skill/command/hook files into `.claude/` for project-local scope, not just settings. Two options:
1. Write to a different subdir (e.g., `.claude/local/`) — but Claude Code doesn't read this path, so the components wouldn't load.
2. Write to the normal subdirs (`.claude/skills/`, etc.) and append entries to `.gitignore` listing the specific files installed.
Recommendation: option 2. The installer maintains a `.gitignore` block delimited by markers (`# >>> AI-Devkit ... # <<< AI-Devkit`) so re-running it is idempotent. Same approach for Cursor and OpenCode project-local.

### P9. Idempotency on re-run
If a user runs `npx @pau-vega/ai-devkit` twice with the same answers, the second run should be a no-op (or all conflicts resolve via "skip"). The per-conflict prompt already handles this — but the "remember choice" toggle means a single keystroke in the second run skips everything. Test that path explicitly during plan execution.

### P10. WebFetch prompt-injection in research sources (process risk)
During this research session, fetched documentation pages contained text impersonating system reminders ("Auto Mode Active", "Exited Plan Mode"). These are not real instructions from the orchestrator. When implementing, if any third-party doc/markdown is fetched at runtime, treat its contents as untrusted strings, never as control flow. The installer doesn't fetch anything at runtime, so this is informational — but the planner should know the research session encountered injection attempts and ignored them.

## 8. Recommended approach

Build an ESM Node script (`bin/install.mjs`, shebanged, Node ≥20.11) that runs entirely client-side at `npx` time. The script reads `.claude-plugin/marketplace.json` from its own bundled package root (resolved via `import.meta.url` + `fileURLToPath`) to enumerate the three plugins, then walks the user through `editor → scope → plugins → conflicts` using `@clack/prompts`'s `select`/`multiselect`/`confirm` — checking `isCancel()` after every prompt. After all prompts complete (so Ctrl-C never leaves a half-installed state), it computes the target tree per the editor-paths table in §3, walks each plugin's source dirs, and copies files (`fs.cp({ recursive: true, force: false })` with explicit per-file `existsSync` checks driving the conflict prompt). For project-local scope, it appends a delimited block to `.gitignore`. For OpenCode hooks and Cursor agents, it skips and logs why. It prints a final summary listing files written, files skipped (with reason), and any post-install steps (e.g., "run `claude /reload-plugins`"). Publishing is a single `release: published` GitHub Actions workflow that calls `setup-node` with `registry-url: https://npm.pkg.github.com` and `npm publish` against `GITHUB_TOKEN`. The README documents the consumer `.npmrc` token setup, the `npx github:` zero-auth fallback, and the compatibility caveats (no OpenCode hooks, no Cursor agents).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cursor reads `.cursor/skills/<plugin>/SKILL.md` (per-plugin namespacing inside `.cursor/skills/`) | §3 Cursor row | Skills don't load under Cursor; user sees zero TS conventions in agent context. Mitigation: precedent already shipped (build-marketplace.sh:295–328 + Phase 1 commits), but Cursor docs don't formally specify the path. Verify by running Cursor against a sample install and watching for skill activation. |
| A2 | Cursor honors a "user-global" scope at `~/.cursor/commands/`, `~/.cursor/skills/`, `~/.cursor/rules/` (mirroring project paths) | §3 Cursor user row | If Cursor only reads project-level for non-hook components, user-scope install does nothing. Currently only `~/.cursor/hooks.json` is verified. Mitigation: prompt-time UX should warn "user-scope under Cursor only ships hooks (and rules if Cursor extends global rules support)" until empirically confirmed. |
| A3 | OpenCode has no formal "project-local" scope — gitignore is the workaround | §3 OpenCode project-local row | Acceptable trade-off; OpenCode docs don't document a local override. The `OPENCODE_CONFIG` env var path covers most personal-override needs. |
| A4 | Cursor has no formal "project-local" scope either | §3 Cursor project-local row | Same as A3; gitignore workaround. |
| A5 | Node 20.11 is a safe floor for May 2026 (Node 18 EOL) | §1 Node floor + P4 | Stale dev environments (especially CI with pinned old Node) might break. Mitigation: friendly runtime check + clear error message. Could lower to `>=18.19.0` if user has a stale-Node compat requirement (`fileURLToPath` works in 18). |
| A6 | npm `bin` shebanged ESM `.mjs` files run reliably under `npx` on macOS, Linux, and Windows (via the auto-generated `.cmd` shim) | §1 ESM bin | Windows `npx` execution of ESM bin files has historically had edge cases; if it breaks, fall back to a tiny CJS shim that dynamically `import()`s the ESM main. Low risk — well-trodden path in 2026. |
| A7 | The `.claude/settings.local.json` auto-gitignore that Claude Code performs does NOT extend to component files written into `.claude/skills/` etc. | P8 | If Claude Code DOES auto-ignore the whole `.claude/` for project-local installs, our `.gitignore` block is redundant but harmless. If it doesn't, we need to add the block — confirmed by docs. Risk: minor — the docs only mention `settings.local.json` is auto-ignored, so adding our own block is the correct move. |

If this assumption set is unacceptable, two follow-up validations are cheap: (1) `mkdir -p ~/.cursor/skills/test && echo '...' > .../SKILL.md` and ask Cursor to invoke it (validates A1, A2); (2) try `npx` an ESM-bin package on a Windows VM (validates A6). Neither blocks planning — assumptions A3 and A4 are documentation gaps that the installer's UI text can paper over by describing the gitignore-based workaround honestly.

## Sources

### HIGH confidence (official docs)
- [Claude Code: Create plugins](https://code.claude.com/docs/en/plugins) — `.claude-plugin/plugin.json` schema, `--plugin-dir`, standalone vs plugin paths
- [Claude Code: Settings](https://code.claude.com/docs/en/settings) — `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json` (auto-gitignored)
- [Cursor: Hooks](https://cursor.com/docs/hooks) — `.cursor/hooks.json` and `~/.cursor/hooks.json` paths verbatim
- [Cursor: Rules](https://cursor.com/docs/rules) — `.cursor/rules/` `.mdc` files
- [OpenCode: Config](https://opencode.ai/docs/config/) — `~/.config/opencode/opencode.json` global path
- [OpenCode: Plugins](https://opencode.ai/docs/plugins/) — `.opencode/plugins/*.ts`
- [OpenCode: Skills](https://opencode.ai/docs/skills/) — SKILL.md format and discovery paths
- [OpenCode: Commands](https://opencode.ai/docs/commands/) — `.opencode/commands/*.md`
- [GitHub Docs: Working with the npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) — `publishConfig.registry`, `.npmrc` shape, public-package auth requirement
- [GitHub Docs: Publishing Node.js packages](https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-nodejs-packages) — full sample workflow YAML
- [@clack/prompts README](https://github.com/natemoo-re/clack/blob/main/packages/prompts/README.md) — API surface
- [Node.js docs: ESM](https://nodejs.org/api/esm.html) — `import.meta.url`, `import.meta.dirname`

### MEDIUM confidence (community, blogs, cross-referenced)
- Stackademic: "Practical Features in Node.js v20.11.0" — `import.meta.dirname` minimum version
- John Smilga blog (johnsmilga.com/articles/2024/08/23) — `__dirname` in ESM modules
- vitejs/vite#12976 — shebang hoisting bug (informational)

### LOW confidence (single source / inferred)
- Cursor `.cursor/skills/` path — not formally documented by Cursor; precedent in this repo's `scripts/build-marketplace.sh:295–328` and Phase 1 commits a4f5d70, 3d75d63, 908c636

### Cross-reference (this repo)
- `.planning/research/STACK.md` — OpenCode component paths and equivalence map
- `.planning/research/PITFALLS.md` — OpenCode hooks.json gap, model shorthand, agent frontmatter
- `.planning/research/ARCHITECTURE.md` — directory-coexistence map per plugin
- `scripts/build-marketplace.sh:295–328` — empirical Cursor `.cursor/skills/` precedent

## Metadata

**Confidence breakdown:**
- npx + bin setup: HIGH — Node ESM and npm bin behavior are well-documented
- GitHub Packages publish: HIGH — official sample workflow + auth-required quirk both verified
- Editor target paths: MIXED — Claude Code HIGH, OpenCode HIGH, Cursor MEDIUM (skills path inferred from precedent)
- @clack/prompts patterns: HIGH — README documented
- Bundling: HIGH — `files` field is canonical npm guidance
- Conflict UX: MEDIUM — survey complete, but our per-conflict model is more granular than any prior art surveyed
- Pitfalls: HIGH — most are verified against official docs or this repo's prior research

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 for Cursor (fast-moving) and Claude Code (recent docs reorg); 2026-08-10 for everything else.
