/**
 * Per-editor + per-scope target-path resolution and source-to-target file
 * mapping.
 *
 * Pure logic — no filesystem writes, only `readdirSync` to discover source
 * files. Resolves where each plugin file should land based on the user's
 * editor + scope choices, and applies the documented skip rules:
 *
 *   - OpenCode: hooks (hooks.json + hooks/scripts/*.sh) skipped, no portable form.
 *   - Cursor:   agents/*.md skipped, no portable agent file format.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * @typedef {"claude-code" | "cursor" | "opencode"} Editor
 * @typedef {"project" | "project-local" | "user"} Scope
 * @typedef {"skill" | "command" | "agent" | "hooks-json" | "hook-script" | "plugin-manifest"} FileKind
 *
 * @typedef {object} TargetRootResult
 * @property {string} root           Absolute path of the editor target root.
 * @property {string[]} warnings     Human-readable warnings for the chosen combo.
 *
 * @typedef {object} MappedFile
 * @property {string} src            Absolute path inside the package.
 * @property {string} dest           Absolute path on the user filesystem.
 * @property {FileKind} kind
 * @property {boolean} [skipped]
 * @property {string} [skipReason]
 */

/**
 * Resolve the absolute target root for an editor + scope combo.
 *
 * @param {{ editor: Editor, scope: Scope, cwd: string, home: string }} args
 * @returns {TargetRootResult}
 */
export function resolveTargetRoot({ editor, scope, cwd, home }) {
  const warnings = [];
  let root;

  if (editor === "claude-code") {
    if (scope === "user") {
      root = path.join(home, ".claude");
    } else {
      // project + project-local share the same on-disk path; the gitignore
      // block is what differentiates project-local.
      root = path.join(cwd, ".claude");
    }
  } else if (editor === "cursor") {
    if (scope === "user") {
      root = path.join(home, ".cursor");
      warnings.push(
        "Cursor user-global scope: only hooks.json and hooks/ are formally documented. " +
          "Commands, rules, and skills at user scope are best-effort.",
      );
    } else {
      root = path.join(cwd, ".cursor");
    }
  } else if (editor === "opencode") {
    if (scope === "user") {
      root = path.join(home, ".config", "opencode");
    } else {
      root = path.join(cwd, ".opencode");
    }
  } else {
    throw new Error(`Unknown editor: ${editor}`);
  }

  return { root, warnings };
}

/**
 * Walk a plugin source directory and return every relevant file with its
 * resolved destination, kind, and (if applicable) skip reason.
 *
 * @param {{
 *   editor: Editor,
 *   scope: Scope,
 *   pluginName: string,
 *   pluginSourceDir: string,
 *   targetRoot: string,
 * }} args
 * @returns {MappedFile[]}
 */
