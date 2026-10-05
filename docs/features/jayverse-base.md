# Base — L2 integration across Jayverse (`base`)

*Jayverse service **#11** (added 2026-10-05, jay: "Rabbit feature에 l2 base 연동 추가"). **Planned — nothing
is built.** This is a cross-service integration, not a new app: it puts **Base** (Coinbase's OP-Stack L2) next
to Sepolia as a chain every Jayverse service can target. The Base App **Mini App** (a distribution surface
inside Coinbase's client) is a different thing and stays a Dark Horse candidate in
[jayverse-base-app.md](jayverse-base-app.md); this doc is the chain underneath it. Sibling docs are indexed in
[README.md](README.md).*

> **Verify before building.** Base ships forks often (Azul 5/28, Beryl 6/25, **Cobalt 2026-09-30**), and a
> reported feature is not an enabled one: alice's `base-cobalt-conditional-transactions` item records that
> EIP-8130 was *reported* for Cobalt and turned out to be gated to a later fork. Check every Base-specific
> claim below against the client's fork gate or Base's own docs, in that trust order
> (client gate > spec page > exchange notice > reporting; alice `fork-date-provenance`).

---

## 0. Summary — where this is right now

**Planned, not started.** No contract is deployed on Base, no service has a Base chain config, and nothing
here costs money yet.

| | |
|---|---|
| Chain | **Base Sepolia** (testnet, chainId `84532`) first; Base mainnet (`8453`) only by a later, explicit decision |
| Why Base | An OP-Stack L2 with native USDC, an ERC-4337 bundler/paymaster ecosystem, and features L1 does not have (Cobalt: validity transactions, B20 issuer-controlled tokens) |
| Touches | #1 Rabbit (AA), #2 Verex (settlement asset), #3/#4 Token + Bridge, #5 Wallet, #6/#7 Devnet, #7/#8 Game |
| Cost | **$0** while testnet-only — public RPC or a provider free tier; no new Cloud Run service |
| Next step | Phase 1 below: one chain config, and JYVE + the AA account deployed on Base Sepolia |

## 1. Why integrate an L2 at all

- **It is where the agent-payment and stablecoin rails are.** x402 payments and much of the stablecoin
  settlement traffic run on public chains, a large share of it on L2s; USDC is native on Base. Verex's settlement asset and Rabbit's agent payments are both more
  realistic on an L2 than on Sepolia L1.
- **It tests the cross-chain parts for real.** The Token + Bridge service's lock-and-mint is currently
  Anvil ⇄ Sepolia. A Sepolia ⇄ Base Sepolia path is a real L1 ⇄ L2 bridge with a real withdrawal delay.
- **Choosing a chain is a lease** (alice `choosing-a-chain-is-a-lease`): sequencer control, fee split, exit
  cost. Integrating Base on testnet is the cheap way to read the lease before signing anything.

## 2. What it means for each service

| Service | What changes | Notes |
|---|---|---|
| **#1 Rabbit — Agentic AA** | The bundler switch (Local ↔ Sepolia) gains **Base Sepolia** as a third target; gasless one-click bet on Base | EntryPoint address and bundler/paymaster provider to be checked for Base Sepolia |
| **#2 Verex** | Settlement in **native USDC on Base** as the realistic asset (test USDC on Base Sepolia) | Later: Cobalt **validity transactions** for order expiry/cancellation — a stale order becomes "nothing happened" instead of a paid revert (alice item) |
| **Token + Exchange + Bridge** | Deploy JYVE / jUSD and the mini-AMM on Base Sepolia; add a **Sepolia ⇄ Base Sepolia** bridge path | Compare our lock-and-mint with the OP-Stack **standard bridge** (withdrawals wait out a challenge period) |
| **Wallet** | Chain switcher entry for Base Sepolia; simulate-before-sign against a Base Sepolia fork | Show the L2 fee split (L2 execution + L1 data) in the simulation |
| **Devnet** | Optional second fork target: `anvil --fork-url <Base Sepolia RPC>` for a local L2 | Phase 3 of Devnet already points at an OP-Stack L2 (`supersim`); Base is the reference chain for it |
| **Game** | Boards can show markets settled on Base; no rendering change | — |
| **Dark Horse (c) Base App** | The Mini App, if it is ever built, sits on top of this integration | Stays a candidate; this doc does not commit to it |

## 3. Phases (build order)

| Phase | Goal | Done when |
|---|---|---|
| **1** | One shared **chain config** entry for Base Sepolia (chainId, RPC, explorer, USDC address) read by every service; JYVE and the Rabbit AA account deployed there | A gasless one-click bet goes through on Base Sepolia and is visible on the Base Sepolia explorer |
| **2** | **Bridge + money:** Sepolia ⇄ Base Sepolia path for JYVE (ours vs the standard bridge, side by side); Verex quotes and settles a test market in Base Sepolia USDC | A deposit and a withdrawal both complete, with the withdrawal delay shown in the Wallet bridge screen |
| **3** | **Base-only features**, each verified against the client gate first: validity transactions for Verex order expiry; B20 issuer checks for a token-gated asset | One feature is live on Base Sepolia with a note of which fork enabled it and how that was checked |

## 4. Open questions

- **RPC:** public endpoint (rate-limited) vs a provider free tier vs Coinbase's developer platform — which one, and where the key lives.
- **Paymaster:** our own verifying paymaster (as on Sepolia) or a hosted one on Base Sepolia.
- **Mainnet:** never, or only for a demo with a spending cap — a decision for jay, not a default.
- **One config for all services:** a shared package vs each service's own `.env`. The Devnet already had to answer this for chainId `313370`.

## 5. Cost

**No change to the bill while this is testnet-only.** It adds contracts on a public testnet and a chain entry
in existing services; no Cloud Run service, VM or database is added. A paid RPC tier or mainnet gas would be
the first costs, and both are behind decisions in §4.
