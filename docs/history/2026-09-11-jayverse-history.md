# 2026-09-11 — Jayverse (umbrella: status · setup · scenario)

> **Source docs:** [`../features/README.md`](../features/README.md) (the service table + "Running each
> service" section is the authority for setup steps) and the per-service `jayverse-*.md` design docs
> it indexes. This file is the cross-service **status / setup / test-scenario** snapshot jay asked for
> (2026-09-11) — a resumable overview; per-service detail stays in each design doc and the dated
> per-service history files.

---

### Jayverse services — status · setup · scenario (snapshot)

Ports follow `3000 + #×10`; the study webs bake their port into `pnpm dev`. Auditor already tested by
jay. OFA & Dark Horse have no code yet.

| # | Service | Status | Setup (from README) | Concrete test scenario |
|---|---------|--------|---------------------|------------------------|
| 1 | Rabbit — Agentic AA | live in portal (:3100) | `cd ~/work/rabbit && pnpm install && pnpm dev` → `/live/aa` | trigger an AA action on `/live/aa` → watch it in `/live/agent/console`; confirm it acts through the smart account, not a raw EOA |
| 2 | Verex — markets + onboarding/MM | full app, live `verex.jaylabs.xyz` (web :3000 / api :4000) | `pnpm install`; t1 `anvil`; t2 `./scripts/reset.sh`; t3 `pnpm --filter @verex/api dev`; t4 `pnpm --filter @verex/web dev` | open :3000 → bet YES/NO on a seeded market → resolve via reset backbone → payout goes to the correct side |
| 3 | DeFi — EtherFi study | built (:3030) | t1 `anvil`; `forge test`; `npm run deploy`; `npm run study`; `npm run dev` | `npm run study` walks the staking-rate math; then stake on :3030 → rate/accounting updates |
| 4 | Personas — NFT market | built (:3040) | in `contracts/`: `forge test`; t1 `anvil`; t2 `forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast` (mints 2); then `cd ../app && pnpm install && pnpm dev` | open :3040 → see 2 minted personas → list one / buy the other → ownership transfers |
| 5 | Game — 3D street | built (:3050) | `cd ~/work/jayverse-game && pnpm install && pnpm dev` → `/street` | walk the street → find a Verex market on a board → place a trade from inside the game |
| 6 | Wallet — simulate-before-sign | built, extension v0.2.0 (:3060) | t1 `anvil`; t2 `pnpm install && pnpm dev` | build a tx → see the **simulation preview** (balance/state) *before* signing → sign → result matches preview |
| 7 | Token + Exchange + Bridge | built (:3070) | in `contracts/`: `forge test`; t1 `anvil`; t2 Deploy (seed pool); then `cd ../app && pnpm install && pnpm dev` | swap on the JYVE mini-AMM (`price = reserve ratio` moves) → run Anvil⇄Sepolia bridge → 1:1 invariant holds |
| 8 | OFA — intent + solver auction | **design only, not scaffolded** (:3080†) | nothing to run yet; when built: `forge test`; `anvil`; optional harness | *target:* `submitIntent` (give X, want ≥Y) → 2–3 `MockSolver`s + `AmmSolver` bid → `settle` picks best effective-out, enforces `finalOut >= minOut` **and** `holding = issuance`, surplus to the **user**, loser reverts |
| 9 | Number (`number.jaylabs.xyz`) | built + **deployed live** (:3090); ⚠️ no login gate yet — public | `cd ~/work/jayverse-number && pnpm install && pnpm dev` → :3090 | open number/num.jaylabs.xyz → lands with no login = confirm still unprotected (gap to close); compare local :3090 to prod |
| 10 | Dark Horse — candidates | candidates only, no code | — | review [`../features/jayverse-darkhorse.md`](../features/jayverse-darkhorse.md); decide which track (own L1/L2 · security research · Base App) to promote |
| ✅ | Authority Auditor | built, Phase 1+2 on `main` (:3080) | `pnpm install`; `pnpm test` (33); `pnpm dev` | (already tested by jay) |

**Suggested test order (fastest signal first):** Verex → Number → Game → Token → Wallet → DeFi →
Personas → Rabbit AA. OFA & Dark Horse are read-only for now.

**Note on "what changed recently":** this session's Jayverse work was mostly **design docs** — the
LayerZero/ATLAS sections in `token-bridge / verex / rabbit / wallet / auditor`, the new
`ofa / darkhorse / number` docs, Number built & deployed, and today's OFA edits below. The code
scaffolds for defi/personas/game/wallet/token mostly predate this session.

---

### OFA design doc — added second invariant + a Jayverse-wide user scenario

Implements: [`../features/jayverse-ofa.md`](../features/jayverse-ofa.md) (service #8).

- **Cause:** jay asked to (a) add the `보유 = 발행` (holding = issuance) invariant to OFA on the same
  planned build, then (b) write a concrete user scenario tied into the Jayverse system, plus what we
  implement and how.
- **Reasoning:** OFA is a study of ATLAS's core (intent + solver auction, surplus to the user). A
  second conservation invariant makes the "nothing is minted/stranded" guarantee explicit; a
  cross-service scenario shows OFA as the *fair swap rail* the other services call, matching the
  sibling docs' "user scenario / what we build / implementation sketch" shape.
- **Change:** added the `holding = issuance` invariant paragraph under the existing
  `finalOut >= minOut` one; added `## User scenario — "Jun swaps into a bet without feeding a
  searcher"` (Jun converts JYVE→USDC via an intent to fund a Verex bet; Wallet builds/simulates the
  intent, `AmmSolver` over the jayverse-token pool competes with `MockSolver`s, `settle` sends surplus
  to Jun, Number logs the fill, Auditor guards "who captures the surplus"); and `## What we implement,
  and how` (IntentAuction, the `AmmSolver` cross-service adapter, two invariant-stops, optional web
  harness; Foundry-first build path, Wallet `simulate()` signing, `jayverse-rails` addresses,
  local/Sepolia switch).
- **Result:** doc is 7.9 KB, still a sketch (no code). "What to stop on violation" for
  `holding = issuance` remains deferred, as jay scoped. Nothing to run for OFA yet.
