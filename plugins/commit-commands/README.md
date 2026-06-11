# commit-commands

A plugin that streamlines the git workflow with commands for committing, pushing, and opening pull requests, plus cleanup of stale branches. Commit messages are generated to match the repository's existing style. Installable into Claude Code, Cursor, or OpenCode via `npx devkit-ai`.

## Components

### Commands

```
/commit          # stage and commit with a generated message
/commit-push-pr  # commit, push, and open a pull request in one step
/clean-gone      # delete local branches whose remote is gone (and their worktrees)
```

### Agents

Each command dispatches a dedicated agent:

- `commit-agent` — reviews the diff, matches recent commit style, stages, and commits
- `commit-push-pr-agent` — handles branch creation, commit, push, and PR description
- `clean-gone-agent` — removes worktrees and deletes `[gone]` branches

Available for Claude Code and OpenCode; Cursor has no portable agent file format.

### Skill: `git-conventions`

Reference guide for commit message style, branch naming, and PR structure. The assistant consults this automatically when creating commits or pull requests.

This plugin ships no hooks.

## Installation

```bash
npx devkit-ai
```

The installer prompts for editor (Claude Code / OpenCode / Cursor), scope (project / project-local / user), and which plugins to install. To install commit-commands into Claude Code without the installer:

```bash
git clone https://github.com/pau-vega/Devkit-AI.git
claude --plugin-dir ./Devkit-AI/plugins/commit-commands
```

## License

MIT
