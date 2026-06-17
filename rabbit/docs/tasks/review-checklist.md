# Rabbit — What to Check / Analyze (review of work to date)

> Generated 2026-06-17. A prioritized review list for the **v0 PoC** (dual-mode
> Next.js crypto-portfolio tool, live on Cloud Run since 2026-06-12). This is *what to
> verify and decide next*, not a status report — see `docs/tasks/first-phase-design.md`
> for the spec and `docs/history/2026-06-12-deploy-troubleshooting.md` for the deploy log.

## TL;DR — current state
- v0 complete: dual-mode auth (local password / Google OAuth + allowlist), `know.html` landing, 4 index cards (BTC/ETH/S&P 500/KOSPI), portfolio P&L tool, streaming AI chat, idempotent GCP deploy, iOS WKWebView wrapper.
- Live: `https://rabbit-fimfrbyasa-du.a.run.app` (project `doubletree-498007`, region `asia-northeast3`).
- **No tests, no persistence** (portfolio state is in-memory and lost on refresh). Excel upload + Verex integration deferred.

## 1. Security / auth to verify
- [ ] **Local password is a plain-text compare** (`auth.ts:25`, value in `.env.local`). Fine for a solo PoC; note it before any multi-user use (hash with bcrypt/argon2 or switch to key-based).
- [ ] **Email allowlist** (`auth.ts`): confirm it's case-insensitive (`.toLowerCase()`) and comma-split correctly; verify Google always returns the expected email.
- [ ] **OAuth redirect URI** is registered manually in Google Cloud Console (not automated by `deploy.sh`) — confirm it matches the live `AUTH_URL`.
- [ ] **Session timeout** (JWT `maxAge=3600s`): test that a 1h idle actually redirects to `/login`. There's no visible logout button — consider adding one.
- [ ] **NextAuth v5 is beta** (`5.0.0-beta.31`). Check for known advisories before treating it as production-stable.

## 2. Docker / deploy to verify
- [ ] **`.dockerignore` + `.gcloudignore` actually block `.env*`** — confirm by deploying and checking the build context never uploaded `.env.local`. (This is exactly the global Docker policy: multi-stage copies only artifacts, `.dockerignore` keeps source/secrets out.)
- [ ] **Multi-stage Dockerfile** copies only `.next/standalone`, `.next/static`, `public` — no full `node_modules`, no source in the runner. ✅ looks correct; re-confirm after any Next.js bump.
- [ ] **Node 22 + pnpm 11.5.1 pinning** (`package.json`) — the Cloud Build fix from 2026-06-12. Keep pinned; Node 20 lacks `node:sqlite`.
- [ ] **`deploy.sh` idempotency** — re-run it and confirm no errors (secret versions add cleanly, IAM binding re-applies).
- [ ] **Build-time dummy `AUTH_SECRET`** (`Dockerfile:10`) is overridden by the Secret Manager value at runtime — confirm the runtime secret is actually in effect.

## 3. Code quality / correctness to analyze
- [ ] **Zero tests.** Start with: `lib/coins.ts` P&L math (`computeHolding`, `projectOneYear`), the API routes (`/api/indices`, `/api/prices`, `/api/chat`), and the auth flow.
- [ ] **`IndexCards.tsx` `setInterval` cleanup** — verify the 60s refresh clears on unmount (`return () => clearInterval(id)`); otherwise a remount leaks timers.
- [ ] **No error boundaries** — add `app/error.tsx` / `app/global-error.tsx`; today a failed API can surface a raw error.
- [ ] **Hard-coded values** — AI model `gpt-4o-mini` (`lib/ai.ts:16`) and bear/base/bull rates (`Dashboard.tsx`) should be config/env.
- [ ] **`projectOneYear` is linear, not compounding** — confirm that's the intended model for the scenarios.

## 4. Functional spot-checks
- [ ] **Local mode**: password login → `/summary` → `/dashboard` (input → P&L → scenarios).
- [ ] **Cloud mode**: Google login → same flow on the live URL.
- [ ] **Index cards** refresh every 60s with live CoinGecko/Yahoo data (watch for `—`/`NaN` on API failure — failures are currently silent in the UI).
- [ ] **AI chat** streams end-to-end. Note: **local Ollama is broken on this machine** (`first-phase-design.md:61`) — fix it or test chat in cloud mode only.
- [ ] **iOS real device**: the Mac LAN IP is hard-coded (`ios/Rabbit/Rabbit/ContentView.swift:18` → `192.168.0.34:3000`) — only works on that one Wi-Fi. Consider pointing the device build at the Cloud Run HTTPS URL instead.

## 5. Spec ↔ code gaps to reconcile
- [ ] **`know.html` dead links in cloud.** It has local `docs/*.md` links that won't resolve in production (`first-phase-design.md` Q-A, line 46). Decide: adapt the links or add a disclaimer.
- [ ] **Data persistence** is acknowledged-missing (in-memory only). If you want refresh-survival before a DB, a `localStorage` fallback is the cheap option.
- [ ] **`MARKET_API_KEY`** is defined but unused (Yahoo needs no key) — drop it or wire it up.
- [ ] **`.env.example:15`** ships a real address (`linked0@gmail.com`) — replace with `you@example.com`.

## Quick verify commands
```bash
pnpm build                 # TypeScript strict-mode + standalone output
./scripts/deploy.sh        # should be idempotent (re-run safe)
curl -s https://rabbit-fimfrbyasa-du.a.run.app/api/indices | head   # live data check
```
