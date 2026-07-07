# Rabbit — Jun 30 Design

- **Source task file:** [jun-30-rabbit.md](jun-30-rabbit.md) · **IA:** [../features/README.md](../features/README.md)
- **Status:** design (for review)

## 0. Summary
Designs for the Jun 30 tasks: split **Portfolio & Market** into two categories + reorder the menu,
refine **auth / LLM gating**, build the **Market** page (Hyperliquid orderbook + indices), fix the
**Knowledge** page (serve `know.html`), add **KB-over-MCP/RAG** to AI Chat, an **AP2 Stripe**
settlement example, and an **ETC ERC-7702 / 7715** demo.

## 1. Split "Portfolio & Market" → Portfolio + Market
- **Status: ✅ Done** (2026-06-30)

**Now:** one item *Portfolio & Market* (`/portfolio`, stub). **Target:** two categories.
- **Portfolio** → `/portfolio` — holdings, P&L (**login-only**).
- **Market** → `/market` (new) — market data (indices + Hyperliquid orderbook, §3).

**New menu order:** `Knowledge · Portfolio · AI Chat · Game · Market · AP2 · XYZ · ETC`.
**Decided (jay):** **Home = `/`** (logo/profile entry, leads the bar) and **Verex = trailing
external link** after ETC. Full bar:
`Home · Knowledge · Portfolio · AI Chat · Game · Market · AP2 · XYZ · ETC · Verex ↗`.
**Work:** edit `app/Nav.tsx` MENU; create `/market`; move market widgets out of `/summary`; keep
`/portfolio` for holdings.
**✅ Done (2026-06-30):** `Nav.tsx` split + reordered; `/market` page added (stub — indices/orderbook
content is §3 / task 3); `/market` public + `/portfolio` still login-only in `middleware.ts`.
Verified on build + server (`/market` 200, `/portfolio` 302→/login).
**(2026-06-30 update: Knowledge category later removed from the menu — see §4; current bar omits 지식.)**

## 2. Auth + LLM gating
- **Status: ⬜ To do**

- **Login-only category:** **Portfolio** — its **menu item is hidden until login** (`authOnly` in
  `Nav.tsx`) **and** access-gated in `middleware.ts`. (AI Chat: menu stays visible, access-gated.)
- **AI Chat access model:**
  - To chat, the user selects a **Proprietary LLM** and supplies **their own API key**.
  - **Local LLM** works **only when the app runs on the local machine** (local mode — Ollama
    reachable at `localhost`). On the **cloud deployment** it's **shown but disabled** (no hosted OSS
    model provisioned yet) → selecting it there shows "not available in cloud yet".
  - **jay (`linked0@gmail.com`)** uses the **server-stored API key** for the proprietary LLM (no paste).
- **Design:** `lib/ai.ts` already abstracts providers. Add a key/source resolver:
  `jay → env secret` · `other user → own key, persisted per user, **encrypted at rest**` ·
  `Local LLM → enabled in local mode (Ollama at localhost), disabled in cloud`.
  Gate the stored-key path on `session.user.email === linked0@gmail.com`; detect mode via `appMode()`
  (`lib/mode.ts`) so the Local LLM option is live locally and inert in cloud.
- **Decided (jay):** **persist** users' keys — **encrypted at rest** (encryption key in env, never
  plaintext; a `userApiKey` field keyed by user). Proprietary provider = **current setting (OpenAI)**;
  add Anthropic later if wanted.

## 3. Market page — Hyperliquid orderbook + indices
- **Status: 🟡 In progress** (display done · trading to do)
  - ✅ **Done** (2026-07-07) — orderbook (ETC perp, REST 5s poll) + index cards on `/market`;
    3-P2 prep (research, 2a/2b decision, Phase 2a spec, HL-TEST wallet + testnet mock USDC)
  - ⬜ **To do** — Phase 2a TradePanel (**next**) → Phase 2b agent wallet → WebSocket book + market picker

- New `/market` shows:
  - **Important indices** — reuse `/summary`'s `IndexCards` (BTC · ETH · S&P 500 · KOSPI).
  - **Hyperliquid orderbook** — live L2 (bids/asks, maybe funding) for a chosen market. Reuse
    `app/api/perp` / `app/api/indices` if they fit, else add `app/api/orderbook` proxying
    Hyperliquid's public info endpoint.
- **Design:** server route proxies the Hyperliquid REST snapshot (or a WS client streams to the
  page); render a compact L2 book above the index cards. Public API → no key.
