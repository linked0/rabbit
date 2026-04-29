#!/usr/bin/env node

/**
 * decipher-single-map.js
 *
 * Takes a single .map file and recovers the original source code.
 * Usage: node scripts/decipher-single-map.js dist/prompts/templates.js.map
 */

const fs = require("fs");
const path = require("path");

// Default to the prompts/templates.js.map if no argument given
const mapPath = process.argv[2]
  || path.join(__dirname, "..", "dist", "prompts", "templates.js.map");

console.log(`\nReading: ${mapPath}\n`);

// Step 1: Read the .map file — it's just JSON
const raw = fs.readFileSync(mapPath, "utf-8");
const sourceMap = JSON.parse(raw);

console.log("=== SOURCE MAP METADATA ===");
console.log(`  version:    ${sourceMap.version}`);
console.log(`  file:       ${sourceMap.file}`);
console.log(`  sources:    ${sourceMap.sources.join(", ")}`);
console.log();

// Step 2: The secret is in "sourcesContent" — an array of strings,
// each one being the FULL original source file, verbatim.
if (!sourceMap.sourcesContent || sourceMap.sourcesContent.length === 0) {
  console.log("No sourcesContent found — this map only has mappings.");
  console.log("The original source is NOT embedded (safe).");
  process.exit(0);
}

console.log("=== RECOVERED ORIGINAL SOURCE ===");
console.log();

sourceMap.sourcesContent.forEach((content, i) => {
  const filename = sourceMap.sources[i];
  console.log(`--- ${filename} ---`);
  console.log(content);
  console.log();
});

console.log("=== WHAT THIS MEANS ===");
console.log("The .map file contained the COMPLETE original TypeScript.");
console.log("Anyone with npm access can read this — no hacking required.");
console.log("Just: JSON.parse(fs.readFileSync('file.js.map')).sourcesContent");
