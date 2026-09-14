#!/usr/bin/env node
// Write .delegation-anvil.json from the Jayverse devnet's seed output, instead
// of deploying a second delegation framework with deploy-delegation.mjs.
//
// Why this exists: lib/delegation.ts falls back to .delegation-anvil.json for
// any chain the kit does not know canonically, and refuses the file if it was
// written for a different chain. The devnet already has a framework — the seed
// deployed it — so rabbit should adopt that one rather than deploy its own and
// leave two on the same chain.
//
// It must be the seed's NESTED environment, not the flat Registry: the kit
// reads `implementations.HybridDeleGatorImpl` directly, and a flat
// name -> address map cannot express that shape.
//
//   node scripts/sync-devnet-delegation.mjs
//   DEVNET_DEPLOYMENTS=/path/to/devnet.json node scripts/sync-devnet-delegation.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SOURCE =
  process.env.DEVNET_DEPLOYMENTS ??
  join(homedir(), "work", "jayverse-devnet", "deployments", "devnet.json");
const OUT = ".delegation-anvil.json";

let deployments;
try {
  deployments = JSON.parse(readFileSync(SOURCE, "utf8"));
} catch (err) {
  console.error(
    `\n  cannot read ${SOURCE}\n` +
      `  Set DEVNET_DEPLOYMENTS, or run the devnet seed first:\n` +
      `    cd ~/work/jayverse-devnet && node scripts/seed.ts\n`,
  );
  process.exit(1);
}

const { chainId, delegationEnvironment } = deployments;
if (!delegationEnvironment) {
  console.error(
    `\n  ${SOURCE} has no "delegationEnvironment".\n` +
      `  The seed records the kit's nested environment there; re-run it with --force.\n`,
  );
  process.exit(1);
}
if (!delegationEnvironment.implementations?.HybridDeleGatorImpl) {
  console.error(
    `\n  the saved environment has no implementations.HybridDeleGatorImpl — it looks flattened.\n` +
      `  The kit needs the nested object, not the Registry's name -> address map.\n`,
  );
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify({ chainId, environment: delegationEnvironment }, null, 2) + "\n");

console.log(`wrote ${OUT} for chain ${chainId}`);
console.log(`  DelegationManager  ${delegationEnvironment.DelegationManager}`);
console.log(`  SimpleFactory      ${delegationEnvironment.SimpleFactory}`);
console.log(`  implementations    ${Object.keys(delegationEnvironment.implementations).join(", ")}`);
console.log(`\n  point rabbit at the devnet with:`);
console.log(`    ANVIL_RPC_URL=https://devnet.jaylabs.xyz/rpc`);
