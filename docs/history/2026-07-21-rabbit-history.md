# 2026-07-21 — rabbit history

**Source docs:** [jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) — §3 Task 3-P2 (Phase 2a) + the "July 21 Request" block (currently under §4, to be relocated to §3 by jay).

### Market: Hyperliquid testnet TradePanel (Phase 2a, MetaMask signing)

Added `app/market/TradePanel.tsx` and rendered it **above** the ETH Perp orderbook on `/market`
(before `<OrderBook coin="ETH" />` in [app/market/page.tsx](../../app/market/page.tsx)).

- **Signing model (decided today):** user's **MetaMask direct signing** — popup per order, **no key
  stored**. This *reverses* the July 21 note's ".env test account" idea; jay agreed MetaMask is the
  safer, more educational choice (real dApp flow, no private key to manage). The `.env`-key path was
  only optimizing for demo convenience and wasn't worth storing a key for.
- **Client-side only:** browser talks to HL **testnet** directly via `@nktkas/hyperliquid` (added,
  v0.33.2) with an ethers v6 signer — our server never touches the order flow. Display orderbook
  stays server/mainnet; only trading is testnet (mock USDC). Prominent `TESTNET` badge.
- **Scope (Phase 2a "done when"):** connect MetaMask → place a Gtc limit order (side/size/price,
  price prefilled from `allMids`) → open orders table with per-order Cancel → withdrawable balance +
  position/uPnL for the coin. Asset index + `szDecimals` pulled from testnet `meta()`; HL price/size
  rules enforced (px ≤ 5 sig figs, size to szDecimals).
- **Verified:** `tsc --noEmit` clean; `/market` renders the panel above the orderbook, no console
  errors, and the no-wallet path shows a graceful "MetaMask not installed" message. Actual trading
  (connect → order → cancel) needs jay's funded testnet MetaMask account and can't be exercised here.
- **No env changes needed** (MetaMask approach stores nothing server-side). Not committed — left in
  the working tree on `claude/work-2026-07-21` for review.

### UI: shadcn-inspired restyle of the whole app (CSS-only)

Rewrote [app/globals.css](../../app/globals.css) to adopt shadcn/ui's neutral "zinc" design language
across all 32 components / 16 routes. **No new dependencies** (no Tailwind/Radix) — jay chose the
lightweight approach.

- **Method:** defined authentic shadcn tokens (`--background`, `--card`, `--primary`,
  `--primary-foreground`, `--ring`, `--radius`, `--muted-foreground`, …) for light + dark, then
  **aliased the app's legacy variable names** (`--bg`→`--card`, `--accent`→`--primary`, etc.) on top,
  so every component adopts the look with **zero markup changes**. Theming stays on
  `<html data-theme>`.
- **Refinements:** neutral primary buttons (dark-on-light / light-on-dark), transparent bordered
  inputs + styled `<select>` with a caret, focus rings via `color-mix`, larger radii, subtle card
  shadows, table row hover, `.ghost` as outline/ghost, `.trash` as destructive outline, and a base
  `a` rule so unclassed links join the neutral palette (killed the leftover browser-blue links).
- **Verified:** `/market` and `/` render cleanly in **both light and dark**, no console errors.
  Palette is now monochrome neutral; semantic green/red kept for pos/neg (finance). Not committed —
  same branch `claude/work-2026-07-21`.

### UI: fancier top nav — sticky glassy header + active-page pill

Nav felt flat, so upgraded it: wrapped the bar in `<header className="site-header">`
([app/Nav.tsx](../../app/Nav.tsx)) — full-width **sticky** header with `backdrop-filter` blur +
translucent bg + bottom border. Nav links became **pills** with hover backgrounds, and the current
route gets an **active pill** (`aria-current="page"`) via `usePathname()` in
[app/NavLinks.tsx](../../app/NavLinks.tsx). Styles in [app/globals.css](../../app/globals.css).
Verified light + dark, no console errors. Same branch.

### Fix: TradePanel reads Spot + Perp balance (0-balance confusion)

Symptom: panel showed **0 USDC** while the HL testnet site showed **999** for the same address
`0xD64a…069c` (wrong-account cause ruled out — address matched). Root cause: the testnet **faucet
credits the *Spot* balance**, but the panel only read `clearinghouseState.withdrawable` (**Perp**),
which is 0 until USDC is transferred Spot → Perp.

Fix in [app/market/TradePanel.tsx](../../app/market/TradePanel.tsx): also fetch
`spotClearinghouseState`, display **both** ("Perp X · Spot Y USDC"), and show a hint to transfer
Spot → Perp when funds sit in Spot (`perp < 1 && spot > 1`). `tsc` clean, page renders, no console
errors — actual values need jay's MetaMask connect to confirm. Same branch `claude/work-2026-07-21`.
Full-address API query still offered as the definitive check if needed.

### Feature: TradePanel now trades Perp AND Spot

Added a **Perp / Spot** toggle to [app/market/TradePanel.tsx](../../app/market/TradePanel.tsx).
Motivation: jay's mock USDC sits in **Spot**, so a Spot tab lets him trade it directly (no
Spot→Perp transfer needed).

