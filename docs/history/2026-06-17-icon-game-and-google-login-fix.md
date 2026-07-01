# 2026-06-17 — Icon, game page, top-menu, and Google-login fix

Session summary of the Jun-16 task batch (see `docs/tasks/Jun-16-plan.md`) plus a
production Google-login fix.

## Summary
- Added web-page icon via `app/icon.png` + `app/apple-icon.png` (App Router auto-serves).
- Added `/game` mini-game route and a `게임` link in the shared `Nav`.
- Fixed favicon 302 by adding `icon.png|apple-icon.png` to the `middleware.ts` matcher.
- Root-caused Google login failure to two Cloud Run hosts; pinned `AUTH_URL` to the stable projectNumber host.
- Local mode (`APP_MODE=local`) enables password login for dev; deploy forces `APP_MODE=cloud`.
- Deployed revision `rabbit-00006-m8j` (100%), verified live.

## Features

### #1 Web page icon
- Converted `~/work/task/images/profile.jpg` (266×266) → `app/icon.png` and `app/apple-icon.png` (180×180).
- Next.js App Router auto-serves these as the favicon / Apple touch icon — no `layout.tsx` change needed.

### #2 Game page + consistent top menu
- New `/game` route: `app/game/page.tsx` + `app/game/Game.tsx` — a lightweight 2D-canvas mini-game ("코인 받기" / Coin Catcher: catch falling ₿·Ξ coins, 3 lives, score/best). Chose canvas over raw WebGL for a dependency-free sample (can upgrade later).
- Added a `게임` link to `app/Nav.tsx`; since every authenticated page renders the shared `Nav`, the top menu is now consistent across 요약 / AI 챗 / 포트폴리오 / 게임.

## Bug fix: favicon blocked by middleware
- `/icon.png` returned 302 (redirected to `/login`) — the middleware matcher excluded `favicon.ico` but not the App Router icon routes.
- Added `icon.png|apple-icon.png` to the matcher in `middleware.ts`; both now return 200.

## Google login on Cloud Run — root cause & fix
- **Symptom:** `redirect_uri_mismatch`, and earlier `[auth][error] InvalidCheck: pkceCodeVerifier value could not be parsed` → `/api/auth/error?error=Configuration` (500).
- **Root cause:** the service has two Cloud Run hostnames (`rabbit-179807446244.asia-northeast3.run.app` and `rabbit-fimfrbyasa-du.a.run.app`). Login started on one host but `AUTH_URL` forced the callback to the other, so the host-locked PKCE cookie was never sent back → InvalidCheck.
- **Fix:** standardize on the stable projectNumber host — set `AUTH_URL` to `https://rabbit-179807446244.asia-northeast3.run.app`, registered the matching OAuth redirect URI in Google Console, and patched `scripts/deploy.sh` (line 65) to pin `AUTH_URL` to `https://${SERVICE}-${PROJECT_NUMBER}.${REGION}.run.app` instead of `status.url` (which returned the other host and silently re-broke it on each deploy). All three (browse host, `AUTH_URL`, OAuth redirect URI) now agree on one host.

## Local mode
- `.env.local` `APP_MODE=local` enables password login (no Google) for local dev; `deploy.sh` always forces `APP_MODE=cloud`, so production is unaffected.
- Added `.claude/launch.json` (`rabbit-dev` → `pnpm dev`, port 3000) for preview.

## Deploy
- Deployed via `./scripts/deploy.sh`; live revision `rabbit-00006-m8j` serving 100%.
- Verified live: `/login` shows the Google button (cloud), `/icon.png` 200, `/game` 302 (protected), `/` 200.

## Planning docs added
- `docs/tasks/Jun-16-plan.md` — design/approach for the four Jun-16 tasks.
- `docs/tasks/review-checklist.md` — "what to check/analyze" review of work to date.
