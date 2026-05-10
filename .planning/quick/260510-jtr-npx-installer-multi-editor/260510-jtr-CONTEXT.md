---
quick_id: 260510-jtr
status: ready-for-planning
date: 2026-05-10
---

# Quick Task 260510-jtr: npx installer for marketplace plugins (multi-editor, multi-scope) - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Task Boundary

Add a `npx`-runnable installer to this Claude Code plugin marketplace so users can install the three plugins (`typescript-rules`, `jsdoc-standards`, `workflow-toolkit`) into one of three target editors:

- **Claude Code** — `~/.claude/plugins/` (user) or `.claude/plugins/` (project)
- **Cursor** — `~/.cursor/` (user) or `.cursor/` (project)
- **OpenCode** — `~/.config/opencode/` (user) or `.opencode/` (project)

…at one of three scopes:

- **project** — committed to the project's repo (shared with team)
- **project-local** — installed in the project but gitignored (just for me)
- **user (global)** — user-level config, applies to every project

Out of scope: editing the actual plugin contents, building OS-specific binaries, hosting a TypeScript test harness for the installer.

</domain>

<decisions>
## Implementation Decisions

### Distribution + invocation form
- **Publish to GitHub Packages** (npm registry on GitHub) under `@pau-vega/my-marketplace` (scope inferred from `git remote get-url origin` → `pau-vega/my-marketplace`).
- Users invoke via: `npx @pau-vega/my-marketplace` after configuring scoped registry auth (`.npmrc`: `@pau-vega:registry=https://npm.pkg.github.com`).
- README documents the `.npmrc` setup AND the zero-config fallback `npx github:pau-vega/my-marketplace` for users who don't want to deal with GitHub Packages auth.
- CI publishes on tagged release via `.github/workflows/publish.yml` using `GITHUB_TOKEN`.

### CLI UX
- **Interactive prompts** via `@clack/prompts` (chosen over `@inquirer/prompts` for smaller dep tree, modern API, and aesthetics that match the repo's "calm and trustworthy" brand).
- Flow: `editor → scope → plugins (multi-select) → conflict-resolution prompts → write summary`.
- All prompts have a `Cancel` option; Ctrl-C aborts cleanly with no partial writes.

### Plugin selection
- **Multi-select with all 3 default-checked.** User unchecks unwanted plugins. Empty selection aborts with friendly message.

### Conflict handling on existing files
- **Per-conflict prompt:** when target file already exists, show path + size diff, ask `[overwrite | skip | abort]`. Default highlight: `skip`.
- A "remember choice for this run" toggle on first conflict (so user doesn't get prompted 30 times for one install).

### Claude's Discretion
- Source files for installation: copied verbatim from the plugin directories in this repo. The CLI bundles them via `package.json`'s `files` field (or `npm pack` includes them).
- File-mapping strategy per editor: reuses the same source-of-truth files this repo already has (`<plugin>/.claude-plugin/`, `<plugin>/agents/`, `<plugin>/commands/`, `<plugin>/hooks/`, `<plugin>/skills/`); for Cursor and OpenCode the installer translates to that editor's expected paths (research phase will confirm exact target dirs).
- Symlinks vs file copies: prefer copies (portable, no broken-link risk after `npm cache clean`); document this trade-off in the SUMMARY.
- Permission errors on user-scope writes: caught and surfaced with actionable message ("try `sudo` or pick a different scope"), do not silently fail.
- Versioning: pin installer version to repo version (single `package.json` at repo root).

</decisions>

<specifics>
## Specific Ideas

- Use `@clack/prompts` (https://www.npmjs.com/package/@clack/prompts) for the prompt layer — chosen for ESM-friendly API, clean visuals, and ~50KB footprint.
- Existing `scripts/build-marketplace.sh` already discovers plugin components by globbing the same directories the installer needs to read — installer can reuse the same discovery convention rather than hard-coding the file list.
- Repo already has `.cursor/skills/` symlinked from `<plugin>/skills/` (per recent commits a4f5d70, 3d75d63, 908c636) — that gives a working precedent for Cursor target paths the research phase should confirm.

</specifics>

<canonical_refs>
## Canonical References

- This repo's `CLAUDE.md` — design principles (calm, precise, unassuming) apply to CLI output too.
- This repo's `marketplace.json` — declares the 3 plugins; installer should read this as the source of truth for plugin metadata, never hard-code the list.
- `.planning/PROJECT.md` and `.planning/ROADMAP.md` — Phase 4 ("Marketplace UI and Install Docs") is where this work conceptually lives; quick task is the npx-installer slice of it.

</canonical_refs>
