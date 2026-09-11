# Jayverse — JYVE token + exchange + intra-bridge

**Purpose:** define an ecosystem ERC-20 (`JYVE`) used across Jayverse services, a tiny on-chain **exchange** (mini-AMM) that gives JYVE a readable price, and a minimal, dev-grade **bridge** to move it between jay's local Anvil fork and Sepolia. Token, exchange, and bridge are **one economic unit**, so they live together in a single **`jayverse-token`** repo (as packages), not three repos (jay, 2026-09-08). Design draft for review — nothing here is built yet.

> Source: [`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md) §7 "Intra Jayverse Bridge" and jay's comment there ("We can create an ERC coin used in our ecosystem like JVRS or JVS… bridged between my Anvil chain and Sepolia. Show me some imaginary scenario."). Hub: [`README.md`](./README.md).
>
> Note on scope vs §7: the plan's §7 records a "no new token" decision (the intra-ledger is USDC balances in a shared vault). This doc explores the *opposite* branch jay asked for — an actual ecosystem token plus a real cross-chain hop — as a parallel design for jay to compare against the ledger-only approach. It does not overturn §7; it gives the token option a concrete shape to review.

---

## Phases (build order)

| Phase | Focus | What we implement |
|---|---|---|
| **1 (MVP)** | Token + exchange | `JYVE.sol` (ERC-20, `MINTER_ROLE`, per-address + global mint caps); `Exchange.sol` constant-product **`JYVE/USDC`** pool with `addLiquidity`/`removeLiquidity`/`swap`/`getPrice`, pool seeded at deploy so a price exists from block one. |
| **2** | Intra bridge | `BridgeLock` / `BridgeMint` (or the relayer-script variant): lock-and-mint / burn-and-release between the Anvil fork and Sepolia; **idempotent relayer** keyed by transfer `id`; `processed[id]` guard; invariant + reconciliation cron. |
| **3** | Real cross-chain | graduate to **CCIP** for arbitrary cross-chain messages, **Circle CCTP** for native USDC (burn-and-mint, no wrapped USDC), and **xERC20 / ERC-7281** for JYVE (a sovereign bridged token with per-bridge mint/burn rate limits, instead of lock-and-mint wrapping) — where a service truly leaves the home chain. |

---

## 1. What we build (basic feature)

Three small pieces, deliberately minimal:

1. **`JYVE` — an ERC-20 (Jayverse token).** Standard OpenZeppelin ERC-20, 18 decimals, symbol **`JYVE`** (read "jive"), name "Jayverse". Renamed from the `JVRS`/`JVS` jay first suggested — `JYVE` reads as a word and is far easier to say (jay, 2026-09-08). It is the unit of account inside the ecosystem: verex rewards, persona rentals/payments, and game prizes are denominated and paid in JYVE. On testnet/dev it is mintable by an owner/faucet role (see §6); it is *not* a real-money asset.
2. **A minimal on-chain exchange (mini-AMM)** — a constant-product **`JYVE/USDC`** pool. JYVE is a token we invented, so it has **no external market an oracle could report** — an oracle only relays a price that already exists somewhere liquid. So the pool itself *is* the price: `price = usdcReserve / jyveReserve`. Anything that needs a JYVE price (the wallet's USD display, the bridge's value readout, a portfolio view) reads the pool ratio on-chain. This is the honest way to price a self-made token, and a clean learning build (`x·y=k`, add/remove liquidity, swap).
3. **A minimal bridge** to move JYVE between jay's **local Anvil fork of Sepolia** (chain id 11155111) and **real Sepolia** (also 11155111). Because both report the same chain id, the bridge is keyed by RPC endpoint / deployment, not by chain id — see the honesty note in §6. Pattern: **lock-and-mint / burn-and-release** driven by a single trusted relayer worker.

Keep both basic. No governance, no fee market, no multi-hop routing. The bridge is a developer convenience for testing cross-chain UX, not a trustless product.

---

## 2. Imaginary scenario

Meet **Mina**, a Jayverse user, working against the local dev stack (Anvil fork of Sepolia).

1. **She wins on verex.** Mina holds a YES position on a verex market ("Will it rain in Seoul this weekend?"). The market resolves YES. Verex settles her winnings and pays out **120 JYVE** to her wallet on the local Anvil chain. In the portal her balance ticks from 0 → 120 JYVE.
2. **She rents a persona.** Mina wants "Startup-Mentor" for an hour. The persona service quotes **40 JYVE**. She confirms; the wallet service signs an ERC-20 `transfer` of 40 JYVE from her wallet to the persona's payment address. Balance: 120 → 80 JYVE. The persona unlocks for the session.
3. **She bridges to Sepolia.** Mina wants **30 JYVE** on real Sepolia so a friend on the shared testnet can see it. In the portal she opens **Bridge**, picks source = *Local (Anvil fork)*, dest = *Sepolia*, amount = 30. Before she signs, the wallet's **`<JayverseSign>` simulate-before-sign** previews the effect — *lock 30 JYVE on Anvil → receive 30 on Sepolia* — because a bridge (funds leaving a chain) is the scariest thing a user signs. She confirms one transaction and the 30 JYVE is **locked** in the bridge contract on the Anvil chain.
4. **The relayer does its job.** The bridge relayer worker sees the `Locked` event, waits for confirmation, and **mints** (or releases from a pre-funded reserve) 30 JYVE to Mina's address on Sepolia. The portal shows: `Locked ✓ → Relaying… → Minted ✓`. Sepolia balance: +30 JYVE. Local balance: 80 → 50 JYVE.
5. **Later, she bridges back.** Mina sends 10 JYVE from Sepolia → Local. On Sepolia the bridge **burns** her 10 JYVE; the relayer **releases** 10 JYVE from the lock on the Anvil side back to her. Invariant holds: total locked on source always equals total minted on dest.

Every money-moving step above (win → pay → bridge) routes its signature through the Wallet service's **simulate-before-sign** ([jayverse-wallet.md](jayverse-wallet.md)), and JYVE amounts can be shown in USD via the **exchange** price (§1.2) — verex → bridge → wallet cooperating as one flow.

No step requires Mina to understand that the "two chains" are really a fork plus its origin — the UX is identical to a real bridge, which is the point of building it.

---

## 3. What the web app shows (the exchange site)

The web app is a single **token-exchange site**: a swap-first UI over the `JYVE/USDC`
pool (§1.2) with the **bridge as a second tab**, so "trade JYVE" and "move JYVE across
chains" live in one place (jay, 2026-09-09). Two primary screens — **Swap** and
**Bridge** — sit over a shared balance/activity shell.

- **Balance widget:** JYVE balance per chain, labeled by network — `Local (Anvil fork)` and `Sepolia`. USDC shown alongside (rails already surface USDC).
- **Swap screen (the exchange):**
  - JYVE ⇄ USDC swap form over the constant-product pool: pay-with / receive selector, amount in, live quote out.
  - Live **price** and **reserves** from `Exchange.getPrice()` (polled every 5s), plus the price impact and the 0.30% fee for the entered amount.
  - Slippage tolerance + minimum-received guard; a two-step **`approve → swap`** when the spent token needs allowance. Reads work with no wallet; executing a swap needs a connected wallet.
  - *(Later)* an add/remove-liquidity panel for the pool, reusing the same reserves read.
- **Bridge screen:**
  - Source chain → dest chain selector (swap arrow to flip direction).
  - Amount input with max = source balance; validation against mint caps / bridge limits.
  - A status strip showing the lifecycle: `Sign lock → Locked ✓ → Relaying… → Minted ✓` (and the mirror for burn-and-release).
  - Per-leg tx links (source lock tx, dest mint tx) so the user can inspect each on the right explorer.
- **Tx / transfer status:** a small activity list — swaps, verex payout, persona payment, bridge legs — each with state (`pending`/`confirmed`/`failed`) and idempotency key, so a stuck relay is visible rather than silent.

---

## 4. The flow

### Token
Standard ERC-20. Mint policy for a testnet/dev coin:
- Owner/`MINTER_ROLE` can mint (used by verex payouts, game prizes, and a dev faucet).
- Optional per-address and global **mint caps** so a dev-faucet coin can't be minted without bound.
- No burn for users except via the bridge burn path on the dest chain.

### Bridge (honest description)
An Anvil **fork** of Sepolia is not an independent chain — it is a local copy seeded from Sepolia state, sharing chain id 11155111. So a "bridge" here cannot be a trustless light-client bridge; there is no independent consensus to verify. What we build is a **lock-and-mint / burn-and-release** scheme with a **single trusted relayer** (jay's worker). This is a **dev convenience**, not a production bridge — the relayer is fully trusted and there is no fraud proof.

Minimal mechanism:

```
   LOCAL (Anvil fork)                         SEPOLIA
  ┌──────────────────┐                    ┌──────────────────┐
  │  JYVE (ERC-20)   │                    │  JYVE (ERC-20)   │
  │  BridgeLock      │                    │  BridgeMint      │
  └────────┬─────────┘                    └─────────┬────────┘
           │ user: lock(30, to)                     │ mint(30, to, srcTxId)
           │  emits Locked(id, to, 30)              │  emits Minted(id)
           ▼                                        ▲
     ┌───────────────────────  RELAYER  ────────────────────────┐
     │  watch Locked → wait N confs → mint on dest (idempotent   │
     │  by id) ; watch Burned → release on source (idempotent)   │
     └──────────────────────────────────────────────────────────┘

  Direction reversed for Sepolia → Local:
     BridgeMint.burn(30) on Sepolia  →  BridgeLock.release(30) on Local
```

- **Source lock** emits an event with a unique transfer `id` (hash of src chain, nonce, sender, amount, dest).
- **Relayer** consumes the event, and after N confirmations calls `mint`/`release` on the dest, passing the same `id`. Dest contract records `processed[id] = true` and rejects duplicates → idempotent, no double-mint.
- **Reverse leg** burns on the token's non-home chain and releases the locked reserve on the home chain.

**Real-chain path:** when a service actually leaves the home chain (e.g. lands on Base per the plan), the transport is **Chainlink CCIP**, not this relayer — same lock/mint semantics, but CCIP provides the cross-chain messaging and security. This dev bridge exists only so the UX and accounting can be built and tested before CCIP is wired in.

---

## 5. Cooperate with existing services

- **Settlement Rails (`jayverse-rails`):** publishes JYVE addresses per network in `addresses.json` alongside USDC. Rails stays the single source of truth for "what token is at what address on what network." JYVE is listed as a first-class rail asset next to USDC.
- **Verex (collateral / rewards):** verex mints/pays JYVE as reward on market resolution (via `MINTER_ROLE` or a payout treasury). Collateral can stay USDC; rewards denominated in JYVE. Verex calls the token, not the bridge.
- **Personas (payments):** persona rental/usage is priced in JYVE; payment is a plain ERC-20 `transfer` (or `transferFrom` with approval) to the persona payee. No bridge involved unless payer and payee are on different chains.
- **Wallet service (`jayverse-wallet`):** holds keys / signs all user actions — token transfers, bridge `lock`/`burn` transactions. The bridge screen asks the wallet service to sign; the relayer uses its own dedicated key, never a user key.

Each service depends only on the JYVE contract + rails config; only the bridge screen and relayer touch the bridge contracts.

---

## 6. Implementation sketch

**Repo layout:** one `jayverse-token` repo with packages `token/`, `exchange/`, `bridge/` (+ a shared `relayer/` worker). One economic unit, always deployed together; a fresh clone builds all three.

**New:**
- `JYVE.sol` — ERC-20 (OZ), `MINTER_ROLE`, per-address + global mint caps.
- `Exchange.sol` — constant-product AMM for `JYVE/USDC`: `addLiquidity`/`removeLiquidity`, `swap`, and a `getPrice()` view (`usdcReserve * 1e18 / jyveReserve`) that every service reads as the JYVE price. Seed the pool at deploy so a price exists from block one. (No oracle: nothing external prices a made-up token.)
- `BridgeLock.sol` (home chain) — `lock(amount, to)` escrows tokens, emits `Locked(id, to, amount)`; `release(id, to, amount)` callable only by relayer, guarded by `processed[id]`.
- `BridgeMint.sol` (dest chain) — `mint(id, to, amount)` relayer-only + `processed[id]`; `burn(amount, to)` for the reverse leg emitting `Burned(id, to, amount)`.
  - *Alt (simpler first cut):* skip a dest contract and use a **relayer script** that mints via the token's `MINTER_ROLE` on the dest and locks via a vault on the source — same semantics, less contract surface. Decide in review.
- **Relayer / transfer worker** — watches events, waits confirmations, submits dest tx. **Idempotent** by transfer `id` (persist `id → dest txhash`; re-running never double-processes). Reconciliation job asserts the invariant.

**Reused:**
- Rails `addresses.json` for network→address resolution.
- Wallet service for user signing.
- §7's idempotency-key + reconciliation patterns (this worker is that pattern applied to a cross-chain leg).
- PoC references from §7: `x402-settlement-retry` (retry semantics), `the-bridge-is-inside-the-token`, `rwa-multichain`.

**Risk notes:**
- **Double-mint** — the headline risk. Guard: `processed[id]` on the dest + idempotent worker keyed by `id`. Invariant tests before features (per §7).
- **Relayer trust** — the relayer is fully trusted; a compromised relayer key can mint freely on the dest. Acceptable for dev only. Mitigate with mint caps and the reconciliation alarm.
- **Core invariant:** `sum(locked on source) == sum(minted on dest)` at all times. A reconciliation cron checks it and alerts on drift; break-glass is pausing the relayer.
- **Same chain id (11155111) for fork and Sepolia** — do not key anything on chain id; key on deployment/RPC. A misconfigured RPC could point "dest" at the wrong network. Config must name networks explicitly (`local` vs `sepolia`), not by chain id.
- **Reorgs on Sepolia** — wait N confirmations before minting; the fork side is deterministic.

**Open questions (for jay):**
1. **Do we even need a real bridge for a fork?** A fork already starts from Sepolia state. A **faucet-mirror** — mint the same JYVE balance on both networks via a script — may satisfy every dev/demo need with far less machinery. Real value of the lock/mint bridge is exercising the *UX and accounting* ahead of CCIP. Is that worth it now, or defer until a service truly leaves the home chain?
2. **JYVE vs §7's "no new token" decision** — do we introduce JYVE ecosystem-wide, or keep USDC as the ledger unit and treat JYVE as a rewards/points token only?
3. **Mint authority** — one shared treasury with `MINTER_ROLE`, or per-service minters (verex, game) with individual caps?
4. **Symbol — resolved (jay, 2026-09-08):** **`JYVE`** (read "jive"), replacing the earlier `JVRS`/`JVS`.
5. **Pricing — resolved (jay, 2026-09-08):** a `JYVE/USDC` mini-AMM in the same `jayverse-token` repo is the on-chain price source; an oracle is not used (it can't price a self-made token). Open sub-question: seed price + initial liquidity depth for the demo pool.

---

## Chainlink — infra we use, not build

Chainlink's oracle stack is settlement-rail infrastructure this token *consumes*, not reimplements — see the umbrella map in [README.md](README.md).

- **CCIP** — cross-chain transport when a service truly leaves the home chain (**Phase 3**), replacing the trusted dev relayer with Chainlink's cross-chain messaging + security. **If a message is stuck or forged:** the 1:1 lock↔mint invariant breaks (double-mint or stranded funds).
- **Proof of Reserve** — attest that the locked reserve on the source backs the minted supply on the dest, so a redeem / release path can refuse units the reserve can't cover. This is the missing check from the `liquid-issuance-not-authorization` lesson: a mint bug made valid-but-unbacked units that every downstream check honored — authorization checked the *actor*, nothing checked the *object's backing*. PoR is that object-backing check (pair it with a mint-conservation invariant test).

**Deliberate non-use — pricing JYVE (the loud one).** JYVE trades only in our own market, so it has **no external price an oracle could report**. Its price comes from the constant-product mini-AMM (`price = usdcReserve / jyveReserve`), never a feed. Reaching for an oracle here is a category error — an oracle relays an *external* truth, and a self-made token has none. (See §1.2 and §6.)

> Every feed is a dependency with a failure mode — keep the "if wrong / late" guard in code, not only here.

## Cross-chain message layer — rail choice, and toy-vs-rent (LayerZero / CCIP)

The bridge needs to carry a message across chains (Phase 3). Three options, three different
answers — and naming the split matters because getting it wrong wastes the most time here.

- **Build a toy (yes — for learning).** A minimal from-scratch relayer plus the 1:1 lock↔mint
  invariant is the *point* of this repo: it teaches where a bridge actually breaks, and it pairs
  with the `liquid-issuance-not-authorization` lesson (authorization checks the *actor*; nothing
  checks the *object's backing*). Keep it as the local dev path.
- **Rent a real rail (for anything real).** Cross-chain *transport* is undifferentiated infra —
  rebuilding it for production teaches nothing new and costs forever, the same stance as the
  ERC-4337 bundler ([jayverse-rabbit.md §7](jayverse-rabbit.md)). **CCIP stays the documented
  default rail.** **LayerZero** is the considered alternative: its Decentralized Verifier Network
  lets the application *choose* its verifier set — more control, and more responsibility. Switch
  only if that explicit verifier choice is a feature we specifically want.
- **The rule:** use the rail, build only the toy, put the choice behind an environment selector.

**The principle that outlives the rail choice:** *a message layer widens what you can reach, not
where truth lives.* Settlement finality happens on **exactly one chain**; every other chain is a
display / deposit path. That is the 1:1 invariant restated — one side is the sole source of truth,
the other a mirror.

**Two silent traps, whichever rail you pick:**

| Trap | Looks like | The fix |
|---|---|---|
| Under-provisioned destination gas | send *succeeds*, destination execution fails on another chain | a retry story written **before** it's needed — the failure isn't visible at the call site |
| Untouched verifier config (LayerZero DVN / CCIP RMN) | everything works | **record who verifies in the repo, plus a CI/test that asserts the live config matches** — an unrecorded verifier is a trust assumption absent from every code review |

The second trap is the [Authority Auditor](jayverse-auditor.md)'s domain: *who am I trusting right
now, and is it written down where a change would break?*
