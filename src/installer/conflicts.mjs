/**
 * Per-file conflict resolver with a remember-for-this-run toggle.
 *
 * Default action is `skip` so accidental overwrites require explicit consent.
 * The `state.remembered` field, once set, applies for the rest of the run —
 * the user is not prompted again.
 */

import { confirm, isCancel, select } from "@clack/prompts";

/**
 * @typedef {"overwrite" | "skip" | "abort"} ConflictAction
 *
 * @typedef {object} ConflictState
 * @property {ConflictAction | null} remembered
 */

/**
 * Resolve what to do when a destination file already exists.
 *
 * @param {{
 *   targetPath: string,
 *   oldSize: number,
 *   newSize: number,
 *   state: ConflictState,
 * }} args
 * @returns {Promise<ConflictAction>}
 */
export async function resolveConflict({ targetPath, oldSize, newSize, state }) {
  if (state.remembered) return state.remembered;

  const action = await select({
    message: `${targetPath} already exists (existing ${oldSize}B, new ${newSize}B). Action?`,
    options: [
      { value: "skip", label: "Skip (keep existing)" },
      { value: "overwrite", label: "Overwrite" },
      { value: "abort", label: "Abort install" },
    ],
    initialValue: "skip",
  });
  if (isCancel(action)) return "abort";

  const remember = await confirm({
    message: "Apply this choice to all remaining conflicts?",
    initialValue: false,
  });
  if (isCancel(remember)) return "abort";

  if (remember) {
    state.remembered = /** @type {ConflictAction} */ (action);
  }

  return /** @type {ConflictAction} */ (action);
}
