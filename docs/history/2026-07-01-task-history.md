# 2026-07-01 — task history

Source doc: [docs/tasks/jul-01-rabbit-design.md](../tasks/jul-01-rabbit-design.md)

### tasks doc: add explicit DONE/TODO status line under each task heading
Added a status marker on the first line *after* each numbered task heading in
`jul-01-rabbit-design.md`: `✅ DONE` for tasks 1 and 4 (already completed
2026-06-30), `🔲 TODO` for tasks 2, 3, 5, 6, 7, 8. Why: make each task's
completion state scannable at a glance while keeping the heading text clean
(per jay's correction — status line, not in the heading).

### New Third: retire ETC → JayVerse, absorb ETC items into XYZ
Completed the "New Third" task in `jul-01-rabbit-design.md`. (1) Folded
`docs/features/etc.md`'s SimpleX experiment into `docs/features/xyz-demo.md`
("Misc experiments (absorbed from ETC)"). (2) `git mv etc.md jayverse.md` and
rewrote it as the JayVerse showcase (`/jayverse`) holding the Gravia live-trading
dashboard from New Second. (3) Updated the IA table in `docs/features/README.md`
(ETC → JayVerse). Why: promote the flashy showcase into a real menu slot and
clear the ETC junk-drawer. Docs-only; left uncommitted for jay's review.

### JayVerse rename: propagate the menu name (jay clarification)
Per jay, "ETC → JayVerse" means the **menu name**. Propagated it through the
current design doc `jul-01-rabbit-design.md`: menu-bar strings (`… XYZ · ETC` →
`… XYZ · JayVerse`) and the New Second prose ("under ETC" / "the ETC page" →
JayVerse). Left historical files (jun-30/jun-29, `docs/history/*`) and the
unrelated `docs/zsub/` untouched. Open: section 7 "ETC — ERC-7702/7715 demo"
still labels the ERC demo "ETC" — needs a home decision (JayVerse vs XYZ vs its
own slot); flagged for jay.

### App: apply ETC → JayVerse rename in the top menu + route
Synced the app to the docs rename. `app/Nav.tsx` menu item `ETC → /etc` →
`JayVerse → /jayverse`; `git mv app/etc app/jayverse` and rewrote the stub
(`EtcPage` → `JayVersePage`, points at `docs/features/jayverse.md`, Gravia demo,
`SIMULATED / DEMO` label); `middleware.ts` PUBLIC_PATHS `/etc` → `/jayverse`.
Verified: `npx next build` passes, `/jayverse` in the route list, no `/etc`
leftovers. Docs-only repo convention — left uncommitted for jay's review.

### XYZ Demo: ship the C4 PBS relay observer dashboard
Built the C4 observer (New First / PBS section) into `/xyz`. New
`app/api/relay/route.ts` fans out (`Promise.all`, 6s timeout each) to 4 public
relay Data APIs (`proposer_payload_delivered`) — Flashbots, bloXroute, Agnostic,
Ultra Sound — measuring per-relay latency; `app/xyz/RelayDashboard.tsx` (client,
20s auto-refresh) aggregates builder market share (deduped by block_hash),
bid-value distribution (min/median/avg/max ETH), relay latency/status, and recent
delivered blocks. `middleware.ts`: `/api/relay` added to PUBLIC_PATHS so the
employer can view without login. Why: highest-value, zero-key first cut of the
XYZ oracle/data story. Verified: `next build` passes, `/xyz` 2.33 kB + `/api/relay`
registered, upstream field shape confirmed via curl. Left uncommitted for review.

### XYZ C4 dashboard: add "what am I looking at" descriptions
Added context so a viewer knows the source. API `/api/relay` now returns
`network` ("Ethereum Mainnet"), `endpoint`, `limit`, and each relay's `host`.
UI (`RelayDashboard.tsx`) gained a "무엇을 보고 있나" panel (network + why mainnet,
the exact Data API path, the 4 relays, CORS-proxy note) plus one-line explainers
under each panel and a host column in the relay-latency table. Why: jay asked to
say what network/data the dashboard observes. `next build` compiles clean;
`/xyz` 3.24 kB.

### XYZ Demo: ship C2 searcher — submit a bundle to Sepolia relay
Added a bundle-submit form above the C4 dashboard on `/xyz`. Installed `ethers`
6.17.0 via **pnpm** (npm corrupted the pnpm store — project pins pnpm@11.5.1).
Skipped `@flashbots/ethers-provider-bundle` (ethers-v5 pin) and talk to
`relay-sepolia.flashbots.net` JSON-RPC directly: `eth_callBundle` (sim) then
`eth_sendBundle`, with the `X-Flashbots-Signature` auth header (ephemeral
reputation key). New: `lib/flashbots.ts` (sign+sim+submit), `app/api/bundle/route.ts`
(Node runtime, **login-gated**, reads `SEPOLIA_RPC`+`ADMIN_KEY` from env — key
never sent to browser), `app/xyz/BundleSubmit.tsx` (form). `page.tsx` now wraps
both C2+C4 in one `<main>` (RelayDashboard changed to a fragment). `.env.example`
gained `SEPOLIA_RPC`/`ADMIN_KEY` placeholders (real values go in `.env.local`).
Why: C2 is the core "actually use a relay" step. Verified: `next build` compiles,
`/api/bundle` + `/xyz` (4.43 kB) registered. jay to add env values + Sepolia funds
before it runs. Left uncommitted for review.

### New Fourth: EN/KO language toggle beside the theme button
Added a language toggle to the top bar. `app/LangContext.tsx` (client context,
localStorage-persisted, sets `<html lang>`), `app/LangToggle.tsx` (button next to
`ThemeToggle`, shows the language you'd switch to), `app/NavLinks.tsx` (menu labels
render ko/en from the context). `Nav.tsx` MENU now carries both `ko`+`en` labels;
`layout.tsx` wraps children in `LangProvider` and applies theme+lang before paint
(flash-free). First cut translates the top-menu labels; per-page content can follow.
Why: jay's New Fourth request. `next build` compiles clean. Separate commit (#2).

### i18n: translate all top-nav content (EN/KO), cookie-backed
Extended the language toggle from menu-only to full page content. Source of
truth moved to a `lang` **cookie** (server-readable) so server components
translate too; `lib/i18n.ts` (`pick(lang, ko, en)` + `Lang`, client-safe),
`lib/lang.ts` (`getLang()` via `next/headers`), `LangContext` now seeds from the
cookie and `router.refresh()` on toggle; `layout.tsx` reads the cookie and sets
`<html lang>` server-side. Translated: Nav (login/logout), XYZ page + C2
BundleSubmit + C4 RelayDashboard, Market, JayVerse, AP2, Portfolio, Summary
(IndexCards), Game, AI Chat (page + ChatClient), Login. Not yet: legacy non-nav
pages (perp, invest, simulate, dashboard). Verified: `next build` exit 0,
27/27 static pages, `/home/[slug]` still prerenders. New commit.

### docs: explain the C2 searcher sample
Added `docs/features/c2-searcher.md` — an end-to-end walkthrough of the C2
bundle-submit sample (what a bundle is; the UI→API→core layers; sign →
`eth_callBundle` sim → `eth_sendBundle`; the `X-Flashbots-Signature` auth header;
why direct JSON-RPC over the ethers-v5 SDK; security model; how to run; Sepolia
inclusion caveat). Linked from `xyz-demo.md`'s C2 section. Docs-only; uncommitted.

### C2: multi-block resubmit + New First marked DONE
Added the biggest inclusion lever to the C2 form: `submitBundle` now resubmits
the same bundle to the **next N blocks** (`current+1 … current+N`, default 5,
cap 25) via a loop of `eth_sendBundle`, simulating once against `current+1`;
per-block failures are tolerated (throws only if all fail). Return now carries
`firstBlock`/`lastBlock`/`submittedBlocks`. UI (`BundleSubmit.tsx`): new "blocks"
field + result shows target-block range and count. Why: on Sepolia the limiter
is sparse builder participation, so targeting many slots beats bumping the tip.
Also flagged **New First ✅ DONE** in `jul-01-rabbit-design.md` (C2+C4 shipped).
Verified: `next build` exit 0, 27/27 static pages, `/xyz` 6.53 kB. Uncommitted.

### C2 UI: add "💡 Suggested values" tips section
Added a collapsible tips block under the C2 form (bilingual) recommending
maxFee 25–50 / priority 2–5 on Sepolia, "blocks" as the biggest inclusion lever
(max 25), and the `maxFee ≥ 2×baseFee + priority` rule. Note: a stale `.next`
caused a spurious `/_document PageNotFoundError`; `rm -rf .next` + rebuild → clean
(exit 0, 27/27). Uncommitted.

### C2: live inclusion tracking after submit
`submitBundle` now returns the signed `txHash`. New `app/api/bundle/status`
(login-gated) checks `getTransactionReceipt` + current block. `BundleSubmit.tsx`
polls it every 4s after submit and shows ⏳ waiting (elapsed s) → ✅ included in
block N (after Xs) / ❌ not included within the block window (raise blocks or
resubmit). Answers "how long until included" live. `next build` exit 0, 27/27,
`/api/bundle/status` registered. Uncommitted.

### C2: add Mainnet option (network selector) to the bundle form
Made the C2 flow multi-network. `lib/flashbots.ts`: `NETWORKS` map (sepolia
relay-sepolia.flashbots.net/chainId 11155111, mainnet relay.flashbots.net/1),
`resolveNetwork`, per-call relay URL + chainId; result carries `network`.
`/api/bundle` picks env per network (sepolia=SEPOLIA_RPC/ADMIN_KEY,
mainnet=MAINNET_RPC/MAINNET_ADMIN_KEY, 503 if unset). `/api/bundle/status`
network-aware. UI (`BundleSubmit.tsx`): Sepolia/Mainnet toggle, red mainnet
warning banner, `window.confirm` before a mainnet submit, dynamic title/relay
host, network passed to status polling. `.env.example` + `.env.local` gained
`MAINNET_RPC`/`MAINNET_ADMIN_KEY` (mainnet = real funds; separate throwaway key).
Why: Sepolia rarely includes bundles (sparse builders); mainnet actually lands.
`next build` exit 0, 27/27. Uncommitted.

### C2: multi-builder submission (mainnet inclusion fix)
Diagnosed the mainnet non-inclusion: bundle was valid + funded (0.01 ETH) +
well-priced (sim showed coinbaseDiff 0.000105 ETH), but sent only to the
Flashbots builder, which wins few mainnet blocks now. Fix: `NETWORKS` now has
`simRelay` + a `builders[]` list; mainnet submits `eth_sendBundle` to
**Flashbots · beaverbuild · Titan · rsync** across every target block (parallel
`Promise.all` over builder×block). Sim still runs once on the Flashbots relay.
Result carries `builders` + `submissions`; UI shows the builder list and send
count, note updated. Sepolia keeps the single relay. `next build` exit 0, 27/27
(stale `.next` needed a clear first). Uncommitted.

### Session summary (2026-07-01) — what shipped
Branch `claude/jul01-rabbit-updates`. High level:
- **Docs housekeeping:** DONE/TODO status lines per task; New First & New Third
  marked ✅; Related-discussion link (Unchained freeze/front-run) added to PBS.
- **ETC → JayVerse:** menu, `/jayverse` route + stub, middleware, IA table, docs.
- **XYZ Demo (New First / PBS consumer track):**
  - **C4 observer** dashboard — multi-relay Data API (builder share / bid dist /
    latency) with network descriptions.
  - **C2 searcher** — bundle submit via relay JSON-RPC (server-signed), then
    hardened: multi-block resubmit (≤25), fee/blocks tips, live inclusion
    tracking, **Sepolia + Mainnet** networks, and **multi-builder** submission
    (Flashbots · beaverbuild · Titan · rsync) — confirmed a real mainnet inclusion.
  - Explainer: `docs/features/c2-searcher.md`.
- **New Fourth:** EN/KO language toggle; then full EN/KO i18n across all top-nav
  pages (cookie-backed so server components translate).
- **Deps/env:** ethers 6.17 (pnpm); `SEPOLIA_/MAINNET_` RPC+key placeholders.
All verified via `next build` (27/27). `.env.local` gitignored (keys not committed).
