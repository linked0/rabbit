# Jayverse — feature-design hub

Entry point for the Jayverse feature designs. The umbrella plan (services, repo/agent map, build
order) lives in [`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md); **this file is the
design hub** — it answers the cross-cutting architecture question below and indexes the per-service
design docs.

> **This file also carries the Rabbit feature-design index** — preserved as the
> [History section](#history) at the bottom (merged here 2026-09-09; the former
> `README-Jayverse.md` has been removed — its links now point here).

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

# History — Rabbit feature-design index <a id="history"></a>

> **Merged 2026-09-09.** This file (`docs/features/README.md`) was the Rabbit feature-design index
> until the Jayverse hub (formerly `README-Jayverse.md`) was merged in above and became the lead.
> The former `README-Jayverse.md` has since been removed. The original Rabbit content is preserved
> verbatim below.

# Rabbit — Feature Designs

Design + plan **drafts** for the features in [`../tasks/Jun-18-features.md`](../tasks/Jun-18-features.md).
Each feature has its own file; this is the main index. These are for review — refine first,
then summarize the built result into `docs/history/`.

## Target information architecture (one top menu, anchored by Home)
Status verified against the running code on 2026-08-03 (routes, `app/Nav.tsx`, `next.config.js`),
not just doc text — several rows are flagged stale below (see notes under the table).
**Full re-audit 2026-08-18** (jay): every row below re-verified against the code — routes
enumerated from `app/**/page.tsx`, the top menu read from `app/Nav.tsx`, not from doc text.
One row was materially wrong and is corrected below (AI Chat). Verified facts used as the
basis: the top menu is exactly `/` · `/portfolio` · `/projects` · `/game` · `/poc` · `/live`;
`.github/workflows/` still does not exist; `/market`, `/xyz`, `/live/aa`, `/live/ap2`, `/live/7702`
and `/live/agent` all exist as routes. **Plan reset 2026-08-21** (jay): the autonomy-loop plan
was archived unstarted, so **this table is now the single status source for the whole repo** —
[current-plan.md](../tasks/current-plan.md) holds no active task until jay picks the next one.
Per-milestone marks for the autonomy loop moved to [Backlog](#backlog) below.
AP2, Toss, and the AA building blocks graduated out of current-plan.md on 2026-08-06 once built
(archived at
[../tasks/archive/2026-08-06-current-plan-ap2-toss-aa.md](../tasks/archive/2026-08-06-current-plan-ap2-toss-aa.md));
their rows below are now the live status. The PoCs hub they all plug into is tracked here too, at
[pocs-hub.md](pocs-hub.md).

| Menu | Route | Feature doc | Status |
|------|-------|-------------|--------|
| Home | `/` | [main-page.md](main-page.md) | ✅ Done — `/` rewrites to `app/home/page.tsx` |
| Portfolio & Market | `/portfolio` + `/market` | [portfolio-and-market.md](portfolio-and-market.md) | 🟡 Stale row — already split into **Portfolio** (`/portfolio`, ✅ done) and **Market** (`/market`, 🟡 in progress — Hyperliquid trading, see the doc); this table's Menu column needs a nav-update pass to reflect the split as two rows |
| AI Chat | ~~`/chat`~~ → Home | [ai-chat.md](ai-chat.md) — full design incl. Auth+LLM gating and KB-via-MCP+RAG | 🟡 **Corrected 2026-08-18** — the previous row said "route exists but was dropped from the nav"; in fact **`app/chat/` does not exist at all**. The surface shipped instead as Jay Chat embedded in Home (`app/home/page.tsx` + `app/api/jay-chat/route.ts`), so there is no `/chat` route to drop. Jay Chat public surface ✅ · Ask-about-me ✅ · gating/BYO-key ⬜ · KB-RAG ⬜ |
| AP2 Test | `/live/ap2` | [ap2-test.md](ap2-test.md) — build detail in the [archived plan §2](../tasks/archive/2026-08-06-current-plan-ap2-toss-aa.md#s2) | ✅ Done — Stripe Checkout settlement example (test mode), server-side `payment_status` verification; moved from `/ap2` to `/live/ap2` |
| XYZ Demo | `/xyz` | [xyz-demo.md](xyz-demo.md) | 🟡 In progress — C2 bundle-submit + C4 PBS relay dashboard live; other items pending |
| Verex | ↗ external | [verex-link.md](verex-link.md) | ✅ Done, but **not as designed here** — the nav item was removed (2026-07-25); replaced with a featured card on the Home page (`app/home/page.tsx`, `lib/verex.ts`) instead of a top-menu external link |
| _UI/UX_ | — | [ui-ux.md](ui-ux.md) — 디자인 접근법: frontend-design 스킬 + UI/UX Pro Max + 6단계 빌드 워크플로 | 🔄 Ongoing — applied per-feature, not a single deliverable |
| _Cross-cutting_ | — | [common.md](common.md) — navigation/top-menu (Common #1) + CI/CD (Common #2) | 🟡 Partial — Nav restructure done (`app/Nav.tsx`, owner/public gating); **CI/CD not found** — no `.github/workflows/` directory exists in the repo despite `common.md` describing a `deploy.yml` |
| _Agentic AA — building blocks_ | `/live/aa` | [agentic-aa.md](agentic-aa.md) — session key · paymaster · atomic batch · ERC-8004 KYA · + ERC-8021 attribution suffix | 🟡 Built — ① session key (ERC-7715/7710) + ②③ sponsored/batch tx (thirdweb 4337) live; ④ KYA stayed an explainer card (ERC-8004 testnet registry unverified). All human-triggered — that gap is what the row below addresses |
| _Agentic AA — autonomy loop_ | `/live/agent` (public overview + mock) · `/live/agent/console` (the real thing, owner-only) | [Backlog → B1](#b1) · plan: [current-plan.md](../tasks/current-plan.md) | 🟡 **Built through R-F, 2026-09-02** — J2: on-chain amount+expiry mandate (MetaMask ERC-7715 on a Sepolia-fork chain), news store, LLM estimate, tick, journal, and a **server scheduler**; the first scheduled, wallet-granted, on-chain-drawn trade landed 2026-09-02. `/live/agent` itself stays the scripted mock on purpose. Remaining: R-G/R-H + the unattended-day soak. D2 answered |
| _Agentic AA — Unity visualization_ | `/live/agent` toggle (planned) | [Backlog → B2](#b2) · [game.md](game.md) | ⬜ Deferred, not dropped — side-quest, explicitly off the critical path; blocked on **U1** (submodule strategy) and sequenced after the loop actually runs |
| _EIP-7702 inspector_ | `/live/7702` | [erc-8141.md](erc-8141.md) is the *native*-AA sibling study; this page is the app-layer inspector | ✅ Done — read-only `eth_getCode` account inspector (plain EOA / 7702-delegated / contract), no wallet required |
| _Toss Payments_ | `/live/toss` | [toss-payments.md](toss-payments.md) — KRW settlement example, counterpart to the AP2 Stripe example | ✅ Done — standalone page (not an `/ap2` extension); test-mode client/secret keys. Detail in the [archived plan §7](../tasks/archive/2026-08-06-current-plan-ap2-toss-aa.md#s7) |
| _Staging Domain_ | — (infra, not a menu item) | [staging-domain.md](staging-domain.md) — `staging.rabbit.jaylabs.xyz` via Firebase Hosting rewrite | 🚫 Not pursuing |
| _PoCs hub_ | `/poc` | [pocs-hub.md](pocs-hub.md) — consolidated demo menu wrapping Hyperliquid Trading, PBS, AP2, and AA under one top-menu item | ✅ Done — shipped 2026-08-03, routes moved `/etc` → `/poc`; cards registered in [`lib/poc-cards.ts`](../../lib/poc-cards.ts) |


**Legend:** ✅ Done · 🟡 In progress / partial / stale · ⬜ To do · 🔄 Ongoing · 📎 Reference only ·
🚫 Not pursuing · 🗒️ Design (not yet approved to build).

> **Knowledge 메뉴는 일시 제거됨** — 콘텐츠는 `docs/know.html`(로컬 `file://`로 열람). 필요 시 복원. (앱 측 메뉴/라우트 제거는 PR #18에 포함.)
> **Also not in this table but live in `app/Nav.tsx`:** a public **Projects** menu item (`/projects`) — added after this table was last updated.

## Demo for employer — trade[XYZ] / Unit Labs (Sr. Software Engineer)
Surfaced under the new **XYZ Demo** menu (`/xyz`) — see [xyz-demo.md](xyz-demo.md). Three demo
items I can build to showcase fit for this spec (Go backend, oracle/pricing infrastructure,
real-time data, on-chain indexing, distributed systems). Each maps to explicit spec bullets and
also plugs into rabbit's existing surfaces, so the demo is a coherent product, not isolated toys.
They escalate: **data → monetized data → on-chain data.**

| # | Demo item | What it proves (spec bullet) | How it plugs into rabbit | Est. |
|---|-----------|------------------------------|--------------------------|------|
| 1 | **Price-oracle + relayer mini-service** — small Go service that pulls real-time prices for a few assets (one equity, one FX pair, one commodity — mirroring XYZ's markets), medianizes multiple sources, exposes a signed price feed over HTTP/WebSocket, with Prometheus metrics + a Grafana panel. | "Build and maintain oracles, relayers… real-time data integrations, internal pricing… 24/7 trading of global markets"; **Stack:** Go, Prometheus, Grafana. | Feeds the Market zone of `/portfolio`; quotes render live. | 1–2d |
| 2 | **x402 "agent pays for the price feed"** — reframe rabbit's existing AP2/x402 loop so the paid resource is item 1's oracle feed: agent requests price → `402 Payment Required` → pays → receives signed quote → retries. | "Price feeds, data pipelines, real-time data systems"; "taking projects 0→1"; shows working, deployed code. | Extends the existing AP2 Test page ([ap2-test.md](ap2-test.md)) instead of a throwaway mock. | 1d |
| 3 | **Hyperliquid HIP-3 market viewer + indexer** — read-only indexer subscribing to a Hyperliquid **testnet** HIP-3 perp market; indexes trades/funding into Postgres (Prisma) with reconnect + gap-backfill, renders a live order-book/funding panel. | "Consensus mechanisms and indexing systems for complex on-chain data"; "fault-tolerant distributed systems"; **blockchain (EVM/Solana/BTC)** + trading familiarity. | New panel in `/portfolio`; reuses the Cloud SQL Postgres from S6. | 2–3d |

**Suggested demo cut** (if time is short): ship items **1 + 2** end-to-end — they form one
"priced data, paid for by an agent" story that hits the oracle, pricing, Go, and 0→1 bullets
most directly. Item 3 is the strongest *blockchain* signal but the heaviest; pull it in only if
the Hyperliquid testnet integration lands cleanly.


## Backlog — unstarted work graduated out of current-plan.md <a id="backlog"></a>

> **Why this section exists (2026-08-21, jay).** The rolling plan
> [current-plan.md](../tasks/current-plan.md) was reset. Everything it tracked was still
> unstarted, so rather than carry a stale plan forward, the unbuilt milestones and the open
> decisions moved here — the same graduation AP2/Toss/AA got on 2026-08-06, except those
> graduated because they were **done** and these graduate because they were **never begun**.
> Nothing was deleted. The full design prose stays verbatim in
> [../tasks/archive/2026-08-21-current-plan-agentic-aa.md](../tasks/archive/2026-08-21-current-plan-agentic-aa.md);
> this is the status surface, and it is what the next plan will draw from.

### B1 — Agentic AA: the autonomy loop (`/live/agent`) <a id="b1"></a>

> **Built through the scheduler, 2026-09-02** (first pass 2026-08-26). The loop exists as J2 —
> mandate, news store, LLM estimate, tick, journal, **and a server-side scheduler** — at
> `/live/agent/console`, on an anvil **fork of Sepolia** so the mandate is granted by MetaMask's
> real ERC-7715 popup and drawn through the canonical DelegationManager. What B1 still owes:
> **M5/R-H** (the expiry run), R-G (resolution watch + self-redeem, tracked in the plan), and the
> full unattended-day soak. As-built description:
> [autonomous-trading-agent.md](autonomous-trading-agent.md). Plan:
> [docs/tasks/current-plan.md](../tasks/current-plan.md).

The claim it would demonstrate: **the safety of an unattended agent is arithmetic, not trust** —
the mandate's amount cap and expiry are enforced by contracts the agent cannot touch, so a buggy
or compromised agent's worst case is bounded in advance and observable after the fact. Audited
against the code on `main`, not the commit log.

| M | Milestone | Status | Evidence / gap | Est. |
|---|-----------|--------|----------------|------|
| **M1** | Agent identity + mandate | ✅ done 2026-08-26 | `lib/agent-wallet.ts` + `app/api/agent/mandate` — cap and expiry enforced **on-chain**; D2 answered (server-held key, address-only to the browser) | — |
| **M2** | The tick, callable by hand | ✅ done 2026-08-26 | `POST /api/agent/tick`; body extracted to `lib/agent-tick.ts` 2026-09-02 so route and scheduler share one function | — |
| **M3** | Journal + persistence | ✅ done 2026-08-26 | `AgentTick` + `NewsItem` in Postgres, journal panel resolving cited evidence; the `/live/agent` mock is retained as the public overview, not the record | — |
| **M4** | Actually unattended | ✅ built 2026-09-02 | `lib/agent-scheduler.ts` + `/api/agent/scheduler` + console panel; ticks nobody triggered are in the journal. **The full unattended-day soak is still owed** | — |
| **M5** | Expiry run *(evidence, not code)* | ⬜ unblocked | M4 is built, so this is runnable now — let a mandate lapse with the scheduler live, capture the refusals (= R-H in the plan) | 0.5d |

**Open decisions — D2 is the blocker.** Full reasoning in the
[archived plan §4](../tasks/archive/2026-08-21-current-plan-agentic-aa.md#s4).

| D | Question | State |
|---|----------|-------|
| **D1** | Gas: pre-fund the session account, or move to a 4337 account with a paymaster? | ✅ decided — keep 7715/7710 and pre-fund once; "agent ran out of gas" stays an honest journal failure mode |
| **D2** | Where does the session key live? | ✅ **answered by J2** — server-side generation, address-only to the browser, testnet-grade custody labelled on the page; and the cap/expiry moved **on-chain** (jay chose option (c)), so custody of the agent key is not custody of the bound |
| **D3** | Scheduler host — Cloud Scheduler · GitHub Actions cron · hosted cron | ◐ answered for the local PoC (2026-09-02): an in-process Next server timer. Reopens if this ever deploys — an in-process timer dies with its instance (`.github/workflows/` still does not exist) |
| **D4** | Journal storage — Postgres/Prisma · JSON file · reconstruct from chain | ✅ decided and built — Postgres/Prisma (`AgentTick`). Chain-only could not record **skips**, and skips are the point of the demo |
| **D5** | Deterministic rule or LLM decision? | ✅ decided — deterministic. The interesting property is that the bound holds regardless of how the agent decides |

**What the PoC card says, and why it does not contradict this.** The `agent` card in
[`../../lib/poc-cards.ts`](../../lib/poc-cards.ts) is `status: "done", date: "2026-08-12"`. That
follows the `oz-relayer` pattern — a completed thought experiment plus a mock, not a running
demo. The loop above is a different claim, and none of it is built.

### B2 — Unity visualization of the agent (side-quest) <a id="b2"></a>

⬜ **Deferred, not dropped.** Design only — jay's idea, 2026-08-06. A Unity scene that *shows*
the agent acting: it wakes, checks a price board, mostly shrugs and goes back to sleep, and after
expiry walks to a gate that no longer opens. The value beyond fun is that it makes the enforcer
physical — in a journal a rejection is a red word, in a scene it is a gate that will not move.

Two rules that survive from the design and should not be re-litigated: **Unity is a dumb
renderer** (it gets journal rows via `SendMessage` and never touches a chain, a key, or an RPC —
a second path to the chain could disagree with the journal, and the journal *is* the record), and
it lives behind a **toggle on `/live/agent`**, not its own route, for the same reason.

**Open — U1 blocks the rest.** U1: submodule strategy for `rabbit-hole` (source + CI build ·
source + committed WebGL build ⭐ recommended · no submodule, iframe a published build) — the
same question [game.md](game.md) already asks, so whatever is picked should serve both. U2:
replay history or live ticks only. U3: shared art direction with `/game`. U4: is `rabbit-hole`
for this program specifically or the general home for jay's Unity work. Sequenced **after** B1's
M5 — building the scene against mock data would mean tuning it twice.
