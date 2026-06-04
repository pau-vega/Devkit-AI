/**
 * Per-editor content translation for agent and command files.
 *
 * The plugin source tree is written in Claude Code's agent/command frontmatter
 * format. Most other runtimes (OpenCode in particular) share the markdown-with-
 * frontmatter shape but expect different frontmatter keys and have no
 * `${CLAUDE_PLUGIN_ROOT}` env var. This module is the only place that
 * translation lives, so the source stays runtime-neutral.
 *
 * Why per-target translation instead of parallel files: the agent and command
 * bodies are large and shared logic — duplicating them per runtime is a
 * maintenance burden. A small transform step is the cheaper abstraction.
 *
 * Transformation rules:
 *
 *   OpenCode agents
 *     - drop `model: <value>`           (OpenCode requires provider-qualified
 *                                        IDs; omitting inherits the user's
 *                                        `opencode.json` default — any
 *                                        provider, Anthropic included)
 *     - add `mode: subagent`            (if not already set; OpenCode's
 *                                        equivalent of Claude Code's
 *                                        `allowed-tools: [Agent]`)
 *     - drop `tools: [...]` and emit a  (OpenCode's `tools:` field is
 *       `permission:` block with the    deprecated; the modern equivalent
 *       detected tool names in           is a `permission:` block. Without
 *       lowercase, all set to `allow`    this the agent falls back to
 *                                        OpenCode's default — all tools
 *                                        allowed — which is more permissive
 *                                        than the source declares)
 *     - replace `${CLAUDE_PLUGIN_ROOT}` → `..`
 *                                        (OpenCode has no env-var injection;
 *                                        agents live at `.opencode/agents/`,
 *                                        skills at `.opencode/skills/`, so
 *                                        `../skills/...` resolves correctly)
 *
 *   OpenCode commands
 *     - drop `allowed-tools:` block     (Claude Code-specific; OpenCode
 *                                        dispatches subagents via
 *                                        `opencode.json`'s `subtask: true`,
 *                                        not frontmatter)
 *     - replace `${CLAUDE_PLUGIN_ROOT}` → `..`
 *                                        (commands live at
 *                                        `.opencode/commands/`, so `..` lands
 *                                        at `.opencode/`)
 *     - append a `## Runtime` section   (the source body says "Dispatch the
 *       with the OpenCode-native         `<name>` agent" which assumes
 *       dispatch hint when the body     Claude Code's `Agent` tool. OpenCode
 *       dispatches a subagent.           uses `task({ subagent_type: "..." })`
 *                                        — the model can usually bridge, but
 *                                        an explicit hint is safer.)
 *
 *   Cursor
 *     - no transform; agents are skipped upstream (Cursor has no portable
 *       agent format) and the body doesn't reference `${CLAUDE_PLUGIN_ROOT}`
 *       in any source file today.
 *
 *   Claude Code
 *     - no transform; the source format is already canonical.
 */

/**
 * @param {{
 *   editor: import("./targets.mjs").Editor,
 *   kind: import("./targets.mjs").FileKind,
 *   content: string,
 * }} args
 * @returns {string} The content to write to the destination. Equal to
 *   `args.content` when no transform applies.
 */
export function transformSourceForEditor({ editor, kind, content }) {
  if (editor === "opencode" && kind === "agent") {
    return translateAgentToOpenCode(content);
  }
  if (editor === "opencode" && kind === "command") {
    return translateCommandToOpenCode(content);
  }
  return content;
}

/**
 * Translate a Claude Code agent file to OpenCode's agent format.
 *
 * @param {string} source
 * @returns {string}
 */
