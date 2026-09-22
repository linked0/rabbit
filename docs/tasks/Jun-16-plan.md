# Plan / design for Jun-16 tasks — Rabbit project
17th June 2026

My approach for each task in [`Jun-16-tasks.md`](./Jun-16-tasks.md). This is the plan
only — no code changed yet. Each item lists the design, the files I'd touch, and open
questions for you.

---

## 1. Change the web page icon
**Goal:** use `/Users/jay/work/task/images/profile.jpg` as the site icon (favicon + tab icon).

**Current state:** `app/layout.tsx` sets `metadata.title`/`description` but **no icon** — so
the browser shows a default. No favicon exists in `public/` (only `know.html`).

**Design (Next.js App Router):**
1. Copy the source into the app dir as a file-based icon — Next auto-detects it:
   `app/icon.png` (App Router serves `app/icon.*` as the favicon automatically).
   - `profile.jpg` is a JPG; convert to PNG (and ideally 32×32 / 180×180) so it works as
     a favicon + Apple touch icon. `sips -s format png profile.jpg --out app/icon.png` on macOS.
2. Optionally also add `app/apple-icon.png` for iOS home-screen (ties into the WKWebView wrapper).
3. No `layout.tsx` change strictly needed, but I can add an explicit `metadata.icons`
   entry if you prefer the icon in `public/` instead.

**Files:** `app/icon.png` (new), maybe `app/apple-icon.png`, maybe `app/layout.tsx`.
**Verify:** load the app, check the tab favicon + `/icon.png` resolves.
**Open Q:** keep aspect ratio / crop to square? `profile.jpg` should be square for a clean icon.

---

## 2. WebGL game page (sample, reachable from the top menu)
**Goal:** a small sample game like `https://messenger.abeto.co/`, entered via a top menu item.

**Current state:** `app/Nav.tsx` is the post-login top bar with links: 지식 `/`, 요약
`/summary`, AI 챗 `/chat`, 포트폴리오 `/dashboard`. Adding a tab here is the natural entry point.

**Design:**
1. New route `app/game/page.tsx` (client component, `"use client"`).
2. Keep it a **simple sample**, not a full engine — a `<canvas>` with lightweight WebGL
   (or plain 2D canvas if WebGL is overkill). e.g. a floating-object / particle toy or a
   tiny "tap to score" loop, mirroring the playful feel of the reference.
3. Add a nav link in `Nav.tsx`: `<Link href="/game">게임</Link>`.
4. `middleware.ts` already guards non-public routes, so `/game` is login-protected by default
   (fine, since the menu only shows after login).

**Files:** `app/game/page.tsx` (new), `app/Nav.tsx` (one link), maybe a small `app/game/Game.tsx`.
**Open Q:** WebGL specifically, or is a 2D `<canvas>` sample acceptable? And which menu label —
"게임" / "Game"? (Task says I can choose the name.)

---

## 3. Google login error — "Server error: problem with the server configuration"
**Goal:** fix the error in `docs/images/issues/login-server-error.png` when signing in with Google.

**What the screenshot shows:** NextAuth's generic **`Configuration`** error page ("There is a
problem with the server configuration. Check the server logs"). This is thrown *before*
redirecting to Google, so it's almost always a **missing/invalid env or provider config**, not a
Google-side redirect mismatch.

**Most likely causes (in order):**
1. **`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` missing or empty** in the Cloud Run runtime
   (Secret Manager value not set, or not wired in `deploy.sh`'s `--set-secrets`).
2. **`AUTH_SECRET` missing at runtime** (the Dockerfile bakes a build-time dummy; the real one
   must come from Secret Manager).
3. **`AUTH_URL` / host trust** — on Cloud Run behind a proxy, Auth.js may need `trustHost: true`
   (or correct `AUTH_URL`) or it refuses to construct callback URLs.
4. OAuth consent / redirect URI not registered → but that usually surfaces as Google's
   `redirect_uri_mismatch`, a *different* page, so check this only after 1–3.

**Diagnostic plan:**
1. Read the Cloud Run logs for the Auth.js error code (`gcloud run services logs read rabbit`).
2. Confirm the three secrets exist and are bound: `gcloud secrets versions list AUTH_GOOGLE_ID` etc.,
   and that `deploy.sh` passes them via `--set-secrets`.
3. Check `auth.ts` reads the right env names (`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`) and consider
   adding `trustHost: true` for Cloud Run.
4. Re-deploy, retry Google login, watch logs.

**Files:** likely `auth.ts` (trustHost / env), `scripts/deploy.sh` (secret wiring) — TBD after logs.
**Open Q:** can you share the Cloud Run log line for this request? It names the exact Auth.js cause.

---

## 4. Feature design — Agentic Commerce (M2M / AP2 / X402)
**Goal:** an imaginative feature design using agentic-commerce rails (M2M, Google's AP2, or
Coinbase's x402). Output a design doc in `docs/tasks/`.

**Design (what I'd write):** a standalone doc, e.g. `docs/tasks/agentic-commerce-design.md`, sketching
how rabbit's AI chat agent could **act on the portfolio**, not just describe it:
- **Concept:** the chat agent proposes an action ("rebalance 5% BTC→ETH") and can *execute a
  payment/settlement* autonomously via an agent-to-agent payment protocol.
- **Rail options & when each fits:**
  - **x402** — HTTP 402-based pay-per-call; agent pays per data/API call (e.g. premium market data) in stablecoin.
  - **AP2 (Agent Payments Protocol)** — mandate/credential model where the user delegates bounded
    spend authority to the agent; fits "approve once, agent transacts within limits."
  - **M2M** — machine-to-machine settlement between rabbit's agent and a counterparty service.
- **Trust & limits:** spend caps, allowlists, an approval step for anything above a threshold —
  mirrors the same read-only-vs-write safety line we use elsewhere.
- **Verex tie-in:** this overlaps Verex's Phase-3 session-key / paymaster work (`verex/docs/plan/watch-list.md`),
  so the design should note where the two could share an agent-authority model.

**Files:** `docs/tasks/agentic-commerce-design.md` (new design doc).
**Open Q:** which rail should be the centerpiece — x402 (pay-per-call), AP2 (delegated mandates),
or a comparison of all three? And is this purely conceptual, or should it include a small PoC route?

---

## Suggested order
1. **Login error (#3)** — it's a live blocker; needs your Cloud Run log line to pinpoint.
2. **Web icon (#1)** — quick, self-contained.
3. **WebGL game (#2)** — needs your call on WebGL-vs-canvas + menu label.
4. **Agentic Commerce design (#4)** — a writing task; needs your steer on which rail.

Tell me which to start with (and the open questions above) and I'll implement that one.
