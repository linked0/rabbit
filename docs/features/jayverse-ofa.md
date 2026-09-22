# Jayverse — OFA (intent + solver auction) — an ATLAS mechanism study

*Jayverse service #8 (added 2026-09-10, jay). **Study build**, sibling in spirit to
[jayverse-defi.md](jayverse-defi.md): build the *mechanism* from scratch to learn it, not the
framework. Sibling docs indexed in [README.md](README.md).*

> **Keep the mechanism, drop the framework** — the same discipline as the Base App card. This is a
> weekend, not a quarter. If it ever needs to be real, that's a different decision.

---

## The one idea (the whole point of ATLAS)

**An intent + a solver auction.** The user signs *"I'll give X, I want at least Y."* Solvers race
to fill it. The contract picks the best fill and hands the **surplus back to the user, not to a
searcher.** That single loop is the entire lesson — order-flow / OEV auctions and MEV
*redistribution*, without any of the framework around it.

This is ATLAS's `exchangeRate`-equivalent: the smallest self-contained core worth copying. ATLAS
itself is an unreleased institutional market venue — nothing to *use* or *adopt* (see
[jayverse-verex.md](jayverse-verex.md) for the other transferable idea, the risk/settlement split).
What's buildable is this mechanism.

## Minimal Foundry build — the smallest thing that teaches it

**`IntentAuction`** (a mini-EntryPoint):

- `submitIntent(intent)` — signed `{tokenIn, amountIn, tokenOut, minOut, deadline}` (EIP-712).
- `solve(intentId, solverOp)` — each solver posts a fill + a **bid** (what it kicks back to the user).
- `settle(intentId)` — pick the highest **effective out** (`amountOut + bid`) among valid solvers,
  pull `tokenIn`, run the winner, **enforce `finalOut >= minOut`**, send the **surplus to the user**.
- **2–3 `MockSolver`s at different prices** → shows competition; the losing solver reverts cleanly.

**The invariant (the load-bearing check):** `finalOut >= minOut` **always**, and surplus goes to
the **user**, never the searcher. That's exactly an `an-invariant-is-a-stop-not-an-alarm` check —
the contract *stops*, it doesn't merely warn.

**A second invariant — `holding = issuance` (보유 = 발행).** Not tightly tied to the auction idea,
but it lives on the **same page of the build** (same `IntentAuction`, same settle path — not a
separate contract or page): at rest, what the contract **holds** must equal what it has
**accounted/issued** — a settle never mints value and never strands a user's `tokenIn`. *Today's
version records only the invariant line itself.* **What to stop on violation is deferred** — it will
be an `an-invariant-is-a-stop-not-an-alarm` stop, the same shape as `finalOut >= minOut`, spec'd
next. If a web harness is added, this check surfaces on the **same page** as the main auction UI,
not on its own screen.

## User scenario — "Jun swaps into a bet without feeding a searcher"

Grounds the mechanism in the rest of Jayverse: OFA is the *fair swap rail* the other services call
when a user has to convert one token into another and a naive swap would leak the surplus to a
searcher.

Jun holds **JYVE** (the [jayverse-token](jayverse-token-bridge.md) coin) but wants to bet on a
[Verex](jayverse-verex.md) market that settles in a jUSD-like unit. He needs to convert — and that
conversion is exactly where MEV normally leaks.

1. **Intent, not a swap.** In the [Wallet](jayverse-wallet.md), Jun taps *"Fund this bet."* The
   wallet builds an **intent** — `give 100 JYVE, want >= 98 jUSD, deadline 2 min` (EIP-712) — instead
   of a market swap. **Simulate-before-sign** shows the `minOut` floor and the *expected surplus
   range* before he commits.
