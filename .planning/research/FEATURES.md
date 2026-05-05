# Features Research — OpenCode Plugin Compatibility

**Domain:** Claude Code plugin marketplace → OpenCode compatibility layer
**Researched:** 2026-05-05
**Research mode:** Ecosystem / Feasibility

---

## Table Stakes (Must Have)

These are the features without which the plugins deliver zero value to an OpenCode user.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Rules/instructions loaded into context | OpenCode users expect AGENTS.md-equivalent context injection — this is the floor of usefulness | Low | OpenCode natively reads `AGENTS.md`; also reads `CLAUDE.md` as fallback if no `AGENTS.md` exists. Skills in `.claude/skills/` are auto-discovered. |
| Skills available and loadable by agents | The three plugins ship SKILL.md files — agents must be able to `skill()` them | Low | OpenCode reads `.claude/skills/<name>/SKILL.md` natively. Existing skill files need only YAML frontmatter (`name`, `description`) to work. |
| Custom slash commands | `/ts-review`, `/jsdoc-review`, `/create-workflow` must be invocable | Low-Medium | OpenCode supports markdown-based custom commands in `.opencode/commands/`. Frontmatter differs from Claude Code (`template:` field, `agent:` field). Files need rewriting but the concept maps 1:1. |
| Convention enforcement on write/edit operations | The core value of typescript-rules and jsdoc-standards — blocking bad writes in real time | High | OpenCode's equivalent is a TypeScript/JS plugin with `tool.execute.before` hook. NOT a shell script. Requires writing `.opencode/plugins/conventions.ts` (or `.js`). |
| On-demand review agent | `/ts-review` dispatches a subagent that scans files and produces Error/Warning/Suggestion report | Medium | OpenCode supports custom agents defined as markdown files in `.opencode/agents/`. Commands can reference agents via `agent:` frontmatter field. |

---

## Differentiators (Nice to Have)

These would make the OpenCode experience superior to a minimal port.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| LSP-aware violation detection | OpenCode exposes `lsp.client.diagnostics` events — plugin can cross-reference LSP errors with convention violations for richer reports | High | Requires plugin code that listens to LSP events. OpenCode has native LSP support. No equivalent in Claude Code. |
| Post-edit auto-formatter hook | `tool.execute.after` on edit events can run `prettier --write` automatically | Low | Demoed in official docs. Single plugin hook, no shell script needed. Direct upgrade over Claude Code's prompt-based validation. |
| `permission.ask` auto-approval for safe ops | Auto-approve reads/writes on known safe patterns, auto-deny on dangerous ones (e.g., `.env` access) | Low-Medium | `permission.ask` hook lets plugin set `output.status = 'allow' | 'deny'` programmatically. No Claude Code equivalent. |
| Custom tool registration | Expose a dedicated `check-typescript-conventions` tool that agents can call explicitly | Medium | OpenCode allows registering custom tools agents can invoke via the plugin framework. Creates a clean API rather than relying on hooks alone. |
| Shared `opencode.json` config snippet | Provide a ready-to-paste block that activates all three plugins at once | Low | Improves DX significantly. One `plugin` array entry per plugin, or a single multi-plugin package. |

---

## Anti-Features (Deliberately Skip)

