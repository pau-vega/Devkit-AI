# Roadmap: Dual-Runtime Compatibility (OpenCode + Cursor)

**Project:** my-marketplace — Dual-Runtime Compatibility (OpenCode + Cursor)
**Core Value:** Developers using OpenCode or Cursor get the same real-time convention enforcement and on-demand review experience as Claude Code users.
**Granularity:** Coarse (4 phases)

## Phases

- [ ] **Phase 1: Skills Compatibility** - All SKILL.md files are auto-discovered and readable by OpenCode AND Cursor agents
- [ ] **Phase 2: Commands and Agents Port** - On-demand review commands and agents work in OpenCode (full) and Cursor (commands via disable-model-invocation skills; agents inline — no portable subagent file)
- [ ] **Phase 3: Hook Enforcement Port** - Real-time convention enforcement fires on write/edit in OpenCode (TypeScript plugin) and Cursor (`.cursor/hooks.json` reusing existing shell scripts verbatim)
- [ ] **Phase 4: Marketplace UI and Install Docs** - Landing page advertises tri-runtime compatibility (Claude Code + OpenCode + Cursor) with three install paths

## Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Skills Compatibility | OpenCode and Cursor agents load conventions passively | SKILL-01..03, CUR-SKILL-01..03 | 6 criteria |
| 2 | Commands and Agents Port | On-demand review works in OpenCode (full) and Cursor (skill-based) | CMD-01..03, AGNT-01..02, CUR-CMD-01..03 | 6 criteria |
| 3 | Hook Enforcement Port | Real-time pattern guards fire in OpenCode and Cursor | HOOK-01..04, CUR-HOOK-01..03 | 7 criteria |
| 4 | Marketplace UI and Install Docs | Page communicates tri-runtime compatibility | MKTPL-01..03, CUR-MKTPL-01..03 | 6 criteria |

## Phase Details

### Phase 1: Skills Compatibility
**Goal:** OpenCode AND Cursor agents passively load TypeScript, JSDoc, and workflow conventions. OpenCode auto-discovers via `.claude/skills/` (compat path); Cursor requires `.cursor/skills/<name>/` (real directories or symlinks from canonical `skills/`).
**Depends on:** Nothing
**Requirements:** SKILL-01, SKILL-02, SKILL-03, CUR-SKILL-01, CUR-SKILL-02, CUR-SKILL-03
**Success Criteria:**
1. An OpenCode agent asked about TypeScript conventions returns guidance sourced from the typescript-rules skill (confirming auto-discovery via `.claude/skills/`)
2. An OpenCode agent asked about JSDoc conventions returns guidance sourced from the jsdoc-standards skill
3. An OpenCode agent working on any workflow task can load all 5 workflow-toolkit skills by name without a file path
4. A Cursor agent in a project with `.cursor/skills/typescript-rules/` returns the same TypeScript guidance via `/typescript-rules` invocation
5. A Cursor agent loads jsdoc-standards from `.cursor/skills/jsdoc-standards/SKILL.md` with `paths:` frontmatter scoping it to JS/TS files
6. A Cursor agent finds all 5 workflow-toolkit skills under `.cursor/skills/<name>/` and can invoke each by name
**Plans:** TBD
**UI hint**: no

