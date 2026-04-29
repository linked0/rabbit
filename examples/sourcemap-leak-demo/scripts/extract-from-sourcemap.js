#!/usr/bin/env node

/**
 * extract-from-sourcemap.js
 *
 * Demonstrates how anyone can recover original TypeScript source
 * from .map files left in an npm package.
 *
 * This is exactly what happened with the Claude Code incident:
 * the .map files contained `sourcesContent` — the full original
 * source code, embedded as JSON strings.
 */

const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");

console.log("=".repeat(60));
console.log("SOURCE MAP EXTRACTION DEMO");
console.log("Recovering original source code from .map files");
console.log("=".repeat(60));
console.log();

// Find all .map files in dist/
function findMapFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMapFiles(fullPath));
    } else if (entry.name.endsWith(".map")) {
      results.push(fullPath);
    }
  }
  return results;
}

const mapFiles = findMapFiles(distDir);

if (mapFiles.length === 0) {
  console.log("No .map files found. Run 'npm run build:vulnerable' first.");
  process.exit(1);
}

console.log(`Found ${mapFiles.length} source map file(s):\n`);

for (const mapFile of mapFiles) {
  const relative = path.relative(distDir, mapFile);
  const sourceMap = JSON.parse(fs.readFileSync(mapFile, "utf-8"));

  console.log(`--- ${relative} ---`);
  console.log(`  version: ${sourceMap.version}`);
  console.log(`  sources: ${JSON.stringify(sourceMap.sources)}`);
  console.log(`  has sourcesContent: ${!!sourceMap.sourcesContent}`);
  console.log();

  // The key vulnerability: sourcesContent contains the FULL original source
  if (sourceMap.sourcesContent) {
    for (let i = 0; i < sourceMap.sources.length; i++) {
      const sourceName = sourceMap.sources[i];
      const content = sourceMap.sourcesContent[i];

      console.log(`  [EXTRACTED] ${sourceName}`);
      console.log("  " + "-".repeat(50));

      // Show the recovered source code
      const lines = content.split("\n");
      for (const line of lines) {
        console.log(`  | ${line}`);
      }
      console.log();
    }
  }
}

console.log("=".repeat(60));
console.log("IMPACT: All internal source code — prompts, tool routing,");
console.log("agent orchestration — is fully recoverable from .map files.");
console.log("=".repeat(60));
