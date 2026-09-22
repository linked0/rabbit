# Solana — Integration Study & Sample Contract

**Goal:** learn Solana's development model (it is *not* an EVM chain — different mental model,
language, and tooling), ship one **sample on-chain program** to devnet, and call it from a
rabbit demo page.

*Source: jay's request, 2026-07-17 (no source file). Motivation: every other on-chain item in
rabbit/verex is EVM (Hyperliquid, Sepolia AA, x402-on-Base); Solana is the biggest non-EVM
ecosystem and keeps appearing in the agent-payments space (e.g. "ETH, SOL" native-gas note in
[agentic-aa.md](agentic-aa.md)).*

## 1. Research scope (short note before coding)
Write a compact EVM-dev-oriented comparison into this doc (or `docs/knowledge/`):
- **Account model** — programs are stateless; state lives in separate *accounts* passed into
  each instruction (vs EVM contract storage). Rent-exempt balances.
- **PDAs (Program Derived Addresses)** — program-owned accounts derived from seeds; the
  Solana idiom for mappings/escrow vaults.
- **Transactions** — every account an ix touches is declared up front (enables parallel
  execution); compute units instead of gas; priority fees.
- **Token standard** — SPL Token (+ Token-2022 extensions), associated token accounts — vs
  ERC-20's balance-in-contract model.
- **Toolchain** — Rust + **Anchor** framework (the de-facto Hardhat/Foundry of Solana),
  `solana-test-validator` for local dev, devnet faucet for deploy.

## 2. Sample contract (Anchor program) — ladder
1. **Counter / guestbook program** — classic first Anchor program: init a PDA account, an
   `increment`/`post` instruction, an Anchor TS test. Local validator → **devnet** deploy.
2. **SPL escrow (small)** — two-party escrow of an SPL token using a PDA vault: deposit →
   release/refund. Exercises PDAs, CPIs to the token program, and account constraints — the
   three things EVM devs actually need to learn.
3. *(stretch)* **x402-flavored tie-in** — the escrow as a "pay for data" leg mirroring the
   AP2/x402 loop in [ap2-test.md](ap2-test.md), but settled in SPL tokens on devnet.

## 3. Rabbit surface
- **Page:** `/etc/solana` — connect **Phantom** (Solana wallet-adapter), show devnet SOL/SPL
  balance, one button per program instruction (increment / deposit / release), tx-signature
  links to Solana Explorer (devnet).
- **Client stack:** `@solana/web3.js` (or the newer `@solana/kit`) + wallet-adapter-react;
  Anchor's generated IDL/TS client for typed calls.
- **Repo shape:** Solana programs need their own Rust workspace — `spagetties/solana/`
  (or a new top-level `solana/` folder) with the Anchor project; only the page + IDL live in
  the Next.js app.

## 4. Estimate & sequencing
- Research note ~0.5d · Anchor counter on devnet ~1d · escrow ~1–2d · `/etc/solana` page ~1d
  → **first cut = research note + counter + minimal page (~2–2.5d)**; escrow after.
- Independent of the EVM items — can slot anywhere; pairs well after [agentic-aa.md](agentic-aa.md)
  for an "EVM vs Solana agent payments" perspective.

## Status
Backlog / to do — not yet scheduled.