- **Decided (jay):** **REST poll first**, add **WebSocket** in a later step. Default market =
  **BTC perp** (most liquid) for the first cut.
**✅ Done (2026-07-07):** `lib/hyperliquid.ts` + `fetchL2Book` (l2Book info call, no cache);
new public `app/api/orderbook` (`?coin=`, default BTC); `app/market/OrderBook.tsx` polls it
every 5s (asks / spread / bids, depth 8); `/market` renders the book above the reused
`IndexCards`. **(2026-07-07 update, jay): default market on `/market` switched BTC → ETC perp**
(Ethereum Classic — live on HL, ~$7); price formatter changed to 5 significant figures (HL's
price rule) so sub-dollar ticks like 7.0283 don't collapse. `middleware.ts`: `/api/indices` + `/api/orderbook` added to PUBLIC_PATHS so the
public `/market` page can fetch them logged-out. Verified on build + dev server (book JSON 200
logged-out, `/market` 200, bad coin 400, `/portfolio` still 302). WS + market picker = later step.

**Perp trading from `/market` via MetaMask — requirements summary (2026-07-07 research):**
Hyperliquid auth is **pure EIP-712 signatures** — no API key, no registration; the account exists
once funded. To trade from `/market` with jay's MetaMask account:
- **jay provides / does:**
  1. **MetaMask EOA** = master account (MetaMask is officially supported).
  2. **Funding** — canonical path: USDC on **Arbitrum** (+ a little ETH for gas) deposited via the
     Hyperliquid bridge. **Dev order: testnet first** (matches the existing Phase-2 note in
     `lib/hyperliquid.ts`): set `HL_API_URL=https://api.hyperliquid-testnet.xyz` and claim mock
     USDC at the testnet faucet (app.hyperliquid-testnet.xyz — faucet may require a funded
     mainnet account as anti-spam).
  3. **Pick a signing model** — **✔ Decided (jay, 2026-07-07): (a) first, (b) later** (see the
     Phase-2 task split below):
     (a) **direct wallet signing** — MetaMask popup on *every* order; no key stored anywhere.
     (b) **agent (API) wallet** — one-time `approveAgent` signature in MetaMask, then an
     app-held agent key signs orders popup-free. Agents **can trade but cannot withdraw** to
     external addresses (1 unnamed + up to 3 named agents per account). Better UX; the cost is
     storing the agent key (browser localStorage vs server — server = custody, prefer client).
- **App work (Phase 2 outline):** wallet-connect (ethers v6 already a dep) → approve-agent flow →
  order form on `/market` → `POST /exchange` with `{action, nonce(ms timestamp, must match outer
  body and action), signature}`. Order constraints: price ≤ 5 significant figures, size rounded to
  the asset's `szDecimals`, ~$10 minimum order value. `HL_ACCOUNT_ADDRESS` (read-only positions)
  stays as-is; never put the MetaMask master key in env — only an agent key, testnet first.
- **Open (jay):** testnet-only first cut or straight to mainnet · where the agent key lives
  (localStorage vs server-encrypted like the AI-chat keys in §2) — only matters for Phase 2b.

**Task 3-P2 (added 2026-07-07): perp trading on `/market` — two phases (jay decided):**
- **Phase 2a — direct wallet signing (do first):** connect MetaMask on `/market` (ethers v6) →
  order form (side/size/price) → each order EIP-712-signed in a MetaMask popup → `POST /exchange`.
  No key ever stored; worst UX, simplest security. Testnet first (`HL_API_URL`).
- **Phase 2b — agent wallet (later):** one-time `approveAgent` in MetaMask, app-held agent key
  signs orders popup-free (trade-only, cannot withdraw). Reuses 2a's order form and exchange
  client — 2b only swaps the signer. Needs the agent-key storage decision (see Open).

**Phase 2a spec (2026-07-07, testnet-first):**
- **UI (`/market`):** a `TradePanel` client component under the orderbook — [Connect MetaMask] →
  shows connected address + HL testnet USDC balance → form: side (Buy/Sell) · size · limit price
  (prefilled from best bid/ask) → [Place order] fires one MetaMask signature popup per order.
  Below: open orders (with Cancel — also a popup) + current position for the connected address.
- **Signing/transport:** client-side only, browser → HL API directly (HL API allows CORS; no
  server proxy, so no order flow ever touches our server). HL's action signing is msgpack-hash →
  phantom-agent → EIP-712 — **don't hand-roll**; use a maintained TS SDK (e.g. `@nktkas/hyperliquid`,
  works with ethers v6 signers) for `order` / `cancel` actions + ms-timestamp nonces.
