# Rabbit — Hyperliquid advanced market and trading

- **Parent:** [Portfolio & Market — Market section](../../features/portfolio-and-market.md)
- **Status:** detailed implementation design — ready to build in milestones
- **Reviewed:** 2026-07-20 against the current Rabbit code and official Hyperliquid API docs
- **Scope:** evolve `/market` from its ETH order-book panel into a simple **ETH-PERP HTS**
  integrated with Hyperliquid; prove direct trading on testnet, then release mainnet trading

Here, **HTS** means a Home Trading System-style terminal: a compact page for market data, order
entry, positions, open orders, and fills—not a separate exchange or custody service.

## 1. Outcome

`/market` becomes one coherent Hyperliquid workspace:

1. Open **ETH-PERP by default**. Multi-market selection is a later enhancement, not an HTS v1
   requirement.
2. See a live order book, recent trades, mark/index price, funding, open interest, and data age.
3. Connect MetaMask and inspect the matching Hyperliquid account, positions, and open orders.
4. On **testnet**, place and cancel a correctly rounded ETH-PERP limit order with an explicit
   MetaMask signature.
5. After the testnet release gates pass, enable the same direct-signing flow on **mainnet** with
   real-USDC warnings and conservative defaults.
6. Add advanced order controls only after both direct-signing paths are reliable.
7. Later, optionally approve an API/agent wallet for popup-free trading without adding any
   withdrawal or transfer surface to Rabbit.

This is a trading interface, not an execution strategy or an autonomous trading bot. It must
never silently submit, repeat, resize, or change an order.

## 2. Baseline: what already exists

| Area | Current implementation | Limitation |
|---|---|---|
| Market page | `app/market/page.tsx` | Fixed to ETH as of 2026-07-20; no shared HTS workspace state yet |
| Order book | `app/market/OrderBook.tsx` | REST snapshot every 5 seconds; eight visible levels |
| Public proxy | `app/api/orderbook/route.ts` | One `l2Book` request; no shared metadata or freshness contract |
| Hyperliquid client | `lib/hyperliquid.ts` | Useful read helpers, but uses broad `any` types and mixes concerns |
| Perp details | `/perp` + `/api/perp` | Fixed to ETH and separate from `/market` |
| Trading | Design only | No wallet connection, signing, order submission, cancellation, or order state |

The July 7 milestone proved that the public Hyperliquid info endpoint and an L2 order book work.
A live read-only check on 2026-07-20 confirmed that **ETH/USDC perpetuals** expose a non-empty
book, mark/index prices, one-hour funding, and open interest. Live values are intentionally not
stored here because they expire immediately. The page default was changed from ETC to ETH on
2026-07-20; the remaining work turns that read-only panel into the planned HTS.

## 3. Product boundaries and decisions

### 3.1 ETH first; testnet first, mainnet after a release gate

- The initial HTS has one product: **ETH-PERP**. Do not add a market selector until ETH trading is
  stable.
- Public/logged-out users may see **Mainnet · Read only** ETH data.
- Authenticated trading development begins in **Testnet · Trading** mode with mock collateral.
- **Mainnet · Trading** is added as a later explicit mode after H3 approval; it is never an
  automatic promotion of the testnet setting.
- Switching mode changes the complete workspace data source: metadata, book, trades, context,
  account state, open orders, positions, and the exchange endpoint.
- Never show a mainnet book beside a testnet order ticket. A price copied from the wrong network
  can produce a nonsensical or immediately executable order.
- Mainnet order submission stays build-disabled until the testnet checklist is complete and jay
  explicitly approves enabling it. After release, testnet remains available as a safe practice
  environment.

### 3.2 Browser-to-Hyperliquid order flow

- Public reads may use Rabbit's server proxy or the browser WebSocket.
- Signed order and cancel actions go from the browser directly to Hyperliquid.
- Rabbit's server must not receive the MetaMask private key, agent private key, raw signing
  material, or a reusable signed action.
- Use an existing SDK for signing. Hyperliquid explicitly warns that its signing formats are easy
  to implement incorrectly; do not hand-roll msgpack hashing or EIP-712 payload construction.
- The TypeScript SDK is community-maintained, so pin an exact version after a compatibility spike
  and wrap only the small surface Rabbit needs.

### 3.3 Progressive order capability

Ship the safest useful subset first:

1. Limit GTC order
2. Cancel order
3. Post-only (ALO) and reduce-only
4. IOC and capped-slippage market order
5. Modify order
6. TP/SL
7. Agent-wallet execution

Do not build TWAP, vault trading, subaccounts, builder fees, portfolio margin, deposits, transfers,
or withdrawals in this feature.

### 3.4 Existing routes

