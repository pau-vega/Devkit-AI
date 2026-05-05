# Pitfalls Research — OpenCode Compatibility

**Domain:** Claude Code plugin → OpenCode parity
**Researched:** 2026-05-05
**Overall confidence:** HIGH (critical pitfalls verified via official docs and open GitHub issues)

---

## Critical Pitfalls

These will silently or loudly break existing behavior with near-certainty.

---

### 1. hooks.json Is a Dead Format in OpenCode

**What goes wrong:** The entire `hooks.json` + shell script architecture (PreToolUse → bash script → exit 2 to block) does not exist in OpenCode. OpenCode's plugin system is TypeScript/JavaScript modules, not JSON config files executing shell commands. Every hook script in `typescript-rules/hooks/` and `jsdoc-standards/hooks/` will be ignored.

**Root cause:** OpenCode's extensibility is programmatic, not declarative. Claude Code's hook system is configuration-driven (JSON → shell). OpenCode's equivalent is `tool.execute.before` in a TypeScript plugin file. There is no config format that maps PreToolUse to a shell command.

**Consequences:**
- All real-time enforcement vanishes: no `no-any.sh`, no `no-enum.sh`, no `enforce-pnpm.sh`, no `lint-before-commit.sh`
- Plugin appears to load silently (no error), but hooks fire zero times
- Users get no convention enforcement at all

**Verified by:** GitHub issue #12472 on anomalyco/opencode — explicitly states "hooks are not supported natively" and are open/unresolved.

**Prevention:** Reimplement every hook as a TypeScript `tool.execute.before` plugin function in `.opencode/plugin/`. Do not attempt to call hooks.json from opencode.json — it will silently do nothing.

---

### 2. Stdin JSON Schema Is Completely Different

**What goes wrong:** Every shell script does `INPUT=$(cat)` and then uses `jq -r '.tool_name'`, `.tool_input.file_path`, `.tool_input.content`, `.tool_input.new_string`, `.tool_input.command`. None of these field paths exist in OpenCode's plugin API.

**Root cause:** Claude Code passes a flat JSON object to stdin with snake_case fields nested under `tool_input`. OpenCode's plugin hooks receive structured TypeScript parameters — two arguments: `(input, output)` where `input.tool` is the tool name (string) and `output.args` contains tool arguments with camelCase field names.

**Field name mapping (Claude Code → OpenCode):**

| Claude Code stdin path | OpenCode hook parameter |
|---|---|
| `.tool_name` | `input.tool` |
| `.tool_input.file_path` | `output.args.filePath` |
| `.tool_input.content` | `output.args.content` |
| `.tool_input.new_string` | `output.args.newString` |
| `.tool_input.command` | `output.args.command` |

**Consequences:** If any attempt is made to invoke the existing shell scripts from an OpenCode bridge/shim, all jq extractions return empty/null and the guards silently pass every call.

**Verified by:** OpenCode plugin guides (multiple sources confirm camelCase `filePath`, `newString`, `command`); the snake_case names are Claude Code-specific.

**Prevention:** When rewriting hooks as TypeScript plugins, use `output.args.filePath` (not `file_path`) and `output.args.newString` (not `new_string`). Verify against the OpenCode source for `write.ts` and `edit.ts` as field names may not be documented exhaustively.

---

### 3. Tool Names Are Lowercase in OpenCode, PascalCase in Claude Code

**What goes wrong:** All hook scripts check `TOOL=$(echo "$INPUT" | jq -r '.tool_name')` and compare against `"Write"`, `"Edit"`, `"Bash"`. In OpenCode, tool names are lowercase: `"write"`, `"edit"`, `"bash"`.

**Root cause:** Claude Code uses PascalCase tool names as identifiers. OpenCode uses lowercase. The hooks.json `matcher` field also uses PascalCase (`"Write|Edit"`, `"Bash"`), which has no equivalent in OpenCode.

**Consequences:** Any TypeScript shim that tries to port the shell logic but keeps the original tool name comparison strings (`=== "Write"`) will always evaluate false. Every guard passes silently.

**Verified by:** Official OpenCode tools documentation lists all built-in tool names in lowercase. Multiple community plugin examples confirm `input.tool === "write"` and `input.tool === "bash"`.

**Prevention:** In all TypeScript plugin rewrites, use lowercase comparisons: `input.tool === "write"`, `input.tool === "edit"`, `input.tool === "bash"`.

---

### 4. `${CLAUDE_PLUGIN_ROOT}` Does Not Exist in OpenCode

