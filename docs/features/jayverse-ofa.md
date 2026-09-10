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
