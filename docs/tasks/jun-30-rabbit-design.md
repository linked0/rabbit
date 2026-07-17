# Rabbit — Jun 30 Design

- **Source task file:** [jun-30-rabbit.md](jun-30-rabbit.md) · **IA:** [../features/README.md](../features/README.md)
- **Status:** design (for review)

## Table of contents <a id="toc"></a>

**Original Jun-30 design (§0–§11)**
- [§0 — Summary](#s0)
- [§1 — Split "Portfolio & Market" → Portfolio + Market ✅](#s1)
- [§2 — Auth + LLM gating](#s2)
- [§3 — Market page — Hyperliquid orderbook + indices](#s3)
- [§4 — Knowledge page — serve `know.html` (Fix: No content)](#s4)
- [§5 — AI Chat — KB via MCP + RAG](#s5)
- [§6 — AP2 — Stripe settlement example (educational)](#s6)
- [§7 — ETC — ERC-7702 / 7715 demo (educational)](#s7)
- [§8 — Cross-cutting — IA update](#s8)
- [§9 — Decisions & remaining open questions](#s9)
- [§10 — Suggested sequence](#s10)
- [§11 — Staging domain — `staging.rabbit.jaylabs.xyz` (added 2026-07-07)](#s11)

**Added 2026-07-17 (§12–§21)**
- [§12 — DSRV Portal — institutional custody study & PoC](#s12)
- [§13 — PET data clean room — homomorphic-encryption PoC](#s13)
- [§14 — Zapier MCP — sample page](#s14)
- [§15 — Agentic AA — 4 pillars demo](#s15)
- [§16 — Solana — integration study + sample contract](#s16)
- [§17 — KB hybrid card × stablecoin payment — flow map](#s17)
- [§18 — Merkle vs Verkle tree — comparison page](#s18)
- [§19 — Linera microchains — blockspace-contention learning page](#s19)
- [§20 — Web stack — 5-layer map](#s20)
- [§21 — Chainlink CRE × cloud — hybrid use cases](#s21)

## 0. Summary <a id="s0"></a>
<sub>[↑ TOC](#toc)</sub>
Designs for the Jun 30 tasks: split **Portfolio & Market** into two categories + reorder the menu,
refine **auth / LLM gating**, build the **Market** page (Hyperliquid orderbook + indices), fix the
**Knowledge** page (serve `know.html`), add **KB-over-MCP/RAG** to AI Chat, an **AP2 Stripe**
settlement example, and an **ETC ERC-7702 / 7715** demo.

## 1. Split "Portfolio & Market" → Portfolio + Market ✅ <a id="s1"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ✅ Done** (2026-06-30 — details in [2026-06-30 history](../history/2026-06-30-rabbit-history.md))

## 2. Auth + LLM gating <a id="s2"></a>
<sub>[↑ TOC](#toc)</sub>
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

## 3. Market page — Hyperliquid orderbook + indices <a id="s3"></a>
<sub>[↑ TOC](#toc)</sub>
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

## 4. Knowledge page — serve `know.html` (Fix: No content) <a id="s4"></a>
<sub>[↑ TOC](#toc)</sub>
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

## 5. AI Chat — KB via MCP + RAG <a id="s5"></a>
<sub>[↑ TOC](#toc)</sub>
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

## 6. AP2 — Stripe settlement example (educational) <a id="s6"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do**

- **Goal:** a simple, educational **fiat** settlement example via **Stripe** (counterpart to the
  on-chain x402 / aiaas track in `../features/ap2-test.md`).
- **Design:** mock "agent buys data, settles via Stripe":
  provider returns a price → client creates a **Stripe Checkout / PaymentIntent** → on success the
  data is released. **Test-mode keys only**, no real charges.
- **Open:** Checkout vs PaymentIntent; how prominently to contrast it with x402.

## 7. ETC — ERC-7702 / 7715 demo (educational) <a id="s7"></a>
<sub>[↑ TOC](#toc)</sub>
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

## 8. Cross-cutting — IA update <a id="s8"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do**

- Update the Target IA table in `../features/README.md`: split Portfolio & Market, add **Market**,
  apply the new order.
- New/changed routes: `/market`; Knowledge content move + serve; `/etc` ERC demo subpage; AP2 Stripe
  example under `/ap2`.

## 9. Decisions & remaining open questions <a id="s9"></a>
<sub>[↑ TOC](#toc)</sub>
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

## 10. Suggested sequence <a id="s10"></a>
<sub>[↑ TOC](#toc)</sub>
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

## 11. Staging domain — `staging.rabbit.jaylabs.xyz` (added 2026-07-07) <a id="s11"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do**

- **Goal (jay):** give the current Cloud Run URL
  (`https://rabbit-179807446244.asia-northeast3.run.app/`) a memorable staging address:
  **`staging.rabbit.jaylabs.xyz`**. Production stays per the jun-19 plan (Phase 2:
  `www.jaylabs.xyz` + apex → rabbit); this subdomain is the pre-domain testing tier.
- **Constraint (verified in GCP docs, 2026-07-07):** Cloud Run's built-in **domain mapping does
  NOT support `asia-northeast3` (Seoul)** — the service's region. The free built-in path is out.
- **Options:**
  1. **Firebase Hosting rewrite → Cloud Run** (recommended) — works with any region, ~free,
     Google-managed TLS. Work: create a Firebase Hosting site, `firebase.json` rewrite
     `{ "source": "**", "run": { "serviceId": "rabbit", "region": "asia-northeast3" } }`,
     add the DNS records Firebase issues for `staging.rabbit.jaylabs.xyz`.
  2. Global external HTTPS **load balancer** + serverless NEG — most control (CDN, Cloud Armor)
     but ~$18+/mo; overkill for a staging URL.
  3. **Move the service to `asia-northeast1` (Tokyo)** to use built-in mapping — free, but gives
     up Seoul latency; not worth it just for a staging alias.
- **Recommendation:** option 1 (Firebase Hosting). Note `AUTH_URL`/Google-OAuth redirect must
  include the new origin when auth is used on staging (cloud mode).

## 12. DSRV Portal — institutional custody study & PoC (added 2026-07-17) <a id="s12"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do** (backlog — not yet scheduled)

- **Goal (jay):** study how an institutional custody platform like DSRV's "Portal" is built
  (MPC/TSS key management · multi-step approval governance · ERC-4337 AA + multi-chain API ·
  AML/Travel Rule), and turn it into small PoCs that plug into rabbit **without a VASP license**.
- **Detail:** full analysis + three no-VASP strategies + concrete PoC items in
  **[../features/dsrv-portal.md](../features/dsrv-portal.md)**.
- **Suggested first cut:** the **mini AML dashboard** (Etherscan API wallet-history monitor) —
  reuses the S6 Postgres and renders as a `/portfolio` or `/xyz` panel. The AA PoC overlaps with
  §7's session-key work (MetaMask Delegation Toolkit / ZeroDev), so they can share a stack.

## 13. PET data clean room — homomorphic-encryption PoC (added 2026-07-17) <a id="s13"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do** (backlog — not yet scheduled)

- **Goal (jay):** reproduce the core of a PET data clean room (DESILO × 국립암센터 case —
  analyze sensitive data **while encrypted**, only the result decrypts) hands-on with
  open-source FHE libraries; no partnership or real medical data needed.
- **Detail:** background + four PoC options in **[../features/pet-clean-room.md](../features/pet-clean-room.md)**.
- **PoC ladder (suggested order A → C → B):**
  - **A. Encrypted statistics** — TenSEAL/Pyfhel (CKKS): mean/variance over a synthetic
    EMR-like CSV computed on ciphertexts.
  - **C. Two-role split** — `provider.py` (keygen + encrypt) vs `analyst.py` (computes,
    never sees the key) — mirrors the real product's 제공자/관리자 architecture.
  - **B. Encrypted ML inference** — Zama Concrete ML on sklearn's breast-cancer dataset
    (fits the cancer-center theme); also measures FHE's perf cost.
  - **D (stretch).** PSI for the cross-institution **join** step.
- **Rabbit surface:** demo page under **ETC** or **XYZ**; thin client + small Python FHE
  service. Est. 2–3 focused days for A+C+B.

## 14. Zapier MCP — sample page (added 2026-07-17) <a id="s14"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do**

- **Goal (jay):** a sample page where the agent, connected to **Zapier MCP**, runs real SaaS
  actions (send Gmail / create Notion page / Slack message) from a natural-language prompt —
  Zapier's 8,000+ integrations exposed as MCP tools, so it's assembly, not integration code.
- **Detail:** design + wiring options + demo scenarios in
  **[../features/zapier-mcp.md](../features/zapier-mcp.md)**.
- **Shape:** `/etc/zapier` subpage — allowed-tools list → prompt box → execution log.
  Server-side MCP connection (`ZAPIER_MCP_URL` + token as env secrets, per §2's key handling);
  Zapier-console allowlist kept to harmless actions (email-to-self, sandbox Notion DB).
- **First cut:** email-to-self via the **Anthropic API MCP connector** (`mcp_servers` param —
  least code); generic `@modelcontextprotocol/sdk` client later if provider-agnostic matters.
  Est. 0.5–1d. Complements §5: there rabbit is the MCP *server* (KB retrieval), here the *client*.

## 15. Agentic AA — 4 pillars demo (added 2026-07-17) <a id="s15"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do** (sequenced after §7 — §7 *is* pillar 1)

- **Goal (jay):** demo the four things AA gives an autonomously-paying agent that an EOA
  can't: **① scoped delegation** (session key: "≤10 USDC/day, service X only, 48h"),
  **② gas independence** (paymaster — gas paid in earned USDC or sponsored),
  **③ atomic intent** (swap→bridge→pay in one UserOperation; any failure reverts all),
  **④ KYA** (ERC-8004 identity/reputation — counterparties check the agent before dealing).
- **Detail:** pillar table + mapping to existing items + demo shape in
  **[../features/agentic-aa.md](../features/agentic-aa.md)**.
- **Shape:** extend the §7 ETC page — four cards, one per pillar, each with [Run] + tx link.
  Stack: ZeroDev/permissionless.js + Pimlico on **Sepolia** (same family as §7's decided
  stack, shares wallet plumbing). Pillars 2–3 are the genuinely new work; pillar 4 is
  exploratory (ERC-8004 is young — verify testnet registry availability).
- **Est.:** pillars 1–3 ≈ 2–3d on top of §7; pillar 4 +1d. Ties the aiaas spend-policy idea
  ([ap2-test.md](../features/ap2-test.md)) and [dsrv-portal.md](../features/dsrv-portal.md)
  AA PoC into one coherent demo.
- **ERC-8021 add-on (added 2026-07-17):** on-chain attribution ("builder codes") — a
  calldata **suffix** (`[schema ID 1B] + [builder code] + [ERC marker 16B]`) the EVM ignores
  but the ledger keeps, proving which app/agent produced a tx (revenue share, agent
  rewards). Companion to pillar 4: **8004 = who the agent is, 8021 = what it produced.**
  Demo: tag pillars 1–3's txs with a rabbit builder code and parse the suffix back in the
  execution log (~+0.5d). Detail: [agentic-aa.md §4](../features/agentic-aa.md).
- **WalletChan case study (added 2026-07-17):** "MetaMask for AI agents" — EIP-1193/6963
  provider injection + **remote signing** in the Bankr backend's TEE (keys never in the
  browser); v3's batch tx = pillar 3, gasless relayer = pillar 2, tx **simulation before
  signing** = a safety rail our demo page should copy. Control-flow inversion vs the aiaas
  track: human drives the UI, agent executes. Detail: [agentic-aa.md §5](../features/agentic-aa.md).

## 16. Solana — integration study + sample contract (added 2026-07-17) <a id="s16"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do**

- **Goal (jay):** research Solana integration and add a sample on-chain program — rabbit's
  first **non-EVM** chain (different model: stateless programs, state in accounts, PDAs,
  SPL tokens, Rust + Anchor instead of Solidity + Foundry).
- **Detail:** research scope + program ladder + page design in
  **[../features/solana.md](../features/solana.md)**.
- **Ladder:** EVM-vs-Solana research note (~0.5d) → **Anchor counter program** on local
  validator then devnet (~1d) → SPL-token **escrow with a PDA vault** (~1–2d; the real
  learning: PDAs, CPIs, account constraints) → *(stretch)* x402-flavored "pay for data" leg
  in SPL tokens.
- **Surface:** `/etc/solana` — Phantom via wallet-adapter, devnet balances, one button per
  instruction, Explorer links. Anchor project lives in its own Rust workspace
  (`spagetties/solana/` or top-level `solana/`); only the page + IDL enter the Next.js app.
- **First cut:** research note + counter + minimal page ≈ **2–2.5d**. Independent of the EVM
  items; pairs well after §15 for an EVM-vs-Solana agent-payments comparison.

## 17. KB hybrid card × stablecoin payment — flow map (added 2026-07-17) <a id="s17"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: 📎 Reference only** (jay: flow map, not a dev item)

- **What:** how a TradFi card rail (ISO 8583) combines with on-chain settlement (Avalanche
  subnet + stablecoin), modeled on KB국민카드's reported design. Full diagrams in
  **[../features/kb-hybrid-payment-flow.md](../features/kb-hybrid-payment-flow.md)**.

**Four-layer flow:**
```
① Off-chain (1–2s)   card swipe → VAN/PG → issuer server (ISO 8583 auth request)
② Middleware          funding choice: credit → legacy path (unchanged)
                                     stablecoin → custody/WaaS (MPC) balance check + HOLD
                      → ✅ authorized (nothing on-chain yet)
③ On-chain (batch)    Avalanche subnet: burn/lock held coins (ERC-20 + ERC-2612 permit;
                      ERC-4337 AA wallet 1:1 with card#, Paymaster pays gas;
                      Chainlink/Pyth fixes USDC↔KRW rate per batch)
④ Settlement          KRW liquidity pool (issuer fiat) → merchant paid in won, never coins
```

**Core trick — authorize now, settle later:** card auth must return in 1–2s; chain finality
can't. So authorization is purely **off-chain** (a hold on the custody balance) and the
on-chain movement is **deferred batch settlement** — the authorize/settle split card networks
already use, with the settle leg moved on-chain.

**Why each piece (one line):** Avalanche **Evergreen subnet** = issuer-dedicated lane
(gas-free config, KYC'd validators, Solidity unchanged) · **ERC-2612 + 4337/Paymaster** =
users never see gas or seed phrases · **MPC custody** = no single key to leak (same pillar
as [dsrv-portal.md](../features/dsrv-portal.md) ①) · **oracle** = bounds FX drift per batch ·
**KRW pool** = merchants want won; pool fronts fiat while the coin leg settles.

**Tie-ins (future, not scheduled):** AP2/x402 off-ramp — *agent earns stablecoin → spends it
via a real card* ([ap2-test.md](../features/ap2-test.md)); §15 shares the paymaster/scoped-key
building blocks.

## 18. Merkle vs Verkle tree — comparison page (added 2026-07-17) <a id="s18"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: 📎 Reference only** (knowledge content, not a dev item)

- **What:** a self-contained comparison page —
  **[../knowledge/merkle-vs-verkle.html](../knowledge/merkle-vs-verkle.html)** — with
  side-by-side SVG proof diagrams (Merkle sibling-hash path vs Verkle's single aggregated
  opening proof), a comparison table (hash vs Pedersen+IPA commitment · width 2/16 vs 256 ·
  proof ~3–4 KB/key vs ~150 B · PQ trade-off), and the Ethereum context (The Verge —
  stateless-client witnesses).
- **Registered:** card in [../know.html](../know.html) (local knowledge index).
- **One-liner:** Merkle proves membership by shipping the neighbors; Verkle proves it by
  opening a commitment — so proof size stops growing with tree width.

## 19. Linera microchains — blockspace-contention learning page (added 2026-07-17) <a id="s19"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: 📎 Reference only** (knowledge content — jay will review later)

- **What:** a self-contained learning page + flow charts —
  **[../knowledge/linera-microchains.html](../knowledge/linera-microchains.html)** — on the
  L2 blockspace-contention problem (a viral mint on Base raises gas for *everyone*,
  including an agent doing 1,000 micro-tx/min) and Linera's microchain answer (one chain
  per user/app — "a private driveway"; performance isolated, security still shared by one
  validator set).
- **Contents:** side-by-side congestion diagrams · tx-flow sequence (mempool + gas auction
  vs owner-proposed blocks, async cross-chain messages) · comparison table (fees, latency,
  composability trade-off, Rust/Wasm vs EVM, maturity) · agent-payments angle.
- **Key frame:** cost isolation is a **spectrum** — shared L2 → app-dedicated rollup/subnet
  (§17's Avalanche Evergreen) → per-user microchain (Linera, the extreme end).
- **Registered:** card in [../know.html](../know.html).

## 20. Web stack — 5-layer map (added 2026-07-17) <a id="s20"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: 📎 Reference only** (knowledge content)

- **What:** a layer map of a modern web stack —
  **[../knowledge/web-stack-layers.html](../knowledge/web-stack-layers.html)**:
  ① Presentation & Edge (React/Flutter · CDN) → ② Integration & Messaging (gRPC/GraphQL ·
  Kafka/RabbitMQ) → ③ Business Logic & Data Access (Spring/Django · Redis/ORM) →
  ④ Storage & Analytics (Postgres/MySQL · Spark/PyTorch/BigQuery) → ⑤ Infrastructure
  (AWS/Azure · Docker/K8s).
- **rabbit overlay:** the page maps rabbit onto each layer (Next.js · REST routes · Prisma ·
  Cloud SQL · Cloud Run) and names the deliberate gaps (no CDN / broker / analytics — fine
  at current scale).
- **Registered:** card in [../know.html](../know.html).

## 21. Chainlink CRE × cloud — hybrid use cases (added 2026-07-17) <a id="s21"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: 📎 Reference only**

- **What:** four patterns where **CRE** bridges private cloud (AWS/GCP) and public chains —
  detail in **[../features/cre-cloud.md](../features/cre-cloud.md)**:
  ① **RWA asset servicing** — cloud holds KYC/legal docs; CRE checks compliance then moves
  on-chain ownership · ② **Proof of Reserve** — Lambda polls the bank API; CRE verifies +
  pushes the proof on-chain · ③ **DvP settlement** — cloud runs the cash leg (SWIFT); CRE
  releases the asset leg only on confirmed payment · ④ **AI prediction-market settlement** —
  Gemini judges the outcome; CRE settles the contract.
- **Common shape:** cloud = private truth · chain = public settlement · CRE = the verified
  bridge between them.
- **Tie-ins:** §12 DSRV (RWA strategy B) · §17 KB flow (reserve attestation, authorize/settle
  discipline) · **verex oracle track** — "AI-as-oracle via CRE" is a candidate stage 4 after
  manual → Chainlink → UMA for subjective markets.
