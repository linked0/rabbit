# Jayverse — JVRS token + intra-bridge

**Purpose:** define an ecosystem ERC-20 (`JVRS`) used across Jayverse services and a minimal, dev-grade bridge to move it between jay's local Anvil fork and Sepolia. Design draft for review — nothing here is built yet.

> Source: [`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md) §7 "Intra Jayverse Bridge" and jay's comment there ("We can create an ERC coin used in our ecosystem like JVRS or JVS… bridged between my Anvil chain and Sepolia. Show me some imaginary scenario."). Hub: [`README-Jayverse.md`](./README-Jayverse.md).
>
> Note on scope vs §7: the plan's §7 records a "no new token" decision (the intra-ledger is USDC balances in a shared vault). This doc explores the *opposite* branch jay asked for — an actual ecosystem token plus a real cross-chain hop — as a parallel design for jay to compare against the ledger-only approach. It does not overturn §7; it gives the token option a concrete shape to review.

---

## 1. What we build (basic feature)

Two small pieces, deliberately minimal:

1. **`JVRS` — an ERC-20 (Jayverse token).** Standard OpenZeppelin ERC-20, 18 decimals, symbol `JVRS`, name "Jayverse". Alt symbol `JVS` if `JVRS` reads badly in UI — primary is **JVRS**. It is the unit of account inside the ecosystem: verex rewards, persona rentals/payments, and game prizes are denominated and paid in JVRS. On testnet/dev it is mintable by an owner/faucet role (see §5); it is *not* a real-money asset.
2. **A minimal bridge** to move JVRS between jay's **local Anvil fork of Sepolia** (chain id 11155111) and **real Sepolia** (also 11155111). Because both report the same chain id, the bridge is keyed by RPC endpoint / deployment, not by chain id — see the honesty note in §5. Pattern: **lock-and-mint / burn-and-release** driven by a single trusted relayer worker.

Keep both basic. No governance, no fee market, no multi-hop routing. The bridge is a developer convenience for testing cross-chain UX, not a trustless product.

---

## 2. Imaginary scenario

Meet **Mina**, a Jayverse user, working against the local dev stack (Anvil fork of Sepolia).

1. **She wins on verex.** Mina holds a YES position on a verex market ("Will it rain in Seoul this weekend?"). The market resolves YES. Verex settles her winnings and pays out **120 JVRS** to her wallet on the local Anvil chain. In the portal her balance ticks from 0 → 120 JVRS.
2. **She rents a persona.** Mina wants "Startup-Mentor" for an hour. The persona service quotes **40 JVRS**. She confirms; the wallet service signs an ERC-20 `transfer` of 40 JVRS from her wallet to the persona's payment address. Balance: 120 → 80 JVRS. The persona unlocks for the session.
3. **She bridges to Sepolia.** Mina wants **30 JVRS** on real Sepolia so a friend on the shared testnet can see it. In the portal she opens **Bridge**, picks source = *Local (Anvil fork)*, dest = *Sepolia*, amount = 30. She signs one transaction. The 30 JVRS is **locked** in the bridge contract on the Anvil chain.
4. **The relayer does its job.** The bridge relayer worker sees the `Locked` event, waits for confirmation, and **mints** (or releases from a pre-funded reserve) 30 JVRS to Mina's address on Sepolia. The portal shows: `Locked ✓ → Relaying… → Minted ✓`. Sepolia balance: +30 JVRS. Local balance: 80 → 50 JVRS.
5. **Later, she bridges back.** Mina sends 10 JVRS from Sepolia → Local. On Sepolia the bridge **burns** her 10 JVRS; the relayer **releases** 10 JVRS from the lock on the Anvil side back to her. Invariant holds: total locked on source always equals total minted on dest.

No step requires Mina to understand that the "two chains" are really a fork plus its origin — the UX is identical to a real bridge, which is the point of building it.

---

## 3. What the web app shows (portal)

- **Balance widget:** JVRS balance per chain, labeled by network — `Local (Anvil fork)` and `Sepolia`. USDC shown alongside (rails already surface USDC).
- **Bridge screen:**
  - Source chain → dest chain selector (swap arrow to flip direction).
  - Amount input with max = source balance; validation against mint caps / bridge limits.
  - A status strip showing the lifecycle: `Sign lock → Locked ✓ → Relaying… → Minted ✓` (and the mirror for burn-and-release).
  - Per-leg tx links (source lock tx, dest mint tx) so the user can inspect each on the right explorer.
- **Tx / transfer status:** a small activity list — verex payout, persona payment, bridge legs — each with state (`pending`/`confirmed`/`failed`) and idempotency key, so a stuck relay is visible rather than silent.

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
  │  JVRS (ERC-20)   │                    │  JVRS (ERC-20)   │
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

- **Settlement Rails (`jayverse-rails`):** publishes JVRS addresses per network in `addresses.json` alongside USDC. Rails stays the single source of truth for "what token is at what address on what network." JVRS is listed as a first-class rail asset next to USDC.
- **Verex (collateral / rewards):** verex mints/pays JVRS as reward on market resolution (via `MINTER_ROLE` or a payout treasury). Collateral can stay USDC; rewards denominated in JVRS. Verex calls the token, not the bridge.
- **Personas (payments):** persona rental/usage is priced in JVRS; payment is a plain ERC-20 `transfer` (or `transferFrom` with approval) to the persona payee. No bridge involved unless payer and payee are on different chains.
- **Wallet service (`jayverse-wallet`):** holds keys / signs all user actions — token transfers, bridge `lock`/`burn` transactions. The bridge screen asks the wallet service to sign; the relayer uses its own dedicated key, never a user key.

Each service depends only on the JVRS contract + rails config; only the bridge screen and relayer touch the bridge contracts.

---

## 6. Implementation sketch

**New:**
- `JVRS.sol` — ERC-20 (OZ), `MINTER_ROLE`, per-address + global mint caps.
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
1. **Do we even need a real bridge for a fork?** A fork already starts from Sepolia state. A **faucet-mirror** — mint the same JVRS balance on both networks via a script — may satisfy every dev/demo need with far less machinery. Real value of the lock/mint bridge is exercising the *UX and accounting* ahead of CCIP. Is that worth it now, or defer until a service truly leaves the home chain?
2. **JVRS vs §7's "no new token" decision** — do we introduce JVRS ecosystem-wide, or keep USDC as the ledger unit and treat JVRS as a rewards/points token only?
3. **Mint authority** — one shared treasury with `MINTER_ROLE`, or per-service minters (verex, game) with individual caps?
4. **Symbol** — confirm **JVRS** over `JVS`.
