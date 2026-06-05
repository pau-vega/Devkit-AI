# Research: Beautiful README

**Phase**: 0 — Outline & Research
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

This document resolves every open question surfaced by the
`Technical Context` section of the plan, with sources and a final decision
per topic. It is the input to Phase 1 (Design & Contracts).

---

## 1. Badge provider — `shieldcn.dev` vs `shields.io`

**Decision**: Use `shieldcn.dev` for the primary visual badge suite and
`img.shields.io` for documented fallbacks in the same semantic slots.

**Rationale**:
- The user's brief explicitly named `shieldcn.dev` as the preferred
  source. The shieldcn visual language is "shadcn/ui Button" — the same
  font, radius, padding, and color tokens used across modern frontend
  projects. It blends visually with the rest of a typical README.
- `shields.io` is the de-facto standard, has been live for over a decade,
  has the broadest provider coverage (npm, GitHub, GitLab, PyPI, etc.),
  and is a safe documented fallback when `shieldcn.dev` is unreachable.
- Both providers expose the same semantic slots (npm version, npm
  downloads, GitHub license, GitHub release, GitHub CI, etc.) — the
  switch is a URL swap, not a content rewrite.

**Alternatives considered**:
- `badgen.net` — also a shields.io alternative, but smaller provider
  coverage and weaker GitHub-specific endpoints. Rejected as primary.
- Self-hosted shields — adds an ops surface, a Docker image, and a
  deploy target that the project does not need.
- Vendored SVG badges — requires a build step and a static asset
  directory in the repo, violating the "no new dependencies, no vendored
  assets" constraint.

