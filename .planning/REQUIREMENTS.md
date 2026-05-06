# Requirements: Dual-Runtime Compatibility (OpenCode + Cursor)

**Defined:** 2026-05-05
**Core Value:** Developers using OpenCode or Cursor get the same real-time convention enforcement and on-demand review experience as Claude Code users.

## v1 Requirements

### Skills Compatibility

- [ ] **SKILL-01**: typescript-rules SKILL.md has YAML frontmatter (`name`/`description`) and is auto-discovered by OpenCode
- [ ] **SKILL-02**: jsdoc-standards SKILL.md has YAML frontmatter and is auto-discovered by OpenCode
- [ ] **SKILL-03**: workflow-toolkit all 5 SKILL.md files have YAML frontmatter and are auto-discovered by OpenCode
- [ ] **CUR-SKILL-01**: typescript-rules ships `.cursor/skills/typescript-rules/SKILL.md` (or symlink/copy from canonical `skills/`) with `name`, `description`, and `paths:` frontmatter
- [ ] **CUR-SKILL-02**: jsdoc-standards ships `.cursor/skills/jsdoc-standards/SKILL.md` with same frontmatter shape
- [ ] **CUR-SKILL-03**: workflow-toolkit ships all 5 SKILL.md files under `.cursor/skills/<name>/` discoverable by Cursor

### Commands Port