**What goes wrong:** Agent files reference `${CLAUDE_PLUGIN_ROOT}/skills/typescript-conventions/SKILL.md` and command files reference the same variable to load skill content. OpenCode has no equivalent environment variable. Plugin context provides `directory` (the CWD) and `worktree` (git root), neither of which points to the plugin's own installation directory.

**Root cause:** Claude Code injects `CLAUDE_PLUGIN_ROOT` as a special variable pointing to the installed plugin's directory. OpenCode does not have a plugin installation directory concept — plugins are either local `.opencode/` files or npm packages; there is no runtime path injection.

**Consequences:**
- Agents will fail to load their skill files (path resolves to undefined or cwd-relative)
- Commands that construct skill paths will break
- The entire "load conventions skill then review" pattern falls apart

**Verified by:** GitHub issues anthropics/claude-code#27145 and #9354 confirm CLAUDE_PLUGIN_ROOT is Claude Code-specific. OpenCode plugin docs show only `directory` and `worktree` in context.

**Prevention:** In OpenCode agents/commands, reference skill content using relative paths from the project root (`.opencode/skills/...`) or use `import.meta.url` inside a TypeScript plugin to compute absolute paths. Alternatively, embed skill content directly in the agent system prompt for OpenCode-specific variants.

---

### 5. `"type": "prompt"` Hooks Have No OpenCode Equivalent

**What goes wrong:** The `typescript-rules` hooks.json includes an inline prompt-based hook that sends proposed code to Claude for rule-checking and responds `approve` or `deny`. OpenCode has no equivalent mechanism for firing a secondary LLM validation inside a hook.

**Root cause:** Claude Code supports `"type": "prompt"` in hooks, which spawns an LLM call inline to validate the tool input. OpenCode plugin hooks are synchronous/async TypeScript code only — they cannot themselves invoke an LLM call and block on the result.

**Consequences:**
- The semantic TypeScript validation (no intersection types used for inheritance, no `T | undefined` for optional props) cannot be replicated as a real-time hook in OpenCode
- Pattern-matching guards (no-any.sh, no-enum.sh) can be ported to TypeScript, but the nuanced rules require LLM judgment

**Verified by:** OpenCode plugin architecture (tool.execute.before receives TypeScript context only). Feature request #20387 proposes reactive sub-agent spawning from hooks — it is open and unimplemented.

**Prevention:** Accept a capability gap here: replicate only the regex-based checks (no `any`, no `enum`, no `export default`) as TypeScript plugins. Document that the prompt-based semantic check is Claude Code-only. The on-demand agent review command covers the gap for OpenCode users.

---

## Probable Pitfalls

These may break depending on implementation choices and OpenCode version.

---

### 6. Agent `model: sonnet` Shorthand Not Supported

**What goes wrong:** Both `ts-reviewer.md` and `jsdoc-reviewer.md` use `model: sonnet` in frontmatter. OpenCode requires the full provider-qualified ID (`anthropic/claude-sonnet-4-20250514`). The shorthand will either be silently ignored (agent falls back to global default) or cause a parse error.

**Verified by:** OpenCode agents documentation explicitly states model IDs must use `provider/model-id` format. Multiple examples show `anthropic/claude-sonnet-4-5` style.

**Prevention:** Replace `model: sonnet` with `model: anthropic/claude-sonnet-4-20250514` in any OpenCode-targeted agent files. Keep the Claude Code versions unchanged.

---

### 7. `allowed-tools: [Agent]` Frontmatter Field Is Not an OpenCode Concept

**What goes wrong:** Commands like `ts-review.md` and `jsdoc-review.md` use `allowed-tools: [Agent]` to declare that only the Agent subagent tool is available. OpenCode has no `Agent` tool — subagent dispatch uses the `task` tool and is controlled via the `permission.task` field, not an allowlist.

**Verified by:** OpenCode command docs show frontmatter fields `agent`, `subtask`, `model`, `description` — no `allowed-tools`. Subagent invocation is controlled via `subtask: true` and `agent: <name>`.

**Prevention:** Replace `allowed-tools: [Agent]` with `agent: <reviewer-name>` + `subtask: true` in OpenCode-targeted command files.

---

### 8. `tool.execute.before` Does Not Fire for Subagent Tool Calls