- Build the new experience in `/market`.
- Reuse the useful context and position logic from `/perp`.
- Do not delete or redirect `/perp` as part of the first milestone; route cleanup is a separate,
  reviewable change after feature parity is proven.

### 3.5 Integration choice: Hyperliquid API + browser signer

Rabbit does not need a conventional exchange API key for the direct-signer release. A centralized
exchange API key is normally an opaque credential copied from an exchange dashboard and stored by
the application. Hyperliquid instead separates unauthenticated reads from cryptographically signed
writes:

- **Public market data:** Hyperliquid `POST /info` plus its WebSocket subscriptions; no wallet or
  credential is required.
- **Account reads:** the connected public account address is passed to info requests and user
  subscriptions; a signature is not required to read balances, positions, orders, or fills.
- **Trading authentication:** MetaMask signs the exact Hyperliquid order or cancel action in the
  browser. Connecting a wallet alone does not authorize a trade.
- **Order transport:** a pinned TypeScript SDK serializes the action, requests the correct typed-data
  signature, and sends the signed envelope to `POST /exchange`.
- **Rabbit backend:** serves the page and a REST fallback for public reads only. It does not hold the
  master key, request a seed phrase, receive direct-signer payloads, or submit orders for the user.

This is still authenticated trading: the wallet signature replaces the conventional API-key
credential. The private key never leaves MetaMask, and an ordinary HyperCore order/cancel signature
is not an EVM token transfer. Nevertheless, a signature is security-sensitive authorization. Keep
it only in memory for the active request and never send it to Rabbit logs, analytics, error
reporting, storage, or a server proxy.

#### 3.5.1 Read paths

Use two read paths with one normalized client-side data model:

```text
Primary live path
Rabbit browser → Hyperliquid WebSocket → book, trades, asset context, account updates

Bootstrap/recovery path
Rabbit browser or Rabbit REST fallback → Hyperliquid POST /info → snapshot/reconciliation
```

The logged-out page can subscribe to ETH book and market data immediately. After the user clicks
`Connect MetaMask`, Rabbit obtains the public address and adds user-scoped reads such as
clearinghouse state, frontend open orders, fills, and order status. The address is not a secret,
but it is user-linked data; do not place the full address in routine analytics or server logs.

Always query account state with the **master or actual subaccount address**. Hyperliquid's API-wallet
documentation warns that querying with an agent/API-wallet signer address returns empty account
state. HTS v1 supports the directly connected master account only; subaccount and vault selection
remain out of scope.

#### 3.5.2 Direct order path, step by step

For one ETH-PERP limit order:

1. The user enters side, price, size, time-in-force, and reduce-only state in Rabbit.
2. Rabbit's browser code resolves ETH's asset index and `szDecimals` from the selected network's
   metadata. It does not reuse IDs or precision from the other network.
3. The browser validates and canonicalizes decimal strings, checks freshness/account state, creates
   a unique CLOID, and presents the final asset, network, side, normalized price, normalized size,
   notional, and account in Rabbit's confirmation modal.
4. Only after confirmation does the SDK build the Hyperliquid `order` action. The action contains
   the asset index, buy/sell flag, price, size, reduce-only flag, order type, and CLOID.
5. The SDK creates a unique millisecond-based nonce and performs Hyperliquid's required
   serialization, hashing, signing-scheme selection, and EIP-712 typed-data construction. Rabbit
   must not reproduce these internals.
6. MetaMask shows a signature request. If the user rejects, Rabbit returns to `ready`; there must be
   no `POST /exchange` request.
7. After approval, the SDK sends an envelope containing `action`, `nonce`, `signature`, and, when
   intentionally configured, optional `vaultAddress` or `expiresAfter` fields to the selected
   network's `/exchange` endpoint.
8. Rabbit parses every status in the response. A resting or filled response updates the ticket;
   a rejection maps to a specific UI error. A timeout or lost response becomes `outcome_unknown`.
9. Rabbit reconciles the result through user updates and `POST /info` order-status lookup by CLOID.
   It never automatically signs or submits a replacement order.

Cancel follows the same boundary: the user chooses one visible order, Rabbit confirms the correct
network/asset/order, MetaMask signs a distinct `cancel` action, and the client sends it directly to
Hyperliquid. One MetaMask popup per order or cancel is expected in this release.

```text
order draft
  → Rabbit browser validation and confirmation
  → pinned SDK constructs the action
  → MetaMask signs typed data
  → pinned SDK POSTs to Hyperliquid /exchange
  → WebSocket + /info reconcile the result

Rabbit server is not on this signed-write path.
```

#### 3.5.3 SDK selection and wrapper boundary

Hyperliquid's official API overview lists `@nktkas/hyperliquid` as a community TypeScript SDK; it
is not maintained or warranted by Hyperliquid. The SDK currently documents all three client
surfaces Rabbit needs:

