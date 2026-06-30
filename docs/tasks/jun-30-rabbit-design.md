# Rabbit — Jun 30 Design

- **Source task file:** [jun-30-rabbit.md](jun-30-rabbit.md) · **IA:** [../features/README.md](../features/README.md)
- **Status:** design (for review)

## 0. Summary
Designs for the Jun 30 tasks: split **Portfolio & Market** into two categories + reorder the menu,
refine **auth / LLM gating**, build the **Market** page (Hyperliquid orderbook + indices), fix the
**Knowledge** page (serve `know.html`), add **KB-over-MCP/RAG** to AI Chat, an **AP2 Stripe**
settlement example, and an **ETC ERC-7701/7715** demo.

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

## 2. Auth + LLM gating
- **Login-only category:** **Portfolio** only (others stay public — matches current middleware).
- **AI Chat access model:**
  - To chat, the user selects a **Proprietary LLM** and supplies **their own API key**.
  - **Local LLM** works **only when the app runs on the local machine** (local mode — Ollama
    reachable at `localhost`). On the **cloud deployment** it's **shown but disabled** (no hosted OSS
    model provisioned yet) → selecting it there shows "not available in cloud yet".
  - **jay (`linked0@gmail.com`)** uses the **server-stored API key** for the proprietary LLM (no paste).
- **Design:** `lib/ai.ts` already abstracts providers. Add a key/source resolver:
  `jay → env secret` · `other user → key submitted per request (not persisted)` ·
  `Local LLM → enabled in local mode (Ollama at localhost), disabled in cloud`.
  Gate the stored-key path on `session.user.email === linked0@gmail.com`; detect mode via `appMode()`
  (`lib/mode.ts`) so the Local LLM option is live locally and inert in cloud.
- **Open:** persist other users' keys or per-request only? Which proprietary providers (OpenAI / Anthropic)?

## 3. Market page — Hyperliquid orderbook + indices
- New `/market` shows:
  - **Important indices** — reuse `/summary`'s `IndexCards` (BTC · ETH · S&P 500 · KOSPI).
  - **Hyperliquid orderbook** — live L2 (bids/asks, maybe funding) for a chosen market. Reuse
    `app/api/perp` / `app/api/indices` if they fit, else add `app/api/orderbook` proxying
    Hyperliquid's public info endpoint.
- **Design:** server route proxies the Hyperliquid REST snapshot (or a WS client streams to the
  page); render a compact L2 book above the index cards. Public API → no key.
- **Open:** which market(s)? REST poll vs WebSocket stream?

## 4. Knowledge page — serve `know.html` (Fix: No content)
- **Now:** `/knowledge` is a stub; `know.html` sits **loose at the repo root** (plus a copy in `public/`).
- **Target:** `/knowledge` renders `know.html`; move the loose root content files into a proper home.
- **Design:**
  - Move `know.html`, `management.md`, and the other loose root study files into a dedicated folder
    (e.g., `content/knowledge/` or `public/knowledge/`).
  - Serve it: simplest = keep `know.html` under `public/knowledge/` and have `/knowledge` embed it
    (iframe); cleaner = port to a styled React route.
- **Open:** iframe the raw HTML vs port to React? Exactly which loose files are "Knowledge" vs other categories?

## 5. AI Chat — KB via MCP + RAG
- **Goal:** chat can query the **Knowledge KB** using **RAG**, exposed through an **MCP** tool.
- **This decides the previously-TBD MCP content** (see `../features/ai-chat.md`): **the MCP exposes
  KB search / retrieval.**
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

## 7. ETC — ERC-7701 / 7715 demo (educational)
- **Goal:** a test page for **delegatable smart accounts / session keys** (ERC-7701 account +
  ERC-7715 permission grants) — ties directly to the aiaas spend-policy idea (session key = agent's
  bounded wallet).
- **Design (imagined educational feature):**
  - Connect a wallet → **grant a session key** with a scoped permission ("spend ≤ X testnet USDC to
    address Y, valid 1h") per ERC-7715 → show the session key performing that **bounded action
    without re-signing**.
  - Testnet + a 7702/7701-capable account; display the permission grant + one delegated tx.
- **Open:** which AA stack supports 7701/7715 today? Scope = a short explainer + one demo tx.

## 8. Cross-cutting — IA update
- Update the Target IA table in `../features/README.md`: split Portfolio & Market, add **Market**,
  apply the new order.
- New/changed routes: `/market`; Knowledge content move + serve; `/etc` ERC demo subpage; AP2 Stripe
  example under `/ap2`.

## 9. Open questions (consolidated)
- ~~Home & Verex placement~~ → ✅ Home = `/` (logo), Verex = trailing external link.
- AI Chat: persist user keys or per-request only? which proprietary providers?
  -  
- Market: which Hyperliquid market; REST poll vs WS stream.
- Knowledge: iframe vs React port; which loose files move where.
- MCP confirmed to expose **KB retrieval** (per §5)?
- ERC-7701/7715 stack choice.

## 10. Suggested sequence
1. Menu split + reorder + **Market** page (indices first, orderbook next).
2. **Knowledge** content move + serve `know.html`.
3. **AI Chat** gating (BYO key / jay's stored key; local disabled).
4. **KB RAG + MCP**.
5. **AP2 Stripe** example; **ETC ERC-7701/7715** demo.
