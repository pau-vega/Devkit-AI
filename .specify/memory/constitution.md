<!--
  Sync Impact Report
  ==================
  Version change: (none) → 1.0.0
  Reason: initial ratification; no prior constitution file existed.
  Modified principles: (initial ratification, no prior titles)
  Added sections:
    - Core Principles (I-IV): Code Quality, Testing Standards,
      User Experience Consistency, Performance Requirements
    - Quality Gates
    - Development Workflow
    - Governance
  Removed sections: none
  Templates requiring updates:
    - .specify/templates/plan-template.md        ✅ aligned (Constitution Check section already present; gates draw from this constitution)
    - .specify/templates/spec-template.md         ✅ aligned (User Scenarios, Acceptance Scenarios, and Success Criteria reinforce Principles III and IV)
    - .specify/templates/tasks-template.md        ✅ aligned (Phase N "Polish & Cross-Cutting Concerns" absorbs Principle II/IV follow-up tasks)
    - .specify/templates/checklist-template.md    ⚠ pending (no principle-derived categories populated yet; first checklist run should seed items from Principles I-IV)
    - .specify/templates/commands/*.md            ✅ N/A (no commands directory present in this project)
  Follow-up TODOs: none (all placeholder tokens fully resolved)
-->

# Devkit-AI Constitution

This constitution governs the Devkit-AI marketplace and every plugin it ships
(`typescript-rules`, `jsdoc-standards`, and any future additions). It defines the
non-negotiable standards for code quality, testing, user experience, and performance
that all contributions MUST satisfy before merge.

## Core Principles

### I. Code Quality

All source files MUST adhere to the conventions captured in the `typescript-conventions`
and `jsdoc-conventions` skills. Concretely:

- TypeScript MUST compile under `strict: true`. Use of `any`, `enum`, and `export default`
  is forbidden and blocked by the enforcement hooks shipped with `typescript-rules`.
- Public APIs (exported functions, types, classes, and plugin entry points) MUST carry
  JSDoc documentation that meets the `jsdoc-standards` "Standard" level at minimum.
- Linting and formatting MUST pass clean in CI; pre-commit hooks MUST block commits that
  violate `eslint`, `prettier`, or the project's TypeScript rules.
- Dependencies MUST be declared in `package.json`; manual edits outside the lockfile are
  rejected. The project pins to pnpm; npm and yarn are forbidden by the enforce-pnpm hook.
- Every PR MUST be reviewed by at least one maintainer and pass the `ts-reviewer` agent
  (or an equivalent human review) with zero `Error`-severity findings.

**Rationale:** A marketplace sells convention plugins; the marketplace itself MUST be the
canonical example of those conventions. Sloppy source erodes trust in the enforcement
it ships.

### II. Testing Standards

Every user-facing change MUST be covered by automated tests at the appropriate layer:

- **Unit tests** cover pure logic (translators, parsers, manifest builders). New utilities
  MUST ship with unit tests, and `npm test` MUST pass on every PR.
- **Contract tests** verify that the generated `marketplace.json`,
  `.claude-plugin/marketplace.json`, and per-target install outputs (Claude Code, Cursor,
  OpenCode) match the documented schemas and expected shapes. Schema changes require a
  contract test update in the same PR.
- **Integration tests** exercise the installer end-to-end on a fixture project, asserting
  that selected plugins land in the correct target directories, that the `.gitignore`
  delimited block is rewritten idempotently, and that re-running the installer produces no
  diff on the second run.
- **Manual smoke test** of the rendered `marketplace.html` is required whenever component
  metadata, the plugin list, or display fields change.

A red → green → refactor cycle is enforced for contract and integration tests: failing
tests MUST be committed and reviewed before the implementation that satisfies them.

**Rationale:** Plugins target three independent runtimes. The only way to guarantee parity
is to assert the contract directly in CI; "looks fine on my machine" has historically been
the source of every marketplace regression.

### III. User Experience Consistency

The user experience MUST be identical and predictable across every surface the
marketplace controls:

- **Installer prompts** follow a single, documented order (Editor → Scope → Plugins →
  Conflicts). Ctrl-C is always a clean exit; no files are written before the final
  confirmation prompt.
- **Conflict resolution** offers the same three options (overwrite, skip, abort) at the
  same level of granularity (per file, with a one-time "apply to all remaining conflicts"
  shortcut).
- **Plugin metadata** (`name`, `description`, `version`, `keywords`) is rendered
  consistently in `marketplace.json` and on `marketplace.html`; plugin cards use the same
  layout, icon treatment, and description truncation rules.
- **Error messages** MUST be actionable: they name the offending file or input, state why
  the action is rejected, and point to the relevant section of `README.md` or this
  constitution.
- **Translation rules** between Claude Code, Cursor, and OpenCode are explicit and tested;
  the installer MUST surface a warning (never silently skip) when a feature is not
  supported on the chosen editor (for example, OpenCode does not consume `hooks.json`;
  Cursor has no portable agent format).

**Rationale:** Contributors and end users are the same audience at different points in
the funnel. Inconsistent UX between runtimes creates support tickets and erodes adoption
of otherwise working plugins.

### IV. Performance Requirements

All shipped artifacts MUST meet explicit, measurable performance budgets:

- **Installer runtime:** a cold `npx devkit-ai` run on the default plugin set (two
  plugins, empty `cwd`) MUST complete in under 30 seconds on a typical developer laptop,
  including the full prompt flow and file writes.
- **Marketplace page:** `marketplace.html` (including all inlined CSS and SVG) MUST weigh
  under 250 KB uncompressed and MUST reach `DOMContentLoaded` in under 1 second on a
  simulated Fast 3G connection, verified via a Lighthouse CI run on every PR that touches
  the page.
- **Build pipeline:** `npm run build` (the manifest aggregator + HTML generator) MUST
  complete in under 10 seconds; any regression above 15 seconds blocks release.
- **Plugin payload:** the combined size of any single plugin's installed files MUST NOT
  exceed 1 MB, measured before `.gitignore`-managed cleanup. Vendored assets larger than
  100 KB require an explicit justification comment in the PR description.

Performance regressions MUST be reported in the PR that introduces them and either fixed
in the same PR or tracked as a follow-up issue before merge.

**Rationale:** The marketplace is consumed interactively (installer) and on first paint
(showcase page). Latency at these moments is the single biggest driver of install
abandonment and bounce rate.

## Quality Gates

Every PR MUST satisfy the following automated and human gates before merge:

- **Automated:** `npm run lint`, `npm run typecheck`, `npm test`, and the `build` step all
  exit 0 in CI. The release-please dry-run MUST report no manifest drift.
- **Agent review:** the `ts-reviewer` and `jsdoc-reviewer` agents MUST report zero
  `Error` findings. `Warning` findings MUST be addressed or explicitly waived with
  rationale in the PR body.
- **Schema review:** any change to a `marketplace.json`, `plugin.json`, or generated
  contract MUST include a diff of the rendered output and a passing contract test.
- **Changelog:** release-please owns the changelog, but PRs that change user-visible
  behavior in ways release-please cannot infer MUST include a brief note under an
  "Unreleased" section in `CHANGELOG.md`.

A gate is considered "passed" only when every item above is green; partial passes block
merge.

## Development Workflow

- **Branching:** feature work happens on a `###-feature-name` branch off `main`. Direct
  commits to `main` are forbidden; CI enforces branch protection.
- **Commits:** commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`,
  `refactor:`, `docs:`). release-please derives the changelog entry and version bump from
  them.
- **Pre-commit hooks** run `lint`, `typecheck`, and the pnpm-enforcement check locally;
  they MUST NOT be bypassed with `--no-verify` except in emergencies, which MUST be
  documented in the PR description.
- **Releases:** release-please opens a release PR on every push to `main`. Merging that
  PR publishes to npm via the `publish` workflow, gated by the `NPM_TOKEN` secret.
- **Retirement:** plugins are removed via a `chore: remove <plugin>` commit that also
  drops the plugin from `marketplace.json` and the showcase page in the same PR, with
  any per-target install artifacts cleaned up by an updated integration test.

## Governance

This constitution supersedes all other ad-hoc practices. Amendments require:

1. A PR that updates `.specify/memory/constitution.md`, including the Sync Impact Report
   as an HTML comment at the top of the file.
2. A clear semantic-version bump of the constitution:
   - **MAJOR** for backward-incompatible governance changes or principle removals.
   - **MINOR** for new principles added or materially expanded guidance.
   - **PATCH** for clarifications, wording changes, and typo fixes.
3. Review and approval by at least one maintainer who is not the author of the amendment.

All PRs and reviews MUST verify compliance with the principles above; violations MUST
either be justified in the "Complexity Tracking" section of the relevant `plan.md` or
rejected. Runtime development guidance lives in `README.md` and the per-plugin
`README.md` files, which MUST be updated whenever a principle changes the contributor
workflow.

**Version**: 1.0.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05
