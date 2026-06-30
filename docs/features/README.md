# Rabbit — Feature Designs

Design + plan **drafts** for the features in [`../tasks/Jun-18-features.md`](../tasks/Jun-18-features.md).
Each feature has its own file; this is the main index. These are for review — refine first,
then summarize the built result into `docs/history/`.

## Target information architecture (one top menu, anchored by Home)
| Menu | Route | Feature doc |
|------|-------|-------------|
| Home | `/` | [main-page.md](main-page.md) |
| Portfolio & Market | `/portfolio` | [portfolio-and-market.md](portfolio-and-market.md) |
| AI Chat | `/chat` | [ai-chat.md](ai-chat.md) |
| Game | `/game` | [game.md](game.md) |
| AP2 Test | `/ap2` | [ap2-test.md](ap2-test.md) |
| XYZ Demo | `/xyz` | [xyz-demo.md](xyz-demo.md) |
| ETC | `/etc` | [etc.md](etc.md) |
| Verex | ↗ external | [verex-link.md](verex-link.md) |
| _UI/UX_ | — | [ui-ux.md](ui-ux.md) — 디자인 접근법: frontend-design 스킬 + UI/UX Pro Max + 6단계 빌드 워크플로 |
| _Cross-cutting_ | — | [common.md](common.md) — navigation/top-menu (Common #1) + CI/CD (Common #2) |

> **Knowledge 메뉴는 일시 제거됨** — 콘텐츠는 `docs/know.html`(로컬 `file://`로 열람). 필요 시 복원. (앱 측 메뉴/라우트 제거는 PR #18에 포함.)

## Roadmap — phase · step schedule
Broken into steps like verex's `docs/plan/README.md §1.4`. Effort = focused AI-assisted
work (not calendar time); if a step runs over, **cut its scope** rather than slipping the next.

| Phase · Step | Key deliverables | Milestone | Est. |
|---|---|---|---|
| **P1 Shell · S1** | Navigation restructure — Home-anchored top menu + active-link highlight | every section reachable from the new menu | 0.5d |
| **P1 Shell · S2** | Home gate (`app/page.tsx`) — card grid + hero image | `/` shows the Home gate | 0.5–1d |
| **P1 Shell · S3** | Knowledge → `/knowledge`; Verex external link | knowledge at `/knowledge`; Verex opens externally | 0.5d |
| **P1 Shell · S4** | CI/CD — GitHub Actions (lint/build/test on PR; deploy on merge) | PRs auto-checked, merge auto-deploys | 0.5–1d |
| **P2 Core · S5** | Merge `/summary` + `/dashboard` → `/portfolio` (Market + Portfolio zones) | one Portfolio & Market page | 1d |
| **P2 Core · S6** | DB persistence — Cloud SQL Postgres + Prisma; holdings schema + CRUD API | holdings survive refresh, keyed by user | 1–2d |
| **P2 Core · S7** | AI Chat — provider selector + small OSS model (Qwen2.5-0.5B) on Cloud Run | pick Local/OpenAI; OSS model answers | 1–2d |
| **P3 Extras · S8** | Game — Unity (`rabbit-hole`) WebGL build embedded in `/game` | sample game playable in `/game` | 2–3d* |
| **P3 Extras · S9** | AP2 Test — x402 "agent pays for data" mock loop | agent pay → retry → data works | 1–2d |
| **P3 Extras · S10** | Polish — error boundaries, a few tests, deploy, history write-up | all features live; history recorded | 1–2d |

\*S8 is gated on your Unity game build. **Total: ~10–15 focused days.**

**Sequencing rules**
- **Navigation first** — every other feature plugs into the new top menu.
- **CI/CD early** (Phase 1) — so Phase 2/3 PRs are auto-checked.
- **Portfolio & Market is the critical path** for real value (it needs the DB) — start Phase 2 with it.
- **Game and AP2 last** — Game is a separate Unity repo (`rabbit-hole`) gated on your game build; AP2 is experimental.
- **Quick wins** you can pull forward anytime: `verex-link` (one external `<a>`) and the app icon (already done).

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

## Status / prerequisite
Portfolio and Investment Summary are currently **separate** menus (`/dashboard`, `/summary`);
they must be **merged** into *Portfolio & Market* — see [portfolio-and-market.md](portfolio-and-market.md).