- **Networks (split, so the public book stays real):** display keeps `HL_API_URL` (server,
  mainnet); trading uses a new **`NEXT_PUBLIC_HL_TRADE_API=https://api.hyperliquid-testnet.xyz`**
  (client-side env — public URL, not a secret). TradePanel is labeled "TESTNET" while set so.
- **Account/funding (jay):** MetaMask account = HL-TEST (renamed spare, e.g. Trader-10). Fund via
  the **Hyperliquid testnet faucet** (app.hyperliquid-testnet.xyz → Drip) — **not** Alchemy/Sepolia
  ETH faucets: HL testnet is its own chain and trades mock USDC; external testnet ETH is unusable
  there. Faucet may require the address to hold mainnet funds (anti-spam) → if rejected, send a few
  USDC on Arbitrum from Jay first.
- **Order rules to enforce in the form:** price ≤ 5 significant figures · size rounded to the
  asset's `szDecimals` (from `meta`) · order value ≥ ~$10. Default coin on testnet: use ETC if
  listed there, else fall back to ETH (testnet universe differs from mainnet).
- **Out of scope for 2a:** agent wallet (2b) · WebSocket book · market picker · mainnet trading.
- **Done when:** on testnet, connect → place a small ETC/ETH limit order (MetaMask popup) → see it
  in open orders and on app.hyperliquid-testnet.xyz → cancel it → position/balance update.

## 4. Knowledge page — serve `know.html` (Fix: No content)
- **Status: ✅ Done** (2026-06-30; menu item later removed per jay — see note below)

**↺ Superseded (2026-06-30) — Knowledge category removed (restore when needed).** Per jay: the
Knowledge menu item + `/knowledge` route were **removed** from the app; its content now lives in
**`docs/`** for **local `file://` browsing** (not web-served → no public exposure):
`docs/know.html` (index, opened via `file:///Users/jay/work/task/docs/know.html`) + `docs/knowledge/`
(e.g. `management.md`). The web-iframe approach below is on hold. *Open:* know.html links to
`ai/`/`eng/`/`nostra/` (in `archive/`, 881 MB) + `docs/*` — not relocated; left for the restore step.
- **Now:** `/knowledge` is a stub; `know.html` sits **loose at the repo root** (plus a copy in `public/`).
- **Target:** `/knowledge` renders `know.html`; move the loose root content files into a proper home.
- **Decided (jay):** serve **`know.html` as the main content (iframe, no React port)**; gather the
  files it references and move the whole set into **`public/knowledge/`**.
- **Design:** move `know.html` + its linked files (e.g. `management.md`, any images it points to)
  into `public/knowledge/`; `/knowledge` embeds `public/knowledge/know.html` in an iframe. (Scan
  `know.html` for `href`/`src` to find the exact related-file set.)
- **✅ Done (2026-06-30):** moved `know.html` + `management.md` → `public/knowledge/`; `/knowledge`
  iframes `/knowledge/know.html`; `middleware.ts` matcher excludes `knowledge/` so the static file
  serves without auth. Verified (200 + "Workspace Index" content).
- **Loose root files → `docs/archive/`** ✅ (2026-06-30): moved the leftover study files
  (`index.html`, `baseline_*.html`, `management.html`, `sarah_chen_index.html`, `luminary_index.html`,
  `zksnark_math.html`, `assumptions.md`, `clarifying_questions.md`) into `docs/archive/` for later
  reference. `README.md` (project setup) stays at root.
- **know.html links — recommend PRUNE** (not fix). The app web-serves only `public/`, so its links to
  `ai/`/`eng/`/`nostra/`/`images/`/`docs/` (repo files now in `archive/`/`docs/`) would **still 404**
  even if the paths were corrected. Plan: **fix** the one served link (`management.md` →
  `/knowledge/management.md`) and **neutralize the rest** (strip dead local `href`s, keep the text).
  Pending jay's go-ahead.

## 5. AI Chat — KB via MCP + RAG
- **Status: ⬜ To do**

- **Goal:** chat can query the **Knowledge KB** using **RAG**, exposed through an **MCP** tool.
- **Decided (jay):** the MCP exposes **KB search / retrieval** (settles the earlier TBD; see
  `../features/ai-chat.md`).
- **Design:**
  - Index Knowledge content (`know.html` + md) → embeddings → vector store (local Chroma/Qdrant, or
    a simple file index to start).
  - Expose retrieval as **this project's MCP server**; the chat agent calls it as a tool. (Fallback:
    do RAG directly in `/api/chat` and keep MCP for tool-calling.)
  - Flow: question → retrieve top-k chunks → inject into prompt → LLM answers **with citations**.
