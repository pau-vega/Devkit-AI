# Feature Specification: Beautiful README

**Feature Branch**: `[001-beautiful-readme]`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "I want to make the readme more beautiful. You can use https://shieldcn.dev/ to improve it, but also other tools. Feel free to browse for best practises and you can also use context7"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-time visitor scans the repo landing page (Priority: P1)

A developer lands on the GitHub repository and forms a decision in the first 5–10 seconds about whether `ai-devkit` is relevant to them.

**Why this priority**: First impressions drive install conversion. A polished hero (logo, tagline, primary install command, status badges) is the single highest-leverage improvement; without it no other section matters.

**Independent Test**: Open the rendered `README.md` on GitHub in a fresh incognito window. Within 5 seconds the visitor can (a) name what the project does, (b) identify the supported editors, and (c) locate the install command without scrolling past the fold.

**Acceptance Scenarios**:

1. **Given** a visitor on the repo root, **When** the README renders, **Then** the first screen shows project name, one-line tagline, and the `npx devkit-ai` install command in a code block.
2. **Given** the rendered hero, **When** the visitor looks for status signals, **Then** at least 4 visual badges are visible above the fold (license, latest version, npm downloads, supported editors or CI status).
3. **Given** GitHub light and dark themes, **When** the README renders, **Then** all text, badges, and dividers remain readable in both themes without manual override.

---

### User Story 2 - Plugin evaluator browses the catalog (Priority: P2)

A developer evaluating AI-Devkit wants to see what plugins ship today, what each plugin does, and which editors each plugin supports.

**Why this priority**: The plugin catalog is the core offering. Even a perfect hero fails if a visitor cannot tell, in 10 seconds, whether `typescript-rules` or `jsdoc-standards` fits their stack.

**Independent Test**: Scroll to the "Plugins" section of the rendered README. For each plugin, the reader can identify: name, one-line description, supported editor matrix, and a deep link to its detailed section.

**Acceptance Scenarios**:

1. **Given** a visitor scrolling to the plugins section, **When** they read it, **Then** each plugin has its own visually distinct block (heading + badge row + short description) with a consistent layout.
2. **Given** the plugins section, **When** the visitor looks for editor support, **Then** each plugin shows the same editor matrix (Claude Code / Cursor / OpenCode) as compact badges or icons.
3. **Given** any plugin block, **When** the visitor clicks the internal link to that plugin's deep section, **Then** the page jumps to the matching `## Plugin name` section.

---

### User Story 3 - Returning contributor checks status signals (Priority: P3)

A returning contributor or maintainer wants to confirm at a glance the project's health: latest release version, CI status, license, and a quick link to the changelog.

**Why this priority**: Returning visitors are a smaller but high-value audience. Status badges near the top give them confidence without them needing to open the Releases tab.

**Independent Test**: From the top of the rendered README, the reader can identify the current `package.json` version, the latest CI run status, and the license — all in the first badge row.

**Acceptance Scenarios**:

1. **Given** the badge row under the hero, **When** the visitor looks, **Then** version and CI badges reflect the live state of the repo (not a hard-coded string).
2. **Given** the badge row, **When** the visitor clicks the version badge, **Then** the badge links to the GitHub Releases page for the repo.

---

### Edge Cases

