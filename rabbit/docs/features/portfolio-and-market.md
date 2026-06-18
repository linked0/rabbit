# Portfolio & Market

**Goal:** merge **Investment Summary** (`/summary`) and **Portfolio** (`/dashboard`) into one
**Portfolio & Market** page, and add a **database** so holdings persist.

## Current
- `/summary` → `IndexCards.tsx`: BTC/ETH/S&P 500/KOSPI, 60s refresh.
- `/dashboard` → `Dashboard.tsx`: manual holdings → P&L + scenarios. **In-memory only**
  (refresh loses data). This is the "Last Development Status & Prerequisite" item.

## Proposed
- One route **`/portfolio`** with two zones: **Market** (index cards) and **Portfolio**
  (holdings, P&L, scenarios) — stacked or tabbed.
- **Persistence** for holdings across sessions/devices.

## Database options (recommendation)
| Option | Fit |
|--------|-----|
| **Cloud SQL (Postgres) + Prisma** | relational; solid for holdings/transactions — **suggested** |
| Firestore | simplest serverless, weaker for relational P&L queries |
| SQLite (file) | trivial, but poor on stateless Cloud Run |

## Open questions
- Cloud SQL (cost, relational) vs Firestore (simpler) — your call.
- Track transactions/history, or just current holdings?

## Features
- [ ] **Database**
  - [ ] (you) Choose Cloud SQL Postgres vs Firestore
  - [ ] Provision the DB + add Prisma (if Postgres)
  - [ ] Schema: `holdings(user, symbol, qty, avgPrice, buyDate)`
  - [ ] CRUD API route for holdings
- [ ] **Merge the pages**
  - [ ] New `/portfolio` page = Market (IndexCards) + Portfolio (Dashboard)
  - [ ] Migrate `Dashboard.tsx` state → DB (key by Google email)
  - [ ] Redirect `/summary` + `/dashboard` → `/portfolio`
