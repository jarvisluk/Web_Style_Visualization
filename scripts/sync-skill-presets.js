#!/usr/bin/env node

/**
 * Regenerate the embedded PRESETS block in web-style-skill/scripts/build_url.py
 * from src/styles/*.json so the offline skill never drifts from the site.
 * Usage: node scripts/sync-skill-presets.js
 */

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stylesDir = join(root, "src", "styles");
const target = join(root, "web-style-skill", "scripts", "build_url.py");

const presets = readdirSync(stylesDir)
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(stylesDir, f), "utf-8")));

const indent = (text, n) => text.split("\n").map((l) => " ".repeat(n) + l).join("\n");

const body = presets
  .map((s) => {
    const vars = Object.entries(s.variables)
      .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)},`)
      .join("\n");
    return [
      `${JSON.stringify(s.id)}: {`,
      `    "name": ${JSON.stringify(s.name)},`,
      `    "category": ${JSON.stringify(s.category)},`,
      `    "description": ${JSON.stringify(s.description)},`,
      `    "variables": {`,
      indent(vars, 8),
      `    },`,
      `},`,
    ].join("\n");
  })
  .join("\n");

const START = "PRESETS: dict[str, dict] = {\n";
const END = "\n}\n\nVALID_STYLES";
const source = readFileSync(target, "utf-8");
const i = source.indexOf(START);
const j = source.indexOf(END, i);
if (i === -1 || j === -1) {
  console.error("Could not find the PRESETS block in build_url.py");
  process.exit(1);
}

writeFileSync(target, source.slice(0, i + START.length) + indent(body, 4) + source.slice(j));
console.log(`Synced ${presets.length} presets into ${target}`);