- **Spot support:** loads `spotMetaAndAssetCtxs()`, builds the list of **USDC-quoted** pairs that
  have a live mid (tradeable), with a market dropdown (defaults to HYPE/USDC). Spot order asset id =
  `10000 + universe.index` (HL convention); size in base token, price rule uses `8 - szDecimals`
  decimals (perp uses `6 - szDecimals`). Cancel map (`nameToAsset`) covers both perp + spot open
  orders. Limit price prefills from the selected market's mid on mode/pair change.
- **Balances:** shows Perp + Spot USDC, highlighting the one that applies to the active mode; the
  "usable $" hint next to the order uses the active balance. Perp-only position/uPnL line kept.
- **Verified:** `tsc` clean, `/market` renders, no console errors. The connect → toggle → order
  flow needs jay's funded MetaMask to exercise. Same branch.

### Fix: Unified-account aware hint (removed wrong Spot→Perp advice)

jay's account is in **Unified** mode, so the earlier "transfer Spot → Perp" hint was wrong — the
unified pool already lets Spot USDC collateralize perps (no transfer needed). In
[app/market/TradePanel.tsx](../../app/market/TradePanel.tsx): replaced the red transfer instruction
with a muted note ("With a Unified account, your Spot USDC also collateralizes perps — order without
transferring"), and changed perp-mode **usable** to `perp + spot` so the "usable $" reflects the
unified collateral pool (~999) instead of the classic perp-only `withdrawable` (0). `tsc` clean, no
console errors. Same branch.

### Feature: Perp leverage + margin-mode control

Added a **Margin (Cross/Isolated) + Leverage** control to perp mode in
[app/market/TradePanel.tsx](../../app/market/TradePanel.tsx). Leverage is bounded by the asset's
`meta.universe[idx].maxLeverage` (and forced Isolated when `onlyIsolated`); a "Set leverage" button
fires HL's `updateLeverage({ asset, isCross, leverage })` action (one MetaMask signature) and
refreshes. Defaults to 3x cross on connect. `tsc` exit 0, page renders, no console errors. Same
branch `claude/work-2026-07-21`.

### Spot default → ETH/USDC + Unit-token display names

jay asked for an ETH/USDC spot default. I wrongly claimed testnet had no ETH/USDC — root cause:
HL shows **"ETH"** as the display name for the **Unit** token **UETH** (no token is literally named
"ETH"; the API only has UETH/ETHER), and testnet spot has 1600+ junk/duplicate tokens, so matching
by raw `token.name` was flaky. Fix in [app/market/TradePanel.tsx](../../app/market/TradePanel.tsx):
build tokens via an `index` map (not array position), add a Unit display map (UETH→ETH, UBTC→BTC,
USOL→SOL) so labels read like the HL UI, and default the spot pair to **ETH/USDC** (→ HYPE/USDC →
first). `tsc` exit 0, no console errors. Caveat: testnet also has fake "ETH"-named tokens; the
default lands on Unit UETH — jay to confirm it's the intended market. Same branch.

### Debug: surface real cause of "Failed to sign the typed data" error

jay hit `Failed to sign the typed data using the wallet` when placing a spot order. That string is a
**generic wrapper** the SDK (`@nktkas/hyperliquid` `signTypedData`) throws around the underlying
error, exposed on `error.cause` — my catch blocks only showed `e.message`, hiding the real reason.
Added an `errMsg(e)` helper that appends `error.cause`, switched all catch blocks to it, and added
`console.error("[TradePanel]", e)` so the full error (with cause) is inspectable. Now a retry will
show whether it's a MetaMask rejection (user closed/rejected the popup) or a genuine data/signing
issue. `tsc` exit 0, no console errors. Panel itself is working (connected, ETH/USDC, Spot 739.27
USDC shown). Same branch `claude/work-2026-07-21`.

### Root cause + fix: agent wallet (MetaMask can't sign HL orders)

Real signing error surfaced: `Provided chainId "1337" must match the active chainId "42161"`. HL L1
actions (order/cancel/updateLeverage) sign over an EIP-712 domain with **chainId 1337** (phantom
agent), but MetaMask refuses typed data whose domain chainId ≠ the wallet's active chain (Arbitrum
One 42161). **So MetaMask fundamentally cannot sign HL orders** — this is why HL's own site uses
agent wallets. (jay's original ".env stored key" instinct was actually correct.)

Fix (jay chose agent wallet) in [app/market/TradePanel.tsx](../../app/market/TradePanel.tsx):
- **`approveAgent`** is a *user-signed* action whose domain chainId = the wallet's active chain (the
  SDK's `resolveSignatureChainId` falls back to `getWalletChainId`), so **MetaMask signs it fine**.
- Generate a local agent key (`ethers Wallet.createRandom()`), stored in `localStorage` per master
  address (`hl_agent_<addr>`). One-time **"Enable trading"** button calls `approveAgent` (1 MetaMask
  popup); thereafter a second `ExchangeClient` built from the **agent key** signs all
  order/cancel/updateLeverage (L1) actions — no MetaMask, no chainId conflict, popup-free.
- UI gates the order form behind agent approval; balances/toggle still show pre-approval. Agent is
  **trade-only (cannot withdraw)**; testnet key. `tsc` exit 0; panel renders (transient SWC errors
  during editing were stale). Same branch.
