// PoCs hub (/etc) card data — see docs/tasks/current-plan.md §7.
// Shares its card shape with the TIL hub (lib/til-cards.ts) — see lib/demo-cards.ts.

import type { DemoCard } from "./demo-cards";

export const POC_CARDS: DemoCard[] = [
  {
    key: "hyperliquid",
    title: "Hyperliquid Trading",
    titleKo: "하이퍼리퀴드 트레이딩",
    description: "Live L2 orderbook + testnet perp/spot trading via MetaMask.",
    descriptionKo: "실시간 L2 오더북 + MetaMask를 통한 테스트넷 퍼프/스팟 트레이딩.",
    status: "live",
    href: "/market",
    howTo:
      "Connect MetaMask → switch to the Hyperliquid testnet → claim mock USDC at the HL testnet faucet → place a small limit order.",
    howToKo:
      "MetaMask 연결 → 하이퍼리퀴드 테스트넷으로 전환 → HL 테스트넷 faucet에서 모의 USDC 수령 → 소액 지정가 주문.",
  },
  {
    key: "pbs",
    title: "PBS (searcher / relay)",
    titleKo: "PBS (서처 / 릴레이)",
    description: "Submit a Sepolia bundle as a searcher, watch mainnet relay inclusion live.",
    descriptionKo: "서처로 Sepolia 번들을 제출하고, 메인넷 릴레이 포함 여부를 실시간으로 확인.",
    status: "live",
    href: "/xyz",
    howTo: "Submit a bundle via the searcher form (Sepolia) → watch the relay dashboard for inclusion.",
    howToKo: "서처 폼으로 번들 제출(Sepolia) → 릴레이 대시보드에서 포함 여부 확인.",
  },
  {
    key: "ap2",
    title: "AP2 — Stripe settlement",
    titleKo: "AP2 — Stripe 정산",
    description: "Agent buys data, settles via Stripe Checkout — an educational fiat-rail example.",
    descriptionKo: "에이전트가 데이터를 사고 Stripe Checkout으로 정산하는 교육용 법정화폐 예시.",
    status: "soon",
    href: "/ap2",
    howTo: "Click \"buy\" → Stripe test Checkout → pay with Stripe's test card 4242 4242 4242 4242.",
    howToKo: "\"구매\" 클릭 → Stripe 테스트 Checkout → Stripe 테스트 카드(4242 4242 4242 4242)로 결제.",
  },
  {
    key: "aa",
    title: "AA — delegatable accounts & session keys",
    titleKo: "AA — 위임형 계정 & 세션 키",
    description: "ERC-7702/7715 delegation + a 4-pillar Agentic AA demo (paymaster, atomic tx, KYA).",
    descriptionKo: "ERC-7702/7715 위임 + 4대 요소 Agentic AA 데모 (paymaster, 원자적 트랜잭션, KYA).",
    status: "soon",
    href: "/etc/aa",
    howTo:
      "Connect MetaMask on Sepolia → grant a scoped session key → watch it spend within the granted limit, no re-sign popup.",
    howToKo: "Sepolia에서 MetaMask 연결 → 범위 제한 세션 키 부여 → 재서명 팝업 없이 한도 내에서 지출되는 것을 확인.",
  },
  {
    key: "solana",
    title: "Solana",
    titleKo: "솔라나",
    description: "EVM-vs-Solana study + a sample Anchor program on devnet.",
    descriptionKo: "EVM-vs-솔라나 비교 연구 + devnet 위 샘플 Anchor 프로그램.",
    status: "soon",
    howTo: "Not yet scoped.",
    howToKo: "아직 범위 미정.",
  },
  {
    key: "zapier-mcp",
    title: "Zapier MCP",
    titleKo: "Zapier MCP",
    description: "Agent triggers real SaaS actions (Gmail/Notion/Slack) via Zapier's MCP tools.",
    descriptionKo: "에이전트가 Zapier MCP 툴로 실제 SaaS 액션(Gmail/Notion/Slack)을 실행.",
    status: "soon",
    howTo: "Not yet scoped.",
    howToKo: "아직 범위 미정.",
  },
  {
    key: "erc-8141",
    title: "ERC-8141",
    titleKo: "ERC-8141",
    description: "Native account-abstraction explainer — Ethereum's protocol-level Frame Transactions.",
    descriptionKo: "네이티브 계정 추상화 설명 페이지 — 이더리움 프로토콜 레벨 Frame Transactions.",
    status: "soon",
    howTo: "Read-only explainer — no wallet needed.",
    howToKo: "읽기 전용 설명 페이지 — 지갑 불필요.",
  },
  {
    key: "toss-payments",
    title: "Toss Payments",
    titleKo: "토스페이먼츠",
    description: "KRW settlement example via Toss Payments — the domestic counterpart to AP2/Stripe.",
    descriptionKo: "토스페이먼츠를 통한 KRW 정산 예시 — AP2/Stripe의 국내 버전.",
    status: "soon",
    howTo: "Click \"buy\" → Toss test Checkout.",
    howToKo: "\"구매\" 클릭 → 토스 테스트 결제.",
  },
];
