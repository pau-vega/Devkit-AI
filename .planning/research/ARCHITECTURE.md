# Architecture Research — OpenCode Compatibility

**Researched:** 2026-05-05
**Overall confidence:** MEDIUM (plugin TypeScript API is HIGH; hooks.yaml stdin payload field names are LOW — requires validation against live OpenCode)

---

## Recommended Structure

The cleanest approach is a **parallel sibling directory per plugin**, not a shared adapter layer. Each plugin grows one new directory — `.opencode/` — that holds its OpenCode-specific files, keeping Claude Code files completely untouched. No existing file is modified; all OpenCode content is additive.

```
<plugin>/
  .claude-plugin/plugin.json          ← unchanged
  agents/*.md                         ← unchanged (Claude Code only)
  commands/*.md                       ← unchanged (Claude Code only)
  hooks/hooks.json                    ← unchanged (Claude Code only)
  hooks/scripts/*.sh                  ← reused by OpenCode hooks.yaml (same shell scripts)
  skills/<name>/SKILL.md              ← SHARED — read by both Claude Code and OpenCode natively
  .opencode/
    commands/<name>.md                ← OpenCode slash commands (same markdown format as Claude Code)
    agents/<name>.md                  ← OpenCode agent definitions (same markdown format, different frontmatter fields)
    hooks/
      hooks.yaml                      ← OpenCode hook declarations (invokes the existing .sh scripts)
```

At the repository root level, no new manifest is needed. OpenCode discovers `.opencode/` directories when you run `opencode` from the plugin root, or when the plugin root is on the `--plugin-dir` search path.

---

## Component Boundaries

### What is shared (zero duplication)

| Component | How it is shared | Confidence |
|-----------|-----------------|------------|
| `skills/<name>/SKILL.md` | OpenCode natively searches `.claude/skills/*/SKILL.md` and `.opencode/skills/*/SKILL.md` in priority order. The existing skill files sit at `typescript-rules/skills/typescript-conventions/SKILL.md` etc. — no move required, just ensure the frontmatter has `name:` and `description:` fields. OpenCode reads them as-is. | HIGH |
| `hooks/scripts/*.sh` | The shell scripts read stdin JSON and exit with code 0 (allow) or 2 (block). This exit-code protocol is identical in OpenCode's `hooks.yaml` bash actions. The scripts can be reused without modification, with one caveat: the stdin JSON field names differ (see Hooks section below). | MEDIUM |

### What needs an OpenCode-specific version

| Component | Why a new file is needed | Confidence |
|-----------|-------------------------|------------|
| `hooks/hooks.json` | This is a Claude Code-proprietary format (`PreToolUse`, `matcher`, `${CLAUDE_PLUGIN_ROOT}`). OpenCode has no native reader for it. A parallel `.opencode/hooks/hooks.yaml` is required. | HIGH |
| `commands/*.md` | The frontmatter field `allowed-tools: [Agent]` is Claude Code-specific. OpenCode commands use `agent:` and `model:` fields instead. Content (the prompt body) is identical. | HIGH |
| `agents/*.md` | The `tools: ["Read", "Glob", "Grep", "Bash"]` field and `color:` are Claude Code-specific. OpenCode agents use `permission:` maps and `mode: subagent`. A new agent file is needed per plugin, though the system prompt body can be copied verbatim. | HIGH |

### What does not exist in OpenCode (capability gap)

| Claude Code feature | OpenCode equivalent | Status |
|--------------------|---------------------|--------|
| `type: prompt` hooks (inline LLM validation in hooks.json) | No equivalent at the hooks layer. The closest is a TypeScript plugin calling the OpenCode `client` SDK. Requires a `.opencode/plugins/plugin.ts` file — the only place JavaScript/TypeScript is needed. | MEDIUM (requires validation) |
| `${CLAUDE_PLUGIN_ROOT}` variable in hook commands | Use `OPENCODE_PROJECT_DIR` env var (provided to every bash action) instead. Scripts need a one-line change per script, or a wrapper in hooks.yaml using `bash: "SCRIPT_DIR=$OPENCODE_PROJECT_DIR/hooks/scripts && ..."`. | HIGH |
| Sub-agent dispatch via `allowed-tools: [Agent]` | OpenCode commands can specify `agent: <name>` in frontmatter to route to a named agent automatically. Same UX, different declaration. | HIGH |

---

## Data Flow

### Claude Code path (unchanged)

```
User triggers Write/Edit/Bash tool
  → Claude Code reads hooks.json for matching PreToolUse hooks
  → Spawns bash scripts with stdin JSON (tool_name, tool_input.file_path, tool_input.content / new_string)
  → Script exits 0 (allow) or 2 (block, stderr message returned as feedback)
  → If allowed: prompt-based hook fires inline LLM validation
User runs /ts-review
  → commands/ts-review.md dispatched
  → Spawns ts-reviewer agent
  → Agent reads skills/typescript-conventions/SKILL.md via ${CLAUDE_PLUGIN_ROOT}
  → Agent reports findings
```

