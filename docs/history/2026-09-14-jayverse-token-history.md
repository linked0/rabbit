# 2026-09-14 — jayverse-token

Source: [`docs/features/jayverse-token-bridge.md`](../features/jayverse-token-bridge.md) (Phase 1
cell in the [features README phase overview](../features/README.md#phase-overview-at-a-glance)).
Repo: `linked0/jayverse-token`, in-repo note `docs/history/2026-09-14.md`.

### Sepolia deployment of JYVE + MockUSDC + Exchange (Codex)

- **Cause:** jay asked Codex to deploy the Phase 1 contracts to Sepolia.
- **Reasoning:** used the existing JayVerse testnet operator; verified bytecode, wiring, reserves,
  price, owner and receipts against live Sepolia instead of trusting the chain id.
- **Change:** `addresses.sepolia.json` (JYVE `0x93FB…B3C4`, MockUSDC `0x9731…30e5`, Exchange
  `0x4E69…72C9`, block 11699291); app defaults to Sepolia, faucet button, balances, explorer links;
  standalone Dockerfile; Cloud Run service `jayverse-exchange` + domain mapping `exchange.jaylabs.xyz`.
- **Result:** pool seeded at 1,000,000 JYVE / 250,000 MockUSDC (0.25). Cloud Run URL serves the
  Sepolia page; the custom-domain certificate was pending at 10:00 KST and provisioned by 10:10 KST —
  exchange.jaylabs.xyz returns 200.

### Fold the Codex worktree back into one working copy (Claude)

- **Cause:** jay saw "two repos" for jayverse-token and asked to merge them and push to `main`.
- **Reasoning:** `jayverse-token-codex-sepolia` was a git *worktree* of the same repo on branch
  `Codex/sepolia-wallet-online`, not a clone — so only working-tree changes needed combining. The one
  overlap was `app/app/page.tsx` (Codex rewrite vs. the simulation link); kept Codex's Sepolia page
  and re-added the link.
- **Change:** on `main`: ff the port-3070 commit (`5c3f9a1`), commit the Codex Sepolia work
  (`9037cdb`), commit the supply-integrity simulation page + `contracts/.env.example` (`51ab792`),
  push; removed the worktree directory and the local Codex branch; stopped its leftover dev server.
- **Result:** one checkout at `~/work/jayverse-token` on `main`, typecheck clean; the sim link now
  appears on the Sepolia exchange page.
