# Stack Research — OpenCode Compatibility

**Project:** Devkit-AI (Claude Code plugin marketplace)
**Researched:** 2026-05-05
**Research mode:** Ecosystem / Feasibility

---

## What Is OpenCode

OpenCode is an open-source, terminal-first AI coding agent created by the SST team (sst/opencode on GitHub,
formerly anomalyco/opencode). It is positioned as a provider-agnostic alternative to Claude Code: it works
with Anthropic Claude, OpenAI, Google, and local models. Its UI is a TUI (terminal user interface) built for
neovim users and shell-first developers, with a client/server architecture that enables remote operation.

**Key facts:**
- GitHub: https://github.com/sst/opencode
- Documentation: https://opencode.ai/docs
- Language: TypeScript (60%), MDX (36%)
- Runtime: Bun (not Node)
- Distribution: npm, Homebrew, Arch AUR, Scoop, desktop app (macOS/Windows/Linux)
- Active community on Discord; the project is actively maintained as of 2026

**Built-in agents:** Build (all tools, default), Plan (read-only analysis), General subagent, Explore subagent.

**Built-in tools:** `bash`, `read`, `write`, `edit`, `glob`, `grep`, `apply_patch`, `task`, `skill`,
`webfetch`, `websearch`, `question`, `todowrite`, `lsp` (experimental). Tool names are lowercase strings.

---

## Plugin/Extension Mechanisms

OpenCode has six extension points, listed from most to least applicable to this project:

### 1. Skills (`.opencode/skills/<name>/SKILL.md`)

Native OpenCode equivalent of Claude Code skills. OpenCode's `skill` built-in tool allows agents to
discover and load skill files on-demand.

- **File format:** Markdown with YAML frontmatter (`name`, `description` required; `license`,
  `compatibility`, `metadata` optional). Body is markdown instructions.
- **Discovery paths (project):** `.opencode/skills/<name>/SKILL.md`
- **Discovery paths (global):** `~/.config/opencode/skills/<name>/SKILL.md`
- **Claude Code compat paths:** `.claude/skills/<name>/SKILL.md` and `~/.claude/skills/` are also scanned.
- **How agents use them:** The `skill` tool lists available skills by name and description. Agents invoke
  `skill({ name: "skill-name" })` to load full content into context.
- **Confidence:** HIGH — documented at https://opencode.ai/docs/skills/

### 2. Custom Commands (`.opencode/commands/<name>.md`)

Native OpenCode equivalent of Claude Code slash commands.

- **File format:** Markdown with YAML frontmatter followed by a prompt template.
- **Frontmatter fields:** `description`, `agent` (which agent runs it), `model`, `subtask` (boolean — force
  subagent invocation), and argument support via `$ARGUMENTS`, `$1`, `$2`.
