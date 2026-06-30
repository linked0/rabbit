# Rabbit — Jun 30 Design

- **Source task file:** [jun-30-rabbit.md](jun-30-rabbit.md) · **IA:** [../features/README.md](../features/README.md)
- **Status:** design (for review)

## 0. Summary
Designs for the Jun 30 tasks: split **Portfolio & Market** into two categories + reorder the menu,
refine **auth / LLM gating**, build the **Market** page (Hyperliquid orderbook + indices), fix the
**Knowledge** page (serve `know.html`), add **KB-over-MCP/RAG** to AI Chat, an **AP2 Stripe**
settlement example, and an **ETC ERC-7702 / 7715** demo.

## 1. Split "Portfolio & Market" → Portfolio + Market
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

## 2. Auth + LLM gating
- **Login-only category:** **Portfolio** only (others stay public — matches current middleware).
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
- New `/market` shows:
  - **Important indices** — reuse `/summary`'s `IndexCards` (BTC · ETH · S&P 500 · KOSPI).
  - **Hyperliquid orderbook** — live L2 (bids/asks, maybe funding) for a chosen market. Reuse
    `app/api/perp` / `app/api/indices` if they fit, else add `app/api/orderbook` proxying
    Hyperliquid's public info endpoint.
- **Design:** server route proxies the Hyperliquid REST snapshot (or a WS client streams to the
  page); render a compact L2 book above the index cards. Public API → no key.
- **Decided (jay):** **REST poll first**, add **WebSocket** in a later step. Default market =
  **BTC perp** (most liquid) for the first cut.

## 4. Knowledge page — serve `know.html` (Fix: No content)
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
- **⚠️ Note / not done:** `know.html` links to `ai/`, `eng/`, `nostra/`, `images/`, `docs/` — those
  moved to `archive/` (or `docs/`) in the restructure, so most internal links in the served page are
  **stale**; I did **not** relocate those whole trees (would break the repo). The other loose root
  study files (`index.html`, `baseline_*.html`, `management.html`, `sarah_chen_index.html`,
  `luminary_index.html`, `zksnark_math.html`, `assumptions.md`, `clarifying_questions.md`) are **left
  at root** — unclear if "Knowledge". **Decide:** fix/prune know.html's links? sweep these others where?

## 5. AI Chat — KB via MCP + RAG
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
- **Goal:** a simple, educational **fiat** settlement example via **Stripe** (counterpart to the
  on-chain x402 / aiaas track in `../features/ap2-test.md`).
- **Design:** mock "agent buys data, settles via Stripe":
  provider returns a price → client creates a **Stripe Checkout / PaymentIntent** → on success the
  data is released. **Test-mode keys only**, no real charges.
- **Open:** Checkout vs PaymentIntent; how prominently to contrast it with x402.

## 7. ETC — ERC-7702 / 7715 demo (educational)
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
- Update the Target IA table in `../features/README.md`: split Portfolio & Market, add **Market**,
  apply the new order.
- New/changed routes: `/market`; Knowledge content move + serve; `/etc` ERC demo subpage; AP2 Stripe
  example under `/ap2`.

## 9. Decisions & remaining open questions
**Resolved (jay):**
- Home = `/` (logo) · Verex = trailing external link.
- AI Chat keys: **persist per user, encrypted at rest**; proprietary provider = **OpenAI** now (Anthropic later — easy add).
- Market: **REST poll first**, WebSocket next; default market **BTC perp**.
- Knowledge: serve **`know.html`** as-is (iframe) + move it and its linked files into **`public/knowledge/`**.
- MCP exposes **KB retrieval**.
- ETC standards = **7702 + 7715/7710**; stack = **MetaMask Delegation Toolkit on Sepolia**.

**Still open:**
- KB: embedding model (local `nomic-embed` vs OpenAI) + vector store; MCP-tool vs in-route RAG.
- AP2: Stripe Checkout vs PaymentIntent.

## 10. Suggested sequence
1. Menu split + reorder + **Market** page (indices first, orderbook next).
2. **Knowledge** content move + serve `know.html`.
3. **AI Chat** gating (BYO key / jay's stored key; local disabled).
4. **KB RAG + MCP**.
5. **AP2 Stripe** example; **ETC ERC-7702/7715** demo.
