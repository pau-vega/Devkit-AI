---
description: "Task list for the Beautiful README feature"
---

# Tasks: Beautiful README

**Input**: Design documents from `/specs/001-beautiful-readme/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: The README-lint CI job (`markdownlint` + `markdown-link-check` + byte-size check) is the test surface for this feature. No unit/integration tests are added.

**Organization**: Tasks are grouped by user story so each story can be implemented, validated, and merged independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- The single deliverable is `/Users/pauvelascogarrofe/Documents/my-marketplace/README.md`.
- Configuration files live at the repo root: `.markdownlint.json`, `.markdown-link-check.json`.
- The CI workflow lives at `.github/workflows/readme-lint.yml`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lock the inputs the rest of the work depends on (badge URLs, size baseline, content preservation map).

- [X] T001 Capture the current README byte size and section list in `specs/001-beautiful-readme/baseline.md` (for the size-budget regression check)
- [X] T002 [P] Resolve the final shieldcn.dev URL for every semantic badge slot (npm version, npm license, npm downloads, GitHub stars, GitHub release, GitHub CI, GitHub license) and record them in `specs/001-beautiful-readme/contracts/badge-url-schemas.md`
- [X] T003 [P] Confirm the shields.io fallback URL for each semantic slot above and add it to the same contracts file

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared building blocks every user story depends on. Nothing user-facing ships in this phase, but every later task reads from it.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Add the auto-generated Table of Contents placeholder to `README.md` (one bullet per `##` section, in document order)
- [X] T005 [P] Define the reusable "Plugin Block" template (heading + tagline + editor-support badge row + features bullets + install + usage) in `specs/001-beautiful-readme/data-model.md` (already drafted — review and lock)
- [X] T006 [P] Add a CI job skeleton `.github/workflows/readme-lint.yml` that runs `markdownlint-cli2 README.md` (gates Phase 3+ work)

**Checkpoint**: Foundation ready — the README has a TOC skeleton, the plugin-block template is locked, and the lint CI can run on the current README.

---

## Phase 3: User Story 1 — First-time visitor scans the hero (Priority: P1) 🎯 MVP

**Goal**: A visitor landing on the repo root sees the project name, a one-line tagline, the `npx devkit-ai` install command, and a row of 4–8 status badges — all above the fold on a 1280×800 viewport in both light and dark themes.

**Independent Test**: Open `README.md` rendered on GitHub in a fresh incognito window at 1280×800. Within 5 seconds the visitor can (a) name the project, (b) identify supported editors, and (c) locate the install command without scrolling.

### Implementation for User Story 1

- [X] T007 [US1] Replace the opening paragraph of `README.md` with the hero: H1 project name + tagline + `npx devkit-ai` code block
- [X] T008 [P] [US1] Add the first row of status badges to `README.md` (npm version, license, weekly downloads, GitHub stars) with shieldcn.dev URLs and shields.io fallbacks
- [X] T009 [P] [US1] Add an editor-support badge row to the hero showing Claude Code / Cursor / OpenCode (static shieldcn badges, no live data)
- [X] T010 [US1] Verify the hero + both badge rows fit above the fold on a 1280×800 viewport in light and dark themes (manual screenshot check)

**Checkpoint**: At this point, US1 is fully functional — a visitor can scan the repo and find the install command without scrolling.

---

## Phase 4: User Story 2 — Plugin evaluator browses the catalog (Priority: P2)

**Goal**: A visitor can identify every shipped plugin, read a one-line description, see the editor-support matrix, and jump to that plugin's detailed section via a TOC anchor.

**Independent Test**: Scroll to the catalog section of the rendered README. For each plugin the reader can identify: name, tagline, supported editor matrix, and a working deep link to its detailed section.

### Implementation for User Story 2

- [X] T011 [P] [US2] Render the `typescript-rules` plugin block in `README.md` (heading + tagline + editor-support badges + 3–6 feature bullets + install + usage examples)
- [X] T012 [P] [US2] Render the `jsdoc-standards` plugin block in `README.md` using the same template as T011
- [X] T013 [US2] Verify every plugin block's heading anchor matches the corresponding TOC entry and that the deep link scrolls to the right section
- [X] T014 [US2] Verify every plugin block lists the same editor matrix that the installer supports (claude_code, cursor, opencode) — no editor is over- or under-claimed

**Checkpoint**: US2 is fully functional — the plugin catalog is visually consistent and every block deep-links correctly.

---

## Phase 5: User Story 3 — Returning contributor checks status signals (Priority: P3)

**Goal**: A returning contributor or maintainer can confirm the project's current version, CI status, and license from the badge row alone, without opening the Releases tab.

**Independent Test**: From the top of the rendered README, the reader can identify the live `package.json` version, the latest CI run status, and the license — all in the first badge row.

### Implementation for User Story 3

