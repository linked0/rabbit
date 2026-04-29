#!/usr/bin/env node

/**
 * explain-sourcemap-principle.js
 *
 * Teaches the TWO ways source maps expose original code:
 *   1. Easy way:  sourcesContent (full source embedded as string)
 *   2. Hard way:  mappings field (Base64 VLQ encoded position mapping)
 *
 * The Claude Code leak used method #1. But even without sourcesContent,
 * the mappings field reveals the structure of the original code.
 */

const fs = require("fs");
const path = require("path");

const mapPath = path.join(__dirname, "..", "dist", "prompts", "templates.js.map");
const jsPath = path.join(__dirname, "..", "dist", "prompts", "templates.js");

const sourceMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
const compiledJS = fs.readFileSync(jsPath, "utf-8");

// ═══════════════════════════════════════════════════════════
// PART 1: The .map file structure
// ═══════════════════════════════════════════════════════════

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║         SOURCE MAP DECIPHERING — PRINCIPLES             ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log();

console.log("A .map file is JSON with these fields:\n");
console.log("  {");
console.log(`    "version":        ${sourceMap.version}                    // always 3`);
console.log(`    "file":           "${sourceMap.file}"       // compiled output file`);
console.log(`    "sources":        ["${sourceMap.sources[0]}"]`);
console.log(`                                              // original source file path(s)`);
console.log(`    "names":          [${sourceMap.names.length ? sourceMap.names.join(", ") : ""}]                    // original variable/function names`);
console.log(`    "mappings":       "AAAA;GAAG;......"      // encoded position data`);
console.log(`    "sourcesContent": ["full source..."]       // THE JACKPOT`);
console.log("  }");

// ═══════════════════════════════════════════════════════════
// PART 2: Easy way — sourcesContent
// ═══════════════════════════════════════════════════════════