- `InfoClient` + `HttpTransport` for snapshots and reconciliation;
- `SubscriptionClient` + `WebSocketTransport` for live streams;
- `ExchangeClient` + an ethers v6 signer for signed actions.

Its browser example uses ethers v6 `BrowserProvider(window.ethereum)` followed by
`provider.getSigner()`, which matches Rabbit's existing ethers v6 dependency and MetaMask's injected
provider. Treat that documented path as the first H0 candidate, not as proof that it works in
Rabbit's Next.js client bundle. At the 2026-07-20 review, the latest observed release is `0.33.2`;
H0 must test and record the exact accepted version before adding it with an exact dependency and
lockfile entry.

Keep the third-party surface behind a small Rabbit-owned adapter. UI components should call
Rabbit-level operations such as `connect`, `loadAccount`, `placeLimitOrder`, `cancelOrder`, and
`getOrderStatus`; they should not import SDK signing utilities or construct raw exchange payloads.
This boundary gives Rabbit one place to enforce network selection, asset lookup, decimal
normalization, CLOIDs, error mapping, and safe upgrade tests.

H0 must prove all of the following in the actual Rabbit browser build:

1. The selected exact SDK version builds under Rabbit's Next.js/TypeScript/Node toolchain without
   pulling server-only code into the client bundle.
2. `BrowserProvider` obtains the expected MetaMask address and `ExchangeClient` accepts its ethers
   v6 signer without exposing the private key.
3. Testnet endpoint selection affects info, WebSocket, and exchange clients together.
4. A small resting ETH-PERP testnet order produces one MetaMask prompt, appears in account reads,
   and can be canceled with a second prompt.
5. Account change, disconnect, or network-mode change destroys the old exchange client, clears
   user-scoped state and drafts, and requires fresh confirmation.
6. Wallet rejection causes no network submission; ambiguous transport failure is reconciled by
   CLOID without an automatic retry.
7. Direct browser HTTP and WebSocket access works in the deployed Cloud Run origin, not only on
   localhost.

If this documented ethers v6 path fails, first determine whether the problem is the pinned SDK
version, browser bundling, injected-provider adaptation, or Hyperliquid API compatibility. Make only
the smallest adapter around the SDK's supported signer interface. If correct signing would require
Rabbit to manually implement msgpack field ordering, action hashing, phantom-agent construction, or
EIP-712 domain logic, stop H0 and revise the integration choice; do not hand-build signing.

#### 3.5.4 Trust boundary

| Component | May handle | Must not handle |
|---|---|---|
| MetaMask | Private key, typed-data request, user approval | Rabbit application secrets or silent approvals |
| Rabbit browser | Public address, draft, normalized action, transient signature/result | Seed phrase, exported master private key, persisted raw signature |
| Hyperliquid API | Public reads, signed action envelope | Rabbit authentication session or application database credentials |
| Rabbit server | Static/page delivery, public REST fallback, sanitized operational errors | Master/agent key, direct-signer action/signature, order submission |
| Logs/analytics | Network, action category, latency, sanitized error category | Full address, exact order contents, CLOID, nonce, or signature |

The later agent/API-wallet release is a different signing mode, not a conventional dashboard API
key. It introduces a separate approved keypair that can sign on behalf of the master account and
therefore requires its own storage, expiry, rotation, and revocation threat model. Do not let its
future requirements weaken the direct MetaMask boundary described here.

### 3.6 Testnet trading: end-to-end user flow

Testnet is the first executable release and uses mock funds.

