#!/usr/bin/env node
// Build the jayverse-game submodule as a static bundle and copy it into
// public/jayverse-game/, which Rabbit's /game page embeds in an <iframe>
// (see app/game/page.tsx). The submodule (vendor/jayverse-game) is the source
// of truth; the copied bundle is what ships — committed like the generated docs
// HTML, so the Docker build needs no second (React 19 / Next 16) toolchain.
//
// Run after updating the submodule pointer:  pnpm game:build
import { execSync } from "node:child_process";
import { existsSync, rmSync, cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sub = join(root, "vendor", "jayverse-game");
const out = join(sub, "out");
const dest = join(root, "public", "jayverse-game");

if (!existsSync(join(sub, "package.json"))) {
  console.error(
    "vendor/jayverse-game is empty. Run:\n  git submodule update --init vendor/jayverse-game",
  );
  process.exit(1);
}

const run = (cmd) =>
  execSync(cmd, {
    cwd: sub,
    stdio: "inherit",
    env: { ...process.env, EXPORT_STATIC: "1", NEXT_PUBLIC_BASE_PATH: "/jayverse-game" },
  });

console.log("→ installing game deps (isolated from Rabbit's node_modules)…");
run("pnpm install --frozen-lockfile");
console.log("→ static export (basePath=/jayverse-game)…");
run("pnpm export");

console.log(`→ copying ${out} → ${dest}`);
rmSync(dest, { recursive: true, force: true });
cpSync(out, dest, { recursive: true });
console.log("✓ game bundle ready at public/jayverse-game/");
