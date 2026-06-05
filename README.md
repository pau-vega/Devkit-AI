<div align="center">
    <h1>AI-Devkit</h1>
    <h3><em>Install powerful AI coding plugins with a single command.</em></h3>
</div>

<p align="center">
    <strong>A curated collection of reusable skills, agents, and hooks — installable into Claude Code, Cursor, or OpenCode. Source files are runtime-neutral; the installer translates per-target so no runtime is privileged.</strong>
</p>

<p align="center">
    <a href="https://github.com/pau-vega/ai-devkit/releases"><img src="https://shieldcn.dev/npm/devkit-ai.svg" alt="npm version"/></a>
    <a href="https://github.com/pau-vega/ai-devkit"><img src="https://shieldcn.dev/github/stars/pau-vega/ai-devkit.svg" alt="GitHub stars"/></a>
    <a href="https://github.com/pau-vega/ai-devkit/blob/main/LICENSE"><img src="https://shieldcn.dev/npm/license/devkit-ai.svg" alt="License"/></a>
    <a href="https://www.npmjs.com/package/devkit-ai"><img src="https://shieldcn.dev/npm/dw/devkit-ai.svg" alt="npm downloads"/></a>
    <a href="https://github.com/pau-vega/ai-devkit/actions"><img src="https://shieldcn.dev/github/ci/pau-vega/ai-devkit.svg" alt="GitHub CI"/></a>
</p>

<p align="center">
    <img src="https://shieldcn.dev/badge/Claude_Code-7c3aed.svg?style=for-the-badge" alt="Claude Code"/>
    <img src="https://shieldcn.dev/badge/Cursor-7c3aed.svg?style=for-the-badge" alt="Cursor"/>
    <img src="https://shieldcn.dev/badge/OpenCode-7c3aed.svg?style=for-the-badge" alt="OpenCode"/>
</p>

---

## Table of Contents

