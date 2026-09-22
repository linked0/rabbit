# Jayverse — feature-design hub

Entry point for the Jayverse feature designs. The umbrella plan (services, repo/agent map, build
order) lives in [`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md); **this file is the
design hub** — it answers the cross-cutting architecture question below and indexes the per-service
design docs.

**See also:** [rails shortlist](jayverse-rails-shortlist.md) — a cross-cutting menu of what each Jayverse product can build on, by need (oracles, cross-chain, AA, execution, payments…).

## Contents

- [Per-service design docs](#per-service-design-docs)
- [Phase overview](#phase-overview-at-a-glance)
- [Three end-to-end scenarios (+ imaginary services)](#three-end-to-end-scenarios--every-service-in-one-story-plus-the-service-each-story-asks-for)
- [Open Questions](#open-questions)
- [Running each service](#running-each-service-on-the-terminal)
- [Chainlink — infra Jayverse uses, not builds](#chainlink--infra-jayverse-uses-not-builds)
- [History](#history)

---

## Per-service design docs

Each service jay commented on gets a `jayverse-<service>.md` design doc: user scenario, what the web
app shows, the flow/user journey, a basic imaginable feature, and how to implement it — grounded in
the existing services so they cooperate rather than sit alone.

The last column is **where each service is deployed on GCP** (jay, 2026-09-14): *Rabbit cloud* = project
`doubletree-498007`, Cloud Run in `asia-northeast1`; *Verex cloud* = project `verex-499205`.

| # | Service | Design doc | Focus (from jay's comment) | Deployed on (GCP) | Est. GCP cost / month |
|---|---------|-----------|----------------------------|-------------------|----------------------|
| 1 | Rabbit — Agentic AA | [jayverse-rabbit.md](jayverse-rabbit.md) | ERC-4337 AA — user scenario, web app, flow. **Start here** | Rabbit cloud · Cloud Run `rabbit` · <https://www.jaylabs.xyz> | **~$12** — Cloud Run `rabbit` scales to zero; the cost is `rabbit-db` Cloud SQL |
| 2 | Verex — onboarding + MM | [jayverse-verex.md](jayverse-verex.md) | Stripe onboarding + Market Maker — scenario, web app, flow. **Start** | Verex cloud · Cloud Run `verex-web-prod` + `verex-api-prod` (asia-northeast3) · <https://verex.jaylabs.xyz> | **~$62** — `verex-api-prod` ~$50 (scale-to-zero disabled) + `verex-db-prod` ~$12; `verex-db` stopped adds ~$2 |
| 3 | Token + Exchange + Bridge + Personas | [jayverse-token-bridge.md](jayverse-token-bridge.md) · [jayverse-personas.md](jayverse-personas.md) | **JYVE** ecosystem coin + mini-AMM price + Anvil ⇄ Sepolia bridge **contracts + relayer** (the bridge *screen* is in Wallet #5) + the **persona NFT market** (moved in from #6, jay 2026-09-14) — one `jayverse-token` repo, one project | Rabbit cloud · Cloud Run `jayverse-exchange` · <https://exchange.jaylabs.xyz> (contracts on Sepolia) · personas at `/personas` (own subdomain optional) | **~$0** — Cloud Run scales to zero; contracts are on Sepolia |
| 4 | DeFi — EtherFi | [jayverse-defi.md](jayverse-defi.md) | Basic EtherFi **algorithms built from scratch** to study DeFi (no real-EtherFi integration) | Verex cloud · Firebase Hosting site `jayverse-defi` · <https://defi.jaylabs.xyz> (contracts on Sepolia) | **~$0** — Firebase Hosting, static |
| 5 | Wallet & simulate-before-sign | [jayverse-wallet.md](jayverse-wallet.md) | Embedded wallet + tx simulation — scenario, web app, flow. **Owns the bridge screen** (`/bridge`; jay, 2026-09-14) — the UI for #3's lock-and-mint | Rabbit cloud · Cloud Run `jayverse-wallet` · <https://wallet.jaylabs.xyz> (+ `/bridge`) | **~$0** — Cloud Run scales to zero |
| 6 | Devnet — own L1 / L2 | [jayverse-devnet.md](jayverse-devnet.md) | **Promoted from Dark Horse (a)** (jay, 2026-09-14): starts as a hosted **Anvil** forked from Sepolia (its own chainId `313370`; `31337` stays local) that every service targets **instead of Sepolia**, with **every Jayverse contract deployed on it by the seed** (nothing inherited from the fork); later `supersim` → an OP-Stack L2 settling on it. Scenario C's argument: a chain whose block time and sequencer schedule *are* the app's clock | Rabbit cloud · GCE VM `jayverse-devnet` (asia-northeast1) · <https://devnet.jaylabs.xyz> (RPC + explorer) — planned, not deployed | **$0 today** — not deployed; ~$20/mo once the `e2-small` VM is up (always-on, a VM cannot scale to zero) |
| 7 | Unity — 3D browser game | [jayverse-game.md](jayverse-game.md) · [jayverse-burrow.md](jayverse-burrow.md) | Wander a 3D street, find verex markets on boards, trade. **Start** — two surfaces since 2026-09-21: the Next.js street, plus **Burrow**, the Unity (WebGL) port (repo `linked0/rabbit-hole`, built and verified, **not deployed**) | Rabbit cloud · inside Cloud Run `rabbit` · <https://www.jaylabs.xyz/jayverse-game> · Burrow → <https://burrow.jaylabs.xyz> (planned) | **~$0** — static files inside the existing `rabbit` service; Burrow adds a domain mapping, not a service |
| 8 | OFA — intent + solver auction | [jayverse-ofa.md](jayverse-ofa.md) | ATLAS's core mechanism as a from-scratch study — intent + solver auction, surplus to the user. **Build the mechanism, not the framework** | — not deployed | **$0** — not deployed |
| 9 | Math & Investment (Number) | [jayverse-number.md](jayverse-number.md) | Standalone `number.jaylabs.xyz` — investment information + math / economy / algorithm research. **Admin-only** (login-gated), split out of Rabbit's Portfolio into its own `jayverse-number` repo | Rabbit cloud · Cloud Run `jayverse-number` · <https://number.jaylabs.xyz> (alias `num.`) | **~$0** — Cloud Run scales to zero |
| 10 | Dark Horse — candidate tracks | [jayverse-darkhorse.md](jayverse-darkhorse.md) | **Not committed** — candidates that *could* become services but aren't yet: (b) security-hole research, (c) **Base App** (moved from #8), (d) **Canton Network test usage** (jay, 2026-09-18: Daml templates for a licensed Number reading and a verex market that resolves on a named reference rate, local Splice LocalNet then Global Synchronizer DevNet, test networks only), (e) **Agentic engineering — boundary files before agent tasks** (jay, 2026-09-18, from Tech #61: boundary-file template, Rabbit mandate as boundary, CI evaluation job) — (a) own L1/L2 was promoted to #6 on 2026-09-14 | — candidates, not deployed | **$0** — candidates, not deployed |

*(#1–9 are the committed services; **#10 Dark Horse is candidates, not committed** — including Base App, moved from #8. Detail lives in [jayverse-darkhorse.md](jayverse-darkhorse.md).)*

*The cost column (added 2026-09-21) apportions the estate estimate in [cloud-ops.md §1](cloud-ops.md#1-cost-posture--pay-for-what-is-being-watched-park-the-rest) to the service that causes it. It is **derived from resource configuration, not from billing data** — the same caveat that file carries, and roughly $30/month of the real ~$120 bill is still unaccounted for. Read it as "which service is the expensive one", not as an invoice.*

### Ownership changes (jay, 2026-09-14)

- **Renumbered 2026-09-20 (jay):** 4 = Token + Exchange + Bridge + Personas, 5 = Wallet & simulate-before-sign, 6 = Devnet — own L1 / L2, 7 = Unity — 3D browser game (was 4 Devnet · 5 Unity · 6 Wallet · 7 Token). Then, the same day, 3 ⇄ 4: 3 = Token + Exchange + Bridge + Personas, 4 = DeFi — EtherFi. Every `#N` in this file uses the new numbers.

Three decisions that cut across the rows above.

- **Personas moved into #3 Token + Exchange.** First floated as an umbrella over two services, then
  decided outright: the persona NFT market is a package of the `jayverse-token` repo and ships inside
  the `jayverse-exchange` Cloud Run service — token market and NFT market as one project, personas
  priced in JYVE through the pool. Open: whether personas keep a second domain mapping
  (`personas.jaylabs.xyz`) onto the same service, or live only at `/personas`.
- **Own L1/L2 promoted from Dark Horse (a) to #6, as `jayverse-devnet`.** It takes the freed row so it
  is planned and phased like the other services. Phase 1 is deliberately small: a hosted Anvil in
  the Rabbit cloud, forked from Sepolia, that the cloud services use instead of Sepolia — the own
  chain comes later, still "start at last". Design: [jayverse-devnet.md](jayverse-devnet.md).
- **Bridge split: screen in #5 Wallet, plumbing in #3 Token.** The Wallet owns the bridge UI at
  `/bridge` (it was already a placeholder) because a bridge is the scariest signature and
  simulate-before-sign is the wallet's core. The `BridgeLock` / `BridgeMint` contracts, the relayer,
  and the supply invariant stay in `jayverse-token`: the bridge mints and burns JYVE, so it is part
  of the token's economic unit (jay, 2026-09-08), and the relayer's mint key must not move into the
  Wallet, which runs on the no-funds Rabbit cloud.

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
| 3 | Token + Exchange + Bridge + Personas | Token + exchange (JYVE/jUSD) ✅ live on Sepolia + exchange.jaylabs.xyz ✅ · supply-integrity sim page ✅ · Personas: mint + token-gated chat | Intra bridge (lock-and-mint) — contracts + relayer; UI in Wallet #5 · Personas: day rentals (ERC-4907) | Real cross-chain — CCIP (arbitrary messages) + **Circle CCTP** (native jUSD, burn-and-mint) + **xERC20 / ERC-7281** (JYVE as a sovereign bridged token, per-bridge rate limits) · Personas: revenue + market (x402, IPFS, creator flow) |
| 4 | DeFi — EtherFi study | Liquid-staking core | Restaking layer | Real EtherFi (read) |
| 5 | Wallet | simulate-before-sign ✅ | Session keys & templates · public Sepolia wallet on Cloud Run (wallet.jaylabs.xyz) ✅ · `/bridge` route placeholder ✅ → **bridge screen** for #3's lock-and-mint (jay, 2026-09-14) | 4337 breadth · **P4** own dev wallet (31337 fork) |
| 6 | Devnet — own L1 / L2 | Hosted Anvil (Sepolia fork, chainId 313370) on a Rabbit-cloud VM · allowlist proxy · faucet · explorer | Services switch from Sepolia to devnet · bridge becomes devnet ⇄ Sepolia · reset/snapshot ops | `supersim` → OP-Stack L2 settling on the devnet |
| 7 | Game — 3D street | Replay | Live (synchronous) | Polish + optional player-trading |
| 8 | OFA | `IntentAuction` + `MockSolver`s | `AmmSolver` + two invariants | Web harness · backrun / LVR stretch |
| 9 | Math & Investment (Number) | Admin auth gate | Portfolio migration | Deploy + math / algo research |
| ✅ | Authority Auditor | Dogfood matrix ✅ | Rules engine ✅ | On-chain + API (viem verified cells, tier-3 provider API) |
| 10 | Dark Horse | *candidates, not phased:* (b) security research · (c) Base App — (a) own L1/L2 promoted to #6 | — | — |

## Three end-to-end scenarios — every service in one story, plus the service each story asks for

The per-service docs each carry their *own* user scenario (Nari learns an LST, Jun swaps without
feeding a searcher…). These three are different: each one walks **all eleven services** in acd ~/work/alice && PRIVATE_PASS='<your passphrase>' node scripts/private-encrypt.mjs ~/Documents/Private/life-private-rules.md && npm run docs:html

single day, in the order a real user would actually touch them — and each story ends at a gap that
none of the existing services fills. That gap is written up as an **imaginary service** (jay,
2026-09-14: "imaginary services I could create") — a candidate, not a commitment, placed on the
[cloud split](#where-the-web-frontend-lives--the-placement-decision-jay-2026-09-07) like any other
service would be. Service numbers are the table's (#1 Rabbit AA … #10 Dark Horse, ✅ Auditor).

### Scenario A — "Mina's first evening on the street" (a newcomer, consumer loop)

Mina has never used a wallet. She arrives through a link a friend sent, and by the end of the
evening she has placed a bet, earned yield on the change, and rented a persona — without ever
seeing a seed phrase or a gas prompt.

1. **#7 Game.** The link opens the 3D street. She walks past boards showing live Verex markets and
   stops at *"Will it rain in Seoul on Saturday?"*
2. **#2 Verex.** Clicking the board opens onboarding. She pays **₩10,000 by card (Stripe)**; the
   market-maker side already has an LMSR book, so her first bet gets a price instantly — the
   "buy the first liquidity" lesson from `lmsr-hybrid-amm` in practice.
3. **#5 Wallet.** Behind onboarding, an embedded wallet is created for her. Before her first
   on-chain action the wallet runs **simulate-before-sign**: she sees *"you receive 12.4 YES
   shares; max loss ₩10,000"* — the decoded effect, not a hex blob.
4. **#1 Rabbit AA.** The bet itself is a **gasless one-click** UserOp: a paymaster sponsors gas,
   a session key scoped to *Verex markets only, ≤ ₩50,000/day* signs it. No MetaMask popup.
5. **#3 Token + Exchange.** Her leftover ₩ balance is held as jUSD; the street's tip jars and
   persona rentals price in **JYVE**, so a **mini-AMM swap** (jUSD → JYVE) happens under a single
   "top up" button — the price she sees is the reserve ratio, nothing more mysterious.
6. **#4 DeFi.** The app offers *"park your idle balance"*: her unused jUSD-equivalent ETH goes
   into **jeETH**; the position panel shows her balance rebasing up by the hour, and *why*.
7. **#3 Personas (Token + Exchange).** She rents **"Coach Han"** — a persona NFT — for one day (ERC-4907) to explain
   the market she just bet on; the token-gated chat opens only while the rental is live.
8. **#8 OFA.** When she later flips her position, the swap-into-bet is submitted as an **intent**
   ("give X, want ≥ Y"), and the solver auction returns the surplus to *her*, not a searcher.
9. **#9 Number.** None of this shows her Number — it is admin-only — but the operator watches the
   evening's cohort there: conversion from street → first bet, and where people dropped off.
10. **✅ Auditor.** Before Mina's money touched anything, the Authority matrix for *her* wallet
    was already green: no single actor (not Privy, not the backend session key) can move her funds
    alone. The badge she sees on the wallet page is that matrix, summarized.
11. **#10 Dark Horse.** The same street, minus the 3D, is what the **Base App** candidate would
    ship as a mini app — the evening is the demo script for that decision.

**The gap this story finds — imaginary service: `jayverse-passport` (identity & reputation).**
Mina proved who she is once (Stripe KYC in Verex), yet every other service had to re-decide what to
trust: the AA session policy invented a spend cap, Personas had no idea she was a first-timer, the
Game could not show her a "verified" badge. Passport would be a **portable attestation layer**
(EAS / Sign Protocol, per the [rails shortlist](jayverse-rails-shortlist.md)): Verex writes
*KYC-passed, tier 1*; AA reads it to size session caps; Personas reads it to unlock creator
rentals; the Game reads it to render the badge. **It never holds funds** → rabbit cloud, its own
Cloud Run service. What it must get right: the attestation says *what was checked and by whom*,
never the underlying data — the `what-encryption-does-not-hide` question, applied to our own users.

### Scenario B — "The Saturday the market resolved" (a money-moving day, seen from the plumbing)

The rain market resolves. Thousands of positions settle, winners withdraw across chains, and every
invariant the catalogue talks about is tested in one afternoon. This is the same world as Scenario
A, one layer down.

1. **#2 Verex.** A **Chainlink Data Feed** reports Saturday's rainfall; the market resolves YES.
   The operator's **kill switch** stays untouched — the point of the day is that nobody needs it.
2. **✅ Auditor.** Resolution is the most privileged write of the day. Auditor's matrix for the
   Verex contracts shows *resolve* needs the oracle **and** a timelock — no human can do it alone,
   and that is exactly what happens.
3. **#1 Rabbit AA.** Winners claim with **gasless claims** batched into UserOps; the paymaster's
   sponsored-gas bill is a **cost of goods** line the operator can read the next morning
   (`sponsored-gas-is-cogs`).
4. **#5 Wallet.** Every claim previews first: *"you receive 1,240 jUSD; this closes your
   position"*. One user's preview shows a **revert** (a stale nonce) and the wallet refuses to sign
   — the failure never reaches the chain.
5. **#3 Token + Exchange + Bridge.** A winner wants her jUSD on Base. The bridge does
   **lock-and-mint**; the `holding = issuance` and **1:1** invariants are checked on both legs.
   On the same afternoon the JYVE/jUSD pool absorbs the winners' swaps — the reserve-ratio price
   moves visibly, which is the mini-AMM teaching what a thin pool does.
6. **#8 OFA.** Large winners swapping out of JYVE go through the **intent auction** — three
   solvers bid, the AMM solver loses to a better route, surplus lands with the user, and the
   `finalOut >= minOut` stop is hit exactly once (a solver tried to shade).
7. **#4 DeFi.** Payout ETH that users leave parked keeps rebasing; one user **requests withdraw**
   and meets the **queue delay** — she experiences why a jweETH secondary market would trade at a
   discount today.
8. **#3 Personas (Token + Exchange).** Coach Han's owner earns rental fees from the evening; the fee is paid
   per-message via **x402**, so the creator's revenue is a ledger, not a promise.
9. **#7 Game.** Through the street's **warp gate**, anyone can watch the settlement-flow
   visualization replay the day: user → paymaster → market → bridge, entity by entity.
10. **#9 Number.** The admin workbench shows the day's P&L: paymaster spend vs fee income, AMM LP
    exposure (`lp-is-a-short-volatility-position`), and the bridge's locked-vs-minted balance.
11. **#10 Dark Horse.** The **security-research** candidate gets its first real target list from
    this day: every privileged write that ran, ranked by blast radius.

**The gap this story finds — imaginary service: `jayverse-watchtower` (invariant monitor with a
halt).** Auditor answers *who may move funds*. Nothing today answers *are the equations still true
while they move*. Watchtower would be the running form of `an-invariant-is-a-stop-not-an-alarm`:
one service that recomputes, from **independent** sources, `bridge locked = minted`,
`OFA holding = issuance`, `Verex settlement sum = per-market sum`, `DeFi reserves = issuance` —
and on violation **halts the specific write path**, not the world. It sits **outside** the trust
boundary of what it watches (the whole point), on the money side → verex cloud, with a read-only
status page served by the rabbit portal. The hard design question is scope: a monitor that fires
often gets muted, so each invariant names its own narrow halt.

### Scenario C — "Coach Han runs a tournament" (a creator and an operator, over a week)

Coach Han's owner, Tae, turns the persona into a business: a week-long prediction tournament with
entry fees, daily persona sessions, and prizes. Every service is touched by a *time edge* — a
close, an expiry, a delay, a drip — which is what this story is really about.

1. **#3 Personas (Token + Exchange).** Tae mints a **tournament persona** and lists **day rentals**; each rental is
   a token-gated seat at Han's daily session. Rentals expire at midnight KST — the first clock.
2. **#3 Token.** Entry fees are paid in **JYVE**; the exchange's price chart becomes the
   tournament's scoreboard of demand. Tae's prize pool is escrowed — the second clock: it must
   unlock on the final day, not before.
3. **#2 Verex.** Han posts one market per day; each has a **close time** and a **resolution
   time** — clocks three and four. Entrants bet through the persona chat.
4. **#1 Rabbit AA.** Entrants get a **session key that expires with the tournament** — clock
   five — scoped to Han's markets only, with a daily cap sized by Passport tier (Scenario A).
5. **#5 Wallet.** Tae uses a **transaction template**: "post today's market" is a saved,
   pre-simulated action; the preview shows the close time it will set, so a typo'd deadline is
   caught before it exists.
6. **#4 DeFi.** The escrowed prize pool sits in **jeETH** for the week. The **withdrawal queue
   delay** — clock six — must be shorter than the gap between final resolution and prize day, or
   the prizes are late. Tae learns this by reading `WITHDRAW_DELAY` before, not after.
7. **#8 OFA.** Prize distribution swaps jeETH → JYVE as **one intent with a floor**; the
   auction runs once, at prize time, so the batch cannot be front-run day by day.
8. **#7 Game.** The tournament has a **street corner**: a board per day, Han standing next to it,
   the leaderboard on a wall. The warp gate shows the prize flow on the final day.
9. **✅ Auditor.** Tae's escrow contract gets its own Authority matrix on day one: *release
   prizes* = timelock **and** Tae's key — Tae alone cannot pull the pool early, and entrants can
   see that.
10. **#9 Number.** Tae has no Number access, but the operator uses it to price the next
    tournament: fee income vs paymaster cost per entrant, and whether the persona rental or the
    markets carried the week.
11. **#6 Own L1 / L2.** Six clocks across five contracts is the argument for the **own L2**
    (promoted from Dark Horse on 2026-09-14): a chain whose block time and sequencer schedule *are* the tournament clock.

**The gap this story finds — imaginary service: `jayverse-clock` (one scheduler for every time
edge).** Six clocks, five services, and today each one is either a server timer or a human. Clock
would be a single **Chainlink Automation**-driven keeper that fires *market close*, *resolution
request*, *rental expiry*, *session-key expiry*, *withdrawal-queue readiness*, and *reward drip*
from **one registry** — with each tick recorded as a settlement event (`receipt-is-not-settlement`:
a fired tick is a request, the on-chain effect is the receipt). It triggers money-moving writes →
verex cloud; its calendar UI (what fires when, what missed) is a rabbit-portal page. The failure it
must be designed around is the one Chainlink's own table names: **a missed tick delays settlement**
— so every registered edge carries a *late-by* alarm and a human fallback.

### What the three stories share

| | Scenario A — newcomer | Scenario B — settlement day | Scenario C — creator's week |
|---|---|---|---|
| Center of gravity | one user's evening | one afternoon's money flow | one persona's business |
| Lens | UX — never see gas | invariants — never lose a unit | time — never miss an edge |
| Service asked for | `jayverse-passport` (identity) | `jayverse-watchtower` (invariants) | `jayverse-clock` (schedule) |
| Cloud | rabbit (no funds) | verex (on the money path) | verex trigger · rabbit UI |
| Card it grows from | `what-encryption-does-not-hide` | `an-invariant-is-a-stop-not-an-alarm` | `receipt-is-not-settlement` |

None of the three imaginary services holds user funds or a new token; each reads what the existing
eleven already produce. That is deliberate — the stories argue the next service should be **glue
the others are missing**, not a twelfth product.

---

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
> other rabbit-cloud APIs (Wallet, Auditor — and Personas, which since 2026-09-14 rides inside `jayverse-exchange`) are their own services from the start.

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
| 3 | **Token + Exchange + Personas** | `jayverse-token` | in `contracts/`: `forge test`; **t1** `anvil`; **t2** `forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast` (seed pool, mints 2 personas); then `cd ../app && pnpm install && pnpm dev` — personas at `/personas` (the standalone :3040 dev port retires) | :3070 |
| 4 | **DeFi** — EtherFi study | `jayverse-defi` | **t1** `anvil`; `forge test`; `npm run deploy` (writes `addresses.json`); `npm run study` (CLI walk-through); `npm run dev` (Vite) | :3030 |
| 5 | **Wallet** — simulate-before-sign | `jayverse-wallet` | **t1** `anvil`; **t2** `pnpm install` → `pnpm dev` | :3060 |
| 6 | **Devnet** — hosted Anvil | `jayverse-devnet` | `docker compose up` in `infra/` (anvil + proxy + explorer + status page); same stack as the cloud VM | :8545 (RPC) · :3040 (status) |
| 7 | **Game** — 3D street | `jayverse-game` | `pnpm install` → `pnpm dev` (open `/street`) | :3050 |
| 8 | **OFA** — intent + solver auction | `jayverse-ofa` | in `contracts/`: `forge test`; **t1** `anvil`; optional tiny harness | :3080† |
| 9 | **Math & Investment (Number)** | `jayverse-number` | `pnpm install` → `pnpm dev` (admin login) | :3090 |
| 10 | **Dark Horse** — candidate tracks | — | candidates only — nothing to run yet | — |
| ✅ | **Authority Auditor** (built) | `jayverse-auditor` | `pnpm install` → `pnpm dev` — also live in Rabbit at `/live/auditor` | :3080 |

> **Ports:** the six study webs bake their port into `dev` (`3000 + # × 10`) — DeFi :3030, Personas
> :3040 (folded into Token :3070 on 2026-09-14), Game :3050, Wallet :3060, Token :3070, Auditor :3080, Number :3090 — so `pnpm dev` alone is right and they
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

**The cloud estate: [cloud-ops.md](cloud-ops.md)** (started 2026-09-14). What runs in
which project and region, what it costs, and the standing decisions about how the cloud is
maintained and reorganised — Jayverse as a **demo estate** and what that licenses, why Verex
production is parked between demos, staging retired, the two production databases kept separate,
why the Cloud Run services are *not* consolidated into `jayverse-api` + `jayverse-web`, and why the
devnet needs a VM. Each entry records the reasoning and what would have to change to reopen it, so
a later session does not re-argue a settled question — or quietly undo one. Open items are at the
bottom of that file.

The original **Rabbit feature-design index** (this file's pre-Jayverse content) now lives in
[README-history.md](README-history.md) — this file used to hold it; it was split out 2026-09-09.
The Jayverse hub was merged in from the former `README-Jayverse.md`, which has since been removed —
its links now point here.

**Naming (jay asked, 2026-09-07).** Chosen `README-Jayverse.md` over `Jayverse-README.md`, for one
reason: keeping the `README` prefix makes it sort right next to `README.md` in every file listing, so
the two "start here" docs sit together. Per-service design docs are named `jayverse-<service>.md` so
they group under one prefix and are obvious as a set.
