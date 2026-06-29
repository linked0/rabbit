#!/usr/bin/env node

/**
 * strip-sourcemaps.js
 *
 * The fix: remove .map files and sourceMappingURL references
 * from production builds before publishing to npm.
 *
 * This is what Anthropic's build pipeline should have done.
 */

const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");

let mapsRemoved = 0;
let refsStripped = 0;

function processDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDir(fullPath);
      continue;
    }

    // 1. Delete .map files
    if (entry.name.endsWith(".map")) {
      fs.unlinkSync(fullPath);
      mapsRemoved++;
      console.log(`  [DELETED] ${path.relative(distDir, fullPath)}`);
      continue;
    }

    // 2. Remove sourceMappingURL comments from .js files
    if (entry.name.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      const updated = content.replace(
        /\/\/# sourceMappingURL=.*\.map\s*$/gm,
        ""
      );
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated);
        refsStripped++;
        console.log(`  [STRIPPED] sourceMappingURL from ${path.relative(distDir, fullPath)}`);
      }
    }
  }
}

console.log("Stripping source maps from production build...\n");
processDir(distDir);
console.log(`\nDone: ${mapsRemoved} .map files deleted, ${refsStripped} references stripped.`);
