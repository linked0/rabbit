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
