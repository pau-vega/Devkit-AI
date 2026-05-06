# My Marketplace — Dual-Runtime Compatibility (OpenCode + Cursor)

## What This Is

A Claude Code plugin marketplace containing three plugins (typescript-rules, jsdoc-standards, workflow-toolkit) that enforce coding conventions through hooks, slash commands, agents, and skills. The goal of this initiative is to extend the marketplace so all three plugins work equally well inside OpenCode AND Cursor sessions — and so the marketplace landing page advertises that compatibility. Cursor was added to scope on 2026-05-06 after research (`.planning/quick/260506-612-cursor-opencode-compat-research/`) showed Cursor parity is mostly free — its hook system is a near-clone of Claude Code's, and existing shell scripts can be reused verbatim.

## Core Value

Developers using OpenCode or Cursor get the same real-time convention enforcement and on-demand review experience as Claude Code users.

## Requirements

### Validated

- ✓ Three plugins ship with hooks, commands, skills, agents — existing (Claude Code)
- ✓ `marketplace.html` landing page built and deployed via GitHub Pages — existing
- ✓ `scripts/build-marketplace.sh` regenerates page from plugin metadata — existing
- ✓ Install instructions exist for Claude Code — existing

### Active

- [ ] OpenCode's hook/command/agent/skill equivalents researched and documented
- [ ] Cursor's hook/skill/command equivalents researched and documented (DONE 2026-05-06 — see `.planning/quick/260506-612-cursor-opencode-compat-research/`)
- [ ] typescript-rules plugin adapted to work in OpenCode and Cursor (hooks, command, agent where supported, skill) — Cursor lacks a portable agent file; reviewer prompt inlines into the command-skill instead
- [ ] jsdoc-standards plugin adapted to work in OpenCode and Cursor (hooks, command, agent where supported, skill) — same Cursor agent caveat applies
- [ ] workflow-toolkit plugin adapted to work in OpenCode and Cursor (command, skills)
- [ ] marketplace.html shows tri-runtime compatibility badges and install instructions (Claude Code + OpenCode + Cursor)
- [ ] OpenCode install flow documented (how to load plugins in an OpenCode session)
- [ ] Cursor install flow documented (copy `.cursor/` into project root)

### Out of Scope

- New plugins — this milestone is parity, not expansion
- Rewriting existing Claude Code functionality — existing behavior stays untouched
- CI/CD changes beyond what dual-runtime compatibility requires
- Portable Cursor subagent file — Cursor's Custom Modes are UI-only

## Context

The existing codebase is well-understood (CLAUDE.md documents it fully). Each plugin uses:
- **Hooks** via `hooks/hooks.json` — PreToolUse on Bash/Write/Edit, shell scripts + prompt-based validation
- **Commands** via `commands/*.md` — slash commands that dispatch subagents
- **Agents** via `agents/*.md` — review bots with Read/Glob/Grep/Bash access
- **Skills** via `skills/<name>/SKILL.md` — passive reference guides

OpenCode's plugin/extension model has been researched (TypeScript plugin host, no shell-script hook path, programmatic camelCase fields). Cursor's model has been researched (near-clone of Claude Code's `hooks.json`, Agent Skills standard, no portable subagents).

## Constraints

- **Compatibility**: Must not break existing Claude Code behavior — OpenCode and Cursor support is additive
- **No npm**: Repo has no package.json or build step; solutions must stay shell/markdown/JSON
- **Plugin format**: Any OpenCode-specific files must coexist cleanly with the current plugin layout
- **Cursor namespace**: Cursor compatibility files live under each plugin's `.cursor/` namespace, mirroring `.opencode/` and `.claude-plugin/`. No existing files are modified to add Cursor support.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| All three plugins in scope | User confirmed — no partial coverage | — Pending |
| Same UX target | User wants identical hooks/commands/agents/skills experience | — Pending |
| Marketplace UI update included | Show compatibility badges and install paths for each runtime | — Pending |
| Cursor included in scope | Research 2026-05-06 showed near-zero porting cost: skills reuse, hook scripts reuse verbatim, only command shape changes (skills with disable-model-invocation) | Pending — to be implemented across phases 1-4 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-06 — extended scope to dual-runtime (OpenCode + Cursor) per research quick task 260506-612*
