# 2026-07-01 — task history

Source doc: [docs/tasks/jul-01-rabbit-design.md](../tasks/jul-01-rabbit-design.md) · PR [#19](https://github.com/linked0/task/pull/19)

## Summary — what shipped
- **ETC → JayVerse** — renamed the menu, `/jayverse` route/stub, middleware, IA table, docs.
- **XYZ Demo (New First / PBS consumer track):**
  - **C4 observer** — multi-relay Data API dashboard (builder share · bid distribution · latency).
  - **C2 searcher** — bundle submit via relay JSON-RPC (server-signed), then hardened: multi-block
    resubmit, fee/blocks tips, live inclusion tracking, **Sepolia + Mainnet**, **multi-builder**
    submit (Flashbots · beaverbuild · Titan · rsync) → confirmed a real mainnet inclusion.
- **New Fourth** — EN/KO toggle, then full **EN/KO i18n** across all top-nav pages.
- **Docs** — DONE/TODO markers; C2 explainer; `jul-02` design (PBS-in-cloud); this history.
- **Verify** — every step passed `next build` (27/27). `.env.local` gitignored — no keys committed.

## Log

### tasks doc — DONE/TODO status lines
- Added ✅/🔲 markers on the line under each task heading in the design doc (scannable status).

### New Third — ETC → JayVerse
- Folded `etc.md`'s SimpleX experiment into `xyz-demo.md`.
- `git mv etc.md jayverse.md`; rewrote as the JayVerse showcase (`/jayverse`, Gravia dashboard).
- IA table (`README.md`): ETC → JayVerse.

### JayVerse rename — propagate the menu name
- Updated menu-bar strings + New Second prose in the design doc (ETC → JayVerse).
- Left historical files + `docs/zsub/` untouched.
- **Open:** §7 "ETC — ERC-7702/7715 demo" still needs a home (JayVerse vs XYZ vs own slot).

### App — apply ETC → JayVerse (menu + route)
- `Nav.tsx`: `ETC → /etc` → `JayVerse → /jayverse`.
- `git mv app/etc app/jayverse`; stub rewritten (`JayVersePage`, `SIMULATED / DEMO`).
- `middleware.ts` PUBLIC_PATHS `/etc` → `/jayverse`. Verified: no `/etc` leftovers.

### XYZ — C4 PBS relay observer dashboard
- New `app/api/relay/route.ts` — fans out (`Promise.all`, 6s timeout) to 4 public relay Data APIs
  (Flashbots · bloXroute · Agnostic · Ultra Sound), measures per-relay latency; public route.
- `RelayDashboard.tsx` (20s auto-refresh) — builder share (deduped by block_hash), bid distribution,
  relay latency/status, recent delivered blocks.
- Later: added a "what am I looking at" panel (network + endpoint + relays) + per-panel explainers.

### XYZ — C2 searcher (bundle submit)
- Installed `ethers` 6.17 via **pnpm** (npm corrupted the pnpm store; project pins pnpm@11.5.1).
- Skipped the ethers-v5 Flashbots SDK — talk to the relay JSON-RPC directly (`eth_callBundle` →
  `eth_sendBundle`, `X-Flashbots-Signature` header, ephemeral reputation key).
- New: `lib/flashbots.ts`, `app/api/bundle/route.ts` (Node runtime, **login-gated**, reads
  `SEPOLIA_RPC`/`ADMIN_KEY` — key never sent to browser), `app/xyz/BundleSubmit.tsx`.
- Hardened over several passes:
  - **Multi-block resubmit** — next N blocks (default 5, max 25); the main Sepolia inclusion lever.
  - **Tips** — collapsible "💡 Suggested values" (maxFee/priority/blocks + `maxFee ≥ 2·baseFee + priority`).
  - **Inclusion tracking** — return `txHash`; `/api/bundle/status` polls the receipt → ⏳ waiting →
    ✅ included in block N / ❌ not in window.
  - **Networks** — Sepolia + **Mainnet** (per-network env, warning banner + confirm on mainnet).
  - **Multi-builder** — mainnet sends to Flashbots · beaverbuild · Titan · rsync (the Flashbots
    builder alone rarely wins mainnet slots). Confirmed a real mainnet inclusion.
- Marked **New First ✅ DONE**.

### New Fourth — EN/KO language + i18n
- Toggle button beside the theme toggle (`LangContext` + `LangToggle` + `NavLinks`).
- Then full **EN/KO i18n** across all top-nav pages — source of truth is a `lang` **cookie**
  (`lib/i18n.ts` + `lib/lang.ts`) so server components translate too; toggle `router.refresh()`s.
- Not yet: legacy non-nav pages (perp, invest, simulate, dashboard).

### Docs
- `docs/features/c2-searcher.md` — end-to-end C2 walkthrough (bundle, sim→submit, auth header,
  security, how to run); linked from `xyz-demo.md`.
- Added the Unchained (freeze/front-run) **related-discussion** link to the PBS section.
- `docs/tasks/jul-02-rabbit-design.md` — derived from jul-01 with **done tasks omitted**; lead item
  = **PBS consumer track in the cloud** (Secret Manager, jay-only gate, mainnet off by default).
  Includes the Gravia reference image.

### Deps / env
- `ethers` 6.17 (pnpm).
- `.env.example`: `SEPOLIA_/MAINNET_` RPC + key placeholders. `.env.local` gitignored (real values only there).