**Source**: [shieldcn.dev/docs](https://shieldcn.dev/docs),
[shields.io/badges/static-badge](https://shields.io/badges/static-badge)

---

## 2. Badge URL pattern — `shieldcn.dev`

**Decision**: Use `.svg` with query-string `?variant=` and `?size=` for
visual variants. Use `.png` only where SVG fails (none currently known
for shieldcn).

**Rationale**:
- shieldcn exposes both `.png` and `.svg` and recommends `.png` for
  GitHub READMEs for cross-client consistency. We default to `.svg` for
  sharpness at all zoom levels and smaller transfer size.
- Variants (`default`, `secondary`, `outline`, `ghost`, `destructive`)
  map 1:1 to shadcn/ui Button variants. We use `default` for the
  primary status row and `secondary` or `outline` for the plugin-catalog
  editor-support chips.
- Sizes (`xs`, `sm`, `default`, `lg`) give us a single row that fits
  inside the GitHub README at 1280 px.

**URL pattern catalogue** (used by the link-check CI job):

| Semantic slot | URL |
| --- | --- |
| npm version | `https://shieldcn.dev/npm/devkit-ai.svg` |
| npm license | `https://shieldcn.dev/npm/license/devkit-ai.svg` |
| npm downloads (weekly) | `https://shieldcn.dev/npm/dw/devkit-ai.svg` |
| GitHub stars | `https://shieldcn.dev/github/stars/pau-vega/ai-devkit.svg` |
| GitHub release | `https://shieldcn.dev/github/release/pau-vega/ai-devkit.svg` |
| GitHub CI | `https://shieldcn.dev/github/ci/pau-vega/ai-devkit.svg` |
| GitHub license | `https://shieldcn.dev/github/license/pau-vega/ai-devkit.svg` |

**Source**: [shieldcn.dev/docs](https://shieldcn.dev/docs#badge-types)

---

## 3. Fallback URL pattern — `img.shields.io`

**Decision**: Document the `img.shields.io` URL for every semantic slot
that shieldcn covers, in `contracts/badge-url-schemas.md`. Do not
auto-fallback at render time; the README always shows the shieldcn URL.
Fallback is a manual switch in `README.md` if shieldcn has a multi-day
outage.

**Rationale**: An auto-fallback would require either (a) a server-side
proxy or (b) client-side JavaScript — both forbidden by the
"no JavaScript" constraint. A documented, copy-paste-able fallback
table is the lowest-friction option and matches the way every other
shields-alternative project handles outages.

**Source**: [shields.io/badges/static-badge](https://shields.io/badges/static-badge)

---

## 4. README size budget

**Decision**: 30 KB uncompressed, measured with `wc -c` (or
`stat --printf='%s'`) in CI.

**Rationale**:
- Current README is 10 KB; the budget of 30 KB is 3× headroom.
- The constitution sets the `marketplace.html` budget at 250 KB; the
  README excerpts that page embeds are a small fraction of that, so a
  30 KB README keeps the page comfortably under its budget.
- A 30 KB Markdown file is roughly 30 000 characters, i.e. ~7 500
  words — far more than this README will ever need, even after the hero
  + TOC + plugin catalog + 5–10 badges are added.

---

## 5. Markdown link checker

**Decision**: `tcort/markdown-link-check` (Node-based, runs in CI).

**Rationale**:
- Lightweight (no extra dependencies in `package.json` — runs in the
  workflow's Node setup), fast, supports a JSON config to skip
  `localhost` and to set timeouts, and emits a clear failure when a
  badge URL returns non-200.
- Alternative `lycheeverse/lychee` (Rust) is faster but adds a Rust
  toolchain to the CI image. Rejected for the v1 README lint job.
- The job is gated on `paths: [README.md, .markdownlint.json,
  .markdown-link-check.json]`.

---

## 6. `markdownlint` rules

**Decision**: Use the project's existing `.markdownlint.json` if
present; otherwise inherit `markdownlint`'s `default: true` minus a
small allow-list for badges (e.g. allow `no-inline-html` if any badge
anchor wraps an `<img>`).

**Rationale**:
- The constitution's UX principle (III) requires consistent rendering;
  `markdownlint` catches drift in table alignment, list indentation,
  and heading hierarchy.
- Keep the config minimal: a 10-line `.markdownlint.json` is enough for
  a single-file documentation project.

---

## 7. Light/dark theme rendering

**Decision**: Trust shieldcn's default tokens (which target the shadcn
neutral palette) and verify with a Playwright screenshot diff in CI
(both `prefers-color-scheme: light` and `dark`).

**Rationale**:
- shadcn's neutral palette is explicitly designed for both themes and
  the contrast ratios are AA-compliant out of the box.
- A screenshot diff is the only reliable way to assert "the hero is
  above the fold on a 1280×800 viewport in both themes" — manual
  eyeballing drifts over time.

**Source**: [shadcn/ui theming guide](https://ui.shadcn.com/docs/theming)

---

## 8. Table of Contents generation

**Decision**: Hand-written Markdown TOC in the README (one bullet per
`##` section, in document order), reviewed by the README-lint CI job.

**Rationale**:
- A hand-written TOC stays correct in plain text (the npm registry
  view) and on GitHub (which generates its own TOC sidebar that may not
  show the same anchors as the in-doc TOC).
- A `markdown-toc`-style auto-generator would require a build step or
  a pre-commit hook, both of which add moving parts that the project
  does not need for a 2-section file.

**Alternative considered**: GitHub's auto-generated TOC (`<!-- toc -->`
+ `[TOC]` markers) — rejected because it does not render in the npm
registry view and is editor-inconsistent.

---

## 9. Accessibility (alt text)

**Decision**: Every badge `![...]` alt text names the badge in plain
English (e.g. `![npm version](https://shieldcn.dev/npm/devkit-ai.svg)`).
No badge carries information that is not also present in surrounding
prose.

**Rationale**:
- GitHub renders `alt` text in the npm registry view, in screen
  readers, and when an image fails to load.
- A reader who sees the alt text learns the project name, version,
  license, etc. — the same information the badge image is meant to
  convey.

---

## 10. Open questions resolved

| Question | Resolution |
| --- | --- |
| `pau-vega/ai-devkit` (README) vs `pau-vega/AI-Devkit` (package.json) | GitHub redirects case-insensitively; both resolve to the same repo. Use lowercase in the README for shieldcn URLs (matches the GitHub URL a user sees). |
| Where to host the logo? | Not vendored. Hero uses a `shieldcn` badge row as the visual identity. If a logo is later added, host on `github.com/pau-vega/ai-devkit`'s user-attachments. |
| Plugin sub-READMEs (`typescript-rules/README.md`, `jsdoc-standards/README.md`)? | Out of scope for this feature; tracked in the spec's Assumptions section. |
