# Contracts: Beautiful README

**Phase**: 1 — Design & Contracts
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Research**: [research.md](./research.md)
**Data Model**: [data-model.md](./data-model.md)

This directory holds the implicit contracts the README has with the
services that render or validate it. There is no public API for this
feature; the "contracts" here are URL schemas and rendering rules that
the README-lint CI job asserts.

---

## `badge-url-schemas.md`

The shape of every badge URL the README uses, and the assertions the
README-lint CI job makes about it.

> **Last verified**: 2026-06-05 — every URL below returned HTTP 200
> when checked with `curl -sI`.

### Primary: `shieldcn.dev`

Base URL: `https://shieldcn.dev/`

| Semantic slot | URL | Verified |
| --- | --- | --- |
| npm version | `https://shieldcn.dev/npm/devkit-ai.svg` | 200 |
| npm license | `https://shieldcn.dev/npm/license/devkit-ai.svg` | 200 |
| npm downloads (weekly) | `https://shieldcn.dev/npm/dw/devkit-ai.svg` | 200 |
| GitHub stars | `https://shieldcn.dev/github/stars/pau-vega/ai-devkit.svg` | 200 |
| GitHub release | `https://shieldcn.dev/github/release/pau-vega/ai-devkit.svg` | 200 |
| GitHub CI | `https://shieldcn.dev/github/ci/pau-vega/ai-devkit.svg` | 200 |
| GitHub license | `https://shieldcn.dev/github/license/pau-vega/ai-devkit.svg` | 200 |

**Query parameters** supported on every endpoint:
- `variant` — `default` (default) | `secondary` | `outline` | `ghost` | `destructive`
- `size` — `xs` | `sm` (default) | `default` | `lg`
- `logo` — Simple-Icons slug, `ri:IconName`, `data:image/svg+xml;base64,...`, or `false` to suppress

**Contract assertions** (enforced by the README-lint CI job):
1. Every URL MUST return HTTP 200.
2. Every URL MUST resolve within 5 s (read timeout).
3. The `Content-Type` header MUST be `image/svg+xml` or `image/png`.

### Fallback: `img.shields.io`

Base URL: `https://img.shields.io/`

| Semantic slot | URL | Verified |
| --- | --- | --- |
| npm version | `https://img.shields.io/npm/v/devkit-ai.svg` | 200 |
| npm license | `https://img.shields.io/npm/l/devkit-ai.svg` | 200 |
| npm downloads (weekly) | `https://img.shields.io/npm/dw/devkit-ai.svg` | 200 |
| GitHub stars | `https://img.shields.io/github/stars/pau-vega/ai-devkit.svg` | 200 |
| GitHub release | `https://img.shields.io/github/v/release/pau-vega/ai-devkit.svg` | 200 |
| GitHub CI | `https://img.shields.io/github/actions/workflow/status/pau-vega/ai-devkit/release-please.yml.svg` | 200 |
| GitHub license | `https://img.shields.io/github/license/pau-vega/ai-devkit.svg` | 200 |

**Contract assertions** (enforced by the README-lint CI job):
1. Every fallback URL MUST return HTTP 200.
2. The fallback URLs MUST be present in `contracts/badge-url-schemas.md`
   so a maintainer can swap them in if shieldcn is down.

---

## `rendering-rules.md`

How the README is expected to render on each surface the marketplace
controls.

### GitHub web (primary)

- The hero (name + tagline + install command + first row of badges) MUST
  be visible above the fold on a 1280×800 viewport.
- All badges MUST render in both light and dark themes without manual
  override.
- All `## Plugin name` headings MUST be reachable via GitHub's
  auto-generated anchor (kebab-case, lowercase).
- Code blocks MUST use the `bash` language tag for shell commands and
  plain text blocks for raw output.

### npm registry page (text-only fallback)

- The README MUST remain readable when GitHub's image rendering is
  stripped (npm strips `<img>` src in some render modes).
- Every badge image's `alt` text MUST be a self-describing English
  phrase ("npm version", "GitHub license", etc.) so a screen reader or
  a stripped HTML view still conveys the meaning.
- No information MUST be carried solely by an image; every fact in a
  badge MUST also be present in surrounding prose.

### `marketplace.html` (showcase page)

- The page embeds README excerpts; the README's section ordering MUST
  not change in a way that breaks the showcase page's per-plugin
  excerpts (which currently assume the `## typescript-rules` and
  `## jsdoc-standards` headings exist).
- A manual smoke test of the rendered `marketplace.html` is required
  after the README change (already mandated by the constitution's
  Principle II).

**Contract assertions** (enforced by the README-lint CI job, except
for the `marketplace.html` smoke test which is manual):
1. Every `##` heading has a corresponding TOC entry.
2. Every badge `alt` text contains at least one of: `version`, `license`,
   `downloads`, `stars`, `release`, `ci`, `build`, `passing`.
3. The README file size is under 30 KB.
