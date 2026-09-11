# What Jayverse can build on — the shortlist of rails, by need

> **Copied from** the Notes card [`jayverse-build-on-the-shortlist`](../topics/pocs-jayverse-build-on-the-shortlist.html)
> — canonical source is `lib/poc-cards.ts` (edit the card, run `pnpm docs:pocs`; keep this file in
> sync). A curated menu of external libraries, platforms, and services each Jayverse product can
> reach for instead of rebuilding.

**Read it as a shortlist, not a spec.** When a Jayverse feature calls for something a mature protocol
already provides — a price, a cross-chain message, a wallet, execution, a payment — reach for the rail
first and reserve your own code for the product logic. Every entry is a dependency with a failure mode;
for each pick, note the one thing it makes you trust and the one failure mode it carries, and confirm
current names, pricing, and availability against each project's own docs before wiring — this space
moves monthly.

## The shortlist — by need

| Need | Reach for | Jayverse use / where it plugs in |
|---|---|---|
| **Price / real-world truth** | Chainlink Data Feeds, Pyth; **UMA Optimistic Oracle** for subjective resolution | Verex market resolution; DeFi rate inputs |
| **Cross-chain message** | LayerZero, **Chainlink CCIP**, Wormhole, Axelar | token-bridge transport (Phase 3) |
| **Move a stablecoin across chains** | **Circle CCTP**, xERC20 / ERC-7281 (rate limits) | bridge; the refill-rate cap lives here |
| **Account abstraction / smart wallet** | **ERC-4337** (Pimlico, Alchemy, ZeroDev, Biconomy bundlers), Safe, Coinbase Smart Wallet (passkeys); EIP-7702, ERC-7715 | AA payment agent; gasless / mandate flows |
| **Wallet onboarding** | Privy, Dynamic, Web3Auth, WalletConnect | consumer onboarding without seed phrases |
| **Execution / intents / MEV back to users** | **FastLane Atlas** (OFA/OEV), Flashbots (MEV-Share), CoW Protocol, Uniswap X | settlement / order flow; MEV returned not extracted |
| **Prediction-market primitives** | Gnosis / Polymarket **Conditional Tokens Framework (CTF)**, LMSR | Verex outcome shares & pricing |
| **Fiat on-ramp / card payments** | Stripe, Circle; **x402** for machine payments | funding, USDCx flows |
| **Indexing / reading chain data** | **The Graph**, Ponder; Alchemy / Infura RPC; Dune | app feeds, dashboards |
| **Simulate & monitor on-chain** | **Tenderly**, OpenZeppelin Defender; Foundry (tests / invariants) | auditor; invariant watching |
| **Identity & attestations** | ENS / **Basenames**, **EAS**, Sign Protocol | signed announcements; identity |
| **Restaking / DeFi primitives** | EigenLayer, Lido, Aave, Uniswap v4 hooks | DeFi study (jeETH / restaking) |
| **App & infra** | Next.js, **viem / wagmi**, Foundry; GCP Cloud Run, Docker / K8s, Prisma / Postgres | every product |
| **Agent / AI** | **Anthropic API (Claude)**, MCP | autonomous payment agent |

## The most load-bearing today

For what Jayverse is actually building now: **UMA + Chainlink** (Verex resolution), **CCIP + xERC20**
(bridge, with the refill-rate cap), **ERC-4337 + Atlas** (agent execution and MEV), and
**Tenderly + Foundry invariants** (the auditor's watch). Everything else on the list is optional until
a feature reaches for it.

## How to use this card

When a feature needs a rail, find the row, pick one, and write its failure-mode line next to the
wiring. The rail is the easy half; naming what it makes you trust is the half that keeps it a protocol
and not a hope.

---

# 한국어 — 필요별 레일 목록

## 목록 — 필요별

| 필요 | 집을 것 | Jayverse 쓰임 / 붙는 자리 |
|---|---|---|
| **가격 / 실세계 사실** | Chainlink Data Feeds, Pyth; 주관적 해소엔 **UMA Optimistic Oracle** | Verex 마켓 해소; DeFi 이율 입력 |
| **크로스체인 메시지** | LayerZero, **Chainlink CCIP**, Wormhole, Axelar | 토큰 브리지 전송(Phase 3) |
| **스테이블코인 크로스체인 이동** | **Circle CCTP**, xERC20 / ERC-7281(rate limit) | 브리지; refill-rate 상한이 여기 |
| **계정 추상화 / 스마트 월렛** | **ERC-4337**(Pimlico, Alchemy, ZeroDev, Biconomy 번들러), Safe, Coinbase Smart Wallet(패스키); EIP-7702, ERC-7715 | AA 결제 에이전트; 가스리스 / 위임 플로우 |
| **지갑 온보딩** | Privy, Dynamic, Web3Auth, WalletConnect | 시드구문 없는 소비자 온보딩 |
| **실행 / 인텐트 / MEV 사용자 환원** | **FastLane Atlas**(OFA/OEV), Flashbots(MEV-Share), CoW Protocol, Uniswap X | 정산 / 오더플로; MEV 추출 아닌 환원 |
| **예측시장 프리미티브** | Gnosis / Polymarket **Conditional Tokens Framework(CTF)**, LMSR | Verex 결과 공유 & 가격 |
| **법정화폐 온램프 / 카드 결제** | Stripe, Circle; 기계 결제엔 **x402** | 자금, USDCx 플로우 |
| **인덱싱 / 체인 데이터 읽기** | **The Graph**, Ponder; Alchemy / Infura RPC; Dune | 앱 피드, 대시보드 |
| **온체인 시뮬 & 모니터** | **Tenderly**, OpenZeppelin Defender; Foundry(테스트 / 불변식) | 감사기; 불변식 감시 |
| **신원 & attestation** | ENS / **Basenames**, **EAS**, Sign Protocol | 서명된 공지; 신원 |
| **리스테이킹 / DeFi 프리미티브** | EigenLayer, Lido, Aave, Uniswap v4 훅 | DeFi 학습(jeETH / 리스테이킹) |
| **앱 & 인프라** | Next.js, **viem / wagmi**, Foundry; GCP Cloud Run, Docker / K8s, Prisma / Postgres | 모든 제품 |
| **에이전트 / AI** | **Anthropic API(Claude)**, MCP | 자율 결제 에이전트 |

## 오늘 가장 하중을 견디는 것

Jayverse가 지금 실제로 짓는 것 기준: **UMA + Chainlink**(Verex 해소), **CCIP + xERC20**(브리지,
refill-rate 상한과 함께), **ERC-4337 + Atlas**(에이전트 실행·MEV), **Tenderly + Foundry 불변식**
(감사기의 감시). 나머지는 어떤 기능이 손 뻗기 전까진 선택입니다.

## 이 카드를 쓰는 법

기능에 레일이 필요하면, 줄을 찾아 하나 고르고, 연결 옆에 실패 모드 줄을 쓰세요. 레일은 쉬운 절반;
무엇을 신뢰하게 되는지 이름 붙이는 것이 그것을 희망이 아니라 프로토콜로 유지하는 절반입니다.