### Phase 2: Commands and Agents Port
**Goal:** OpenCode users can run `/ts-review`, `/jsdoc-review`, and `/create-workflow` and receive structured review reports identical in substance to the Claude Code experience. Cursor users get the same commands via `disable-model-invocation: true` skills (Cursor's substitute for custom slash commands).
**Depends on:** Phase 1
**Requirements:** CMD-01, CMD-02, CMD-03, AGNT-01, AGNT-02, CUR-CMD-01, CUR-CMD-02, CUR-CMD-03
**Capability gap:** Cursor has no portable subagent file format. AGNT-01 and AGNT-02 ship for Claude Code + OpenCode only. Cursor users get equivalent UX via the command-skill (CUR-CMD-01/02) which inlines the reviewer prompt — the active agent runs the review in-context rather than dispatching to a subagent.
**Success Criteria:**
1. Running `/ts-review` in an OpenCode session dispatches the typescript-reviewer agent and returns a report with Error/Warning/Suggestion severity levels
2. Running `/jsdoc-review` in an OpenCode session dispatches the jsdoc-reviewer agent and returns a structured JSDoc coverage report
3. Running `/create-workflow` introduces the workflow-toolkit skill set to the active session
4. Typing `/ts-review` in Cursor invokes the disable-model-invocation skill and produces the same Error/Warning/Suggestion report (reviewer prompt inlined)
5. Typing `/jsdoc-review` in Cursor produces the same structured JSDoc coverage report as the OpenCode/Claude Code variants
6. Typing `/create-workflow` in Cursor introduces the workflow-toolkit skill set to the session
**Plans:** TBD
**UI hint**: no

### Phase 3: Hook Enforcement Port
**Goal:** OpenCode enforces the same pattern-matching rules as Claude Code hooks via a TypeScript plugin (`.opencode/plugins/*.ts`). Cursor enforces them via `.cursor/hooks.json` reusing the existing shell scripts verbatim. Field names verified live before any enforcement ships.
**Depends on:** Phase 2
**Requirements:** HOOK-01, HOOK-02, HOOK-03, HOOK-04, CUR-HOOK-01, CUR-HOOK-02, CUR-HOOK-03
**Capability gap:** OpenCode has no prompt-based LLM hooks (#20387). The existing `"type": "prompt"` JSDoc hook ships for Claude Code + Cursor only. OpenCode users get equivalent coverage via the on-demand `/jsdoc-review` command.
**Success Criteria:**
1. A test plugin logging the OpenCode hook payload confirms the camelCase `output.args.filePath` schema (one-line sanity check; research already confirms via official `.env` example)
2. Writing a TypeScript file with `any`, `enum`, or `export default` in an OpenCode session is blocked with a descriptive error message
3. Writing a TypeScript file that exports a function without a JSDoc comment in an OpenCode session is blocked with a descriptive error message
4. Existing `.sh` scripts using `tool_input.file_path` (snake_case) continue to block correctly in Claude Code AND Cursor — no fallback needed; OpenCode does not pipe stdin to shell scripts
5. Writing a TypeScript file with `any`/`enum`/`export default` in a Cursor session is blocked via `.cursor/hooks.json` reusing the existing shell scripts verbatim
6. The `"type": "prompt"` JSDoc hook ports to Cursor's `.cursor/hooks.json` verbatim (with `timeout` added) and blocks missing-JSDoc writes via LLM evaluation
7. Cursor `subagentStart` / `preToolUse` interaction empirically validated (CUR-HOOK-03) — confirms whether subagent tool calls trigger hooks (analog to OpenCode #5894)
**Plans:** TBD
**UI hint**: no

### Phase 4: Marketplace UI and Install Docs
**Goal:** The marketplace landing page clearly communicates which plugins support which runtimes, shows tri-runtime compatibility badges, and gives developers an unambiguous install path for all three runtimes.
**Depends on:** Phase 3
**Requirements:** MKTPL-01, MKTPL-02, MKTPL-03, CUR-MKTPL-01, CUR-MKTPL-02, CUR-MKTPL-03
**Success Criteria:**
1. Each plugin card on `marketplace.html` displays an OpenCode compatibility badge visible without scrolling
2. The install section shows distinct, clearly labeled instructions for Claude Code (`--plugin-dir`) and OpenCode (manual file-placement steps)
3. Running `scripts/build-marketplace.sh` after adding `.opencode/` components to a plugin automatically reflects those components in the regenerated page
4. Each plugin card on `marketplace.html` displays a Cursor compatibility badge alongside the Claude Code and OpenCode badges (three columns)
5. The install section shows Cursor-specific instructions (copy `.cursor/` into project root) distinct from the other two runtimes
6. Running `scripts/build-marketplace.sh` discovers `.cursor/` components in addition to `.opencode/` and reflects them in the regenerated page
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

All 27 v1 requirements mapped to exactly one phase. No orphans.

| Requirement | Phase |
|-------------|-------|
| SKILL-01 | 1 |
| SKILL-02 | 1 |
| SKILL-03 | 1 |
| CUR-SKILL-01 | 1 |
| CUR-SKILL-02 | 1 |
| CUR-SKILL-03 | 1 |
| CMD-01 | 2 |
| CMD-02 | 2 |
| CMD-03 | 2 |
| AGNT-01 | 2 |
| AGNT-02 | 2 |
| CUR-CMD-01 | 2 |
| CUR-CMD-02 | 2 |
| CUR-CMD-03 | 2 |
| HOOK-01 | 3 |
| HOOK-02 | 3 |
| HOOK-03 | 3 |
| HOOK-04 | 3 |
| CUR-HOOK-01 | 3 |
| CUR-HOOK-02 | 3 |
| CUR-HOOK-03 | 3 |
| MKTPL-01 | 4 |
| MKTPL-02 | 4 |
| MKTPL-03 | 4 |
| CUR-MKTPL-01 | 4 |
| CUR-MKTPL-02 | 4 |
| CUR-MKTPL-03 | 4 |

---
*Created: 2026-05-05*
*Updated: 2026-05-06 — extended scope to dual-runtime (OpenCode + Cursor) per research quick task 260506-612*
