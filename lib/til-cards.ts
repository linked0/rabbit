// TIL ("Today I Learned") hub (/til) card data — see docs/features/README.md.
// Shares its card shape with the PoCs hub (lib/poc-cards.ts) — see lib/demo-cards.ts.
// Content: code demos re-implementing something jay's daily learning covered (math formula,
// algorithm, or a recommended-service integration) — not a sync of the private daily report.
// jay fills these in later; seeded here as placeholders from 2026-08-03's topics.

import type { DemoCard } from "./demo-cards";

export const TIL_CARDS: DemoCard[] = [
  {
    // verex의 Phase A 마켓메이킹 설계를 두고 나눈 대화에서 나온 주제 (2026-08-06).
    // 여기 있는 건 개념 카드다 — verex의 작업 항목이 아니라, 그 논의에서 배운 공식과 그 공식이
    // 왜 그 단계에서만 말이 되는지에 대한 것. verex 쪽 결정은 verex 저장소에 남는다.
    key: "lmsr-hybrid-amm",
    title: "LMSR & the hybrid AMM — buying the first liquidity",
    titleKo: "LMSR과 하이브리드 AMM — 첫 유동성을 돈으로 사기",
    description:
      "A cost function whose worst-case loss is a number you can put in a budget: C(q) = b·ln(Σe^(qᵢ/b)).",
    descriptionKo:
      "최악의 손실이 예산 항목에 적을 수 있는 숫자인 비용 함수: C(q) = b·ln(Σe^(qᵢ/b)).",
    // 코드 데모가 아니라 정독 노트라 status는 live — /poc/dvt 와 같은 성격의 페이지다.
    status: "live",
    href: "/til/lmsr-hybrid-amm",
    date: "2026-08-06",
    howTo: "Read-only — no wallet, nothing to run. Market microstructure, from the 2026-08-06 discussion of verex's Phase-A market making.",
    howToKo: "읽기 전용 — 지갑도, 돌릴 것도 없습니다. 시장 미시구조, 2026-08-06 verex Phase A 마켓메이킹 논의에서.",
    purpose:
      "A new venue faces a loop it cannot argue its way out of: empty book → no price → no traders → no volume → no reason for a market maker to show up → empty book. You cannot recruit makers to an empty venue, so the only exit is to buy the first liquidity yourself. LMSR is the cheapest known way to do that with a bound you know in advance — worst-case subsidy is b·ln(n), a maximum rather than an estimate. The genuinely interesting part is the counter-evidence: Polymarket ran an AMM and retired it once real makers arrived. That is not a strike against the design, it is the design's expiry date, and knowing which side of that date you are on is the whole skill.",
    purposeKo:
      "신규 거래소는 논리로 빠져나올 수 없는 루프에 갇힙니다: 빈 호가창 → 가격 없음 → 트레이더 없음 → 거래량 없음 → 마켓메이커가 올 이유 없음 → 빈 호가창. 빈 거래소에 메이커를 데려올 수는 없으니, 유일한 출구는 첫 유동성을 스스로 사는 것입니다. LMSR은 그것을 미리 아는 상한으로 해내는 가장 저렴한 알려진 방법입니다 — 최악의 보조금은 b·ln(n), 추정치가 아니라 최댓값입니다. 진짜 흥미로운 건 반대 증거입니다: Polymarket은 AMM을 운영했고 진짜 메이커들이 들어오자 폐기했습니다. 이건 설계의 흠이 아니라 설계의 유효기간이고, 자기가 그 날짜의 어느 쪽에 있는지 아는 것이 기술의 전부입니다.",
    howItWorks:
      "The page walks the argument in two halves. First, who sets a spread and who pays it: a spread is set because of informed traders and paid by uninformed ones, both facts living in the same number. Raise the informed share and the surviving spread widens — 5% needs 2¢, 15% needs 8¢ — until at some point every spread wide enough to survive is too wide for anyone to pay, and the rational maker stops quoting. A market with no quotes at all is not a broken market; it is a correctly priced one. Second, the design’s expiry date: four reasons Polymarket does not run a subsidized ladder — they already have real makers, the subsidy scales with listings, an LMSR has no view and gets picked off on news, and quoting both sides makes the operator a principal rather than a venue. Every one of those is a scale objection, and none of them binds a venue with no volume yet. What makes adopting it safe rather than merely justified is that the ladder is ordinary limit orders in the same book, so removing it is just stopping posting. Still planned: an interactive panel making the formula tangible — a slider over the outstanding-shares vector q, prices pᵢ = e^(qᵢ/b) / Σe^(qⱼ/b) always summing to 1, and the running worst-case loss creeping toward its b·ln(n) ceiling but never past it.",
    howItWorksKo:
      "페이지는 논증을 두 덩어리로 나눠 짚습니다. 첫째, 스프레드를 누가 정하고 누가 지불하는가: 스프레드는 정보 거래자 때문에 설정되고 무지한 거래자에 의해 지불되며, 두 사실이 같은 숫자 안에 함께 삽니다. 정보 비율을 올리면 그것을 견디는 스프레드가 넓어지고 — 5%면 2센트, 15%면 8센트 — 어느 지점부터는 견딜 만큼 넓은 스프레드가 아무도 지불하지 않을 만큼 넓어져, 합리적인 메이커는 호가를 접습니다. 호가가 아예 없는 시장은 고장난 시장이 아니라 올바르게 가격이 매겨진 시장입니다. 둘째, 설계의 유효기간: Polymarket이 보조금 사다리를 쓰지 않는 네 가지 이유 — 이미 진짜 메이커가 있고, 보조금은 상장 수에 비례하며, LMSR은 견해가 없어 뉴스에 털리고, 양방향 호가는 운영자를 거래장소가 아닌 본인(principal)으로 만듭니다. 전부 규모에 관한 반론이고, 거래량이 없는 거래소에는 하나도 구속력이 없습니다. 채택을 단지 정당한 수준이 아니라 안전하게 만드는 건, 사다리가 같은 오더북 안의 평범한 지정가 주문뿐이라 제거가 그저 게시를 멈추는 일이라는 점입니다. 아직 계획 단계: 공식을 만질 수 있게 하는 인터랙티브 패널 — 미결제 주식 벡터 q 슬라이더, 항상 합이 1이 되는 가격 pᵢ = e^(qᵢ/b) / Σe^(qⱼ/b), 그리고 b·ln(n) 천장으로 다가가되 결코 넘지 못하는 누적 최악 손실.",
    diagrams: [
      {
        title: "The cold-start loop, and the one way out",
        titleKo: "콜드 스타트 루프, 그리고 유일한 출구",
        src: `flowchart LR
    E["Empty book"] --> NP["No price"]
    NP --> NT["No traders"]
    NT --> NV["No volume"]
    NV --> NM["No reason for<br/>a maker to show up"]
    NM --> E
    L["LMSR ladder<br/>subsidy capped at b·ln(n)"] -.->|"quotes both sides<br/>until real makers arrive"| E`,
      },
      {
        title: "Set by the informed, paid by the uninformed — until neither works",
        titleKo: "정보가 정하고 무지가 지불한다 — 둘 다 안 되는 지점까지",
        src: `flowchart TB
    I["Informed traders"] -->|"set the spread<br/>this is the risk being priced"| S["Spread"]
    U["Uninformed flow"] -->|"pays the spread<br/>this is what funds the maker"| S
    S --> Q{"informed share"}
    Q -->|"5% — 2¢ works"| OK["Maker keeps quoting"]
    Q -->|"15% — 8¢ works"| OK
    Q -->|"40% — no spread works"| X["Maker stops quoting<br/>no quotes is the correct price"]`,
      },
    ],
  },
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