2. **One signature.** He signs the intent once; it lands at `IntentAuction.submitIntent`.
3. **Solvers race.** Three solvers quote a fill **plus a bid** (what they kick back to Jun): the real
   **JYVE mini-AMM solver** (wrapping jayverse-token's pool) and two `MockSolver`s at different
   prices.
4. **Settle picks the best, surplus to Jun.** `settle` takes the highest **effective out**
   (`amountOut + bid`), pulls the JYVE, runs the winner, enforces **`finalOut >= minOut`** *and*
   **`holding = issuance`**, and sends the **surplus to Jun, never the searcher**. Losing solvers
   revert cleanly.
5. **The bet funds itself.** The resulting jUSD funds the Verex bet in the same flow;
   [Number](jayverse-number.md) logs the fill and the realized surplus as a line in Jun's PnL.
6. **Authority is checked, not assumed.** Had `settle` been misconfigured to pay a searcher instead
   of Jun, the [Authority Auditor](jayverse-auditor.md) matrix would surface "who captures the
   surplus" as a **critical** finding — the config-level guard behind the code-level invariant.

Jun feels the whole point: he got a *better* price than a plain swap *because* solvers competed, and
the improvement went to **him**.

## What we implement, and how

**What (the buildable pieces):**

- **`IntentAuction`** — `submitIntent` / `solve` / `settle`, the mini-EntryPoint sketched above.
- **`AmmSolver`** — the one cross-service piece: a real solver adapter wrapping jayverse-token's
  constant-product pool, so the auction has a *genuine* competitor next to the `MockSolver`s (this is
  what makes the "surplus to the user" lesson real, not staged).
- **Two invariants as stops** — `finalOut >= minOut` and `holding = issuance`, both `require`-level
  *stops* (`an-invariant-is-a-stop-not-an-alarm`), not warnings.
- **Optional web harness** — a thin page: intent builder, a live board of solver bids, and a
  surplus-to-user readout. Only if a UI is wanted; contracts come first.

**How (the build path):**

- **Contracts (Foundry, first).** `IntentAuction` + 2 `MockSolver`s + one `AmmSolver` over the
  jayverse-token pool interface. Foundry tests assert both invariants and that the surplus lands on
  the user across competing-solver cases; the losing solver reverts without touching state.
- **Wallet path.** The intent is signed through [jayverse-wallet](jayverse-wallet.md)'s `simulate()`
  flow, so the min-out and surplus preview in step 1 are the wallet's existing simulate surface, not a
  new one.
- **Cross-service wiring.** Shared addresses come from the `jayverse-rails` package (no service
  hardcodes another); the local-vs-Sepolia switch follows [jayverse-rabbit.md §7](jayverse-rabbit.md).
- **Web (optional, last).** A small Next.js harness on `:3080`† that reads the auction events and
  renders the bid board; run it or the Auditor one at a time, or reassign the port.

## Feature — priced in fiat, settled in tokens: the quote is a product promise

A five-dollar checkout paid in a volatile token needs a quote TTL, a re-quote flow and a policy for
who absorbs the drift. That is product design wearing an exchange-rate costume — not an oracle problem.

Build a checkout that locks a token amount for a fixed fiat price for thirty seconds, expires visibly
into a re-quote, and tabulates the three drift policies — merchant absorbs, buyer absorbs, band with
re-quote — against a simulated price feed. (Sibling to OFA's core: the auction decides *who fills*;
the quote decides *what price the product promised*, and both are settlement questions.)

### Why

Users think in their currency; chains settle in theirs. Between the price shown and the payment
settling, the rate moves — so every fiat-priced crypto checkout is silently running a tiny FX desk,
whether its designers noticed or not. Ignore it and either the merchant leaks margin on every dip or
the buyer gets surprise-charged on every spike; both discoveries arrive as support tickets.

The deliberate version has three knobs: how long a quote is honored (TTL), what happens at expiry
(re-quote UX, not a silent failure), and who eats movement inside the window. None of these is an
oracle question — the oracle only tells you the rate; the product decides what to promise about it.
Stablecoin settlement makes the window narrow, not zero, and the structure identical.

### How it works

One checkout, a scripted price feed, three drift policies, and the ledger of who paid for movement.

#### PoC

A checkout against anvil: item priced 5 USD, paid in a mock token whose USD price a script walks ±3%
per minute. Quote endpoint returns `{ tokenAmount, quoteId, expiresAt(+30s) }`; payment submits
`quoteId`; the server accepts, re-quotes, or rejects per policy. Run the same 100 purchases with
prices replayed under each policy: (A) honor expired quotes — measure merchant loss; (B) reject at
settlement if moved — measure buyer failures; (C) 30s TTL with visible countdown and one-click
re-quote — measure both. Print the three-row table.

#### What it proves

The quote is a short-dated option the product writes for free, and TTL is its expiry. Policy A prices
the option at the merchant's expense, B at the buyer's UX, C bounds both — which is why every serious
crypto checkout (and every FX-touching commerce API) converges on C. The interesting output is not
the code but the table: drift cost as a product decision made visible.

## What it teaches

- Order-flow / OEV auctions, MEV **redistribution**, intent signing.
- The sharp contrast for `aa-standard-execution-split`: **ATLAS does execution abstraction with no
  smart wallet**, where ERC-4337 needs one. Same goal (act on the user's behalf), opposite shape.
- Stretch goal: a backrun / LVR example.

## Scope discipline (so it stays a study, not a career)

Skip everything real ATLAS has that **isn't the auction** — solver bonding, gas escrow,
reentrancy / execution locks, EntryPoint aggregation, DappControl modules. Those are the
*framework*; you want the *mechanism*.

## Cooperate with existing services

- **Verex** — the auction is the same shape as best-execution for a bet fill; the risk/settlement
  split ([jayverse-verex.md](jayverse-verex.md)) and this auction are the two halves of a fair
  matching engine.
- **Authority Auditor** — "who captures the surplus" is an authority question; a misconfigured
  settle that pays a searcher instead of the user is exactly the kind of finding the Auditor exists
  to surface.

## Repo & status

Its own repo `jayverse-ofa` (sibling under `~/work`), mirroring `jayverse-defi`: Foundry contracts
first, an optional tiny harness. **Not scaffolded yet** — this doc is the sketch to see the whole
shape before writing a line. Port `:3080` by the `3000 + #×10` rule *if* a web harness is added
(shared with the completed Auditor's baked `:3080` — run one at a time, or reassign).