- **Discovery paths (project):** `.opencode/commands/`
- **Discovery paths (global):** `~/.config/opencode/commands/`
- **Invocation:** User types `/command-name` in the TUI.
- **Known limitation:** The GUI only supports a hard-coded list; `.opencode/commands/` are ignored in the
  desktop GUI. TUI works correctly. CLI `opencode run` also cannot execute slash commands currently (open
  issue #5073).
- **Confidence:** HIGH for TUI path — documented at https://opencode.ai/docs/commands/

### 3. Agents (`.opencode/agents/<name>.md`)

Native OpenCode equivalent of Claude Code agents.

- **File format:** Markdown with YAML frontmatter; body becomes the system prompt.
- **Frontmatter fields:** `description`, `mode` (`primary`, `subagent`, or `all`), `model`, `temperature`,
  `steps`, `permission` (fine-grained tool access: allow/ask/deny per tool).
- **Discovery paths (project):** `.opencode/agents/`
- **Discovery paths (global):** `~/.config/opencode/agents/`
- **Invocation:** Subagents invoked via `@agent-name` in the TUI, or via the `agent` field in a command's
  frontmatter (with `subtask: true` to isolate context).
- **Tool access:** Agents can access all built-in tools; permissions constrain which ones are active.
- **Confidence:** HIGH — documented at https://opencode.ai/docs/agents/

### 4. Rules / Instructions (`AGENTS.md` or `opencode.json` `instructions` field)

Native OpenCode equivalent of Claude Code `CLAUDE.md` / skills used as passive context.

- **Primary file:** `AGENTS.md` in the project root (or any ancestor directory up to git root).
- **Global file:** `~/.config/opencode/AGENTS.md`
- **Claude Code compat:** OpenCode automatically reads `CLAUDE.md` in project roots and `~/.claude/CLAUDE.md`
  globally when no `AGENTS.md` is present. This is undocumented but confirmed (disable with
  `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1`).
- **Alt format:** `instructions` array in `opencode.json` accepts paths, globs, and remote URLs.
- **How it works:** Content is injected passively into every LLM context — no activation required.
- **Confidence:** HIGH for AGENTS.md — documented at https://opencode.ai/docs/rules/. MEDIUM for CLAUDE.md
  compat — confirmed via community gist, undocumented officially.

### 5. Plugins (`.opencode/plugins/<name>.ts`)

OpenCode's hook system for intercepting tool calls. This is the equivalent of Claude Code's `hooks.json`
shell scripts, but requires **TypeScript/JavaScript** — not shell scripts.

- **File format:** TypeScript (or JavaScript) module exporting a `Plugin` function.
- **Runtime:** Bun (auto-installed). Dependencies go in `.opencode/package.json`.
- **Discovery paths (project):** `.opencode/plugins/` (auto-loaded at startup)
- **Discovery paths (global):** `~/.config/opencode/plugins/`
- **npm packages:** Listed in `opencode.json` `plugin` array; Bun installs them at startup.
- **Key hooks available:**
  - `tool.execute.before` — runs before any tool call; throw to block execution
  - `tool.execute.after` — runs after tool call completes
  - `session.created`, `session.compacted`, `session.updated` — session lifecycle
  - `file.edited` — reacts to file edits
  - `chat.message` — intercepts messages
  - `chat.params` — modifies LLM parameters
  - `permission.ask` — automatic permission responses (known reliability issues in current versions)
  - `experimental.session.compacting` — customize context in summaries
- **Blocking tool calls:** `throw new Error("reason")` inside `tool.execute.before`.
- **Plugin context object:** `{ project, client, directory, worktree, $ }` where `$` is Bun's shell API
  (enables calling shell scripts from TypeScript).
- **Confidence:** HIGH — documented at https://opencode.ai/docs/plugins/

### 6. Config File (`opencode.json`)

- **Project config:** `opencode.json` or `.opencode/opencode.json` (JSONC supported)
- **Global config:** `~/.config/opencode/opencode.json`
- **Supports:** inline agent definitions, inline command definitions, `instructions` arrays, `plugin` arrays,
  `mcp` server config, tool permissions, model overrides, formatter config, LSP config.
- **Confidence:** HIGH — documented at https://opencode.ai/docs/config/

---

## Equivalence Map

| Claude Code Feature | OpenCode Equivalent | Supported? | Notes |
|---|---|---|---|
| `--plugin-dir` flag | `.opencode/` directory convention | Partial | No single flag; each component goes in its own `.opencode/<type>/` subdirectory. No shareable "load this dir" primitive. |
| `hooks.json` (PreToolUse shell scripts) | `.opencode/plugins/<name>.ts` with `tool.execute.before` | Yes, different format | OpenCode hooks must be TypeScript/JS, not shell scripts. Shell scripts can be called via Bun's `$` API from inside the plugin. |
| `commands/*.md` (slash commands) | `.opencode/commands/<name>.md` | Yes | Same markdown format. YAML frontmatter differs. Works in TUI; GUI and CLI `run` have known gaps. |
| `agents/*.md` (subagents) | `.opencode/agents/<name>.md` | Yes | Same concept. Frontmatter fields differ (mode, permission vs Claude Code's allowed-tools). |
| `skills/*/SKILL.md` (passive reference) | `.opencode/skills/<name>/SKILL.md` | Yes, native | OpenCode has a native `skill` tool. YAML frontmatter required. `.claude/skills/` also scanned (compat). |
| `.claude-plugin/plugin.json` (manifest) | No direct equivalent | No | OpenCode has no plugin manifest or registry concept. Components are discovered by directory convention. |
| `CLAUDE.md` (project context) | `AGENTS.md` (preferred) or `CLAUDE.md` (compat) | Yes | OpenCode reads `CLAUDE.md` automatically as fallback (undocumented). `AGENTS.md` is the native name. |
| Prompt-based hooks (type: "prompt") | Plugin `tool.execute.before` with `client` API | Partial | No declarative prompt-hook syntax. Must call LLM manually via the `client` SDK inside a TypeScript plugin. |

---

## Config Files OpenCode Reads

Listed in precedence order (later overrides earlier):

| File | Scope | Description |
|---|---|---|
| `opencode.json` (project root) | Project | Primary project config. JSONC supported. Defines models, agents, commands, plugins, instructions, permissions. |
| `.opencode/opencode.json` | Project | Alternate project config location; same format. Merged with root config. |
| `~/.config/opencode/opencode.json` | Global | Global defaults. Same format as project config. |
| `tui.json` (in config dir) | Global | TUI-specific settings: theme, keybinds, scroll speed, mouse. Kept separate from functional config. |
| `AGENTS.md` (project root, or any ancestor up to git root) | Project | Passive LLM instructions. Injected into every context automatically. Native equivalent of CLAUDE.md. |
| `~/.config/opencode/AGENTS.md` | Global | Global passive instructions. |
| `CLAUDE.md` (project root) | Project | Read as fallback when AGENTS.md absent. Undocumented Claude Code compat feature. |
| `~/.claude/CLAUDE.md` | Global | Read as fallback for global instructions. Disable with `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1`. |
| `.opencode/commands/<name>.md` | Project | Slash command definitions. One file per command. |
| `~/.config/opencode/commands/<name>.md` | Global | Global slash commands. |
| `.opencode/agents/<name>.md` | Project | Custom agent definitions. One file per agent. |
| `~/.config/opencode/agents/<name>.md` | Global | Global agent definitions. |
| `.opencode/skills/<name>/SKILL.md` | Project | Agent skill files. One folder per skill. |
| `~/.config/opencode/skills/<name>/SKILL.md` | Global | Global skills. |
| `.claude/skills/<name>/SKILL.md` | Project | Claude Code compat skill path. Also scanned by OpenCode. |
| `~/.claude/skills/<name>/SKILL.md` | Global | Global Claude Code compat skills. |
| `.opencode/plugins/<name>.ts` | Project | TypeScript plugin files. Auto-loaded at startup. |
| `~/.config/opencode/plugins/<name>.ts` | Global | Global TypeScript plugins. |
| `.opencode/package.json` | Project | npm/Bun dependencies for plugins. Bun installs at startup. |

---

## Recommended Stack for Compatibility

### Approach: Additive OpenCode Directory Convention

Add an `.opencode/` directory to each plugin alongside the existing `.claude-plugin/` layout. No existing
Claude Code files are modified. Every OpenCode component lives in its own typed subdirectory.

**Rationale:** OpenCode auto-discovers components from `.opencode/<type>/` directories. There is no manifest
to register — just place files in the right place. This satisfies the PROJECT.md constraint that OpenCode
support must be additive and must not break Claude Code behavior.

#### Per-plugin layout addition:

```
<plugin>/
  .claude-plugin/plugin.json      ← untouched
  agents/*.md                     ← untouched (Claude Code)
  commands/*.md                   ← untouched (Claude Code)
  hooks/hooks.json                ← untouched (Claude Code)
  hooks/scripts/*.sh              ← untouched (Claude Code)
  skills/<name>/SKILL.md          ← reusable as-is (OpenCode also reads .claude/skills/)

  .opencode/
    commands/<name>.md            ← NEW: OpenCode slash commands (same concept, different frontmatter)
    agents/<name>.md              ← NEW: OpenCode agents (same concept, different frontmatter)
    skills/<name>/SKILL.md        ← NEW (or symlink to ../skills/) — OpenCode native skill path
    plugins/hooks.ts              ← NEW: TypeScript plugin replacing hooks.json shell scripts
```

#### Skills: likely zero new files needed

OpenCode scans `.claude/skills/` as a compat path. The existing `skills/*/SKILL.md` files only need YAML
frontmatter added (or the files can be symlinked into `.opencode/skills/`). This is the lowest-effort win.

#### Hooks: TypeScript rewrite required (no shell script path)

OpenCode hooks require a TypeScript plugin — there is no shell script hook mechanism. The `.ts` plugin can
call out to the existing `.sh` scripts via Bun's `$` shell API to avoid duplicating logic. Example:

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const TypeScriptRulesHooks: Plugin = async ({ $ }) => {
  return {
    tool: {
      execute: {
        before: async (input) => {
          if (input.tool === "write" || input.tool === "edit" || input.tool === "bash") {
            const result = await $`echo ${JSON.stringify(input)} | bash ./hooks/scripts/check-typescript.sh`
            if (result.exitCode !== 0) {
              throw new Error(result.stderr.toString())
            }
          }
        }
      }
    }
  }
}
```

This preserves the existing shell scripts while satisfying OpenCode's TypeScript-only plugin requirement.

#### Commands and Agents: markdown rewrite, same structure

OpenCode commands and agents use the same markdown-with-frontmatter pattern as Claude Code, but with
different frontmatter fields. The body (prompt content) can be largely reused. Frontmatter keys to change:

| Claude Code | OpenCode |
|---|---|
| `allowed-tools: [Agent]` | `subtask: true` (in command); `mode: subagent` (in agent) |
| `model: sonnet` | `model: anthropic/claude-sonnet-4-5` |
| `${CLAUDE_PLUGIN_ROOT}` variable | No equivalent; use relative paths or `{file:./path}` substitution |

#### No plugin manifest needed

OpenCode has no `.claude-plugin/plugin.json` equivalent. The `.opencode/` directory itself is the
"manifest" — its presence and contents declare what the plugin provides. Install instructions for users
will say: "Copy (or symlink) the plugin's `.opencode/` directory into your project's `.opencode/` folder,
or add each component to your global `~/.config/opencode/` directories."

#### Dependency consideration

Plugins require Bun at runtime. The `.opencode/package.json` only needs `@opencode-ai/plugin` as a
dependency. Since the repo has no existing `package.json`, this file is additive and isolated inside
`.opencode/`.

---

## Pitfall: No `--plugin-dir` Equivalent

Claude Code's `--plugin-dir ./Devkit-AI` loads all three plugins in one command. OpenCode has no such
flag. Users installing for OpenCode must manually copy or symlink each plugin's `.opencode/` subdirectories.
This changes the install story and the marketplace UI will need to communicate it clearly.

## Pitfall: Prompt-Based Hooks Require TypeScript LLM Calls

Claude Code's `"type": "prompt"` hooks in `hooks.json` are declarative — Claude Code handles the LLM call.
OpenCode has no equivalent declarative syntax. To replicate prompt-based validation, the TypeScript plugin
must call the LLM itself via the `client` SDK. This is feasible but adds complexity.

## Pitfall: Plugin Auto-Load Requires Bun

OpenCode loads `.opencode/plugins/*.ts` at startup using Bun's runtime. Users must have Bun installed.
OpenCode itself requires Bun (it is the runtime), so any OpenCode user already has Bun — this is not a
blocker, just worth noting.

## Pitfall: GUI Slash Commands Not Loaded from `.opencode/commands/`

The desktop GUI hard-codes its command list and ignores project `.opencode/commands/`. Commands only work
in the TUI. This is an open limitation (issue #17048) and means the marketplace should document that
OpenCode slash commands require the TUI, not the GUI.

---

## Confidence

| Area | Confidence | Reasoning |
|---|---|---|
| What OpenCode is | HIGH | Official docs, GitHub, multiple community sources |
| Skills support | HIGH | Documented at opencode.ai/docs/skills/; native feature |
| Custom commands | HIGH | Documented at opencode.ai/docs/commands/; confirmed format |
| Agents | HIGH | Documented at opencode.ai/docs/agents/; confirmed format |
| Plugin hooks (tool.execute.before) | HIGH | Documented at opencode.ai/docs/plugins/; multiple examples verified |
| CLAUDE.md compat | MEDIUM | Confirmed via community gist; officially undocumented; could change |
| Prompt-based hook equivalent | MEDIUM | Feasible via client SDK but no official example for this use case |
| No plugin-dir equivalent | HIGH | No flag exists; directory convention confirmed in docs |
| GUI slash command gap | HIGH | Multiple open GitHub issues confirm it |
| Plugin requires TypeScript (no shell) | HIGH | All plugin examples and docs show TS/JS only |

---

## Sources

- OpenCode official docs: https://opencode.ai/docs/
- Plugins: https://opencode.ai/docs/plugins/
- Commands: https://opencode.ai/docs/commands/
- Agents: https://opencode.ai/docs/agents/
- Skills: https://opencode.ai/docs/skills/
- Rules: https://opencode.ai/docs/rules/
- Config: https://opencode.ai/docs/config/
- GitHub repo: https://github.com/sst/opencode
- CLAUDE.md compat gist: https://gist.github.com/zeke/c6bed98a445e559b0d3563087b5e6764
- Plugin guide gist: https://gist.github.com/johnlindquist/0adf1032b4e84942f3e1050aba3c5e4a
- DEV.to hooks guide: https://dev.to/einarcesar/does-opencode-support-hooks-a-complete-guide-to-extensibility-k3p
- GUI slash command issue: https://github.com/anomalyco/opencode/issues/17048
- Plugin slash command issue: https://github.com/anomalyco/opencode/issues/10262
