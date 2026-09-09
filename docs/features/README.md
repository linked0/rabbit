# Jayverse — feature-design hub

Entry point for the Jayverse feature designs. The umbrella plan (services, repo/agent map, build
order) lives in [`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md); **this file is the
design hub** — it answers the cross-cutting architecture question below and indexes the per-service
design docs.

> **History.** The Rabbit feature-design index that this file used to hold lives in
> [README-history.md](README-history.md) (split out 2026-09-09). The Jayverse hub was merged in from
> the former `README-Jayverse.md`, which has since been removed — its links now point here.

> **Naming (jay asked, 2026-09-07).** Chosen **`README-Jayverse.md`** over `Jayverse-README.md`,
> for one reason: keeping the `README` prefix makes it sort right next to `README.md` in every file
> listing, so the two "start here" docs sit together. Per-service design docs are named
> `jayverse-<service>.md` so they group under one prefix and are obvious as a set.

---

## Q: should the web app and the API be separated between Rabbit and Verex?

**jay's concern:** if every app runs inside the Rabbit portal on rabbit cloud, that one instance
carries the load of the whole ecosystem.

**Short answer: yes — separate the *APIs* into their own Cloud Run services; keep Rabbit a thin
portal. This is already what the umbrella plan's cloud split implies; this doc makes it explicit.**

### The rule: one portal, many backends

- **Rabbit stays a thin portal.** The plan's principle already says *"Rabbit imports, it doesn't
  contain"* — it shows a service by importing that service's UI (npm package / git submodule) or by
  linking/proxying to the running service. The portal's own Cloud Run instance therefore serves
  **navigation, auth, and light read UI**, not the heavy per-service work.
- **Every service's API is its own Cloud Run service.** `jayverse-defi-api`, `jayverse-personas-api`,
  the verex API, etc. each deploy independently, scale independently (Cloud Run autoscales per
  service), and a spike in one **cannot** starve the portal or another service. This is the whole
  reason the burden concern goes away: the portal instance never runs another service's compute.
- **Money-moving vs. read-only decides the cloud, not the separation.** The plan's 4:4 split already
  routes market-coupled services (Verex, DeFi, Unity worker, Bridge) to **verex cloud** and
  portal/AI/read services (Rabbit, Personas, Wallet, Auditor) to **rabbit cloud**. Separation is
  orthogonal: *within either cloud*, each API is still its own service.

### Where the web (frontend) lives — the placement decision (jay, 2026-09-07)

The rule jay settled on: **web consolidates, APIs split, Verex is the one exception.**

- **All web apps live in rabbit cloud** — one portal, one domain (`jaylabs.xyz/<service>`), one
  login. A frontend is light (SSR/static + client fetch), so co-locating them costs little and buys a
  single deploy surface for the UI.
- **APIs keep the 4:4 split** by money-movement, regardless of where their web is served.
- **Verex is the exception:** its web stays in **verex cloud**, beside its own API — it's heavy,
  independently branded, and already live at `verex.jaylabs.xyz`.

| Cloud | Region | Web it serves | APIs it serves |
|---|---|---|---|
| **Rabbit cloud** | asia-northeast1 | **All web apps except Verex** (Rabbit portal, DeFi, Unity, Bridge, Personas, Wallet, Auditor) | Rabbit (fused into the portal — see note), Personas, Wallet, Auditor |
| **Verex cloud** | asia-northeast3 | **Verex web only** | Verex, DeFi, Unity, Bridge (the 4 money-moving APIs) |

**Why this holds up:** a web app in rabbit cloud calling an API in verex cloud is just HTTPS —
API→API or browser→API, exactly how rabbit's live console already calls the verex prod API today.
Most web→API traffic is client-side fetch from the browser, which hits the API directly no matter
which cloud served the page, so cross-cloud placement adds no hot-path latency. The **API is always
its own Cloud Run service** either way, so the burden answer is unchanged: each API autoscales alone.

> **Rabbit has no separate API server today (jay asked, 2026-09-07).** Rabbit is one Next.js Cloud
> Run service; its "API" is Next.js **route handlers** under `app/api/*` baked into that same
> service. So "Rabbit API" in the table is **fused into the portal** for now — web + route handlers
> in one instance, which is exactly the thin-portal shape we want. Split it into a standalone
> `rabbit-api` service only if that backend later grows heavy enough to autoscale on its own. The
> other three rabbit-cloud APIs (Personas, Wallet, Auditor) are their own services from the start.

> **Hosted infra is not in the split (jay asked, 2026-09-07).** The ERC-4337 **bundler** and
> **paymaster** are *not* Jayverse services — the bundler is a hosted relay (thirdweb for v1,
> Pimlico as the portable alternative) and never something we implement. Locally, where an anvil
> fork can't reach a hosted bundler, we **self-relay** (`EntryPoint.handleOps` from a funded
> account) instead of running one; the local-vs-Sepolia switch lives in
> [jayverse-aa.md §7](jayverse-aa.md). Treat other such infra the same way: rented/hosted, behind
> an environment selector, outside the 4:4 count.

### Concrete guidance for the burden worry

1. Rabbit portal = **one small Cloud Run service** (`max-instances` low; it only routes + light UI).
2. Each service API = **its own Cloud Run service**, its own repo, its own `deploy.sh`, its own DB.
3. Shared chain config/addresses via the **`jayverse-rails`** package so no service hardcodes another.
4. Cross-service calls go **API→API over HTTPS**, never in-process — that's what keeps one service's
   load off another's instance (exactly how rabbit's live console already calls the verex API).

**Net:** the portal never carries another service's compute, so "all apps in rabbit cloud" is not a
single-instance burden — it's several small autoscaling services that happen to share a GCP project.

---

## Per-service design docs

Each service jay commented on gets a `jayverse-<service>.md` design doc: user scenario, what the web
app shows, the flow/user journey, a basic imaginable feature, and how to implement it — grounded in
the existing services so they cooperate rather than sit alone.

| # | Service | Design doc | Focus (from jay's comment) | Status |
|---|---------|-----------|----------------------------|--------|
| 1 | Rabbit — Agentic AA | [jayverse-aa.md](jayverse-aa.md) | ERC-4337 AA — user scenario, web app, flow. **Start here** | drafting |
| 2 | Verex — onboarding + MM | [jayverse-onboarding-mm.md](jayverse-onboarding-mm.md) | Stripe onboarding + Market Maker — scenario, web app, flow. **Start** | drafting |
| 3 | DeFi — EtherFi | [jayverse-defi.md](jayverse-defi.md) | Basic EtherFi **algorithms built from scratch** to study DeFi (no real-EtherFi integration) | drafting |
| 4 | Persona market | [jayverse-personas.md](jayverse-personas.md) | NFT persona market — scenario, web app, flow | drafting |
| 5 | Unity — 3D browser game | [jayverse-game.md](jayverse-game.md) | Wander a 3D street, find verex markets on boards, trade. **Start** | drafting |
| 6 | Wallet & simulate-before-sign | [jayverse-wallet.md](jayverse-wallet.md) | Embedded wallet + tx simulation — scenario, web app, flow | drafting |
| 7 | Token + Exchange + Bridge | [jayverse-token-bridge.md](jayverse-token-bridge.md) | **JYVE** ecosystem coin + mini-AMM price + Anvil ⇄ Sepolia bridge (one `jayverse-token` repo) | drafting |
| 8 | Authority Auditor | [jayverse-auditor.md](jayverse-auditor.md) | Authority-matrix report — scenario, web app, flow | drafting |
| 9 | Base App — Mini App | [jayverse-base-app.md](jayverse-base-app.md) | What a Base App Mini App **buys** (funded passkey account, inline market open) vs **rents** (discovery, review, jurisdiction) — strategy draft, plan later | drafting |

*(#1–8 are the committed services; #9 Base App is a strategy draft jay will plan later. Tracks that are **not** committed services live in the Dark Horse section below.)*

## Running each service on the terminal

Each service is its own repo (sibling folders under `~/work`), its own `pnpm`/Foundry project. Web
ports follow one rule — **`port = 3000 + (service #) × 10`** — so nothing collides and you can run
several side by side. The Rabbit portal is the exception at **:3100**. Services with contracts need a
local **anvil** started first.

| # | Service | Repo | Terminal steps | Opens |
|---|---------|------|----------------|-------|
| — | **Rabbit** (portal) | `rabbit` | `pnpm install` → `pnpm dev` | :3100 |
| 1 | **Agentic AA** | in `rabbit` | see Rabbit — pages `/live/aa`, `/live/agent/console` | :3100 |
| 2 | **Verex** — markets + onboarding/MM | `verex` | `pnpm install`; **t1** `anvil`; **t2** `./scripts/reset.sh` (deploy CTF backbone + seed 10 markets); **t3** `pnpm --filter @verex/api dev`; **t4** `pnpm --filter @verex/web dev -- -p 3020`. Re-run `./scripts/reset.sh` after any anvil restart. | web :3020 · api :4000 |
| 3 | **DeFi** — EtherFi study | `jayverse-defi` | **t1** `anvil`; `forge test`; `npm run deploy` (writes `addresses.json`); `npm run study` (CLI walk-through); `npm run dev -- --port 3030` (Vite) | :3030 |
| 4 | **Personas** — NFT market | `jayverse-personas` | in `contracts/`: `forge test`; **t1** `anvil`; **t2** `forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast` (mints 2); then `cd ../app && pnpm install && pnpm dev -- -p 3040` | :3040 |
| 5 | **Game** — 3D street | `jayverse-game` | `pnpm install` → `pnpm dev -- -p 3050` (open `/street`) | :3050 |
| 6 | **Wallet** — simulate-before-sign | `jayverse-wallet` | **t1** `anvil`; **t2** `pnpm install` → `pnpm dev -- -p 3060` | :3060 |
| 7 | **Token + Exchange** | `jayverse-token` | in `contracts/`: `forge test`; **t1** `anvil`; **t2** `forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast` (seed pool); then `cd ../app && pnpm install && pnpm dev -- -p 3070` | :3070 |
| 8 | **Authority Auditor** | `jayverse-auditor` | `pnpm install` → `pnpm dev -- -p 3080` | :3080 |
| 9 | **Base App — Mini App** | — | strategy draft only — nothing to run yet | — |

> **Ports:** each web is pinned with `-p <port>` (Vite: `--port`) to `3000 + # × 10` — Verex :3020,
> DeFi :3030, Personas :3040, Game :3050, Wallet :3060, Token :3070, Auditor :3080 — so they run
> side by side without collisions. Fixed extras: Rabbit portal **:3100**, Verex API **:4000**, anvil
> **:8545**. (Bake the port into each repo's `dev` script if you don't want to pass the flag each time.)

## Dark Horse — candidate tracks (#10)

Not committed services like #1–9 — **candidates** to pick up after the core is built. Full detail
(steps, risks, PoC links) is in the umbrella plan
[`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md) §10; summarized here.

### (a) L1/L2 — our own chain (start at last)
The own-chain ambition, explicitly **start-at-last**, with **supersim** as the local on-ramp. No
repo yet — a `docs/` research folder first, infra-as-code only if we truly commit. The single most
expensive line in the architecture to operate, so: learn locally now, production maybe never. PoC
links: `choosing-a-chain-is-a-lease`, `l2-finality-three-clocks`, `l1-data-pricing-dimensions`.
(Plan §9 has the full writeup.)

### (b) Security-hole research (보안 취약점 연구)
The offensive-security muscle of Jayverse — study the exploit classes that actually drain protocols
(reentrancy, price-oracle manipulation, access-control gaps, signature/permit replay, bridge
message-validation bugs, proxy/upgradeability pitfalls, and the one we ourselves ship: 7702/7715
session-key scope abuse) and run them against **our own contracts on a local fork before anyone else
does**. Dark horse because it compounds across every service — verex caps, the bridge's 1:1 vault
invariant, the wallet's session keys, the agent's mandate enforcers are all attack surfaces — and it
pairs with data-science (exploit detection is on-chain analysis). Skills: Foundry fuzz/invariant
testing, Slither/Aderyn, Echidna, fork-based exploit reproduction, later Halmos/Certora.
**Dual-use guardrail:** exploits live on local forks only; external findings go through responsible
disclosure, always. (Plan ETC section has the full writeup.)

Every doc is a **design draft for review**, not built work — the implementation status stays in the
umbrella plan's Remaining sections and in each service repo.

---
# 💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎

## History

The original **Rabbit feature-design index** (this file's pre-Jayverse content) now lives in
[README-history.md](README-history.md).