### OpenCode path (new)

```
User triggers write/edit/bash tool
  → OpenCode reads .opencode/hooks/hooks.yaml for matching tool.before.* hooks
  → Spawns bash scripts (same .sh files) with stdin JSON (tool_name, tool_args.{file_path,content,new_string})
    NOTE: field names differ — see Stdin JSON Delta below
  → Script exits 0 (allow) or 2 (block, stderr message shown as error)
  → Prompt-based validation: requires .opencode/plugins/plugin.ts to replicate
User runs /ts-review (same command name)
  → .opencode/commands/ts-review.md dispatched
  → Routes to ts-reviewer agent (defined in .opencode/agents/ts-reviewer.md)
  → Agent loads skill via native skill tool or by reading SKILL.md directly
  → Agent reports findings
```

### Stdin JSON Delta (critical for bash script reuse)

The existing `.sh` scripts extract fields using `jq`:

```bash
# Claude Code format:
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content')        # Write tool
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string')     # Edit tool
```

OpenCode's `hooks.yaml` bash actions provide the same data at different paths:

```bash
# OpenCode format (via KristjanPikhof/OpenCode-Hooks):
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_args.file_path')
CONTENT=$(echo "$INPUT" | jq -r '.tool_args.content')
CONTENT=$(echo "$INPUT" | jq -r '.tool_args.new_string')
```

The field name `tool_input` → `tool_args`. This is LOW confidence — it comes from a third-party plugin's documentation, not the official OpenCode source. **This must be validated against a live OpenCode session before shipping hooks.**

The recommended mitigation: write a thin wrapper in each `.sh` script that tries `.tool_input.file_path` first, then falls back to `.tool_args.file_path`. This makes scripts work under both runtimes without duplication:

```bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_args.file_path // empty')
```

---

## Build Order

The build script (`scripts/build-marketplace.sh`) currently discovers Claude Code components only. For OpenCode support it needs two additions, and order matters:

1. **Validate/add SKILL.md frontmatter** — Before anything else, confirm all `SKILL.md` files have the required `name:` and `description:` YAML frontmatter. OpenCode will silently ignore skills missing these fields. The build script can warn on missing fields.

2. **Create `.opencode/` trees** — This is authoring work, not a build step. These files are committed to the repo and do not need generation.

3. **Update `discover_hooks()`** — The build script's `discover_hooks` function currently reads `hooks.json`. It should be extended to also read `.opencode/hooks/hooks.yaml` and include OpenCode hooks in the marketplace metadata (for the compatibility badge display). Since `hooks.yaml` uses a different schema, this requires a new `discover_opencode_hooks()` function in the script.

4. **Update `marketplace.html`** — Add per-plugin compatibility badges (`Claude Code`, `OpenCode`) driven by presence of the respective hook/command files. The build script emits this as a `compatibility: ["claude-code", "opencode"]` field in each plugin's JSON object.

5. **No npm / no bun required** — The `.opencode/` directories contain markdown and YAML. The optional `.opencode/plugins/plugin.ts` (for prompt-hook parity) requires Bun at the user's machine, not in CI. The existing constraint of no package.json at the repo root is maintained.

---

## Multi-Tool Coexistence Strategy

### Principle: additive isolation

Every OpenCode file lives under `.opencode/` inside each plugin directory. Every Claude Code file stays exactly where it is. No file is shared at the config-format level. Skills are the one true exception — they use a format OpenCode explicitly designed to be compatible with Claude Code's skill paths.

### Directory coexistence map

```
typescript-rules/
  .claude-plugin/plugin.json       ← Claude Code manifest
  agents/ts-reviewer.md            ← Claude Code agent
  commands/ts-review.md            ← Claude Code command
  hooks/hooks.json                 ← Claude Code hooks
  hooks/scripts/no-any.sh          ← shared shell logic (called by both)
  skills/typescript-conventions/
    SKILL.md                       ← shared (both read this natively)
  .opencode/
    agents/ts-reviewer.md          ← OpenCode agent (same body, new frontmatter)
    commands/ts-review.md          ← OpenCode command (same body, new frontmatter)
    hooks/
      hooks.yaml                   ← OpenCode hook declarations
    plugins/
      plugin.ts                    ← ONLY if prompt-hook parity is required
```

### Environment variable translation

| Claude Code | OpenCode |
|-------------|----------|
| `${CLAUDE_PLUGIN_ROOT}` | `${OPENCODE_PROJECT_DIR}` |
| Exit 2 + stderr to block | Exit 2 + stderr to block (identical) |
| `tool_name: "Write"` | `tool_name: "write"` (lowercase in OpenCode) |

The tool name casing difference is confirmed: OpenCode normalizes tool names to lowercase (`bash`, `edit`, `write`), while Claude Code uses title-case (`Bash`, `Write`, `Edit`). The `.sh` scripts that check `$TOOL` for `"Write"` vs `"Edit"` will need case normalization or the `hooks.yaml` event names (`tool.before.write`, `tool.before.edit`) make this check unnecessary.

