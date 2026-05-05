# Research Summary — OpenCode Compatibility

**Project:** my-marketplace (Claude Code plugin marketplace)
**Domain:** AI coding agent plugin compatibility layer
**Researched:** 2026-05-05
**Confidence:** MEDIUM-HIGH (core API confirmed; two field-level details need empirical validation)

---

## Executive Summary

OpenCode is a TUI-first, provider-agnostic AI coding agent built on TypeScript/Bun that shares the same conceptual extension model as Claude Code — agents, commands, skills — but with entirely different file formats and no shell-script hooks. The three plugins in this marketplace (typescript-rules, jsdoc-standards, workflow-toolkit) map cleanly onto OpenCode's native constructs: skills are already auto-discovered from `.claude/skills/` paths (zero changes needed), commands and agents require frontmatter rewrites with the same markdown body, and hook enforcement requires a full rewrite from bash scripts to TypeScript `tool.execute.before` plugins. No existing Claude Code files are modified; every OpenCode addition lives under a new `.opencode/` subdirectory inside each plugin directory.

The recommended approach is purely additive: write parallel `.opencode/` trees per plugin, reuse skill files as-is (add YAML frontmatter if missing), rewrite command/agent frontmatter for OpenCode's field schema, and reimplement the pattern-matching hook rules as TypeScript functions. The biggest structural difference is that OpenCode hooks are TypeScript modules, not JSON config invoking shell commands — every `.sh` script must become an `if (input.tool === "write") { ... throw new Error(...) }` guard. Prompt-based hooks (`"type": "prompt"`) have no OpenCode equivalent and must be accepted as a capability gap; on-demand agent review fills that gap for OpenCode users.

The key risk is silent failure: OpenCode will load without errors even when `hooks.json` exists, but hooks will never fire. There is also no `--plugin-dir` equivalent in OpenCode, so the install story changes from a single flag to a manual file-placement step. The marketplace landing page and install docs need to communicate both realities clearly. Field-name differences (snake_case in Claude Code stdin vs camelCase in OpenCode hook parameters; lowercase tool names in OpenCode vs PascalCase in Claude Code) will silently break any port that does not account for them.

---

## Key Findings

- **Skills require zero new files.** OpenCode natively scans `.claude/skills/<name>/SKILL.md`. Existing skill files only need YAML frontmatter (`name:`, `description:`) added — no path changes, no duplication.
- **hooks.json is completely dead in OpenCode.** It is silently ignored at startup. Every hook must be rewritten as a TypeScript `tool.execute.before` function. This is the largest implementation effort and the highest risk of silent breakage if skipped.
- **Field names and tool name casing differ.** Claude Code stdin uses `tool_input.file_path` and PascalCase tool names (`"Write"`). OpenCode TypeScript hooks receive `output.args.filePath` and lowercase tool names (`"write"`). Mixing these up produces guards that always silently pass.
- **No `--plugin-dir` equivalent exists.** Install is a manual file-placement step, not a one-liner. The marketplace UI must document this clearly per tool.
- **The OpenCode plugin ecosystem is essentially empty** — no published TypeScript/JSDoc convention enforcement plugins exist. Being first is a genuine differentiator.

---

## Stack

**What is needed to implement OpenCode support (additive only — nothing removed):**

- **TypeScript** — Required for hook enforcement plugins (`.opencode/plugins/*.ts`). Pattern-matching rules translate directly from bash regex to TypeScript `String.includes()` or `RegExp`.
- **Bun** — Runtime for TypeScript plugins. Already required by OpenCode; no new install for users.
- **YAML frontmatter** — Added to existing SKILL.md files (`name:`, `description:` fields). Also used in new command and agent markdown files.
- **`.opencode/` directory per plugin** — The entire OpenCode extension surface. Auto-discovered at startup. No manifest needed.
- **No repo-level `package.json`** — The `.opencode/package.json` (for `@opencode-ai/plugin` type declarations) is isolated inside each plugin directory. Repo constraint satisfied.

**No new infrastructure, CI changes, or npm publishing required for v1.**

---

## Table Stakes Features

| Feature | Status | Effort |
|---------|--------|--------|
| Skills loadable by OpenCode agents | Near-zero (add YAML frontmatter) | Low |
| CLAUDE.md passive context active | Already active (OpenCode reads it as fallback) | None |
| `/ts-review`, `/jsdoc-review`, `/create-workflow` slash commands | Needs new `.opencode/commands/*.md` files (frontmatter rewrite, same body) | Low-Medium |
| Convention enforcement on write/edit (no `any`, no `enum`, etc.) | Needs TypeScript `tool.execute.before` plugin per enforcement plugin | High |
| On-demand review agent | Needs new `.opencode/agents/*.md` files (frontmatter rewrite, same system prompt) | Low-Medium |

**Capability gap accepted for v1:** Prompt-based semantic validation (`"type": "prompt"` hooks) has no OpenCode equivalent. The on-demand review command covers it for OpenCode users.

---

## Architecture

**Recommended structure: additive isolation per plugin.**

Each plugin grows one new sibling directory (`.opencode/`) holding its OpenCode-specific files. No existing file is modified. Skills are the single point of true sharing — OpenCode deliberately reads `.claude/skills/` paths.

