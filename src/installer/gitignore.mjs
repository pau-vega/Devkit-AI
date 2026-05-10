/**
 * Idempotent delimited-block management of `.gitignore` for project-local
 * scope.
 *
 * The block is delimited by:
 *
 *   # >>> my-marketplace
 *   <one repo-relative path per line>
 *   # <<< my-marketplace
 *
 * On every run the existing block (if any) is replaced verbatim — paths are
 * deduplicated and listed in stable order. Trailing newline is preserved.
 */

import fs from "node:fs";
import path from "node:path";

const BEGIN = "# >>> my-marketplace";
const END = "# <<< my-marketplace";

/**
 * Insert or replace the my-marketplace gitignore block.
 *
 * @param {{ cwd: string, entries: string[] }} args
 * @returns {{ written: number, path: string }}
 */
export function upsertGitignoreBlock({ cwd, entries }) {
  const gitignorePath = path.join(cwd, ".gitignore");

  // Deduplicate while preserving first-seen order.
  const seen = new Set();
  const ordered = [];
  for (const e of entries) {
    if (!seen.has(e)) {
      seen.add(e);
      ordered.push(e);
    }
  }

  let existing = "";
  try {
    existing = fs.readFileSync(gitignorePath, "utf8");
  } catch (err) {
    if (err && err.code !== "ENOENT") throw err;
    existing = "";
  }

  const blockLines = [BEGIN, ...ordered, END];
  const blockText = blockLines.join("\n");

  let next;
  if (existing.includes(BEGIN) && existing.includes(END)) {
    // Replace in place. Use a non-greedy match between markers.
    const re = new RegExp(
      `${escapeRegex(BEGIN)}[\\s\\S]*?${escapeRegex(END)}`,
      "m",
    );
    next = existing.replace(re, blockText);
  } else {
    // Append, ensuring exactly one blank line before the block.
    const trimmed = existing.replace(/\s+$/u, "");
    if (trimmed.length === 0) {
      next = `${blockText}\n`;
    } else {
      next = `${trimmed}\n\n${blockText}\n`;
    }
  }

  // Preserve a trailing newline.
  if (!next.endsWith("\n")) next += "\n";

  fs.writeFileSync(gitignorePath, next, "utf8");
  return { written: ordered.length, path: gitignorePath };
}

/**
 * Escape a literal string for use inside a RegExp.
 *
 * @param {string} s
 * @returns {string}
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
