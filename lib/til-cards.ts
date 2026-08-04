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
    purpose:
      "Connects a pure-math result (the closed-form sum of a geometric series) to something used directly in finance — the Gordon Growth Model for valuing a perpetuity, which underpins terminal-value calculations in discounted cash flow (DCF) analysis.",
    purposeKo:
      "순수 수학 결과(등비급수 합의 닫힌 형태 공식)를 실제 금융에서 바로 쓰이는 것과 연결합니다 — 영구채 가치를 구하는 고든 성장 모형은 DCF(현금흐름할인법) 분석의 잔존가치(terminal value) 계산의 기반입니다.",
    howItWorks:
      "Planned: a small derivation-to-code page showing the geometric series sum formula S = a / (1 − r) for |r| < 1, then substituting cash-flow growth into it to derive the Gordon Growth perpetuity formula, with an interactive calculator comparing the closed-form result against a brute-force sum of many discounted future cash flows — to visually confirm the two converge. Not yet built.",
    howItWorksKo:
      "계획: |r| < 1일 때 등비급수 합 공식 S = a / (1 − r)을 보여주는 작은 유도 페이지를 만들고, 여기에 현금흐름 성장률을 대입해 고든 성장 영구채 공식을 유도합니다. 닫힌 형태 공식의 결과와, 수십 년치 할인된 미래 현금흐름을 직접 합산한 결과를 비교하는 인터랙티브 계산기로 두 값이 실제로 수렴함을 시각적으로 확인시킵니다. 아직 미구현.",
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
    purpose:
      "A core algorithms-interview topic: proving that an operation with occasional expensive worst cases (like a dynamic array's resize-and-copy) is still O(1) on average over a sequence of operations, using the potential-function accounting method rather than a hand-wavy argument.",
    purposeKo:
      "알고리즘 면접의 핵심 주제 중 하나입니다: 동적 배열의 resize-and-copy처럼 가끔 비싼 최악의 경우가 있는 연산이라도, 일련의 연산 전체로 보면 평균 O(1)임을 대충 넘어가는 논증이 아니라 포텐셜 함수 회계 기법으로 엄밀하게 증명합니다.",
    howItWorks:
      "Planned: an interactive dynamic array (a growable vector) where each push is logged with its real cost, alongside a running potential function Φ that tracks \"banked\" cost from cheap operations — demonstrating that amortized cost = real cost + ΔΦ stays bounded even across a resize. Not yet built.",
    howItWorksKo:
      "계획: 각 push 연산의 실제 비용을 기록하는 인터랙티브 동적 배열(확장 가능한 벡터)을 만들고, 저렴한 연산에서 \"적립된\" 비용을 추적하는 포텐셜 함수 Φ를 함께 보여줍니다 — 분할상환 비용(= 실제 비용 + ΔΦ)이 resize가 일어나는 순간에도 항상 일정 범위 안에 머무름을 증명합니다. 아직 미구현.",
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
    purpose:
      "A quick evaluation of a common build-vs-buy tradeoff in crypto tooling — instead of indexing chain data yourself (event logs, balance changes) to answer \"what does this wallet hold,\" a hosted indexing API like Moralis answers it in one call.",
    purposeKo:
      "크립토 도구에서 흔히 마주치는 build-vs-buy 판단을 빠르게 검증합니다 — \"이 지갑이 뭘 들고 있는가\"에 답하려고 이벤트 로그·잔고 변화를 직접 인덱싱하는 대신, Moralis 같은 호스팅 인덱싱 API가 호출 한 번으로 답을 줍니다.",
    howItWorks:
      "Planned: a small server route calling Moralis's Wallet API (net-worth and token-balance endpoints) with a server-held API key, rendering a simple portfolio snapshot for any address a visitor enters — read-only, no wallet connection needed. Not yet built.",
    howItWorksKo:
      "계획: 서버 라우트가 서버에 보관된 API 키로 Moralis Wallet API(순자산·토큰 잔고 엔드포인트)를 호출해, 방문자가 입력한 임의 주소에 대한 간단한 포트폴리오 스냅샷을 보여줍니다 — 읽기 전용이며 지갑 연결이 필요 없습니다. 아직 미구현.",
  },
];