Things from the Claude Code plugin design that should NOT be ported, or that have no meaningful equivalent.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Shell scripts as enforcement hooks | Claude Code hooks are bash scripts reading stdin JSON. OpenCode plugins are TypeScript/JS modules. Porting the shell scripts verbatim is impossible. | Rewrite enforcement logic as `tool.execute.before` TypeScript functions. Pattern matching (grep for `any`, `enum`) maps directly to `String.includes()` or regex. |
| `.claude-plugin/plugin.json` manifest | OpenCode does not discover or read `.claude-plugin/` directories. The manifest format is Claude Code-specific. | Define OpenCode plugin as a `.opencode/plugins/*.ts` file. No manifest file needed. |
| `${CLAUDE_PLUGIN_ROOT}` variable | This env var is injected by Claude Code's plugin loader. OpenCode has no equivalent. | Use `ctx.project.worktree` or `ctx.directory` from the plugin context object for path resolution. |
| Prompt-based hooks (inline `"type": "prompt"`) | Claude Code supports prompt hooks that ask Claude to validate content. OpenCode has no equivalent hook type. | Replace with TypeScript pattern matching in `tool.execute.before`. For cases needing AI judgment, use a custom tool that calls `ctx.client`. |
| `allowed-tools: [Agent]` in command frontmatter | Claude Code command frontmatter field. OpenCode command frontmatter uses `agent:` and `subtask: true` instead. | Rewrite command frontmatter using OpenCode's `agent:` field pointing to the review agent. |
| PreToolUse hook on subagents | Known unfixed bug: `tool.execute.before` does NOT intercept tool calls from subagents spawned via the `task` tool (Issue #5894, open as of 2025-12-21). | Enforce rules at the primary agent level. Document the gap. For review agents (subagents), rely on AGENTS.md/SKILL.md instructions rather than hard hooks. |

---

## Install Flow

Step-by-step: how a developer activates these plugins in OpenCode.

OpenCode has NO equivalent of Claude Code's `--plugin-dir` flag. There is no plugin marketplace install command. Plugins are file-based (local) or npm-package-based.

### Option A: File-based (no npm, matches current repo constraints)

```
1. Clone or copy the plugin directory into the project:
   git clone https://github.com/<user>/my-marketplace .opencode-plugins

2. For each plugin, place the OpenCode-specific files at the right paths:
   .opencode/plugins/typescript-rules.ts   ← enforcement hook
   .opencode/plugins/jsdoc-standards.ts    ← enforcement hook
   .opencode/commands/ts-review.md         ← slash command
   .opencode/commands/jsdoc-review.md      ← slash command
   .opencode/commands/create-workflow.md   ← slash command
   .opencode/agents/typescript-reviewer.md ← review agent
   .opencode/agents/jsdoc-reviewer.md      ← review agent
   .opencode/skills/typescript-rules/SKILL.md     ← existing (auto-discovered from .claude/skills/)
   .opencode/skills/jsdoc-standards/SKILL.md      ← existing (auto-discovered from .claude/skills/)
   .opencode/skills/workflow-toolkit/SKILL.md     ← existing (auto-discovered from .claude/skills/)

3. Add plugin entries to opencode.json (if using npm package variant):
   { "plugin": [] }
   (Not needed for file-based approach)

4. Launch OpenCode in the project:
   opencode

5. Verify with /help — custom commands should appear.
```

**Shortcut:** Because OpenCode reads `.claude/skills/` natively, skills from the existing plugin layout are auto-loaded with zero changes. Only hooks, commands, and agents need new files.

### Option B: npm package (future, not current scope)

```
1. Publish enforcement logic to npm: npm publish opencode-typescript-rules
2. Add to opencode.json: { "plugin": ["opencode-typescript-rules"] }
3. OpenCode uses Bun to install at startup from ~/.cache/opencode/node_modules/
```

This is out of scope (PROJECT.md: "No npm: Repo has no package.json").

### Activation of Rules (AGENTS.md / CLAUDE.md fallback)

OpenCode reads `CLAUDE.md` at project root if no `AGENTS.md` exists. The existing `CLAUDE.md` is therefore already partially active in OpenCode sessions — any project-level instructions it contains are injected into context. No action needed.

---

## Community Precedents

Existing OpenCode plugins/rules relevant to code convention enforcement.

**Direct precedents (convention enforcement): None found.** The awesome-opencode repository lists 100+ plugins but none explicitly target TypeScript enforcement, JSDoc standards, or code convention linting. This is a genuine gap in the ecosystem.

**Adjacent precedents that inform the approach:**

| Plugin | What it does | Relevance |
|--------|-------------|-----------|
| `CC Safety Net` | Blocks destructive git and filesystem commands | Pattern model for `tool.execute.before` blocking |
| `Envsitter Guard` | Prevents reading/editing `.env*` files | Exact same mechanism needed for typescript-rules hooks |
| `Shell Strategy` | Teaches LLM to avoid hanging shell commands | Skill-based convention enforcement (no hooks) — simpler analog |
| `opencode-ignore` (npm) | Pattern-based file ignore rules | Shows npm plugin distribution is viable |

**Platform immaturity note:** `opencode.cafe` (the community extension marketplace) showed 0 extensions in all categories at time of research. The ecosystem is early-stage; being first to publish TypeScript/JSDoc convention plugins is a differentiator.

**Issue #11807** (open, labeled "docs") confirms that users actively want to use Claude Code plugins in OpenCode but find no documentation on how to do it. This project is solving a real, documented user need.

---

## Confidence

| Section | Confidence | Basis |
|---------|------------|-------|
| Rules/AGENTS.md/CLAUDE.md fallback | HIGH | Official OpenCode docs + multiple independent sources confirm CLAUDE.md fallback behavior |
| Skills auto-discovery from `.claude/skills/` | HIGH | Official OpenCode skills docs + deepwiki community docs confirm this path is scanned |
| Plugin hook system (`tool.execute.before`) | HIGH | Official docs + gist guides + DEV.to article all demonstrate the same API |
| Commands (markdown, `.opencode/commands/`) | HIGH | Official commands docs, confirmed frontmatter fields |
| Agents (markdown, `.opencode/agents/`) | HIGH | Official agents docs, confirmed `agent:` field in commands |
| Subagent hook bypass bug | HIGH | GitHub issue #5894 open and confirmed, reported 2025-12-21 |
| No `--plugin-dir` equivalent | MEDIUM | Not mentioned anywhere in docs or issues; absence is evidence but not proof |
| No `.claude-plugin/` discovery | MEDIUM | No source mentions it; skills/rules paths are explicitly documented, plugin manifest is not |
| `opencode.cafe` marketplace emptiness | MEDIUM | Fetched live, but directory sites can lag actual ecosystem state |
| Prompt-based hook type unavailability | MEDIUM | No OpenCode source mentions this hook type; absence from all docs is strong signal |
| npm plugin distribution viability | MEDIUM | Official docs describe it; actual published OpenCode npm plugins exist (`opencode-ignore`, `opencode-helicone-session`) |

---

## Key Sources

- [OpenCode Plugins docs](https://opencode.ai/docs/plugins/)
- [OpenCode Agents docs](https://opencode.ai/docs/agents/)
- [OpenCode Rules docs](https://opencode.ai/docs/rules/)
- [OpenCode Skills docs](https://opencode.ai/docs/skills/)
- [OpenCode Commands docs](https://opencode.ai/docs/commands/)
- [OpenCode Config docs](https://opencode.ai/docs/config/)
- [GitHub issue #5894: Plugin hooks don't intercept subagent tool calls](https://github.com/anomalyco/opencode/issues/5894)
- [GitHub issue #11807: How to install Claude plugins in OpenCode](https://github.com/anomalyco/opencode/issues/11807)
- [GitHub issue #12472: Native Claude Code hooks compatibility request](https://github.com/anomalyco/opencode/issues/12472)
- [awesome-opencode community plugins](https://github.com/awesome-opencode/awesome-opencode)
- [OpenCode plugin development gist (johnlindquist)](https://gist.github.com/johnlindquist/0adf1032b4e84942f3e1050aba3c5e4a)
- [Claude Code compatibility — deepwiki](https://deepwiki.com/joshuadavidthomas/opencode-agent-skills/5.4-claude-code-compatibility)
- [SDK and extension points — deepwiki](https://deepwiki.com/sst/opencode/7-sdks-and-extension-points)
