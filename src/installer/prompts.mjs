/**
 * Interactive prompt flow built on `@clack/prompts`.
 *
 * Order:
 *   1. editor select
 *   2. scope select
 *   3. plugins multiselect (initial = all)
 *   4. confirm "Proceed?" with the resolved target root displayed
 *
 * Every prompt return value is run through `isCancel`. On cancel we call
 * `cancel()` and exit 0 — no filesystem writes happen here, so Ctrl-C at any
 * point leaves the user's machine untouched.
 */

import os from "node:os";

import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  multiselect,
  note,
  select,
} from "@clack/prompts";

import { listPlugins } from "./marketplace.mjs";
import { resolveTargetRoot } from "./targets.mjs";

/**
 * Run the full prompt flow.
 *
 * @param {{ packageRoot: string, dryRun: boolean }} args
 * @returns {Promise<{
 *   editor: import("./targets.mjs").Editor,
 *   scope: import("./targets.mjs").Scope,
 *   plugins: Array<{ name: string, source: string, version: string, displayName: string }>,
 *   targetRoot: string,
 * }>}
 */
export async function runPromptFlow({ packageRoot, dryRun }) {
  intro(dryRun ? "AI-Devkit installer (dry-run)" : "AI-Devkit installer");

  const editor = await select({
    message: "Which editor are you installing for?",
    options: [
      { value: "claude-code", label: "Claude Code" },
      { value: "opencode", label: "OpenCode" },
      { value: "cursor", label: "Cursor" },
    ],
  });
  if (isCancel(editor)) {
    cancel("Cancelled.");
    process.exit(0);
  }

  const scope = await select({
    message: "Install scope?",
    options: [
      { value: "project", label: "Project (committed to repo, shared with team)" },
      { value: "project-local", label: "Project-local (gitignored, just for me)" },
      { value: "user", label: "User-global (every project)" },
    ],
  });
  if (isCancel(scope)) {
    cancel("Cancelled.");
    process.exit(0);
  }

  const allPlugins = listPlugins(packageRoot);
  const initial = allPlugins.map((p) => p.name);

  const selected = await multiselect({
    message: "Which plugins?",
    options: allPlugins.map((p) => ({
      value: p.name,
      label: p.displayName,
      hint: p.source.replace(/^\.\//u, ""),
    })),
    initialValues: initial,
    required: true,
  });
  if (isCancel(selected)) {
    cancel("Cancelled.");
    process.exit(0);
  }

  if (!Array.isArray(selected) || selected.length === 0) {
    cancel("No plugins selected. Nothing to install.");
    process.exit(0);
  }

  const plugins = allPlugins.filter((p) => selected.includes(p.name));

  const { root: targetRoot, warnings } = resolveTargetRoot({
    editor: /** @type {import("./targets.mjs").Editor} */ (editor),
    scope: /** @type {import("./targets.mjs").Scope} */ (scope),
    cwd: process.cwd(),
    home: os.homedir(),
  });

  for (const w of warnings) {
    log.warn(w);
  }

  note(
    [
      `Target: ${targetRoot}`,
      `Plugins: ${plugins.map((p) => p.name).join(", ")}`,
      dryRun ? "Mode: dry-run (no files will be written)" : "",
    ]
      .filter(Boolean)
      .join("\n"),
    "Ready to install",
  );

  const proceed = await confirm({
    message: "Proceed?",
    initialValue: true,
  });
  if (isCancel(proceed) || !proceed) {
    cancel("Cancelled.");
    process.exit(0);
  }

  return {
    editor: /** @type {import("./targets.mjs").Editor} */ (editor),
    scope: /** @type {import("./targets.mjs").Scope} */ (scope),
    plugins,
    targetRoot,
  };
}
