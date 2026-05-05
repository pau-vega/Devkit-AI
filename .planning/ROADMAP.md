# Roadmap: OpenCode Compatibility

**Project:** my-marketplace — OpenCode Compatibility
**Core Value:** Developers using OpenCode get the same real-time convention enforcement and on-demand review experience as Claude Code users.
**Granularity:** Coarse (4 phases)

## Phases

- [ ] **Phase 1: Skills Compatibility** - All 7 SKILL.md files are auto-discovered and readable by OpenCode agents
- [ ] **Phase 2: Commands and Agents Port** - On-demand review commands and agents work in OpenCode sessions
- [ ] **Phase 3: Hook Enforcement Port** - Real-time convention enforcement fires on write/edit in OpenCode
- [ ] **Phase 4: Marketplace UI and Install Docs** - Landing page advertises OpenCode compatibility with clear install instructions

## Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Skills Compatibility | OpenCode agents load conventions passively | SKILL-01, SKILL-02, SKILL-03 | 3 criteria |
| 2 | Commands and Agents Port | On-demand review works before hooks exist | CMD-01, CMD-02, CMD-03, AGNT-01, AGNT-02 | 3 criteria |
| 3 | Hook Enforcement Port | Real-time pattern guards fire in OpenCode | HOOK-01, HOOK-02, HOOK-03, HOOK-04 | 4 criteria |
| 4 | Marketplace UI and Install Docs | Page communicates dual-runtime compatibility | MKTPL-01, MKTPL-02, MKTPL-03 | 3 criteria |

## Phase Details

### Phase 1: Skills Compatibility
**Goal:** OpenCode agents passively load TypeScript, JSDoc, and workflow conventions from existing skill files without any new file paths or duplication.
**Depends on:** Nothing
**Requirements:** SKILL-01, SKILL-02, SKILL-03
**Success Criteria:**
1. An OpenCode agent asked about TypeScript conventions returns guidance sourced from the typescript-rules skill (confirming auto-discovery via `.claude/skills/`)
2. An OpenCode agent asked about JSDoc conventions returns guidance sourced from the jsdoc-standards skill
3. An OpenCode agent working on any workflow task can load all 5 workflow-toolkit skills by name without a file path
**Plans:** TBD
**UI hint**: no

### Phase 2: Commands and Agents Port
**Goal:** OpenCode users can run `/ts-review`, `/jsdoc-review`, and `/create-workflow` and receive structured review reports identical in substance to the Claude Code experience.
**Depends on:** Phase 1
**Requirements:** CMD-01, CMD-02, CMD-03, AGNT-01, AGNT-02
**Success Criteria:**
1. Running `/ts-review` in an OpenCode session dispatches the typescript-reviewer agent and returns a report with Error/Warning/Suggestion severity levels
2. Running `/jsdoc-review` in an OpenCode session dispatches the jsdoc-reviewer agent and returns a structured JSDoc coverage report
3. Running `/create-workflow` introduces the workflow-toolkit skill set to the active session
**Plans:** TBD
**UI hint**: no

### Phase 3: Hook Enforcement Port
**Goal:** OpenCode enforces the same pattern-matching rules as Claude Code hooks — blocking bad writes in real time — with field names validated against a live session before enforcement ships.
**Depends on:** Phase 2
**Requirements:** HOOK-01, HOOK-02, HOOK-03, HOOK-04
**Success Criteria:**
1. A test hook logging `JSON.stringify(output.args)` to a file confirms the exact camelCase field schema before any enforcement logic is written
2. Writing a TypeScript file with `any`, `enum`, or `export default` in an OpenCode session is blocked with a descriptive error message
3. Writing a TypeScript file that exports a function without a JSDoc comment in an OpenCode session is blocked with a descriptive error message
4. The existing Claude Code `.sh` scripts continue to block correctly after the jq fallback (`tool_input.file_path // tool_args.file_path`) is applied
**Plans:** TBD
**UI hint**: no

### Phase 4: Marketplace UI and Install Docs
**Goal:** The marketplace landing page clearly communicates which plugins support OpenCode, shows compatibility badges, and gives developers an unambiguous install path for both runtimes.
**Depends on:** Phase 3
**Requirements:** MKTPL-01, MKTPL-02, MKTPL-03
**Success Criteria:**
1. Each plugin card on `marketplace.html` displays an OpenCode compatibility badge visible without scrolling
2. The install modal or section shows distinct, clearly labeled instructions for Claude Code (`--plugin-dir`) and OpenCode (manual file-placement steps)
3. Running `scripts/build-marketplace.sh` after adding `.opencode/` components to a plugin automatically reflects those components in the regenerated page
**Plans:** TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Skills Compatibility | 0/? | Not started | - |
| 2. Commands and Agents Port | 0/? | Not started | - |
| 3. Hook Enforcement Port | 0/? | Not started | - |
| 4. Marketplace UI and Install Docs | 0/? | Not started | - |

## Coverage

All 15 v1 requirements mapped to exactly one phase. No orphans.

| Requirement | Phase |
|-------------|-------|
| SKILL-01 | 1 |
| SKILL-02 | 1 |
| SKILL-03 | 1 |
| CMD-01 | 2 |
| CMD-02 | 2 |
| CMD-03 | 2 |
| AGNT-01 | 2 |
| AGNT-02 | 2 |
| HOOK-01 | 3 |
| HOOK-02 | 3 |
| HOOK-03 | 3 |
| HOOK-04 | 3 |
| MKTPL-01 | 4 |
| MKTPL-02 | 4 |
| MKTPL-03 | 4 |

---
*Created: 2026-05-05*