- What happens if `shieldcn.dev` is down? A documented fallback path uses `shields.io` equivalents for the critical badges (version, license, CI).
- How does the README render on the npm registry page? npm strips most HTML; the README must remain readable in plain text (descriptive alt text for badges, no information carried solely by images).
- What happens on small viewports (< 400 px wide)? Tables and badge rows must not overflow horizontally; tables should be small enough to scroll inside, and badge rows should wrap.
- What happens when a new plugin is added? The new plugin follows the same visual template (heading + badge row + description) so the catalog stays consistent.
- What happens when the GitHub username or repo name changes? Badges that embed the owner/repo path reference a single source (the repo URL) and not a duplicated string.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The README MUST present a hero section (name, tagline, primary install command, status badge row) within the first screen on a 1280×800 viewport.
- **FR-002**: The README MUST use `shieldcn.dev` for primary visual badges (version, license, downloads, supported editors, plugin count) with documented `shields.io` fallbacks for the same semantic slots.
- **FR-003**: The README MUST include a Table of Contents after the hero, with internal links to every `##` section, generated from the section headings (no manual anchor list to drift).
- **FR-004**: The README MUST render the plugin catalog as a sequence of visually consistent plugin blocks, each with: a level-2 heading, a one-line description, an editor-support badge row, and a "Read more" link to that plugin's own section.
- **FR-005**: All status badges MUST use live data sources (npm registry, GitHub Actions, GitHub Releases) and MUST be verified to return HTTP 200 in CI via a link-check job or equivalent script.
- **FR-006**: The README MUST remain valid GitHub-Flavored Markdown (passes `markdownlint` with the project's config) and MUST render correctly on GitHub's light and dark themes without theme-specific overrides.
- **FR-007**: The README MUST stay under 30 KB uncompressed (the current README is ~10 KB) to keep the marketplace page bundle well under the 250 KB constitution budget.
- **FR-008**: The README MUST NOT introduce new runtime dependencies, vendored fonts, or external JavaScript; only image/badge URLs and inline content are allowed.
- **FR-009**: The README MUST keep all existing semantic content (install instructions, plugin details, known limitations, flags, releasing notes) — the change is visual re-organization and embellishment, not content removal.
- **FR-010**: A README lint/verify step MUST run in CI and fail the build if any badge URL returns non-200, if `markdownlint` reports errors, or if the README exceeds 30 KB.

### Key Entities

- **Badge**: a visual status indicator rendered as a remote image. Attributes: label, value, color, style (default / secondary / outline / ghost), link target, semantic slot (e.g. "version", "license"), fallback URL.
- **Plugin block**: a reusable visual unit in the catalog. Attributes: name, tagline, editor-support flags (Claude Code / Cursor / OpenCode), deep-link anchor, detailed section reference.
- **Table of Contents**: auto-generated list of internal links, ordered by document order, one entry per `##` heading.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can identify the project name, primary install command, and supported editors within 5 seconds of landing on the GitHub repo (validated by a manual 5-person review).
- **SC-002**: The hero + status badge row is fully visible above the fold on a 1280×800 viewport in both light and dark themes (validated by a screenshot check in CI).
- **SC-003**: All badge URLs return HTTP 200 in CI; 100% of badges pass a daily link-check run.
- **SC-004**: The README remains under 30 KB uncompressed and the `marketplace.html` showcase page (which embeds README excerpts) stays under 250 KB — the existing constitution budget.
- **SC-005**: `markdownlint` reports zero errors against the project's `.markdownlint.json` on the rendered README.
- **SC-006**: The plugin catalog section renders every shipped plugin in the same visual template, so a new plugin can be added by following the template with zero design decisions.
- **SC-007**: README views / clone ratio (GitHub traffic API) does not regress for the two weeks following the change compared to the two weeks prior (qualitative adoption guard-rail).

## Assumptions

- The work is scoped to the top-level marketplace `README.md`. Per-plugin READMEs (`typescript-rules/README.md`, `jsdoc-standards/README.md`) are out of scope for this change unless explicitly requested in a follow-up.
- `shieldcn.dev` is the primary badge source; `shields.io` is a documented fallback for the same semantic slots, used when `shieldcn.dev` is unreachable.
- The project will not vendor a custom font or logo SVG in-repo; any logo is hosted on GitHub user-attachments or a known public asset URL.
- The repo username (`pau-vega/ai-devkit`) and npm package name (`devkit-ai`) remain stable during this change; if either changes, the badge URLs are regenerated.
- The README will be edited by hand (no build step), so all URLs, anchors, and badges must be human-verifiable before merge.
- Accessibility target is WCAG AA for color contrast on both light and dark themes; advanced accessibility (screen-reader-optimized badge alts) is met by writing descriptive alt text for every badge image.
