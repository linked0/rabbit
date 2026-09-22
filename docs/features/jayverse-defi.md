# Jayverse — DeFi (EtherFi basics, built from scratch)

**Purpose:** implement the **basic EtherFi algorithms ourselves** — deposit → liquid-staking
token → reward accrual → restaking → withdrawal queue — as minimal contracts on our own testnet,
**to study how liquid-restaking DeFi actually works**. We do **not** integrate with real EtherFi;
we rebuild its core mechanics so the accounting is visible and testable.

*Source: [../tasks/09-02-jayverse.md](../tasks/09-02-jayverse.md) §3 DeFi and jay's comment
there: "I will implement basic EtherFi features so please describe what you will do." Clarified by
jay (2026-09-07): **implement the algorithms to study DeFi — do not cooperate with real EtherFi.**
This supersedes the earlier read-only-dashboard framing. Hub:
[README.md](README.md). Repo: `jayverse-defi` (verex cloud); may live as a page
inside rabbit until it earns its own repo.*

---

## Phases (build order)

| Phase | Focus | What we implement |
|---|---|---|
| **1 (MVP)** | Liquid-staking core | `LiquidityPool` + rebasing `jeETH` + wrapper `jweETH`; `deposit / wrap / requestWithdraw / claim`; `addRewards` (staking); yield-decomposition + "how the math works" view; **Foundry tests are the deliverable**. |
| **2** | Restaking layer | `MockAVS` delegation → a second `addRewards("restaking")` stream; study-mode `slash` that lowers the exchange rate for **all** holders; risk labels driven by real contract state. |
| **3** | Real EtherFi (read) | optionally read/interact with real EtherFi testnet contracts, once the from-scratch mechanics are understood. |

---

## 1. What we build (basic feature)

A **minimal liquid-staking + restaking protocol, written from scratch** on anvil/Sepolia — the
smallest thing that reproduces EtherFi's core mechanics:

1. A **LiquidityPool vault** — `deposit()` ETH, receive a liquid-staking token; `requestWithdraw()`
   + `claim()` to exit through a queue.
2. **`jeETH`** — a **rebasing** LST (your *balance* grows as rewards arrive), and **`jweETH`** — its
   **non-rebasing wrapper** (balance fixed, each token worth more ETH over time). This mirrors
   EtherFi's `eETH` / `weETH` duality exactly, because understanding that duality is the point.
3. **Reward accrual** — staking yield reaches holders purely through the exchange rate, with **zero
   per-user bookkeeping**. That trick is the heart of every LST.
4. **Restaking** — the pool delegates to a **mock AVS** (stand-in for EigenLayer) for a *second*
   reward stream, at the cost of *additional* slashing risk.
5. **The dashboard** (kept from the previous design) now decomposes **your own** position's yield —
   staking vs restaking — from **our own** on-chain events, so the split is exact, not estimated.

**This is a study build.** The goal is correct, legible *accounting*, not a production protocol.
Real beacon-chain staking (running validators) is abstracted to a rewards drip — the token math is
identical whether the ETH comes from a validator or from `addRewards()`. Real custody, audits,
and mainnet are explicitly out of scope.

---

## 2. User scenario — "Nari learns how an LST works"

Nari wants to understand liquid restaking by *doing* it on a testnet.

1. **Deposit.** She deposits **1 ETH**. Exchange rate is 1.0, so she gets **1 jeETH** (1 share).
2. **Rewards arrive.** The operator (or a timer) drips staking rewards into the pool. `totalPooledETH`
   rises but her share count doesn't — so her **jeETH balance rebases up to ~1.02** with no transfer.
   The dashboard shows *where* that 0.02 came from.
3. **Wrap.** She wraps to **jweETH**. Now her *balance* stays fixed at ~0.98 jweETH, but each jweETH
   is worth *more ETH* as the rate climbs. Same value, different representation — she sees why.
4. **Restake.** She flips **Restaking on**. The pool delegates to the mock AVS; a **second yield
   band** appears in the decomposition, and the **Slashing** risk label lights up (restaking stacks
   AVS slashing on top of base slashing).
5. **(Study) Slash.** In study mode she clicks **Simulate slash**. `totalPooledETH` drops, the
   exchange rate **falls**, and *every* holder's ETH value drops proportionally — she watches a
   slashing loss propagate through the share math.
