# My Marketplace — OpenCode Compatibility

## What This Is

A Claude Code plugin marketplace containing three plugins (typescript-rules, jsdoc-standards, workflow-toolkit) that enforce coding conventions through hooks, slash commands, agents, and skills. The goal of this initiative is to extend the marketplace so all three plugins work equally well inside OpenCode sessions — and so the marketplace landing page advertises that compatibility.

## Core Value

Developers using OpenCode get the same real-time convention enforcement and on-demand review experience as Claude Code users.

## Requirements

### Validated

- ✓ Three plugins ship with hooks, commands, skills, agents — existing (Claude Code)
- ✓ `marketplace.html` landing page built and deployed via GitHub Pages — existing
- ✓ `scripts/build-marketplace.sh` regenerates page from plugin metadata — existing
- ✓ Install instructions exist for Claude Code — existing

### Active

- [ ] OpenCode's hook/command/agent/skill equivalents researched and documented
- [ ] typescript-rules plugin adapted to work in OpenCode (hooks, command, agent, skill)
- [ ] jsdoc-standards plugin adapted to work in OpenCode (hooks, command, agent, skill)
- [ ] workflow-toolkit plugin adapted to work in OpenCode (command, skills)
- [ ] marketplace.html shows OpenCode compatibility badges and install instructions
- [ ] OpenCode install flow documented (how to load plugins in an OpenCode session)

### Out of Scope

- New plugins — this milestone is parity, not expansion
- Rewriting existing Claude Code functionality — existing behavior stays untouched
- CI/CD changes beyond what OpenCode compatibility requires

## Context

The existing codebase is well-understood (CLAUDE.md documents it fully). Each plugin uses:
- **Hooks** via `hooks/hooks.json` — PreToolUse on Bash/Write/Edit, shell scripts + prompt-based validation
- **Commands** via `commands/*.md` — slash commands that dispatch subagents
- **Agents** via `agents/*.md` — review bots with Read/Glob/Grep/Bash access
- **Skills** via `skills/<name>/SKILL.md` — passive reference guides

OpenCode's plugin/extension model is unknown and requires research before planning. The key risk is that OpenCode may not support all four layers — in that case, maximum achievable parity wins.

## Constraints

- **Compatibility**: Must not break existing Claude Code behavior — OpenCode support is additive
- **No npm**: Repo has no package.json or build step; solutions must stay shell/markdown/JSON
- **Plugin format**: Any OpenCode-specific files must coexist cleanly with the current plugin layout

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| All three plugins in scope | User confirmed — no partial coverage | — Pending |
| Same UX target | User wants identical hooks/commands/agents/skills experience | — Pending |
| Marketplace UI update included | Show compatibility badges and OpenCode install path | — Pending |

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
*Last updated: 2026-05-05 after initialization*
