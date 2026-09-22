# Chainlink CRE × Cloud — Hybrid Use Cases (reference)

**What:** four use-case patterns where **CRE (Chainlink Runtime Environment)** coordinates
between private cloud infrastructure (AWS/GCP — the trusted data/cash side) and public
blockchains (the settlement side). The recurring shape: **cloud holds the sensitive or
off-chain leg; CRE verifies and pushes the on-chain leg.**

*Source: jay's CRE use-cases note, pasted in session 2026-07-17 (no URL — this doc is the
canonical copy). Reference only — tie-in candidates noted per case.*

## The four patterns

### 1. Tokenized asset servicing (RWA)
- **Cloud:** legal docs, ownership history, KYC in a private DB (e.g. DynamoDB).
- **CRE:** the "digital transfer agent" — on a sale, runs a workflow that checks the cloud
  DB for compliance, then updates on-chain ownership.
- **Benefit:** blockchain speed with cloud-side legal/compliance security.
- *Tie-in:* [dsrv-portal.md](dsrv-portal.md) strategy B (RWA/STO) — CRE is one concrete
  "off-chain contract ↔ on-chain token" coordination layer.

### 2. Proof of Reserve (PoR) for stablecoins
- **Cloud:** a serverless function (Lambda) polls the bank's private API hourly for the
  backing balance.
- **CRE:** fetches the balance, verifies it through a decentralized network, pushes the
  proof on-chain for anyone to read.
- **Benefit:** investors verify instead of trust.
- *Tie-in:* the KB hybrid payment flow ([kb-hybrid-payment-flow.md](kb-hybrid-payment-flow.md))
  — a KRW-stablecoin issuer needs exactly this reserve-attestation leg.

### 3. Delivery vs Payment (DvP) settlement
- **Cloud:** handles the **cash leg** via traditional rails (SWIFT/FedWire).
- **CRE:** coordinates the **asset leg** on-chain (e.g. a tokenized treasury bond) — the
  bond moves only when the cloud confirms cash arrival.
- **Benefit:** eliminates settlement risk (one side delivering while the other defaults).
- *Note:* the same authorize/settle discipline as [kb-hybrid-payment-flow.md](kb-hybrid-payment-flow.md),
  applied to securities settlement.

### 4. AI-powered prediction markets
- **Cloud:** an LLM (GCP Gemini) analyzes news/sports data to determine an event's outcome.
- **CRE:** takes the AI's conclusion and settles a betting/insurance contract on-chain.
- **Benefit:** automates resolutions that used to need human judges.
- *Tie-in (the interesting one):* **verex's oracle track** — verex plans manual → Chainlink
  adapter → UMA (3-stage). "AI-as-oracle via CRE" is a possible **stage 4** for subjective
  markets: faster than UMA's dispute window, but it moves trust into a model. Worth a note
  in verex's oracle doc when it becomes real.

## The common shape (one line)
Cloud = private truth (compliance, cash, reserves, AI judgment) · chain = public settlement ·
**CRE = the verified bridge that lets the second react to the first.**

## Status
📎 Reference only — not a scheduled dev item.
