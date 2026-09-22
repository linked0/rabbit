# PoCs Hub — Consolidated Demo Menu

**Status: 🟡 In progress (2026-08-03)** — nav shape decided, jay gave the go-ahead to build on
branch `claude/pocs-hub`. `/etc` page, `Card` component (now shared as `app/DemoCard.tsx`), nav
entry, `ALLOW_ETC` flag, and `PUBLIC_PATHS` entry are built and verified locally (`pnpm build`
clean, dev-server smoke test). Testing locally only; deploy happens after jay's review. Full
build log: [2026-08-03 history](../history/2026-08-03-rabbit-history.md) (search "PoCs hub").

*Source: jay's request, 2026-08-03 — moved out of `docs/tasks/current-plan.md` (2026-08-03) so
that file stays scoped to just AP2 + Account Abstraction (AA); the hub is supporting
infrastructure those two plug into, not itself an AP2/AA task.*

## Goal (jay)
Stop growing the top nav one demo at a time. Add **one** top-menu item that's a landing hub — a
**card grid**, each card linking to a real test/demo page, with a short description **and a "how
to run this" note** — and fold the scattered technical demos (Hyperliquid Trading, PBS, AP2, AA,
and future items) under it instead of each getting its own top-level menu slot.

**This isn't a new idea — it's finishing one the plan already assumed.** Several backlog items
(see [README.md](README.md) — Zapier MCP, Solana, ERC-8141) already say their home is `/etc` or
`/etc/X` — that route has been referenced since 2026-07-17 but was never actually built as a page
or wired into `app/Nav.tsx`. This is "build the thing the plan already assumed existed."

## Route & label
- **Route:** `/etc` — reuses the slug already referenced across the backlog docs, so nothing else
  needs renaming.
- **Label — decided (jay, 2026-08-03): "PoCs"** (overrode the "Tech Research" suggestion —
  shorter, and names exactly what these pages are: proofs-of-concept, not product features).

## Hub page design (`/etc`)
Card grid (`app/etc/page.tsx` + the shared `app/DemoCard.tsx`, also used by [TIL](README.md)).
Each card shows:
- **Title**
- **One-line description** — what it proves / what tech it demos
- **Status badge** — `Live` or `Coming soon`
- **"How to run"** — a short 2–4 step how-to (wallet? testnet? what to click), so a visitor can
  actually try it without reading the source
- **Link** to the real page (enabled if live, disabled/greyed if not)

**Initial card set:**

| Card | Links to | Status | How-to-run sketch |
|---|---|---|---|
| Hyperliquid Trading | `/market` | Live | Connect MetaMask → switch to HL testnet → claim mock jUSD at the HL testnet faucet → place a small limit order |
| PBS (searcher / relay) | `/xyz` | Live | Submit a bundle via the searcher form (Sepolia) → watch the relay dashboard for inclusion |
| AP2 — Stripe settlement | `/ap2` (or `/etc/ap2`) | Coming soon — see [current-plan.md §2](../tasks/current-plan.md#s2) | Click "buy" → Stripe test Checkout → pay with Stripe's test card `4242 4242 4242 4242` |
| AA — delegatable accounts & session keys | `/etc/aa` | Coming soon — see [current-plan.md §3](../tasks/current-plan.md#s3) + [§6](../tasks/current-plan.md#s6) | Connect MetaMask on Sepolia → grant a scoped session key → watch it spend within the granted limit, no re-sign popup |
| Solana | `/etc/solana` | Coming soon — see [README.md](README.md) | *(fill in once scoped)* |
| Zapier MCP | `/etc/zapier` | Coming soon — see [README.md](README.md) | *(fill in once scoped)* |
| ERC-8141 | knowledge page | Coming soon — see [README.md](README.md) | Read-only explainer — no wallet needed |
| Toss Payments | `/etc/toss` or `/ap2` | Coming soon — see [README.md](README.md) | Click "buy" → Toss test Checkout |

## Nav change — decided (jay, 2026-08-03)
- **Remove** `Market` and `XYZ` as separate top-level `app/Nav.tsx` items — **fold fully into the
  hub**, no top-nav shortcut kept alongside the card (accepted the traffic/bookmark trade-off:
  `/market` and `/xyz` routes keep working, only the nav entry point changes). The bare `/ap2`
  "coming soon" stub also retires once the AP2 Stripe example ships as a hub card.
- **Game and JayVerse stay top-level** — not folded into **PoCs**; they're product/showcase demos,
  not the "test code" jay meant (Hyperliquid Trading / PBS / AP2 / AA). No change to their nav
  entries.
- **Label: "PoCs"** — all open items from the design draft are resolved; nothing left blocking
  the build.

## AA implementation stack — thirdweb vs. what's already decided
This design question came up while scoping the hub's AA card, but it's core AA planning, not hub
plumbing — full reasoning lives in
**[current-plan.md §6](../tasks/current-plan.md#s6)** (Agentic AA). Short version: MetaMask
Delegation Toolkit stays for the 7702/7715 half ([§3](../tasks/current-plan.md#s3)); thirdweb
replaces ZeroDev/Pimlico for the 4337-pillars half ([§6](../tasks/current-plan.md#s6)).

## Sequencing
1. **Build the `/etc` hub** — page, `Card` component, nav entry. No new demo content required
   yet; the hub can launch listing Market + PBS as `Live` and AP2 + AA as `Coming soon`.
2. **AP2 and AA get wired in as hub cards** once each ships — see
   [current-plan.md §5](../tasks/current-plan.md#s5) for that build order.
