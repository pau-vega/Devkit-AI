# AI-Devkit

A curated collection of Claude Code plugins — `typescript-rules`, `jsdoc-standards`, and
`workflow-toolkit` — installable into Claude Code, Cursor, or OpenCode with a single
command.

## Install

```bash
npx devkit-ai
```

## What the installer prompts

1. **Editor** — Claude Code, Cursor, or OpenCode.
2. **Scope** — project (committed to the repo), project-local (gitignored, just for you),
   or user-global (every project on this machine).
3. **Plugins** — multi-select; all three are pre-checked. Empty selection cancels the run.
4. **Conflicts** — when a destination file already exists, the installer asks per file
   whether to overwrite, skip (default), or abort. On the first conflict the installer
   also asks once whether to apply your choice to every remaining conflict in this run,
   so you do not have to answer the same question repeatedly.

Ctrl-C at any prompt is a clean exit — no files are written until you confirm at the end
of the prompt flow.

## Where files land

| Editor      | project / project-local         | user-global               |
| ----------- | ------------------------------- | ------------------------- |
| Claude Code | `<cwd>/.claude/`                | `~/.claude/`              |
| Cursor      | `<cwd>/.cursor/`                | `~/.cursor/`              |
| OpenCode    | `<cwd>/.opencode/`              | `~/.config/opencode/`     |

Inside each target the installer writes the standard subdirectories — `skills/`,
`commands/`, `agents/`, and either `hooks/hooks.json` (Claude Code, OpenCode) or
`hooks.json` at the root (Cursor). For project-local scope, the installer maintains a
delimited block in `<cwd>/.gitignore` listing every file it wrote, so re-running the
installer replaces the block in place and never duplicates entries:

```text
# >>> AI-Devkit
.claude/skills/typescript-conventions/SKILL.md
.claude/commands/ts-review.md
...
# <<< AI-Devkit
```

## Known limitations

- **OpenCode hooks are skipped.** OpenCode does not consume `hooks.json`; it expects a
  TypeScript plugin instead. Skills and commands are installed; real-time enforcement
  hooks won't fire under OpenCode until a TypeScript port ships.
- **Cursor agents are skipped.** Cursor does not currently expose a portable agent file
  format, so `agents/*.md` from `typescript-rules` and `jsdoc-standards` is not copied
  for Cursor targets. The skills and commands carry the relevant context.
- **Cursor user-global scope ships best-effort.** Only `~/.cursor/hooks.json` and
  `~/.cursor/hooks/` are formally documented. Commands, rules, and skills at user scope
  follow the same shape but are not officially documented by Cursor.

## Flags