function translateAgentToOpenCode(source) {
  const parsed = splitFrontmatter(source);
  if (!parsed) {
    return rewritePluginRootVar(source);
  }

  const lines = parsed.frontmatter.split(/\r?\n/);
  const kept = [];
  let sawMode = false;
  /** @type {Set<string>} */
  const detectedTools = new Set();

  for (const line of lines) {
    if (/^model\s*:/.test(line)) {
      // Drop the model line — OpenCode's `model` field requires a
      // provider-qualified ID, and omitting it inherits the user's
      // `opencode.json` model (any provider).
      continue;
    }
    if (/^mode\s*:/.test(line)) {
      sawMode = true;
      kept.push(line);
      continue;
    }
    if (/^tools\s*:/.test(line)) {
      // Parse the inline-array form: `tools: ["Read", "Glob", "Grep", "Bash"]`.
      // List form (`tools:\n  - Read`) isn't used in this codebase, but if it
      // appears we degrade to "no detected tools" — OpenCode's default still
      // works, the agent just runs with all tools.
      const inline = line.match(/^tools\s*:\s*\[([^\]]*)\]/);
      if (inline) {
        for (const raw of inline[1].split(",")) {
          const name = raw.trim().replace(/^["']|["']$/g, "");
          if (name) detectedTools.add(name);
        }
      }
      // Drop the `tools:` line — replaced by the `permission:` block below.
      continue;
    }
    kept.push(line);
  }
  if (!sawMode) {
    kept.push("mode: subagent");
  }
  if (detectedTools.size > 0) {
    const sorted = [...detectedTools].sort();
    kept.push("permission:");
    for (const name of sorted) {
      // OpenCode's tool names are lowercase (`read`, `glob`, `grep`, `bash`).
      // Map by lowercasing; the four tools we use today (Read/Glob/Grep/Bash)
      // all map cleanly.
      kept.push(`  ${name.toLowerCase()}: allow`);
    }
  }

  const body = rewritePluginRootVar(parsed.body);
  return `---\n${kept.join("\n")}\n---\n${body}`;
}

/**
 * Translate a Claude Code command file to OpenCode's command format.
 *
 * @param {string} source
 * @returns {string}
 */
function translateCommandToOpenCode(source) {
  const parsed = splitFrontmatter(source);
  if (!parsed) {
    return rewritePluginRootVar(source);
  }

  const lines = parsed.frontmatter.split(/\r?\n/);
  const kept = [];
  let inAllowedTools = false;
  let allowedToolsIndent = "";
  for (const line of lines) {
    if (/^allowed-tools\s*:/.test(line)) {
      // Drop the `allowed-tools:` block. OpenCode dispatches subagents via
      // `opencode.json`'s `subtask: true`, not via command frontmatter.
      inAllowedTools = true;
      allowedToolsIndent = (line.match(/^(\s*)/) ?? [""])[0];
      continue;
    }
    if (inAllowedTools) {
      const lineIndent = (line.match(/^(\s*)/) ?? [""])[0];
      if (line.trim() === "" || lineIndent.length > allowedToolsIndent.length) {
        // Continuation of the `allowed-tools:` block (list items / multi-line
        // values). Keep skipping.
        continue;
      }
      inAllowedTools = false;
    }
    kept.push(line);
  }

  let body = rewritePluginRootVar(parsed.body);

  // If the command body dispatches a subagent, append a small `## Runtime`
  // hint that names OpenCode's `task` tool. The source body typically reads
  // "Dispatch the `<name>` agent" — the OpenCode equivalent is
  // `task({ subagent_type: "<name>", ... })`. The hint makes the dispatch
  // explicit so the primary model doesn't have to infer the tool name.
  const dispatchMatch = body.match(/[Dd]ispatch the `?([a-z0-9-]+)`? agent/);
  if (dispatchMatch) {
    const agentName = dispatchMatch[1];
    const hint =
      `\n## Runtime\n\n` +
      `In OpenCode, dispatch the agent with the \`task\` tool — the equivalent of Claude Code's \`Agent\` tool:\n\n` +
      `\`\`\`\n` +
      `task({ subagent_type: "${agentName}", description: "<short task>", prompt: "<full request>" })\n` +
      `\`\`\`\n` +
      `Pass the enforcement level and target path through \`prompt\` so the subagent has the full context.\n`;
    body = body.trimEnd() + "\n" + hint;
  }

  return `---\n${kept.join("\n")}\n---\n${body}`;
}

/**
 * Replace `${CLAUDE_PLUGIN_ROOT}` with `..` in body content.
 *
 * Works for both agents and commands because both land one directory below
 * `.opencode/` (`.opencode/agents/<file>.md` and `.opencode/commands/<file>.md`
 * respectively), so `..` resolves to `.opencode/` and the trailing
 * `skills/...` path is correct from there.
 *
 * @param {string} body
 * @returns {string}
 */
function rewritePluginRootVar(body) {
  return body.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, "..");
}

/**
 * Split a markdown file into its YAML frontmatter and body. Returns `null`
 * when no frontmatter block is present.
 *
 * @param {string} source
 * @returns {{ frontmatter: string, body: string } | null}
 */
function splitFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}
