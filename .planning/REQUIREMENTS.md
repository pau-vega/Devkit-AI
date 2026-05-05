# Requirements: OpenCode Compatibility

**Defined:** 2026-05-05
**Core Value:** Developers using OpenCode get the same real-time convention enforcement and on-demand review experience as Claude Code users.

## v1 Requirements

### Skills Compatibility

- [ ] **SKILL-01**: typescript-rules SKILL.md has YAML frontmatter (`name`/`description`) and is auto-discovered by OpenCode
- [ ] **SKILL-02**: jsdoc-standards SKILL.md has YAML frontmatter and is auto-discovered by OpenCode
- [ ] **SKILL-03**: workflow-toolkit all 5 SKILL.md files have YAML frontmatter and are auto-discovered by OpenCode

### Commands Port

- [ ] **CMD-01**: `/ts-review` slash command works in OpenCode via `.opencode/commands/ts-review.md` with OpenCode-compatible frontmatter
- [ ] **CMD-02**: `/jsdoc-review` slash command works in OpenCode via `.opencode/commands/jsdoc-review.md`
- [ ] **CMD-03**: `/create-workflow` slash command works in OpenCode via `.opencode/commands/create-workflow.md`

### Agents Port

- [ ] **AGNT-01**: `typescript-reviewer` agent works in OpenCode via `.opencode/agents/typescript-reviewer.md` with OpenCode tool permissions schema
- [ ] **AGNT-02**: `jsdoc-reviewer` agent works in OpenCode via `.opencode/agents/jsdoc-reviewer.md`

### Hook Enforcement

- [ ] **HOOK-01**: Hook parameter field names (`output.args.*` paths) validated against a live OpenCode session before enforcement ships
- [ ] **HOOK-02**: typescript-rules `.opencode/plugins/typescript-rules.ts` enforces `no-any`, `no-enum`, `no-export-default`, `enforce-pnpm` patterns via `tool.execute.before`
- [ ] **HOOK-03**: jsdoc-standards `.opencode/plugins/jsdoc-standards.ts` enforces JSDoc presence on exported functions via `tool.execute.before`
- [ ] **HOOK-04**: Existing `.sh` scripts updated with jq fallback (`tool_input.file_path // tool_args.file_path`) for dual Claude Code / OpenCode compatibility

### Marketplace UI

- [ ] **MKTPL-01**: `marketplace.html` shows OpenCode compatibility badges on all three plugin cards
- [ ] **MKTPL-02**: `marketplace.html` shows OpenCode-specific install instructions (file-copy flow, not `--plugin-dir`)
- [ ] **MKTPL-03**: `scripts/build-marketplace.sh` updated to discover and reflect OpenCode components in the generated page

## v2 Requirements

### Prompt-Based Hook Parity

- **PBH-01**: Semantic LLM validation in hooks (equivalent to Claude Code's `"type": "prompt"` hooks) — blocked on OpenCode feature request #20387
- **PBH-02**: Subagent hook enforcement — blocked on OpenCode bug #5894 (hooks bypass subagent tool calls)

## Out of Scope

| Feature | Reason |
|---------|--------|
| New plugins | This milestone is parity only |
| `--plugin-dir` equivalent | OpenCode has no single-flag install — manual file copy is the only mechanism |
| Rewriting existing Claude Code behavior | OpenCode support is purely additive |
| Prompt-based hooks (v1) | No OpenCode equivalent — feature request unimplemented |
| CI/CD changes | Not required for OpenCode compatibility |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SKILL-01 | — | Pending |
| SKILL-02 | — | Pending |
| SKILL-03 | — | Pending |
| CMD-01 | — | Pending |
| CMD-02 | — | Pending |
| CMD-03 | — | Pending |
| AGNT-01 | — | Pending |
| AGNT-02 | — | Pending |
| HOOK-01 | — | Pending |
| HOOK-02 | — | Pending |
| HOOK-03 | — | Pending |
| HOOK-04 | — | Pending |
| MKTPL-01 | — | Pending |
| MKTPL-02 | — | Pending |
| MKTPL-03 | — | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 15 ⚠️

---
*Requirements defined: 2026-05-05*
*Last updated: 2026-05-05 after initial definition*
