// TIL ("Today I Learned") hub (/til) card data — see docs/features/README.md.
// Shares its card shape with the PoCs hub (lib/poc-cards.ts) — see lib/demo-cards.ts.
// Content: code demos re-implementing something jay's daily learning covered (math formula,
// algorithm, or a recommended-service integration) — not a sync of the private daily report.
// jay fills these in later; seeded here as placeholders from 2026-08-03's topics.

import type { DemoCard } from "./demo-cards";

export const TIL_CARDS: DemoCard[] = [
  {
    key: "geometric-series-dcf",
    title: "Geometric series → DCF valuation",
    titleKo: "등비급수 → DCF 밸류에이션",
    description: "Sum of a geometric series, applied to perpetuity/Gordon-formula valuation.",
    descriptionKo: "등비급수의 합을 영구채·고든 공식 밸류에이션에 적용.",
    status: "soon",
    howTo: "Math — from 2026-08-03's daily math track (Day 7/50: sequences & series).",
    howToKo: "수학 — 2026-08-03 매일의 수학 트랙 (Day 7/50: 수열·급수).",
  },
  {
    key: "amortized-potential-function",
    title: "Amortized analysis via potential functions",
    titleKo: "포텐셜 함수를 이용한 분할상환 분석",
    description: "Proving O(1) amortized cost for dynamic-array doubling with a potential function.",
    descriptionKo: "포텐셜 함수로 동적 배열 2배 증가의 분할상환 비용이 O(1)임을 증명.",
    status: "soon",
    howTo: "Algorithms — from 2026-08-03's advanced dev-knowledge track (Day 1/100).",
    howToKo: "알고리즘 — 2026-08-03 매일의 개발 지식 100 트랙 (Day 1/100).",
  },
  {
    key: "moralis-wallet-api",
    title: "Moralis — wallet snapshot via API",
    titleKo: "Moralis — API로 지갑 스냅샷 조회",
    description: "Querying balance/net-worth for an address with Moralis's Wallet API.",
    descriptionKo: "Moralis Wallet API로 특정 주소의 잔고·순자산 조회.",
    status: "soon",
    howTo: "Service — from 2026-08-03's service-discovery track (39/113: Moralis).",
    howToKo: "서비스 — 2026-08-03 서비스 탐방 트랙 (39/113: Moralis).",
  },
];