- **Open:** embedding model (local `nomic-embed` vs OpenAI), vector store, MCP-tool vs in-route RAG.

## 6. AP2 — Stripe settlement example (educational)
- **Status: ⬜ To do**

- **Goal:** a simple, educational **fiat** settlement example via **Stripe** (counterpart to the
  on-chain x402 / aiaas track in `../features/ap2-test.md`).
- **Design:** mock "agent buys data, settles via Stripe":
  provider returns a price → client creates a **Stripe Checkout / PaymentIntent** → on success the
  data is released. **Test-mode keys only**, no real charges.
- **Open:** Checkout vs PaymentIntent; how prominently to contrast it with x402.

## 7. ETC — ERC-7702 / 7715 demo (educational)
- **Status: ⬜ To do**

**Standards (jay confirmed):** **EIP-7702** (an EOA temporarily runs smart-account code = a
*delegatable smart account*) + **ERC-7715** (`wallet_grantPermissions` — grant a scoped **session
key**) / **ERC-7710** (delegation).
- **Goal:** a test page for **delegatable smart accounts / session keys** — ties directly to the
  aiaas spend-policy idea (session key = agent's bounded wallet).
- **Design (educational):**
  - Connect a wallet → **grant a session key** with a scoped permission ("spend ≤ X testnet USDC to
    address Y, valid 1h") per **ERC-7715** → show the session key performing that **bounded action
    without re-signing**.
  - Testnet (**Sepolia**) + a 7702-capable account; display the permission grant + one delegated tx.
- **Decided (jay):** stack = **MetaMask Delegation Toolkit** (implements 7715/7710) on **Sepolia**.
  *(Alternative: ZeroDev / permissionless.js for 7702/4337 session keys.)* Scope = short explainer + one demo tx.

## 8. Cross-cutting — IA update
- **Status: ⬜ To do**

- Update the Target IA table in `../features/README.md`: split Portfolio & Market, add **Market**,
  apply the new order.
- New/changed routes: `/market`; Knowledge content move + serve; `/etc` ERC demo subpage; AP2 Stripe
  example under `/ap2`.

## 9. Decisions & remaining open questions
**Resolved (jay):**
- Home = `/` (logo) · Verex = trailing external link.
- AI Chat keys: **persist per user, encrypted at rest**; proprietary provider = **OpenAI** now (Anthropic later — easy add).
- Market: **REST poll first**, WebSocket next; default market **BTC perp** (→ **ETC perp** since 2026-07-07).
- Perp trading (§3 Task 3-P2): **direct wallet signing first (2a), agent wallet later (2b)**.
- Knowledge: serve **`know.html`** as-is (iframe) + move it and its linked files into **`public/knowledge/`**.
- MCP exposes **KB retrieval**.
- ETC standards = **7702 + 7715/7710**; stack = **MetaMask Delegation Toolkit on Sepolia**.

**Still open:**
- KB: embedding model (local `nomic-embed` vs OpenAI) + vector store; MCP-tool vs in-route RAG.
- AP2: Stripe Checkout vs PaymentIntent.

## 10. Suggested sequence
1. ~~Menu split + reorder + **Market** page (indices first, orderbook next).~~ ✅ Done
2. ~~**Knowledge** content move + serve `know.html`.~~ ✅ Done
3. **AI Chat** gating (BYO key / jay's stored key; local disabled).
4. **KB RAG + MCP**.
5. **AP2 Stripe** example; **ETC ERC-7702/7715** demo.

**Next steps (updated 2026-07-07, after the orderbook shipped):**
1. **Perp trading Phase 2a** — TradePanel on `/market`: connect MetaMask, place/cancel a testnet
   order with direct wallet signing (spec in §3 Task 3-P2). Prereqs all met (HL-TEST funded,
   mock USDC claimed).
2. **Perp trading Phase 2b** — agent wallet: one-time `approveAgent`, popup-free signing
   (reuses 2a's order form/exchange client; needs the agent-key storage decision in §9).
3. **`/market` polish** — WebSocket orderbook (replace 5s REST poll) + market picker
   (ETC/BTC/ETH…).
4. Then back to the original sequence: **§2 AI Chat gating** → **§5 KB RAG + MCP** →
   **§6 AP2 Stripe / §7 ERC-7702·7715 demo**, with **§8 IA update** alongside whichever ships.
