# Toss Payments — Settlement Example (Educational)

**Goal:** a simple, educational **KRW/domestic** settlement example via **Toss Payments** — the
Korean-market counterpart to [§2](../tasks/current-plan.md#s2)'s Stripe example, which covers the
international/USD fiat rail. Same "agent buys data, settles via a payment provider" mock, swapped
to a Korean-native rail.

*Source: jay's request, 2026-08-03 (no source file).*

## 1. Flow (mirrors §6)
```
provider quotes a price
  → client opens Toss Payments checkout (결제 위젯 / 결제창)
  → user pays (test mode)
  → success URL receives { paymentKey, orderId, amount }
  → server calls Toss's 결제 승인(payment-confirm) API with the secret key
  → on 200, data is released
```

## 2. Integration pieces
- **Client key (public)** — initializes the **Payment Widget SDK** in the browser; safe to ship
  to the client, same class of value as a Stripe publishable key.
- **Secret key (server-only)** — used to call the payment-confirm API; **server-side env secret**,
  never sent to the browser. Same handling pattern as jay's server-stored LLM key (see
  [ai-chat.md](ai-chat.md#auth-llm-gating)).
- **Test mode:** Toss provides sandbox client/secret keys out of the box — no real charges,
  matching §6's "test-mode keys only" constraint.

## 3. Rabbit surface
- Likely lives under `/ap2` alongside §6, so a visitor sees two settlement examples side by side
  (USD via Stripe, KRW via Toss) — or a standalone `/etc/toss` page if that reads cleaner.
  Reuse §6's UI shell if it's already built by the time this starts.

## 4. Open questions (jay)
- Exact page location — extend `/ap2` vs a standalone page.
- Contrast directly against §6 (e.g. one "USD via Stripe vs KRW via Toss" comparison table) or
  keep the two fully independent.

## Status
🟡 Active — tracked as [current-plan.md §7](../tasks/current-plan.md#s7) (added 2026-08-04,
alongside §2 AP2/Stripe and §6 AA).
