// /live/stack(Bird View)와 /live/metaverse(Metaverse View)가 함께 읽는 표준 설명.
// 두 화면이 같은 설명을 들고 있어야 한쪽만 고쳐지는 일이 없다 (jay, 2026-11-03: "Metaverse View is a
// game version of Bird View").

export type Txt = { ko: string; en: string };

export const CAP = 5; // 위임 한도 (jUSD)
export const PRICE = 2.4; // 에이전트가 사는 데이터 피드 한 건
export const OVER = 7; // 한도를 넘는 시도

// ── 표준 설명 — 말풍선의 "표준" 메뉴가 연다 ─────────────────────────────────
// `runs` 는 거짓말을 막는 칸이다: 여기 데모에서 실제로 도는 것과 이름만 걸린 것을 같은 목록에 두되 구분한다.
export type Std = { id: string; role: Txt; detail: Txt; runs: "live" | "named" | "plan"; href?: string; label?: Txt };
export const STD: Record<string, Std> = {
  "EIP-7702": {
    id: "EIP-7702",
    role: { ko: "EOA 가 주소와 키를 그대로 둔 채 코드를 갖는다.", en: "An EOA keeps its address and key but gains code." },
    detail: {
      ko: "지갑이 권한서명 하나를 붙여 보내면 계정의 코드 자리에 0xef0100‖구현주소 가 쓰인다 — 주소도 키도 그대로인데 이제 계정이 코드를 실행한다. 화면에는 아무 흔적이 남지 않는 단계라, 따로 들여다볼 페이지를 만들어 둔 것이 7702 인스펙터다. 이곳의 다른 모든 계정 추상화 데모의 전제조건이다.",
      en: "The wallet attaches one authorization and 0xef0100‖implementation lands in the account's code slot — same address, same key, but the account now runs code. Nothing on screen shows it happened, which is exactly why the 7702 inspector exists. It is the precondition behind every other account-abstraction demo here.",
    },
    runs: "live", href: "/live/7702", label: { ko: "7702 인스펙터", en: "7702 inspector" },
  },
  "ERC-7715": {
    id: "ERC-7715",
    role: { ko: "wallet_grantPermissions — 주인이 답하는 단 하나의 팝업.", en: "wallet_grantPermissions — the single popup the owner answers." },
    detail: {
      ko: `주인이 팝업에 한 번 답한다: "최대 ${CAP} jUSD, 1시간". 그 서명이 Delegator 컨트랙트에 위임으로 저장되고, 한도 자체는 caveat enforcer 라는 별개의 컨트랙트가 들고 있다. 이 뒤로 팝업은 없다 — 권한이 곧 인가이기 때문이다. 정산 에이전트 콘솔이 실제 MetaMask 팝업으로 이 부여를 한다.`,
      en: `The owner answers one popup: "up to ${CAP} jUSD, 1 hour". That signature is stored in the delegator contract as a delegation, and the cap itself lives in a separate caveat-enforcer contract. No popup after this — the permission is the authorization. The settlement console performs this grant through the real MetaMask popup.`,
    },
    runs: "live", href: "/live/agent/console", label: { ko: "정산 에이전트 콘솔", en: "Settlement console" },
  },
  "EIP-712": {
    id: "EIP-712",
    role: { ko: "위임과 AP2 mandate 밑에 똑같이 깔린 타입 데이터 서명.", en: "The typed-data signature under both the grant and every AP2 mandate." },
    detail: {
      ko: "사람이 읽을 수 있는 구조를 서명한다. 7715 의 권한 부여도, AP2 의 mandate 도 같은 서명 방식 위에 있어서 지갑 팝업이 '무엇에' 서명하는지 보여 줄 수 있다. 흐름 안에서 돌고, 별도 데모는 없다.",
      en: "You sign a human-readable structure. Both the 7715 grant and every AP2 mandate sit on this, which is why a wallet popup can show what is being signed. It runs inside the flow; there is no separate demo.",
    },
    runs: "live",
  },
  "ERC-7710": {
    id: "ERC-7710",
    role: { ko: "스마트 컨트랙트 위임 — 행사할 때마다 caveat enforcer 가 한도를 본다.", en: "Smart-contract delegation — a caveat enforcer checks the cap on every redemption." },
    detail: {
      ko: `에이전트가 Delegator 컨트랙트에 redeemDelegations 를 부르고, caveat enforcer 가 한도를 확인한 뒤 통과시키거나 되돌린다. 에이전트의 서명이 멀쩡해도 한도를 넘으면 revert — 막는 것은 사람의 승인도 에이전트의 자제력도 아니고 컨트랙트다. 세 표준의 역할이 여기서 갈린다: 7702 가 능력을 주고, 7715 가 권한을 요청하고, 7710 이 집행한다. 콘솔의 부여→틱→상환을 진짜로 돌리려면 Sepolia 포크 anvil 과 verex API 가 이 기기에 떠 있어야 한다.`,
      en: `The agent calls redeemDelegations on the delegator contract; the caveat enforcer checks the cap and lets it through or reverts it. A perfectly valid signature still reverts past the cap — what stops it is neither a human approval nor the agent's restraint, but a contract. The three standards separate here: 7702 grants the capability, 7715 requests the permission, 7710 enforces it. Running the console's grant → tick → redeem for real needs a Sepolia-fork anvil and the verex API on this machine.`,
    },
    runs: "live", href: "/live/aa", label: { ko: "AA 데모", en: "AA demo" },
  },
  "ERC-4337": {
    id: "ERC-4337",
    role: { ko: "UserOperation · 번들러 · paymaster — 에이전트가 ETH 없이 움직인다.", en: "UserOperation, bundler, paymaster — the agent transacts holding no ETH." },
    detail: {
      ko: "호출은 UserOperation 으로 번들러에게 가고, 가스는 paymaster 가 대신 낸다 — 에이전트는 ETH 를 한 푼도 들고 있지 않다. 두 호출을 한 UserOperation 으로 묶으면 함께 성공하거나 함께 되돌아간다(원자적). AA 데모의 기둥 ②③ 이 thirdweb 번들러로 이것을 돌린다.",
      en: "The call goes to a bundler as a UserOperation and a paymaster covers the gas — the agent holds no ETH at all. Two calls bundled into one UserOperation succeed or revert together (atomic). Pillars ② and ③ of the AA demo run this through a thirdweb bundler.",
    },
    runs: "live", href: "/live/aa", label: { ko: "AA 기둥 ②③", en: "AA pillars ②③" },
  },
  "ERC-5792": {
    id: "ERC-5792",
    role: { ko: "wallet_sendCalls — 지갑 쪽 원자적 배치 API.", en: "wallet_sendCalls — the wallet-side atomic batch API." },
    detail: {
      ko: "같은 '여러 호출을 한 번에' 를 지갑 API 로 노출한 표준. 여기서는 그 일을 4337 배치로 하고 있어 이름만 걸쳐 있다.",
      en: "The same 'several calls at once', exposed as a wallet API. Here the job is done through 4337 batching, so this one is adjacent rather than used.",
    },
    runs: "named",
  },
  x402: {
    id: "x402",
    role: { ko: "HTTP 402 를 되살린 기계 대 기계 요금.", en: "HTTP 402 revived as machine-to-machine payment." },
    detail: {
      ko: "응답이 '얼마'를 돌려주고 호출자가 그 자리에서 내고 같은 요청을 다시 보낸다. 지금 이 판에서 비어 있는 칸이다 — 법정화폐 쪽(AP2 · 토스)은 테스트 결제가 실제로 돌지만 기계 대 기계 쪽은 아직 라이브가 없다. 필요한 것은 작다: 402 와 가격을 돌려주는 엔드포인트, 그 값을 내고 다시 부르는 호출자. 다음에 만들 조각.",
      en: "The response quotes a price, the caller pays inline and resends the same request. This is the empty square on the board today — the fiat side (AP2, Toss) really executes a test payment, but machine-to-machine has no live page yet. What it needs is small: an endpoint that answers 402 with a price, and a caller that pays and retries. The next piece to build.",
    },
    runs: "plan",
  },
  "ERC-8004": {
    id: "ERC-8004",
    role: { ko: "온체인 에이전트 신원·평판 — '상대가 정말 그 에이전트인가'.", en: "On-chain agent identity and reputation — 'is the counterparty really that agent'." },
    detail: {
      ko: "이 판에서 유일하게 돌지 않는 조각. 테스트넷 배포 상황을 확인하지 못해 AA 데모에서도 설명으로만 있다. 그래서 흐린 칩으로 그린다 — 돌지 않는 것을 도는 것처럼 그리면 이 페이지가 하려는 일이 통째로 무너진다.",
      en: "The one piece on this board that does not run. Its testnet deployment status is unverified, so even the AA demo keeps it as an explainer. That is why it is drawn as a dimmed chip — drawing something that does not run as if it did would undo the one thing this page is for.",
    },
    runs: "named",
  },
  AP2: {
    id: "AP2",
    role: { ko: "Intent · Cart · Payment 세 mandate 로 '무엇을 얼마에'를 고정한다. ERC 가 아니라 프로토콜.", en: "Intent, Cart and Payment mandates pin down what is bought at what price. A protocol, not an ERC." },
    detail: {
      ko: "서명된 검증가능 자격증명 세 장. Cart Mandate 가 '무엇을 얼마에' 를 고정하고, Payment Mandate 가 법정화폐 레일로 넘어간다 — Stripe Checkout 테스트 결제, 또는 원화 레일인 토스페이먼츠. 영수증이 돌아오고 저널에 한 줄이 남는다. 체인이 아는 것은 '얼마가 움직였나'까지이고 '왜 샀나'는 저널에만 있다 — 그래서 콘솔에 저널이 따로 있다.",
      en: "Three signed verifiable credentials. The Cart Mandate pins what is bought at what price; the Payment Mandate crosses to the fiat rail — a Stripe Checkout test payment, or the KRW rail, Toss Payments. A receipt comes back and one line lands in the journal. The chain knows how much moved; why it was bought exists only in the journal, which is why the console keeps one.",
    },
    runs: "live", href: "/live/ap2", label: { ko: "AP2 / 토스", en: "AP2 / Toss" },
  },
  "ERC-1271": {
    id: "ERC-1271",
    role: { ko: "isValidSignature — 컨트랙트 계정이 오프체인 서명을 증명하는 방법.", en: "isValidSignature — how a contract account proves an off-chain signature." },
    detail: {
      ko: "업그레이드된 계정(코드가 붙은 EOA)이 mandate 에 서명하는 순간 상대는 이 함수로 서명을 검증한다. 이름만 걸쳐 있다 — 여기 데모가 직접 부르지는 않는다.",
      en: "The moment an upgraded account (an EOA with code) signs a mandate, the counterparty verifies that signature through this function. Named only — no demo here calls it directly.",
    },
    runs: "named",
  },
  // ── Canton (T5) ──
  Daml: {
    id: "Daml",
    role: { ko: "Canton 의 계약 언어 — 데이터·라이선스·만료·권한이 한 계약에.", en: "Canton's contract language — data, licence, expiry and permission in one contract." },
    detail: {
      ko: "템플릿 하나가 토큰화된 지수(S&P 의 iBoxx 미국채 지수)의 모양 그대로 데이터와 라이선스와 권한을 한 계약에 담는다. T5 의 두 템플릿: 라이선스 객체로서의 Number reading, 이름 붙은 기준금리로 해소되는 verex 마켓(관리자·고정 시각·방법론 버전을 산문이 아니라 필드로).",
      en: "One template holds data, licence and permission in a single contract — the shape of a tokenized index (S&P's iBoxx U.S. Treasuries). T5's two templates: a Number reading as a licensed object, and a verex market that resolves on a named reference rate (administrator, fixing time, methodology version as fields, not prose).",
    },
    runs: "plan",
  },
  Synchronizer: {
    id: "Global Synchronizer",
    role: { ko: "메시지를 읽지 않고 순서만 정한다.", en: "Orders messages without reading them." },
    detail: {
      ko: "Canton 에는 블록 해시로 이어진 단일 체인이 없다. 각 validator 가 자기 계약만 가진 private ledger 이고, 공유 synchronizer 는 순서만 잡는다. DevNet / TestNet / MainNet 이 있고, T5 는 DevNet 까지만 간다.",
      en: "Canton has no single chain of blocks linked by hash. Each validator is a private ledger holding only its own contracts; the shared synchronizer only orders. There is DevNet / TestNet / MainNet, and T5 stops at DevNet.",
    },
    runs: "plan",
  },
  Validator: {
    id: "Validator · private ledger",
    role: { ko: "참가자 노드는 자기가 당사자인 sub-transaction 만 본다.", en: "A participant node sees only the sub-transactions it is party to." },
    detail: {
      ko: "운영자(Jayverse)가 노드 하나를 돌린다. 로컬은 Splice LocalNet, 그 다음 Global Synchronizer DevNet — 참여에는 super validator 의 sponsorship 이 필요하다(신한자산운용이 한국 첫 SV). 측정할 것은 Canton 이 파는 그것: 상대 노드가 우리 계약의 무엇을 보고 무엇을 못 보나.",
      en: "The operator (Jayverse) runs one node. Locally Splice LocalNet, then the Global Synchronizer DevNet — joining needs a super validator's sponsorship (Shinhan Asset Management is Korea's first SV). The thing to measure is what Canton sells: what the counterparty node can and cannot see of our contract.",
    },
    runs: "plan",
  },
  Guardrail: {
    id: "가드레일",
    role: { ko: "테스트넷만 · Canton Coin 구매 없음 · MainNet 없음.", en: "Test networks only · no Canton Coin purchase · no MainNet." },
    detail: {
      ko: "T5 는 후보(dark horse)다. 우리 핵심은 EVM 이고 Canton 은 Daml — 다른 언어·툴체인·운영 모델이라 #1–9 어디도 이것을 필요로 하지 않는다. 그래도 S&P·Kaiko·DTCC 같은 기관이 규제 데이터 상품에 Canton 을 고르고 있어, 라이선스 데이터 PoC 가 그 세계와 말을 섞으려면 여기 테스트가 가장 싼 배움이다.",
      en: "T5 is a candidate (dark horse). Our core is EVM and Canton is Daml — a different language, toolchain and operating model, and nothing in #1–9 needs it. Yet S&P, Kaiko and DTCC are choosing Canton for regulated data products, so if a licensed-data PoC ever talks to that world, a test here is the cheapest way to learn what it costs.",
    },
    runs: "plan",
  },
};