- [X] T015 [P] [US3] Wire the npm version badge to `https://shieldcn.dev/npm/devkit-ai.svg` and link it to the GitHub Releases page
- [X] T016 [P] [US3] Wire the GitHub CI badge to `https://shieldcn.dev/github/ci/pau-vega/ai-devkit.svg` and link it to the Actions tab
- [X] T017 [P] [US3] Wire the GitHub license badge to `https://shieldcn.dev/github/license/pau-vega/ai-devkit.svg` and link it to `LICENSE`
- [X] T018 [US3] Verify the version, CI, and license badges are backed by live data sources (not hard-coded strings) and that the link targets are reachable

**Checkpoint**: US3 is fully functional — every status badge reflects live state and links to the right surface.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: CI hardening, content-preservation audit, and the final size-budget / accessibility checks that span every user story.

- [X] T019 [P] Add `.markdownlint.json` at the repo root with the minimum rule set needed for the README (no inline HTML for badges, table alignment, heading hierarchy)
- [X] T020 [P] Add `.markdown-link-check.json` at the repo root with a 5 s timeout and an allow-list for `localhost` anchors
- [X] T021 Extend `.github/workflows/readme-lint.yml` to also run `markdown-link-check` and the byte-size check (`wc -c README.md` < 30 000)
- [X] T022 Audit the rewritten `README.md` against the content-preservation map in `specs/001-beautiful-readme/baseline.md` — every original section (install flow, plugin details, known limitations, flags, releasing note) MUST still be present
- [X] T023 Run the local quickstart (`quickstart.md` steps 1–5) and record the outputs in the PR description
- [X] T024 Run `bash scripts/build-marketplace.sh` and visually confirm the per-plugin excerpts on `marketplace.html` still match the new README headings (manual smoke test required by constitution Principle II)
- [X] T025 Verify the README-lint CI job is green on the PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Phase 2 completion. Stories are independent of each other and can run in parallel.
- **Polish (Phase 6)**: Depends on every user story being merged.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No dependencies on US2/US3.
- **US2 (P2)**: Can start after Phase 2. Reads the plugin-block template from T005.
- **US3 (P3)**: Can start after Phase 2. Touches the same badge row added in T008 but uses a different `Badge` entity slot, so the edits do not conflict.

### Within Each User Story

- Hero content (T007) before badge rows (T008, T009).
- Plugin blocks (T011, T012) before the anchor/deep-link verification (T013, T014).
- All badge slots (T015, T016, T017) before the live-data verification (T018).
- All implementation before the story checkpoint.

### Parallel Opportunities

- Phase 1 tasks T002 and T003 are independent and can run in parallel.
- Phase 2 tasks T004, T005, and T006 are independent and can run in parallel.
- US1 tasks T008 and T009 are independent and can run in parallel.
- US2 tasks T011 and T012 are independent and can run in parallel.
- US3 tasks T015, T016, and T017 are independent and can run in parallel.
- All Polish tasks marked [P] can run in parallel.

---

## Parallel Example: User Story 1

```bash
# T008 and T009 are independent and can be done in parallel:
Task: "Add status badges to README.md (npm version, license, downloads, stars)"
Task: "Add editor-support badge row to README.md (Claude Code, Cursor, OpenCode)"
```

## Parallel Example: User Story 3

```bash
# T015, T016, T017 are independent and can be done in parallel:
Task: "Wire npm version badge to shieldcn + link to Releases"
Task: "Wire GitHub CI badge to shieldcn + link to Actions"
Task: "Wire GitHub license badge to shieldcn + link to LICENSE"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: render the README on GitHub, confirm the hero is above the fold, confirm the install command is visible
5. Merge / demo

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → render-check → merge (MVP!)
3. Add US2 → render-check + deep-link-check → merge
4. Add US3 → link-check + live-data-check → merge
5. Polish (Phase 6) → CI hardening, content-preservation audit, size budget enforcement

### Parallel Team Strategy

With multiple contributors:

1. Team completes Setup + Foundational together.
2. Once Phase 2 is done:
   - Contributor A: US1 (hero + status row)
   - Contributor B: US2 (plugin catalog)
   - Contributor C: US3 (status signal wiring)
3. Stories merge independently into the README.

---

## Notes

- The only production deliverable is `README.md`. Every other file added by this feature is configuration (`.markdownlint.json`, `.markdown-link-check.json`, `.github/workflows/readme-lint.yml`) or planning artefact under `specs/001-beautiful-readme/`.
- No tests are added in the traditional sense; the README-lint CI job (Phase 6) is the automated check that gates the merge.
- Commit after each task or logical group; do not bundle the full README rewrite into a single commit.
- The content-preservation audit in T022 is mandatory — the change is visual, not content-destructive.
- Stop at any checkpoint to validate the story independently.
