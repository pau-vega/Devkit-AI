# Phase 1: Skills Compatibility - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

**What this phase delivers:** All SKILL.md files are auto-discovered and readable by OpenCode AND Cursor agents.

**In scope:**
- typescript-rules SKILL.md has YAML frontmatter and is auto-discovered by OpenCode (via `.claude/skills/`)
- jsdoc-standards SKILL.md has YAML frontmatter and is auto-discovered by OpenCode
- workflow-toolkit all 5 SKILL.md files have YAML frontmatter and are auto-discovered by OpenCode
- typescript-rules ships `.cursor/skills/typescript-rules/SKILL.md` (symlink to canonical `skills/`) with `name`, `description`, `paths:`, and `disable-model-invocation:` frontmatter
- jsdoc-standards ships `.cursor/skills/jsdoc-standards/SKILL.md` (symlink) with same frontmatter shape
- workflow-toolkit ships all 5 SKILL.md files under `.cursor/skills/workflow-toolkit/<name>/` (symlinks) discoverable by Cursor

**Out of scope:**
- Commands and agents (Phase 2)
- Hook enforcement (Phase 3)
- Marketplace UI updates (Phase 4)
- New plugins or capabilities

</domain>

<decisions>
## Implementation Decisions

### Skill Directory Strategy

- **D-01:** Use **symlinks** from `.cursor/skills/<name>/` → `skills/<name>/` (single source of truth, one canonical location)
- **D-04:** Generate symlinks via `scripts/build-marketplace.sh` (Vercel Labs approach) — do NOT commit `.cursor/` tree to the repo; let the build script create symlinks. This keeps the repo clean and follows community practice (gitignore `.cursor/skills/`, generate at build time).

### YAML Frontmatter Fields

- **D-02:** Use **Full** frontmatter format for all SKILL.md files:
  - `name:` (required)
  - `description:` (required)
  - `paths:` (for Cursor file-type scoping)
  - `disable-model-invocation:` (for later command-substitution in Phase 2)

- **D-05:** **All skills** get `paths:` field with appropriate glob patterns:
  - typescript-conventions: `paths: ["*.ts", "*.tsx"]`
  - jsdoc-conventions: `paths: ["*.ts", "*.tsx", "*.js", "*.jsx"]`
  - workflow-toolkit skills: `paths:` appropriate to each skill's domain

### Workflow-Toolkit Skill Organization

- **D-03:** Use **namespaced** layout for Cursor: `.cursor/skills/workflow-toolkit/<name>/` (groups by plugin). This matches how marketplace is organized.

- **D-06:** Symlinks at **directory level** — one symlink per skill directory (e.g., `.cursor/skills/workflow-toolkit/grill-me/` → `skills/grill-me/`)

### The agent's Discretion

- OpenCode reads `.claude/skills/` natively — no additional work needed for OpenCode discovery beyond adding YAML frontmatter
- Cursor does NOT scan `.claude/skills/` — must provide `.cursor/skills/` tree (symlinks)
- Existing SKILL.md body content remains unchanged — only YAML frontmatter is added/updated
- Symlink strategy follows Vercel Labs pattern: build script generates symlinks, `.cursor/` is gitignored

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Skills Compatibility
- `.planning/ROADMAP.md` § Phase 1 — Skills Compatibility (p. 25-37)
- `.planning/REQUIREMENTS.md` § Skills Compatibility (p. 8-15) — SKILL-01..03, CUR-SKILL-01..03
- `.planning/research/SUMMARY.md` — OpenCode skills discovery (`.claude/skills/` compat path)
- `.planning/research/STACK.md` § Skills (p. 36-48) — OpenCode skill format and discovery paths
- `.planning/quick/260506-612-cursor-opencode-compat-research/260506-612-RESEARCH.md` § Rules / Skill Mapping (p. 38-50) — Cursor Agent Skills standard, `paths:` field, `disable-model-invocation:`
- `.planning/quick/260506-612-cursor-opencode-compat-research/260506-612-RESEARCH.md` § Component Compatibility Matrix (p. 156-167) — Skill row shows symlink approach

### Technical References
- `typescript-rules/skills/typescript-conventions/SKILL.md` — Existing skill (needs frontmatter)
- `jsdoc-standards/skills/jsdoc-conventions/SKILL.md` — Existing skill (needs frontmatter)
- `workflow-toolkit/skills/*/SKILL.md` — 5 existing skills (need frontmatter + namespace organization for Cursor)
- https://opencode.ai/docs/skills/ — OpenCode skill format (name, description, license, compatibility)
- https://cursor.com/docs/skills — Cursor Agent Skills standard (paths, disable-model-invocation)
- https://github.com/vercel-labs/agent-skills — Community symlink strategy example

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Existing SKILL.md files** — All 7 skills already written with proper content; only YAML frontmatter needs addition
- **`scripts/build-marketplace.sh`** — Existing build script can be extended to generate `.cursor/skills/` symlinks

### Established Patterns
- **Symlink strategy** — Vercel Labs and community practice: canonical copy in `skills/`, symlinks in runtime-specific dirs (`.cursor/skills/`, `.claude/skills/`)
- **Build-time generation** — Symlinks created by build script, not committed to repo
- **Gitignore `.cursor/`** — Runtime-specific dirs are build artifacts

### Integration Points
- **`scripts/build-marketplace.sh`** — Must be updated to:
  1. Create `.cursor/skills/` directory structure
  2. Create symlinks for all 7 skills (typescript-rules, jsdoc-standards, workflow-toolkit namespaced)
  3. Handle both flat (typescript-rules, jsdoc-standards) and namespaced (workflow-toolkit) layouts

</code_context>

<specifics>
## Specific Ideas

### Cursor Skill Frontmatter Example (typescript-rules)
```yaml
---
name: typescript-conventions
description: >
  TypeScript coding conventions for any TS project. Covers types & interfaces,
  functions & error handling, imports, and naming conventions. Use when
  writing or reviewing TypeScript code.
paths: ["*.ts", "*.tsx"]
---
```

### Cursor Skill Frontmatter Example (workflow-toolkit/grill-me)
```yaml
---
name: grill-me
description: >
  ... (existing description)
paths: ["*.md", "*.txt"]  # Adjust per skill
---
```

### Build Script Symlink Logic
```bash
# typescript-rules and jsdoc-standards (flat)
ln -s ../skills/typescript-conventions .cursor/skills/typescript-rules
ln -s ../skills/jsdoc-conventions .cursor/skills/jsdoc-standards

# workflow-toolkit (namespaced)
mkdir -p .cursor/skills/workflow-toolkit
ln -s ../../skills/grill-me .cursor/skills/workflow-toolkit/grill-me
# ... repeat for all 5 workflow-toolkit skills
```

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

### Reviewed Todos
None — no todos were reviewed in cross_reference_todos step.

</deferred>

---
*Phase: 1-Skills Compatibility*
*Context gathered: 2026-05-06*
