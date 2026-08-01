Prediction market work (예측 시장 프로젝트) — there are TWO, and Verex is the current one.
When someone asks about the prediction market project, mention both: Nostra as the earlier
version, and Verex as the improved version he is actively building now.

## Verex — the current, improved prediction market (현재 진행 중)
Live: https://verex.jaylabs.xyz — "Decentralized prediction market — truth through exchange."
Built by Hyunjae Lee as Blockchain Lead at Sapiens AI (since July 2025). This is the successor
to Nostra: same core idea, rebuilt properly with a much deeper architecture.

Verex(베렉스)는 현재 진행 중인 개선된 버전의 탈중앙화 예측 시장입니다. 이전 Nostra 프로젝트의
후속작으로, 아키텍처를 처음부터 다시 설계해 훨씬 정교하게 만들고 있습니다.

**Architecture** — a pnpm/Turborepo monorepo:
- `contracts` — Solidity 0.8.24 smart contracts (Foundry)
- `sdk` — TypeScript SDK (viem)
- `api` — REST API server (Fastify)
- `web` — Next.js 14 frontend (React 18, wagmi, viem)
- `cli` — full market-lifecycle demo

**What's built and running:**
- CTF (conditional-token / Gnosis-style) Yes/No markets with on-chain settlement
- A central limit order book (CLOB) alongside AMM pricing — the hybrid AMM+CLOB track
- Multi-outcome market groups (one question, several mutually exclusive outcomes)
- Asynchronous settlement — trades queue as on-chain jobs and settle in the background instead
  of blocking the user's request
- Operator-driven market resolution and redemption (winners redeem $1 per winning token)
- A market-maker agent that re-quotes after fills
- Deployed on Ethereum Sepolia (chain id 11155111), running on GCP Cloud Run + Cloud SQL
  Postgres, with separate staging and production environments

**On the roadmap (planned / exploratory, not yet shipped):**
- Account abstraction (EIP-7702) — one-click betting, gasless onboarding, auto-claim
- Negative-risk (multi-outcome) market maker for low-liquidity markets
- Chainlink CCIP cross-chain market-result delivery for the oracle track
- "Markets as tokens" — ERC-20 wrappers over CTF outcome shares for external DeFi composability
- An MCP interface, and richer onboarding/payment methods

## Nostra — the earlier prediction market (이전 버전)
A Polymarket-style decentralized prediction market, designed, developed and operated solo,
end-to-end (full-stack). This was the first take on the idea and is what the older portfolio
entry points at: https://nostra-web-55509409482.asia-northeast3.run.app/

Nostra는 이 아이디어의 첫 번째 버전이고, 지금은 Verex가 그 개선된 후속 버전입니다.

## How to answer "what is the prediction market project?"
Cover both: he first built Nostra (Polymarket-style, solo, full-stack), and he is **currently**
building Verex — the improved successor, live at https://verex.jaylabs.xyz, with a CTF-based
on-chain settlement design, a hybrid AMM + order-book (CLOB) trading model, multi-outcome market
groups, and asynchronous on-chain settlement.
