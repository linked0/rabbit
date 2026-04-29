#!/usr/bin/env node

/**
 * compare-packages.js
 *
 * Shows the difference between a vulnerable package (with .map files)
 * and a safe package (without .map files) by listing their contents.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

// Find the .tgz file
const tgz = fs.readdirSync(root).find((f) => f.endsWith(".tgz"));
if (!tgz) {
  console.log("No .tgz found. Run 'npm run pack:vulnerable' first.");
  process.exit(1);
}

console.log("=".repeat(60));
console.log("VULNERABLE PACKAGE CONTENTS");
console.log("=".repeat(60));

const listing = execSync(`tar tzf "${path.join(root, tgz)}"`, {
  encoding: "utf-8",
});
const files = listing.trim().split("\n");

let mapCount = 0;
for (const file of files) {
  const isMap = file.endsWith(".map");
  if (isMap) mapCount++;
  console.log(`  ${isMap ? "[!] " : "    "}${file}`);
}

console.log();
console.log(`Total files: ${files.length}`);
console.log(`Source map files: ${mapCount}`);

if (mapCount > 0) {
  console.log();
  console.log("WARNING: This package contains source maps!");
  console.log("Anyone who installs it can extract your original source code.");
  console.log();
  console.log('Run "npm run build:safe && npm pack" to produce a safe package.');
} else {
  console.log();
  console.log("SAFE: No source maps found in package.");
}