### Install instructions coexistence

Claude Code install:
```bash
claude --plugin-dir ./typescript-rules
```

OpenCode install (proposed, needs validation):
```bash
opencode --plugin-dir ./typescript-rules
# or: add to opencode.json at project root pointing to plugin dirs
```

The marketplace landing page should show both install blocks. The build script should emit an `installCommands` object per plugin with `claudeCode` and `opencode` keys.

---

## Confidence Assessment

| Section | Confidence | Basis |
|---------|------------|-------|
| Recommended structure (`.opencode/` directories) | HIGH | Official OpenCode docs confirm `.opencode/commands/`, `.opencode/agents/`, `.opencode/plugins/` as standard paths |
| Skills compatibility | HIGH | Official OpenCode docs explicitly list `.claude/skills/*/SKILL.md` as a search path; SKILL.md frontmatter format documented at opencode.ai/docs/skills/ |
| Commands format | HIGH | Official docs show markdown + YAML frontmatter with `description:`, `agent:`, `model:` fields |
| Agents format | HIGH | Official docs show markdown + JSON config with `mode: subagent`, `permission:` fields |
| hooks.yaml via KristjanPikhof/OpenCode-Hooks | MEDIUM | This is a third-party plugin, not native OpenCode. It is well-documented but adds a dependency. Alternative: use a TypeScript plugin instead. |
| Stdin JSON field names (`tool_args` vs `tool_input`) | LOW | Derived from third-party plugin docs, not official OpenCode source. Must be validated before shipping. |
| Prompt-hook parity via TypeScript plugin | MEDIUM | OpenCode plugin API is documented and `tool.execute.before` with `throw new Error(...)` is confirmed to block. Exact LLM call syntax via `client` SDK needs verification. |
| `OPENCODE_PROJECT_DIR` env var | HIGH | Confirmed in KristjanPikhof/OpenCode-Hooks docs as standard env var provided to all bash actions |
| Tool name casing (lowercase in OpenCode) | MEDIUM | Confirmed in Claude Code vs OpenCode comparison sources; needs empirical test |

---

## Open Questions

1. **Exact stdin JSON schema for `tool.before` bash actions** — Are write/edit tool args at `.tool_args.file_path` and `.tool_args.content`, or at `.tool_input.*`? Validate by running a no-op hook script that logs the full stdin payload to a file.

2. **How OpenCode discovers per-plugin `.opencode/` directories** — When using `--plugin-dir`, does OpenCode scan for `.opencode/` inside subdirectories, or does the plugin root need its own `opencode.json`? Needs a live test.

3. **Prompt-hook parity cost** — Is replicating the inline LLM validation (the `type: prompt` hooks) worth a TypeScript plugin file, or should it be deferred as a "nice-to-have"? The shell-script hooks cover all pattern-matching rules; only the full-file semantic validation is lost.

4. **OpenCode install command for plugin directories** — The `--plugin-dir` flag behavior under OpenCode (vs Claude Code) needs empirical confirmation. Alternative is `opencode.json` with `"plugin": [...]` entries.

---

## Sources

- [OpenCode Plugins docs](https://opencode.ai/docs/plugins/) — Plugin function API, directory structure, hook event list
- [OpenCode Commands docs](https://opencode.ai/docs/commands/) — Command markdown format, frontmatter fields
- [OpenCode Agents docs](https://opencode.ai/docs/agents/) — Agent configuration, `mode: subagent`, `permission:` fields
- [OpenCode Skills docs](https://opencode.ai/docs/skills/) — SKILL.md frontmatter spec, search paths, Claude compatibility
- [OpenCode Config docs](https://opencode.ai/docs/config/) — `opencode.json` schema, `.opencode/` directory precedence
- [OpenCode Rules docs](https://opencode.ai/docs/rules/) — AGENTS.md, Claude Code `CLAUDE.md` fallback
- [KristjanPikhof/OpenCode-Hooks](https://github.com/KristjanPikhof/OpenCode-Hooks) — Third-party hooks.yaml plugin; bash stdin payload format, exit code 2 blocking
- [GitHub issue: Native Claude Code hooks compatibility](https://github.com/anomalyco/opencode/issues/12472) — Confirms hooks.json is NOT natively read by OpenCode
- [OpenCode vs Claude Code Hooks Comparison (Gist)](https://gist.github.com/zeke/1e0ba44eaddb16afa6edc91fec778935) — Structural differences, translation requirements
- [OpenCode Plugins Guide (Gist)](https://gist.github.com/johnlindquist/0adf1032b4e84942f3e1050aba3c5e4a) — Full plugin API reference, available hooks
- [joshuadavidthomas/opencode-agent-skills](https://github.com/joshuadavidthomas/opencode-agent-skills) — Real-world skill loading implementation, confirms `.claude/skills/` compatibility path