console.log("\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  METHOD 1: sourcesContent (the easy way)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log();
console.log("  sourcesContent is an array of strings.");
console.log("  Each string = the COMPLETE original source file.");
console.log("  No decoding needed. Just read it.\n");
console.log("  Code:  JSON.parse(mapFile).sourcesContent[0]");
console.log();

if (sourceMap.sourcesContent) {
  const preview = sourceMap.sourcesContent[0].split("\n").slice(0, 5);
  console.log("  Result (first 5 lines):");
  preview.forEach(line => console.log(`  │ ${line}`));
  console.log("  │ ...");
  console.log();
  console.log("  ✓ This is what happened in the Claude Code leak.");
  console.log("    The full TypeScript was sitting right here as plain text.");
} else {
  console.log("  (not present in this map — would need method 2)");
}

// ═══════════════════════════════════════════════════════════
// PART 3: Hard way — decoding the mappings field (Base64 VLQ)
// ═══════════════════════════════════════════════════════════

console.log("\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  METHOD 2: mappings field (the hard way — Base64 VLQ)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log();
console.log("  Even without sourcesContent, the 'mappings' field maps");
console.log("  every position in compiled JS → original source.\n");

const mappingsRaw = sourceMap.mappings;
console.log("  Raw mappings string (first 80 chars):");
console.log(`  "${mappingsRaw.substring(0, 80)}..."\n`);

console.log("  How to read it:");
console.log("  ┌─────────────────────────────────────────────────────┐");
console.log("  │  ;  = line separator (each ; = next line in output) │");
console.log("  │  ,  = segment separator (multiple mappings per line)│");
console.log("  │  letters = Base64 VLQ encoded numbers               │");
console.log("  └─────────────────────────────────────────────────────┘\n");

// ── Base64 VLQ Decoder ──
const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeVLQ(str) {
  const values = [];
  let i = 0;
  while (i < str.length) {
    let value = 0;
    let shift = 0;
    let digit;
    do {
      digit = BASE64.indexOf(str[i++]);
      value += (digit & 0x1F) << shift;  // lower 5 bits are data
      shift += 5;
    } while (digit & 0x20);               // bit 6 = continuation flag
    // bit 1 of result = sign
    values.push(value & 1 ? -(value >> 1) : value >> 1);
  }
  return values;
}

console.log("  ┌── BASE64 VLQ ENCODING ──────────────────────────────┐");
console.log("  │                                                     │");
console.log("  │  Base64 alphabet:                                   │");
console.log("  │  A=0  B=1  C=2  D=3 ... Z=25                       │");
console.log("  │  a=26 b=27 c=28 ... z=51                           │");
console.log("  │  0=52 1=53 ... 9=61  +=62  /=63                    │");
console.log("  │                                                     │");
console.log("  │  Each char → 6 bits:                                │");
console.log("  │    bit 6 (0x20): continuation flag (more chars?)    │");
console.log("  │    bits 1-5:     data payload                       │");
console.log("  │    bit 1 (first char only): sign (0=pos, 1=neg)    │");
console.log("  │                                                     │");
console.log("  │  Example: 'A' = 000000                              │");
console.log("  │    continuation=0, data=00000 → value 0             │");
console.log("  │                                                     │");
console.log("  │  Example: 'C' = 000010                              │");
console.log("  │    continuation=0, data=00001, sign=0 → value +1    │");
console.log("  │                                                     │");
console.log("  │  Example: 'D' = 000011                              │");
console.log("  │    continuation=0, data=00001, sign=1 → value -1    │");
console.log("  │                                                     │");
console.log("  └─────────────────────────────────────────────────────┘");

// ── Decode and display some actual mappings ──

console.log("\n  ┌── EACH DECODED SEGMENT = 4 or 5 NUMBERS ───────────┐");
console.log("  │                                                     │");
console.log("  │  [0] generated column    (in compiled .js)          │");
console.log("  │  [1] source file index   (which original file)      │");
console.log("  │  [2] original line       (in original .ts)          │");
console.log("  │  [3] original column     (in original .ts)          │");
console.log("  │  [4] names index         (optional — variable name) │");
console.log("  │                                                     │");
console.log("  │  All values are RELATIVE (delta from previous)      │");
console.log("  └─────────────────────────────────────────────────────┘");

console.log("\n  Decoding first 10 lines of the mappings:\n");

const lines = mappingsRaw.split(";");
const compiledLines = compiledJS.split("\n");

// Track cumulative state (values are relative/delta-encoded)
let cumGenCol = 0, cumSrcFile = 0, cumSrcLine = 0, cumSrcCol = 0;

const maxLines = Math.min(lines.length, 12);
for (let lineIdx = 0; lineIdx < maxLines; lineIdx++) {
  const line = lines[lineIdx];
  if (!line) {
    const jsPreview = (compiledLines[lineIdx] || "").substring(0, 50);
    console.log(`  Line ${String(lineIdx + 1).padStart(2)}:  (empty — no mapping)`);
    console.log(`           JS: "${jsPreview}${jsPreview.length >= 50 ? '...' : ''}"`);
    console.log();
    continue;
  }

  cumGenCol = 0; // generated column resets each line
  const segments = line.split(",");
  const firstSeg = segments[0];
  const decoded = decodeVLQ(firstSeg);

  // Apply deltas
  cumGenCol += decoded[0] || 0;
  if (decoded.length > 1) cumSrcFile += decoded[1];
  if (decoded.length > 2) cumSrcLine += decoded[2];
  if (decoded.length > 3) cumSrcCol += decoded[3];

  const jsPreview = (compiledLines[lineIdx] || "").substring(0, 50);

  console.log(`  Line ${String(lineIdx + 1).padStart(2)}:  raw="${firstSeg}"  decoded=[${decoded.join(", ")}]`);
  console.log(`           → compiled col ${cumGenCol} maps to original line ${cumSrcLine + 1}, col ${cumSrcCol}`);
  console.log(`           JS: "${jsPreview}${jsPreview.length >= 50 ? '...' : ''}"`);

  if (sourceMap.sourcesContent) {
    const origLines = sourceMap.sourcesContent[cumSrcFile].split("\n");
    const origLine = (origLines[cumSrcLine] || "").substring(0, 50);
    console.log(`           TS: "${origLine}${origLine.length >= 50 ? '...' : ''}"`);
  }
  console.log();
}

// ═══════════════════════════════════════════════════════════
// PART 4: Summary
// ═══════════════════════════════════════════════════════════

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SUMMARY");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log();
console.log("  Two levels of exposure:\n");
console.log("  1. sourcesContent → full original code, plain text");
console.log("     Effort: zero. Just JSON.parse and read.\n");
console.log("  2. mappings → line-by-line position mapping");
console.log("     Effort: decode Base64 VLQ, then you know exactly");
console.log("     which compiled line came from which original line.");
console.log("     Combined with variable names in 'names' array,");
console.log("     you can reconstruct significant structure.\n");
console.log("  The Claude Code leak had BOTH — game over.");
