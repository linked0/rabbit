# First Phase Design

## Requirements

### To Do List
- All the code should be deployed in GCP at first with some shell script
- 

### Request
- Tell me what I should provide for asking you to implement the To Do list.
- Add AI chatting page to the app with some API key and use local ollama in running in local
- Main page should be "/Users/jay/work/task/know.html"
- Google login is required when running in GCP cloud.
- If it runs in local mode it should have be logged in with some specific password.
- Session time should be like 1 hour or something.
- When a user logs in, the investment summary page should be shown that is initially just show a ETH, BTC, S&P, KOSPI index.

## Design by Claude

### 0. Summary
Phase 1 evolves the v0 PoC into a **mode-aware, deployable** app: one codebase that
runs **locally** (password login + local Ollama) and **on GCP Cloud Run** (Google
login + cloud LLM). It is fronted by `know.html` as the landing page, shows an
**investment-summary** dashboard (ETH / BTC / S&P 500 / KOSPI) right after login,
adds an **AI chat** page, and ships with a single **`deploy.sh`** for GCP.

### 1. Run modes — one switch, `APP_MODE`
`APP_MODE = local | cloud` (default: auto-detect Cloud Run via the `K_SERVICE` env var).

| concern | `local` | `cloud` (GCP) |
|---|---|---|
| auth | password (Credentials provider) | Google OAuth (existing NextAuth) |
| AI backend | Ollama @ `localhost:11434` | hosted LLM via API key |
| secrets | `.env.local` | GCP Secret Manager |

### 2. Auth & session  *(req: Google in cloud, password in local, ~1h session)*
- NextAuth / Auth.js v5, **JWT session**, `session.maxAge = 60 * 60` (**1 hour**) — env-overridable via `SESSION_MAX_AGE`.
- `cloud` → Google provider + email allowlist (already built in v0).
- `local` → **Credentials provider** comparing one `LOCAL_PASSWORD` (hashed compare; no user DB).
- `middleware.ts` guards every route except the public landing; unauthenticated → `/login`.
- Files: `auth.ts` (conditional providers by `APP_MODE`), `middleware.ts`, `app/login/page.tsx`.

### 3. Main page = `know.html`  *(req: main page should be know.html)*
- Serve `know.html` as the **public landing at `/`**.
- Approach: copy `task/know.html` → `rabbit/public/know.html`; `/` serves it; add a "Log in" entry that routes to `/login` → on success redirect to `/summary`.
- ⚠️ **Caveat (Q-A):** `know.html` links to local `docs/*.md` / `file://` paths that won't resolve once deployed. Decide: (a) serve as-is (some links dead in cloud), or (b) strip/adapt links to app routes.

### 4. Investment summary — default post-login view  *(req: ETH, BTC, S&P, KOSPI)*
- Route `/summary` = landing after login. Four index cards: **ETH, BTC** (crypto) + **S&P 500, KOSPI** (equity indices).
- New `app/api/indices/route.ts` aggregates two sources:
  - ETH / BTC → **CoinGecko** (reuse existing `/api/prices`).
  - S&P 500 (`^GSPC`) + KOSPI (`^KS11`) → a **market-data provider** (Alpha Vantage / Twelve Data / Yahoo) → needs `MARKET_API_KEY`.
- Each card: latest value + daily change %, with a refresh interval.
- The v0 portfolio dashboard (`Dashboard.tsx`) becomes a secondary tab, not the entry view.

### 5. AI chat page  *(req: chat page; API key in cloud, local Ollama in local)*
- Route `/chat` + streaming `app/api/chat/route.ts`, behind the auth guard.
- Provider abstraction `lib/ai.ts`:
  - `local` → POST Ollama `/api/chat` (`OLLAMA_BASE_URL`, `OLLAMA_MODEL`).
  - `cloud` → hosted LLM with `AI_API_KEY` (`AI_PROVIDER` = `openai` | `anthropic` | …).