6. **Exit.** She calls **Request withdraw**. Her shares burn now, an ETH claim is queued with a
   `ready-at` time, and only after the delay does **Claim** return ETH — she feels *why* exit isn't
   instant (and why a weETH secondary market would trade at a discount during the wait).

Nari finishes understanding the exchange-rate trick, the rebase, the wrap, restaking's risk/reward,
and the exit queue — by having run each one.

---

## 3. What the web app shows (screen by screen)

**Screen A — Deposit / withdraw panel** (new, real testnet actions)
- Deposit ETH field → **Deposit** (shows shares to be minted *before* signing, via the wallet
  service `simulate()`); Wrap / Unwrap toggle between jeETH and jweETH.
- Withdraw: request amount → shows queued ETH + `ready-at`; a **Claim** button enabled once ready.
- Every action is **simulate-before-sign** (see §5) — the decoded effect is shown, then the user signs.

**Screen B — Position + exchange rate**
- Balance in jeETH/jweETH, share count, current **exchange rate (ETH per share)**, ETH value, USD.
- A small live rate chart from `RateSnap` history — the line that *is* the yield.

**Screen C — "How the math works"** (the educational core)
- A live, expandable panel that prints the actual formulas with the *current* numbers substituted:
  `shares = ethIn × totalShares / totalPooledETH`, `balance = shares × totalPooledETH / totalShares`,
  `rate = totalPooledETH / totalShares`. Updates on every deposit/reward/slash so the reader sees
  cause → effect.

**Screen D — Yield decomposition**
- Stacked meter splitting APR into **Staking · Restaking**, each with source, current rate, and a
  one-line "how this can go to zero." Exact here (we emit the reward events), not estimated.

**Screen E — Risk labels**
- **Slashing** (base + AVS, driven by whether restaking is on), **Exit queue** (time-to-liquidity
  from the queue), **Depeg** (why wrapped-token secondary price can drift from the rate during the
  queue). Each reads real contract state.

---

## 4. The algorithms (the point of this build)

### A. Share accounting — the core LST trick
The pool tracks `totalPooledETH` and `totalShares`; `exchangeRate = totalPooledETH / totalShares`.

```
deposit(ethIn):
    shares = (totalShares == 0) ? ethIn : ethIn * totalShares / totalPooledETH
    totalPooledETH += ethIn ; totalShares += shares ; shares[user] += shares
```

- **Rebasing `jeETH`:** `balanceOf(user) = shares[user] * totalPooledETH / totalShares`. The stored
  number is *shares*; the displayed *balance* is derived — so it grows when `totalPooledETH` grows,
  **with no transfer**. That derivation *is* the rebase.
- **Wrapped `jweETH`:** holds *shares* directly, so `balanceOf` is fixed; ETH value = `shares × rate`.
  `wrap`/`unwrap` just convert between the two representations of the same shares.

### B. Reward accrual — staking yield with zero per-user writes
```
addRewards(x, source="staking"):   totalPooledETH += x     # totalShares unchanged
```
Rewards raise the exchange rate, so **every** holder's ETH value rises proportionally in one line —
no loop over users. On real EtherFi `x` is beacon-chain rewards; we drip it, but the accounting is
byte-for-byte the same. This is *why* LSTs scale.

### C. Restaking — the LRT layer
The pool `delegateToAVS()` (mock EigenLayer). The AVS pays a **second** `addRewards(y, "restaking")`
stream, and can **`slash(z)`**: `totalPooledETH -= z` → the rate **falls** → all holders lose
proportionally. Restaking = extra yield band **and** extra downside, made concrete by the slash path.

### D. Withdrawal queue — why exit isn't instant
```
requestWithdraw(shares):  ethOwed = shares*rate ; burn shares ; enqueue(user, ethOwed, readyAt = now + DELAY)
claim(id):                require now >= readyAt ; transfer ethOwed
```
Shares burn immediately (so you stop earning), but ETH is paid only after `DELAY` — modeling the
validator exit/activation queue. This delay is exactly what creates the incentive for a `jweETH`
secondary market to trade below rate (instant liquidity vs waiting).

### E. Yield decomposition — exact, because we own the events
APR per band = `Δ(totalPooledETH from source S) / totalPooledETH / Δt`, read from our own
`addRewards(source)` events. Because we emit staking vs restaking separately, the split is exact —
the thing that had to be *approximated* when reading real EtherFi.

---

## 5. Cooperate with existing services

