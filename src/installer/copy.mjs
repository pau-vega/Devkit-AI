/**
 * Filesystem layer of the installer.
 *
 * Walks every selected plugin via `mapPluginFiles`, asks `resolveConflict` for
 * existing destinations, and copies (or — under `--dry-run` — only logs).
 * Hook scripts under `hooks/scripts/` are made executable on non-Windows.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { log } from "@clack/prompts";

import { resolveConflict } from "./conflicts.mjs";
import { mapPluginFiles } from "./targets.mjs";
import { transformSourceForEditor } from "./translator.mjs";

const ABORT_SENTINEL = "ABORTED_BY_USER";

/**
 * @typedef {import("./targets.mjs").MappedFile} MappedFile
 *
 * @typedef {object} CopyResult
 * @property {string[]} written
 * @property {Array<{ path: string, reason: string }>} skipped
 * @property {Array<{ path: string, error: string }>} errors
 */

/**
 * Copy every file across all selected plugins into the resolved target tree.
 *
 * @param {{
 *   packageRoot: string,
 *   plugins: Array<{ name: string, source: string }>,
 *   editor: import("./targets.mjs").Editor,
 *   scope: import("./targets.mjs").Scope,
 *   targetRoot: string,
 *   dryRun: boolean,
 * }} args
 * @returns {Promise<CopyResult>}
 */
export async function copyPluginFiles({
  packageRoot,
  plugins,
  editor,
  scope,
  targetRoot,
  dryRun,
}) {
  /** @type {CopyResult} */
  const result = { written: [], skipped: [], errors: [] };

  /** @type {MappedFile[]} */
  const allFiles = [];
  for (const plugin of plugins) {
    const pluginSourceDir = path.resolve(packageRoot, plugin.source);
    const mapped = mapPluginFiles({
      editor,
      scope,
      pluginName: plugin.name,
      pluginSourceDir,
      targetRoot,
    });
    allFiles.push(...mapped);
  }

  /** @type {import("./conflicts.mjs").ConflictState} */
  const conflictState = { remembered: null };

  for (const entry of allFiles) {
    if (entry.skipped) {
      result.skipped.push({ path: entry.dest, reason: entry.skipReason ?? "skipped" });
      continue;
    }

    let existing = null;
    try {
      existing = fs.statSync(entry.dest);
    } catch (err) {
      if (err && err.code !== "ENOENT") {
        // Permission denied or other read error — record and continue.
        result.errors.push({
          path: entry.dest,
          error: `Could not stat target: ${err.message}`,
        });
        continue;
      }
    }

    if (existing && dryRun) {
      log.info(`would write (overwrites existing): ${entry.dest}`);
      result.written.push(entry.dest);
      continue;
    }

    if (existing) {
      let newSize = null;
      try {
        newSize = fs.statSync(entry.src).size;
      } catch {
        // The src is bundled in the package; failing to stat it is unusual but
        // not fatal — fall through and let the copy attempt produce the error.
      }
      const action = await resolveConflict({
        targetPath: entry.dest,
        oldSize: existing.size,
        newSize,
        state: conflictState,
      });
      if (action === "abort") {
        throw new Error(ABORT_SENTINEL);
      }
      if (action === "skip") {
        result.skipped.push({
          path: entry.dest,
          reason: "already exists (kept existing)",
        });
        continue;
      }
      // action === "overwrite" -> fall through to the write below.
    }

    if (dryRun) {
      log.info(`would write: ${entry.dest}`);
      result.written.push(entry.dest);
      continue;
    }

    try {
      fs.mkdirSync(path.dirname(entry.dest), { recursive: true });
      const sourceContent = fs.readFileSync(entry.src, "utf8");
      const translated = transformSourceForEditor({
        editor,
        kind: entry.kind,
        content: sourceContent,
      });
      fs.writeFileSync(entry.dest, translated);
      if (
        entry.kind === "hook-script" &&
        os.platform() !== "win32" &&
        /\.sh$/.test(entry.dest)
      ) {
        fs.chmodSync(entry.dest, 0o755);
      }
      result.written.push(entry.dest);
    } catch (err) {
      const code = err && err.code;
      if (code === "EACCES" && entry.dest.startsWith(targetRoot)) {
        // Permission denied on the target root itself — recoverable advice
        // beats an opaque stack trace.
        result.errors.push({
          path: entry.dest,
          error:
            "permission denied; try a different scope or rerun with sufficient privileges.",
        });
      } else {
        result.errors.push({
          path: entry.dest,
          error: err.message ?? String(err),
        });
      }
    }
  }

  return result;
}

export { ABORT_SENTINEL };
