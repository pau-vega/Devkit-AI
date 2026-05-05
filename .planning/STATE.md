# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-05-05)

**Core value:** Developers using OpenCode get the same real-time convention enforcement and on-demand review experience as Claude Code users.
**Current focus:** Phase 1

## Current Phase
Phase 1 — Skills Compatibility

## Status
Not started

## Phases
| # | Name | Status |
|---|------|--------|
| 1 | Skills Compatibility | Pending |
| 2 | Commands and Agents Port | Pending |
| 3 | Hook Enforcement Port | Pending |
| 4 | Marketplace UI and Install Docs | Pending |

## Performance Metrics
- Phases complete: 0/4
- Requirements complete: 0/15

## Accumulated Context

### Key Decisions
- OpenCode support is purely additive — no existing Claude Code files are modified
- Skills are the only component shared between runtimes (`.claude/skills/` read natively by both)
- Prompt-based hooks accepted as a v1 capability gap (no OpenCode equivalent)
- Hook field names (camelCase vs snake_case) must be empirically validated in Phase 3 before enforcement logic ships

### Known Risks
- Hook parameter schema unconfirmed: `output.args.filePath` vs `tool_args.file_path` — validate with logging plugin first
- Subagent hook bypass (OpenCode bug #5894): subagent tool calls do not trigger `tool.execute.before`
- `hooks.json` silently ignored by OpenCode — zero warning on startup

### Todos
- (none yet — planning complete, execution not started)

### Blockers
- (none)

## Session Continuity
- Roadmap created: 2026-05-05
- Last activity: 2026-05-05 — roadmap and state initialized
- Next action: `/gsd-plan-phase 1`
