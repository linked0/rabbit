# 2026-07-07 — rabbit history

> Source: [tasks/jun-30-rabbit-design.md §3](../tasks/jun-30-rabbit-design.md) (Market page);
> the git-maintenance and port-change entries have no task file (direct requests from jay).

### Git: commit staged docs to main and push (+ stale lock cleanup)

Committed the staged changes (`docs/history/2026-07-06-verex-history.md` + its card in
`docs/know.html`) directly to `main` at jay's explicit request, then pushed 3 commits
(2 previously unpushed + this one) to origin.

Gotcha: three stale git lock files (`index.lock`, `HEAD.lock`, `objects/maintenance.lock`,
dated Jul 2–7 00:02–00:03) blocked the commit — all created around midnight, likely by a
crashed scheduled git maintenance job. Verified no git process was running before removing them.

### Port: move dev/prod server 3000 → 3100 (verex conflict)

Source: direct request from jay — verex servers occupy 3000 and 4000. Chose 3100 after
checking listening ports (5000/7000 are macOS AirPlay, 5432 Postgres, 11434 Ollama).
Changed: `package.json` (`next dev/start -p 3100`), `.claude/launch.json`, `AUTH_URL` +
redirect-URI comments in `.env*`, iOS `ContentView.swift` (both simulator and LAN URLs),
README. Verified `pnpm dev` serves HTTP 200 on 3100. Dockerfile untouched (Cloud Run uses 8080).
Follow-up for jay: add `http://localhost:3100/api/auth/callback/google` to Google OAuth
authorized redirect URIs (cloud mode only; local password mode unaffected).

### Market page: Hyperliquid BTC orderbook + indices (design §3)

Source: [tasks/jun-30-rabbit-design.md §3](../tasks/jun-30-rabbit-design.md). Implemented the
first cut per jay's decisions (REST poll, BTC perp): `fetchL2Book` in `lib/hyperliquid.ts`,
public `app/api/orderbook` proxy, `OrderBook.tsx` polling every 5s, `/market` = book + reused
`IndexCards`. Decision: `/api/indices` and `/api/orderbook` made public in `middleware.ts` —
`/market` is a public page, and both routes serve public market data (indices upstream is
cached 60s, so no key-quota risk). Verified logged-out on the dev server; WS + market picker
deferred as designed.

### Research: perp trading from /market with MetaMask (design §3 addendum)

Source: [tasks/jun-30-rabbit-design.md §3](../tasks/jun-30-rabbit-design.md) (summary appended
there). Key findings (verified against Hyperliquid docs): auth = EIP-712 signatures only (no API
key); funding = USDC on Arbitrum via bridge, testnet faucet for dev; two signing models — per-order
MetaMask popups vs a one-time-approved **agent wallet** (trades only, cannot withdraw). Open
decisions for jay: signing model, testnet-only first cut, agent-key storage location.

### Market page: default market BTC → ETC perp (jay request)

Source: direct request (supersedes the §3 "default = BTC" decision; design doc updated in place).
Verified ETC is live on Hyperliquid (~$7.02) before switching. Side fix: orderbook price
formatter now uses 5 significant figures (HL price rule) instead of 2 decimals, which would have
collapsed ETC's 4-decimal ticks. Verified `/market` renders ETC book on the dev server.

### Decision: perp trading = direct signing first, agent wallet later (Task 3-P2)

Source: jay, recorded in [tasks/jun-30-rabbit-design.md §3](../tasks/jun-30-rabbit-design.md).
Phase 2a = MetaMask popup per order (no stored keys); Phase 2b = agent wallet swap-in reusing
2a's order form/exchange client. Remaining open: testnet-only first cut, agent-key storage (2b).

### Milestone: HL-TEST funded — testnet mock USDC secured (jay)

jay completed the wallet track: HL-TEST MetaMask account, ETH → Arbitrum → USDC, Hyperliquid
mainnet deposit (unlocking the account-existence faucet gate), and claimed mock USDC on
Hyperliquid testnet. Phase 2a is now unblocked on the funding side.

### Day status — done / to do

| # | Task | Status |
|---|------|--------|
| 1 | Git maintenance: push docs to main, stale `.git/*.lock` cleanup | ✅ Done |
| 2 | Port move 3000 → 3100 (verex conflict) — app, env, iOS, README | ✅ Done |
| 3 | Design §3: `/market` = Hyperliquid orderbook + IndexCards (REST 5s poll) | ✅ Done |
| 4 | Default market → ETC perp + 5-sig-fig price formatter | ✅ Done |
| 5 | `middleware.ts`: `/api/indices` + `/api/orderbook` made public | ✅ Done |
| 6 | Perp-trading research + requirements summary in design §3 | ✅ Done |
| 7 | Decision recorded: Phase 2a direct signing → 2b agent wallet (Task 3-P2) | ✅ Done |
| 8 | Phase 2a spec (TradePanel, SDK signing, split network env) | ✅ Done |
| 9 | Wallet track: HL-TEST, Arbitrum funding, mainnet deposit, testnet faucet | ✅ Done (jay) |
| 10 | **Phase 2a build**: TradePanel + `NEXT_PUBLIC_HL_TRADE_API` + place/cancel on testnet | ⬜ To do (next) |
| 11 | Phase 2b: agent wallet (popup-free signing) | ⬜ To do (later) |
| 12 | WebSocket book + market picker on `/market` | ⬜ To do (later) |
| 13 | Google OAuth redirect URI → 3100 (cloud mode only) | ⬜ To do (jay) |
| 14 | Open question: remove IndexCards from `/summary` (§1 "move widgets")? | ⬜ Open |
| 15 | Merge `claude/2026-07-07-session` → `main` when done | ⬜ Pending |

### Design: staging domain staging.rabbit.jaylabs.xyz (new §11)

Source: jay's request; design in [tasks/jun-30-rabbit-design.md §11](../tasks/jun-30-rabbit-design.md).
Gotcha (verified in GCP docs): Cloud Run built-in domain mapping does not support asia-northeast3
(Seoul) — the rabbit service's region. Recommended path: Firebase Hosting rewrite → Cloud Run
(~free, any region); LB (~$18+/mo) and region move rejected as overkill/lossy.

### Spec: Phase 2a perp trading written into design §3 (Task 3-P2)

Source: jay's go-ahead; spec appended under Task 3-P2 in
[tasks/jun-30-rabbit-design.md §3](../tasks/jun-30-rabbit-design.md). Key spec decisions:
client-side-only signing via a maintained TS SDK (no hand-rolled msgpack/EIP-712, no server
proxy); split networks — display stays on mainnet `HL_API_URL`, trading gets
`NEXT_PUBLIC_HL_TRADE_API` (testnet); funding via HL testnet faucet (clarified: Alchemy/Sepolia
testnet ETH is unusable on HL's own chain). Done-when: place + cancel a small testnet limit order.
