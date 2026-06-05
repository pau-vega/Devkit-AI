<div align="center">

<pre>
..::::::::::::-:--:---=---::::::-::::-===+===--:.
.::::::::::.:::::::::------:-::::::::::-----===++===-:.
..:::::::::::::::::-:------=-=-:::--------===-====++++++==-:
..:::::::::::::::::---:--========-----==+=++++==+=++++++++++=-:
.:::::--::::......::::-:--:---===+++===-====+++++++++++=======+==-:
.::..::-:::::.......:::.::---::-===+++====---+**+++++++++=++++++=++==-:
....::::::::..........::::-:----=-==+++===-=++****+++++++++++++========-.
. .:::::::----:...........--:----------=+++==+++****+++==+++++***++========-.
..... ..::::::::-:::..... .::-:--=-----=-==++++++***++=+++++++++*++++=========-.
..........::::.::::::..... .::::-:=--:-=-=-===+++++*++++*++++++++++++========+=--.
...............::..::::::.. .... ...::::--==----==++++++*++++==++++++++=+++++++++==++++=---.
........::..:::.::-::..:...... . .. .::.:::=--=--===++==+++*++++++++++++=++==+*+++====+++=-----
......:::::::::-:.:---:.:......... .... .:.::-:=--=====+===++=+++++++++++++++++=*+++++====++==-
.....:::::::::::---:::::.......:::::. .=--: ..:.:::-=--==========+++++===+++++*+++++=+++*++=-==
.....::::::::::---:--:::........:::::. :*##+ .:.::----==--=====+=+++++=+=++++++++*++++++**+--==
......:::::::::::-------::::::::::::..:: =+#**. :.::--====-==+==+=+++=+++++++++=++++++++++*+=--
......::::::::-::----------::::::::.::..... :+**# .:::--+=+=======+++=++++++++===++++++++++*+==
.....::::::::::---------------:::::.....:........=++ ..--:-=========+=++++++++++==++++++++*++++
</pre>

# 🤖 AI-Devkit

*One installer. Any editor. Zero friction.*

```bash
npx devkit-ai
```