- **jayverse-wallet (real cooperation, required now).** Deposits/withdrawals/wraps are real txs, so
  **simulate-before-sign is mandatory, not deferred**: each action calls the wallet service
  `simulate()` to preview shares minted / ETH owed / warnings before the user signs. This is the
  first service that *depends on* the wallet service at build time, not as a future hook.
- **jayverse-rails.** Our own `jeETH` / `jweETH` / `LiquidityPool` / `MockAVS` addresses and the viem
  clients live in the shared rails package; the app hardcodes nothing.
- **Rabbit AA (optional, later).** A 4337 batch could `approve`-free **deposit** gaslessly (ETH in,
  token out in one sponsored UserOp) — a natural cross-link to [jayverse-rabbit.md](jayverse-rabbit.md), noted
  not built.
- **Ponder + viem.** Still the indexing layer, now indexing **our** contracts' events for the rate
  chart, decomposition, and queue status.
- **Rabbit portal.** Imports the DeFi UI (hub policy: "Rabbit imports, it doesn't contain"); the
  implementation stays in `jayverse-defi`.

---

## 6. Implementation sketch

**Contracts (Solidity / Foundry) — minimal, study-grade**
- `LiquidityPool.sol` — `deposit`, `requestWithdraw`/`claim` (queue), `addRewards(source)`,
  `delegateToAVS`, and a study-only `slash`. Holds `totalPooledETH` / `totalShares`.
- `JeETH.sol` — rebasing token whose `balanceOf` derives from shares (mirrors `eETH`).
- `JweETH.sol` — non-rebasing wrapper holding shares (mirrors `weETH`); `wrap`/`unwrap`.
- `MockAVS.sol` — accepts delegation, pays restaking rewards, can slash.
- *Design choice:* we build **both** rebasing `jeETH` **and** wrapped `jweETH` (not just a modern
  ERC-4626 vault) precisely because the `eETH`/`weETH` duality is the learning target. A note in the
  doc points out ERC-4626 is the contemporary equivalent of the wrapper.

**Tests (Foundry) — the deliverable is understanding, so tests double as the proof**
- deposit share math (first vs subsequent depositor), rebase after `addRewards`, wrap/unwrap value
  invariance, `slash` lowers the rate for everyone, withdrawal-queue timing gates `claim`.

**Ponder schema (reused, trimmed)**
```ts
Position   { id, owner, token, shares, updatedAt }
RateSnap   { id, ethPerShare, blockNumber, timestamp }              // the yield line
RewardSnap { id, source: 'staking'|'restaking', amount, timestamp } // exact decomposition
```
*(No `PointSnap` — loyalty points are off-chain marketing, out of scope for an algorithm study.)*

**Deploy / run**
- `scripts/deploy-defi.mjs` deploys the four contracts to anvil (and Sepolia); a small
  `drip`/`restake`/`slash` dev script drives the study scenarios. Local vs Sepolia follows the same
  environment-switch discipline as [jayverse-rabbit.md §7](jayverse-rabbit.md).

**Estimate:** ~3–4 focused days for contracts + Foundry tests (the core), ~2 days to repoint the
existing dashboard/decomposition UI at our contracts.

**Open questions**
- **How faithfully to model the beacon chain?** Recommendation: **abstract it** — one `addRewards`
  drip stands in for validator rewards; modeling validator NFTs / node-operator layers is a separate
  study, not v1.
- **Slashing exposure in public demos.** Keep `slash` a **study-mode dev action only**; never on a
  path a casual visitor can trigger.
- **When to add gasless deposit via AA** — nice teaching cross-link, but only after the DeFi basics
  and the wallet `simulate()` path both work.

---

## Chainlink — infra we use, not build

Chainlink's oracle stack is settlement-rail infrastructure this build *consumes*, not reimplements — see the umbrella map in [README.md](README.md).

- **Data Feeds** — price inputs (e.g. ETH/USD) for the from-scratch staking-rate / APR math and any USD display. **If wrong or late:** the app's accounting drifts from reality.
- **Proof of Reserve** — if a jeETH / jweETH ever claims external backing, PoR attests it so a redeem path can refuse unbacked units.

**Deliberate non-use — the share price.** The LST exchange rate (`assets / shares`) is computed on-chain from our *own* pool events, not fed from an oracle — it is internal truth, so no feed is needed or wanted there.

> Every feed is a dependency with a failure mode — keep the "if wrong / late" guard (staleness check / fallback) in code, not only here.