- [What is AI-Devkit?](#what-is-ai-devkit)
- [Get Started](#get-started)
- [Supported AI Coding Agent Integrations](#supported-ai-coding-agent-integrations)
- [What the Installer Prompts](#what-the-installer-prompts)
- [Where Files Land](#where-files-land)
- [Available Commands](#available-commands)
- [Plugins](#plugins)
  - [typescript-rules](#typescript-rules)
  - [jsdoc-standards](#jsdoc-standards)
- [Flags](#flags)
- [Known Limitations](#known-limitations)
- [Releasing (Maintainer Note)](#releasing-maintainer-note)
- [Support](#support)
- [License](#license)

## What is AI-Devkit?

AI-Devkit **eliminates the friction** of setting up AI-assisted coding environments. Instead of manually configuring skills, agents, hooks, and commands for each editor, you run a single installer that translates runtime-neutral source files into the native format of your chosen editor. Two plugins ship today — **typescript-rules** and **jsdoc-standards** — both enforcing best practices automatically as you code.

## Get Started

### 1. Run the installer

```bash
npx devkit-ai
```

### 2. Choose your editor

Pick from **Claude Code**, **Cursor**, or **OpenCode** when prompted.

### 3. Select scope

- **Project** — committed to the repo (shared with your team)
- **Project-local** — gitignored, just for you
- **User-global** — every project on this machine

### 4. Select plugins

Multi-select from available plugins. Both are pre-checked by default. Empty selection cancels the run.

### 5. Confirm

Review the summary and confirm. Ctrl-C at any prompt is a clean exit — no files are written until you confirm.

## Supported AI Coding Agent Integrations

AI-Devkit works with three major AI coding editors. See the [Where Files Land](#where-files-land) section for exact file paths.

| Editor | Skills | Commands | Agents | Hooks |
| --- | --- | --- | --- | --- |
| **Claude Code** | Full support | Full support | Full support | Full support |
| **Cursor** | Full support | Full support | Skipped (no portable format) | Full support |
| **OpenCode** | Full support | Full support (translated) | Full support (translated) | Skipped (no `hooks.json`) |

## What the Installer Prompts

1. **Editor** — Claude Code, Cursor, or OpenCode.
2. **Scope** — project (committed to the repo), project-local (gitignored, just for you),
   or user-global (every project on this machine).
3. **Plugins** — multi-select; both are pre-checked. Empty selection cancels the run.
4. **Conflicts** — when a destination file already exists, the installer asks per file
   whether to overwrite, skip (default), or abort. On the first conflict the installer
   also asks once whether to apply your choice to every remaining conflict in this run,
   so you do not have to answer the same question repeatedly.

Ctrl-C at any prompt is a clean exit — no files are written until you confirm at the end
of the prompt flow.

## Where Files Land

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

## Available Commands

After installation, your AI coding agent will have access to these commands for code quality enforcement.

### typescript-rules Commands

| Command | Description |
| --- | --- |
| `/typescript-rules:ts-review` | Review uncommitted changes or last commit |
| `/typescript-rules:ts-review <path>` | Review a specific file or directory |

### jsdoc-standards Commands

| Command | Description |
| --- | --- |
| `/jsdoc-standards:jsdoc-review` | Standard level, changed files |
| `/jsdoc-standards:jsdoc-review strict` | Strict level, changed files |
| `/jsdoc-standards:jsdoc-review minimal <path>` | Minimal level, specific path |

## Plugins

Two plugins ship today. Both install via `npx devkit-ai`; both are supported on
Claude Code and OpenCode, and ship best-effort on Cursor (agents skipped).

### typescript-rules

Opinionated TypeScript conventions with automatic validation, code review, and a
dedicated reviewer agent.

<p align="center">
    <img src="https://shieldcn.dev/badge/Claude_Code-7c3aed.svg?style=for-the-badge" alt="Claude Code"/>
    <img src="https://shieldcn.dev/badge/Cursor-7c3aed.svg?style=for-the-badge" alt="Cursor"/>
    <img src="https://shieldcn.dev/badge/OpenCode-7c3aed.svg?style=for-the-badge" alt="OpenCode"/>
</p>

#### Overview

This plugin provides opinionated TypeScript conventions and enforces them automatically as you code. It includes a comprehensive conventions guide, shell hooks that block non-compliant patterns, prompt-based validation on file writes, and an agent-powered code reviewer.

#### Features

- **Conventions skill** — full TypeScript style guide covering types, error handling, imports, naming, and dependencies
- **Code review agent** — AI-powered reviewer that checks files against the conventions and reports issues with severity levels (Claude Code and OpenCode)
- **`/ts-review` command** — run a code review on specific files, directories, or your uncommitted changes
- **Enforcement hooks** — automatically blocks `any`, `enum`, `export default`, manual `package.json` edits, and non-pnpm package managers (Claude Code and Cursor; OpenCode does not consume `hooks.json`)

#### Installation

The recommended path is the cross-runtime installer:

```bash
npx devkit-ai
```

It prompts for editor, scope, and plugins. To target a specific editor without prompts, see `npx devkit-ai --help`.

##### Claude Code (direct)

Requires [Claude Code](https://docs.anthropic.com/en/docs/claude-code) v1.0.33 or later.

From within Claude Code, add the marketplace and install:

```
/plugin marketplace add pau-vega/ai-devkit
/plugin install typescript-rules@pau-vega-ai-devkit
```

Then run `/reload-plugins` to activate without restarting.

To load a local clone directly:

```bash
git clone https://github.com/pau-vega/ai-devkit.git
claude --plugin-dir ./ai-devkit
```

##### OpenCode

Use the installer (`npx devkit-ai`) and pick `opencode`. The agent is translated at install time: the `model: sonnet` line is dropped (the agent inherits your `opencode.json` model — Anthropic, OpenAI, Google, local, anything OpenCode supports), `mode: subagent` is added, and `${CLAUDE_PLUGIN_ROOT}` paths are rewritten to relative `..` references.

##### Cursor

Use the installer (`npx devkit-ai`) and pick `cursor`. Agents are skipped (Cursor has no portable agent format); skills, commands, and hooks are installed. Restart Cursor to load the new files.

#### Usage

##### Review your code

```
/typescript-rules:ts-review              # reviews uncommitted changes or last commit
/typescript-rules:ts-review src/utils    # reviews a specific directory
/typescript-rules:ts-review src/app.ts   # reviews a specific file
```

##### Reference conventions

The assistant consults the `typescript-conventions` skill automatically when writing or reviewing TypeScript code. On Claude Code and Cursor, the prompt-based hooks also validate writes against the conventions in real time.

##### Hooks

On Claude Code and Cursor, hooks activate automatically once the plugin is installed — they block non-compliant patterns and suggest the correct alternative. OpenCode does not currently consume `hooks.json`.

### jsdoc-standards

Opinionated JSDoc documentation rules for TypeScript projects, with three
configurable enforcement levels.

<p align="center">
    <img src="https://shieldcn.dev/badge/Claude_Code-7c3aed.svg?style=for-the-badge" alt="Claude Code"/>
    <img src="https://shieldcn.dev/badge/Cursor-7c3aed.svg?style=for-the-badge" alt="Cursor"/>
    <img src="https://shieldcn.dev/badge/OpenCode-7c3aed.svg?style=for-the-badge" alt="OpenCode"/>
</p>

#### Overview

This plugin provides opinionated JSDoc documentation rules and warns about missing documentation as you code. It includes a full conventions reference, a PreToolUse hook that warns (never blocks) on missing JSDoc, an on-demand review command, and a dedicated reviewer agent.

#### Features

- **Conventions skill** — full JSDoc style guide covering format, tag usage, and the three enforcement levels (Minimal, Standard, Strict)
- **JSDoc review command** — run a documentation audit at a chosen level
- **Reviewer agent** — autonomous JSDoc coverage checker with Error/Warning/Suggestion severity (Claude Code and OpenCode)
- **PreToolUse hook** — warns (never blocks) when exported TypeScript constructs are missing JSDoc (Claude Code and Cursor; OpenCode does not consume `hooks.json`)

#### Installation

The recommended path is the cross-runtime installer:

```bash
npx devkit-ai
```

##### Claude Code (direct)

From within Claude Code:

```
/plugin marketplace add pau-vega/ai-devkit
/plugin install jsdoc-standards@pau-vega-ai-devkit
```

Then run `/reload-plugins` to activate without restarting.

To load a local clone directly:

```bash
git clone https://github.com/pau-vega/ai-devkit.git
claude --plugin-dir ./ai-devkit
```

##### OpenCode

Use the installer (`npx devkit-ai`) and pick `opencode`. The reviewer's `model` line is dropped at install time (inherits your `opencode.json` model), and plugin-root paths are rewritten to relative references.

##### Cursor

Use the installer (`npx devkit-ai`) and pick `cursor`. The reviewer agent is skipped (Cursor has no portable agent format); the command, skill, and warning hook are installed.

#### Usage

##### Review your JSDoc coverage

```
/jsdoc-standards:jsdoc-review                 # standard level, changed files
/jsdoc-standards:jsdoc-review strict          # strict level, changed files
/jsdoc-standards:jsdoc-review minimal src/utils  # minimal level, specific path
```

##### Reference conventions

The assistant consults the `jsdoc-conventions` skill automatically when writing or documenting TypeScript code. On Claude Code and Cursor, the prompt-based hook validates writes against the conventions in real time.

##### Hooks

On Claude Code and Cursor, hooks activate automatically once the plugin is installed — they warn about missing JSDoc on every write. OpenCode does not currently consume `hooks.json`.

## Flags

| Flag        | Effect                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run` | Print every file that would be written, without touching disk. Existing destinations are listed as `would write (overwrites existing)` — no prompts fire. |
| `--help`    | Show usage and exit.                                                                                                                              |
| `--version` | Print the installer version and exit.                                                                                                             |

## Known Limitations

- **OpenCode hooks are skipped.** OpenCode does not consume `hooks.json`; it expects a
  TypeScript plugin instead. Skills and commands are installed; real-time enforcement
  hooks won't fire under OpenCode until a TypeScript port ships.
- **Cursor agents are skipped.** Cursor does not currently expose a portable agent file
  format, so `agents/*.md` from `typescript-rules` and `jsdoc-standards` is not copied
  for Cursor targets. The skills and commands carry the relevant context.
- **Cursor user-global scope ships best-effort.** Only `~/.cursor/hooks.json` and
  `~/.cursor/hooks/` are formally documented. Commands, rules, and skills at user scope
  follow the same shape but are not officially documented by Cursor.
- **OpenCode agents and commands are translated at install time.** The source files
  use Claude Code's frontmatter format (`model: sonnet`, `${CLAUDE_PLUGIN_ROOT}`).
  For OpenCode targets, the installer drops the model line (so the agent inherits
  the user's `opencode.json` model — any provider), adds `mode: subagent`, removes
  Claude Code's `allowed-tools: [Agent]`, and rewrites plugin-root paths to `..`.
  The body of every agent and command reads the same in both runtimes.

## Releasing (Maintainer Note)

Releases are managed by [release-please](https://github.com/googleapis/release-please). On every push to `main`, release-please opens (or
updates) a PR that bumps the version in `package.json` and `.claude-plugin/marketplace.json`
and appends a changelog entry. Merging that PR creates a GitHub release with a `vX.Y.Z` tag,
which triggers the `publish` job in `.github/workflows/release-please.yml`. That job runs
`npm pack --dry-run` (sanity check) and then `npm publish` to the public npm registry,
authenticated by an `NPM_TOKEN` secret (an npm access token with publish permissions,
stored in the repository's GitHub secrets).

---

## Support

For support, please open a [GitHub issue](https://github.com/pau-vega/ai-devkit/issues/new). We welcome bug reports, feature requests, and questions about using AI-Devkit.

## License

This project is licensed under the terms of the MIT open source license. Please refer to the [LICENSE](./LICENSE) file for the full terms.
