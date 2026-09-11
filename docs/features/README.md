# Jayverse — feature-design hub

Entry point for the Jayverse feature designs. The umbrella plan (services, repo/agent map, build
order) lives in [`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md); **this file is the
design hub** — it answers the cross-cutting architecture question below and indexes the per-service
design docs.

**See also:** [rails shortlist](jayverse-rails-shortlist.md) — a cross-cutting menu of what each Jayverse product can build on, by need (oracles, cross-chain, AA, execution, payments…).

## Contents

- [Per-service design docs](#per-service-design-docs)
- [Phase overview](#phase-overview-at-a-glance)
- [Open Questions](#open-questions)
- [Running each service](#running-each-service-on-the-terminal)
- [Chainlink — infra Jayverse uses, not builds](#chainlink--infra-jayverse-uses-not-builds)
- [History](#history)

---

## Per-service design docs

Each service jay commented on gets a `jayverse-<service>.md` design doc: user scenario, what the web
app shows, the flow/user journey, a basic imaginable feature, and how to implement it — grounded in
the existing services so they cooperate rather than sit alone.

| # | Service | Design doc | Focus (from jay's comment) | Status |
|---|---------|-----------|----------------------------|--------|
| 1 | Rabbit — Agentic AA | [jayverse-rabbit.md](jayverse-rabbit.md) | ERC-4337 AA — user scenario, web app, flow. **Start here** | drafting |
| 2 | Verex — onboarding + MM | [jayverse-verex.md](jayverse-verex.md) | Stripe onboarding + Market Maker — scenario, web app, flow. **Start** | drafting |
| 3 | DeFi — EtherFi | [jayverse-defi.md](jayverse-defi.md) | Basic EtherFi **algorithms built from scratch** to study DeFi (no real-EtherFi integration) | drafting |
| 4 | Persona market | [jayverse-personas.md](jayverse-personas.md) | NFT persona market — scenario, web app, flow | drafting |
| 5 | Unity — 3D browser game | [jayverse-game.md](jayverse-game.md) | Wander a 3D street, find verex markets on boards, trade. **Start** | drafting |
| 6 | Wallet & simulate-before-sign | [jayverse-wallet.md](jayverse-wallet.md) | Embedded wallet + tx simulation — scenario, web app, flow | drafting |
| 7 | Token + Exchange + Bridge | [jayverse-token-bridge.md](jayverse-token-bridge.md) | **JYVE** ecosystem coin + mini-AMM price + Anvil ⇄ Sepolia bridge (one `jayverse-token` repo) | drafting |
| 8 | OFA — intent + solver auction | [jayverse-ofa.md](jayverse-ofa.md) | ATLAS's core mechanism as a from-scratch study — intent + solver auction, surplus to the user. **Build the mechanism, not the framework** | drafting |
| 9 | Math & Investment (Number) | [jayverse-number.md](jayverse-number.md) | Standalone `number.jaylabs.xyz` — investment information + math / economy / algorithm research. **Admin-only** (login-gated), split out of Rabbit's Portfolio into its own `jayverse-number` repo | drafting |
| 10 | Dark Horse — candidate tracks | [jayverse-darkhorse.md](jayverse-darkhorse.md) | **Not committed** — candidates that *could* become services but aren't yet: (a) own L1/L2, (b) security-hole research, (c) **Base App** (moved from #8) | candidates |

*(#1–9 are the committed services; **#10 Dark Horse is candidates, not committed** — including Base App, moved from #8. Detail lives in [jayverse-darkhorse.md](jayverse-darkhorse.md).)*

### Completed — built, past design

Once a service moves from design into a running build it leaves the drafting list above and
lands here, so "what's still a draft" vs "what actually runs" stays legible at a glance.

| Service | Design doc | Where it runs | Status |
|---|---|---|---|
| Authority Auditor | [jayverse-auditor.md](jayverse-auditor.md) | `jayverse-auditor` repo (`pnpm dev` :3080) · ported copy live in Rabbit at `/live/auditor` | ✅ **built** — Phase 1 + Phase 2 merged to `main` |

Every doc is a **design draft for review**, not built work — the implementation status stays in the
umbrella plan's Remaining sections and in each service repo.

## Phase overview (at a glance)

Each service's own `jayverse-*.md` carries its full **Phases (build order)** table; this is the
cross-service snapshot. **Three phase columns** — where a service has more than three phases, the
extras are **crammed into the last column** (Wallet's P3 + P4, etc.). ✅ = that phase is built.

**It also doubles as a running log.** When something gets implemented that wasn't in the plan, add it to that project's **currently-ongoing phase** cell and mark it ✅ — e.g., a new Wallet capability lands under Wallet's **Phase 2**. That way the overview records what actually happened, not only the original plan (jay, 2026-09-11).

| # | Service | Phase 1 | Phase 2 | Phase 3 (+ later) |
|---|---------|---------|---------|-------------------|
| 1 | Rabbit — Agentic AA | Gasless one-click bet | Local ↔ Sepolia bundler switch | Identity & UX breadth (shared account, ERC-20 gas, recovery → Wallet) |
| 2 | Verex | First-bet loop (Stripe + LMSR) | Operator / admin (kill switch) | Production leg (KYC/AML, custody, x402, reconcile) |
| 3 | DeFi — EtherFi study | Liquid-staking core | Restaking layer | Real EtherFi (read) |
| 4 | Personas | Mint + token-gated chat | Day rentals (ERC-4907) | Revenue + market (x402, IPFS, creator flow) |
| 5 | Game — 3D street | Replay | Live (synchronous) | Polish + optional player-trading |
| 6 | Wallet | simulate-before-sign ✅ | Session keys & templates | 4337 breadth · **P4** own dev wallet (31337 fork) |
| 7 | Token + Exchange + Bridge | Token + exchange (JYVE/USDC) | Intra bridge (lock-and-mint) | Real cross-chain — CCIP (arbitrary messages) + **Circle CCTP** (native USDC, burn-and-mint) + **xERC20 / ERC-7281** (JYVE as a sovereign bridged token, per-bridge rate limits) |
| 8 | OFA | `IntentAuction` + `MockSolver`s | `AmmSolver` + two invariants | Web harness · backrun / LVR stretch |
| 9 | Math & Investment (Number) | Admin auth gate | Portfolio migration | Deploy + math / algo research |
| ✅ | Authority Auditor | Dogfood matrix ✅ | Rules engine ✅ | On-chain + API (viem verified cells, tier-3 provider API) |
| 10 | Dark Horse | *candidates, not phased:* (a) own L1/L2 · (b) security research · (c) Base App | — | — |

## Open Questions

### Should the web app and the API be separated between Rabbit and Verex?

**jay's concern:** if every app runs inside the Rabbit portal on rabbit cloud, that one instance
carries the load of the whole ecosystem.

**Short answer: yes — separate the *APIs* into their own Cloud Run services; keep Rabbit a thin
portal. This is already what the umbrella plan's cloud split implies; this doc makes it explicit.**

#### The rule: one portal, many backends

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

#### Where the web (frontend) lives — the placement decision (jay, 2026-09-07)

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
> [jayverse-rabbit.md §7](jayverse-rabbit.md). Treat other such infra the same way: rented/hosted, behind
> an environment selector, outside the 4:4 count.

#### Concrete guidance for the burden worry

1. Rabbit portal = **one small Cloud Run service** (`max-instances` low; it only routes + light UI).
2. Each service API = **its own Cloud Run service**, its own repo, its own `deploy.sh`, its own DB.
3. Shared chain config/addresses via the **`jayverse-rails`** package so no service hardcodes another.
4. Cross-service calls go **API→API over HTTPS**, never in-process — that's what keeps one service's
   load off another's instance (exactly how rabbit's live console already calls the verex API).

**Net:** the portal never carries another service's compute, so "all apps in rabbit cloud" is not a
single-instance burden — it's several small autoscaling services that happen to share a GCP project.


## Running each service on the terminal

Each service is its own repo (sibling folders under `~/work`), its own `pnpm`/Foundry project. The
six study webs have their port **baked into their `dev` script** by the rule `port = 3000 + (service
#) × 10`, so plain `pnpm dev` opens the right one and they never collide. Rabbit portal (**:3100**)
and Verex web (**:3000**) keep their own defaults. Services with contracts need a local **anvil**
started first.

| # | Service | Repo | Terminal steps | Opens |
|---|---------|------|----------------|-------|
| — | **Rabbit** (portal) | `rabbit` | `pnpm install` → `pnpm dev` | :3100 |
| 1 | **Agentic AA** | in `rabbit` | see Rabbit — pages `/live/aa`, `/live/agent/console` | :3100 |
| 2 | **Verex** — markets + onboarding/MM | `verex` | `pnpm install`; **t1** `anvil`; **t2** `./scripts/reset.sh` (deploy CTF backbone + seed 10 markets); **t3** `pnpm --filter @verex/api dev`; **t4** `pnpm --filter @verex/web dev`. Re-run `./scripts/reset.sh` after any anvil restart. | web :3000 · api :4000 |
| 3 | **DeFi** — EtherFi study | `jayverse-defi` | **t1** `anvil`; `forge test`; `npm run deploy` (writes `addresses.json`); `npm run study` (CLI walk-through); `npm run dev` (Vite) | :3030 |
| 4 | **Personas** — NFT market | `jayverse-personas` | in `contracts/`: `forge test`; **t1** `anvil`; **t2** `forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast` (mints 2); then `cd ../app && pnpm install && pnpm dev` | :3040 |
| 5 | **Game** — 3D street | `jayverse-game` | `pnpm install` → `pnpm dev` (open `/street`) | :3050 |
| 6 | **Wallet** — simulate-before-sign | `jayverse-wallet` | **t1** `anvil`; **t2** `pnpm install` → `pnpm dev` | :3060 |
| 7 | **Token + Exchange** | `jayverse-token` | in `contracts/`: `forge test`; **t1** `anvil`; **t2** `forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast` (seed pool); then `cd ../app && pnpm install && pnpm dev` | :3070 |
| 8 | **OFA** — intent + solver auction | `jayverse-ofa` | in `contracts/`: `forge test`; **t1** `anvil`; optional tiny harness | :3080† |
| 9 | **Math & Investment (Number)** | `jayverse-number` | `pnpm install` → `pnpm dev` (admin login) | :3090 |
| 10 | **Dark Horse** — candidate tracks | — | candidates only — nothing to run yet | — |
| ✅ | **Authority Auditor** (built) | `jayverse-auditor` | `pnpm install` → `pnpm dev` — also live in Rabbit at `/live/auditor` | :3080 |

> **Ports:** the six study webs bake their port into `dev` (`3000 + # × 10`) — DeFi :3030, Personas
> :3040, Game :3050, Wallet :3060, Token :3070, Auditor :3080, Number :3090 — so `pnpm dev` alone is right and they
> run side by side. Unchanged: Rabbit portal **:3100**, Verex web **:3000** / API **:4000**, anvil
> **:8545**.
>
> **†OFA (#8)** nominally maps to `:3080` too, the slot the now-**completed** Auditor still bakes in.
> OFA is contracts-first (Foundry + anvil), so a web harness is optional; if you add one, run it or
> the Auditor one at a time, or reassign OFA's port.

## Chainlink — infra Jayverse uses, not builds

Chainlink's oracle stack (Data Feeds, CCIP, Proof of Reserve, VRF, Automation) is
settlement-rail infrastructure Jayverse **consumes, not reimplements**. This is the
dependency map — where each product plugs in, and the one place an oracle deliberately
cannot help. Not a build; a map. (Product names verified against chain.link, 2026-09-09.)

| Product | Chainlink primitive | Used for | If the feed is wrong / late |
|---|---|---|---|
| Verex (markets) | Data Feeds | resolve real-world-event markets to an objective number | wrong resolution pays the wrong side |
| DeFi study | Data Feeds | price inputs for the from-scratch staking-rate math | accounting drifts from reality |
| Token bridge | CCIP | cross-chain transport (Phase 3) | a stuck / forged message breaks the 1:1 invariant |
| JYVE price | **none — deliberately** | a self-made token has no external price | n/a — priced by our mini-AMM |
| Any peg / reserve | Proof of Reserve | attest backing so redeem can refuse unbacked units | see the Liquid lesson below |
| Games / draws | VRF | verifiable randomness for any draw surface | a biased draw is a rigged game |
| Schedulers | Automation | keeper-triggered ticks without a server timer | a missed tick delays settlement |

**The one deliberate non-use — pricing a self-made token.** Verex prices YES/NO with LMSR,
and JYVE is priced by a constant-product mini-AMM (`price = reserve ratio`), not a feed —
because a token that trades only in our own market has *no external truth an oracle could
report*. Oracles carry external facts onto the chain; where there is no external fact, an
oracle is the wrong tool. (Rationale: [jayverse-token-bridge.md](jayverse-token-bridge.md).)

**Proof of Reserve answers the Liquid class.** The `liquid-issuance-not-authorization` PoC
showed a mint bug producing valid-but-unbacked units that a correct peg-out faithfully
honored — authorization checked the *actor*, nothing checked the *object's backing*. Proof
of Reserve is that missing check: an external attestation of reserves a redeem path reads to
refuse units the reserve cannot cover. It does not fix the mint bug; it stops the drain from
being honored. A mint-invariant (conservation) test **plus** a PoR read (backing) covers
both halves the incident exposed.

**The rule:** use the rail, don't rebuild it — and know the one place it doesn't reach. Every
feed is also a dependency with a failure mode, so each cooperation above carries its "if the
feed is wrong" line **in code** (staleness check / fallback), not just in this table.

---

## History

The original **Rabbit feature-design index** (this file's pre-Jayverse content) now lives in
[README-history.md](README-history.md) — this file used to hold it; it was split out 2026-09-09.
The Jayverse hub was merged in from the former `README-Jayverse.md`, which has since been removed —
its links now point here.

**Naming (jay asked, 2026-09-07).** Chosen `README-Jayverse.md` over `Jayverse-README.md`, for one
reason: keeping the `README` prefix makes it sort right next to `README.md` in every file listing, so
the two "start here" docs sit together. Per-service design docs are named `jayverse-<service>.md` so
they group under one prefix and are obvious as a set.
