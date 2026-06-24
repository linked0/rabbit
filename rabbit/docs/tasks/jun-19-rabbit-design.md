# Jun-19 Rabbit — Design & Task Breakdown

> Design doc derived from [`jun-19-rabbit.md`](jun-19-rabbit.md). Captures the decisions made
> and a "who does what" plan. _(2026-06-22, refined)_

## Task map
| # | Area | Status |
|---|------|--------|
| 1 | Portfolio & Market — **Input + Current Status** (Postgres) | ready to build |
| 2 | Portfolio & Market — **Simulate results** | DEFERRED (needs UX) |
| 3 | **Deploy into GCP** + domain `rabbit.jaylabs.xyz` | ready to build |
| 4 | **Main Page** — serve `know.html` (as today) | mostly current behavior |
| 5 | ~~Fetch data from Notion~~ → handled via **Cowork** (out of scope here) | moved out |

## Decisions (locked)
| Topic | Decision |
|-------|----------|
| Database | **Cloud SQL for PostgreSQL** (GCP) — project `doubletree-498007`, region `asia-northeast3` |
| ORM | **Prisma** |
| Public domain | **`rabbit.jaylabs.xyz`** (subdomain) → Cloud Run service `rabbit` |
| Auth | existing **Google login** (Auth.js) + `ALLOWED_EMAILS` gate (single user) |
| Secrets | pushed to **Secret Manager** via `scripts/deploy.sh` (existing pattern) |

> 💸 Cost note: Cloud SQL bills monthly even when idle (~$8–10+ at smallest tier). Start small, resize later.

---

## Task 1 — Investment input + Current Status (Postgres)

Per the spec, this is **two halves**: (a) an **input page** to log investment actions, and
(b) a **Current Status** view derived from those records. General investment tracking — not
crypto-only (stocks, ETFs, crypto, etc.).

### Current → Proposed
- **Current:** no database, no input page.
- **Proposed:**
  - **Input:** form → API route → Prisma → Cloud SQL Postgres. Scoped per user (`userEmail`).
  - **Current Status:** computed from the trade rows — net quantity & average cost per symbol,
    current value + unrealized P&L. (No separate table needed at first; compute on read.
    Add a `Holding` snapshot later only if performance needs it.)

### Schema (Prisma) — draft (review & adjust)
```prisma
// prisma/schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum TradeSide { BUY  SELL }

model Trade {
  id         String    @id @default(cuid())
  userEmail  String                            // matches ALLOWED_EMAILS
  assetType  String    @default("CRYPTO")       // CRYPTO | STOCK | ETF | CASH …
  market     String?                            // "Bithumb", "Upbit", "KRX", "NASDAQ" …
  symbol     String                             // "BTC", "AAPL", …
  side       TradeSide
  quantity   Decimal   @db.Decimal(38, 18)
  price      Decimal   @db.Decimal(38, 18)       // per unit, in `currency`
  currency   String    @default("KRW")           // "KRW", "USD", "USDT" …
  fee        Decimal?  @db.Decimal(38, 18)
  tradedAt   DateTime                             // when the action happened
  note       String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([userEmail, tradedAt])
  @@index([symbol])
}
```
Open: extra fields (`orderId`, `realizedPnl`)? Default `assetType` / `currency`?

### Deliverable: document the GCP DB setup
The spec asks to "provide how to set a Database instance in GCP." → produce a short doc/runbook
(Cloud SQL create → DB/user → connect Cloud Run → `DATABASE_URL` to Secret Manager).

### To-do (who does what)
| You (jay) | Me (Claude) |
|---|---|
| Confirm **billing enabled** on `doubletree-498007` | Create Cloud SQL instance + DB + user (`gcloud`) + write the setup runbook |
| Approve the schema | Add Prisma + `schema.prisma`, run migration |
| Decide **price source** for valuation (see open Q) | Build input page + API (add/list) + Current Status view |
| | Connect Cloud Run → Cloud SQL; add `DATABASE_URL` to Secret Manager |

---

## Task 2 — Simulate results based on investment policy (DEFERRED — needs UX)

- Likely shape: run the recorded trades/holdings through different **investment policies**
  (strategies/settings) and show projected profit/loss outcomes.
- **Depends on Task 1** data (trades in Postgres).
- **Blocked on:** jay's UX (Excalidraw / Balsamiq) + which policy settings matter. Claude asks
  before building if no UX is provided.

---

## Task 3 — Deploy into GCP + domain (`rabbit.jaylabs.xyz`)

### Current → Proposed
- **Current:** deploys to the auto `…run.app` URL (`scripts/deploy.sh`).
- **Proposed:** custom domain **`rabbit.jaylabs.xyz`** mapped to the Cloud Run service.

### To-do (who does what)
| You (jay) | Me (Claude) |
|---|---|
| Be ready to **edit DNS** at the `jaylabs.xyz` registrar | Run `gcloud run domain-mappings create` |
| Add the **DNS record** GCP provides; verify ownership if prompted | Give you the exact DNS record |
| Update **Google OAuth redirect URI** → `https://rabbit.jaylabs.xyz/api/auth/callback/google` | Set `AUTH_URL=https://rabbit.jaylabs.xyz` in deploy |

> Note: `deploy.sh` pins `AUTH_URL` to the `run.app` host (lines 65–71) to avoid the Auth.js PKCE
> cookie issue. Moving to the custom domain means updating that **and** the OAuth redirect URI to
> the same host.

---

## Open questions for jay (consolidated)
1. **Price source** for Current Status valuation — stocks via existing `MARKET_API_KEY`
   (Alpha Vantage / Twelve Data); **crypto needs a separate price feed**. Which to support first?
2. Trades schema — extra fields (`orderId`, `realizedPnl`)? Default `assetType`/`currency`?
3. Cloud SQL tier — smallest (shared-core) OK?
4. Simulation (Task 2) — when will you provide the UX sketch?
5. Main Page (Task 4) — link to new features, or keep standalone?

## When ready
Say **"go"** (with the open answers, or "use defaults"). Suggested branches:
`claude/db-and-status` (Task 1), `claude/web-domain` (Task 3) — each stops for review before any commit.