export function mapPluginFiles({
  editor,
  scope,
  pluginName,
  pluginSourceDir,
  targetRoot,
}) {
  /** @type {MappedFile[]} */
  const out = [];

  let entries;
  try {
    entries = fs.readdirSync(pluginSourceDir, {
      recursive: true,
      withFileTypes: true,
    });
  } catch (err) {
    // If the plugin source dir is missing, return empty — caller decides what
    // to do. A descriptive error here would mask which plugin is missing.
    return out;
  }

  // Cursor collapses the inner skill-name segment when a plugin ships a single
  // skill (precedent: `.cursor/skills/typescript-rules/SKILL.md`). With more
  // than one skill, the inner segment is preserved (precedent:
  // `.cursor/skills/workflow-toolkit/<name>/SKILL.md`). We pre-count skills so
  // resolveDestination can decide.
  const skillDirNames = new Set();
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const parentDir =
      typeof entry.parentPath === "string" ? entry.parentPath : entry.path;
    const rel = path.relative(pluginSourceDir, path.join(parentDir, entry.name));
    const relPosix = rel.split(path.sep).join("/");
    if (relPosix.startsWith("skills/")) {
      const segs = relPosix.split("/");
      if (segs.length >= 3) skillDirNames.add(segs[1]);
    }
  }
  const collapseCursorSkill = skillDirNames.size === 1;

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const parentDir =
      typeof entry.parentPath === "string" ? entry.parentPath : entry.path;
    const absSrc = path.join(parentDir, entry.name);
    const rel = path.relative(pluginSourceDir, absSrc);
    // Normalise to POSIX separators for matching; reassemble with `path.join`
    // when building the destination so we stay cross-platform.
    const relPosix = rel.split(path.sep).join("/");

    if (relPosix.startsWith(".")) continue; // skip dotfiles/dotdirs

    // Skip the plugin manifest — the standalone editor trees don't consume it.
    if (relPosix === ".claude-plugin/plugin.json") continue;
    if (relPosix.startsWith(".claude-plugin/")) continue;

    const top = relPosix.split("/")[0];

    /** @type {FileKind} */
    let kind;
    if (top === "skills") kind = "skill";
    else if (top === "commands") kind = "command";
    else if (top === "agents") kind = "agent";
    else if (relPosix === "hooks/hooks.json") kind = "hooks-json";
    else if (top === "hooks") kind = "hook-script";
    else continue; // README.md inside a plugin etc — not installed

    // Apply skip rules for editor capability gaps.
    let skipped = false;
    let skipReason;
    if (editor === "cursor" && kind === "agent") {
      skipped = true;
      skipReason = "Cursor has no portable agent file format.";
    } else if (
      editor === "opencode" &&
      (kind === "hooks-json" || kind === "hook-script")
    ) {
      skipped = true;
      skipReason =
        "OpenCode does not consume hooks.json. Skills + commands are still installed.";
    }

    const dest = resolveDestination({
      editor,
      kind,
      pluginName,
      relPosix,
      targetRoot,
      collapseCursorSkill,
    });

    out.push({
      src: absSrc,
      dest,
      kind,
      ...(skipped ? { skipped: true, skipReason } : {}),
    });
  }

  return out;
}

/**
 * Compute the destination path for a single source file.
 *
 * Applies Cursor's plugin-name namespacing for skills (precedent set by
 * `scripts/build-marketplace.sh` and the existing `.cursor/skills/` tree):
 * single-skill plugins collapse the inner skill-name segment
 * (`.cursor/skills/<plugin>/SKILL.md`), multi-skill plugins preserve it
 * (`.cursor/skills/<plugin>/<skill-name>/SKILL.md`).
 *
 * Claude Code and OpenCode preserve the source skill directory name without
 * per-plugin prefixing.
 *
 * @param {{
 *   editor: Editor,
 *   kind: FileKind,
 *   pluginName: string,
 *   relPosix: string,
 *   targetRoot: string,
 *   collapseCursorSkill: boolean,
 * }} args
 * @returns {string}
 */
function resolveDestination({
  editor,
  kind,
  pluginName,
  relPosix,
  targetRoot,
  collapseCursorSkill,
}) {
  // Trim the top-level dir name (e.g. "skills/typescript-conventions/SKILL.md"
  // -> "typescript-conventions/SKILL.md").
  const segments = relPosix.split("/");
  const tail = segments.slice(1).join("/");

  if (kind === "skill") {
    if (editor === "cursor") {
      // Single-skill plugin: drop the inner skill-name segment so the skill
      // lands at .cursor/skills/<plugin>/SKILL.md (matches the existing
      // symlink layout in this repo).
      const tailSegs = tail.split("/");
      const innerTail = collapseCursorSkill ? tailSegs.slice(1) : tailSegs;
      return path.join(targetRoot, "skills", pluginName, ...innerTail);
    }
    // Claude Code + OpenCode: .claude/skills/<skill-name>/SKILL.md (flat).
    return path.join(targetRoot, "skills", ...tail.split("/"));
  }

  if (kind === "command") {
    // commands/<file>.md — same shape across editors.
    return path.join(targetRoot, "commands", ...tail.split("/"));
  }

  if (kind === "agent") {
    return path.join(targetRoot, "agents", ...tail.split("/"));
  }

  if (kind === "hooks-json") {
    if (editor === "cursor") {
      // Cursor uses a single root hooks.json, not hooks/hooks.json.
      return path.join(targetRoot, "hooks.json");
    }
    return path.join(targetRoot, "hooks", "hooks.json");
  }

  if (kind === "hook-script") {
    // hooks/scripts/foo.sh — preserve the path under .<editor>/hooks/...
    return path.join(targetRoot, ...relPosix.split("/"));
  }

  // Should never hit; resolveDestination is exhaustive over FileKind.
  return path.join(targetRoot, ...relPosix.split("/"));
}
