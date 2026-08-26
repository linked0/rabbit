# Agentic AA — 4 Pillars Demo (account abstraction for autonomous agent payments)

**Goal:** demonstrate, on testnet, the four things account abstraction (AA) gives an
autonomously-paying agent that a normal EOA wallet cannot — one demo panel per pillar.

*Source: "The What: 4 Pillars of Agentic AA" note, pasted in session 2026-07-17 (no URL
provided — this doc is the canonical copy). Sits on top of the existing agent-payments track:
[ap2-test.md](ap2-test.md) (x402 / aiaas, spend policy) and design §3 (ERC-7702/7715 session
keys).*

## 1. The four pillars

| # | Pillar | What it means | Key standard / piece |
|---|--------|---------------|----------------------|
| 1 | **Scoped delegation** ("the allowance") | No master key handed over — issue a **session key**: "spend ≤ 10 USDC/day, only on service X, valid 48h" | ERC-7715 / 7710 (already the §3 demo); ERC-4337 session-key validators |
| 2 | **Gas independence** ("the paymaster") | Agent never hunts for ETH/SOL — pays gas **in the USDC it earns**, or a sponsor covers it | ERC-4337 **Paymaster** (ERC-20 gas payment or sponsored) |
| 3 | **Atomic intent** ("the batch") | Swap A→B → bridge → pay provider bundled into **one UserOperation**; any failure reverts the whole thing — agent never gets stuck mid-flow | ERC-4337 batched calls (`executeBatch`) |
| 4 | **KYA — Know Your Agent** | The AA wallet doubles as a digital ID; counterparties check the agent's **reputation/"credit score"** before dealing | **ERC-8004** (trustless-agents identity/reputation registries) |

## 2. How it maps onto existing rabbit items (mostly already planned!)
- **Pillar 1 = design §3** (MetaMask Delegation Toolkit, ERC-7715 scoped session key on
  Sepolia). Building §3 ticks this pillar.
- **Pillar 2** = the paymaster ideas already noted in [ap2-test.md](ap2-test.md) (escrow/
  paymaster, Verex session-key reuse) and [dsrv-portal.md](dsrv-portal.md) PoC #2 (ZeroDev/
  Biconomy sponsored gas). New work: pay gas **in ERC-20 (USDC)**, not just sponsorship.
- **Pillar 3** is the genuinely new demo: a batched UserOperation (e.g. testnet swap +
  transfer in one op) and a forced-failure case showing full revert.
- **Pillar 4** is new and exploratory: read/register an agent in an **ERC-8004** identity/
  reputation registry (testnet deployment availability to verify — the standard is young).

## 3. Demo shape (`/etc` — extend the §3 page rather than a new route)
One page, four cards; each card = one pillar with a [Run] button + result/tx link:
1. **Session key** — grant scoped permission, agent spends within scope, out-of-scope attempt
   fails (this card *is* §3's demo).
2. **Paymaster** — send a tx with zero native token in the agent account; gas paid in test
   USDC (ZeroDev/Pimlico ERC-20 paymaster) or sponsored.
3. **Batch** — one UserOp doing two actions atomically; a second run with a failing leg shows
   the whole op reverting.
4. **KYA** — look up (or register) the agent's ERC-8004 identity; display reputation fields.

**Stack:** ZeroDev or permissionless.js + Pimlico (bundler/paymaster) on **Sepolia** — same
family as §3's decided stack, so the page shares wallet-connect and account plumbing.
**Est.:** pillars 1–3 ≈ 2–3 focused days on top of §3; pillar 4 +1d (standard maturity risk).

## 4. ERC-8021 — builder codes / on-chain attribution (added 2026-07-17)
*Source: jay's ERC-8021 note, pasted in session 2026-07-17 (no URL — canonical copy here).
Natural companion to pillar 4: **ERC-8004 answers "who is the agent"; ERC-8021 answers
"which app/agent produced this transaction".***

- **What:** an on-chain attribution ("machine referral") standard — a transaction carries a
  marker saying "this tx came from app/agent A", verifiable by anyone on-chain.
- **How:** a **calldata suffix**: `[schema ID (1 byte)] + [builder code, e.g. "phantom"] +
  [ERC marker (16 bytes)]` appended after the function's real arguments. The EVM ignores
  calldata beyond what the function decodes, so the suffix changes nothing in contract logic
  while permanently recording attribution in the ledger.
- **Why it matters:** previously "which wallet/bot originated this trade" needed a
  centralized DB or proxy contracts. With 8021, DEXes/protocols can do transparent
  **revenue-share** with referring apps, and agent platforms can prove an **agent's output
  on-chain and reward it** (the source note's Infra402 example).
- **Demo hook (cheap add to the 4-pillar page):** append a rabbit builder-code suffix to the
  demo transactions from pillars 1–3, then have the execution log **parse the suffix back**
  from the raw tx — attribution proven end-to-end. Roughly +0.5d; also a natural fit for the
  x402/aiaas track ([ap2-test.md](ap2-test.md)): the paying agent leaves its code on every
  settlement tx, making agent-performance accounting on-chain-auditable.

## 5. Case study: WalletChan — "MetaMask for AI agents" (added 2026-07-17)
*Source: jay's WalletChan v3 note, pasted in session 2026-07-17 (no URL — canonical copy
here). A shipping product that assembles several of this doc's pillars — useful as a
reference architecture, and as a UX pattern the 4-pillar demo page can borrow.*

- **What it is:** a browser extension bridging the **Bankr** agent backend to ordinary
  dApps. Injects a wallet provider via **EIP-1193/6963** (`window.ethereum`), so Uniswap/
  Aave see it as a normal wallet — but "connect" exposes the *agent's* address, and signing
  is **remote**: the extension forwards requests to Bankr's secure environment (TEE), the
  agent signs there, only the signed result hits the chain. Private keys never touch the
  browser.
- **v3 features → this doc's pillars:**
  | WalletChan v3 | Maps to |
  |---|---|
  | Batch transactions (AA-based) | **Pillar 3** — atomic intent |
  | Gasless USDC transfers ($WCHAN stakers; relayer pays) | **Pillar 2** — paymaster/sponsorship |
  | Remote signing in a TEE | Custody pillar — TEE alternative to MPC ([dsrv-portal.md](dsrv-portal.md) ①) |
  | Tx simulation before signing | No pillar — but a **safety rail worth copying** in our demo page |
  | Native in-wallet swaps | Convenience layer |
- **The interesting inversion:** rabbit's aiaas track ([ap2-test.md](ap2-test.md)) puts the
  *agent* in charge and the human sets policy; WalletChan puts the *human* in the driver's
  seat (browsing the dApp UI) with the agent as execution backend. Same building blocks,
  opposite control flow — worth showing both in any write-up.
- **Open question (from the note):** do agent-based wallets replace manual wallets like
  MetaMask, or stay a complementary layer? Current read: complementary until agent custody
  (TEE/MPC) earns MetaMask-level trust.

## Status
🟡 Partly built — ① session key + ②③ sponsored/batch tx are live on `/live/aa`; ④ KYA stayed an
explainer card (ERC-8004 testnet registry unverified). The autonomy loop that would put these to
work unattended is [README.md → Backlog B1](README.md#b1); the build detail for what shipped is in
the [2026-08-06 archived plan §6](../tasks/archive/2026-08-06-current-plan-ap2-toss-aa.md#s6).
*(Updated 2026-08-21 — this line previously pointed at `../tasks/current-plan.md` §6, which was
archived.)*