```
<plugin>/
  .claude-plugin/plugin.json     ← unchanged
  agents/*.md                    ← unchanged (Claude Code only)
  commands/*.md                  ← unchanged (Claude Code only)
  hooks/hooks.json               ← unchanged (Claude Code only)
  hooks/scripts/*.sh             ← unchanged (Claude Code only; not bridged to OpenCode)
  skills/<name>/SKILL.md         ← SHARED (both runtimes read this natively)
  .opencode/
    commands/<name>.md           ← new (same body, OpenCode frontmatter)
    agents/<name>.md             ← new (same body, OpenCode frontmatter)
    plugins/hooks.ts             ← new (TypeScript reimplementation of .sh logic)
```

**Data flow for OpenCode:**
1. User triggers `write`/`edit`/`bash` tool
2. OpenCode fires `tool.execute.before` in `.opencode/plugins/hooks.ts`
3. Hook checks `input.tool` (lowercase), inspects `output.args.filePath` / `output.args.content` (camelCase)
4. `throw new Error("reason")` blocks; returning normally allows
5. User runs `/ts-review` → `.opencode/commands/ts-review.md` dispatches → `agent: ts-reviewer` → loads skill via native `skill({ name: "typescript-conventions" })` → reports findings

**Critical field-name translation:**

| Claude Code | OpenCode TypeScript |
|-------------|---------------------|
| `jq -r '.tool_name'` | `input.tool` |
| `jq -r '.tool_input.file_path'` | `output.args.filePath` |
| `jq -r '.tool_input.new_string'` | `output.args.newString` |
| `exit 2` to block | `throw new Error("reason")` |
| `"Write"`, `"Edit"`, `"Bash"` | `"write"`, `"edit"`, `"bash"` |
| `${CLAUDE_PLUGIN_ROOT}` | Use `skill({ name })` tool instead |
| `model: sonnet` | `model: anthropic/claude-sonnet-4-20250514` |
| `allowed-tools: [Agent]` | `agent: <name>` + `subtask: true` |

---

## Biggest Risks

**1. hooks.json silently ignored (critical)**
OpenCode starts without errors when `hooks.json` exists. Hooks never fire. Real-time enforcement vanishes completely with no warning.
Prevention: Rewrite all enforcement as TypeScript `tool.execute.before` plugins. Validate with a test hook that logs on every write before shipping.

**2. Hook parameter field names unconfirmed (high — empirical validation required)**
The exact camelCase schema (`output.args.filePath`, `output.args.newString`) comes from a third-party source. A conflicting source suggests `tool_args.*`. If the field names are wrong, every guard silently passes.
Prevention: Before Phase 3, run a logging-only test plugin that prints `JSON.stringify(output.args)` to a file on any write call. Verify field names against live output before writing enforcement logic.

**3. Subagent hook bypass (architectural — accept and document)**
When a primary agent spawns a subagent via `task`, that subagent's tool calls do NOT trigger `tool.execute.before` (confirmed open bug #5894). Hook coverage disappears for all subagent-driven writes.
Prevention: Keep reviewer subagents read-only. Never use subagents for file-writing operations that require enforcement. Document this limitation explicitly in the marketplace.

---

## Phase Ordering Recommendation

**Phase 1 — Skills compatibility** (lowest effort, highest confidence, unblocks everything)
Add YAML frontmatter to existing SKILL.md files. Confirm `.claude/skills/` auto-discovery works in a live OpenCode session. Establishes the reference pattern for agents using `skill({ name })` instead of `${CLAUDE_PLUGIN_ROOT}` file paths.

**Phase 2 — Commands and agents port** (pure markdown, no new toolchain)
Write `.opencode/commands/*.md` and `.opencode/agents/*.md` for all three plugins. Reuse body content verbatim; rewrite frontmatter for OpenCode schema. Gives OpenCode users on-demand review before hook enforcement exists. No empirical unknowns.

**Phase 3 — Hook enforcement TypeScript port** (highest complexity, requires live validation first)
Write `.opencode/plugins/hooks.ts` per enforcement plugin (typescript-rules, jsdoc-standards). Translate pattern-matching bash logic to TypeScript. Validate field names empirically before writing guards. Accept prompt-based hooks as a capability gap.

**Phase 4 — Marketplace UI and install docs update** (documents what exists; no implementation risk)
Add compatibility badges to `marketplace.html`. Update `build-marketplace.sh` to detect `.opencode/` component presence. Write dual install instructions (Claude Code one-liner vs OpenCode file-placement). Document TUI-only limitation for OpenCode slash commands.

**Dependency chain:** Skills (no deps) → Commands/Agents (agents load skills) → Hooks (validates environment exists) → UI (documents all of the above).

---

## Open Questions

1. **Exact OpenCode hook parameter schema** — Are fields `output.args.filePath` (camelCase, PITFALLS.md source) or `tool_args.file_path` (snake_case, ARCHITECTURE.md third-party source)? Must be validated via live session before Phase 3. Run: `console.log(JSON.stringify(output.args))` in a test plugin.

2. **Does `opencode --plugin-dir` exist?** — Not documented anywhere. If it does not exist, install requires manual file placement or `opencode.json` config. Validate before writing install docs.

3. **Does `CLAUDE.md` fallback fire in all project types?** — Confirmed via community gist but officially undocumented. Could change. Low risk for v1 but worth monitoring.

4. **Is the desktop GUI slash command gap fixable upstream?** — Open issue #17048. If it closes before shipping, update install docs to remove the TUI-only caveat.

5. **Prompt-based hook gap: accept or partially bridge?** — Research recommends accepting it. If the `client` SDK is available inside `tool.execute.before`, a TypeScript plugin could call the LLM synchronously and block on the result. This is feasible but adds significant complexity; validate only if the pure regex guards prove insufficient.

---

*Research completed: 2026-05-05*
*Ready for roadmap: yes*
