// /live/stack(Bird View)와 /live/metaverse(Metaverse View)가 함께 읽는 표준 설명.
// Game View(rabbit-hole BirdGame.cs)는 같은 내용을 영어로 따로 들고 있다 — 고칠 때 함께 고친다.
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
  // ── x402 의 뒤편: 퍼실리테이터 · Kora · pay.sh (jay, 2026-11-11: 퍼실리테이터 "결국 DSRV가 하는 일", Kora, pay.sh 를
  // Bird View 에). 셋 다 여기 데모에서 아직 돌지 않는다 — 퍼실리테이터는 계획(T2, x402.org on Base Sepolia), 나머지는 이름만.
  Facilitator: {
    id: "Facilitator",
    role: { ko: "x402 결제를 검증(verify)하고 체인에 정산(settle)하는 곳 — 돈은 쥐지 않고 가스를 대신 낸다.", en: "Verifies an x402 payment and settles it on-chain — never holds the money, pays the gas." },
    detail: {
      ko: "판매자가 받은 결제 서명을 대신 확인해 주는 서비스다. /supported 는 지원하는 체인과 방식, /verify 는 서명·금액·수신자·만료·재사용 여부, /settle 은 체인 제출이다. verify 는 약속일 뿐이라 판매자는 settle 전에 일을 하고, 그래서 타임아웃을 짧게 두고 실패하면 닫는다. 돈은 구매자에서 판매자로 체인 위에서 바로 가고 퍼실리테이터를 거치지 않는다. x402.org(테스트넷 전용), Coinbase CDP, PayAI, thirdweb 같은 곳이 이 역할을 하고, 한국에서는 DSRV 가 이 자리에 선다. 우리 다음 조각(T2)은 Base Sepolia 에서 x402.org 를 쓴다 — jUSD 와 우리 devnet 은 지원하지 않기 때문이다.",
      en: "A service that checks a payment signature for the seller. /supported lists the chains and schemes, /verify checks the signature, amount, recipient, expiry and reuse, /settle submits it on-chain. Verify is only a promise, so the seller works before settle — hence strict timeouts and fail-closed. The money moves buyer → seller on-chain and never passes through the facilitator. x402.org (testnets only), Coinbase CDP, PayAI and thirdweb fill this role; in Korea DSRV stands here. Our next piece (T2) uses x402.org on Base Sepolia, because jUSD and our devnet are not supported.",
    },
    runs: "plan",
  },
  Kora: {
    id: "Kora",
    role: { ko: "솔라나에서 퍼실리테이터 뒤에 서는 서명기 — 정책을 검사하고 fee payer 로 공동 서명한다.", en: "The signer behind a facilitator on Solana — checks policy, then co-signs as fee payer." },
    detail: {
      ko: "Solana 재단이 관리하는 오픈소스 서명·수수료 대납 서비스다. 솔라나의 모든 트랜잭션에는 SOL 을 가진 fee payer 가 필요해서, USDC 는 있는데 SOL 이 0 인 에이전트 지갑은 아무것도 못 한다. 구매자는 USDC 전송에 반만 서명하고, settle 때 퍼실리테이터가 Kora 를 불러 정책(허용 프로그램, 금액 상한, 토큰 목록)을 검사한 뒤 fee payer 로 공동 서명해 제출한다. 퍼실리테이터의 대안이 아니라 그 뒤에 포개진 층이다. 여기 데모에서는 이름만 걸려 있다 — 이 판의 체인은 EVM 이다.",
      en: "An open-source signing and fee-sponsorship service maintained by the Solana Foundation. Every Solana transaction needs a fee payer holding SOL, so an agent wallet with USDC and 0 SOL can do nothing. The buyer half-signs the USDC transfer; at settle the facilitator calls Kora, which checks its policy (allowed programs, amount caps, token list) and co-signs as fee payer. It sits behind the facilitator, not beside it. Named only here — this board's chain is EVM.",
    },
    runs: "named",
  },
  "pay.sh": {
    id: "pay.sh",
    role: { ko: "원천 API 의 키를 쥐고 앞에 선 게이트웨이 — '결제가 곧 자격증명'.", en: "A gateway in front of upstream APIs that holds their keys — 'the payment is the credential'." },
    detail: {
      ko: "Solana 재단과 Google Cloud 가 내놓은 기계 결제 게이트웨이다. Gemini, BigQuery 같은 API 앞에서 원천 키를 대신 쥐고, 에이전트는 계정도 API 키도 없이 x402 결제로 요청 한 번을 연다. 흐름에서는 판매자(서비스 제공자) 자리에 서고, pay CLI 는 그 앞에서 구매자가 잡는 손잡이다. 여기 데모에서는 이름만 — 우리 /api/x402/quote 를 그런 카탈로그에 올리는 것은 다음 다음 일이다.",
      en: "A machine-payment gateway from the Solana Foundation and Google Cloud. It stands in front of APIs such as Gemini and BigQuery holding their keys, and an agent opens one request with an x402 payment — no account, no API key. In the flow it sits in the seller's (service provider's) seat; the pay CLI is the buyer's handle on it. Named only here — listing our /api/x402/quote in such a catalogue comes after the next piece.",
    },
    runs: "named",
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
  // ── AiTM 중계 피싱 (jay, 2026-11-09: 모닝 리포트 11/8 Tech Note "진짜 사이트를 빌려 쓰는 피싱") ──
  // 이 시나리오에서 rabbit 이 직접 돌리는 것은 없다. 그래서 공격 쪽은 "named", 방어 쪽은 "plan"(잴 것)이다.
  AiTM: {
    id: "AiTM",
    role: { ko: "중간자 피싱 — 진짜 사이트를 리버스 프록시로 그대로 보여 주고, 입력만 중간에서 가로챈다.", en: "Adversary-in-the-middle phishing — the real site, shown through a reverse proxy, with the input taken in the middle." },
    detail: {
      ko: "공격자 도메인이 피해 사이트의 리버스 프록시로 동작한다: 사용자의 요청을 진짜 서버로 전달하고 응답(화면·가격·장바구니·세션 쿠키)을 그대로 돌려준다. 그래서 화면은 100% 진짜다. 결제 단계에서만 양식을 바꾸거나 스크립트를 주입해 카드정보·OTP 를 복사하고, 같은 시각 다른 거래의 3-D Secure 에 넣는다. 피해 사이트는 해킹당하지 않았으므로 로그에는 '정상 사용자 + 낯선 IP(프록시)'만 남는다. Evilginx 류 도구가 2017년부터 있다(일반 지식). 출처: 모닝 리포트 11/8 Tech Note — InfoHawk 보고서 원문 미열람, 운영자 실시간 제어는 InfoHawk 추정.",
      en: "The attacker's domain acts as a reverse proxy for the real site: it forwards the user's requests to the real server and returns the responses (pages, prices, cart, session cookie) unchanged, so the screen is 100% real. Only at the payment step does it swap the form or inject a script to copy the card data and OTP, then push them into another transaction's 3-D Secure at the same moment. The real site was never hacked, so its logs show only 'a normal user + an unfamiliar IP (the proxy)'. Evilginx-style tools have existed since 2017 (general knowledge). Source: the 11/8 morning-report Tech Note — the InfoHawk report itself not opened; the live-operator detail is InfoHawk's estimate.",
    },
    runs: "named",
  },
  "3DS": {
    id: "3-D Secure",
    role: { ko: "카드 결제의 2차 인증 — '누가'는 확인하지만 '어느 거래'에 답하는지는 사용자가 볼 수 없다.", en: "The second factor for card payments — it checks who, but the user cannot see which transaction they are answering." },
    detail: {
      ko: "OTP 나 앱 승인은 '지금 이 사람이 맞다'를 증명한다. 그런데 중계되는 순간, 사용자는 자기 거래에 답한다고 믿으면서 공격자의 다른 거래에 답한다. 2차 인증이 '내가 하는 거래'를 보증하지 않게 되는 지점이 여기다.",
      en: "An OTP or app approval proves 'this is the right person, now'. Once it is relayed, the user believes they are answering their own transaction while answering the attacker's. This is where a second factor stops guaranteeing 'the transaction I am making'.",
    },
    runs: "named",
  },
  WebAuthn: {
    id: "WebAuthn · 패스키",
    role: { ko: "서명에 origin 이 묶인다 — 프록시 도메인에서는 진짜 사이트용 서명이 나오지 않는다. AiTM 에 대한 유일한 구조적 방어.", en: "The signature is bound to the origin — a proxy domain cannot get a signature for the real site. The only structural defence against AiTM." },
    detail: {
      ko: "브라우저는 패스키 서명에 지금 열린 페이지의 origin 을 넣고, 키는 등록한 사이트(rpId)에만 쓰인다. 사용자가 가짜 도메인에 있으면 브라우저가 진짜 사이트의 키를 꺼내지 않거나, 꺼내도 origin 이 달라 서버 검증이 실패한다. 사용자가 속아도 막힌다 — '가짜를 알아보기'가 아니라 구조로 막는 방법이다. 잴 것: Verex 정산·출금 승인 경로를 WebAuthn 으로.",
      en: "The browser puts the current page's origin into the passkey signature, and the key works only for the site it was registered to (rpId). On a fake domain the browser either will not use the real site's key, or the origin differs and the server's check fails. It holds even when the user is fooled — a structural block, not 'spot the fake'. To measure: Verex's settlement and withdrawal approvals on WebAuthn.",
    },
    runs: "plan",
  },
  CSP: {
    id: "CSP · Origin",
    role: { ko: "신호 ① — 양식이 내 도메인이 아닌 곳에서 왔다.", en: "Signal ① — the form came from somewhere that is not my domain." },
    detail: {
      ko: "CSP form-action 'self' 로 양식이 다른 곳으로 가지 못하게 하고, 서버는 POST 의 Origin/Referer 가 내 도메인인지 본다. 다만 리버스 프록시는 헤더를 고쳐 쓸 수 있어서 이것만으로는 못 막는다 — 신호일 뿐이다. 잴 것: rabbit 공개 폼에 CSP form-action 한 줄.",
      en: "CSP form-action 'self' keeps forms from posting elsewhere, and the server checks that a POST's Origin/Referer is its own domain. A reverse proxy can rewrite headers, though, so this alone does not stop it — it is a signal. To measure: one CSP form-action line on rabbit's public forms.",
    },
    runs: "plan",
  },
  Session: {
    id: "세션 · IP",
    role: { ko: "신호 ②③ — TLS 세션과 앱 세션이 맞지 않고, 같은 쿠키가 짧은 시간에 두 IP 에서 보인다.", en: "Signals ②③ — the TLS session and the app session do not match, and the same cookie shows up from two IPs within minutes." },
    detail: {
      ko: "프록시는 사용자와 TLS 를 하나, 진짜 서버와 TLS 를 하나 따로 맺는다. 토큰 바인딩처럼 세션을 TLS 에 묶으면 어긋남이 드러난다. 또 훔친 쿠키를 공격자가 자기 쪽에서 다시 쓰면, 같은 세션 쿠키가 프록시 IP 와 다른 IP 에서 짧은 간격으로 보인다.",
      en: "The proxy holds one TLS session with the user and a separate one with the real server; binding the session to TLS (token binding) exposes the mismatch. And when the attacker reuses the stolen cookie from their own side, the same session cookie appears from the proxy's IP and another IP within a short gap.",
    },
    runs: "plan",
  },
  SRI: {
    id: "SRI",
    role: { ko: "신호 ④ — 결제 양식의 스크립트가 내가 배포한 것과 다르다.", en: "Signal ④ — the payment form's script is not the one I shipped." },
    detail: {
      ko: "Subresource Integrity 는 스크립트 태그에 해시를 붙여, 내용이 다르면 브라우저가 실행하지 않게 한다. 프록시가 응답에 스크립트를 주입하거나 바꾸면 해시가 맞지 않는다. 프록시가 HTML 의 해시까지 고쳐 쓰면 못 막으니, 서버 쪽 무결성 보고와 같이 쓴다.",
      en: "Subresource Integrity puts a hash on a script tag so the browser refuses to run changed content. A proxy that injects or swaps a script breaks the hash. A proxy that also rewrites the hash in the HTML gets past it, so pair it with server-side integrity reports.",
    },
    runs: "plan",
  },
};
