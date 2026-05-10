/**
 * Reads the bundled marketplace manifest and exposes the plugin list.
 *
 * The installer never hard-codes the plugin set — it always derives the list
 * from `.claude-plugin/marketplace.json` shipped inside the package. Adding a
 * fourth plugin to the manifest is therefore zero-change for this module.
 */

import fs from "node:fs";
import path from "node:path";

const MANIFEST_REL = path.join(".claude-plugin", "marketplace.json");

/**
 * Read and parse the marketplace manifest from the package root.
 *
 * @param {string} packageRoot - Absolute path to the installed package root.
 * @returns {object} Parsed marketplace.json contents.
 * @throws {Error} If the manifest is missing or malformed.
 */
export function readMarketplace(packageRoot) {
  const manifestPath = path.join(packageRoot, MANIFEST_REL);
  let raw;
  try {
    raw = fs.readFileSync(manifestPath, "utf8");
  } catch (err) {
    if (err && err.code === "ENOENT") {
      throw new Error(
        `Marketplace manifest not found at ${manifestPath}; the installer package may be corrupted.`,
      );
    }
    throw new Error(
      `Failed to read marketplace manifest at ${manifestPath}: ${err.message}`,
    );
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Marketplace manifest at ${manifestPath} is not valid JSON: ${err.message}`,
    );
  }
}

/**
 * Return the array of plugins declared in the marketplace manifest.
 *
 * Each entry exposes the four fields the installer needs downstream — name,
 * source (relative directory), version, and displayName.
 *
 * @param {string} packageRoot - Absolute path to the installed package root.
 * @returns {Array<{name: string, source: string, version: string, displayName: string}>}
 */
export function listPlugins(packageRoot) {
  const manifest = readMarketplace(packageRoot);
  if (!manifest || !Array.isArray(manifest.plugins)) {
    throw new Error(
      "Marketplace manifest is missing the `plugins` array; cannot enumerate plugins.",
    );
  }
  return manifest.plugins.map((p) => ({
    name: p.name,
    source: p.source,
    version: p.version,
    displayName: p.displayName ?? p.name,
  }));
}