1. Open the [official Hyperliquid testnet app](https://app.hyperliquid-testnet.xyz/) with the same
   MetaMask account intended for Rabbit.
2. Enable trading if Hyperliquid requests the gasless activation signature.
3. Obtain mock USDC through the official testnet Drip/faucet. Faucet rules can change, so link to
   the official testnet onboarding page instead of reproducing eligibility assumptions in Rabbit.
4. Open Rabbit `/market`; it defaults to `ETH-PERP` and shows `TESTNET · MOCK USDC` beside every
   order control.
5. Connect MetaMask. Rabbit reads the **master account address** for balances, positions, orders,
   and fills.
6. Fetch testnet metadata and resolve ETH's asset ID and `szDecimals`; never reuse mainnet IDs.
7. Enter a small ETH limit order. Rabbit normalizes price/size, shows notional and account, then
   requests one signature.
8. The SDK sends the signed `order` action directly to the testnet `/exchange` endpoint.
9. Confirm the resting/filled result through order updates and reconciliation; then cancel the
   resting remainder through a second explicit signature.
10. If a test fills, close the position deliberately and confirm that position size returns to
    zero before ending the test.

No Sepolia ETH or HyperEVM gas is required for ordinary HyperCore order signatures. The official
testnet app/faucet remains the onboarding source of truth.

### 3.7 Mainnet trading: controlled release flow

Mainnet uses real collateral and real PnL. Rabbit should add it only after H2 testnet behavior is
stable.

1. Keep the first mainnet release on **direct MetaMask signing**; agent-wallet automation remains
   disabled.
2. Complete Hyperliquid's normal wallet onboarding/`Enable Trading` flow in the
   [official mainnet app](https://app.hyperliquid.xyz/trade) if the account is new.
3. Fund the account outside Rabbit. The canonical USDC path is native USDC on Arbitrum plus ETH
   for the deposit transaction, then deposit through the official Hyperliquid UI. Hyperliquid's
   bridge documentation currently states a 5 USDC minimum; confirm the current UI before sending.
4. Do not add deposit, withdrawal, transfer, or bridging controls to Rabbit's HTS. Rabbit trades
   only after collateral is already visible in the Hyperliquid account.
5. Enable a build setting such as `NEXT_PUBLIC_HL_MAINNET_TRADING_ENABLED=true`. This is a UI
   release gate, not a cryptographic security boundary.
6. When the user selects mainnet, reload **all** metadata, ETH book/context, account state, orders,
   and endpoints from mainnet. Clear every testnet draft and confirmation.
7. Show `MAINNET · REAL USDC` in the header, ticket, confirmation modal, and submit button.
8. Require an additional first-session acknowledgement such as `I understand this uses real
   funds`; never persist a global “skip all confirmations” setting.
9. Start with a small passive ETH limit order and direct signature, verify it appears on the
   official Hyperliquid mainnet UI, then cancel it. Enable more aggressive types only afterward.

Recommended mainnet v1 guardrails:

- limit GTC and cancel only;
- explicit notional display and configurable local maximum-notional warning;
- show current leverage/margin mode but do not mutate it automatically;
- no market order, TP/SL, agent wallet, or automatic retry;
- no order submission while data is stale or the account state has not loaded;
- testnet remains the default development environment even after mainnet ships.

### 3.8 Environment and release settings

```dotenv
# Public endpoint selection; no secret is stored here.
NEXT_PUBLIC_HL_DEFAULT_NETWORK=testnet

# false until testnet H2 and the mainnet H3 checklist pass.
NEXT_PUBLIC_HL_MAINNET_TRADING_ENABLED=false
```

These flags control Rabbit's UI. They do not protect funds by themselves: the wallet signature,
clear confirmation, correct endpoint, correct asset metadata, and user review are still required.

## 4. Target experience

### 4.1 Simple HTS desktop layout

```text
┌ ETH-PERP ─ mark ─ funding ─ OI ─ TESTNET/MAINNET ─ Connect wallet ────────┐
├────────────────────┬──────────────────────────────┬─────────────────────────┤
│ ETH order book     │ Simple ETH chart / trades    │ ETH trade ticket        │
│ asks · spread      │ mark/index + feed age        │ Long/Short · px · size  │
│ bids · depth       │ Live / reconnect / stale     │ notional · confirmation │
├────────────────────┴──────────────────────────────┴─────────────────────────┤
│ Positions · Open orders · Recent fills                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

On narrow screens, stack context → ticket → positions/orders → book/trades. The submit button and
network label must remain visible without relying on color alone. “Simple HTS” means a compact
trading terminal, not a clone of every Hyperliquid screen.

### 4.2 Market header

- Fixed `ETH-PERP` title in HTS v1; add the metadata-backed selector later.
- Explicit badges: `MAINNET · READ ONLY`, `TESTNET · MOCK USDC`, or
  `MAINNET · REAL USDC`.
- Connection state: `Live`, `Reconnecting`, `REST fallback`, or `Stale`.
- Last server timestamp and local receipt age.
- If ETH is unexpectedly absent from the active network metadata, disable the ticket and show the
  reason. Never silently fall back to another asset.

### 4.3 Market data

Show:

- best bid, best ask, mid, absolute spread, and spread percentage;
- configurable visible depth: 8, 15, or 30 levels;
- per-level size and cumulative size/depth;
- recent trades with price, size, side, and exchange timestamp;
- mark price, index/oracle price, one-hour funding, optional normalized 8-hour funding, and OI;
- a small candle chart after the book and trading path are stable.

Funding is a signed rate, not a generic percentage change. Label its interval. Open interest must
be labeled in both asset units and USD when both values are available.

### 4.4 Trade ticket

Initial fields:

| Field | Rules |
|---|---|
| Side | Buy/Long or Sell/Short; selected explicitly |
| Order type | Limit first; Market remains hidden until capped-slippage IOC is implemented |
| Time in force | GTC first, then ALO and IOC |
| Price | Prefill from the same-network best ask for Buy or best bid for Sell |
| Size | Asset units; rounded down to the selected asset's `szDecimals` |
| Reduce only | Off by default; clearly describe that it cannot increase the position |
| Notional | `price × size`, shown before signature |

The confirmation area repeats network, market, side, type, price, size, notional, reduce-only
state, and connected address. A submission requires one deliberate click followed by the wallet
signature; pressing Enter in a text field must not submit an order.

### 4.5 Positions, orders, and fills

- Positions: side, size, entry, mark, leverage, liquidation price, margin used, unrealized PnL,
  and a reduce-only close shortcut that opens a prefilled ticket rather than submitting.
- Open orders: side, remaining/original size, price, type/TIF, age, OID/CLOID, and Cancel.
- Recent fills: side, price, size, fee, realized PnL when provided, and timestamp.
- User-specific WebSocket subscriptions update these tables; REST/info reads reconcile them after
  reconnect or when the page regains focus.

### 4.6 HTS v1: required versus deferred

| Required for the first simple HTS | Deferred until the direct flow is stable |
|---|---|
| ETH-PERP only | Multi-market selector |
| Network and real/mock-money badges | User-customizable layouts |
| Mark, index, funding, OI, feed age | Advanced analytics and indicators |
| Live book and recent trades | Full TradingView-style chart tooling |
| Limit GTC ticket and cancel | Market, ALO, IOC, modify, TP/SL |
| Account value, ETH position, open orders, fills | Portfolio margin, subaccounts, vaults |
| Explicit MetaMask signature | Agent/API wallet |

Use Hyperliquid data directly rather than adding another paid market-data vendor. A minimal candle
chart can use the official candle stream/snapshot after the book and trade ticket work; a plain
price line is sufficient for HTS v1.

## 5. Data and execution architecture

```text
Browser `/market`
  ├─ Market metadata/context ── REST info endpoint (initial + reconciliation)
  ├─ Book/trades/candles ────── Hyperliquid WebSocket (primary)
  ├─ Book snapshot fallback ─── Rabbit `/api/orderbook` → info endpoint
  ├─ User state streams ─────── Hyperliquid WebSocket after wallet connect
  └─ Signed actions ─────────── TypeScript SDK → Hyperliquid `/exchange`

Rabbit server
  ├─ serves the app and public REST fallback
  ├─ validates public query parameters and bounds
  └─ stores no trading key and submits no user order in the direct-signing phase
```

### 5.1 Network configuration

Expose a small enum rather than an arbitrary client-supplied host:

```ts
type HyperliquidNetwork = "mainnet" | "testnet";

const HL_ENDPOINTS = {
  mainnet: {
    http: "https://api.hyperliquid.xyz",
    ws: "wss://api.hyperliquid.xyz/ws",
  },
  testnet: {
    http: "https://api.hyperliquid-testnet.xyz",
    ws: "wss://api.hyperliquid-testnet.xyz/ws",
  },
} as const;
```

Do not accept a URL from search parameters. The selected network may be stored as a harmless user
preference, but it must not enable mainnet trading when the build flag disables it.

### 5.2 Hyperliquid calls used by the HTS

| Need | Hyperliquid surface | Rabbit usage |
|---|---|---|
| Markets and precision | `/info` → `meta` / `metaAndAssetCtxs` | Resolve ETH asset ID, `szDecimals`, leverage/context |
| Initial/fallback book | `/info` → `l2Book` | Snapshot and REST fallback |
| Live book/trades/chart | WebSocket `l2Book`, `trades`, later `candle` | Primary public HTS feed |
| Account and positions | `/info` account state using master address | Balance, ETH position, margin data |
| Orders and fills | info reads + `orderUpdates` / `userFills` subscriptions | Tables and reconciliation |
| Place order | `/exchange` `order` action through SDK | Direct MetaMask/API-wallet signature |
| Cancel order | `/exchange` `cancel` action through SDK | Explicit signature and CLOID/OID tracking |
| Resolve ambiguity | `/info` order status by OID/CLOID | Prevent duplicate retries |

The same call shapes are used on both networks; only the fixed HTTP/WebSocket base URLs, metadata,
account state, and signing domain/network value differ. Never send a testnet-signed workflow to a
mainnet endpoint or vice versa.

### 5.3 Typed domain model

Normalize Hyperliquid's string-encoded numbers at the boundary, but retain the original decimal
strings for signing. JavaScript `number` is acceptable for display calculations, not for producing
signed price or size strings.

```ts
type MarketMeta = {
  coin: string;
  assetId: number;
  szDecimals: number;
  maxLeverage: number;
};

type OrderDraft = {
  coin: string;
  side: "buy" | "sell";
  type: "limit";
  tif: "Gtc" | "Alo" | "Ioc";
  price: string;
  size: string;
  reduceOnly: boolean;
};
```

The metadata universe determines `assetId`; never keep a permanent handwritten coin-to-index map
because mainnet and testnet universes can differ.

### 5.4 WebSocket lifecycle

Subscribe only to what the visible workspace needs:

- public: `l2Book`, `trades`, and later `candle`;
- user: `orderUpdates`, `userFills`, and a supported account-state feed.

Required behavior:

1. Connect and wait for subscription acknowledgements.
2. Record exchange timestamps and local receipt times.
3. Send a ping before 60 seconds of outbound silence and accept `pong`.
4. On disconnect, mark data stale immediately and reconnect with bounded exponential backoff plus
   jitter.
5. After reconnect, accept the snapshot acknowledgement and run REST reconciliation for open
   orders and account state.
6. Unsubscribe or close when the selected network/market/user changes.
7. Fall back to the current REST book polling after repeated failures; never present fallback data
   as `Live`.

### 5.5 Rate-limit budget

Hyperliquid currently documents a shared REST weight limit, connection/subscription limits, and
address-based action limits. Rabbit should stay comfortably below them:

- one shared browser WebSocket per page, not one socket per component;
- one subscription per visible stream;
- metadata once at startup/network change, then cache for the session;
- REST reconciliation on connect, reconnect, focus, and explicit refresh—not every render;
- no automatic action retries after an ambiguous response;
- deduplicate cancel clicks while a cancel is pending.

## 6. Precision and pre-trade validation

Validation must happen before asking for a signature and again through the SDK/exchange response.

### 6.1 Size

- Fetch `szDecimals` from the current network's metadata.
- Round down to `szDecimals`; never round up into a larger order.
- Reject zero after rounding.
- Keep the canonical string without exponent notation.

### 6.2 Price

For perpetuals, the official rule is:

- no more than five significant figures;
- no more than `6 - szDecimals` decimal places;
- integer prices are allowed;
- remove trailing zeroes before signing.

Display the normalized value before signature. Do not mutate the price after the user confirms it.

### 6.3 Notional and account checks

- Require at least the exchange's current minimum perpetual notional; the documented value is
  currently $10, but exchange rejection remains authoritative.
- Reject non-finite, negative, or empty input.
- Show insufficient-margin, reduce-only, tick-size, oracle-distance, post-only, IOC, and OI-cap
  failures as specific user-facing messages.
- Do not promise that client validation guarantees acceptance; margin, oracle, and OI conditions
  can change between confirmation and execution.

### 6.4 Market orders

Hyperliquid order actions are expressed using limit-order parameters. Rabbit's future `Market`
control must therefore create an IOC limit with an explicit maximum slippage cap derived from the
same-network reference price. Show that worst acceptable price before signing. Never submit an
unbounded price.

## 7. Signing and order state

### 7.1 SDK compatibility spike

Before building the full ticket:

1. Pin a selected TypeScript SDK version.
2. Confirm it accepts an ethers v6 browser signer or add the smallest adapter.
3. On Hyperliquid testnet, place one resting order and cancel it.
4. Capture sanitized request/response fixtures for tests; do not store addresses or signatures if
   they are not needed by the fixture.
5. Confirm mainnet/testnet domains, nonce handling, asset lookup, and number serialization.

If the SDK cannot support MetaMask direct signing cleanly, stop and revise the signer design.
Do not replace it with a hand-built signing implementation merely to keep the milestone moving.

### 7.2 Client order IDs and duplicate protection

- Generate a unique 128-bit hexadecimal CLOID for every new order attempt.
- Keep the draft and CLOID stable while awaiting a signature.
- Disable the submit button during signing/submission.
- Never retry an exchange action automatically after a timeout or lost response.
- Reconcile using CLOID/order status before offering a manual retry.
- A new explicit retry gets a new CLOID only after the prior outcome is known not to have landed.

### 7.3 State machine

```text
draft
  → invalid
  → ready
  → awaiting_signature
  → submitting
  → resting | filled | rejected | outcome_unknown

resting
  → cancel_awaiting_signature
  → cancel_submitting
  → canceled | filled | cancel_rejected | outcome_unknown
```

The UI must distinguish exchange rejection from transport failure. `outcome_unknown` requires
reconciliation, not optimistic success or automatic resubmission.

### 7.4 Direct signer: first release

- MetaMask/account connection is initiated by a user click.
- Verify the returned address and show a shortened plus copyable full form.
- Use the SDK's exact Hyperliquid signing domain; do not derive it from whichever EVM chain
  MetaMask currently displays.
- One popup per order/cancel is expected and described in the UI.
- Disconnect clears user state from the screen and closes user-specific subscriptions.

### 7.5 Agent/API wallet: later release

The master wallet approves an agent address once; the agent then signs the allowed trading
actions. Rabbit's product policy is narrower than the protocol surface:

- expose order, cancel, and modify only;
- never expose withdraw, transfer, agent approval chaining, vault, or staking actions;
- show agent address, approval status, creation time, and a prominent revoke/rotate flow;
- default to an expiry/session policy enforced by Rabbit even if the protocol approval is broader;
- do not store an agent private key as plaintext in `localStorage`, logs, analytics, database rows,
  or server environment variables.

Recommended first persistence design: generate the agent key in the browser, encrypt it with a
user-supplied passphrase using WebCrypto, and store only the encrypted blob in IndexedDB. Keep the
decrypted key in memory for the active session. This requires a separate threat-model review before
implementation; direct signing remains the safe fallback.

## 8. Error, stale-data, and recovery UX

| Condition | UI behavior |
|---|---|
| WebSocket disconnected | Mark book/trades stale, freeze age indicator, start reconnect |
| REST fallback active | Show `REST fallback` and its slower refresh interval |
| Data older than threshold | Disable price-prefill refresh and require manual review before signing |
| Wallet account changed | Cancel the local draft confirmation and reload user state |
| Network mode changed | Clear book, context, user state, and draft before reconnecting |
| Signature rejected | Return to editable draft; do not call the exchange |
| Exchange rejects order | Keep draft and show the mapped exchange reason |
| Submit result unknown | Lock retry, query status by CLOID, then resolve or allow a new attempt |
| Partial fill | Show filled and remaining sizes; cancellation applies only to the remainder |

Error messages must be actionable and must not display raw signed payloads, signatures, or private
keys. Developer logging may include network, coin, CLOID, action type, latency, and sanitized error
category.

## 9. Suggested file plan

Keep the first change small; split `lib/hyperliquid.ts` only when the new responsibilities arrive.

```text
app/market/
  MarketWorkspace.tsx       network, market, wallet, and shared feed state
  MarketSelector.tsx
  MarketContext.tsx
  OrderBook.tsx             evolve existing component
  RecentTrades.tsx
  TradeTicket.tsx
  PositionsTable.tsx
  OpenOrdersTable.tsx
  RecentFillsTable.tsx

lib/hyperliquid/
  endpoints.ts              fixed network → HTTP/WS mapping
  types.ts                  normalized domain types
  info.ts                   metadata, context, book, account reconciliation
  websocket.ts              one connection + subscriptions + reconnect
  precision.ts              deterministic string normalization/validation
  exchange.ts               narrow SDK adapter: order/cancel/status
  errors.ts                 exchange error → UI category
```

During migration, preserve `@/lib/hyperliquid` exports or update consumers in the same milestone.
Do not move unrelated market/index code.

## 10. Delivery milestones

### H0 — signing and metadata spike (0.5–1 day)

- Pin SDK and prove an ETH-PERP MetaMask testnet order + cancel.
- Fetch network-specific metadata and select asset IDs dynamically.
- Add precision/notional unit tests from documented examples.

**Exit:** one scripted/manual testnet round trip with sanitized fixtures and no handwritten signing.

### H1 — simple ETH HTS, read-only (1–1.5 days)

- Keep ETH as the fixed HTS v1 market and integrate the existing book into shared workspace state.
- Add network-aware metadata/context and the simple three-panel HTS layout.
- One shared WebSocket for `l2Book` and `trades`.
- Cumulative depth, spread percentage, funding, OI, freshness, reconnect, and REST fallback.
- Preserve public, logged-out access.

**Exit:** ETH book, context, compact chart/trades, and bottom tables share one network state;
disconnect/reconnect does not duplicate subscriptions; stale and fallback states are visible.

### H2 — direct-signed testnet trading (1.5–2 days)

- Connect MetaMask.
- Limit GTC ticket with deterministic normalization and confirmation.
- Open orders, positions, fills, cancel, CLOID reconciliation, and mapped errors.
- ETH trading build-locked to testnet with `TESTNET · MOCK USDC` at every action point.

**Exit:** place, observe, partially or fully fill when practical, cancel, and deliberately close an
ETH testnet position; a rejected signature or lost response never creates a duplicate order.

### H3 — guarded mainnet direct trading (0.5–1 day)

- Enable mainnet only through the release flag and explicit real-money acknowledgement.
- Use the same ETH ticket, SDK adapter, validation, state machine, and tables as testnet.
- Reload all data/account state on network switch and clear drafts.
- Keep limit GTC/cancel only; verify a small passive order against the official Hyperliquid UI.

**Exit:** one intentionally small ETH mainnet order can be placed and canceled without any
testnet/mainnet state leakage; disabling the flag removes the mainnet submit capability.

### H4 — safe advanced orders (1–1.5 days)

- ALO, IOC, reduce-only, modify.
- Capped-slippage market order.
- Leverage/margin presentation; add mutation controls only with dedicated validation.
- TP/SL after reduce-only behavior is covered by tests.

**Exit:** every advanced control has pre-trade confirmation, an exchange-error mapping, and a
testnet scenario.

### H5 — agent wallet (1–2 days, optional)

- Approval, encrypted local persistence, unlock, revoke/rotate, and session timeout.
- Reuse the H2–H4 ticket and exchange adapter; signer selection is the only execution change.

**Exit:** no plaintext key persists, direct signing remains available, and the UI exposes no
withdrawal or transfer action.

### H6 — release hardening (0.5–1 day)

- Accessibility and responsive pass.
- Structured, secret-safe telemetry.
- Opt-in testnet integration test and a manual release checklist.
- Update README, `.env.example`, feature index, and history after implementation—not before.

## 11. Verification matrix

### Unit

- price significant figures and decimal-place limits;
- size rounding down by `szDecimals`;
- trailing-zero removal and no exponent notation;
- notional threshold and empty/non-finite inputs;
- network-to-endpoint mapping;
- exchange error mapping;
- order/cancel state transitions and duplicate-click suppression.

### Fixture/contract

- metadata and context normalization;
- L2 book and trade message parsing;
- subscription acknowledgements and snapshots;
- resting, filled, partial-fill, rejected, cancel, and batch-error response shapes;
- unknown fields do not break parsing, but required missing fields fail visibly.

### Component

- changing market clears stale state and resubscribes once;
- changing network clears the draft and all user data;
- stale data disables automatic prefill;
- confirmation mirrors the exact normalized order;
- wallet rejection causes no exchange request;
- keyboard interaction cannot bypass confirmation.

### Testnet integration

- account with no balance;
- valid resting limit order and cancel;
- post-only rejection when it would cross;
- reduce-only rejection when it would increase exposure;
- insufficient margin and below-minimum-notional errors;
- reconnect while an order remains open;
- ambiguous submit response resolved by CLOID without resubmission.

### Mainnet canary

- mainnet mode is unavailable while the release flag is false;
- switching testnet → mainnet clears the draft, account state, and subscriptions;
- `MAINNET · REAL USDC` appears in the header, ticket, confirmation, and submit button;
- first-session real-money acknowledgement is required;
- one small passive ETH limit order appears in both Rabbit and the official Hyperliquid UI;
- cancel confirmation resolves the order and no automatic retry occurs;
- no deposit, withdrawal, transfer, or agent-wallet control is present.

### Release gates

- `pnpm build` with no hidden runtime initialization errors;
- no private key/signature in browser storage inspection, server logs, or telemetry;
- mainnet submit is hard-disabled until H3 and can be removed again through the release flag;
- public `/market` still works while logged out;
- testnet label is visible at every submission point;
- mainnet real-money label and acknowledgement are visible at every mainnet submission point;
- no unresolved order can be automatically retried.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Community TypeScript SDK changes | Pin version, narrow adapter, fixture tests, compatibility spike first |
| Wrong network or asset ID | Derive metadata per endpoint; one workspace network; clear state on switch |
| Precision/signing mismatch | Preserve decimal strings; centralized formatter; SDK signing only |
| Duplicate order after timeout | CLOID, explicit state machine, status reconciliation, no automatic retry |
| Stale book used for price | Timestamp/age state; same-network feed; disable stale prefill |
| WebSocket disconnect | Heartbeat, backoff+jitter, snapshot/reconciliation, labeled REST fallback |
| Agent key theft | Direct signer first; encrypted local blob; memory-only unlocked key; revoke path |
| Mainnet loss during development | Release flag, testnet first, real-money acknowledgement, passive limit canary, no advanced orders |
| UI scope becomes a full exchange clone | Enforce milestone order and explicit out-of-scope list |

## 13. Official references

- [Hyperliquid API overview](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api)
- [Info endpoint](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)
- [Exchange endpoint](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint)
- [Signing](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing)
- [Tick and lot size](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size)
- [Error responses](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/error-responses)
- [WebSocket](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket)
- [WebSocket subscriptions](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions)
- [Timeouts and heartbeats](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/timeouts-and-heartbeats)
- [Rate limits and user limits](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits)
- [Nonces and API wallets](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets)
- [How to start trading and fund mainnet](https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/how-to-start-trading)
- [Arbitrum USDC bridge details](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2)
- [`@nktkas/hyperliquid` repository and versioning notes](https://github.com/nktkas/hyperliquid)
- [`@nktkas/hyperliquid` client and browser-signer guide](https://nktkas.gitbook.io/hyperliquid/clients)
