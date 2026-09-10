# Jayverse — Wallet & simulate-before-sign

*One embedded-wallet + transaction-preview widget every Jayverse app drops in, so a user
connects once and always sees the decoded effect of a transaction — token deltas, approvals,
warnings — **before** they sign it.*

*Source: umbrella plan [`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md) §6 "Wallet &
Simulation-before-sign as a service" and jay's comment there ("Show me the user scenario and what
web app shows and the flow… describe what you will do in a new md file"). Design draft for review —
not built. Sibling docs indexed in [README.md](README.md).*

---

## Phases (build order)

| Phase | Focus | What we implement |
|---|---|---|
| **1 (MVP)** | simulate-before-sign | `simulate()` API (fork-backed node + `stateOverride`, viem `simulateContract`); `<JayverseSign>` connect→preview→sign component; decode effects / approvals / warnings; shared wallet client + address book. |
| **2** | Session keys & templates | scoped ERC-7715/7710 session-key templates so agent and one-click flows are popup-free. |
| **3** | 4337 & breadth | simulate full UserOperations through the EntryPoint (incl. paymaster); richer decoders; more warning classifiers. |

---

## 1. What we build (the basic feature)

A drop-in React component — `<JayverseSign>` — with three states: **connect → preview → sign**.
It is the *only* signing surface in Jayverse; no app calls `walletClient.writeContract` directly.

- **Connect** — embedded wallet (email / passkey login, no seed phrase) or an existing browser
  wallet. One account across every Jayverse app.
- **Preview** — before the wallet prompt appears, the component calls a `simulate()` API that runs
  the exact transaction against a chain fork and returns its **decoded effects**: which tokens the
  account gains/loses, which approvals it sets, and any **warnings**. This is the whole point:
  the user reads plain-language consequences, not raw calldata.
- **Sign** — only after the user sees the preview do we hand the transaction to the wallet to sign
  and submit.

Scope is deliberately small and buildable: `simulate()` + one component + the shared wallet
provider. No new chain, no new token, settles on the shared rails (USDC on Base).

---

## 2. User scenario

**Mina** wants to bet on a Verex market from the Jayverse portal. She logged into the portal weeks
ago with her email, so her embedded wallet is already connected — no popup, no seed phrase.

She types "10 USDC on YES" and clicks **Place bet**. Instead of a raw wallet prompt full of hex,
a preview slides up:

> **You will spend** 10.00 USDC
> **You will receive** ~12 YES shares
> **Approval** USDC spending set to *Verex Exchange* (exact amount, 10 USDC)
> *No warnings.*

She recognizes exactly what happens, clicks **Sign**, and the bet is placed. The signature was the
last step, not the first — she decided *with* the facts.

**Off-happy-path.** The next day a market UI she doesn't fully trust asks her to sign. The preview
shows a red banner:

> ⚠ **Approval widening** — this sets *unlimited* USDC spending for an unknown contract.
> ⚠ **Value drain** — simulated net balance change: **−48 USDC**, receive nothing.

She clicks **Cancel**. The widget refused nothing on her behalf — it *showed* her, and she stopped.
That is the product: the simulation turns "sign this opaque thing" into "here is what it does".

---

## 3. What the web app shows

**Connect flow.** A single **Connect** button. First-time users pick email or passkey; the embedded
provider creates a smart account behind the scenes. Returning users are already connected (session
restored). A small account chip shows address + USDC balance. No network-switching friction — the
app targets the home chain.

**Pre-sign preview modal** (the core screen). Rendered from `simulate()` output:

- **Effects list** — one row per asset change: `−10.00 USDC`, `+12 YES shares`, each with token
  logo, human amount, and USD value where known.
- **Approvals** — spender name (resolved from the address book), amount, and whether it is exact
  or unlimited.
- **Warnings** — a color-coded taxonomy, worst-first:
  | Warning | Meaning | Signal |
  |---|---|---|
  | **Revert** | the tx would fail on-chain (decoded custom error, e.g. `InsufficientAllowance()`) | block — disable Sign, show the decoded reason |
  | **Approval widening** | sets an unlimited/large allowance, or a new spender | red banner, require a second confirm |
  | **Value drain** | net balance change is strongly negative vs. what the user expects to receive | red banner |
- **Gas / fee** line, and where relevant a "sponsored" tag (paymaster).
- **Sign** button — primary; disabled on a `revert` warning. **Cancel** always available.

If `simulate()` itself fails (RPC down, fork unavailable), the modal says so and offers "sign
anyway" only as an explicit, clearly-labeled fallback — never a silent skip.

---

## 4. The flow

```
 app builds tx (to, data, value)
        │
        ▼
 simulate(tx, account)  ──► fork/state-override RPC
        │                    · viem simulateContract
        │                    · eth_call w/ stateOverride (balances, allowances)
        │                    · trace token transfers + approvals
        ▼
 decode effects & errors
   · ERC-20/721/1155 Transfer & Approval logs → deltas
   · revert data → custom-error ABI decode
   · classify warnings (revert / approval-widening / value-drain)
        │
        ▼
 render <JayverseSign> preview  ──► user reads effects + warnings
        │
        ▼ (user clicks Sign)
 walletClient.sendTransaction / sendUserOperation → chain
```

- **Build** — the calling app produces a plain transaction request (or a 4337 UserOperation) and
  hands it to the widget; it never signs on its own.
- **Simulate** — `simulate()` runs the tx server-side against a **fork-backed** node with
  **state overrides** (viem `simulateContract` + `eth_call` `stateOverride`), so we can preview even
  when a needed approval isn't set yet (override the allowance, then simulate the real call).
- **Decode** — parse emitted `Transfer`/`Approval` events into per-asset deltas for the account;
  decode any revert into its custom error via the target ABI; run the warning classifiers.
- **Render → sign** — the widget shows the preview; only on the user's click does it submit.

---

## 5. Cooperate with existing services (it is the shared dependency)

Everything else in the plan depends on *this* (§6: "everything else depends on it, so build early").
Every signing path routes through `<JayverseSign>`:

- **Verex bets** (§2) — placing/redeeming a bet previews `−USDC / +shares / approval to exchange`.
  Pairs with Verex's own AA (4337 smart accounts, paymaster) — the wallet provides the account and
  the preview, Verex provides the market.
- **Personas** (§4) — mint/rent previews `−USDC / +NFT` and the ERC-4907 user-role grant, so a
  renter sees exactly what a "rent for a day" transaction does.
- **DeFi** (§3) — its plan literally says "simulate deposits via the Wallet's simulate-before-sign";
  a deposit previews the vault-share received and the token spent before any custody risk.
- **Game** (§5) — the in-street trade panel previews an item trade (`simulate-before-sign` is one of
  its PoC links) so an in-game purchase is as legible as a web one.
- **Token bridge** (§7) — the lock/mint bridge is the *scariest* signature (funds leave a chain), so
  `<JayverseSign>` previews *lock N JYVE on source → receive N on dest* before signing.
  simulate-before-sign is the connective tissue that makes verex-winnings → bridge → wallet one safe
  flow ([jayverse-token-bridge.md](jayverse-token-bridge.md)).
- **Agent / Agentic AA** (§1) — complements, not replaces, the agent's on-chain mandate: the agent's
  scoped session key (ERC-7715/7710) enforces *what it may do*; `simulate()` shows *what a given tx
  would do*, so a human (or the Authority Auditor, §8) can preview an agent action before granting or
  while reviewing it. Same decode pipeline feeds the agent action log.

Shared address book (spender-name resolution, token metadata) comes from the **`jayverse-rails`**
config package, so every app's preview labels contracts identically.

---

## 6. Implementation sketch

**Two artifacts, one repo (`jayverse-wallet`):**

1. **SDK package** (`@jayverse/wallet`, published) — the `<JayverseSign>` component, a
   `useJayverseWallet()` hook (connect/account/balance), and a typed `simulate()` client. This is
   what rabbit/verex/personas/game import.
2. **Simulate API service** (Cloud Run, rabbit cloud) — stateless HTTP `POST /simulate` that owns
   the fork RPC connection, decode logic, and warning classifiers. Kept server-side so we control
   the fork node and can cache token/ABI metadata.

**Provider decision — embedded vs. self-managed keys.** Lead candidate is an embedded-wallet
provider (Privy, from the PoC learnings) for the email/passkey UX, but the choice is gated on the
**four-path test** (write it down as an authority matrix before committing):

| Path | Question to answer for each candidate |
|---|---|
| **New device** | can a user re-access the same account on a fresh device, and with what factor? |
| **Lost factor** | recovery when one factor (email/passkey/device) is gone — who can, who cannot |
| **Export** | can the user export their key and leave? (custody honesty) |
| **Scoped signer** | can we issue a session key with a spend cap + allowed-contracts scope (7715)? |

The answers become the "authority matrix of our own config" (§6 step 4) that the Authority Auditor
dogfoods against — our config choices *are* every user's custody reality.

**Session-key policy templates** — per-app presets issued at connect time: e.g. *verex-bet* = "≤ N
USDC/day, only the Verex exchange + USDC contracts, 24h"; *personas-rent* = "single mint/rent call,
exact amount". Templates live in `jayverse-rails` so policy is reviewable, not ad-hoc per app.

**New vs. reused:**
- *Reused* — viem clients, chain configs, and the address book from `jayverse-rails`; existing
  fork/anvil infra (we already run Sepolia forks daily); the embedded-wallet PoC.
- *New* — the `simulate()` decode+classify pipeline, `<JayverseSign>`, the session-key template set,
  and the fork-backed simulate service deployment.

**Open questions:**
- Fork freshness vs. cost — a persistent warm fork per chain, or spin per request? Latency budget for
  the preview to feel instant (< ~1s).
- 4337 UserOperations: simulate the full op through the EntryPoint (including paymaster) vs. simulate
  the inner calls only — the former is more accurate, more work.
- Value-drain threshold — what net-negative delta trips the warning without false alarms on
  legitimate one-sided txs (e.g. a donation)?
- MEV/slippage on quoted "receive" amounts — the preview is a simulation, not a guarantee; how loudly
  to say so.
- Provider lock-in — how hard is migrating accounts if we later switch providers (feeds the export
  path answer).

---

## Chainlink — infra we use, not build

Chainlink's oracle stack is settlement-rail infrastructure the Wallet *consumes*, not reimplements — see the umbrella map in [README.md](README.md).

- **Data Feeds** — USD valuation for external assets (ETH, USDC) in the balance and simulate-before-sign views. **If wrong or late:** the USD figures the user checks *before signing* are misleading — worst at exactly the moment trust matters most.

**Deliberate non-use — JYVE's USD.** JYVE's USD value is read from the mini-AMM (`getPrice()`), not a feed — a self-made token has no external price. (See [jayverse-token-bridge.md](jayverse-token-bridge.md).)

> Every feed is a dependency with a failure mode — keep the "if wrong / late" guard (staleness check / fallback) in code, not only here.
