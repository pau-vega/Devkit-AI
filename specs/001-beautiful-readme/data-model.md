# Data Model: Beautiful README

**Phase**: 1 — Design & Contracts
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Research**: [research.md](./research.md)

This document extracts the entities the README is built from. These are
content entities, not runtime objects — they have no schema validation,
no migration, no persistence. They are documented so the README author
and the README-lint CI job can refer to a single source of truth.

---

## Entity 1: Hero

The first block of the README, visible above the fold on a 1280×800
viewport in both GitHub light and dark themes.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | Project name. Currently `"AI-Devkit"`. |
| `tagline` | string | yes | One sentence, ≤ 120 chars. Currently the first paragraph of the README. |
| `install_command` | code block | yes | The primary install command: `npx devkit-ai`. Must be the first code block in the README. |
| `badge_row` | list of `Badge` | yes | Ordered list of 4–8 badges; see [Entity 2](#entity-2-badge). |
| `logo` | image URL | no | Optional, hosted externally; not vendored in the repo. |

---

## Entity 2: Badge

A single status indicator rendered as a remote image. Each badge has a
fixed semantic slot (e.g. "npm version", "GitHub license") and a
shieldcn URL with a documented shields.io fallback.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `slot` | enum | yes | One of: `npm_version`, `npm_license`, `npm_downloads`, `github_stars`, `github_release`, `github_ci`, `github_license`. |
| `label` | string | yes | Human-readable label, also the `alt` text of the image. |
| `url_shieldcn` | URL | yes | Primary badge URL. Must return HTTP 200 in CI. |
| `url_shields_fallback` | URL | yes | Documented fallback. Must return HTTP 200 in CI. |
| `link_target` | URL | yes | Where the badge links to (e.g. the GitHub Releases page, the npm package page). |
| `variant` | enum | no | shadcn variant: `default`, `secondary`, `outline`, `ghost`, `destructive`. Defaults to `default`. |
| `size` | enum | no | shadcn size: `xs`, `sm`, `default`, `lg`. Defaults to `sm`. |

**Validation rules**:
- Every `Badge` referenced in the README MUST have a unique `slot`.
- Every `url_shieldcn` and `url_shields_fallback` MUST resolve to HTTP
  200 in the README-lint CI job.
- `link_target` MUST be a real, reachable URL (also checked by the
  link-check job).

---

## Entity 3: Plugin Block

A reusable visual unit in the catalog section of the README. One block
per shipped plugin.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | Plugin name, used as the `## Plugin name` heading. |
| `tagline` | string | yes | One-line description, ≤ 120 chars. |
| `editor_support` | list of enum | yes | One or more of `claude_code`, `cursor`, `opencode`. Rendered as a badge row. |
| `features` | list of string | yes | 3–6 bullet points. Each starts with a bold lead-in. |
| `install_block` | code block | yes | The cross-runtime install command (`npx devkit-ai`) plus the per-editor instruction. |
| `usage_examples` | list of code block | yes | 1–3 example invocations. |
| `deep_link` | anchor | yes | `#<plugin-slug>` — auto-derived from `name` (kebab-case, lowercase, dashes). |

**Validation rules**:
- Every shipped plugin MUST have exactly one Plugin Block.
- The Plugin Block's heading MUST be `## <name>` so the auto-generated
  TOC can include it.
- The Plugin Block's `editor_support` MUST be a subset of the editors
  the plugin actually supports (asserted by the installer's integration
  tests; the README just mirrors the truth).

---

## Entity 4: Table of Contents

A hand-written ordered list of internal links, one per `##` section.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `entries` | list of `{label, anchor}` | yes | In document order. |
| `placement` | enum | yes | Either `after_hero` (recommended) or `top`. |

**Validation rules**:
- `entries` MUST cover every `##` heading in the README (no missing
  anchors, no extra anchors).
- The README-lint CI job checks this by parsing the Markdown AST and
  comparing heading IDs to TOC entries.

---

## Entity 5: Status Footer

The last block of the README, before the `--` separator. Carries the
"Releasing (maintainer note)" and other contributor-facing content.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `release_automation` | prose | yes | One paragraph explaining release-please. |
| `ci_pipeline_link` | URL | yes | Link to `.github/workflows/release-please.yml` and the publish job. |
| `maintainer_handbook_link` | URL | optional | Link to `CONTRIBUTING.md` if present. |

---

## Relationships

```text
Hero 1 ── 1..n ──> Badge (in badge_row)
Hero 1 ── 1 ──> Table of Contents (placed immediately after)
Table of Contents 1 ── n ──> Plugin Block (one TOC entry per plugin)
Plugin Block 1 ── 1..3 ──> Editor Support (claude_code, cursor, opencode)
Status Footer 1 ── 0..1 ──> Maintainer Handbook
```

The Hero, the Plugin Blocks, and the Status Footer are the only three
top-level sections the README MUST contain (the TOC is a child of the
Hero, not a sibling).
