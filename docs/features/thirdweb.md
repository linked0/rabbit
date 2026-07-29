# Thirdweb — full-stack Web3 platform (SDK + contracts + infra in one box)

**Goal:** reference survey — where a bundled platform beats best-of-breed parts for rabbit's
tracks, and which touchpoints are worth a hands-on check.

*Source: daily service note 38/113, pasted in session 2026-07-29 (KST). Links:
https://thirdweb.com · https://portal.thirdweb.com. Category: SDK / contract deploy /
wallets·AA / backend (Engine) / RPC·indexing.*

## 1. One-liner

Contracts (audited prebuilts + custom deploy) · SDK (TS/React/Unity/.NET) · wallets
(embedded + smart accounts) · backend (Engine) · data (Insight) — one account covers a
dApp end-to-end. Opposite philosophy to Stackup (37/113, bundler purism): **wins on
breadth**, not per-part depth.

## 2. Core features & differentiators

| Layer | What it gives | Note |
|---|---|---|
| Contracts | Audited prebuilts (token · NFT · marketplace · airdrop) deployed from the dashboard; custom Solidity via `npx thirdweb deploy` | Signature move: browser-signing flow — the private key never enters the CLI |
| Connect (wallets) | Social/email embedded wallets + ERC-4337 smart accounts + external wallet connect in one SDK | Absorbs the Privy (3/113) / Web3Auth (35/113) territory as a platform bundle |
| Engine | Backend tx infra — server wallets, nonce management, gas retries, webhooks, all over REST | "Send txs safely from a backend" as a service |
| Unity/.NET SDK | Game-side support is genuinely substantial | Touchpoint with the (paused) Unity track |
| Insight / RPC | Indexing + data APIs | Thinner than a dedicated indexer |

**Tradeoff summary:** each part is thinner than the individual best (viem + Pimlico +
own indexer), but for "start today, ship this week" speed there are few substitutes.

## 3. Rabbit touchpoints

- **Agentic AA** ([agentic-aa.md](agentic-aa.md)): thirdweb smart accounts + paymaster could
  stand in for hand-rolled 4337 plumbing in the 4-pillar demo — worth comparing against
  the current Pimlico-style stack for demo velocity vs. transparency.
- **AP2 / backend payments** ([ap2-test.md](ap2-test.md)): Engine's server-wallet + nonce
  + retry model is the same problem verex's ChainJob worker solves by hand — a useful
  build-vs-buy reference point.
- **Game / Unity (paused track)**: if the Unity track resumes, the Unity SDK is the
  fastest wallet+contract on-ramp to trial first.
