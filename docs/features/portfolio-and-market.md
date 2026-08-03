# Portfolio & Market

Originally one merge task (below, historical); the two are now **separate pages** —
**Portfolio** (`/portfolio`, ✅ done) and **Market** (`/market`, 🟡 in progress, Hyperliquid
trading). This doc covers both.

## Portfolio (`/portfolio`) — ✅ Done (2026-06-30)
Merged **Investment Summary** (`/summary`) and **Portfolio** (`/dashboard`) into one page with
DB-backed persistence (Cloud SQL Postgres + Prisma; holdings keyed by user, survive refresh).
Details in [../history/2026-06-30-rabbit-history.md](../history/2026-06-30-rabbit-history.md).

## Market (`/market`) — 🟡 In progress — Hyperliquid orderbook + trading
**Canonical advanced implementation detail:**
[Hyperliquid advanced market and trading](../tasks/details/hyperliquid-advanced-market.md) —
network-safe workspace, WebSocket lifecycle, typed data model, direct-signing and agent-wallet
phases, validation rules, recovery behavior, tests, release gates. Use that page for new
implementation work; this section is the decision log.

**Status:**
- ✅ **Done (2026-07-07)** — orderbook (ETC perp, REST 5s poll) + index cards on `/market`.
- ✅ **Done (2026-07-21/22)** — `TradePanel.tsx`: MetaMask connect, one-time agent-wallet
  approval, perp + spot order placement/cancel, leverage control, via `@nktkas/hyperliquid`
  against HL testnet. Covers both direct wallet signing and the agent-wallet flow (see phases
  below).
- ⬜ **To do** — WebSocket book (replace 5s REST poll) → market picker (ETC/BTC/ETH…).

**Latest product decision (2026-07-20, ✅ applied):** default market is now **ETH perp** (was
ETC). Build a simple Hyperliquid-backed HTS, prove direct MetaMask trading on testnet, then
release a guarded mainnet direct-trading mode.

**Design:** server route proxies the Hyperliquid REST snapshot; render a compact L2 book above
the index cards. Public API → no key. `lib/hyperliquid.ts` + `fetchL2Book`; public
`app/api/orderbook` (`?coin=`); `app/market/OrderBook.tsx` polls every 5s (asks/spread/bids,
depth 8). Price formatter uses 5 significant figures (HL's rule) so sub-dollar ticks don't
collapse. `middleware.ts`: `/api/indices` + `/api/orderbook` in `PUBLIC_PATHS` so the public
`/market` page works logged-out.

### Trading — auth model & phases (2026-07-07 research)
Hyperliquid auth is **pure EIP-712 signatures** — no API key, no registration; the account
exists once funded.
- **Funding:** USDC on Arbitrum (+ a little ETH for gas) via the Hyperliquid bridge. Testnet
  first: `HL_API_URL=https://api.hyperliquid-testnet.xyz`, mock USDC from the testnet faucet
  (app.hyperliquid-testnet.xyz — may require a funded mainnet account as anti-spam; send a few
  USDC on Arbitrum first if rejected).
- **Signing model — decided (jay): (a) first, (b) later:**
  (a) **direct wallet signing** — MetaMask popup on every order, no key stored anywhere.
  (b) **agent (API) wallet** — one-time `approveAgent` signature, then an app-held agent key
  signs orders popup-free (trade-only, cannot withdraw; 1 unnamed + up to 3 named agents/account).
- **Client-side only** — browser → HL API directly (CORS-allowed, no server proxy, so no order
  flow touches the app server). HL's action signing is msgpack-hash → phantom-agent → EIP-712 —
  use a maintained SDK (`@nktkas/hyperliquid`, works with ethers v6 signers), don't hand-roll.
- **Networks split** so the public book stays real: display uses `HL_API_URL` (server,
  mainnet); trading uses client-side `NEXT_PUBLIC_HL_TRADE_API=https://api.hyperliquid-testnet.xyz`
  (public URL, not a secret) — TradePanel labeled "TESTNET" while set so.
- **Order rules:** price ≤ 5 significant figures · size rounded to the asset's `szDecimals` ·
  order value ≥ ~$10.
- **Account/funding:** MetaMask account = HL-TEST. Fund via the Hyperliquid testnet faucet
  specifically (not Alchemy/Sepolia ETH faucets — HL testnet is its own chain, trades mock USDC).
- **Agent-key storage:** browser localStorage vs server-encrypted (like the AI-chat keys in
  [ai-chat.md](ai-chat.md)) — localStorage chosen to avoid custody.

**July 21 request (jay):** trade Hyperliquid perps on `/market` on testnet with a test account
that already holds mock USDC (account in `.env` or similar) — placed above the ETH Perp info
section; basic default inputs/buttons where no UI was specified. Delivered via `TradePanel.tsx`
(see "Done" above).