**What goes wrong:** When an OpenCode primary agent uses the `task` tool to spawn a subagent (e.g., when a command dispatches the reviewer agent), the subagent's subsequent `read`, `glob`, `grep`, `bash` calls do NOT trigger `tool.execute.before` hooks registered in the plugin. Hook coverage silently disappears for the entire subagent execution tree.

**Verified by:** GitHub issue anomalyco/opencode#5894 — confirmed security bug where "Any agent can bypass plugin restrictions by delegating work to a subagent."

**Consequences:** Convention-enforcement hooks won't fire when an agent (not the user/primary agent) writes or edits files.

**Prevention:** Keep subagent use in reviewers (read-only). Do not use a subagent for file-writing operations that need hook coverage. Accept that hooks only protect primary-agent tool calls in OpenCode for now.

---

### 9. MCP Tool Calls Do Not Trigger Plugin Hooks

**What goes wrong:** If any MCP tool is invoked during a session, `tool.execute.before` and `tool.execute.after` hooks do not fire for those calls. This is a known gap that existed as of mid-2025.

**Verified by:** GitHub issue anomalyco/opencode#2319 — confirmed and has an open PR.

**Prevention:** Avoid relying on plugin hooks for MCP tool validation. This is low-risk for this specific codebase (no MCP tools in current plugins), but worth noting for future expansion.

---

## Claude Code Assumptions That Break

Concrete patterns in this codebase that will not work in OpenCode, tied to specific files.

---

### Pattern 1: `INPUT=$(cat)` + jq pipeline

**Files affected:** All 7 shell scripts in `typescript-rules/hooks/scripts/` and 1 in `jsdoc-standards/hooks/scripts/`

**What breaks:** Shell scripts are never invoked. Even if somehow called, stdin would contain no JSON because OpenCode does not pipe tool input to shell processes.

**What to do instead:** Rewrite as `tool.execute.before` TypeScript function with `output.args.*` access.

---

### Pattern 2: `exit 2` to block tool calls

**Files affected:** `no-any.sh`, `no-enum.sh`, `no-export-default.sh`, `no-package-json-edit.sh`, `enforce-pnpm.sh`, `typecheck-before-commit.sh`

**What breaks:** Exit code 2 is the Claude Code signal for "block this tool call." OpenCode's block mechanism is `throw new Error("reason")` inside the TypeScript hook. Exit codes from a process are irrelevant.

**What to do instead:** `throw new Error("Blocked: do not use 'any'...")` inside the TypeScript hook function.

---

### Pattern 3: `{"systemMessage": "..."}` JSON output to stdout

**File affected:** `warn-missing-jsdoc.sh`

**What breaks:** The JSDoc hook outputs `{"systemMessage":"..."}` to stdout to inject a warning into Claude's context without blocking. OpenCode has no equivalent mechanism — throwing in the hook blocks, not throwing does nothing visible. Injecting context into conversation is not supported by `tool.execute.before` without using the `experimental.chat.system.transform` hook (a separate plugin hook for system prompt modification).

**What to do instead:** Either (a) use `experimental.chat.system.transform` to inject standing instructions, or (b) convert the warning to a blocking `throw` with actionable guidance, or (c) accept that soft warnings are a Claude Code-only feature.

---

### Pattern 4: `"matcher": "Write|Edit"` regex in hooks.json

**Files affected:** `typescript-rules/hooks/hooks.json`, `jsdoc-standards/hooks/hooks.json`

**What breaks:** The matcher field is a Claude Code construct for filtering which tool triggers the hook. In OpenCode TypeScript plugins, the developer manually checks `input.tool` inside the hook function. There is no declarative matcher layer.

**What to do instead:** Use `if (input.tool === "write" || input.tool === "edit")` inside the TypeScript `tool.execute.before` handler.

---

### Pattern 5: `${CLAUDE_PLUGIN_ROOT}` in agent and command files

**Files affected:** `ts-reviewer.md`, `jsdoc-reviewer.md`, `jsdoc-review.md`

**What breaks:** Path references like `${CLAUDE_PLUGIN_ROOT}/skills/typescript-conventions/SKILL.md` will not resolve in OpenCode. The agent will either emit an error or attempt to read a path starting with a literal `${CLAUDE_PLUGIN_ROOT}` string.

**What to do instead:** Reference skills by name using OpenCode's native `skill` tool (agents call `skill({ name: "typescript-conventions" })`) rather than reading the file directly via `Read`. Skills stored at `.opencode/skills/<name>/SKILL.md` are discovered automatically.

---

### Pattern 6: `tools: ["Read", "Glob", "Grep", "Bash"]` agent frontmatter

