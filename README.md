# my-marketplace

A small marketplace of Claude Code plugins — `typescript-rules`, `jsdoc-standards`, and
`workflow-toolkit` — installable into Claude Code, Cursor, or OpenCode with a single
command.

## Install (with auth)

The package is published to GitHub Packages, which requires authentication for both
public and private packages. Configure your `~/.npmrc` once with a classic personal
access token scoped to `read:packages`:

```text
@pau-vega:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<your-classic-pat>
```

Then run the installer with `npx`:

```bash
npx @pau-vega/my-marketplace
```

Generate the token at GitHub -> Settings -> Developer settings -> Personal access tokens
(classic), with the `read:packages` scope only. Do not commit your `~/.npmrc` to any
repo — this project's `.gitignore` excludes `.npmrc` for that reason.

## Install (zero-auth fallback)

If you would rather skip the token setup, npm can fetch the installer directly from this
repository over `git`:

```bash
npx github:pau-vega/my-marketplace
```

The trade-off: this clones the default branch HEAD (no version pinning), and the first
run is slightly slower because npm has to resolve and fetch from GitHub directly.
Functionally the installer behaves identically.

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
# >>> my-marketplace
.claude/skills/typescript-conventions/SKILL.md
.claude/commands/ts-review.md
...
# <<< my-marketplace
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

Publishing happens automatically on a tagged GitHub Release. Cut a release in the GitHub
UI (Releases -> Draft a new release -> publish a `vX.Y.Z` tag). The
`.github/workflows/publish.yml` workflow runs `npm pack --dry-run` (sanity check) and
then `npm publish` against GitHub Packages, authenticated by the workflow's
`GITHUB_TOKEN`.

**Package visibility is set in the GitHub UI**, not in `package.json`. GitHub Packages
ignores the `publishConfig.access` field — to make the package public, open the
repository's Packages page and change the package's visibility there. The first publish
inherits the repository's default visibility.

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
/plugin marketplace add pau-vega/my-marketplace
```

### 2. Install the plugin

```
/plugin install typescript-rules@pau-vega-my-marketplace
```

### 3. Activate

Run `/reload-plugins` to load the plugin without restarting.

### Alternative: test locally

Clone the repo and load it directly:

```bash
git clone https://github.com/pau-vega/my-marketplace.git
claude --plugin-dir ./my-marketplace
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
