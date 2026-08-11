# Rabbit — Feature Designs

Design + plan **drafts** for the features in [`../tasks/Jun-18-features.md`](../tasks/Jun-18-features.md).
Each feature has its own file; this is the main index. These are for review — refine first,
then summarize the built result into `docs/history/`.

## Target information architecture (one top menu, anchored by Home)
Status verified against the running code on 2026-08-03 (routes, `app/Nav.tsx`, `next.config.js`),
not just doc text — several rows are flagged stale below (see notes under the table). **This
table is the single status source for everything except the one task tracked in
[current-plan.md](../tasks/current-plan.md) — the Agentic AA autonomy loop** (`/poc/agent`).
AP2, Toss, and the AA building blocks graduated out of current-plan.md on 2026-08-06 once built
(archived at
[../tasks/archive/2026-08-06-current-plan-ap2-toss-aa.md](../tasks/archive/2026-08-06-current-plan-ap2-toss-aa.md));
their rows below are now the live status. The PoCs hub they all plug into is tracked here too, at
[pocs-hub.md](pocs-hub.md).

| Menu | Route | Feature doc | Status |
|------|-------|-------------|--------|
| Home | `/` | [main-page.md](main-page.md) | ✅ Done — `/` rewrites to `app/home/page.tsx` |
| Portfolio & Market | `/portfolio` + `/market` | [portfolio-and-market.md](portfolio-and-market.md) | 🟡 Stale row — already split into **Portfolio** (`/portfolio`, ✅ done) and **Market** (`/market`, 🟡 in progress — Hyperliquid trading, see the doc); this table's Menu column needs a nav-update pass to reflect the split as two rows |
| AI Chat | `/chat` | [ai-chat.md](ai-chat.md) — full design incl. Auth+LLM gating and KB-via-MCP+RAG | 🟡 Route exists but was **dropped from the top nav** (2026-08-01, folded into Home); gating/BYO-key ⬜ · KB-RAG ⬜ · Ask-about-me ✅ · Jay Chat public surface ✅ |
| AP2 Test | `/poc/ap2` | [ap2-test.md](ap2-test.md) — build detail in the [archived plan §2](../tasks/archive/2026-08-06-current-plan-ap2-toss-aa.md#s2) | ✅ Done — Stripe Checkout settlement example (test mode), server-side `payment_status` verification; moved from `/ap2` to `/poc/ap2` |
| XYZ Demo | `/xyz` | [xyz-demo.md](xyz-demo.md) | 🟡 In progress — C2 bundle-submit + C4 PBS relay dashboard live; other items pending |
| Verex | ↗ external | [verex-link.md](verex-link.md) | ✅ Done, but **not as designed here** — the nav item was removed (2026-07-25); replaced with a featured card on the Home page (`app/home/page.tsx`, `lib/verex.ts`) instead of a top-menu external link |
| _UI/UX_ | — | [ui-ux.md](ui-ux.md) — 디자인 접근법: frontend-design 스킬 + UI/UX Pro Max + 6단계 빌드 워크플로 | 🔄 Ongoing — applied per-feature, not a single deliverable |
| _Cross-cutting_ | — | [common.md](common.md) — navigation/top-menu (Common #1) + CI/CD (Common #2) | 🟡 Partial — Nav restructure done (`app/Nav.tsx`, owner/public gating); **CI/CD not found** — no `.github/workflows/` directory exists in the repo despite `common.md` describing a `deploy.yml` |
| _Agentic AA — building blocks_ | `/poc/aa` | [agentic-aa.md](agentic-aa.md) — session key · paymaster · atomic batch · ERC-8004 KYA · + ERC-8021 attribution suffix | 🟡 Built — ① session key (ERC-7715/7710) + ②③ sponsored/batch tx (thirdweb 4337) live; ④ KYA stayed an explainer card (ERC-8004 testnet registry unverified). All human-triggered — that gap is what the row below addresses |
| _Agentic AA — autonomy loop_ | `/poc/agent` (planned) | **[current-plan.md](../tasks/current-plan.md)** — the only task tracked there | ⬜ To do — agent that observes, decides, and pays unattended under an amount+expiry mandate; makes `lib/agent-scenarios.ts`'s `scheduled-operator` actually run |
| _EIP-7702 inspector_ | `/poc/7702` | [erc-8141.md](erc-8141.md) is the *native*-AA sibling study; this page is the app-layer inspector | ✅ Done — read-only `eth_getCode` account inspector (plain EOA / 7702-delegated / contract), no wallet required |
| _Toss Payments_ | `/poc/toss` | [toss-payments.md](toss-payments.md) — KRW settlement example, counterpart to the AP2 Stripe example | ✅ Done — standalone page (not an `/ap2` extension); test-mode client/secret keys. Detail in the [archived plan §7](../tasks/archive/2026-08-06-current-plan-ap2-toss-aa.md#s7) |
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