**Files affected:** `ts-reviewer.md`, `jsdoc-reviewer.md`

**What breaks:** The `tools` field in OpenCode agent frontmatter is deprecated. It still works but is superseded by the `permission` field. More critically, tool names must be lowercase (`read`, `glob`, `grep`, `bash`). PascalCase names may be silently ignored.

**What to do instead:** Replace `tools: ["Read", "Glob", "Grep", "Bash"]` with permission-based config, or at minimum lowercase all tool names: `tools: ["read", "glob", "grep", "bash"]`.

---

## Prevention Strategies

| Pitfall | Detection | Mitigation |
|---|---|---|
| hooks.json silently ignored | Add a test plugin that logs every `tool.execute.before` call; verify it fires on write | Rewrite hooks as TypeScript plugins from the start — do not attempt to bridge the shell scripts |
| Wrong field names (snake_case vs camelCase) | `console.log(output.args)` in a test hook, inspect actual shape | Use camelCase (`filePath`, `newString`) and verify against a live session |
| Tool name case mismatch | Log `input.tool` value and assert lowercase | Always compare against lowercase: `"write"`, `"edit"`, `"bash"` |
| CLAUDE_PLUGIN_ROOT undefined | Load a skill in an agent and observe the error | Use OpenCode's native `skill` tool instead of direct file reads |
| model shorthand | Create an agent and observe which model runs (add logging) | Use full `provider/model-id` format |
| Subagent hook bypass | Write a test where a hook should fire during subagent execution; verify it does not | Architect hooks to fire at primary-agent level only; reviewers remain read-only |
| `allowed-tools: [Agent]` ignored | Run a command and observe whether non-Agent tools are accessible | Replace with `agent:` + `subtask: true` |

---

## Confidence

| Section | Confidence | Basis |
|---|---|---|
| hooks.json is dead in OpenCode | HIGH | GitHub issue #12472 (open, unresolved); official OpenCode docs show only TypeScript plugins |
| stdin JSON schema difference | HIGH | Multiple plugin guides confirm camelCase `output.args.filePath`; shell scripts confirm snake_case in current codebase |
| Tool name casing (lowercase vs PascalCase) | HIGH | Official OpenCode tools docs list all names in lowercase |
| CLAUDE_PLUGIN_ROOT absence | HIGH | GitHub issues #27145 and #9354 confirm variable is Claude Code-specific |
| Prompt-based hook no equivalent | HIGH | OpenCode plugin hook API is TypeScript-only; feature request #20387 is open |
| model shorthand | HIGH | Official OpenCode agents docs require `provider/model-id` format |
| allowed-tools: [Agent] | MEDIUM | OpenCode command docs show different frontmatter schema; `Agent` tool is not documented |
| Subagent hook bypass | HIGH | Confirmed security bug in issue #5894 |
| systemMessage output format | MEDIUM | Pattern confirmed in Claude Code docs; OpenCode equivalent mechanism unconfirmed |

---

## Sources

- [OpenCode Plugins Documentation](https://opencode.ai/docs/plugins/)
- [OpenCode Agents Documentation](https://opencode.ai/docs/agents/)
- [OpenCode Commands Documentation](https://opencode.ai/docs/commands/)
- [OpenCode Tools Documentation](https://opencode.ai/docs/tools/)
- [OpenCode Config Documentation](https://opencode.ai/docs/config/)
- [OpenCode Skills Documentation](https://opencode.ai/docs/skills/)
- [GitHub Issue: Native Claude Code hooks compatibility (anomalyco/opencode #12472)](https://github.com/anomalyco/opencode/issues/12472)
- [GitHub Issue: Plugin hooks don't intercept subagent tool calls (anomalyco/opencode #5894)](https://github.com/anomalyco/opencode/issues/5894)
- [GitHub Issue: MCP Tool Calls Don't Trigger Plugin Hooks (anomalyco/opencode #2319)](https://github.com/anomalyco/opencode/issues/2319)
- [GitHub Issue: CLAUDE_PLUGIN_ROOT not set for SessionStart hooks (anthropics/claude-code #27145)](https://github.com/anthropics/claude-code/issues/27145)
- [OpenCode vs Claude Code Hooks Comparison](https://gist.github.com/zeke/1e0ba44eaddb16afa6edc91fec778935)
- [OpenCode Plugins Guide (community)](https://gist.github.com/johnlindquist/0adf1032b4e84942f3e1050aba3c5e4a)
