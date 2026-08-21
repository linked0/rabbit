# Rabbit — Current Plan (rolling)

> **Reset 2026-08-21 (jay).** The previous plan — *Agentic AA: the autonomy loop* — was
> **archived unstarted** at
> [archive/2026-08-21-current-plan-agentic-aa.md](archive/2026-08-21-current-plan-agentic-aa.md).
> Nothing was deleted: its unbuilt milestones (M1–M5), its five open decisions (D1–D5), and the
> Unity side-quest moved to
> [../features/README.md → Backlog](../features/README.md#backlog) as **B1** and **B2**, where
> they sit next to the rest of the repo's status instead of pretending to be active work.
>
> **This file currently has no active task.** That is deliberate, not an oversight — jay picks
> the next one ([P0](#p0)). Until then the queue below is a menu, not a commitment.

## Table of contents <a id="toc"></a>
- [§0 — Summary (start here on a cold session)](#s0)
- [Roadmap status](#roadmap)
- [Next-work queue](#queue)
- [How this file relates to the other docs](#relations)

## 0. Summary — start here on a cold session <a id="s0"></a>
<sub>[↑ TOC](#toc)</sub>

**Where the work stands.** Rabbit is a portfolio of shipped surfaces plus a large research
catalogue. The app's menu (`/` · `/portfolio` · `/projects` · `/game` · `/poc` · `/live`) is
built; the PoCs hub carries **52 cards — 6 live, 5 done, 1 paid, 41 planned**. Nothing is
half-finished in a way that blocks anything else, which is why the plan could be reset cleanly
rather than carried over.

**What is not built,** in one line each: the autonomy loop is a mock ([B1](../features/README.md#b1)),
there is still **no CI/CD** (`.github/workflows/` does not exist), `/market`'s Hyperliquid
trading is partial, Jay Chat has no gating or KB-RAG, and `/xyz` has two of its items live.

**History.** This doc stays short on purpose. For the blow-by-blow of what was built on a given
day, follow `docs/history/YYYY-MM-DD-rabbit-history.md` — latest
[2026-08-21](../history/2026-08-21-rabbit-history.md) (this reset), with the recent PoC-card work
at [2026-08-19](../history/2026-08-19-rabbit-history.md) and the last full status audit at
[2026-08-18](../history/2026-08-18-rabbit-history.md).

**Next step:** answer [P0](#p0) — pick one candidate from the queue. Then this file gets rewritten
around that task with its own milestone table, the way the archived plan was.

## Roadmap status <a id="roadmap"></a>
<sub>[↑ TOC](#toc)</sub>

> **The per-feature status table lives in
> [../features/README.md](../features/README.md)** and is the single status source for the repo.
> This table is the short version a cold session reads first — the ✅ rows are collapsed to one
> line, and the marks below were checked against the code on `main` (routes enumerated from
> `app/**/page.tsx`, API routes from `app/api/`), not against the commit log.

| Area | Route | Status | Gap |
|------|-------|--------|-----|
| Home · Portfolio · Projects · PoCs hub · 7702 inspector · AP2 · Toss | `/` `/portfolio` `/projects` `/poc` `/poc/7702` `/poc/ap2` `/poc/toss` | ✅ done | — |
| Market — Hyperliquid trading | `/market` | 🟡 partial | order book / trades / perp APIs exist; the trading surface is not finished ([portfolio-and-market.md](../features/portfolio-and-market.md)) |
| AI Chat — Jay Chat on Home | `/` (embedded) | 🟡 partial | public surface + ask-about-me ✅; **gating / BYO-key ⬜, KB-RAG ⬜** ([ai-chat.md](../features/ai-chat.md)) |
| XYZ Demo | `/xyz` | 🟡 partial | C2 bundle-submit + C4 PBS relay dashboard live; the rest pending ([xyz-demo.md](../features/xyz-demo.md)) |
| Agentic AA — building blocks | `/poc/aa` | 🟡 partial | ① session key + ②③ sponsored/batch tx live; ④ KYA stayed an explainer (ERC-8004 testnet registry unverified) |
| Agentic AA — autonomy loop | `/poc/agent` | ⬜ mock only | **[B1](../features/README.md#b1)** — no `app/api/agent`, no store, no scheduler. Blocked on **D2** |
| Unity visualization | `/poc/agent` toggle | ⬜ deferred | **[B2](../features/README.md#b2)** — blocked on **U1**, sequenced after B1's M5 |
| CI/CD | — (infra) | ⬜ not started | **`.github/workflows/` does not exist.** `common.md` describes a `deploy.yml` that was never written; verex has a working `deploy-staging.yml` to copy the shape from |
| PoC research catalogue | `/poc` | 🔄 ongoing | 41 of 52 cards are `soon` — research items, not owed work. Cards are added as material arrives |

**Legend:** ✅ done · 🟡 partial / in progress · ⬜ not started · 🔄 ongoing · ⛔ blocking.

## Next-work queue — 0 active · 1 gate · 5 candidates <a id="queue"></a>
<sub>[↑ TOC](#toc)</sub>

> Same shape as [verex's queue](../../projects/verex/docs/tasks/current-plan.md): **Why now /
> Gate / Done when** per item. "Done when" is a verification gate — a task is not done because
> code exists, it is done when the stated check passes. Estimates are focused-work days.
> **Nothing below is committed to.** Picking one is [P0](#p0).

### 0) `(you)` P0 — pick the next task ⛔ **BLOCKING** <a id="p0"></a>

**Why now:** the plan was reset with no successor chosen, so every candidate below is gated on
one sentence from jay.
**Done when:** jay names a candidate, this file is rewritten around it with its own milestone
table, and the chosen row's feature doc becomes the design source.
**Recommendation, if you want one:** **C2 (CI/CD)** — it is the smallest item on the list, it is
the only one that makes *every* later task cheaper, verex already has the working file to copy,
and it closes a gap the features table has been carrying since 2026-08-03.

### 1) C1 — finish Market's Hyperliquid trading · ~2–3d

**Why now:** the most visible 🟡 on the site; `/market` is in the top menu, so the unfinished
surface is the one a visitor is most likely to land on.
**Gate:** none — the APIs (`app/api/orderbook`, `trades`, `perp`) already exist.
**Done when:** a visitor can read the live book and see their own position without opening a
console, and the page degrades honestly when the upstream is down.

### 2) C2 — CI/CD via GitHub Actions ⭐ · ~1d <a id="c2"></a>

**Why now:** `common.md` has described a `deploy.yml` since June and it was never written; every
deploy is still manual. Verex shipped `deploy-staging.yml` on 2026-08-07 — the shape is known.
**Gate:** none. GCP credentials already exist for the current manual deploy.
**Done when:** a push to `main` builds and deploys to Cloud Run without a local `gcloud` command,
and a deliberately broken build fails the check rather than deploying.

### 3) C3 — autonomy loop, M1 + M2 only · ~2d

**Why now:** it is the repo's most interesting unbuilt claim, and M2 (`POST /api/agent/tick`,
callable by hand) is the whole loop minus the scheduler — verifiable by `curl`, with no
scheduler and no deploy story needed.
**Gate:** ⛔ **D2 — where the session key lives.** Proposal on the table is server-side
generation, address-only to the browser, labelled testnet-grade custody. Needs jay's explicit OK
([Backlog B1](../features/README.md#b1)).
**Done when:** a mandate can be granted scoped to amount + expiry + recipient and revoked, and
`POST /api/agent/tick` runs observe → decide → act → record with **calling it twice in a row
being safe**.

### 4) C4 — XYZ demo items 1 + 2: priced data an agent pays for · ~2–3d

**Why now:** [../features/README.md](../features/README.md)'s own "suggested demo cut" — a Go
price-oracle service plus the existing x402 loop reframed so the paid resource is that feed. One
coherent employer-facing story rather than two toys, and item 2 extends `/poc/ap2` instead of
adding a throwaway.
**Gate:** none, but it is the only candidate that adds a **second language** (Go) to the repo.
**Done when:** an agent requests a price, gets `402`, pays, and receives a signed quote — with
the whole exchange visible on the page.

### 5) C5 — Jay Chat: gating + BYO-key, then KB-RAG · ~1–2d for the gate, more for RAG

**Why now:** the chat is public and ungated, which is a running cost with no ceiling.
**Gate:** none for the gating half. KB-RAG is a larger, separate piece — do not bundle them.
**Done when:** an anonymous visitor is rate-limited or asked for their own key, and the limit is
enforced server-side (not in the browser).

### 6) ~~C6 — promote a `soon` PoC card to a built demo~~ — **not queued, listed for completeness**

> 41 cards are `soon`. They are research notes by design, not a backlog of owed work, and
> promoting one is only worth doing when a specific card earns it. Left here so a cold session
> does not mistake the 41 for a hidden queue.

## How this file relates to the other docs <a id="relations"></a>
<sub>[↑ TOC](#toc)</sub>

| Doc | What it is | When to write to it |
|---|---|---|
| **this file** | the *current, living* state — what is active, what is next | when the active task or the queue changes |
| [../features/README.md](../features/README.md) | the *single status source* per feature, plus the [Backlog](../features/README.md#backlog) of unstarted work | when a feature's status changes |
| `../history/YYYY-MM-DD-rabbit-history.md` | append-only audit trail — what happened and why | as work happens, not at session end |
| [archive/](archive/) | superseded plans, kept verbatim | when a plan is retired — never edited afterwards |

Rule of thumb: if it is *dated*, it belongs in history. If it is *per-feature*, it belongs in the
features table. If it is *what to do next*, it belongs here.
