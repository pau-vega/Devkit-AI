# Quickstart: Beautiful README

**Phase**: 1 — Design & Contracts
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Research**: [research.md](./research.md)
**Data Model**: [data-model.md](./data-model.md)
**Contracts**: [contracts/badge-url-schemas.md](./contracts/badge-url-schemas.md)

This is the validation/run guide for the Beautiful README feature. It
lists the steps a contributor can run locally to prove the change works
end-to-end, plus the CI job that asserts the same checks on every PR.

---

## Prerequisites

- Node.js ≥ 20.11 (matches `engines.node` in `package.json`).
- A POSIX shell.
- Optional: Playwright (already vendored under `.playwright-mcp/`) for
  the screenshot diff.
- Optional: `markdownlint-cli2` and `markdown-link-check` for local
  validation; both are also installed in CI.

## Local validation

Run from the repo root.

### 1. Lint the Markdown

```bash
npx markdownlint-cli2 README.md
```

**Expected**: exit 0, no diagnostics.

### 2. Link-check every badge URL

```bash
npx markdown-link-check README.md --config .markdown-link-check.json
```

**Expected**: exit 0. Every URL inside the README (badge images,
hyperlinks, anchor links) returns HTTP 200.

### 3. Byte-size budget

```bash
wc -c README.md
```

**Expected**: `< 30000` bytes.

### 4. Render check (light theme)

```bash
npx playwright open --viewport-size=1280,800 \
  --color-scheme=light https://github.com/pau-vega/ai-devkit
```

**Expected**: hero (name, tagline, `npx devkit-ai` code block, first
row of badges) is fully visible without scrolling.

### 5. Render check (dark theme)

```bash
npx playwright open --viewport-size=1280,800 \
  --color-scheme=dark https://github.com/pau-vega/ai-devkit
```

**Expected**: same as the light theme, with no broken contrast on badge
labels or text.

### 6. `marketplace.html` smoke test (manual)

```bash
bash scripts/build-marketplace.sh
# Then open the produced marketplace.html locally and confirm that the
# per-plugin excerpts (typescript-rules, jsdoc-standards) still match
# the renamed/sectioned README headings.
```

**Expected**: the per-plugin cards on the showcase page render with
non-empty descriptions that match the new README.

---

## CI validation

The recommended CI workflow is `.github/workflows/readme-lint.yml`. It
runs on every PR that touches `README.md`, `.markdownlint.json`, or
`.markdown-link-check.json`.

```yaml
name: README lint
on:
  pull_request:
    paths:
      - README.md
      - .markdownlint.json
      - .markdown-link-check.json
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'
      - run: npx markdownlint-cli2 README.md
      - run: npx markdown-link-check README.md --config .markdown-link-check.json
      - run: |
          SIZE=$(wc -c < README.md)
          if [ "$SIZE" -ge 30000 ]; then
            echo "README is $SIZE bytes; budget is 30000."
            exit 1
          fi
```

A separate, optional screenshot-diff job (Playwright + visual
regression) is **not** part of v1 of this feature and is tracked as a
follow-up.

---

## End-to-end success criteria

The feature is "done" when all of the following are true:

1. `npx markdownlint-cli2 README.md` exits 0.
2. `npx markdown-link-check README.md` reports 0 broken URLs.
3. `wc -c README.md` reports a size under 30 000.
4. The hero is visible above the fold on a 1280×800 viewport in both
   light and dark themes.
5. `scripts/build-marketplace.sh` produces a `marketplace.html` whose
   per-plugin excerpts still match the new README headings.
6. The README-lint CI job is green on the PR.
