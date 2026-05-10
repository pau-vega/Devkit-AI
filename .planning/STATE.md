# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-05-06)

**Core value:** Developers using OpenCode or Cursor get the same real-time convention enforcement and on-demand review experience as Claude Code users.
**Current focus:** Phase 2 — Commands and Agents Port

## Current Phase
Phase 1 — Skills Compatibility (OpenCode + Cursor) ✓

## Status
Complete

## Phases
| # | Name | Status |
|---|------|--------|
| 1 | Skills Compatibility (OpenCode + Cursor) | ✓ Complete |
| 2 | Commands and Agents Port (OpenCode + Cursor where supported) | Pending |
| 3 | Hook Enforcement Port (OpenCode + Cursor) | Pending |
| 4 | Marketplace UI and Install Docs (tri-runtime) | Pending |

## Performance Metrics
- Phases complete: 1/4
- Requirements complete: 6/27 (SKILL-01, SKILL-02, SKILL-03, CUR-SKILL-01, CUR-SKILL-02, CUR-SKILL-03)

## Accumulated Context

### Key Decisions
- OpenCode support is purely additive — no existing Claude Code files are modified
- Skills are the only component shared between Claude Code and OpenCode (`.claude/skills/` read natively by both); Cursor uses its own `.cursor/skills/` path
- Prompt-based hooks accepted as a v1 capability gap for OpenCode (no equivalent); Cursor supports them natively
- Hook field names (camelCase vs snake_case) clarified: OpenCode programmatic `output.args.filePath`, Claude Code + Cursor stdin `tool_input.file_path`
- Cursor support added to scope 2026-05-06 — research (`.planning/quick/260506-612-cursor-opencode-compat-research/`) showed Cursor's hook system is a near-clone of Claude Code's, allowing zero-edit reuse of existing shell scripts
- Cursor capability gap accepted: no portable subagent file — reviewer-agent role inlines into command-skills
- OpenCode HOOK-04 jq-fallback no longer needed — research re-verified that OpenCode does not pipe stdin to shell scripts; field-name fallback was a third-party plugin artifact

### Known Risks
- Subagent hook bypass (OpenCode bug #5894): subagent tool calls do not trigger `tool.execute.before`
- `hooks.json` silently ignored by OpenCode — zero warning on startup
- Cursor subagent hook coverage unverified — `subagentStart` / `preToolUse` interaction must be empirically validated before Phase3 ships (analog to OpenCode #5894)

### Todos
- [x] 01-01: Add YAML frontmatter to all 7 SKILL.md files
- [x] 01-02: Create .cursor/skills/ symlinks for typescript-rules and jsdoc-standards
- [x] 01-03: Create .cursor/skills/workflow-toolkit/ symlinks for all 5 skills

### Blockers
- (none)

## Session Continuity
- Roadmap created: 2026-05-05
- Last activity: 2026-05-10 — Completed quick task 260510-jtr: npx installer (multi-editor, multi-scope) — Needs Review (smoke test)
- Next action: Run interactive smoke test of `bin/install.mjs` against `/tmp/mm-smoke` (Plan Task 4), then Plan Phase 2 (Commands and Agents Port)

## Quick Tasks
| Date | ID | Type | Description | Outcome |
|------|----|----|-------------|---------|
| 2026-05-06 | 260506-612 | research + plan | Cursor + OpenCode compatibility research and scope extension | RESEARCH.md + PLAN.md produced; ROADMAP/REQUIREMENTS/PROJECT/STATE updated to dual-runtime |
| 2026-05-06 | 260506-613 | discuss | Phase1 Skills Compatibility context gathering | 01-CONTEXT.md + 01-DISCUSSION-LOG.md created with D-01 through D-06 decisions |
| 2026-05-10 | 260510-jtr | quick-full (discuss + research + plan-check + verify + review) | npx installer for marketplace plugins — 3 editors (Claude Code, Cursor, OpenCode) × 3 scopes (project, project-local, user); GitHub Packages distribution + `npx github:` fallback; @clack/prompts UX; per-file conflict prompts | package.json + bin/install.mjs + 7 src/installer/*.mjs + .github/workflows/publish.yml + README install matrix; code-review BLOCKER (gitignore silent no-op) + 2 WARNINGs fixed; verifier: 9/11 must_haves verified, 2 deferred to live-publish smoke test (Needs Review) |
