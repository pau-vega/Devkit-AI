# Implementation Plan: Beautiful README

**Branch**: `main` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-beautiful-readme/spec.md`

## Summary

Re-author the top-level marketplace `README.md` so it ships a polished hero
(name, tagline, install command, status badge row), a generated Table of
Contents, a visual plugin catalog built from a reusable block template, and a
CI-verified badge suite sourced from `shieldcn.dev` with `shields.io`
fallbacks. The change is content + badge URLs only — no new runtime
dependencies, no JavaScript, no vendored fonts, no source-code changes — and
it must preserve every existing semantic section of the current README
(install flow, plugin details, known limitations, flags, releasing notes).

## Technical Context

**Language/Version**: GitHub-Flavored Markdown (CommonMark 0.30 + GFM tables,
autolinks, task lists). No code is added by this feature.

**Primary Dependencies**:
- `shieldcn.dev` — primary visual badge provider (shadcn/ui-styled SVGs/PNGs).
- `img.shields.io` — documented fallback for the same semantic badge slots.
- No npm dependencies added; no vendored assets; no JavaScript.

**Storage**: N/A (no persistent data; the README is a single file in the
repo root).

**Testing**:
- `markdownlint-cli2` (or the project's existing `markdownlint` config if
  present) for GFM validity, table alignment, and link syntax.
- A link-check job (`markdown-link-check` or a hand-rolled `curl` script in
  CI) that asserts every badge URL returns HTTP 200.
- A byte-size check (`wc -c README.md` or equivalent) asserting the README
  stays under 30 KB.
- A screenshot diff (manual or Playwright via the existing
  `.playwright-mcp/` setup) for the hero above-the-fold check in both
  light and dark themes.

**Target Platform**: GitHub.com (web rendering of the repo root README) and
the npm registry page (text-only fallback view, used by
`https://www.npmjs.com/package/devkit-ai`).

**Project Type**: documentation / static content (no build step required
to render; the README is what ships).

**Performance Goals**:
- README file size: < 30 KB uncompressed (current: 10 KB).
- Badge URLs: first paint of the badge row at network-idle for a GitHub
  visitor on a Fast 3G connection in under 2 s.
- `marketplace.html` (which embeds README excerpts): stays under 250 KB
  and reaches `DOMContentLoaded` in under 1 s (existing constitution
  budget).

**Constraints**:
- No JavaScript, no vendored fonts, no external CSS, no third-party
  widgets — only inline Markdown content and remote image/badge URLs.
- No new runtime dependencies (the `package.json` `dependencies` block
  stays exactly as it is).
- Accessibility: WCAG AA color contrast for badge labels in both GitHub
  light and dark themes (shadcn's default tokens already meet this for
  the chosen palette).
- The existing semantic content MUST be preserved; the change is visual
  re-organization and embellishment, not content removal.

**Scale/Scope**: 1 README, 1 hero, 1 TOC, 1 plugin catalog block per
shipped plugin (currently 2: `typescript-rules`, `jsdoc-standards`), 1
status badge row, 1 CI contract for the link-check job.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Compliance |
| --- | --- | --- |
| I. Code Quality | No new code; no `tsc`/`eslint` surface area introduced. | **Pass** — README-only change. |
| II. Testing Standards | "Every user-facing change MUST be covered by automated tests." | **Pass** — link-check, `markdownlint`, byte-size, and screenshot diff are the automated tests for this change. |
| III. User Experience Consistency | Hero, badge row, and plugin-block template must be uniform and reusable. | **Pass** — a single `## Plugin name` block template is defined and used for every plugin. |
| IV. Performance Requirements | README < 30 KB; `marketplace.html` < 250 KB; first-paint target. | **Pass** — measured in CI; budgets already in the constitution. |

No violations. Complexity Tracking section is **not** required.

## Project Structure

### Documentation (this feature)

```text
specs/001-beautiful-readme/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── badge-url-schemas.md
├── checklists/
│   └── requirements.md  # Created by /speckit.specify
└── spec.md              # Created by /speckit.specify
```

### Source Code (repository root)

```text
my-marketplace/
├── README.md            # MODIFIED — hero + TOC + badge row + plugin catalog
├── marketplace.html     # unchanged (excerpts will be re-validated manually)
├── package.json         # unchanged
├── scripts/
│   └── build-marketplace.sh   # unchanged (no new build step for the README)
├── .github/workflows/   # MAY add one CI workflow: readme-lint.yml
└── …
```

**Structure Decision**: This is a documentation-only change. No new source
directories, no `src/` additions, no new package layout. The single
production artefact is the rewritten `README.md` at the repo root; the
single CI addition (optional but recommended) is
`.github/workflows/readme-lint.yml` that runs `markdownlint`, the link
check, and the byte-size check on every PR that touches `README.md`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| _none_ | — | — |