| Flag        | Effect                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run` | Print every file that would be written, without touching disk. Existing destinations are listed as `would write (overwrites existing)` — no prompts fire. |
| `--help`    | Show usage and exit.                                                                                                                              |
| `--version` | Print the installer version and exit.                                                                                                             |

## Releasing (maintainer note)

Releases are managed by [release-please](https://github.com/googleapis/release-please). On every push to `main`, release-please opens (or
updates) a PR that bumps the version in `package.json` and `.claude-plugin/marketplace.json`
and appends a changelog entry. Merging that PR creates a GitHub release with a `vX.Y.Z` tag,
which triggers the `publish` job in `.github/workflows/release-please.yml`. That job runs
`npm pack --dry-run` (sanity check) and then `npm publish` to the public npm registry,
authenticated by an `NPM_TOKEN` secret (an npm access token with publish permissions,
stored in the repository's GitHub secrets).

---

# typescript-rules

A Claude Code plugin that enforces TypeScript coding conventions with automatic validation, code review, and a dedicated reviewer agent.

## Overview

This plugin provides opinionated TypeScript conventions and enforces them automatically as you code. It includes a comprehensive conventions guide, shell hooks that block non-compliant patterns, prompt-based validation on file writes, and an agent-powered code reviewer.

## Features

- **Conventions skill** — full TypeScript style guide covering types, error handling, imports, naming, and dependencies
- **Code review agent** — AI-powered reviewer that checks files against the conventions and reports issues with severity levels
- **`/ts-review` command** — run a code review on specific files, directories, or your uncommitted changes
- **Enforcement hooks** — automatically blocks `any`, `enum`, `export default`, manual `package.json` edits, and non-pnpm package managers

## Installation

Requires [Claude Code](https://docs.anthropic.com/en/docs/claude-code) v1.0.33 or later.

### 1. Add the marketplace

From within Claude Code, run:

```
/plugin marketplace add pau-vega/ai-devkit
```

### 2. Install the plugin

```
/plugin install typescript-rules@pau-vega-ai-devkit
```

### 3. Activate

Run `/reload-plugins` to load the plugin without restarting.

### Alternative: test locally

Clone the repo and load it directly:

```bash
git clone https://github.com/pau-vega/ai-devkit.git
claude --plugin-dir ./ai-devkit
```

## Usage

### Review your code

```
/typescript-rules:ts-review              # reviews uncommitted changes or last commit
/typescript-rules:ts-review src/utils    # reviews a specific directory
/typescript-rules:ts-review src/app.ts   # reviews a specific file
```

### Reference conventions

Ask Claude to use the `typescript-conventions` skill when writing or reviewing TypeScript code. The conventions are applied automatically on every file write and edit via prompt hooks.

### Hooks

No setup needed — hooks activate automatically once the plugin is installed. They block non-compliant patterns in real time and suggest the correct alternative.

---

# jsdoc-standards

A Claude Code plugin that enforces consistent JSDoc documentation across TypeScript projects with three configurable enforcement levels.

## Overview

This plugin provides opinionated JSDoc documentation rules and warns about missing documentation as you code. It includes a full conventions reference, a PreToolUse hook that warns (never blocks) on missing JSDoc, an on-demand review command, and a dedicated reviewer agent.

## Features

- **Conventions skill** — full JSDoc style guide covering format, tag usage, and the three enforcement levels (Minimal, Standard, Strict)
- **JSDoc review command** — run a documentation audit at a chosen level
- **Reviewer agent** — autonomous JSDoc coverage checker with Error/Warning/Suggestion severity
- **PreToolUse hook** — warns (never blocks) when exported TypeScript constructs are missing JSDoc

## Installation

### 1. Add the marketplace

From within Claude Code, run:

```
/plugin marketplace add pau-vega/ai-devkit
```

### 2. Install the plugin

```
/plugin install jsdoc-standards@pau-vega-ai-devkit
```

### 3. Activate

Run `/reload-plugins` to load the plugin without restarting.

## Usage

### Review your JSDoc coverage

```
/jsdoc-standards:jsdoc-review                 # standard level, changed files
/jsdoc-standards:jsdoc-review strict          # strict level, changed files
/jsdoc-standards:jsdoc-review minimal src/utils  # minimal level, specific path
```

### Reference conventions

Ask Claude to use the `jsdoc-conventions` skill when writing or documenting TypeScript code. The conventions are applied automatically on every file write and edit via prompt hooks.

### Hooks

No setup needed — hooks activate automatically once the plugin is installed. They warn about missing JSDoc in real time.

---

# workflow-toolkit

A Claude Code plugin that ships developer workflow skills for planning, design review, and product requirements. Five skills cover the full lifecycle from idea stress-testing to PRD writing, issue breakdown, TDD implementation, and codebase architecture improvement.

## Skills

- **grill-me** — interview-style interrogation of a plan, design, or idea
- **write-a-prd** — draft a Product Requirements Document
- **prd-to-issues** — break a PRD into small, well-scoped issues
- **tdd** — test-driven development guidance with deep-module design references
- **improve-codebase-architecture** — find refactoring opportunities and deepen modules

## Installation

### 1. Add the marketplace

From within Claude Code, run:

```
/plugin marketplace add pau-vega/ai-devkit
```

### 2. Install the plugin

```
/plugin install workflow-toolkit@pau-vega-ai-devkit
```

### 3. Activate

Run `/reload-plugins` to load the plugin without restarting.

## Usage

### Introduce the workflow skill set

```
/workflow-toolkit:create-workflow
```

This command is the entry point — it tells Claude about the available workflow skills so you can invoke them by name.

### Invoke a skill

After running `/create-workflow`, ask Claude to use any skill by name (e.g., "grill me on this design" or "write a PRD for X").
