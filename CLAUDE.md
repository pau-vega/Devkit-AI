# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code plugin marketplace** containing three plugins: `typescript-rules`, `jsdoc-standards`, and `workflow-toolkit`. It is not a traditional app or library — there is no build step beyond a small bash script, no package.json, and no npm dependencies. The repository consists of markdown files, JSON configs, shell scripts, and a static HTML landing page that integrate with the Claude Code plugin system.

## Repository Structure

- `.claude-plugin/marketplace.json` — Marketplace manifest declaring all three plugins
- `typescript-rules/` — TypeScript conventions plugin (agent, command, skill, hooks)
- `jsdoc-standards/` — JSDoc documentation plugin (agent, command, skill, hooks)
- `workflow-toolkit/` — Developer workflow skills (command + 5 skills, no agents/hooks)
- `marketplace.html` — Static landing page rendered to GitHub Pages, embeds plugin metadata via `const PLUGINS = [...]`
- `scripts/build-marketplace.sh` — Discovers components in each plugin, injects fresh JSON into `marketplace.html`
- `.github/workflows/deploy-pages.yml` — Runs the build script and deploys `marketplace.html` to Pages on every push

Each plugin follows the standard layout:

```
<plugin>/
  .claude-plugin/plugin.json
  agents/*.md           (optional)
  commands/*.md         (optional)
  hooks/hooks1.json      (optional, with hooks/scripts/*.sh)
  skills/<name>/SKILL.md (optional, with skills/<name>/references/*.md)
```

## How to Test Locally

```bash
claude --plugin-dir ./ai-devkit
```

To regenerate the landing page after changing plugin metadata or components:

```bash
bash scripts/build-marketplace.sh
```

There are no lint or test commands — validation is done by loading the plugin in Claude Code and exercising the hooks, command, and agent.

## Architecture

Each plugin enforces conventions through three layers:

1. **Hooks (real-time)** — `<plugin>/hooks/hooks.json` registers PreToolUse hooks that fire on Bash, Write, and Edit tool calls. Shell scripts do pattern matching (e.g., grep for `any`, `enum`). Prompt-based hooks validate proposed code via Claude.
2. **Command + Agent (on-demand)** — `<plugin>/commands/*.md` dispatches an agent that loads the conventions skill, discovers target files, and produces a structured report with Error/Warning/Suggestion severity levels.
3. **Skill (reference)** — Passive skills that Claude consults when writing or reviewing code in any project that has the plugin installed.

`workflow-toolkit` is skill-only — no agents or hooks — and uses its `/create-workflow` command to introduce the skill set.

## Key Conventions When Editing This Plugin

- Hook scripts read tool input from **stdin** as JSON (`INPUT=$(cat)`) and use `jq` to extract fields
- Hook scripts output JSON: `{"decision": "block", "reason": "..."}` to block, or exit 0 silently to allow
- Prompt-based hooks (inline `"type": "prompt"` in `hooks.json`) validate file content against rules and respond with `approve` or `deny`
- `${CLAUDE_PLUGIN_ROOT}` is the variable used in `hooks.json` and agent files to reference the plugin's root directory
- Agents use `model: sonnet` and have access to `Read`, `Glob`, `Grep`, and `Bash` tools only
- Slash commands dispatching subagents use `allowed-tools: [Agent]` (the canonical Claude Code subagent tool name)
- After editing `marketplace.json` or any plugin component, run `scripts/build-marketplace.sh` to refresh `marketplace.html`

## Design Context

### Users
Developers curious about or adopting Claude Code who stumble on this marketplace via GitHub, a blog post, or a referral. They arrive already technical — they understand what agents, hooks, and skills are. The job to be done is quick evaluation: "Is this plugin worth installing?" The interface should answer that question with minimal friction, then get out of the way.

### Brand Personality
Calm and trustworthy. This is a personal portfolio that signals craft and reliability — not a flashy product page. Voice is direct and precise. The work earns trust through consistency, not persuasion.

Three words: **reliable, precise, unassuming**

### Aesthetic Direction
- **Warm dark neutrals as the foundation** — `#0f0e0c` background, not cool steel gray. The warmth signals care, not just efficiency.
- **Violet accent (`#7c6aef`)** for interactive elements — distinct without being aggressive.
- **Space Grotesk** for headings (technical yet slightly geometric), system UI for body, monospace for code.
- **Minimal cards** — no border at rest, border reveals on hover/focus. Visual noise only earns its place on interaction.
- Light mode is a first-class alternative (not an afterthought), using `[data-theme="light"]` CSS variables.
- Anti-references: no heavy glows, no gradients on cards, no external decorative imagery, no overstyled hero sections.

### Design Principles
1. **Let the content lead.** The plugins are the point. The UI frames and clarifies — it never competes.
2. **Earn every pixel.** If an element doesn't carry information or guide interaction, remove it. Restraint is a feature.
3. **Consistent over clever.** Predictable spacing, transition timing, and color usage build the sense of a well-maintained tool.
4. **Accessible by default.** Target WCAG 2.1 AA. Focus rings, ARIA roles, reduced motion, and sufficient contrast are not optional.
5. **Warm, not sterile.** Prefer warm neutrals over cool grays. The palette should feel hand-picked, not auto-generated.

## GSD Workflow

This project uses the Get Shit Done (GSD) planning workflow.

**Planning artifacts:** `.planning/`
- `PROJECT.md` — project context and requirements
- `REQUIREMENTS.md` — scoped v1 requirements with REQ-IDs
- `ROADMAP.md` — 4-phase execution plan
- `STATE.md` — current phase and status
- `research/` — OpenCode compatibility research

**Current state:** Phase 1 not started. Run `/gsd-plan-phase 1` to begin.

**Workflow commands:**
- `/gsd-plan-phase N` — plan a phase before executing
- `/gsd-execute-phase N` — execute a planned phase
- `/gsd-progress` — check current status
- `/gsd-discuss-phase N` — discuss approach before planning
