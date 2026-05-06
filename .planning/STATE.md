# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-05-06)

**Core value:** Developers using OpenCode or Cursor get the same real-time convention enforcement and on-demand review experience as Claude Code users.
**Current focus:** Phase 1

## Current Phase
Phase 1 — Skills Compatibility (OpenCode + Cursor)

## Status
Not started

## Phases
| # | Name | Status |
|---|------|--------|
| 1 | Skills Compatibility (OpenCode + Cursor) | Pending |
| 2 | Commands and Agents Port (OpenCode + Cursor where supported) | Pending |
| 3 | Hook Enforcement Port (OpenCode + Cursor) | Pending |
| 4 | Marketplace UI and Install Docs (tri-runtime) | Pending |

## Performance Metrics
- Phases complete: 0/4
- Requirements complete: 0/27

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
- Cursor subagent hook coverage unverified — `subagentStart` / `preToolUse` interaction must be empirically validated before Phase 3 ships (analog to OpenCode #5894)

### Todos
- (none yet — planning complete, execution not started)

### Blockers
- (none)

## Session Continuity
- Roadmap created: 2026-05-05
- Last activity: 2026-05-06 — Phase 1 context gathered via /gsd-discuss-phase
- Next action: `/gsd-plan-phase 1`

## Quick Tasks
| Date | ID | Type | Description | Outcome |
|------|----|----|-------------|---------|
| 2026-05-06 | 260506-612 | research + plan | Cursor + OpenCode compatibility research and scope extension | RESEARCH.md + PLAN.md produced; ROADMAP/REQUIREMENTS/PROJECT/STATE updated to dual-runtime |
| 2026-05-06 | 260506-613 | discuss | Phase 1 Skills Compatibility context gathering | 01-CONTEXT.md + 01-DISCUSSION-LOG.md created with D-01 through D-06 decisions |

## Quick Tasks
| Date | ID | Type | Description | Outcome |
|------|----|----|-------------|---------|
| 2026-05-06 | 260506-612 | research + plan | Cursor + OpenCode compatibility research and scope extension | RESEARCH.md + PLAN.md produced; ROADMAP/REQUIREMENTS/PROJECT/STATE updated to dual-runtime |
