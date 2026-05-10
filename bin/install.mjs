#!/usr/bin/env node
/**
 * my-marketplace installer entry point.
 *
 * Resolves the bundled package root, runs the prompt flow, copies files, and
 * (for project-local scope) writes a delimited gitignore block. All prompts
 * complete before any filesystem mutation, so Ctrl-C at any prompt leaves the
 * user's machine untouched.
 *
 * Flags: --dry-run, --help, --version. Nothing else.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ABORT_SENTINEL, copyPluginFiles } from "../src/installer/copy.mjs";
import { upsertGitignoreBlock } from "../src/installer/gitignore.mjs";
import { runPromptFlow } from "../src/installer/prompts.mjs";
import { printSummary } from "../src/installer/summary.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");

const REQUIRED_NODE = [20, 11, 0];

const HELP = `my-marketplace — install plugins into Claude Code, Cursor, or OpenCode.

Usage:
  npx @pau-vega/my-marketplace [--dry-run]
  npx github:pau-vega/my-marketplace [--dry-run]

Flags:
  --dry-run    Print every file that would be written, without touching disk.
  --help       Show this message.
  --version    Print the installer version.
`;

main().catch((err) => {
  if (err && err.message === ABORT_SENTINEL) {
    // Conflict prompt selected "abort" — clean exit, no stack trace.
    console.log("Cancelled.");
    process.exit(0);
  }
  console.error(`Error: ${err && err.message ? err.message : String(err)}`);
  process.exit(1);
});

async function main() {
  enforceNodeVersion();

  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    process.exit(0);
  }
  if (args.includes("--version") || args.includes("-v")) {
    const pkg = readPackageJson();
    console.log(pkg.version);
    process.exit(0);
  }
  const dryRun = args.includes("--dry-run");

  // Reject anything else so users don't silently mistype a flag.
  for (const a of args) {
    if (a === "--dry-run" || a === "--help" || a === "-h" || a === "--version" || a === "-v") {
      continue;
    }
    console.error(`Unknown argument: ${a}`);
    console.error(HELP);
    process.exit(2);
  }

  const { editor, scope, plugins, targetRoot } = await runPromptFlow({
    packageRoot: PACKAGE_ROOT,
    dryRun,
  });

  const result = await copyPluginFiles({
    packageRoot: PACKAGE_ROOT,
    plugins,
    editor,
    scope,
    targetRoot,
    dryRun,
  });

  if (scope === "project-local" && !dryRun && result.written.length > 0) {
    const cwd = process.cwd();
    const repoRelEntries = result.written
      .map((abs) => path.relative(cwd, abs))
      .filter((rel) => rel && !rel.startsWith(".."))
      .map((rel) => rel.split(path.sep).join("/"));
    if (repoRelEntries.length > 0) {
      try {
        upsertGitignoreBlock({ cwd, entries: repoRelEntries });
      } catch (err) {
        result.errors.push({
          path: path.join(cwd, ".gitignore"),
          error: `Could not update .gitignore: ${err.message}`,
        });
      }
    }
  }

  printSummary({
    written: result.written,
    skipped: result.skipped,
    errors: result.errors,
    targetRoot,
    editor,
    dryRun,
  });

  process.exit(result.errors.length > 0 ? 1 : 0);
}

/**
 * Read this package's own package.json from the bundled root.
 *
 * @returns {{ version: string, name: string }}
 */
function readPackageJson() {
  const raw = fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8");
  return JSON.parse(raw);
}

/**
 * Friendly runtime check for the Node engine floor.
 */
function enforceNodeVersion() {
  const current = process.versions.node.split(".").map((n) => Number.parseInt(n, 10));
  for (let i = 0; i < REQUIRED_NODE.length; i++) {
    const c = current[i] ?? 0;
    const r = REQUIRED_NODE[i];
    if (c > r) return;
    if (c < r) {
      const required = REQUIRED_NODE.join(".");
      console.error(
        `Node >=${required} required (you have ${process.versions.node}). Upgrade and retry.`,
      );
      process.exit(1);
    }
  }
  // Equal — fine.
}