[![npm version](https://shieldcn.dev/npm/devkit-ai.png)](https://www.npmjs.com/package/devkit-ai)
[![npm license](https://shieldcn.dev/npm/license/devkit-ai.png?variant=outline)](./LICENSE)
[![npm downloads](https://shieldcn.dev/npm/dw/devkit-ai.png?variant=outline)](https://www.npmjs.com/package/devkit-ai)
[![GitHub release](https://shieldcn.dev/github/release/pau-vega/AI-Devkit.png?variant=outline)](https://github.com/pau-vega/AI-Devkit/releases)
[![GitHub stars](https://shieldcn.dev/github/stars/pau-vega/AI-Devkit.png?variant=outline)](https://github.com/pau-vega/AI-Devkit)

[![Claude Code](https://shieldcn.dev/badge/Claude_Code-0052CC.png?style=for-the-badge)](https://docs.anthropic.com/en/docs/claude-code)
[![Cursor](https://shieldcn.dev/badge/Cursor-237A3C.png?style=for-the-badge)](https://cursor.com)
[![OpenCode](https://shieldcn.dev/badge/OpenCode-6B21A8.png?style=for-the-badge)](https://opencode.ai)
[![Marketplace](https://shieldcn.dev/badge/Marketplace-0F766E.png?style=for-the-badge)](https://pau-vega.github.io/AI-Devkit/)

[![⭐ Star us on GitHub](https://shieldcn.dev/badge/Star_us_on_GitHub-D97706.png?style=for-the-badge)](https://github.com/pau-vega/AI-Devkit)

</div>

---

<a name="quick-links"></a>

## 🔗 Quick Links

[![Marketplace](https://shieldcn.dev/badge/Marketplace-0052CC.png?style=for-the-badge)](https://pau-vega.github.io/AI-Devkit/)
[![Docs](https://shieldcn.dev/badge/Docs-237A3C.png?style=for-the-badge)](https://github.com/pau-vega/AI-Devkit#readme)
[![Releases](https://shieldcn.dev/badge/Releases-0F766E.png?style=for-the-badge)](https://github.com/pau-vega/AI-Devkit/releases)
[![Issues](https://shieldcn.dev/badge/Issues-475569.png?style=for-the-badge)](https://github.com/pau-vega/AI-Devkit/issues)

---

<a name="table-of-contents"></a>

## 📑 Table of Contents

- [What is AI-Devkit?](#what-is-ai-devkit)
- [Plugins](#plugins)
- [Get Started](#get-started)
- [Supported Editors](#supported-editors)
- [What the Installer Prompts](#what-the-installer-prompts)
- [Where Files Land](#where-files-land)
- [Commands](#commands)
- [TypeScript Rules](#typescript-rules)
- [JSDoc Standards](#jsdoc-standards)
- [Flags](#flags)
- [Known Limitations](#known-limitations)
- [Releasing](#releasing)
- [Support](#support)
- [License](#license)

---

<a name="what-is-ai-devkit"></a>

## 🤔 What is AI-Devkit?

AI-Devkit **eliminates the friction** of setting up AI-assisted coding environments. Instead of manually configuring skills, agents, hooks, and commands for each editor, you run a single installer that translates runtime-neutral source files into the native format of your chosen editor. Source files are runtime-neutral; the installer translates per-target so no runtime is privileged.

Two plugins ship today — **typescript-rules** and **jsdoc-standards** — both enforcing best practices automatically as you code.

---

<a name="plugins"></a>

## 📦 Plugins

### ⚡ TypeScript Rules

<img alt="Claude Code" src="https://shieldcn.dev/badge/Claude_Code-0052CC.png?variant=outline" />
<img alt="Cursor" src="https://shieldcn.dev/badge/Cursor-0052CC.png?variant=outline" />
<img alt="OpenCode" src="https://shieldcn.dev/badge/OpenCode-0052CC.png?variant=outline" />

Opinionated TypeScript conventions with automatic validation, code review, and a dedicated reviewer agent. Blocks `any`, `enum`, `export default`, and non-pnpm package managers via real-time hooks.

[See full details &rarr;](#typescript-rules)

### 📖 JSDoc Standards

<img alt="Claude Code" src="https://shieldcn.dev/badge/Claude_Code-237A3C.png?variant=outline" />
<img alt="Cursor" src="https://shieldcn.dev/badge/Cursor-237A3C.png?variant=outline" />
<img alt="OpenCode" src="https://shieldcn.dev/badge/OpenCode-237A3C.png?variant=outline" />

Opinionated JSDoc documentation rules for TypeScript projects, with three configurable enforcement levels (Minimal, Standard, Strict). Warns on missing JSDoc — never blocks.

[See full details &rarr;](#jsdoc-standards)

---

<a name="get-started"></a>

## 🚀 Get Started

### 1. Run the installer

```bash
npx devkit-ai
```

### 2. Choose your editor

Pick from **Claude Code**, **Cursor**, or **OpenCode** when prompted.

### 3. Select scope

| Scope | Description |
| --- | --- |
| **Project** | Committed to the repo (shared with your team) |
| **Project-local** | Gitignored, just for you |
| **User-global** | Every project on this machine |

### 4. Select plugins

Multi-select from available plugins. Both are pre-checked by default. Empty selection cancels the run.

### 5. Confirm

Review the summary and confirm. Ctrl-C at any prompt is a clean exit — no files are written until you confirm.

---

<a name="supported-editors"></a>

## ✨ Supported Editors

| Editor | Skills | Commands | Agents | Hooks |
| --- | --- | --- | --- | --- |
| **Claude Code** | Full support | Full support | Full support | Full support |
| **Cursor** | Full support | Full support | Skipped (no portable format) | Full support |
| **OpenCode** | Full support | Full support (translated) | Full support (translated) | Skipped (no `hooks.json`) |

---

<a name="what-the-installer-prompts"></a>

## 📝 What the Installer Prompts

1. **Editor** — Claude Code, Cursor, or OpenCode.
2. **Scope** — project (committed to the repo), project-local (gitignored), or user-global (every project on this machine).
3. **Plugins** — multi-select; both are pre-checked. Empty selection cancels the run.
4. **Conflicts** — when a destination file already exists, the installer asks per file whether to overwrite, skip (default), or abort. On the first conflict the installer also asks once whether to apply your choice to every remaining conflict in this run.

Ctrl-C at any prompt is a clean exit — no files are written until you confirm at the end of the prompt flow.

---

<a name="where-files-land"></a>

## 📂 Where Files Land

| Editor | project / project-local | user-global |
| --- | --- | --- |
| Claude Code | `<cwd>/.claude/` | `~/.claude/` |
| Cursor | `<cwd>/.cursor/` | `~/.cursor/` |
| OpenCode | `<cwd>/.opencode/` | `~/.config/opencode/` |

Inside each target the installer writes the standard subdirectories — `skills/`, `commands/`, `agents/`, and either `hooks/hooks.json` (Claude Code, OpenCode) or `hooks.json` at the root (Cursor). For project-local scope, the installer maintains a delimited block in `<cwd>/.gitignore`:

```text
# >>> AI-Devkit
.claude/skills/typescript-conventions/SKILL.md
.claude/commands/ts-review.md
...
# <<< AI-Devkit
```

---

<a name="commands"></a>

## ⌨️ Commands

After installation, your AI coding agent will have access to these commands.

### typescript-rules

| Command | Description |
| --- | --- |
| `/typescript-rules:ts-review` | Review uncommitted changes or last commit |
| `/typescript-rules:ts-review <path>` | Review a specific file or directory |

### jsdoc-standards

| Command | Description |
| --- | --- |
| `/jsdoc-standards:jsdoc-review` | Standard level, changed files |
| `/jsdoc-standards:jsdoc-review strict` | Strict level, changed files |
| `/jsdoc-standards:jsdoc-review minimal <path>` | Minimal level, specific path |

---

<a name="typescript-rules"></a>

## ⚡ TypeScript Rules

Opinionated TypeScript conventions with automatic validation, code review, and a dedicated reviewer agent.

### Features

- **Conventions skill** — full TypeScript style guide covering types, error handling, imports, naming, and dependencies
- **Code review agent** — AI-powered reviewer that checks files against the conventions and reports issues with severity levels (Claude Code and OpenCode)
- **`/ts-review` command** — run a code review on specific files, directories, or your uncommitted changes
- **Enforcement hooks** — automatically blocks `any`, `enum`, `export default`, manual `package.json` edits, and non-pnpm package managers (Claude Code and Cursor; OpenCode hooks are skipped)

### Installation

The recommended path is the cross-runtime installer:

```bash
npx devkit-ai
```

It prompts for editor, scope, and plugins. To target a specific editor without prompts, see `npx devkit-ai --help`.

<details>
<summary>Direct installation (Claude Code)</summary>

Requires [Claude Code](https://docs.anthropic.com/en/docs/claude-code) v1.0.33 or later.

```
/plugin marketplace add pau-vega/ai-devkit
/plugin install typescript-rules@pau-vega-ai-devkit
```

Then run `/reload-plugins` to activate without restarting.

</details>

### Usage

```
/typescript-rules:ts-review              # review uncommitted changes or last commit
/typescript-rules:ts-review src/utils    # review a specific directory
/typescript-rules:ts-review src/app.ts   # review a specific file
```

The assistant consults the `typescript-conventions` skill automatically when writing or reviewing TypeScript code. On Claude Code and Cursor, prompt-based hooks validate writes against the conventions in real time.

---

<a name="jsdoc-standards"></a>

## 📖 JSDoc Standards

Opinionated JSDoc documentation rules for TypeScript projects, with three configurable enforcement levels.

### Features

- **Conventions skill** — full JSDoc style guide covering format, tag usage, and three enforcement levels (Minimal, Standard, Strict)
- **JSDoc review command** — run a documentation audit at a chosen level
- **Reviewer agent** — autonomous JSDoc coverage checker with Error/Warning/Suggestion severity (Claude Code and OpenCode)
- **PreToolUse hook** — warns (never blocks) when exported TypeScript constructs are missing JSDoc (Claude Code and Cursor; OpenCode hooks are skipped)

### Installation

The recommended path is the cross-runtime installer:

```bash
npx devkit-ai
```

<details>
<summary>Direct installation (Claude Code)</summary>

From within Claude Code:

```
/plugin marketplace add pau-vega/ai-devkit
/plugin install jsdoc-standards@pau-vega-ai-devkit
```

Then run `/reload-plugins` to activate without restarting.

</details>

### Usage

```
/jsdoc-standards:jsdoc-review                 # standard level, changed files
/jsdoc-standards:jsdoc-review strict          # strict level, changed files
/jsdoc-standards:jsdoc-review minimal src/utils  # minimal level, specific path
```

The assistant consults the `jsdoc-conventions` skill automatically when writing or documenting TypeScript code.

---

<a name="flags"></a>

## 🏳️ Flags

| Flag | Effect |
| --- | --- |
| `--dry-run` | Print every file that would be written, without touching disk. Existing destinations are listed as `would write (overwrites existing)` — no prompts fire. |
| `--help` | Show usage and exit. |
| `--version` | Print the installer version and exit. |

---

<a name="known-limitations"></a>

## ⚠️ Known Limitations

- **OpenCode hooks are skipped.** OpenCode does not consume `hooks.json`; it expects a TypeScript plugin instead. Skills and commands are installed; real-time enforcement hooks won't fire under OpenCode.
- **Cursor agents are skipped.** Cursor does not expose a portable agent file format, so `agents/*.md` is not copied for Cursor targets. The skills and commands carry the relevant context.
- **Cursor user-global scope ships best-effort.** Only `~/.cursor/hooks.json` and `~/.cursor/hooks/` are formally documented. Commands, rules, and skills at user scope follow the same shape but are not officially documented by Cursor.
- **OpenCode agents and commands are translated at install time.** The source files use Claude Code's frontmatter format (`model: sonnet`, `${CLAUDE_PLUGIN_ROOT}`). For OpenCode targets, the installer drops the model line (so the agent inherits your `opencode.json` model), adds `mode: subagent`, and rewrites plugin-root paths to `..`.

---

<a name="releasing"></a>

## 🚢 Releasing

Releases are managed by [release-please](https://github.com/googleapis/release-please). On every push to `main`, release-please opens (or updates) a PR that bumps the version in `package.json` and `.claude-plugin/marketplace.json` and appends a changelog entry. Merging that PR creates a GitHub release with a `vX.Y.Z` tag, which triggers the `publish` job in `.github/workflows/release-please.yml`.

---

<a name="support"></a>

## 🆘 Support

For support, open a [GitHub issue](https://github.com/pau-vega/ai-devkit/issues/new). Bug reports, feature requests, and usage questions are welcome.

---

<a name="license"></a>

## 📃 License

[MIT](./LICENSE) © Pau Velasco Garrofe