- [ ] **CMD-01**: `/ts-review` slash command works in OpenCode via `.opencode/commands/ts-review.md` with OpenCode-compatible frontmatter
- [ ] **CMD-02**: `/jsdoc-review` slash command works in OpenCode via `.opencode/commands/jsdoc-review.md`
- [ ] **CMD-03**: `/create-workflow` slash command works in OpenCode via `.opencode/commands/create-workflow.md`
- [ ] **CUR-CMD-01**: `/ts-review` available in Cursor via a Skill with `disable-model-invocation: true` (Cursor's substitute for slash commands per research §Cursor Commands)
- [ ] **CUR-CMD-02**: `/jsdoc-review` available in Cursor via the same disable-model-invocation skill pattern
- [ ] **CUR-CMD-03**: `/create-workflow` available in Cursor via the same pattern

### Agents Port

- [ ] **AGNT-01**: `typescript-reviewer` agent works in OpenCode via `.opencode/agents/typescript-reviewer.md` with OpenCode tool permissions schema
- [ ] **AGNT-02**: `jsdoc-reviewer` agent works in OpenCode via `.opencode/agents/jsdoc-reviewer.md`

> **Cursor: capability gap — no portable agent file. Reviewer prompt inlined into CUR-CMD-01/02 skill body.** Cursor's Custom Modes are UI-only and not file-portable. AGNT-01 and AGNT-02 remain Claude Code + OpenCode only.

### Hook Enforcement

- [ ] **HOOK-01**: Hook parameter field names (`output.args.*` paths) validated against a live OpenCode session before enforcement ships
- [ ] **HOOK-02**: typescript-rules `.opencode/plugins/typescript-rules.ts` enforces `no-any`, `no-enum`, `no-export-default`, `enforce-pnpm` patterns via `tool.execute.before`
- [ ] **HOOK-03**: jsdoc-standards `.opencode/plugins/jsdoc-standards.ts` enforces JSDoc presence on exported functions via `tool.execute.before`
- [ ] **HOOK-04**: Existing `.sh` scripts continue to read `tool_input.file_path` (snake_case) — works for both Claude Code AND Cursor. No fallback needed; OpenCode uses programmatic camelCase `output.args.filePath` in its TypeScript plugin instead.
- [ ] **CUR-HOOK-01**: typescript-rules ships `.cursor/hooks.json` (copy of existing `hooks.json` with `PreToolUse` → `preToolUse`, `Bash` matcher → `Shell`, `version: 1` added) plus the existing 7 shell scripts placed under `.cursor/hooks/scripts/` and reused verbatim
- [ ] **CUR-HOOK-02**: jsdoc-standards `.cursor/hooks.json` ships the same way; existing JSDoc validation scripts reused verbatim; existing `"type": "prompt"` JSDoc hook ports to Cursor verbatim with added `timeout`
- [ ] **CUR-HOOK-03**: Subagent hook coverage in Cursor empirically validated (analog to OpenCode #5894) — log `subagentStart` / `preToolUse` interaction once before enforcement ships

### Marketplace UI

- [ ] **MKTPL-01**: `marketplace.html` shows OpenCode compatibility badges on all three plugin cards
- [ ] **MKTPL-02**: `marketplace.html` shows OpenCode-specific install instructions (file-copy flow, not `--plugin-dir`)
- [ ] **MKTPL-03**: `scripts/build-marketplace.sh` updated to discover and reflect OpenCode components in the generated page
- [ ] **CUR-MKTPL-01**: `marketplace.html` shows Cursor compatibility badges on all three plugin cards (alongside Claude Code and OpenCode badges) — three columns total
- [ ] **CUR-MKTPL-02**: `marketplace.html` shows Cursor-specific install instructions (copy `.cursor/` into project root) distinct from Claude Code (`--plugin-dir`) and OpenCode (manual file copy)
- [ ] **CUR-MKTPL-03**: `scripts/build-marketplace.sh` discovers `.cursor/` components in addition to `.opencode/` and reflects them in the regenerated page

## v2 Requirements

### Prompt-Based Hook Parity

- **PBH-01**: Semantic LLM validation in hooks (equivalent to Claude Code's `"type": "prompt"` hooks) — blocked on OpenCode feature request #20387. Note: Cursor DOES support prompt-based hooks natively, so PBH-01 is OpenCode-only — not a v2 gap for Cursor.
- **PBH-02**: Subagent hook enforcement — blocked on OpenCode bug #5894 (hooks bypass subagent tool calls). OpenCode-specific.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New plugins | This milestone is parity only |
| `--plugin-dir` equivalent | OpenCode has no single-flag install — manual file copy is the only mechanism |
| Rewriting existing Claude Code behavior | OpenCode support is purely additive |
| Prompt-based hooks (v1, OpenCode) | No OpenCode equivalent — feature request unimplemented |
| CI/CD changes | Not required for OpenCode compatibility |
| Portable Cursor subagent file | Cursor's Custom Modes are UI-only; reviewer prompts inline into command-skills instead |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SKILL-01 | Phase 1 | Pending |
| SKILL-02 | Phase 1 | Pending |
| SKILL-03 | Phase 1 | Pending |
| CUR-SKILL-01 | Phase 1 | Pending |
| CUR-SKILL-02 | Phase 1 | Pending |
| CUR-SKILL-03 | Phase 1 | Pending |
| CMD-01 | Phase 2 | Pending |
| CMD-02 | Phase 2 | Pending |
| CMD-03 | Phase 2 | Pending |
| AGNT-01 | Phase 2 | Pending |
| AGNT-02 | Phase 2 | Pending |
| CUR-CMD-01 | Phase 2 | Pending |
| CUR-CMD-02 | Phase 2 | Pending |
| CUR-CMD-03 | Phase 2 | Pending |
| HOOK-01 | Phase 3 | Pending |
| HOOK-02 | Phase 3 | Pending |
| HOOK-03 | Phase 3 | Pending |
| HOOK-04 | Phase 3 | Pending |
| CUR-HOOK-01 | Phase 3 | Pending |
| CUR-HOOK-02 | Phase 3 | Pending |
| CUR-HOOK-03 | Phase 3 | Pending |
| MKTPL-01 | Phase 4 | Pending |
| MKTPL-02 | Phase 4 | Pending |
| MKTPL-03 | Phase 4 | Pending |
| CUR-MKTPL-01 | Phase 4 | Pending |
| CUR-MKTPL-02 | Phase 4 | Pending |
| CUR-MKTPL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 27 total (15 original + 12 Cursor)
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-05-05*
*Last updated: 2026-05-06 to extend scope to dual-runtime (OpenCode + Cursor) per research 260506-612*
