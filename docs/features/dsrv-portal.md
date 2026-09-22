# DSRV Portal — Institutional Custody Study & PoC

**Goal:** study how an on-chain finance platform like DSRV's "Portal" (institutional
custody/wallet infra) is built, and turn that knowledge into small PoCs that plug into
rabbit's existing surfaces — **without** holding a VASP license ourselves.

*Source: jay's DSRV Portal analysis summary (2026-07-17, pasted in session — no separate
source file; this doc is the canonical copy).*

## 1. Core knowledge areas (what a platform like Portal is made of)

### ① MPC key management & custody (security)
- **Know:** cryptography, MPC protocols (GG18, CGGMP21), TSS, HSM.
- **Build:** split keys into shares held by separate parties (server, approvers, …);
  sign by combining *partial signatures* — shares are never reassembled, so there is no
  single point of theft. Air-gapped environment for cold-wallet flows.

### ② Multi-step approval & internal controls (governance)
- **Know:** enterprise architecture, RBAC, state machines.
- **Build:** model a financial firm's approval chain (per-amount authority, etc.) as a
  state machine; the MPC signing of ① starts **only after** final approval completes.

### ③ Smart contracts & multi-chain abstraction (API)
- **Know:** Solidity/Rust, **ERC-3643** (compliance-ready token standard),
  **ERC-4337** (account abstraction).
- **Build:** AA for gas sponsorship and key-UX; a translation engine so an institution
  triggers on-chain transactions with plain RESTful API calls.

### ④ Compliance & AML
- **Know:** 특금법 (Korean VASP law), AML, Travel Rule.
- **Build:** screen transactions against external risk-wallet DBs (e.g. Chainalysis) for
  FDS filtering; pipeline that turns on-chain logs into regulator-shaped reports.

## 2. Strategies without a VASP license

| Strategy | Angle | How |
|---|---|---|
| **A. B2B API subscription** | PM/planner | Integrate a licensed custodian's (e.g. DSRV Portal) API/SDK for wallet create/query/transfer. Custody & regulatory risk stay with the VASP; we focus on product. |
| **B. RWA / STO partnership** | Business | We source the underlying asset (real estate, fractional investment) and off-chain contracts; token issuance/distribution/node infra is delegated to the Portal partner. |
| **C. Open-source PoC** | Developer | Hands-on with public sandboxes/SDKs — see below. This is the actionable track for rabbit. |

## 3. Strategy C — concrete PoC items (rabbit-friendly)

1. **MPC wallet hands-on** — Fireblocks Developer Sandbox or ZenGo's open-source MPC
   library; stand up a multi-party signing testbed.
2. **Account abstraction (AA)** — ZeroDev / Biconomy SDK: social-login signer + sponsored
   gas, no raw private key exposed to the user. Overlaps with Verex's session-key /
   paymaster ideas (see [ap2-test.md](ap2-test.md) §smart-contract plan).
3. **Mini AML dashboard** — monitor a wallet address's on-chain history via Etherscan
   API; flag simple risk heuristics. Could render as a panel under `/portfolio` or `/xyz`,
   reusing the Postgres from S6.

**Suggested first cut:** item 3 (mini AML dashboard) — smallest, needs only Etherscan API
+ existing DB/UI, and produces a visible demo; items 1–2 are sandbox exercises that don't
need a rabbit surface yet.

## Status
Backlog / study item — not yet scheduled into a roadmap phase. Pull into the roadmap
(likely P3-adjacent) once S6 (DB) lands and after the XYZ demo items are decided.
