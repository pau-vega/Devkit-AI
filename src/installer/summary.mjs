/**
 * Final post-install summary.
 *
 * Prints a single calm note covering: files written, files skipped (with
 * reason), errors (if any), and editor-specific next steps. Closes with an
 * `outro`. No emoji.
 */

import { note, outro } from "@clack/prompts";

const NEXT_STEPS = {
  "claude-code":
    "Run `/reload-plugins` in Claude Code, or restart the session, to pick up the new files.",
  opencode: "Restart your OpenCode session to load the new commands and skills.",
  cursor: "Restart Cursor so the new commands, rules, hooks, and skills are loaded.",
};

/**
 * @param {{
 *   written: string[],
 *   skipped: Array<{ path: string, reason: string }>,
 *   errors: Array<{ path: string, error: string }>,
 *   targetRoot: string,
 *   editor: import("./targets.mjs").Editor,
 *   dryRun: boolean,
 * }} args
 */
export function printSummary({
  written,
  skipped,
  errors,
  targetRoot,
  editor,
  dryRun,
}) {
  const sections = [];

  sections.push(`Target: ${targetRoot}`);

  if (written.length > 0) {
    const head = written.slice(0, 5);
    const more = written.length > head.length ? written.length - head.length : 0;
    const verb = dryRun ? "Would write" : "Written";
    const lines = [`${verb} (${written.length}):`, ...head.map((p) => `  - ${p}`)];
    if (more > 0) lines.push(`  + ${more} more`);
    sections.push(lines.join("\n"));
  }

  if (skipped.length > 0) {
    const lines = [
      `Skipped (${skipped.length}):`,
      ...skipped.map((s) => `  - ${s.path}\n      reason: ${s.reason}`),
    ];
    sections.push(lines.join("\n"));
  }

  if (errors.length > 0) {
    const lines = [
      `Errors (${errors.length}):`,
      ...errors.map((e) => `  - ${e.path}\n      ${e.error}`),
    ];
    sections.push(lines.join("\n"));
  }

  const next = NEXT_STEPS[editor];
  if (next) {
    sections.push(`Next steps:\n  ${next}`);
  }

  note(sections.join("\n\n"), dryRun ? "Dry-run summary" : "Install summary");

  if (dryRun) {
    outro("(dry-run — no files written)");
  } else if (errors.length > 0) {
    outro("Done with errors. See above.");
  } else {
    outro("Done.");
  }
}