- ⚠️ Local Ollama is currently broken on this machine (missing `llama-server` backend) — must be fixed before the local path works.

### 6. GCP deploy via shell script  *(To-Do: deploy to GCP with a shell script)*
`scripts/deploy.sh` automates the README §9 run book, **idempotent** (safe to re-run), reading values from a git-ignored `scripts/deploy.env`:
1. `gcloud config set project`, enable `run` / `cloudbuild` / `artifactregistry` / `secretmanager` APIs.
2. create-or-update Secret Manager secrets (auth-secret, google-id/secret, market-key, ai-key).
3. `gcloud run deploy rabbit --source . --region … --no-allow-unauthenticated --set-env-vars APP_MODE=cloud,… --set-secrets …`.
4. update `AUTH_URL` to the deployed domain; print the reminder to add the OAuth redirect URI.

### 7. Config / env matrix
| var | local | cloud | purpose |
|---|---|---|---|
| `APP_MODE` | `local` | `cloud` | mode switch |
| `AUTH_SECRET` | ✅ | ✅ (secret) | NextAuth signing |
| `SESSION_MAX_AGE` | 3600 | 3600 | 1-hour session |
| `LOCAL_PASSWORD` | ✅ | — | local login |
| `AUTH_GOOGLE_ID/SECRET` | — | ✅ (secret) | Google login |
| `ALLOWED_EMAILS` | — | ✅ | email allowlist |
| `AUTH_URL` | — | ✅ | callback base URL |
| `AI_PROVIDER` / `AI_API_KEY` | — | ✅ (secret) | cloud LLM |
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` | ✅ | — | local LLM |
| `MARKET_API_KEY` | ✅ | ✅ (secret) | S&P / KOSPI data |

### 8. New / changed files
`auth.ts` (conditional providers + 1h session) · `middleware.ts` · `app/login/page.tsx` ·
`public/know.html` + `/` route · `app/summary/page.tsx` + `app/api/indices/route.ts` ·
`app/chat/page.tsx` + `app/api/chat/route.ts` + `lib/ai.ts` · `lib/market.ts` ·
`scripts/deploy.sh` + `scripts/deploy.env.example` · `.env.example` updates.

### 9. What you (jay) need to provide  *(req: "Tell me what I should provide")*
Before I implement, please provide / confirm:
1. **GCP** — project ID, billing enabled, region (default `asia-northeast3`), `gcloud auth login` done.
2. **Google OAuth** — client ID + secret (or OK for me to walk you through creating them), allowed email(s) [`linked0@gmail.com`?], redirect URIs.
3. **Local password** — pick `LOCAL_PASSWORD` (or I generate one).
4. **AI** — cloud provider choice (OpenAI / Anthropic / …) + API key; local Ollama model name; **fix Ollama** first.
5. **Market data** (S&P / KOSPI) — provider choice (Alpha Vantage free tier / Twelve Data) + API key.
6. **know.html** — serve as-is, or adapt its local links? (Q-A)
7. *(optional)* custom domain.
> `AUTH_SECRET` I can generate (`npx auth secret`).

### 10. Open questions
- **Q-A** — `know.html` local-file links: serve as-is (dead links in cloud) or adapt to app routes?
- **Q-B** — cloud AI provider: OpenAI vs Anthropic vs Gemini?
- **Q-C** — S&P / KOSPI data source (mind free-tier rate limits)?
- **Q-D** — is "main page = know.html" the **pre-login** landing (assumed), with post-login → `/summary`? Confirm.
- **Q-E** — local password: single shared value in env (assumed), hashed?

### 11. Suggested build order
1. `APP_MODE` switch + auth (Google/cloud, password/local, 1h session).
2. `know.html` landing + route guard.
3. `/summary` with 4 indices (+ `/api/indices`).
4. `/chat` (Ollama local / API cloud).
5. `scripts/deploy.sh` + first GCP deploy.