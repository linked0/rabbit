# Rabbit — Feature Designs

Design + plan **drafts** for the features in [`../tasks/Jun-18-features.md`](../tasks/Jun-18-features.md).
Each feature has its own file; this is the main index. These are for review — refine first,
then summarize the built result into `docs/history/`.

## Target information architecture (one top menu, anchored by Home)
Status verified against the running code on 2026-08-03 (routes, `app/Nav.tsx`, `next.config.js`),
not just doc text — several rows are flagged stale below (see notes under the table). **This
table is now the single status source for everything except AP2 + Account Abstraction (AA) — the
only two tasks tracked in [current-plan.md](../tasks/current-plan.md)** (§2, §3, §6). The PoCs
hub those two plug into is tracked here instead, at [pocs-hub.md](pocs-hub.md) — every other
section that used to live in current-plan.md has had its full detail moved into the linked doc
below.

| Menu | Route | Feature doc | Status |
|------|-------|-------------|--------|
| Home | `/` | [main-page.md](main-page.md) | ✅ Done — `/` rewrites to `app/home/page.tsx` |
| Portfolio & Market | `/portfolio` + `/market` | [portfolio-and-market.md](portfolio-and-market.md) | 🟡 Stale row — already split into **Portfolio** (`/portfolio`, ✅ done) and **Market** (`/market`, 🟡 in progress — Hyperliquid trading, see the doc); this table's Menu column needs a nav-update pass to reflect the split as two rows |
| AI Chat | `/chat` | [ai-chat.md](ai-chat.md) — full design incl. Auth+LLM gating and KB-via-MCP+RAG | 🟡 Route exists but was **dropped from the top nav** (2026-08-01, folded into Home); gating/BYO-key ⬜ · KB-RAG ⬜ · Ask-about-me ✅ · Jay Chat public surface ✅ |
| Game | `/game` | [game.md](game.md) | 🟡 In progress — `/game` is a 2D-canvas placeholder ("Coin Catcher"), Unity WebGL embed not built yet |
| AP2 Test | `/ap2` | [ap2-test.md](ap2-test.md) — plus [current-plan.md §2](../tasks/current-plan.md#s2) for the active Stripe-example build | ⬜ To do — page is a "Coming soon" stub; **actively being built now** (Stripe settlement example) |
| XYZ Demo | `/xyz` | [xyz-demo.md](xyz-demo.md) | 🟡 In progress — C2 bundle-submit + C4 PBS relay dashboard live; other items pending |
| JayVerse | `/jayverse` | [jayverse.md](jayverse.md) | ⬜ To do — "Coming soon" stub, Gravia-style dashboard not built |
| Verex | ↗ external | [verex-link.md](verex-link.md) | ✅ Done, but **not as designed here** — the nav item was removed (2026-07-25); replaced with a featured card on the Home page (`app/home/page.tsx`, `lib/verex.ts`) instead of a top-menu external link |
| _UI/UX_ | — | [ui-ux.md](ui-ux.md) — 디자인 접근법: frontend-design 스킬 + UI/UX Pro Max + 6단계 빌드 워크플로 | 🔄 Ongoing — applied per-feature, not a single deliverable |
| _Cross-cutting_ | — | [common.md](common.md) — navigation/top-menu (Common #1) + CI/CD (Common #2) | 🟡 Partial — Nav restructure done (`app/Nav.tsx`, owner/public gating); **CI/CD not found** — no `.github/workflows/` directory exists in the repo despite `common.md` describing a `deploy.yml` |
| _DSRV Portal_ | — (backlog) | [dsrv-portal.md](dsrv-portal.md) — institutional custody study (MPC · approval flow · AA · AML) + no-VASP PoC items | ⬜ To do (backlog) — not yet scheduled |
| _PET Clean Room_ | — (backlog) | [pet-clean-room.md](pet-clean-room.md) — homomorphic-encryption data clean room study (DESILO/국립암센터 case) + hands-on FHE PoC items | ⬜ To do (backlog) — not yet scheduled |
| _Zapier MCP_ | `/etc/zapier` (planned) | [zapier-mcp.md](zapier-mcp.md) — sample page: agent triggers real app actions (Gmail/Notion/Slack) via Zapier MCP | ⬜ To do — not yet scheduled |
| _Agentic AA_ | `/etc` (extends the §3 ETC demo) | [agentic-aa.md](agentic-aa.md) — 4-pillar AA demo for agent payments: session key · paymaster · atomic batch · ERC-8004 KYA · + ERC-8021 attribution suffix | ⬜ To do — **actively being built now**, see [current-plan.md §6](../tasks/current-plan.md#s6) (sequenced after §3) |
| _Solana_ | `/etc/solana` (planned) | [solana.md](solana.md) — Solana integration study + sample Anchor program (counter → SPL escrow) on devnet, called from a demo page | ⬜ To do — not yet scheduled |
| _KB Hybrid Payment_ | — (reference only) | [kb-hybrid-payment-flow.md](kb-hybrid-payment-flow.md) — flow map: TradFi card rail (ISO 8583) × on-chain settlement (Avalanche subnet); no dev item | 📎 Reference only |
| _CRE × Cloud_ | — (reference only) | [cre-cloud.md](cre-cloud.md) — 4 hybrid patterns (RWA servicing · PoR · DvP · AI prediction-market settlement): cloud = private truth, CRE = verified bridge, chain = settlement | 📎 Reference only |
| _Thirdweb_ | — (reference only) | [thirdweb.md](thirdweb.md) — full-stack Web3 platform survey (contracts · Connect wallets/AA · Engine backend tx · Unity SDK); breadth-over-best-parts tradeoff; touchpoints: agentic-aa, ap2 backend tx, Unity track | 📎 Reference only — not scheduled |
| _ERC-8141_ | — (knowledge page, planned) | [erc-8141.md](erc-8141.md) — native account-abstraction study: Frame Transactions (`0x06`), the protocol-native sibling of the app-layer AA work (see [current-plan.md §3](../tasks/current-plan.md#s3)) | ⬜ To do — not yet scheduled |
| _Toss Payments_ | `/ap2` or `/etc/toss` (planned) | [toss-payments.md](toss-payments.md) — KRW settlement example via Toss Payments, counterpart to the AP2 Stripe example (see [current-plan.md §2](../tasks/current-plan.md#s2)) | ⬜ To do — not yet scheduled |
| _Staging Domain_ | — (infra, not a menu item) | [staging-domain.md](staging-domain.md) — `staging.rabbit.jaylabs.xyz` via Firebase Hosting rewrite | 🚫 Not pursuing |
| _Merkle vs Verkle_ | — (reference only) | [../knowledge/merkle-vs-verkle.html](../knowledge/merkle-vs-verkle.html) — proof-size comparison, Ethereum's Verge context | 📎 Reference only |
| _Linera Microchains_ | — (reference only) | [../knowledge/linera-microchains.html](../knowledge/linera-microchains.html) — blockspace-contention + per-user microchain model | 📎 Reference only |
| _Web Stack Layers_ | — (reference only) | [../knowledge/web-stack-layers.html](../knowledge/web-stack-layers.html) — 5-layer map with a rabbit overlay | 📎 Reference only |
| _PoCs hub_ | `/etc` (building) | [pocs-hub.md](pocs-hub.md) — consolidated demo menu wrapping Hyperliquid Trading, PBS, AP2, and AA under one top-menu item | 🟡 In progress — building on branch `claude/pocs-hub` |
| _TIL ("Today I Learned")_ | `/til` (building) | `lib/til-cards.ts` — same card format as the PoCs hub (`app/DemoCard.tsx`, shared type `lib/demo-cards.ts`). Code demos re-implementing something from a day's learning (math formula, algorithm, or a recommended-service integration) — not a sync of jay's private daily report file | 🟡 In progress — 3 seed cards, all "Coming soon" pending jay filling in the actual code; building on branch `claude/pocs-hub`. Build log: [2026-08-03 history](../history/2026-08-03-rabbit-history.md) (search "TIL") |

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
