# jsdoc-standards

A plugin that enforces consistent JSDoc documentation across TypeScript projects, with three configurable enforcement levels. Installable into Claude Code, Cursor, or OpenCode via `npx devkit-ai`.

## Enforcement Levels

| Level | What's documented |
|-------|-------------------|
| **Minimal** | Exported functions, classes, interfaces, type aliases (summary only) |
| **Standard** | Minimal + `@param`, `@returns` tags, public class methods |
| **Strict** | Standard + constants, private helpers, `@example`, `@throws`, `@see`, `{@link}` |

## Components

### Skill: `jsdoc-conventions`

Reference guide with the full JSDoc style rules. The assistant consults this automatically when writing or documenting TypeScript code.

### Command: `jsdoc-review`

User-invoked review command:

```
/jsdoc-review                    # Standard level, changed files
/jsdoc-review strict             # Strict level, changed files
/jsdoc-review minimal src/utils  # Minimal level, specific path
```

### Agent: `jsdoc-reviewer`

Autonomous reviewer that triggers when you ask about JSDoc quality (e.g., "review my JSDocs", "check documentation coverage"). Reports findings by file with Error/Warning/Suggestion severity. Available for Claude Code and OpenCode; Cursor has no portable agent file format.

### Hooks

PreToolUse hook on Write/Edit that **warns** (never blocks) when exported TypeScript constructs are missing JSDoc comments. Claude Code only — OpenCode does not consume `hooks.json`, and Cursor's hook schema differs.

## Configuration

The warning hook can be disabled per project without uninstalling the plugin. Create `.claude/jsdoc-standards.local.md` in the project root:

```markdown
---
enabled: false
---

The markdown body is ignored by the hooks — use it for notes.
```

Available keys (every key defaults to `true` when the file or key is absent; only an explicit `false` disables):

| Key | Hook |
|-----|------|
| `enabled` | Master switch for the plugin's hooks |
| `warn_missing_jsdoc` | The missing-JSDoc warning on Write/Edit |

The settings file is read on every hook invocation, so changes take effect immediately — no restart needed. Settings are per-developer — add `.claude/*.local.md` to your `.gitignore`.

## Installation

```bash
npx devkit-ai
```

The installer prompts for editor (Claude Code / OpenCode / Cursor), scope (project / project-local / user), and which plugins to install. To install jsdoc-standards into Claude Code without the installer:

```bash
git clone https://github.com/pau-vega/Devkit-AI.git
claude --plugin-dir ./Devkit-AI/plugins/jsdoc-standards
```

## License

MIT
