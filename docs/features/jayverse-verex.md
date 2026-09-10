# Jayverse — Verex onboarding (Stripe) + Market Maker

Design draft for two paired Verex features: fiat card onboarding (Stripe test mode) that gives a crypto-less newcomer a spendable balance, and an LMSR operator market maker that keeps every market quotable on both sides.

> Status: **DESIGN DRAFT for review — not built.** Scope: Verex prediction market (CLOB on Sepolia; CTF backbone, Fastify API, Next.js web at `verex.jaylabs.xyz`, in-process LMSR operator in `packages/api/src/mm.ts`, USDC collateral). Source request: [`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md) §2 "Verex as Prediction Market" (roadmap step **S8–S9 Stripe onboarding**). Reuses the Stripe/AP2 pattern in [`ap2-test.md`](ap2-test.md).

---

## Phases (build order)

| Phase | Focus | What we implement |
|---|---|---|
| **1 (MVP)** | First-bet loop | Stripe Checkout (test mode) `/funding` + webhook crediting a USDC-eq balance; header balance chip; LMSR maker (`mm.ts`) quoting YES/NO so a newcomer's first order always fills; bid/ask ladder + fill UI. |
| **2** | Operator / admin | owner-gated `/admin/mm`: status (inventory, exposure, live quotes, max-loss headroom) + safe controls (global/per-market pause = kill switch); `b` and collateral cap stay deploy-time. |
| **3** | Production leg | KYC/AML; real on/off-ramp custody or regulated partner; x402 metering; refund/chargeback handling; balance⇄chain reconciliation. |

---

## 1. Two features, why they ship together

The two features remove the two things that stop a newcomer from ever placing a first bet:

**(a) Stripe onboarding — the demand side.** A newcomer has no wallet, no testnet USDC, and no
faucet patience. Stripe Checkout (test mode) turns a card payment into a **USDC-equivalent
internal balance** they can bet with immediately. No self-custody, no seed phrase, no gas.

**(b) Market Maker — the supply side.** A brand-new market has an empty order book. If the
newcomer's first order finds nothing to fill against, onboarding was pointless. The MM
(`mm.ts`, LMSR) **quotes both YES and NO continuously**, so there is always a resting maker to
fill against and a price to look at.

They are two halves of one loop: onboarding creates a buyer with money, the MM guarantees that
buyer something to buy. Ship one without the other and the demo dead-ends. Both are deliberately
**basic and buildable** — test-mode payments (no real custody, no KYC) and a single-parameter
LMSR maker — enough for an end-to-end first bet, not a production exchange.

---

## 2. User scenario — "Mina places her first bet"

Mina has never touched crypto. A friend sends her a Verex market link: *"Will Jayverse ship the
Unity game before 2027?"*

1. **Lands on the market page.** She sees a live price — YES 62¢ / NO 38¢ — and a small
   order-book ladder. The prices exist because the MM is quoting; the book isn't empty even
   though she's the first human here.
2. **Clicks "Place bet", is prompted to fund.** She has no balance, so the app shows a
   **"Add funds"** panel: pick an amount ($20), pay by card.
3. **Pays with a test card.** Stripe Checkout opens (test mode). She enters `4242 4242 4242 4242`,
   any future expiry, any CVC. Checkout succeeds and returns her to Verex.
4. **Balance appears.** Within a second or two her header shows **$20.00 (20 USDC-eq)**. Behind
   the scenes a Stripe webhook credited her internal balance — no on-chain transfer, no wallet.
5. **Places the bet.** She buys **15 YES** at the MM's ask (62¢) for ~$9.30. The order matches
   against the operator maker instantly.
6. **Fill confirmation.** "Filled: 15 YES @ 0.62, cost $9.30. New balance $10.70." Her position
   card shows *15 YES, avg 0.62, current 0.63*. The MM's quote has nudged up because it just sold
   YES (LMSR moves price with inventory).
7. **Later: resolution.** When the market resolves YES, her 15 shares redeem for $15 of
   USDC-equivalent, credited back to her balance. (Redemption path is existing Verex; only the
   *funding* leg is new.)

Mina went from "no crypto" to "settled a bet" without ever seeing a seed phrase or a gas fee.

---

## 3. What the web app shows — screen by screen

**A. Add-funds / deposit screen** (new)
- Amount chooser: preset chips ($10 / $20 / $50) + custom field.
- One line of honesty: *"Test mode — no real charge. Funds are a play-money USDC-equivalent
  balance, not withdrawable crypto."*
- Primary button **"Pay with card"** → redirects to Stripe Checkout (hosted page, test mode).
- Return states: `?funded=success` (toast + balance refresh) and `?funded=cancel` (no change).

**B. Balance indicator** (new, global header)
- `$10.70 · 10.70 USDC-eq` with a small **"Add funds"** link.
- Clicking opens a mini ledger: deposits (Stripe), trades, redemptions — each a signed row.

**C. Market page — quote + ladder** (extends existing)
- Big current price (mid): **YES 0.62 / NO 0.38**.
- **Bid/ask ladder** sourced from the MM: a few price levels each side with size, e.g.

  ```
        BID (buy)         ASK (sell)
   0.61   ×120       0.63   ×120
   0.60   ×140       0.64   ×140
   0.59   ×160       0.65   ×160
  ```
  Ladder levels are the LMSR curve sampled around the current price; a small "MM" tag marks that
  liquidity is operator-provided.
- A price sparkline (existing) and market metadata (resolution source, close date).

**D. Order-placement panel** (extends existing)
- Side toggle YES/NO, quantity, live cost estimate ("15 YES ≈ $9.30 incl. slippage").
- Shows *"You'll fill against the market maker"* when the book has no better human order.
- Disabled with **"Add funds to bet"** if balance < cost — links straight to screen A.

**E. Fill confirmation** (extends existing)
- Toast + modal: filled qty, avg price, total cost, new balance.
- Updated position card and the ladder re-rendered at the MM's new post-trade quote.

**F. Operator / admin page** (new, owner-gated · `/admin/mm`)
- Not part of Mina's flow — an operator-only window on the always-on maker. A **status tab**
  (per-market inventory, exposure, live quotes, max-loss headroom, quoting on/off; global treasury,
  committed collateral, MM PnL) and a **config tab** (the kill switch + safe controls). Full scope,
  guardrails, and the config risk-split are in §6 "Operator / admin page".

---

## 4. The flow

### Onboarding flow (Stripe test mode → internal balance)

```
Browser            Verex API (Fastify)         Stripe (test)
  │  POST /funding/checkout ($20) │                  │
  ├──────────────────────────────►│  create Checkout Session
  │                                ├─────────────────►│
  │        session.url            │◄─────────────────┤
  │◄──────────────────────────────┤                  │
  │  redirect to Checkout ───────────────────────────►│  card 4242…
  │                                │   webhook:       │
  │                                │  checkout.session.completed
  │                                │◄─────────────────┤
  │                                ├─ verify sig, idempotent by session id
  │                                ├─ credit balances(user += $20 USDC-eq)
  │  return to /market?funded=success                 │
  │◄──────────────────────────────┤                  │
```

Key points: the **webhook is the source of truth** for crediting (never the browser redirect —
the user can close the tab). Each credit is **idempotent** on the Stripe session/event id so a
retried webhook can't double-credit. No real custody: a "USDC-eq" credit is a **ledger row**, not
an on-chain USDC transfer. (A later, real version would swap this leg for an on/off-ramp such as
Bridge — flagged as an open question in `ap2-test.md`.)

### Market-maker flow (LMSR quote → match → settle)

```
   MM (mm.ts, LMSR)                  Order book / CTF                Balance ledger
        │  quote YES/NO from cost fn      │                              │
        ├────────── rest maker orders ───►│                              │
 user buys 15 YES ──────────────────────►│  match vs operator maker     │
        │                                 ├─ debit user $9.30 ──────────►│
        │  inventory += 15 YES sold       │  mint/allocate 15 YES (CTF)  │
        ├─ recompute quote (price ↑) ────►│                              │
        │                                 │   … on resolution:           │
        │                                 ├─ winning shares redeem ─────►│ credit payout
```

The MM prices with the standard LMSR cost function `C(q) = b · ln(Σ e^(qᵢ/b))`; the instantaneous
price of an outcome is `pᵢ = e^(qᵢ/b) / Σ eⱼ`. Buying YES increases `q_yes`, which raises the YES
price and lowers NO — that's the automatic two-sided quoting. The single tunable is the liquidity
parameter **`b`**: larger `b` = deeper book, flatter price impact, larger max operator loss;
smaller `b` = thinner, jumpier. The operator posts collateral bounded by the LMSR max loss
(`b · ln(n)` for `n` outcomes) so the maker is always solvent.

---

## 5. Cooperate with existing services

**Reuse the rabbit Stripe/AP2 pattern (`ap2-test.md`).** That doc already frames a test-mode
payment leg and the "mandate/credit ticks down" idea. Verex onboarding uses the same shape —
Checkout → webhook → credited balance — so the two services share one mental model and, ideally,
one small helper for Stripe key handling, signature verification, and idempotent crediting.
Different product, same rail; keep the fallback note about **Korea on/off-ramp + KYC** from
`ap2-test.md` for whenever this graduates past test mode.

**Reuse the Verex API + `mm.ts`.** The MM already exists in-process; this design only *surfaces*
its quotes as a ladder and routes fills to it. The balance ledger sits beside the existing
order/position tables in the same Fastify API — the new pieces are the funding routes and a
`balances` table, not a new service.

**Let the agent trade the same MM.** Rabbit's agent console (Jayverse §1, and the planned
`verex-mcp` in §2) can call the *same* `place_order` path Mina uses — the MM doesn't care whether
the taker is a human or an agent. So the agent (funded from its own AP2/x402 budget rather than a
card) can quote-check and bet against the operator maker through MCP, giving the MM a second
customer and exercising the agent-vs-human market-integrity note from §2. One maker, two kinds of
taker.

---

## 6. Implementation sketch

**New**
- `POST /funding/checkout` — create a Stripe Checkout Session (test keys), return `session.url`.
- `POST /webhooks/stripe` — verify signature, handle `checkout.session.completed`, credit balance
  idempotently by event/session id. Raw-body route (Stripe signature needs the unparsed body).
- `balances` table — `user_id, currency('USDCX'), amount, updated_at`; plus a `ledger` table
  (`user_id, kind(deposit|trade|redeem), delta, ref, created_at`) for the mini-ledger UI.
- Balance guard in the order path — debit on fill, refuse if insufficient (mirrors the existing
  `checkExternalFunds` read-and-refuse discipline from Verex).
- Web: Add-funds screen (A), header balance (B), MM ladder on the market page (C).

**Reused**
- `mm.ts` LMSR quoting and the CTF settlement/redemption path — unchanged; only exposed.
- Order-book match, position cards, price sparkline — extended, not rebuilt.
- Stripe test-mode integration shape from `ap2-test.md`.

**Operator / admin page (jay asked, 2026-09-07)** — one owner-gated page in the Verex web app
(`/admin/mm`, same owner-gate pattern as rabbit's agent console). The MM is money-moving and
always-on, so it needs a window and a switch; the page has a read tab and a config tab, and config
splits by risk:

- **Status (read-only):** per market — inventory YES/NO, net exposure, current quotes, max-loss
  headroom (used vs the `b·ln(n)` cap), quoting on/off; global — treasury balance, committed
  collateral, MM PnL.
- **Config — safe to change live:** pause/resume (global + per market · the kill switch),
  per-market enable/disable, spread within a hard-coded bound. Applied with a confirm.
- **Config — guarded (v1 decision):** `b` (liquidity depth) and the collateral cap *define* max
  loss, so in **v1 they stay deploy-time env** — the page shows them read-only, it does not edit
  them. Live editing is a v1.1 step, and when added it is allowed only with a confirm dialog **and**
  a server-side check that the new max-loss ≤ treasury **and** an audit-log entry. (Resolved at my
  discretion, jay's standing "decide at your will", 2026-09-07: v1 is status + safe controls only.)

Three guardrails keep it from being a foot-gun: (1) **the API validates every write, never the
client** — an unsafe `b` is refused server-side; (2) **an audit log** records who/when/what,
surfaced through the [Authority Auditor](jayverse-auditor.md)'s read view so config edits appear in
oversight; (3) **owner gate**. Boundary: this page *controls* the MM (pause, tune); the Auditor only
*reports*. It lives in Verex web (not the rabbit portal) because the inventory/exposure data is
verex-internal and shouldn't cross the cloud boundary.


**Config / parameters**
- Stripe: `STRIPE_SECRET_KEY` (test `sk_test_…`), `STRIPE_WEBHOOK_SECRET` (`whsec_…`); test card
  `4242 4242 4242 4242`. Local webhooks via `stripe listen --forward-to`.
- MM: liquidity `b` per market (default e.g. `b=100`); operator collateral cap = `b · ln(n)`;
  ladder = LMSR sampled at ±N ticks; optional spread/fee bps around the mid.

**Open questions**
- **KYC omitted** in test mode — fine for a demo, mandatory before any real money. Where does the
  real KYC/AML leg live when this graduates?
- **Custody caveat** — "USDC-eq" is an internal ledger credit, *not* redeemable crypto; the UI
  must say so plainly. Real deposits/withdrawals need an on/off-ramp (Bridge or alternative) and
  either real on-chain USDC custody or a regulated partner.
- **Balance ↔ chain reconciliation** — if internal balances ever back real on-chain positions,
  a consistency checker (cf. Verex W5 DB⇄chain checker) is required.
- **MM risk bound** — pick `b` so max operator loss is acceptable for the test treasury; decide
  whether human liquidity, once it arrives, competes with or replaces the operator maker.
- **Refunds / chargebacks** — even in test mode, decide the story before real cards.
```

---

## Chainlink — infra we use, not build

Chainlink's oracle stack is settlement-rail infrastructure Verex *consumes*, not reimplements — see the umbrella map in [README.md](README.md).

- **Data Feeds** — resolve real-world-event markets to an objective number. **If wrong or late:** the market resolves the wrong way and pays the wrong side.
- **Automation** — keeper-triggered resolution / settlement ticks with no server timer. **If a tick is missed:** settlement is delayed.

**Deliberate non-use — pricing.** Verex prices YES/NO with **LMSR**; the market maker sets the price, not an oracle. An oracle carries an *external* fact onto the chain, and a market's own price isn't one — so no feed prices a Verex market.

> Every feed is a dependency with a failure mode — keep the "if wrong / late" guard (staleness check / fallback) in code, not only here.

## Settlement architecture — separate risk from settlement (the ATLAS split)

LayerZero's **ATLAS** (announced 2026-08-26, unreleased — treat every figure as a vendor claim) is
a *market venue*, not a library — **don't build the framework.** (Its core *mechanism*, an intent +
solver auction, is worth a small from-scratch study on its own — that's [jayverse-ofa.md](jayverse-ofa.md),
#8.) The transferable asset *here* is its published module boundary — **matching · clearing ·
settlement · risk** — and specifically the split worth copying: **risk separated from settlement.**

Applied to Verex:

- **Matching / quote** — the LMSR price + fill (§4 market-maker flow).
- **Settlement** — pay the winning side on resolution.
- **Risk** — per-market caps, exposure limits, the "refuse the bet" checks.

The habit most systems skip is keeping **risk as its own module that settlement calls**, not risk
checks tangled inside the settlement path. Entangled, a settlement change can quietly weaken a cap;
as a separate gate, the cap is auditable on its own and can say *no* before settlement runs. This
is the same "keep the load-bearing split explicit" reasoning as the `plumbing-skills-buyback`
argument, and it is independent of whether ATLAS ever ships.

**If Verex collateral ever spans chains:** make the collateral token omnichain for *reach*, but keep
**settlement finality on one chain** — the message layer never becomes the place truth lives. (Rail
choice + the two silent traps: [jayverse-token-bridge.md](jayverse-token-bridge.md).)
