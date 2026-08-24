// PoCs hub (/poc) card data — see docs/tasks/current-plan.md §7.
// Shares its card shape with the TIL hub (lib/til-cards.ts) — see lib/demo-cards.ts.

import type { DemoCard } from "./demo-cards";

// 대표로 올릴 PoC 카드 한 장 — 홈의 "대표 작업" 섹션과 /poc 상단이 같이 본다 (2026-08-06, jay).
// 자율 결제 에이전트(/poc/agent)가 실제로 돌기 시작하면 "agent"로 바꾼다. 두 화면이 이 상수
// 하나를 보고, 제목·설명도 카드에서 직접 읽으므로 교체는 이 줄 하나로 끝난다.
export const FEATURED_POC_KEY = "aa";

export const POC_CARDS: DemoCard[] = [
  {
    key: "hyperliquid",
    title: "Hyperliquid Trading",
    titleKo: "하이퍼리퀴드 트레이딩",
    description: "Live L2 orderbook + testnet perp/spot trading via MetaMask.",
    descriptionKo: "실시간 L2 오더북 + MetaMask를 통한 테스트넷 퍼프/스팟 트레이딩.",
    status: "live",
    href: "/market",
    date: "2026-07-07", // Hyperliquid 오더북/거래가 실제로 붙은 날 (Market 분리는 06-30)
    howTo:
      "Connect MetaMask → switch to the Hyperliquid testnet → claim mock USDC at the HL testnet faucet → place a small limit order.",
    howToKo:
      "MetaMask 연결 → 하이퍼리퀴드 테스트넷으로 전환 → HL 테스트넷 faucet에서 모의 USDC 수령 → 소액 지정가 주문.",
    purpose:
      "Trading against a real perpetual-futures DEX orderbook, including Hyperliquid's unconventional agent-wallet delegated-signing model — not a toy simulation, but live interaction with a production exchange's signing protocol on testnet.",
    purposeKo:
      "실제 퍼페추얼 선물 DEX 오더북을 상대로 한 거래 — 특히 Hyperliquid의 독특한 agent-wallet 위임 서명 모델까지 포함합니다. 장난감 시뮬레이션이 아니라, 테스트넷 위에서 실제 운영 중인 거래소의 서명 프로토콜과 직접 상호작용합니다.",
    howItWorks:
      "The public orderbook (/api/orderbook) proxies Hyperliquid's mainnet /info REST endpoint server-side, polled every 5s. To trade, your MetaMask wallet signs one EIP-712 approveAgent message authorizing a locally-generated key (stored only in localStorage) as a trading \"agent\" — every order/cancel/leverage change afterward is signed by that agent key via the @nktkas/hyperliquid SDK, with no further wallet popups. The agent can trade but never withdraw funds. All trading runs on Hyperliquid's testnet with mock USDC; only the passive price display uses mainnet data.",
    howItWorksKo:
      "공개 오더북(/api/orderbook)은 Hyperliquid 메인넷 /info REST 엔드포인트를 서버에서 프록시하며 5초마다 폴링합니다. 거래를 위해서는 MetaMask 지갑이 EIP-712 approveAgent 메시지에 한 번 서명해, 로컬에서 생성된 키(localStorage에만 저장)를 거래용 \"agent\"로 승인합니다 — 이후의 모든 주문/취소/레버리지 변경은 이 agent 키가 @nktkas/hyperliquid SDK로 서명하며, 추가 지갑 팝업이 없습니다. 이 agent는 거래는 가능하지만 자금 출금은 불가능합니다. 모든 거래는 모의 USDC로 Hyperliquid 테스트넷에서 이루어지고, 시세 표시만 메인넷 데이터를 씁니다.",
  },
  {
    key: "pbs",
    title: "PBS (searcher / relay)",
    titleKo: "PBS (서처 / 릴레이)",
    description: "Submit a Sepolia bundle as a searcher, watch mainnet relay inclusion live.",
    descriptionKo: "서처로 Sepolia 번들을 제출하고, 메인넷 릴레이 포함 여부를 실시간으로 확인.",
    status: "live",
    href: "/xyz",
    date: "2026-07-01", // PBS 서처/릴레이 대시보드가 올라간 날
    howTo: "Submit a bundle via the searcher form (Sepolia) → watch the relay dashboard for inclusion.",
    howToKo: "서처 폼으로 번들 제출(Sepolia) → 릴레이 대시보드에서 포함 여부 확인.",
    purpose:
      "Both sides of Ethereum's Proposer-Builder Separation (PBS) market: submitting a MEV-style bundle as a searcher, and observing real mev-boost relay auction data — without needing to run a validator or block builder.",
    purposeKo:
      "이더리움 PBS(Proposer-Builder Separation) 시장의 양쪽 측면 — 서처로서 MEV 스타일 번들을 제출하는 것과, 실제 mev-boost 릴레이 경매 데이터를 관찰하는 것 — 을 검증인이나 블록 빌더를 직접 운영하지 않고도 보여줍니다.",
    howItWorks:
      "The searcher path signs an EIP-1559 transaction server-side with an env-held key, builds Flashbots' X-Flashbots-Signature auth header by hand (no SDK) using a throwaway reputation signer, simulates it via eth_callBundle to catch reverts before submission, then fires eth_sendBundle in parallel across multiple block-builder relays for inclusion coverage. A separate poller checks the resulting transaction receipt to detect whether the bundle actually landed. The observer side fans out parallel server-side requests to four public mainnet relays' Data APIs, deduplicates delivered blocks by hash, and aggregates builder market share and bid values — refreshed every 20s.",
    howItWorksKo:
      "서처 경로는 서버에 보관된 키로 EIP-1559 트랜잭션을 서명하고, SDK 없이 직접 Flashbots의 X-Flashbots-Signature 인증 헤더를(일회용 평판 서명자로) 구성합니다. 제출 전에 eth_callBundle로 시뮬레이션해 revert를 먼저 걸러내고, 포함률을 높이기 위해 여러 블록 빌더 릴레이에 eth_sendBundle을 동시에 전송합니다. 별도 폴러가 트랜잭션 영수증을 확인해 번들이 실제로 포함됐는지 판단합니다. 관찰자 경로는 공개 메인넷 릴레이 4곳의 Data API에 서버에서 동시 요청을 보내고, block_hash로 중복을 제거한 뒤 빌더 점유율과 입찰가 분포를 집계해 20초마다 갱신합니다.",
  },
  {
    key: "ap2",
    title: "AP2 — Stripe settlement",
    titleKo: "AP2 — Stripe 정산",
    description: "Agent buys data, settles via Stripe Checkout — an educational fiat-rail example.",
    descriptionKo: "에이전트가 데이터를 사고 Stripe Checkout으로 정산하는 교육용 법정화폐 예시.",
    status: "live",
    href: "/poc/ap2",
    date: "2026-08-04", // Stripe Checkout 연동일 ("곧 공개" 스텁은 06-29부터 있었음)
    howTo: "Click \"buy\" → Stripe test Checkout → pay with Stripe's test card 4242 4242 4242 4242.",
    howToKo: "\"구매\" 클릭 → Stripe 테스트 Checkout → Stripe 테스트 카드(4242 4242 4242 4242)로 결제.",
    purpose:
      "A minimal example of the \"agentic payments\" pattern — an autonomous agent purchasing something and settling via a standard fiat payment rail — using Stripe's hosted Checkout as the settlement layer.",
    purposeKo:
      "\"에이전틱 결제\" 패턴의 최소 예시 — 자율 에이전트가 무언가를 구매하고 표준 법정화폐 결제 레일로 정산하는 흐름을, Stripe의 호스팅 Checkout을 정산 계층으로 삼아 보여줍니다.",
    howItWorks:
      "A plain HTML form posts to a server route that creates a Stripe Checkout Session via the Stripe SDK using a server-only secret key, then redirects to Stripe's hosted payment page. On return, the same server-rendered page independently re-verifies the session's payment_status against Stripe's API before releasing the purchased content — it never trusts the client-side redirect alone, closing the obvious \"skip payment, hit the success URL directly\" attack.",
    howItWorksKo:
      "일반 HTML 폼이 서버 라우트로 POST 되면, 서버 전용 secret key로 Stripe SDK를 통해 Checkout Session을 생성한 뒤 Stripe의 호스팅 결제 페이지로 리다이렉트합니다. 결제 후 돌아오면 같은 서버 컴포넌트가 Stripe API로 세션의 payment_status를 다시 독립적으로 검증한 뒤에만 구매 콘텐츠를 공개합니다 — 클라이언트 리다이렉트만 믿지 않기 때문에 \"결제 건너뛰고 success URL 직접 호출\" 같은 공격을 막습니다.",
    diagrams: [
      {
        title: "Checkout, then server-side re-verification",
        titleKo: "결제 후 서버에서 재검증",
        src: `sequenceDiagram
    participant U as Browser (visitor)
    participant S as rabbit server
    participant ST as Stripe

    U->>S: POST /api/ap2/checkout (form submit)
    S->>ST: checkout.sessions.create() [secret key]
    ST-->>S: session { url, id }
    S-->>U: 303 redirect
    U->>ST: pay (hosted Checkout page)
    ST-->>U: redirect to /poc/ap2?session_id=...
    U->>S: GET /poc/ap2?session_id=...
    S->>ST: checkout.sessions.retrieve(session_id)
    ST-->>S: payment_status: "paid"
    S-->>U: release purchased content`,
      },
    ],
  },
  {
    key: "erc-7702",
    title: "EIP-7702 — smart account, same address",
    titleKo: "EIP-7702 — 주소 그대로 스마트 계정",
    description: "Inspect an account's delegation designator live, plus what the spec is used for.",
    descriptionKo: "계정의 위임 지정자를 직접 확인해 보고, 이 스펙의 활용 사례를 살펴봅니다.",
    status: "live",
    href: "/poc/7702",
    date: "2026-08-05",
    howTo:
      "Paste any Sepolia address (or use your own wallet) → Inspect. Read-only: no gas, no signature, no wallet required. For the clearest result, inspect your address before and after granting a session key on the AA demo.",
    howToKo:
      "Sepolia 주소를 아무거나 붙여넣거나(또는 본인 지갑 사용) → 확인. 읽기 전용이라 가스도 서명도 지갑도 필요 없습니다. AA 데모에서 세션 키 권한을 부여하기 전후로 본인 주소를 확인하면 차이가 가장 뚜렷합니다.",
    purpose:
      "EIP-7702 is the precondition behind every other account-abstraction demo here, but it is invisible: the wallet performs it once, silently, and nothing on screen shows it happened. This page makes that invisible step observable — and separates the three standards people routinely conflate (7702 grants the capability, 7715 requests permission, 7710 enforces it).",
    purposeKo:
      "EIP-7702는 이곳의 다른 모든 계정 추상화 데모의 전제조건이지만 눈에 보이지 않습니다 — 지갑이 한 번 조용히 처리할 뿐, 화면에는 아무 흔적도 남지 않습니다. 이 페이지는 그 보이지 않는 단계를 관찰 가능하게 만들고, 사람들이 흔히 뒤섞는 세 표준을 분리합니다(7702는 능력을 부여하고, 7715는 권한을 요청하고, 7710은 그것을 강제합니다).",
    howItWorks:
      "An EIP-7702 authorization writes a 23-byte delegation designator into the account's code slot: the 3-byte marker 0xef0100 followed by a 20-byte implementation address. The account keeps its address, balance, nonce, and history — only its code slot changes, and pointing it back at the zero address undoes it. The inspector calls eth_getCode against a public Sepolia RPC and branches on what it finds: empty means a plain EOA that can sign but not execute; a body starting with 0xef0100 means a delegated account, and the remaining 20 bytes are decoded and linked as the implementation; anything else is an ordinary deployed contract, reported with its bytecode length. Because eth_getCode is a read, the whole demo needs no wallet, no signature, and no gas — any address can be inspected, including ones that belong to someone else.",
    howItWorksKo:
      "EIP-7702 인가는 계정의 코드 슬롯에 23바이트짜리 위임 지정자를 씁니다 — 3바이트 마커 0xef0100 뒤에 20바이트 구현체 주소가 붙습니다. 계정의 주소·잔액·nonce·이력은 그대로이고 코드 슬롯만 바뀌며, 0 주소를 가리키게 하면 되돌릴 수 있습니다. 인스펙터는 공개 Sepolia RPC로 eth_getCode를 호출하고 결과에 따라 갈라집니다: 비어 있으면 서명은 하지만 실행은 못 하는 평범한 EOA, 0xef0100으로 시작하면 위임된 계정이며 나머지 20바이트를 구현체 주소로 디코딩해 링크합니다. 그 외에는 일반 배포 컨트랙트로 보고 바이트코드 길이를 함께 표시합니다. eth_getCode는 읽기 호출이므로 지갑도 서명도 가스도 필요 없고, 남의 주소를 포함해 어떤 주소든 확인할 수 있습니다.",
    diagrams: [
      {
        title: "The upgrade, and how this page observes it",
        titleKo: "업그레이드, 그리고 이 페이지가 그것을 관찰하는 법",
        src: `sequenceDiagram
    participant U as Owner (MetaMask)
    participant C as Ethereum (Sepolia)
    participant D as DeleGator implementation
    participant P as This page
    U->>C: type-4 tx with signed authorization
    C->>C: write 0xef0100 + impl into the account's code slot
    Note over C: address, balance, nonce unchanged
    P->>C: eth_getCode(address)
    C-->>P: 0xef0100 + implementation address
    P->>P: decode designator, link implementation
    Note over C,D: later calls to the account run D's code`,
      },
    ],
  },
  {
    key: "aa",
    title: "AA — delegatable accounts & session keys",
    titleKo: "AA — 위임형 계정 & 세션 키",
    description: "ERC-7702/7715 delegation + the four AA building blocks an agent needs (paymaster, atomic tx, KYA).",
    descriptionKo: "ERC-7702/7715 위임 + 에이전트에게 필요한 AA 구성요소 4가지 (paymaster, 원자적 트랜잭션, KYA).",
    status: "live",
    href: "/poc/aa",
    date: "2026-08-04", // 세션 키 + 4대 요소 데모 구축일 (08-05은 수정·보강)
    howTo:
      "Connect MetaMask on Sepolia → grant a scoped session key → watch it spend within the granted limit, no re-sign popup. Needs test USDC (faucet.circle.com) and a little Sepolia ETH for the session account's gas — the page lists both up front.",
    howToKo:
      "Sepolia에서 MetaMask 연결 → 범위 제한 세션 키 부여 → 재서명 팝업 없이 한도 내에서 지출되는 것을 확인. 테스트 USDC(faucet.circle.com)와 세션 계정 가스용 Sepolia ETH가 필요하며, 준비물은 페이지 상단에 안내되어 있습니다.",
    purpose:
      "Four properties account abstraction gives an autonomous agent that a plain wallet (EOA) can't: scoped delegation, gas independence, atomic multi-step execution, and (conceptually) on-chain identity checks — using two different AA standards side by side to show they solve overlapping problems differently.",
    purposeKo:
      "계정 추상화(AA)가 일반 지갑(EOA)은 줄 수 없는, 자율 에이전트를 위한 네 가지 속성 — 범위 제한 위임, 가스 독립, 원자적 다단계 실행, 그리고 (개념적으로) 온체인 신원 확인 — 을 보여줍니다. 서로 다른 두 AA 표준을 나란히 사용해, 겹치는 문제를 다른 방식으로 푸는 것을 대비시킵니다.",
    howItWorks:
      "Pillar ① uses MetaMask's ERC-7715 permission API: the owner wallet grants a browser-generated, single-use session account a capped ERC-20 allowance (\"≤5 test USDC, 1 hour\") via a signed permission request; the session account then spends within that limit by signing and broadcasting its own transaction directly — no further wallet popup, because the permission itself is the authorization. Pillars ②–③ switch to ERC-4337 (bundler-based smart accounts) via thirdweb: connecting a wallet wraps it in a smart contract account, gas is covered by a paymaster instead of the user's own ETH (pillar ②), and two calls can be bundled into one UserOperation that succeeds or reverts as a single atomic unit (pillar ③). Pillar ④ (on-chain agent identity/reputation via ERC-8004) is left as a written explainer rather than a live demo, since that standard's testnet deployment status hasn't been verified. One thing the page is explicit about: every action here is triggered by a human pressing a button, so it demonstrates the capabilities an autonomous agent would need rather than an agent itself — the missing piece is a decision loop, and the page names that gap instead of papering over it with the word \"agentic\".",
    howItWorksKo:
      "① 세션 키는 MetaMask의 ERC-7715 권한 API를 사용합니다: 소유자 지갑이 서명된 권한 요청으로, 브라우저에서 생성한 1회용 세션 계정에 한도가 걸린 ERC-20 허용량(\"최대 5 테스트 USDC, 1시간\")을 부여합니다. 이후 세션 계정은 그 한도 안에서 직접 서명·전송하며, 권한 자체가 인가이므로 추가 지갑 팝업이 없습니다. ②~③은 thirdweb을 통한 ERC-4337(번들러 기반 스마트 계정)로 전환됩니다: 지갑을 연결하면 스마트 컨트랙트 계정으로 감싸지고, 가스는 사용자의 ETH 대신 paymaster가 대신 냅니다(②). 두 개의 호출을 하나의 UserOperation으로 묶어 성공/실패가 원자적으로 함께 처리됩니다(③). ④(ERC-8004 기반 온체인 신원/평판)는 라이브 데모 대신 설명으로만 제공하는데, 해당 표준의 테스트넷 배포 여부가 아직 확인되지 않았기 때문입니다. 페이지가 분명히 밝히는 점 하나: 여기의 모든 동작은 사람이 버튼을 눌러 시작됩니다. 따라서 이 페이지는 자율 에이전트에게 필요한 능력을 보여줄 뿐 에이전트 자체를 보여주지는 않습니다 — 빠진 조각은 결정 루프이고, \"agentic\"이라는 단어로 덮는 대신 그 간극을 명시했습니다.",
    diagrams: [
      {
        title: "Full lifecycle — one upgrade, free grants, gas per spend",
        titleKo: "전체 수명주기 — 업그레이드 1회, 무료 부여, 지출마다 가스",
        src: `sequenceDiagram
    autonumber
    actor U as You
    participant MM as MetaMask
    participant EOA as Your EOA
    participant DM as DelegationManager
    participant EN as Caveat enforcers
    participant P as The page
    participant SK as Session key
    participant T as USDC

    Note over U,EOA: PRECONDITION (EIP-7702) — at most once
    MM->>EOA: type-4 tx, authorizationList names the DeleGator
    Note over EOA: code slot becomes 0xef0100 + implementation

    Note over P,MM: GRANT (ERC-7715) — off-chain, free, repeatable
    P->>P: generate a session keypair
    P->>MM: requestExecutionPermissions(session address, up to 5 USDC, 1h)
    MM-->>P: signed delegation (permissionContext)

    Note over SK,T: SPEND (ERC-7710) — gas paid by the session key
    SK->>DM: redeemDelegations(permissionContext, calldata)
    DM->>DM: recover signature, check revocation
    DM->>EN: beforeHooks — within cap? within the hour?
    DM->>EOA: plain CALL, executeFromExecutor(mode, calldata)
    Note over EOA: EVM follows the code-slot pointer,<br/>runs the DeleGator as your account
    EOA->>T: transfer(0.1 USDC)
    DM->>EN: afterHooks`,
      },
      {
        title: "One redemption — where each check happens",
        titleKo: "행사 한 건 — 각 검사가 일어나는 위치",
        src: `flowchart TD
    SK["Session key<br/>signs the tx, pays gas"] --> DM

    subgraph DM["DelegationManager"]
      direction TB
      V1["Is the delegation signature the owner's?"] --> V2["Has it been revoked?"]
      V2 --> V3["Enforcers: within 5 USDC, within 1 hour?"]
    end

    DM -->|"all checks passed"| CALL["An ordinary CALL to your address<br/>executeFromExecutor(mode, calldata)"]
    CALL --> EVM{{"EVM: does the code slot start with 0xef0100?"}}
    EVM -->|"no — a plain EOA"| DEAD["Nothing runs. Calldata ignored."]
    EVM -->|"yes — load the implementation's bytecode"| ACC

    subgraph ACC["Your EOA, running the DeleGator's code"]
      direction TB
      C1["Is msg.sender the manager I was deployed to trust?"] --> C2["execute the call"]
    end

    ACC --> T["USDC.transfer<br/>msg.sender = your address"]`,
      },
      {
        title: "Pillars ②③ — ERC-4337 smart account via thirdweb",
        titleKo: "②③ 요소 — thirdweb의 ERC-4337 스마트 계정",
        src: `sequenceDiagram
    participant O as Owner wallet (MetaMask)
    participant SA as Smart account (thirdweb)
    participant PM as thirdweb Paymaster

    O->>SA: connect + wrap in a smart account
    SA->>PM: submit UserOperation (2 batched calls)
    PM-->>SA: sponsor gas + execute atomically`,
      },
    ],
  },
  {
    // 위 "aa" 카드가 남긴 빈자리를 메우는 카드 — 4대 요소는 전부 사람이 버튼을 눌러 시작하므로
    // 능력이지 자율성이 아니다(jay, 2026-08-05). 설계: docs/tasks/current-plan.md.
    key: "agent",
    title: "Autonomous payment agent",
    titleKo: "자율 결제 에이전트",
    description:
      "An agent that wakes on a timer, decides on its own whether to spend, and cannot exceed the mandate it was given.",
    descriptionKo:
      "타이머에 깨어나 스스로 지출 여부를 판단하고, 받은 위임을 넘길 수 없는 에이전트.",
    // 라이브(2026-08-11 아침) → 목업(같은 날 저녁) → 완료(2026-08-12, jay). 라이브가 아닌 건
    // 그대로다 — 체인도 지갑도 없는 각본이니까. 다만 "준비 중"도 아니다: 사고 실험과 목업
    // 구현이 끝났고 더 만들 계획이 없다. done 이 그 상태를 가리키는 이름이다.
    status: "done",
    date: "2026-08-12",
    href: "/poc/agent",
    howTo:
      "A mockup, not a running agent — no chain, no wallet. Step through the scripted ticks to see the shape: the skips, the two bounded payments, and what happens after the mandate expires.",
    howToKo:
      "동작하는 에이전트가 아니라 목업입니다 — 체인도 지갑도 없습니다. 각본을 한 틱씩 넘기며 모양을 보세요: 건너뛴 판단들, 한도 안의 지출 두 번, 그리고 위임이 만료된 뒤에 벌어지는 일.",
    purpose:
      "The other demos on this page prove capability: a session key can spend within a bound, a paymaster can cover gas, a batch can revert atomically. Every one of them is started by a human pressing a button, which makes them account abstraction for agents rather than an agent. This one closes that gap with the missing piece — a decision loop that runs with nobody in the room. The claim it exists to demonstrate is narrower and more useful than \"the agent is autonomous\": the safety of an unattended agent is arithmetic, not trust. Its worst case is fixed in advance by an amount cap and a deadline that contracts enforce, and it is observable afterwards in a log.",
    purposeKo:
      "이 페이지의 다른 데모들이 증명하는 건 능력입니다 — 세션 키는 한도 안에서 쓸 수 있고, paymaster는 가스를 대신 낼 수 있고, 배치는 원자적으로 되돌아갈 수 있다. 그런데 전부 사람이 버튼을 눌러야 시작합니다. 그건 에이전트가 아니라 에이전트를 위한 계정 추상화입니다. 이 데모는 빠진 조각 하나로 그 간극을 메웁니다 — 방에 아무도 없을 때 도는 결정 루프. 증명하려는 명제는 \"에이전트가 자율적이다\"보다 좁고 유용합니다: 무인 에이전트의 안전은 신뢰가 아니라 산수다. 최악의 경우가 금액 한도와 기한으로 미리 고정되어 있고 — 컨트랙트가 강제합니다 — 사후에 로그로 확인됩니다.",
    howItWorks:
      "A scheduler hits a server endpoint every few minutes with no browser open. Each tick reads a real signal (the Chainlink Sepolia ETH/USD feed), evaluates a threshold rule against the last action, and either spends test USDC through an ERC-7715 session key or records why it declined. Skips are logged as carefully as spends — a journal reading \"moved 0.4%, below the 2% threshold, no action\" is what makes a decision legible as a decision, whereas a page showing only successful payments would just be the capability demo again. The mandate is bounded in two independent directions, amount and expiry, and neither bound is enforced by the agent's own code: an amount enforcer keeps the running total, a TimestampEnforcer compares block time to the deadline. The last state is the interesting one — leave the scheduler running past the expiry and the same code keeps ticking while the chain keeps rejecting it. Nothing had to be revoked; the window simply closed.",
    howItWorksKo:
      "스케줄러가 브라우저 없이 몇 분마다 서버 엔드포인트를 호출합니다. 각 틱은 실제 신호(Chainlink Sepolia ETH/USD 피드)를 읽고, 마지막 행동 대비 임계 규칙을 평가한 뒤, ERC-7715 세션 키로 테스트 USDC를 지출하거나 지출하지 않은 이유를 기록합니다. 스킵도 지출만큼 꼼꼼히 남깁니다 — \"0.4% 움직임, 2% 임계 미달, 행동 없음\"이라고 적힌 저널이 판단을 판단으로 읽히게 만듭니다. 결제 성공만 보여주는 페이지였다면 결국 능력 데모의 반복이었을 겁니다. 위임은 금액과 만료라는 서로 독립된 두 방향으로 묶여 있고, 둘 다 에이전트 자신의 코드가 아니라 바깥에서 강제됩니다 — 금액 enforcer가 누적 합계를 들고 있고, TimestampEnforcer가 블록 시간을 기한과 비교합니다. 마지막 상태가 가장 흥미롭습니다: 만료 이후에도 스케줄러를 켜두면, 같은 코드가 계속 돌고 체인은 계속 거부합니다. 취소할 게 없었습니다. 창이 닫혔을 뿐입니다.",
    diagrams: [
      {
        title: "One tick — observe, decide, act, record",
        titleKo: "한 틱 — 관측·판단·행동·기록",
        src: `flowchart TB
    T["Scheduler — every N minutes<br/>no browser open"] --> O["Observe<br/>Chainlink ETH/USD + budget left"]
    O --> D{"Rule: moved past<br/>the threshold?"}
    D -->|"no"| SK["Record a skip<br/>observation + why not"]
    D -->|"yes"| R["Redeem the delegation<br/>session key signs"]
    R --> EN{"Enforcers:<br/>within amount? before deadline?"}
    EN -->|"ok"| P["Pay — bounded, on-chain"]
    EN -->|"expired or over cap"| RJ["Rejected<br/>agent learns from its own failure"]
    P --> J["Journal row"]
    SK --> J
    RJ --> J`,
      },
    ],
  },
  {
    // 서비스 탐방 42/113에서 넘어온 카드 (jay, 2026-08-11). 다른 카드와 성격이 다르다 —
    // "이 서비스를 쓸까"가 아니라 "관리형이 죽을 때 무엇이 남는가"를 배우는 항목이고,
    // 마침 agent 카드가 손으로 짜고 있는 배관(논스·가스·재시도)과 정확히 같은 층이다.
    key: "oz-relayer",
    title: "OpenZeppelin Relayer & Monitor",
    titleKo: "OpenZeppelin Relayer · Monitor",
    description:
      "The managed service shut down; the tools were opened. Self-hosted transaction plumbing and on-chain alerting.",
    descriptionKo:
      "서비스는 죽고, 도구는 열렸다 — 셀프호스팅 트랜잭션 배관과 온체인 감시.",
    // done (jay, 2026-08-12): 사고 실험과 구현을 마쳤다 — 상시 구동 데모가 아니라 완결된 검토.
    status: "done",
    date: "2026-08-12", // 완결 선언일 — done 카드의 정렬 기준
    href: "/poc/oz-relayer",
    // 카드 그리드용 한 줄 — 세 질문은 페이지로 내렸다 (jay, 2026-08-11: 너무 장황함).
    howTo: "A thought experiment against verex's ChainJob worker: what a Relayer deletes, and what has to stay.",
    howToKo: "verex의 ChainJob 워커를 대상으로 한 사고 실험 — Relayer가 지우는 것과, 남아야 하는 것.",
    purpose:
      "Two questions this catalogue has not asked yet. First, the operational one: every agent demo here hand-rolls the dullest and most failure-prone part of on-chain work — nonce management, gas strategy, retries — and OpenZeppelin Relayer is that exact layer, extracted and hardened. Second, and larger: Defender was a managed SaaS that stopped taking sign-ups in June 2025 and shut down on 2026-07-01, handing its functionality to open source on the way out. That makes it a case study in a criterion missing from most infrastructure decisions — not \"what does it do\" or \"what does it cost\", but \"what remains when the vendor leaves\". Defender left well: a year's notice, a migration guide, a production-ready open-source successor. Most vendors will not.",
    purposeKo:
      "이 카탈로그가 아직 묻지 않은 질문 둘. 첫째는 운영의 문제입니다 — 여기 있는 모든 에이전트 데모가 온체인 작업에서 가장 지루하고 가장 자주 터지는 부분(논스 관리, 가스 전략, 재시도)을 손으로 다시 짜고 있고, OpenZeppelin Relayer는 정확히 그 층을 뽑아내 굳혀놓은 것입니다. 둘째는 더 큰 문제입니다: Defender는 2025년 6월 신규 가입을 닫고 2026-07-01에 완전히 종료된 관리형 SaaS였고, 나가면서 기능을 오픈소스로 넘겼습니다. 그래서 이 항목은 대부분의 인프라 결정에 빠져 있는 기준 하나에 대한 사례 연구가 됩니다 — \"무엇을 하는가\"도 \"얼마인가\"도 아닌, **\"벤더가 떠날 때 무엇이 남는가\"**. Defender는 잘 떠났습니다: 1년 예고, 마이그레이션 가이드, 프로덕션 레디 오픈소스 후계자. 대부분의 벤더는 그렇게 떠나지 않습니다.",
    howItWorks:
      "Relayer keeps the plumbing: it accepts a transaction over a REST API, signs it, and owns nonce sequencing, gas pricing, and retry — EVM multi-chain plus Solana and Stellar, with keys in HashiCorp Vault or AWS KMS rather than an env var. Monitor watches the other direction: declarative JSON rules over events, function calls, and transaction patterns, firing Slack or webhook alerts. The concrete scenario is verex, which already wrote this by hand. Its ChainJob worker executes strictly serially, and its own header explains why: “all txs are sent by the operator or a server-held demo key, so a single lane doubles as nonce management.” Around that sit exponential backoff (5s → 25s → 125s), an atomic PENDING→RUNNING claim, and stuck-job recovery after two minutes — a small relayer, built to make settlement work at all. Adopting the real one deletes the nonce lane, the gas strategy, and the retry ladder, but not onFailed: reversing DB fills after a terminal failure is business logic wearing plumbing's clothes, and no relayer can know that a failed SETTLE_MATCH means two users' balances must be un-credited. The interesting question is the third one. The single lane was serializing business logic as a side effect, not just nonces; widen it and you find out whether that mattered — and this codebase has already produced one bug of exactly that family, a ladder sized from a pre-settlement balanceOf. Monitor addresses the mirror image: that bug was invisible off-chain until it produced a wrong quote, while on-chain it was observable the entire time.",
    howItWorksKo:
      "Relayer는 배관을 맡습니다: REST API로 트랜잭션을 받아 서명하고, 논스 순서·가스 가격·재시도를 직접 관리합니다 — EVM 멀티체인에 Solana·Stellar까지, 키는 env 변수가 아니라 HashiCorp Vault나 AWS KMS에 둡니다. Monitor는 반대 방향을 봅니다: 이벤트·함수 호출·트랜잭션 패턴을 선언적 JSON 룰로 감시하고 Slack·웹훅으로 알립니다. 구체적인 시나리오는 verex입니다 — 이미 이걸 손으로 짜 놨거든요. ChainJob 워커는 엄격히 직렬로 실행되고, 그 이유가 파일 헤더에 그대로 적혀 있습니다: \"모든 tx를 오퍼레이터나 서버 보관 키가 보내므로, 단일 레인이 곧 논스 관리다.\" 그 주위에 지수 백오프(5s → 25s → 125s), 원자적 PENDING→RUNNING 클레임, 2분 뒤 멈춘 잡 복구가 붙어 있습니다 — 정산을 굴러가게 만들려고 지은 작은 릴레이어입니다. 진짜 Relayer를 도입하면 논스 레인·가스 전략·재시도 사다리는 지워지지만, onFailed는 아닙니다: 종료 실패 후 DB 체결을 되감는 건 배관의 옷을 입은 비즈니스 로직이고, 실패한 SETTLE_MATCH가 곧 두 사용자의 잔고를 취소해야 한다는 뜻임을 아는 릴레이어는 없습니다. 흥미로운 건 세 번째 질문입니다. 단일 레인은 논스만이 아니라 **비즈니스 로직까지 부수적으로 직렬화**하고 있었고, 레인을 넓히면 그게 중요했는지 아닌지가 드러납니다 — 그리고 이 코드베이스는 이미 정확히 그 계열의 버그를 하나 냈습니다(정산 전 balanceOf로 사다리를 산정한 건). Monitor는 그 거울상을 맡습니다: 그 버그는 잘못된 호가를 낼 때까지 오프체인에서 보이지 않았지만, 온체인에서는 처음부터 관측 가능했습니다.",
    diagrams: [
      {
        title: "verex today — one lane, because the lane is the nonce manager",
        titleKo: "오늘의 verex — 레인이 곧 논스 관리자라서, 레인이 하나",
        src: `flowchart TB
    API["API responds from the DB<br/>immediately"] --> Q[("ChainJob rows<br/>PENDING")]
    Q --> W["Single worker<br/>strictly serial"]
    W --> N["nonce: implicit<br/>one lane = no races"]
    N --> G["gas: whatever viem picks"]
    G --> R{"tx ok?"}
    R -->|"yes"| OK["CONFIRMED"]
    R -->|"no, attempts left"| B["backoff 5s / 25s / 125s"]
    B --> Q
    R -->|"no, exhausted"| F["onFailed — reverse the DB fills"]
    F --> X["FAILED"]`,
      },
      {
        title: "With a Relayer — what leaves, what must stay",
        titleKo: "Relayer를 넣으면 — 무엇이 떠나고 무엇이 남아야 하나",
        src: `flowchart TB
    API["API responds from the DB"] --> Q[("ChainJob rows")]
    Q --> W["Worker — now only<br/>decides WHAT to submit"]
    W -->|"POST /transactions"| RL["Relayer<br/>nonce · gas · retry · KMS key"]
    RL --> C["Chain"]
    C --> CB["callback / poll"]
    CB --> F["onFailed — reverse the DB fills<br/>STAYS: business logic"]
    C --> M["Monitor rules"]
    M --> AL["Slack / webhook"]
    subgraph OPEN["The question the swap opens"]
      direction TB
      S1["The single lane also serialized<br/>business logic, not just nonces"]
      S2["Widen it — was that load-bearing?<br/>cf. the pre-settlement balanceOf bug"]
      S1 --- S2
    end`,
      },
      {
        title: "Where a Relayer would sit in the agent's tick",
        titleKo: "에이전트의 틱에서 Relayer가 앉을 자리",
        src: `flowchart LR
    S["Scheduler"] --> A["Agent decides"]
    A -->|"today: hand-rolled"| SK["Session key<br/>own nonce, own gas, own retry"]
    A -->|"with a Relayer"| RL["Relayer REST API<br/>nonce · gas · retry · KMS key"]
    SK --> C["Chain"]
    RL --> C
    C --> M["Monitor rules<br/>events, patterns"]
    M --> AL["Slack / webhook"]
    subgraph GAP["Still nobody's job"]
      G["Gas tank empty<br/>→ the loop stops silently"]
    end`,
      },
    ],
  },
  // ── docs/features/README.md 의 표에는 있는데 카드가 없던 항목들 (jay, 2026-08-11).
  //
  // 처음엔 "📎 Reference only" 행들을 뺐다 — README 가 "no dev item" 이라 적어 두었으니
  // 카드로 만들면 만들 계획이 있는 것처럼 보인다는 판단이었다. jay 가 그 여섯을 다시 물어서
  // 전부 넣었다: 목록의 목적이 "무엇을 만들 것인가" 만이 아니라 "무엇을 읽고 이해했는가"
  // 이기도 하다면, 읽기 자료를 숨기는 쪽이 오히려 목록을 좁게 만든다.
  // 대신 status 로 구분한다 — 참조 카드는 href 가 없어 "준비 중" 회색 배지로 남고,
  // 눌리는 목업(인디고)과 섞이지 않는다.
  // 게임(Unity WebGL) 카드는 제거 (jay, 2026-08-12) — /game 라우트와 상단 메뉴는 그대로 살아
  // 있고, PoCs 목록에서만 뺀다. 이 목록은 "무엇을 만들고 있나"를 답하는데, 캔버스
  // 자리표시자와 Unity 트랙은 그 질문에 서로 다른 답을 해서 배지 하나로 정리되지 않았다.
  {
    // 남의 아키텍처 제안을 읽고 그 빈칸을 찾은 항목 (jay, 2026-08-14). 이 카탈로그의
    // 다른 카드들과 달리 출발점이 내 아이디어가 아니라 실무자의 공개 글이라, 원 논지와
    // 내 분석을 카드 안에서 분리해 적었다 — 나중에 다시 볼 때 어느 쪽이 누구 주장인지
    // 헷갈리지 않게. soon 묶음의 맨 앞(5번)에 두려고 배열에서 dsrv-portal 앞에 넣었다.
    key: "rwa-multichain",
    title: "RWA across chains — the invariant nobody enforces",
    titleKo: "멀티체인 RWA — 아무도 강제하지 않는 불변식",
    // 상세 페이지를 손으로 쓴다 (jay, 2026-08-14) — 생성 템플릿 아래에 원저자 글 원문을
    // 그대로 보관해야 해서. 나중에 재분석할 때 저자 논지와 내 해석을 구분하려면 원문이
    // 같은 페이지에 있어야 한다. 생성기는 docsHref 가 topics/ 를 가리키면 덮어쓰지 않는다.
    docsHref: "topics/pocs-rwa-multichain.html",
    description:
      "Reading a practitioner's multichain RWA architecture and finding the one box it leaves empty: who stops the tokens on five chains from summing past the asset behind them.",
    descriptionKo:
      "실무자의 멀티체인 RWA 아키텍처 제안을 읽고, 그 설계가 비워둔 칸 하나를 찾은 기록 — 다섯 체인의 토큰 합계가 기초자산을 넘지 않게 누가 막는가.",
    status: "done",
    // 재분석 완료일 (jay, 2026-08-17) — 카드를 만든 날(08-14)이 아니라 빈칸의 답을
    // 실제로 적어낸 날. status 를 done 으로 올릴 때 date 를 같이 올리는 규칙(CLAUDE.md).
    date: "2026-08-17",
    howTo:
      "Re-analysed 2026-08-17 and closed as a reading note — the empty box now has an answer, though nothing is built. Source: a public LinkedIn post proposing an RWA platform architecture (Private Registry + VC + per-chain adapters), read on 2026-08-14.",
    howToKo:
      "2026-08-17 재분석 완료 — 빈칸에 답을 적었고, 구현물은 없습니다. 출처: RWA 플랫폼 아키텍처(Private Registry + VC + 체인별 어댑터)를 제안한 공개 LinkedIn 글, 2026-08-14 읽음.",
    purpose:
      "Almost every question this catalogue asks shows up in one place here. The post's thesis is that RWA's bottleneck is not minting tokens but carrying one off-chain fact to many chains, so the thing to standardise first is the fact-transport interface, not the token contract — which is the same enforce-on-chain-remember-off-chain split the CRE × Cloud card arrives at from the other direction. Its honest passage is the one worth keeping: verifiable credentials prove that a responsible institution signed something, and zero-knowledge proofs prove an input satisfies a condition, but neither proves the custodied asset exists. What makes it worth a card rather than a bookmark is where it stops. The author correctly names the hardest problem — in multichain, controlling global supply matters more than issuing — and then answers it with continuous reconciliation, which detects overissuance after the fact rather than preventing it. That gap is the same one the bridge and shared-sequencer cards keep circling, and it is the part to re-analyse.",
    purposeKo:
      "이 카탈로그가 묻는 질문이 거의 전부 한 자리에 나옵니다. 글의 논지는 **RWA의 병목이 토큰 발행이 아니라 오프체인 사실을 여러 체인에 전달하는 일**이고, 그래서 먼저 표준화할 것은 Token Contract가 아니라 사실 전달 인터페이스라는 것 — CRE × Cloud 카드가 반대 방향에서 도달한 \"강제는 온체인, 기억은 오프체인\"과 같은 분리입니다. 살릴 만한 정직한 대목: **VC는 책임기관이 서명했다는 사실을, ZKP는 입력이 조건을 만족한다는 사실을 증명할 뿐 수탁자산이 실제로 존재하는지는 증명하지 못한다.** 북마크가 아니라 카드가 될 값어치는 **글이 멈추는 자리**에 있습니다. 저자는 가장 어려운 문제를 정확히 짚고도(\"멀티체인에서는 발행보다 글로벌 공급량 통제가 더 중요하다\") 그 답을 **지속적 대사(reconciliation)**로 둡니다 — 과발행을 사전에 막는 것이 아니라 사후에 발견하는 방식입니다. 그 빈칸이 브릿지·공유 시퀀서 카드가 반복해서 부딪히는 바로 그 지점이고, 다시 분석할 부분입니다.",
    howItWorks:
      "The proposed stack, as written: a Private Operational Registry (Canton named as candidate infrastructure) holds the sensitive originals and the authoritative current state — custody balances, NAV, investor eligibility, total issuance, redemption and suspension status. Responsible institutions issue only the necessary facts as verifiable credentials rather than exposing the registry. A verification layer checks issuer, signature, schema, validity window and revocation, with selective disclosure or ZK where a balance or an identity cannot be shown. Per-chain adapters translate a verification result into that network's attestation format, which reduces EAS to one EVM execution adapter among several. A policy contract then permits or refuses mint, transfer, redeem and pause. The instruction the author actually gives is narrow and good: start the PoC on a single chain, but separate fact from execution from day one, so that adding a chain extends the execution channel instead of rebuilding the rights. Two notes for the re-read. First, the empty box: reconciliation detects, it does not prevent — true prevention needs each chain's mint to check and reserve against a global cap, which is cross-chain atomicity, and shared sequencers only guarantee atomic inclusion, not atomic execution. Second, the alternative this catalogue would reach for instead, following the same move that replaced bridges with intents: stop trying to hold an exact global invariant and make someone post collateral against it. An issuing agent buys an allocation from the off-chain ledger before minting and is slashed for minting without one — the invariant is enforced economically rather than atomically, exactly as a card network authorises against a limit it does not check in real time. That is likely more honest for RWA anyway, where NAV strikes daily and redemption settles T+1; the off-chain side was never atomic. The cost is the familiar one: collateral concentrates in whoever has the most capital, and under RWA licensing that is a custodian or a broker, so the structure returns to a small set of regulated intermediaries — with their collateral and slashing conditions published as code, which is the only difference and the one worth arguing about. \n\n**Re-analysis, 2026-08-17 — the box is fillable, and cheaper than the card first assumed.** The card reached for collateral and slashing because it read the problem as needing cross-chain atomicity. It does not. Atomicity is only required if each chain must *check* a global variable; it is not required if the global quantity is *conserved* instead of checked. Give each chain a local allocation and let that allocation only ever move, and two local invariants multiply into the global one — the registry keeps sum(allocation) <= cap, which is a single-party rule and therefore trivial, while each chain keeps minted <= allocation, which is a local read. Together they give sum(minted) <= cap with no cross-chain call anywhere. The registry in the post already holds total issuance as authoritative state, so the change is one of role rather than architecture: stop using it as an observer that reconciles after the fact and use it as an allocator that issues a signed, nonce-bearing, expiring right to mint N units on chain X, which the per-chain policy contract consumes exactly once. That also makes the collateral answer look over-engineered rather than clever — slashing is what you invent when no party can be trusted, and RWA is a setting where a responsible institution is a regulatory requirement, so the card was importing a trust-minimised mechanism into a context that already had a trust anchor. The final paragraph noticed the outcome (the structure returns to regulated intermediaries) but blamed capital concentration; the actual cause is that the anchor was there all along. **What survives as genuinely unsolved is the reverse direction.** Allocation can be increased safely and reduced only down to unminted headroom; reducing below what a chain has already minted requires burning there first, which is impossible if that chain is halted or dead. Revocation would fix it and revocation is inflation — whoever can cancel an allocation can re-issue it, and if the chain was merely unreachable rather than dead the total is breached. Stranded allocation, and the challenge window and evidence standard that would govern recovery, is the part still worth building against. **Two smaller corrections the re-read produced.** First, scope Canton honestly: it is a candidate for the registry box and nothing more, mentioned once in the post and never argued. Sharing KYC across chains needs no shared ledger at all — a credential format, issuer keys and a revocation list do it, which is what Privado ID already ships; a shared ledger only earns its operating cost when several mutually-distrusting institutions must co-write mutable state such as NAV, custody balance and allocation. The judgement is one question — how many parties write authoritative state — and the honest build order is a signing service behind a stable interface, with Canton kept as a swappable implementation. The separation the post recommends is what lets that decision be deferred, which is its most useful contribution. Second, the off-chain-to-on-chain lag is not a defect to be removed but a statement to be re-tensed. A chain that claims owner == A is asserting a present fact and goes false during settlement; a chain that records \"as of 09:00 the owner was A\" is asserting a past one and only ever goes stale. The snapshotAt field in the post's schema is that device, and it converts an unbounded correctness problem into a bounded freshness one, consumed with an explicit staleness limit. Above it sit four tools that stack rather than compete — mark the pending state, lock the asset while it moves, require the registry to countersign, or insert a guarantor — chosen per consumer, since interest accrual tolerates a day, governance already votes on snapshots, and only liquidation is exposed at the second. Locking and guaranteeing are substitutes; paying for both ties up capital twice. Exact agreement was never the target, because the off-chain side was never atomic either: NAV strikes daily and redemption settles T+1, so the goal is a stated bound on staleness rather than the absence of it.",
    howItWorksKo:
      "글이 제안한 스택 그대로: **Private Operational Registry**(후보 인프라로 Canton을 명시)가 민감한 원본과 최신 기준 상태를 보관합니다 — 수탁잔고·NAV·투자자 자격·총발행량·상환과 정지 상태. 책임기관은 레지스트리를 공개하는 대신 **필요한 사실만 VC로 발급**합니다. **검증 계층**이 발급자·서명·schema·유효기간·폐기를 확인하고, 잔고나 신원을 드러낼 수 없는 경우 선택적 공개나 ZKP를 씁니다. **체인별 어댑터**가 검증 결과를 그 네트워크의 attestation 형식으로 변환하며, 이 구조에서 EAS는 여러 EVM 실행 어댑터 중 하나로 내려앉습니다. 그다음 **Policy Contract**가 mint·transfer·redeem·pause를 허용하거나 거절합니다. 저자가 실제로 주는 지시는 좁고 좋습니다 — **PoC는 단일 체인에서 시작하되, 처음부터 사실과 실행을 분리하라.** 그래야 체인을 추가할 때 현실의 권리를 다시 만들지 않고 실행 채널만 넓힙니다. 다시 읽을 때의 메모 둘. **첫째, 빈칸**: 대사는 발견이지 예방이 아닙니다 — 진짜로 막으려면 각 체인의 mint가 전역 한도를 확인하고 예약해야 하는데 그것이 곧 체인 간 원자성이고, 공유 시퀀서는 **원자적 포함까지만** 보장합니다. **둘째, 이 카탈로그라면 택했을 대안** — 브릿지를 인텐트로 대체한 것과 같은 수를 씁니다: 정확한 전역 불변식을 붙들려 하지 말고 **누군가 담보를 걸고 그것을 보증하게** 하는 것. 발행 대리인이 mint 전에 오프체인 기준원장에서 배정을 사오고, 배정 없이 찍으면 슬래싱 — 불변식을 원자적으로가 아니라 **경제적으로** 강제합니다. 카드사가 실시간 조회 없이 한도에 대해 승인하고 나중에 정산하는 것과 정확히 같은 구조입니다. RWA에는 오히려 이쪽이 정직합니다 — NAV는 하루 한 번 산정되고 상환은 T+1인데, **오프체인이 애초에 원자적이지 않았으니까요.** 대가는 익숙한 것: 담보는 자본이 큰 쪽으로 집중되고, RWA는 라이선스까지 걸려 결국 수탁사·증권사 몇 곳이 그 자리에 섭니다. 구조가 기존 금융으로 되돌아오는 셈이고 — **다른 점은 담보와 슬래싱 조건이 코드로 공개된다는 것 하나뿐**인데, 그 하나가 얼마짜리인지가 다툴 만한 지점입니다.\n\n**재분석 2026-08-17 — 빈칸은 채울 수 있고, 카드가 처음 가정한 것보다 싸게 채워집니다.** 카드가 담보와 슬래싱을 꺼낸 것은 이 문제를 **체인 간 원자성이 필요한 문제로 읽었기 때문**입니다. 그렇지 않습니다. 원자성은 각 체인이 전역 변수를 *검사*해야 할 때만 필요하고, 전역 수량을 검사하는 대신 **보존**하면 필요 없습니다. 각 체인에 로컬 배정(allocation)을 주고 그 배정은 오직 **이동만** 하게 하면, 로컬 불변식 둘이 곱해져 전역 불변식이 나옵니다 — 레지스트리가 `Σ allocation ≤ 한도`를 지키고(단일 주체라 자명), 각 체인이 `minted ≤ allocation`을 지키면(로컬 읽기), 합쳐서 `Σ minted ≤ 한도`가 **체인 간 호출 없이** 성립합니다. 글의 레지스트리는 이미 총발행량을 권위 있는 상태로 쥐고 있으므로, 바뀌는 것은 아키텍처가 아니라 **역할** 하나입니다 — 사후에 대사하는 **관찰자**로 쓰지 말고, \"체인 X에 N 단위를 발행할 권리\"를 **논스·만료 포함해 서명 발급하는 배분자**로 쓰고, 체인별 Policy Contract가 그것을 정확히 한 번 소비하게 하는 것. 그러면 담보 답안은 영리한 것이 아니라 **과잉설계**로 보입니다 — 슬래싱은 믿을 주체가 하나도 없을 때 나온 발명인데, RWA는 책임기관의 존재가 **규제 요건**인 판이라, 카드는 신뢰 앵커가 이미 있는 문맥에 무신뢰 도구를 수입한 셈입니다. 마지막 문단이 결과(구조가 규제 중개기관으로 되돌아온다)는 알아챘지만 원인을 자본 집중으로 돌렸는데, 실제 원인은 **앵커가 처음부터 거기 있었다**는 것입니다. **진짜로 안 풀린 채 남는 것은 반대 방향입니다.** 배정은 안전하게 늘릴 수 있고, 줄이는 것은 **아직 안 찍은 여유분까지만** 가능합니다. 이미 찍힌 양 아래로 내리려면 그 체인에서 먼저 소각해야 하는데, 체인이 멈췄거나 죽었으면 소각할 방법이 없습니다. 폐기 권한을 주면 풀리지만 **폐기 권한 = 인플레이션 권한**입니다 — 배정을 취소할 수 있는 자는 재발행할 수 있고, 그 체인이 죽은 게 아니라 잠시 닿지 않았을 뿐이라면 총량이 깨집니다. **stranded allocation**, 그리고 회수를 규율할 챌린지 기간과 증거 기준 — 여기가 아직 만들어 볼 값어치가 남은 부분입니다. **재독이 낳은 작은 정정 둘.** 첫째, **Canton의 범위를 정직하게** 잡을 것 — 레지스트리 칸의 후보일 뿐이고, 글에 한 문장 등장하며 논증된 적이 없습니다. **체인 간 KYC 공유에는 공유 원장이 아예 필요 없습니다** — 자격증명 형식·발급자 키·폐기 목록이면 되고, 그건 Privado ID가 이미 하고 있는 것입니다. 공유 원장이 운영비를 정당화하는 건 **서로 완전히 신뢰하지 않는 여러 기관이 NAV·수탁잔고·배정 같은 변하는 상태를 함께 써야 할 때**뿐입니다. 판별은 질문 하나 — **권위 있는 쓰기를 하는 주체가 몇인가** — 이고, 정직한 구축 순서는 안정된 인터페이스 뒤에 **서명하는 서비스**를 두고 Canton은 갈아끼울 구현체로 남기는 것입니다. 글이 권하는 \"사실과 실행의 분리\"가 바로 그 결정을 **미룰 수 있게** 해 주는 장치이고, 그것이 이 글의 가장 쓸모 있는 기여입니다. 둘째, 오프체인과 온체인의 시차는 **없앨 결함이 아니라 시제를 바꿀 문장**입니다. `owner == A`라고 말하는 체인은 **현재형**을 주장하므로 결제 중에 거짓이 되지만, \"09:00 기준 소유자는 A였다\"고 적는 체인은 **과거형**이라 낡을 뿐 틀리지 않습니다. 글의 schema에 있는 **`snapshotAt`**이 그 장치이고, 이 필드 하나가 무한정한 정합성 문제를 **측정 가능한 신선도 문제**로 바꿉니다 — 소비할 때 staleness 상한을 명시하면 됩니다. 그 위에 얹는 도구 넷은 경쟁이 아니라 **적층**입니다 — pending 상태를 표시하고, 이동 중에는 잠그고, 레지스트리 반대서명을 요구하고, 보증인을 끼우는 것 — 그리고 **소비자별로** 고릅니다. 이자 계산은 하루를 견디고, 거버넌스는 이미 스냅샷으로 투표하며, 초 단위로 노출되는 것은 **청산뿐**입니다. 락과 보증인은 **서로 대체재**라 둘 다 하면 자본을 두 번 묶습니다. 완전 일치는 애초에 목표가 아니었습니다 — **오프체인도 원자적이었던 적이 없기 때문**입니다. NAV는 하루 한 번 산정되고 상환은 T+1이니, 목표는 시차 0이 아니라 **시차의 상한이 명시되는 것**입니다.",
  },
  {
    // Term Labs 거버넌스 익스플로잇(2026-08-23, $8.5M)을 보고 추가 (jay, 2026-08-24).
    // 코드는 한 줄도 깨지지 않았다는 게 이 카드의 전부다 — 감사 경계가 볼트에서 끝나고
    // 실제 보안은 토큰 분포로 넘어갔는데, 토큰 분포를 감사하는 사람은 없다.
    // stake-concentration(겉보기 N개 단위) · aqua(먼저 온 사람에게만 실재하는 깊이)와 같은 계열.
    key: "governance-capture-cost",
    title: "Governance capture — when the exploit is a market order",
    titleKo: "거버넌스 장악 — 익스플로잇이 그냥 시장가 매수일 때",
    description:
      "$8.5M left Term's vaults without a line of code breaking. The number nobody publishes for a token-governed vault is what decisive voting power costs against what it controls.",
    descriptionKo:
      "코드는 한 줄도 깨지지 않았는데 Term의 볼트에서 850만 달러가 빠져나갔습니다. 토큰이 지배하는 볼트에 대해 아무도 발표하지 않는 숫자는, **결정권을 쥘 만큼의 표를 사는 값이 그 표가 통제하는 금액 대비 얼마인가**입니다.",
    status: "soon",
    howTo:
      "Not yet scoped — start by computing one ratio for a handful of live protocols: the slippage cost of buying decisive voting power on DEXs, measured against historical turnout rather than total supply, set against the TVL that governance controls. Source: the Term Labs governance exploit, 2026-08-23. No official postmortem published yet, so the exact permission path is inference.",
    howToKo:
      "아직 범위 미정 — 살아 있는 프로토콜 몇 개에 대해 비율 하나를 계산하는 것부터: **DEX에서 결정권을 쥘 만큼의 표를 사들이는 슬리피지 비용**을(총발행량이 아니라 **과거 실제 투표율** 기준으로) 그 거버넌스가 통제하는 TVL에 대보는 것. 출처: Term Labs 거버넌스 익스플로잇, 2026-08-23. **공식 사후보고서가 아직 없어** 정확한 권한 경로는 추론입니다.",
    purpose:
      "The distinction is the whole story. Term has two very different products under one brand: the core fixed-rate repo markets use per-loan collateral lockers to isolate borrower and lender exposure, and that design held and was untouched. What drained was Term Vaults, a separate yield product built as Yearn v3 contracts, and Yearn was explicit that this was not their bug — the attack came through Term's own governance wrapper sitting on top of the vault. Yearn V3 is deliberately un-opinionated: it exposes privileged roles (role_manager, debt manager, emergency manager) and says nothing whatsoever about who holds them. That holder can be an EOA, a multi-sig, or a governance contract that relays calls, and Term put a DAO vote there. So the audited surface ends at the vault, and the actual security of the vault becomes a property of the token distribution, which no auditor reviews. The invariant that should govern any token-controlled vault is that the cost to acquire decisive voting power exceeds the value that power controls. Term's vault TVL was $12.2M, $8.6M of it on Ethereum, against a governance token cheap and thin enough to corner from a 2 ETH base routed through Tornado Cash. When that inequality inverts this stops being an exploit and becomes an arbitrage — it needs no bug, no zero-day and no cleverness, it executes deterministically, and the attacker is racing nobody. The seed size matters more than it looks: this was not a Beanstalk-style flash-loan attack renting voting power for one block, because the float was thin enough to buy outright, which also means there was no anomalous funding signature to alert on. Accumulation looks like organic buying right up until the proposal executes. This catalogue has recorded the same shape twice already — the stake-concentration card, where a set looks like N independent units while the unit of independence is smaller, and the Aqua card, where quoted depth is real but only for whoever arrives first. Here it is N tokens that are not N voters.",
    purposeKo:
      "**구분이 곧 이야기 전부입니다.** Term은 한 브랜드 아래 성격이 완전히 다른 제품 둘을 갖고 있습니다 — 핵심 고정금리 레포 시장은 **대출 건별 담보 락커**로 차입자·대여자 익스포저를 격리하고, **그 설계는 멀쩡했고 손도 안 탔습니다.** 털린 것은 **Term Vaults**, **Yearn v3 컨트랙트**로 지은 별도 수익 상품입니다. 그리고 Yearn은 자기네 버그가 아니라고 분명히 했습니다 — 공격은 **볼트 위에 얹힌 Term 자신의 거버넌스 래퍼**를 통해 들어왔으니까요. **Yearn V3는 의도적으로 무입장(un-opinionated)입니다**: 특권 역할(`role_manager`·debt manager·emergency manager)을 노출하되 **그것을 누가 쥐는지에 대해서는 아무 말도 하지 않습니다.** EOA일 수도, 멀티시그일 수도, 호출을 중계하는 거버넌스 컨트랙트일 수도 있고 — **Term은 거기에 DAO 투표를 놓았습니다.** 그래서 **감사받은 표면은 볼트에서 끝나고, 볼트의 실제 보안은 토큰 분포의 성질이 됩니다. 그리고 토큰 분포를 감사하는 사람은 없습니다.** 토큰이 지배하는 볼트를 규율해야 할 불변식은 하나입니다 — **결정권을 쥘 만큼의 표를 사는 비용 > 그 표가 통제하는 가치.** Term의 볼트 TVL은 1,220만 달러(그중 이더리움에 860만)였고, 상대편에는 **Tornado Cash를 거친 2 ETH로 매집을 시작할 만큼 얇고 싼** 거버넌스 토큰이 있었습니다. **이 부등식이 뒤집히는 순간 그것은 익스플로잇이 아니라 차익거래가 됩니다** — 버그도 제로데이도 영리함도 필요 없고, 결정론적으로 실행되며, **공격자는 아무와도 경주하지 않습니다.** 종잣돈 크기가 보이는 것보다 중요합니다: 이것은 한 블록 동안 표를 빌리는 **Beanstalk식 플래시론 공격이 아니었습니다.** 유통량이 **그냥 사버릴 만큼 얇았기** 때문이고, 그 말은 곧 **경보를 울릴 이상 자금 신호도 없었다**는 뜻입니다. 매집은 제안이 실행되는 순간까지 **평범한 매수처럼 보입니다.** 이 카탈로그는 같은 형태를 이미 두 번 기록했습니다 — **stake-concentration**(겉보기엔 독립 단위 N개인데 실제 독립성의 단위는 더 작다)과 **Aqua**(호가된 깊이는 실재하지만 먼저 도착한 사람에게만). 여기서는 **N개의 토큰이 N명의 투표자가 아니라는 것**입니다.",
    howItWorks:
      "Mechanics as reported: the attacker cornered a majority of a sparsely held governance token, then passed malicious proposals to seize the strategy vaults, holding 100% of voting power in four of five USDC strategy vaults and roughly 91% in the Ethereum Meta Vault at execution time. The vault contracts then executed the malicious calls as legitimate, because they were. Execution was not a naive transfer either — the first exploit transaction burned 44.37 aEthWETH and withdrew WETH from Aave through the stataEthWETH wrapper, meaning the proposal forced the strategy to unwind external positions first and then redirect. From the vault state machine's point of view that is an entirely ordinary rebalance-and-shutdown sequence, no invariant was violated, and no monitor watching for impossible state would have fired. The exit was 2,843 ETH and about 1.68M USDC swapped to DAI, consolidated into one wallet beginning 0xD5183, and the USDC-to-DAI hop is a read on which assets carry a centralized freeze function. Term reportedly had a seven-day timelock plus an LP veto and neither stopped it, which is the part worth building the measurement around. A timelock is latency, not a control: it converts a security property into an operational one, requiring someone to watch the proposal queue, recognise a hostile payload, and hold both the authority and the liveness to act inside the window. If nobody runs that loop the delay only means the theft is scheduled a week in advance — and notably the incident was first surfaced by a third party's on-chain monitoring bot rather than by Term or its LPs. A veto held by an apathetic quorum is likewise not exercisable, since the population that let voting power reach 100% is the same population expected to veto. So the PoC is two numbers per protocol and neither needs a contract deployed. First, the naive cost of buying 51% of supply against the real cost of buying 51% of historical turnout, because quorum measured against turnout rather than total supply degrades to whoever shows up; the gap between those two figures is the number nobody publishes, and it is where governance apathy stops being a governance problem and becomes a direct reduction in attack cost. Second, and cheaper: for every protocol advertising a timelock, has any proposal ever actually been cancelled or vetoed? If the answer is never, the timelock is decorative, and its presence on a security page is a claim about a loop nobody runs. Context for scale: DefiLlama classified five governance attacks in 2026 totalling $25.1M, led by a $20M malicious proposal against BonkDAO in July, and Term itself lost roughly $1.5M in May 2025 to an oracle decimal mismatch during a routine upgrade — a different failure with the same underlying theme, that the risk kept landing in the configuration and privilege layer rather than in the core math.",
    howItWorksKo:
      "보도된 동작 방식: 공격자는 **보유가 희박한 거버넌스 토큰의 과반을 매집**한 뒤 악성 제안을 통과시켜 전략 볼트를 장악했고, **실행 시점에 USDC 전략 볼트 5개 중 4개에서 의결권 100%, 이더리움 메타 볼트에서 약 91%**를 쥐고 있었습니다. 그러자 볼트 컨트랙트는 악성 호출을 **정당한 것으로 실행했습니다 — 실제로 정당했으니까요.** 실행도 단순 `transfer`가 아니었습니다. 첫 익스플로잇 트랜잭션은 **44.37 aEthWETH를 소각하고 stataEthWETH 래퍼를 통해 Aave에서 WETH를 인출**했습니다 — 즉 제안이 전략에게 **외부 포지션을 먼저 청산한 뒤 방향을 돌리게** 시킨 겁니다. **볼트 상태 머신의 관점에서 이것은 지극히 평범한 리밸런스·셧다운 시퀀스**이고, **불변식은 하나도 위반되지 않았으며**, \"불가능한 상태\"를 감시하는 모니터는 **아무것도 울리지 않았을 것**입니다. 탈출은 **2,843 ETH와 약 168만 USDC(→DAI로 스왑)**, 전부 `0xD5183`으로 시작하는 지갑 하나로 모였고 — **USDC→DAI 한 단계는 어느 자산에 중앙화된 동결 기능이 있는지를 읽은 것**입니다. Term에는 **7일 타임락과 LP 거부권**이 있었다고 하는데 **둘 다 막지 못했고**, 측정을 설계할 값어치가 있는 부분이 바로 여기입니다. **타임락은 통제가 아니라 지연입니다.** 보안 속성을 **운영 속성으로 바꿔놓을 뿐**이라, 누군가 제안 큐를 지켜보고, 페이로드가 적대적임을 알아보고, 창 안에서 **행동할 권한과 가용성을 모두** 갖고 있어야 합니다. 그 루프를 아무도 돌리지 않으면 **지연은 도난이 일주일 전에 예약돼 있었다는 뜻**밖에 안 됩니다 — 그리고 이 사건은 Term도 LP도 아닌 **제3자의 온체인 감시 봇이 먼저 발견**했습니다. **무관심한 정족수가 쥔 거부권도 행사되지 않습니다** — 의결권이 100%까지 가도록 방치한 집단과 거부권을 행사할 것으로 기대되는 집단이 **같은 집단**이니까요. 그래서 PoC는 **프로토콜당 숫자 둘**이고, 둘 다 컨트랙트를 배포할 필요가 없습니다. **첫째, 총발행량의 51%를 사는 순진한 비용 대 과거 실제 투표율의 51%를 사는 진짜 비용.** 정족수를 총발행량이 아니라 **투표율 기준으로 재면 결국 \"나온 사람들\" 기준으로 퇴화**하기 때문이고, **그 두 숫자의 간격이 아무도 발표하지 않는 그 숫자**이며, 거기서 **거버넌스 무관심은 거버넌스 문제이기를 그만두고 공격 비용의 직접적 인하가 됩니다.** **둘째, 더 싼 것: 타임락을 내세우는 모든 프로토콜에 대해 — 제안이 실제로 취소되거나 거부된 적이 한 번이라도 있는가?** 답이 \"한 번도 없다\"면 **그 타임락은 장식**이고, 보안 페이지에 적힌 그 줄은 **아무도 돌리지 않는 루프에 대한 주장**입니다. 규모의 맥락: DefiLlama는 **2026년 거버넌스 공격 5건, 합계 2,510만 달러**로 분류했고 그중 최대는 7월 **BonkDAO에 대한 2,000만 달러** 악성 제안이었습니다. 그리고 Term 자신도 **2025년 5월 정기 업그레이드 중 오라클 소수점 불일치로 약 150만 달러**를 잃었습니다 — 다른 실패, **같은 주제**입니다: 위험이 계속 **핵심 수식이 아니라 설정과 권한 계층**에 내려앉았다는 것.",
  },
  {
    // Hegotá 로드맵에서 EIP-8025(Optional Execution Proofs)를 보고 추가 (jay, 2026-08-24).
    // 카드가 될 값어치는 zkEVM 자체가 아니라 이름에 붙은 형용사 하나에 있다 — "optional".
    // 안전이 "모두가 더 싼 쪽을 고르지는 않는다"에 기대는 구조라, aqua-shared-liquidity 카드
    // (호가된 깊이는 먼저 온 사람에게만 실재)와 논리 형태가 같다.
    key: "l1-zkevm-optional-proofs",
    title: "L1 zkEVM — the word doing the work is \"optional\"",
    titleKo: "L1 zkEVM — 정작 일하는 단어는 '선택적'이다",
    description:
      "EIP-8025 lets a validator verify a block by checking a proof instead of re-executing it. The number nobody publishes is how many still re-execute once it is cheaper not to.",
    descriptionKo:
      "EIP-8025는 검증자가 재실행 대신 증명을 확인해 블록을 검증하게 합니다. 아무도 발표하지 않는 숫자는, 재실행이 더 비싸진 뒤에도 여전히 재실행하는 노드가 몇이나 남는가입니다.",
    status: "soon",
    howTo:
      "Not yet scoped — start by proving recent mainnet blocks with an off-the-shelf zkVM on rented GPU and plotting wall-clock proving time against gas used, then check where Glamsterdam's 200M gas target lands relative to the reveal window ePBS opens. Source: EIP-8025 (Optional Execution Proofs), targeted at the Hegotá fork and dependent on Glamsterdam's EIP-7732 and EIP-7928.",
    howToKo:
      "아직 범위 미정 — 최근 메인넷 블록들을 기성 zkVM으로(대여 GPU) 증명해 **실시간 증명 소요 대 가스 사용량** 곡선을 그리고, Glamsterdam의 **200M 가스 목표**가 ePBS가 열어주는 공개 창 대비 어디에 떨어지는지 확인하는 것부터. 출처: EIP-8025(Optional Execution Proofs), Hegotá 포크 대상이며 Glamsterdam의 EIP-7732·EIP-7928에 의존.",
    purpose:
      "Two forks make one machine, and it is worth stating the dependency plainly because the roadmap coverage rarely does. Glamsterdam sets out two chairs: ePBS (EIP-7732) supplies time, because splitting the slot seats the builder as prover and opens an interval between header commitment and payload reveal; BAL (EIP-7928) supplies partition, because a block that declares the state it will touch is a block whose proving work can be sliced across many provers. Neither alone makes a twelve-second proof possible, which is why EIP-8025 sits in Hegotá rather than in Glamsterdam. That much is architecture. The part worth a card is the adjective. These are *optional* execution proofs, and the option is the whole design: a validator may check a succinct proof of the state transition instead of running the transactions. Proof-checking has to be cheaper than re-execution or nobody takes the option, and if it is cheaper then a rational validator takes it — all of them. At that point the network's ability to notice a prover bug rests entirely on whoever is still paying more to re-execute, which is to say on validators behaving irrationally. Safety that depends on people declining a discount is the same shape this catalogue already recorded in the Aqua card, where quoted depth is real but only for whoever arrives first, and in the note on Tempo, where a single client plus a halt-rather-than-be-wrong posture turns one bug into an outage. The question is not whether the proofs are sound. It is what fraction of the network keeps the capacity to disagree with them.",
    purposeKo:
      "**두 포크가 합쳐져 하나의 기계가 됩니다.** 로드맵 기사들이 잘 짚지 않으니 의존 관계를 분명히 적어둘 값어치가 있습니다. Glamsterdam은 의자 둘을 놓습니다 — **ePBS(EIP-7732)가 시간을 주고**(슬롯이 쪼개지며 빌더가 증명자 자리에 앉고, 헤더 커밋과 페이로드 공개 사이에 구간이 생깁니다), **BAL(EIP-7928)이 분할을 줍니다**(건드릴 상태를 미리 선언한 블록은 증명 작업을 여러 증명자에게 쪼개 줄 수 있습니다). 둘 중 하나만으로는 12초 안의 증명이 성립하지 않고, 그래서 EIP-8025가 Glamsterdam이 아니라 Hegotá에 있습니다. 여기까지는 아키텍처입니다. **카드가 될 값어치는 형용사 하나에 있습니다.** 이것은 *선택적(optional)* 실행 증명이고, 그 선택이 설계의 전부입니다 — 검증자는 트랜잭션을 돌리는 대신 상태전이의 간결한 증명을 확인해도 됩니다. **증명 확인이 재실행보다 싸야만** 아무도 그 선택을 하지 않을 이유가 없고, 싸다면 **합리적인 검증자는 전부 그쪽을 고릅니다.** 그 순간 네트워크가 증명자 버그를 알아챌 능력은 **여전히 더 비싼 재실행을 하고 있는 쪽**, 즉 비합리적으로 행동하는 검증자들에게만 남습니다. **안전이 \"모두가 할인을 받지는 않는다\"에 기대는 구조** — 이 카탈로그가 이미 두 번 기록한 형태입니다. Aqua 카드에서 호가된 깊이는 실재하지만 먼저 도착한 사람에게만 실재했고, Tempo 메모에서는 단일 클라이언트에 \"틀리느니 멈춘다\"가 겹쳐 버그 하나가 곧 중단이 됐습니다. 질문은 증명이 건전한가가 아닙니다. **네트워크의 몇 퍼센트가 그 증명에 이의를 제기할 능력을 유지하는가**입니다.",
    howItWorks:
      "Mechanism first, as documented: a validator may verify a block by checking a succinct proof of the state transition rather than re-executing its transactions, with the mainnet state transition function exposed to the execution layer through an EXECUTE precompile in the EIP-8079 draft, and Native Rollups built on the same primitive. Proving is made feasible by the two Glamsterdam pieces above rather than by any change in EIP-8025 itself. Two measurements, both small enough to run without building anything. First, the window. Take a few dozen recent mainnet blocks, prove them with an off-the-shelf zkVM on a rented GPU, and plot wall-clock proving time against gas used. The output is one number and one curve: the largest block that proves inside the interval ePBS opens, and the hardware it took to get there. Set that against Glamsterdam's 200M gas target and the gap either closes or it does not, and if it does not then the option is theoretical and this card's second half is premature. Second, the discount. Price the cost of verifying a proof against the cost of re-executing the same block on a home-spec node. That ratio is the adoption rate, and the adoption rate is the erosion of re-execution coverage, so the interesting output is not the ratio itself but the fraction of stake at which nobody is left to catch a bad prover. One section belongs inside this card rather than beside it: the list. The ePBS card asked which code silently assumes the proposer knows the payload; this one asks the twin question, which code silently assumes somebody actually ran the transactions. Fraud proofs, re-org monitors, block explorers that recompute receipts, and any service that trusts a value because it saw a node produce it are all candidates, and the list is cheap to write now and expensive to write during a testnet.",
    howItWorksKo:
      "먼저 문서화된 동작 방식: 검증자는 트랜잭션을 재실행하는 대신 **상태전이의 간결한 증명을 확인**해 블록을 검증할 수 있고, 메인넷 상태전이함수는 **EIP-8079 초안의 `EXECUTE` 프리컴파일**로 실행 계층에 노출되며 Native Rollups도 같은 원시 기능 위에 섭니다. 증명이 가능해지는 것은 EIP-8025 자체의 변경이 아니라 **위의 Glamsterdam 두 조각 덕분**입니다. **측정은 둘이고, 둘 다 아무것도 만들지 않고 돌릴 만큼 작습니다.** **첫째, 창(window).** 최근 메인넷 블록 수십 개를 대여 GPU 위 기성 zkVM으로 증명하고, **실시간 증명 소요를 가스 사용량에 대해** 그립니다. 산출물은 숫자 하나와 곡선 하나입니다 — **ePBS가 여는 구간 안에 증명이 끝나는 최대 블록**, 그리고 거기까지 든 하드웨어. 그것을 Glamsterdam의 200M 가스 목표에 대보면 간격이 닫히거나 닫히지 않고, 닫히지 않으면 그 선택지는 아직 이론이며 이 카드의 후반부는 시기상조입니다. **둘째, 할인율.** 같은 블록을 가정용 사양 노드에서 재실행하는 비용과 증명을 검증하는 비용을 견줍니다. **그 비율이 곧 채택률이고, 채택률이 곧 재실행 커버리지의 침식**이라, 흥미로운 산출물은 비율 자체가 아니라 **나쁜 증명자를 잡을 사람이 아무도 남지 않게 되는 지분 비율**입니다. 한 섹션은 옆에 두지 말고 이 카드 **안에** 넣습니다: **목록.** ePBS 편이 \"어떤 코드가 제안자가 페이로드를 안다고 암묵 가정하는가\"를 물었다면, 이 편은 그 쌍둥이 질문을 묻습니다 — **어떤 코드가 누군가 실제로 트랜잭션을 돌렸다고 암묵 가정하는가.** 사기 증명, 리오그 감시, 영수증을 재계산하는 익스플로러, 그리고 어떤 값을 \"노드가 만들어내는 것을 봤으니\" 믿는 모든 서비스가 후보이고, **이 목록은 지금 쓰면 싸고 테스트넷 도중에 쓰면 비쌉니다.**",
  },
  {
    // 1inch Aqua 공개(2026-07-27)를 계기로 추가 (jay, 2026-08-17). 광고 문구 한 줄에서
    // 출발했지만 카드가 될 값어치는 그 아래 있다 — "토큰이 지갑에 남는다"는 자기수탁 이야기가
    // 아니라 호가와 체결 가능성이 분리된다는 이야기다. stake-concentration 카드와 논리 구조가
    // 같다(겉보기 독립 단위 N개 vs 실제 독립성의 단위).
    // done 으로 전환 (jay, 2026-08-21). 배열 위치는 그대로 두었다 — soon 이던 시절엔 무날짜
    // 카드라 배열 순서가 곧 렌더 순서였지만, done 은 date 로 정렬되므로 이제 배열 위치가
    // 렌더에 아무 영향이 없다. 큰 블록을 옮겨 diff 를 키울 이유가 없다.
    key: "aqua-shared-liquidity",
    title: "Shared liquidity — quoted depth vs. the balance behind it",
    titleKo: "공유 유동성 — 호가된 깊이와 그 뒤의 잔고",
    description:
      "1inch Aqua leaves LP tokens in the wallet and lets one balance quote across many positions. The number nobody publishes is how much of that quoted depth is actually fillable.",
    descriptionKo:
      "1inch Aqua는 LP 토큰을 지갑에 둔 채 하나의 잔고로 여러 포지션이 호가하게 합니다. 아무도 발표하지 않는 숫자는 그 호가된 깊이 중 실제로 체결 가능한 몫입니다.",
    status: "done",
    date: "2026-08-21", // 완결 선언일 — done 카드의 정렬 기준
    howTo:
      "Separating quoted depth from fillable depth: why one balance backing three positions advertises 3× the liquidity it can settle, and who pays to find out. Source: 1inch.com/aqua/learn, public launch 2026-07-27 across 13 chains.",
    howToKo:
      "호가된 깊이와 체결 가능한 깊이를 분리해 보기 — 잔고 하나가 포지션 셋을 받치면 왜 결제 가능한 양의 3배가 광고되는지, 그리고 그걸 알아내는 비용은 누가 무는지. 출처: 1inch.com/aqua/learn, 2026-07-27 13개 체인 공개.",
    purpose:
      "The pitch is self-custody — tokens never leave the wallet, no deposit, no debt — and all of that is true. The part worth a card is what the design trades away to get it.\n\nTwo sentences from Aqua's own documentation, placed next to each other:\n\n| Aqua's documentation says | What it implies |\n|---|---|\n| A swap \"simply reverts\" if the balance is too low at that moment | The quote is conditional, not a commitment |\n| A $100,000 balance backs three positions that collectively quote $300,000 | Advertised depth can be 3× settleable depth |\n\nTogether they turn quoted depth from a commitment into an **upper bound** — real, but only for whoever arrives first.\n\nThat is the same shape as this catalogue's `stake-concentration` card: a set that looks like N independent units while the actual unit of independence is smaller, moved from validators to order books. The question is not whether Aqua is safe for the LP — it is, and the LP is the party the revert protects — but **what it costs the taker**, who pays gas to discover that advertised liquidity was already spent.",
    purposeKo:
      "홍보 문구는 자기수탁입니다 — 토큰은 지갑을 떠나지 않고, 예치도 부채도 없다. 전부 사실입니다. 카드가 될 값어치는 **그것을 얻기 위해 무엇을 내주었는가**에 있습니다.\n\nAqua 자체 문서의 두 문장을 나란히 놓으면:\n\n| Aqua 문서가 말하는 것 | 함의 |\n|---|---|\n| 그 순간 잔고가 부족하면 스왑은 \"그냥 revert 된다\" | 호가는 약속이 아니라 조건부다 |\n| 10만 달러 잔고가 세 포지션을 받치며 합계 30만 달러를 호가한다 | 광고된 깊이가 결제 가능한 깊이의 3배일 수 있다 |\n\n둘을 합치면 호가된 깊이는 약속이 아니라 **상한**이 됩니다 — 실재하지만 먼저 도착한 쪽에게만.\n\n이 카탈로그의 `stake-concentration` 카드와 형태가 같습니다: 겉보기엔 독립 단위 N개인데 실제 독립성의 단위는 더 작다는 것 — 검증인에서 오더북으로 옮겼을 뿐입니다. 질문은 Aqua가 LP에게 안전한가가 아니라(안전합니다. revert로 보호받는 쪽이 LP입니다) **taker에게 얼마인가**입니다. 이미 소진된 유동성이 광고되어 있었다는 사실을 가스를 내고 알게 되는 쪽이니까요.",
    howItWorks:
      "### Mechanism, as documented\n\nThe LP grants a **revocable allowance** rather than depositing. Several positions are configured against that one allowance, and when a matching order arrives the SwapVM engine pulls tokens straight from the wallet and pushes back proceeds plus fees in a single atomic transaction.\n\nNothing is borrowed. The allowance is a **permission cap, not an escrow**, so the balance is checked at execution and the swap reverts if it has moved.\n\n### The gap the public documentation leaves\n\nWhat the docs do not describe is what happens when **two orders draw on the same balance at once**. That is the hole this card aims at.\n\n### The measurement\n\nSmall enough to run locally, on an anvil fork:\n\n1. Stand up one wallet with three positions quoting a combined 3× its balance.\n2. Submit competing orders **in the same block**.\n3. Sweep the balance down through 90%, 50% and 10% of quoted depth.\n\nOutput:\n\n- A curve of **realized depth over advertised depth**\n- The **revert rate**\n- The **gas a taker burns on the failures**\n\nIt is the argument `stake-concentration` makes with a Herfindahl index, made here with a fill rate.\n\n### Withdrawal-authority comparison\n\n\"Funds stay in the wallet and are pulled when needed\" is the primitive the AA and AP2 cards already build with, so Aqua's approve-and-pull belongs beside its siblings rather than in a card of its own:\n\n| Model | What can be revoked | What the approval leaks while live | Cost to revoke |\n|---|---|---|---|\n| **Aqua approve-and-pull** | The allowance, any time | A standing right to pull up to the cap | One transaction |\n| **Permit2 signature** | Per-signature, time-boxed | Only what the signature scopes | Expiry, usually free |\n| **ERC-4337 session key** | The session, by the owner | Whatever the session's policy permits | One transaction |\n\nAqua is the case where the approval is **deliberately long-lived**, which is exactly why the revert path carries so much weight.\n\n### Market microstructure: who bears adverse selection\n\n*Added 2026-08-21 (jay).* The card's real subject is not liquidity accounting — it is **who carries adverse-selection risk**, and a prediction market is where that question gets sharpest.\n\nAn order book is two lines. Someone offers at $101, someone bids $100, and the $1 between them is the only thing that pays a maker. It pays for **one specific risk**. Of the people who trade against a resting quote, some are uninformed — a pension rebalancing, someone who simply needs the position today — and some know something. The informed always pick the correct side: if the price is about to rise they buy from the maker, so the maker has just sold something that went up.\n\n```\nmaker P&L = (what the uninformed pay) − (what the informed take)\n```\n\nThe spread is the price of that risk. That is **adverse selection**, and it is the first concept in market microstructure rather than a footnote to it.\n\n### One spread is really four numbers\n\n| Measure | Meaning | Whose number |\n|---|---|---|\n| **Quoted** | What the screen advertises | Marketing |\n| **Effective** | What the taker actually paid, after walking up the book | The taker's real cost |\n| **Realized** | What the maker still had once the price finished moving | The maker's real revenue |\n| **Effective − Realized** | The money that went to the informed | The adverse-selection cost |\n\nThis card's whole thesis is a statement about **the first of those four**.\n\n### What equity HFT did about it — cancellation\n\nThe answer was to stop standing still: quote, then cancel in milliseconds, so a faster trader cannot hit a stale price. The measurable residue is **quote life** in milliseconds, **quote-to-trade ratios** in the hundreds, and a book that looks deep and is not — **phantom liquidity**, the same phenomenon this card began from.\n\n### Aqua's revert is that cancellation, rebuilt on-chain\n\nAnd it is worse for the taker in one specific way:\n\n| | Equity HFT | Aqua |\n|---|---|---|\n| Quote disappears before you hit it | You simply did not trade | The transaction reverts |\n| **Cost to the taker** | **Zero** | **Gas, plus whatever the price did meanwhile** |\n\nSame defence, same side effect — but the cost of the failed attempt moved from zero to non-zero. **That asymmetry, not the reverts themselves, is what makes this worth measuring.**\n\n### Two corrections to how this card framed Aqua\n\n**Aqua was never trying to solve adverse selection.** It solves capital problems:\n\n| Problem | Conventional | Aqua |\n|---|---|---|\n| Custody risk | Deposit into a pool or exchange | Stays in the wallet; allowance only |\n| Capital efficiency | Capital locked per position | One balance backs several positions |\n| Deposit friction | Deposit and withdraw transactions | None |\n\n**But on adverse selection it does do one real thing, and it does it for the maker: it gives the LP an exit.** An AMM LP cannot refuse — when the price moves the pool is picked off, which is LVR, and the pool has no right to say no. An Aqua LP withdraws the balance and the quotes die instantly. Maker exposure genuinely improves relative to an AMM.\n\nThe trouble is that this protection is precisely the taker's problem. **The risk was not removed. It was moved from maker to taker.**\n\n### Certainty — the axis that actually separates them\n\n| | AMM (LMSR, CPMM) | Aqua |\n|---|---|---|\n| Can the maker walk away? | No | Yes — withdraw the balance |\n| Maker loss | Unbounded (LVR), or capped at `b` | Limited |\n| **Taker certainty** | **Always fills** | **May not fill** |\n\nAn AMM always fills and **the maker pays for that**. Aqua may not fill and **the taker pays**.\n\n### Why prediction markets are the extreme case\n\nAdverse selection is more severe there than almost anywhere, for a structural reason. Equities let people hold genuinely different opinions about a company. A prediction market **resolves to 0 or 1** — there is exactly one right answer, so the informed side wins cleanly.\n\nLeft alone, a prediction-market maker goes broke. That is why **LMSR** exists: Hanson's scoring rule does not remove adverse selection, its parameter `b` **caps** it, declaring the operator's maximum loss in advance and buying continuous liquidity with that subsidy.\n\nSo LMSR versus CLOB is not a technology preference. It is the question of **who carries the risk**:\n\n| | LMSR (AMM) | CLOB (order book) |\n|---|---|---|\n| Liquidity | Always present — the curve quotes | Only if someone posts |\n| Adverse selection | Bounded by the operator's `b` | Each maker defends with their own spread |\n| A brand-new market | Tradable immediately | **Empty** — the cold-start problem |\n| Cost | Operator subsidises up to `b` | Zero to the operator |\n\nPolymarket runs a CLOB. Verex runs **LMSR quote centres inside a CLOB** (`packages/api/src/lmsr.ts`, `mm.ts`) — a deliberate position between the two.\n\n**Which is why Aqua's trade is the wrong one for a prediction market.** Betting demand concentrates immediately before an event — exactly the moment the market is most volatile and an LP most wants to pull its balance. A fill that does not happen at that moment is not read by a user as thin liquidity; it is read as a broken site. Prediction markets buy taker certainty, and Aqua's capital efficiency is paid for by selling exactly that.\n\n### The unverified question that outranks the measurement\n\n**Is there any penalty for an LP whose orders revert often?**\n\n- If there is not, there is no incentive to quote honestly — quote wide, pull when it gets dangerous, and that strategy dominates.\n- If there is, that penalty is the design's real defence and everything else is decoration.\n\nThe public documentation does not say. **This should come before the anvil experiment above, not after it** — the single question tells you whether the design works faster than any fill-rate curve does.",
    howItWorksKo:
      "### 문서화된 동작 방식\n\nLP는 예치하지 않고 **취소 가능한 allowance**만 부여합니다. 그 하나의 allowance 위에 여러 포지션이 설정되고, 조건에 맞는 주문이 오면 SwapVM 엔진이 지갑에서 토큰을 곧바로 당겨가 대금과 수수료를 한 번의 원자적 트랜잭션으로 되돌려줍니다.\n\n빌리는 것은 없습니다. allowance는 에스크로가 아니라 **권한 상한**이라, 잔고는 실행 시점에 확인되고 그사이 움직였다면 스왑은 revert 됩니다.\n\n### 공개 문서가 남긴 빈칸\n\n문서가 설명하지 않는 것은 **두 주문이 같은 잔고를 동시에 노릴 때** 무슨 일이 벌어지는가입니다. 이 카드가 겨누는 자리가 거기입니다.\n\n### 측정\n\nanvil 포크에서 로컬로 돌릴 만큼 작습니다:\n\n1. 지갑 하나에 그 잔고의 3배를 합산 호가하는 포지션 셋을 세운다.\n2. **같은 블록에** 경합하는 주문을 넣는다.\n3. 잔고를 호가 대비 90%·50%·10%로 낮춰가며 훑는다.\n\n산출물:\n\n- **광고된 깊이 대비 실현된 깊이 곡선**\n- **revert 비율**\n- **taker가 실패에 태우는 가스**\n\n`stake-concentration` 카드가 허핀달 지수로 하는 논증을, 여기서는 체결률로 하는 셈입니다.\n\n### 인출 권한 모델 비교\n\n\"자금은 지갑에 두고 필요할 때 당겨간다\"는 것은 AA·AP2 카드가 이미 다루는 원시 기능이라, Aqua의 approve-and-pull은 따로 둘 것이 아니라 형제들 옆에 놓아야 합니다:\n\n| 모델 | 무엇을 취소할 수 있나 | 승인이 살아 있는 동안 노출되는 것 | 취소 비용 |\n|---|---|---|---|\n| **Aqua approve-and-pull** | allowance, 언제든 | 상한까지 당겨갈 상시 권한 | 트랜잭션 한 건 |\n| **Permit2 서명** | 서명 단위, 기간 한정 | 그 서명이 정한 범위만 | 만료, 대개 무료 |\n| **ERC-4337 세션키** | 세션 단위, 오너가 | 세션 정책이 허용하는 범위 | 트랜잭션 한 건 |\n\nAqua는 승인이 **의도적으로 오래 살아 있는** 경우이고, 바로 그래서 revert 경로에 그토록 많은 무게가 실립니다.\n\n### 시장미시구조 — 역선택을 누가 지느냐\n\n*2026-08-21 추가 (jay).* 이 카드의 진짜 주제는 유동성 회계가 아니라 **역선택 위험을 누가 지느냐**이고, 그 질문이 가장 날카로워지는 곳이 예측시장입니다.\n\n오더북은 두 줄입니다. 누군가 $101에 팔겠다 하고 누군가 $100에 사겠다 하며, 그 사이 $1이 메이커에게 돌아가는 유일한 몫입니다. 그 $1은 **하나의 위험**에 대한 값입니다. 걸려 있는 호가를 때리는 사람은 둘로 갈립니다 — **정보가 없는 쪽**(연금 리밸런싱, 오늘 당장 포지션이 필요한 사람)과 **정보가 있는 쪽**. 그리고 정보 있는 쪽은 **항상 옳은 방향을 고릅니다.** 곧 오를 걸 알면 메이커에게서 사고, 메이커는 방금 오를 물건을 팔아버린 겁니다.\n\n```\n메이커 손익 = (정보 없는 쪽에게 번 것) − (정보 있는 쪽에게 잃은 것)\n```\n\n스프레드는 그 위험의 값입니다. 이것이 **역선택(adverse selection)**이며, 시장미시구조의 각주가 아니라 1번 개념입니다.\n\n### 하나의 스프레드는 실은 네 개의 숫자\n\n| 지표 | 뜻 | 누구의 숫자 |\n|---|---|---|\n| **Quoted** | 화면이 광고하는 것 | 마케팅 |\n| **Effective** | 테이커가 호가창을 위로 먹으며 실제로 낸 값 | 테이커의 진짜 비용 |\n| **Realized** | 가격이 다 움직인 뒤 메이커에게 남은 몫 | 메이커의 진짜 수익 |\n| **Effective − Realized** | 정보에게 넘어간 돈 | 역선택 비용 |\n\n이 카드의 논지 전체가 **그 넷 중 첫 번째에 대한 진술**입니다.\n\n### 주식 HFT가 내놓은 답 — 취소\n\n**가만히 서 있지 않는 것**이었습니다. 호가를 걸고 밀리초 안에 취소해, 나보다 빠른 자가 낡은 호가를 때리지 못하게. 측정 가능한 잔여물이 밀리초 단위 **quote life**, 수백 대 1의 **quote-to-trade ratio**, 그리고 깊어 보이지만 잡히지 않는 호가창 — **phantom liquidity**, 이 카드가 출발한 바로 그 현상입니다.\n\n### Aqua의 revert는 그 취소를 온체인에서 다시 만든 것\n\n그리고 한 가지 점에서 테이커에게 더 나쁩니다:\n\n| | 주식 HFT | Aqua |\n|---|---|---|\n| 때리기 전에 호가가 사라지면 | 그냥 거래를 못 한 것 | 트랜잭션이 revert |\n| **테이커 비용** | **0** | **가스 + 그사이 움직인 가격** |\n\n같은 방어, 같은 부작용 — 그런데 **실패한 시도의 비용이 0에서 0이 아닌 값으로 옮겨갔습니다.** revert 자체가 아니라 **이 비대칭**이 측정할 값어치를 만듭니다.\n\n### 이 카드가 Aqua를 보던 틀에 정정 둘\n\n**Aqua는 애초에 역선택을 풀려던 물건이 아닙니다.** 푸는 것은 **자본**의 문제입니다:\n\n| 문제 | 기존 방식 | Aqua |\n|---|---|---|\n| 수탁 위험 | 풀·거래소에 예치 | 지갑에 그대로, allowance만 |\n| 자본 효율 | 포지션마다 자본을 따로 묶음 | 잔고 하나가 여러 포지션을 받침 |\n| 예치 마찰 | 입금·출금 트랜잭션 | 없음 |\n\n**다만 역선택에 대해 실제로 하는 일이 하나 있고, 그건 메이커 쪽입니다 — LP에게 탈출구를 줍니다.** AMM의 LP는 **거절할 수 없습니다.** 가격이 움직이면 풀이 그대로 뜯기고(그것이 **LVR**), 풀에는 아니라고 말할 권한이 없습니다. Aqua의 LP는 잔고를 빼면 호가가 즉시 죽습니다. 메이커의 역선택 노출은 AMM보다 **실제로 낫습니다.**\n\n문제는 그 보호가 정확히 테이커의 문제라는 것입니다. **위험이 사라진 게 아니라 메이커에서 테이커로 옮겨갔습니다.**\n\n### 확실성 — 둘을 실제로 가르는 축\n\n| | AMM (LMSR·CPMM) | Aqua |\n|---|---|---|\n| 메이커가 도망칠 수 있나 | ❌ 못 함 | ✅ 잔고 빼면 끝 |\n| 메이커 손실 | 무제한(LVR) 또는 `b` 상한 | 제한적 |\n| **테이커 확실성** | **항상 체결됨** | **체결 안 될 수 있음** |\n\nAMM은 **항상 체결되고 그 값을 메이커가** 치릅니다. Aqua는 **체결이 안 될 수 있고 그 값을 테이커가** 치릅니다.\n\n### 예측시장이 극단인 이유\n\n예측시장의 역선택은 거의 어디보다 심한데 이유가 **구조적**입니다. 주식은 \"이 회사가 좋다\"에 대해 사람마다 의견이 다를 수 있지만, 예측시장은 **0 아니면 1로 끝납니다.** 정답이 정확히 하나라서 **정보를 가진 쪽이 깨끗하게 이깁니다.**\n\n그냥 두면 예측시장 메이커는 파산하고, 그래서 **LMSR**이 존재합니다. 핸슨의 스코어링 룰은 역선택을 **없애지 않고** 파라미터 `b`로 **상한을 씌웁니다** — 운영자의 최대 손실을 미리 선언하고 그 보조금으로 끊기지 않는 유동성을 사는 것입니다.\n\n따라서 LMSR이냐 CLOB이냐는 기술 취향이 아니라 **위험을 누가 지느냐**의 질문입니다:\n\n| | LMSR (AMM) | CLOB (오더북) |\n|---|---|---|\n| 유동성 | **항상 있음** — 수식이 호가 | 사람이 걸어야 있음 |\n| 역선택 | 운영자의 `b`로 상한 | 메이커가 각자 스프레드로 방어 |\n| 새로 만든 시장 | 바로 거래 가능 | **텅 빔** — 부트스트랩 문제 |\n| 비용 | 운영자가 `b`만큼 보조금 | 운영자에게 0 |\n\nPolymarket은 CLOB을 돌리고, Verex는 **CLOB 안에 LMSR 호가 중심**을 넣었습니다(`packages/api/src/lmsr.ts`, `mm.ts`) — 둘 사이의 의도된 자리입니다.\n\n**그래서 Aqua의 교환은 예측시장에 맞지 않습니다.** 베팅 수요는 **이벤트 직전에 몰립니다** — 시장이 가장 격변하고 LP가 가장 잔고를 빼고 싶은 바로 그 순간입니다. 그 순간의 미체결을 사용자는 \"유동성이 얇았네\"로 읽지 않고 **\"이 사이트 안 되네\"로 읽습니다.** 예측시장은 **테이커 확실성을 사는** 구조이고, Aqua의 자본 효율은 정확히 그것을 팔아서 산 것입니다.\n\n### 측정보다 앞서는 미확인 질문\n\n**revert가 잦은 LP에게 페널티가 있습니까?**\n\n- 없다면 호가를 정직하게 유지할 유인이 없습니다 — 넓게 걸어두고 위험하면 빼는 전략이 **항상 우세**합니다.\n- 있다면 **그 페널티가 이 설계의 진짜 방어선**이고 나머지는 장식입니다.\n\n공개 문서에는 이 부분이 없습니다. **이것은 위의 anvil 실험보다 먼저 와야 합니다** — 이 질문 하나가 어떤 체결률 곡선보다 설계의 성패를 빨리 알려줍니다.",
  },
  {
    // Google Cloud × Solana 에이전틱 커머스 해커톤(2026-08) 출품작을 가정하고 설계한 항목
    // (jay, 2026-08-17). 이 카탈로그에서 드문 형태다 — 남의 글을 읽고 빈칸을 찾은 것도, 사고를
    // 정리한 것도 아니고 **만들 물건의 설계**다. 그래서 soon 묶음 앞쪽(7번)에 둔다.
    // AP2·AA·price-at-a-moment 세 카드가 만나는 지점이라 새 주제가 아니라 수렴점에 가깝다.
    key: "agentic-intent-veto",
    title: "The budget is the wrong invariant",
    titleKo: "한도는 틀린 불변식이다",
    description:
      "A spend cap constrains the amount, not the purchase. An agent that spends $50 of its $100 on the wrong thing passed every check — and on-chain there is no chargeback behind it.",
    descriptionKo:
      "한도는 금액을 제약하지 구매를 제약하지 않습니다. $100 중 $50을 엉뚱한 것에 쓴 에이전트는 모든 검사를 통과한 것이고, 온체인에는 그 뒤를 받칠 차지백이 없습니다.",
    status: "done",
    date: "2026-08-24", // 완결 선언일 — done 카드의 정렬 기준
    howTo:
      "Why a spend cap is the wrong thing to bound: an agent that spends $50 of its $100 on the wrong item passed every check, and on-chain there is no chargeback behind it. Designed as a hackathon entry (Google Cloud × Solana agentic commerce, 2026-08); the hostile-merchant case is the argument, not a step toward it.",
    howToKo:
      "왜 한도가 묶어야 할 대상이 아닌가 — 100달러 중 50달러를 엉뚱한 것에 쓴 에이전트는 모든 검사를 통과했고, 온체인에는 그 뒤를 받쳐 줄 지급거절이 없습니다. 해커톤 출품작을 가정해 설계했고(Google Cloud × Solana 에이전틱 커머스, 2026-08), 적대적 판매자 사례는 논증으로 가는 단계가 아니라 논증 그 자체입니다.",
    purpose:
      "Autonomous payments are almost always secured with a spend cap, and the cap is the wrong invariant. An agent given $100 that spends $50 on the wrong item has violated nothing — the session key worked, the limit held, the signature verified. The failure that matters is not overspend but wrong spend inside the limit, and unlike a card payment there is no chargeback sitting behind it. So this card is a design for fixing the invariant rather than tightening the cap, written as if entering the Google Cloud × Solana agentic-commerce hackathon, where the stated theme (an agent that settles and signs without human approval inside a budget) all but guarantees that most entries demonstrate the happy path of exactly the mechanism this one argues is insufficient. The competition is not the point; the point is that the strongest form of this argument is a demo in which the audience watches a conventional agent pass every check and lose the money anyway.",
    purposeKo:
      "자율 결제는 거의 항상 지출 한도로 보호되는데, **한도는 틀린 불변식**입니다. $100을 받은 에이전트가 엉뚱한 물건에 $50을 썼다면 위반한 것이 하나도 없습니다 — 세션키는 동작했고, 한도는 지켜졌고, 서명은 검증됐습니다. 중요한 실패는 초과지출이 아니라 **한도 안에서의 잘못된 지출**이고, 카드 결제와 달리 그 뒤에는 차지백이 없습니다. 그래서 이 카드는 한도를 더 조이는 대신 **불변식을 갈아 끼우는** 설계이고, Google Cloud × Solana 에이전틱 커머스 해커톤에 출품한다는 가정으로 썼습니다. 그 대회의 주제(예산 안에서 사람 승인 없이 정산·서명하는 에이전트) 자체가, 대부분의 출품작이 **바로 이 카드가 불충분하다고 주장하는 메커니즘의 해피패스**를 시연하게 만들기 때문입니다. 대회가 요점은 아닙니다. 요점은 이 논증의 가장 강한 형태가 **관객이 평범한 에이전트가 모든 검사를 통과하고도 돈을 잃는 것을 지켜보는 데모**라는 것입니다.",
    howItWorks:
      "Two mechanisms, and the second is the one that will draw fire. First: sign the intent, not the limit. Before the agent sees any merchant content, a commitment is issued to (item class, max unit price, max quantity, merchant allowlist, expiry), and the on-chain program checks settlement against that commitment rather than against a balance — so an agent whose context is poisoned after the commitment was made cannot settle a purchase that does not match what it committed to wanting. That is AP2's Intent Mandate / Cart Mandate split moved onto Solana; the AP2 card already builds the same separation, so the new part is enforcement at settlement rather than the mandate concept. Second: a veto window on settlement. Between authorization and final settlement sits a short interval — 30 to 60 seconds — in which a separate low-privilege watcher key can cancel, with the privileges deliberately disjoint: the agent cannot cancel its own payments and the watcher cannot spend. This is the price-at-a-moment card's claim about liquidations — an action that fires with zero delay removes the only interval in which a bad input could have been noticed — applied to payments instead of oracles. The demo runs the same agent twice against a merchant API carrying a prompt injection: on a plain session key the limit holds, the purchase is wrong and the money is gone; on these rails settlement fails on the intent mismatch rather than on the amount. Two questions get asked of every entry, so answer them in the design. Sub-second finality is what makes a 30-second veto window a product decision rather than an artifact of block time — on a slower chain that window is indistinguishable from ordinary confirmation latency, and the product does not exist. And the commitment issuer and the watcher have to live somewhere the agent cannot reach, which makes them a policy service with an audit log rather than anything on-chain: enforce on-chain, decide off-chain, the same split the CRE × Cloud card arrives at from the other direction. The objection to answer first, because a payments audience raises it immediately, is that no merchant wants to wait 30 seconds for finality — and the answer is that card networks already made this trade and gave it a name. Authorization is instant, capture is later. This is auth-and-capture rebuilt for agents rather than a new tradeoff, which is also where the rwa-multichain card lands coming the other way: authorize against a limit now, reconcile after. Scope if built: one Solana program (commitment check, timelocked settlement, watcher cancel), a deliberately hostile merchant API, and a Cloud Run policy service. No wallet UI, no multichain, no token — nothing that does not appear in the demo.",
    howItWorksKo:
      "메커니즘은 둘이고, 공격을 받을 쪽은 두 번째입니다. **첫째, 한도가 아니라 의도에 서명합니다.** 에이전트가 판매자 콘텐츠를 보기 **전에** `(품목 클래스, 최대 단가, 최대 수량, 판매자 allowlist, 만료)` 커밋을 발행하고, 온체인 프로그램은 정산을 잔고가 아니라 **그 커밋과** 대조합니다 — 커밋 이후에 컨텍스트가 오염된 에이전트는 자기가 원한다고 커밋한 것과 다른 구매를 정산할 수 없습니다. 이것은 AP2의 Intent Mandate / Cart Mandate 분리를 솔라나로 옮긴 것입니다. AP2 카드가 이미 같은 분리를 만들고 있으므로 **새로운 부분은 만다트 개념이 아니라 정산 시점의 강제**입니다. **둘째, 정산에 거부권 창을 둡니다.** 승인과 최종 정산 사이에 30~60초의 짧은 구간을 두고 그 안에서 **별도의 저권한 감시 키**가 취소할 수 있게 하되, 권한을 의도적으로 서로소로 나눕니다 — 에이전트는 자기 결제를 취소하지 못하고, 감시자는 지출하지 못합니다. 이것은 `price-at-a-moment` 카드가 청산에 대해 한 주장(지연 0으로 발사되는 동작은 잘못된 입력을 알아챌 수 있었던 유일한 구간을 없앤다)을 오라클이 아니라 **결제에** 적용한 것입니다. 데모는 프롬프트 인젝션이 실린 판매자 API에 대고 **같은 에이전트를 두 번** 돌립니다: 평범한 세션키에서는 한도가 지켜지고 구매는 틀렸고 돈은 사라지며, 이 레일 위에서는 금액이 아니라 **의도 불일치로** 정산이 실패합니다. 모든 출품작이 받는 질문 둘은 설계 안에서 답해 둡니다. **서브초 파이널리티**가 30초 거부권 창을 블록타임의 부산물이 아니라 **제품 결정**으로 만듭니다 — 느린 체인에서는 그 창이 평범한 확정 지연과 구분되지 않고, 그러면 제품이 성립하지 않습니다. 그리고 커밋 발행자와 감시자는 **에이전트가 닿을 수 없는 곳**에 있어야 하므로 온체인이 아니라 감사 로그를 가진 정책 서비스가 됩니다 — 강제는 온체인, 판단은 오프체인. CRE × Cloud 카드가 반대 방향에서 도달한 그 분리입니다. 결제 쪽 청중이 즉시 제기하므로 먼저 답해야 할 반론은 **\"어느 판매자가 파이널리티를 30초 기다리느냐\"**이고, 답은 **카드망이 이미 이 거래를 했고 이름까지 붙여 두었다**는 것입니다. 승인은 즉시, 매입은 나중. 이것은 새로운 트레이드오프가 아니라 **auth/capture를 에이전트용으로 다시 만든 것**이고, `rwa-multichain` 카드가 반대편에서 도달한 지점이기도 합니다(지금 한도에 대해 승인하고 나중에 대사). 만든다면 범위는: 솔라나 프로그램 하나(커밋 대조 + 타임락 정산 + 감시자 취소), 의도적으로 적대적인 판매자 API, Cloud Run 정책 서비스. 지갑 UI도, 멀티체인도, 토큰도 없습니다 — 데모에 나오지 않는 것은 전부 만들지 않습니다.",
  },
  {
    // agentic-intent-veto 바로 뒤에 두었다 (jay, 2026-08-18). 그 카드가 "LLM은 결정하고
    // 결정론적 층이 경계를 강제한다"를 설계로 주장한 것이라면, Senpi 는 같은 구조를 실제
    // 자본으로 운영 중인 사례다 — 게다가 senpi-skills 가 오픈소스라 읽을 수 있다.
    // rabbit 자신의 current-plan D5("데모는 결정론으로")와도 같은 결론이라, 남의 구현으로
    // 그 선택을 검증해 볼 자리다.
    key: "senpi-harness",
    title: "The harness, not the model",
    titleKo: "모델이 아니라 하네스",
    description:
      "Senpi runs autonomous agents on real capital by wrapping a tuned model in deterministic risk machinery. The interesting artefact is the wrapper, and it is open source.",
    descriptionKo:
      "Senpi 는 튜닝된 모델을 결정론적 리스크 기계로 감싸 실제 자본 위에서 자율 에이전트를 돌립니다. 흥미로운 산출물은 그 감싸개이고, 그게 오픈소스입니다.",
    status: "soon",
    howTo:
      "Not yet scoped — read `github.com/Senpi-ai/senpi-skills` and separate, line by line, what the model decides from what the deterministic layer refuses. Source: senpi.ai and resources.senpi.ai/learn.",
    howToKo:
      "아직 범위 미정 — `github.com/Senpi-ai/senpi-skills` 를 읽고 **모델이 정하는 것**과 **결정론적 층이 거부하는 것**을 줄 단위로 갈라내는 것부터. 출처: senpi.ai, resources.senpi.ai/learn.",
    purpose:
      "Senpi describes its Samurai model as \"a harness — a disciplined stack that wraps a market-tuned AI model in deterministic execution and risk machinery, so an autonomous agent can trade real capital without hallucinating a position or forgetting a stop.\" That is the same conclusion this catalogue reached twice from the other direction: the agentic-intent-veto card argues the bound has to be enforced outside the agent, and this repo's own plan settles D5 the same way — deterministic decision for the demo, because an LLM in the decision path makes the safety claim harder to state rather than easier. So the reason to study Senpi is not that it is an AI trading product; it is that someone is running that architecture against real money, and the wrapper is published as `senpi-skills` with 80+ strategy templates. A design argument that has a live counterexample-or-confirmation available in source form is worth more than another design argument. The specific thing to extract: which invariants does the deterministic layer actually enforce, and which ones does it merely document?",
    purposeKo:
      "Senpi 는 자사 Samurai 모델을 **\"하네스 — 시장에 맞춰 튜닝한 AI 모델을 결정론적 실행·리스크 기계로 감싼 규율 있는 스택이라, 자율 에이전트가 포지션을 환각하거나 스탑을 잊지 않고 실제 자본을 굴릴 수 있게 한다\"**고 설명합니다. 이 카탈로그가 반대 방향에서 두 번 도달한 결론과 같습니다 — `agentic-intent-veto` 카드는 **경계는 에이전트 바깥에서 강제되어야 한다**고 주장했고, 이 저장소 자신의 계획도 D5를 같은 방식으로 정리했습니다(데모의 결정은 결정론으로 — 결정 경로에 LLM이 들어가면 안전성 주장이 쉬워지는 게 아니라 어려워지므로). 그래서 Senpi를 볼 이유는 AI 트레이딩 제품이라서가 아닙니다. **누군가 그 아키텍처를 진짜 돈 위에서 돌리고 있고, 그 감싸개가 `senpi-skills` 로 80개 넘는 전략 템플릿과 함께 공개돼 있기 때문**입니다. 소스 형태로 확인 가능한 반례 혹은 확증이 존재하는 설계 논증은, 또 하나의 설계 논증보다 값어치가 큽니다. 뽑아낼 것은 하나로 좁힙니다: **결정론적 층이 실제로 강제하는 불변식은 무엇이고, 무엇은 문서로만 적혀 있는가?**",
    howItWorks:
      "Four things to check, in the order that makes each one cheap. First, the enforced set: Senpi states that margin, notional and leverage limits **reject any signal that would breach them**, and that position size scales off live account margin and the signal's own score rather than a fixed lot. A rejecting bound is exactly the shape the intent-veto card wanted, so the job is to find it in `senpi-skills` and see whether rejection happens before or after the model has already committed to a size. Second, the unit problem, which is the sharpest detail in the whole product: TP/SL are **margin-relative, not price-relative**, so at 10x a stated 10% take-profit fires on a 1% price move. The number is not wrong and the unit is not the one most people read — the same failure mode as a spend cap that constrains the amount but not the purchase. It is trivially measurable: sweep leverage, plot stated percentage against realized price move, and the gap is the answer. Third, isolation: each strategy gets its own sub-wallet, cross-margined internally so positions can hedge, isolated externally. That is a testable claim rather than a slogan — does a liquidation inside strategy A reach strategy B's margin, and is the isolation enforced by separate accounts on Hyperliquid or only by the application? Fourth, the custody tension worth naming honestly: keys are sharded across secure enclaves with SOC 2 and three external audits, and users can **export keys at any time**. Both are good properties and they pull against each other, because exportable means reconstructible. The question is not whether it is safe but who can reconstruct, under what quorum, and what an export proves about who else held a share — the same question the third-party-blast-radius card asks of any threshold scheme. Reads alongside the live hyperliquid card, which is the venue this sits on top of.",
    howItWorksKo:
      "확인할 것 넷을, 각각이 싸게 끝나는 순서로. **첫째, 강제되는 집합.** Senpi 는 **마진·명목가치·레버리지 한도가 이를 위반하는 신호를 거부한다**고, 포지션 크기는 고정 랏이 아니라 **실계좌 마진과 신호 자체의 점수**에 비례한다고 말합니다. **거부하는 경계**는 `agentic-intent-veto` 카드가 원한 바로 그 형태이므로, 할 일은 그것을 `senpi-skills` 안에서 찾아내고 **거부가 모델이 크기를 확정하기 전에 일어나는지 후에 일어나는지**를 보는 것입니다. **둘째, 단위 문제** — 제품 전체에서 가장 날카로운 디테일입니다: TP/SL 이 **가격 기준이 아니라 마진 기준**이라, 10배 레버리지에서 \"10% 익절\"은 **가격 1% 움직임**에 발동합니다. 숫자가 틀린 게 아니라 **단위가 사람들이 읽는 그것이 아닙니다** — 금액은 제약하지만 구매는 제약하지 못하는 지출 한도와 같은 실패 양식입니다. 측정은 간단합니다: 레버리지를 훑으며 **표시된 퍼센트 대 실제 가격 이동**을 그리면 그 간극이 답입니다. **셋째, 격리.** 전략마다 자체 서브월렛을 갖고 내부적으로는 교차마진(헤지 가능), 외부적으로는 격리라고 합니다. 이건 구호가 아니라 **검증 가능한 주장**입니다 — 전략 A 안의 청산이 전략 B의 마진에 닿는가, 그리고 그 격리가 **하이퍼리퀴드 상의 별도 계정으로 강제되는가 아니면 애플리케이션 레벨에서만 그런가**. **넷째, 정직하게 짚을 커스터디 긴장**: 키는 시큐어 엔클레이브에 샤딩돼 있고 SOC 2 와 외부 감사 3건이 붙어 있으며, 사용자는 **언제든 키를 내보낼 수 있습니다.** 둘 다 좋은 성질이고 서로를 잡아당깁니다 — **내보낼 수 있다는 것은 재구성할 수 있다는 뜻**이니까요. 질문은 안전한가가 아니라 **누가, 어떤 정족수로 재구성할 수 있으며, 내보내기가 다른 누가 지분을 들고 있었는지에 대해 무엇을 증명하는가**입니다. `third-party-blast-radius` 카드가 모든 임계 기법에 던지는 그 질문입니다. 이 층이 올라앉은 거래소인 라이브 `hyperliquid` 카드와 함께 읽습니다.",
  },
  {
    // price-at-a-moment 바로 앞에 두었다 (jay, 2026-08-19). 두 카드가 같은 창(window)을
    // 다룬다 — 저쪽은 "정산 시점의 가격 하나를 아무 검증 없이 믿었다", 이쪽은 "체결 전
    // 구간에 무엇이 보이느냐"다. 라이브 pbs 카드가 MEV를 공급 측(서처·릴레이)에서
    // 만졌다면, 이 카드는 같은 시장을 방어 측 명세로 다시 본다.
    key: "encrypted-mempool",
    title: "What encryption does not hide",
    titleKo: "암호화가 가리지 못하는 것",
    description:
      "Two competing encrypted-mempool EIPs leave the sender, the gas, and the size in plaintext. Measure how much of the sandwich survives on metadata alone.",
    descriptionKo:
      "경합 중인 암호화 멤풀 EIP 두 건 모두 발신자·가스·크기를 평문으로 남깁니다. 메타데이터만으로 샌드위치가 얼마나 살아남는지를 측정합니다.",
    status: "soon",
    howTo:
      "Not yet scoped — read EIP-8105's plaintext envelope field list first, then the Ethereum protocol pattern page's leakage paragraph, and check the two against each other. Sources: the 2026-08-19 \"Encrypt the Mempool\" call (cryptoslate.com), eips.ethereum.org/EIPS/eip-8105, EIP-8184 (LUCID), ethsystems.org threshold-encrypted-mempool pattern, Shutter Network on Gnosis Chain.",
    howToKo:
      "아직 범위 미정 — 먼저 **EIP-8105 의 평문 봉투(envelope) 필드 목록**을 읽고, 그다음 이더리움 프로토콜 패턴 문서의 **유출(leakage) 문단**을 읽어 둘을 서로 대조하는 것부터. 출처: 2026-08-19 \"Encrypt the Mempool\" 콜(cryptoslate.com), eips.ethereum.org/EIPS/eip-8105, EIP-8184(LUCID), ethsystems.org 임계암호 멤풀 패턴, Gnosis 체인의 Shutter Network.",
    purpose:
      "The briefing reads as if the question is still open — developers will meet, encryption is being considered, no scheme is ready. Two of those are true and one is not. There are already two competing drafts on the table: EIP-8105, which enshrines a technology-agnostic key-provider layer, and EIP-8184 (LUCID), which makes the builder commit to sealed payloads before it can read them. So the design space is no longer \"should we\"; it is \"which failure do we accept.\" And the failure worth naming is not cryptographic strength. EIP-8105's envelope stays in the clear by construction — chain ID, nonce, priority fee, max fee, gas amount, key provider ID, key ID, and the signature components, which means the sender is recoverable. Ethereum's own pattern documentation states the consequence without hedging: size, gas limit, and sender address remain visible before decryption and can still enable inference attacks on large or identifiable trades. A sandwich bot does not need your calldata to know that a known DEX router address just posted an unusually large gas limit and bid aggressively to get in. It needs to know that a big trade is coming and roughly how big. Encryption removes the exact number and leaves the shape. So the claim worth testing is not whether encrypted mempools work; it is how much of the extracted profit the leftover metadata still funds. That number decides whether this is a fix or a tax.",
    purposeKo:
      "브리핑은 질문이 아직 열려 있는 것처럼 읽힙니다 — 개발자들이 모일 예정이고, 암호화가 검토되고 있고, 준비된 기법은 없다고. 셋 중 둘은 맞고 하나는 틀립니다. **이미 경합하는 초안이 두 건 올라와 있습니다**: 기술 중립적인 키 제공자 층을 프로토콜에 심는 **EIP-8105**, 그리고 빌더가 내용을 읽기 전에 봉인된 페이로드에 먼저 커밋하게 만드는 **EIP-8184(LUCID)**. 그러니 설계 공간은 더 이상 \"할 것인가\"가 아니라 **\"어떤 실패를 받아들일 것인가\"**입니다. 그리고 짚어야 할 실패는 암호 강도가 아닙니다. **EIP-8105 의 봉투는 설계상 평문으로 남습니다** — 체인 ID, 논스, 우선 수수료, 최대 수수료, 가스량, 키 제공자 ID, 키 ID, 그리고 서명 성분. 서명 성분이 있다는 건 **발신자 주소를 복원할 수 있다**는 뜻입니다. 이더리움 자신의 패턴 문서가 그 귀결을 에두르지 않고 적어 둡니다: **크기·가스 한도·발신자 주소는 복호화 전에도 보이며, 크거나 식별 가능한 거래에 대한 추론 공격을 여전히 가능하게 한다.** 샌드위치 봇은 당신의 calldata 를 몰라도 됩니다 — **알려진 DEX 라우터 주소가 방금 유난히 큰 가스 한도로, 들어가려고 공격적으로 입찰했다**는 것만 알면 됩니다. 큰 거래가 온다는 것과 대략의 크기면 충분합니다. **암호화는 정확한 숫자를 지우고 형태를 남깁니다.** 그래서 검증할 주장은 \"암호화 멤풀이 작동하는가\"가 아니라 **\"남은 메타데이터가 추출 이익의 몇 퍼센트를 여전히 먹여 살리는가\"**입니다. 그 숫자가 이것을 **해결책으로 볼지 세금으로 볼지**를 결정합니다.",
    howItWorks:
      "Three measurements, cheapest first. One, the residual-MEV replay. Take a window of historical mainnet blocks, strip every transaction down to only the fields EIP-8105 leaves in plaintext — sender, nonce, gas amount, priority fee, max fee — and try to select the sandwichable ones from that alone. Score the selection against the sandwiches actually extracted in the same window; the relay and bundle plumbing the live pbs card already built is the labelling path, so this is analysis on top of existing infrastructure rather than new infrastructure. The output is one fraction: the share of extracted profit a metadata-only adversary could still have targeted. Publish it whichever way it comes out — a low number is the strongest possible argument for the EIPs, and a high one is the strongest argument against calling this solved. Two, the two-block bill. EIP-8105 executes the envelope in one block (nonce incremented, fees paid) and the decrypted payload in the next, and the fee is paid even when decryption fails. So encryption costs a block of latency plus a failure mode where the user pays for nothing, against a status quo where routing through a private relay costs zero at the point of use. Model the crossover: at what trade size does the sandwich you avoid exceed the latency and failure cost you accept? Below that line, users rationally keep using private relays, and an encrypted mempool that the largest traders route around has not fixed the centralization it was meant to fix. Three, the failure nobody can attribute. The unresolved item on the call was that the protocol cannot establish why a key failed to arrive, or whether a provider sold it early. Build the smallest possible simulator — n key providers, threshold k, one colluding subset — and generate three traces: a key withheld deliberately, a key leaked early, and a key that was merely late. Then ask the only question that matters for enforcement: from outside, are the three distinguishable? If they are not, slashing has nothing to attach to, and the honest-threshold assumption is not an assumption but the entire security model. Reads against the live pbs card, which sits on the extraction side of the same market, and alongside third-party-blast-radius, which asks the same committee-capture question of every threshold scheme.",
    howItWorksKo:
      "측정 셋을, 싼 것부터. **하나, 잔여 MEV 재현.** 과거 메인넷 블록 구간을 잡아 모든 트랜잭션을 **EIP-8105 가 평문으로 남기는 필드만으로 깎아낸 뒤**(발신자·논스·가스량·우선 수수료·최대 수수료), 그것만으로 샌드위치 가능한 것들을 골라 봅니다. 같은 구간에서 **실제로 추출된 샌드위치**를 정답으로 두고 채점하는데, 라벨링 경로는 라이브 `pbs` 카드가 이미 만들어 둔 릴레이·번들 배관을 그대로 씁니다 — 새 인프라가 아니라 **기존 인프라 위의 분석**입니다. 산출물은 분수 하나: **메타데이터만 보는 공격자가 여전히 조준할 수 있었던 추출 이익의 비율.** 어느 쪽으로 나오든 그대로 공개합니다 — **낮게 나오면 그게 EIP 들에 대한 가장 강한 지지**이고, 높게 나오면 **이걸 해결됐다고 부르는 것에 대한 가장 강한 반박**입니다. **둘, 두 블록짜리 청구서.** EIP-8105 는 봉투를 한 블록에서 실행하고(논스 증가, 수수료 지불) 복호화된 페이로드를 그다음 블록에서 실행하며, **복호화가 실패해도 수수료는 이미 지불된 상태**입니다. 즉 암호화의 대가는 **한 블록의 지연 + 사용자가 아무것도 못 받고 지불하는 실패 양식**이고, 비교 대상인 현상 유지는 **사용 시점 비용이 0인 프라이빗 릴레이**입니다. 교차점을 모델링합니다: **피하는 샌드위치가 감수하는 지연·실패 비용을 넘어서는 거래 규모는 얼마부터인가?** 그 선 아래에서는 사용자가 프라이빗 릴레이를 계속 쓰는 게 합리적이고, **가장 큰 거래자들이 우회하는 암호화 멤풀은 애초에 고치려던 중앙화를 고치지 못한 것**입니다. **셋, 누구에게도 귀속되지 않는 실패.** 콜에서 미해결로 남은 항목이 바로 이것입니다 — 프로토콜은 **키가 왜 도착하지 않았는지, 제공자가 그것을 미리 팔았는지 확정할 수 없습니다.** 가능한 가장 작은 시뮬레이터를 만듭니다(제공자 n, 임계값 k, 담합 부분집합 하나) 그리고 트레이스 셋을 생성합니다: **고의로 보류된 키**, **미리 유출된 키**, **그냥 늦은 키**. 그다음 강제(enforcement)에 유일하게 중요한 질문을 던집니다: **바깥에서 이 셋이 구별되는가?** 구별되지 않는다면 **슬래싱은 물 곳이 없고**, 정직한 임계값 가정은 가정이 아니라 **보안 모델 전체**입니다. 같은 시장의 추출 쪽에 앉아 있는 라이브 `pbs` 카드와 대조해 읽고, 모든 임계 기법에 같은 위원회 장악 질문을 던지는 `third-party-blast-radius` 와 함께 읽습니다.",
  },
  {
    // 브리핑 두 건(폴리마켓 정산 규칙 개편, Balance Coin 붕괴)을 한 카드로 합쳤다 (jay, 2026-08-17).
    // 도메인은 예측시장과 스테이블코인으로 다르지만 결함이 같다 — 한 시점의 가격 하나를
    // 검증 범위도 지연도 없이 진실로 받아들인 것. 따로 두면 같은 논증을 두 번 하게 된다.
    key: "price-at-a-moment",
    title: "A price at a moment — settlement windows and oracle instants",
    titleKo: "한 시점의 가격 하나 — 정산 창과 오라클 순간",
    description:
      "Polymarket's five-second trick and Balance Coin's oracle attack are the same defect: one price, one instant, no band, no delay.",
    descriptionKo:
      "폴리마켓의 5초짜리 수법과 Balance Coin 오라클 공격은 같은 결함입니다 — 한 시점의 가격 하나를, 검증 범위도 지연도 없이.",
    status: "soon",
    howTo:
      "Not yet scoped — start by pricing the attack: given order-book depth on the reference venue, what does it cost to move the price by X for T seconds, and how does that cost scale as the averaging window grows? Sources: Stanford/SMU settlement-manipulation study (CoinDesk, 2026-08-07); SlowMist on the Balance Coin oracle exploit (2026-07-22).",
    howToKo:
      "아직 범위 미정 — 공격의 가격표부터: 기준 거래소의 호가 깊이가 주어졌을 때 가격을 T초 동안 X만큼 움직이는 비용은 얼마이고, 평균 구간이 길어지면 그 비용이 어떻게 커지는가. 출처: 스탠퍼드·SMU 정산 조작 연구(CoinDesk 2026-08-07), SlowMist의 Balance Coin 오라클 공격 분석(2026-07-22).",
    purpose:
      "Two 2026 incidents that look unrelated and are not. Polymarket settled its short-dated crypto contracts on a single price at a single moment, and researchers at Stanford and Singapore Management University documented 821 accounts taking $8.2M out of settlement windows they classified as likely manipulated — with 93% of the losses in those windows, market makers excluded, landing on retail. Balance Coin let its lending contract accept an oracle price without checking it against a plausible range and without any liquidation delay; an attacker wrote an abnormally low bitcoin price, instantly liquidated vaults that were never eligible, and took roughly $912,000, collapsing a $3.5M stablecoin by more than 99%. Neither was a cryptographic failure and neither required a bug in the contract's arithmetic. Both read one price at one instant and treated it as truth. What makes this a card rather than two postmortems is that the fix is a parameter, not a principle: the useful output is a design rule with a number attached — how long must an averaging window be, and how tight must a validation band be, before moving the input costs more than the payoff it unlocks?",
    purposeKo:
      "무관해 보이지만 무관하지 않은 2026년의 사건 둘. 폴리마켓은 단기 크립토 계약을 **한 시점의 가격 하나**로 정산했고, 스탠퍼드와 싱가포르경영대 연구진은 조작 가능성이 높다고 분류한 정산 창에서 821개 계정이 820만 달러를 가져간 것을 문서화했습니다 — 그 창에서 발생한 손실의 93%가(마켓메이커 제외) **개인 투자자**에게 떨어졌습니다. Balance Coin은 대출 컨트랙트가 오라클 가격을 **타당 범위 검사도, 청산 지연도 없이** 받아들이게 두었고, 공격자는 비정상적으로 낮은 비트코인 가격을 써넣어 애초에 대상이 아니었던 볼트들을 즉시 청산해 약 91만 2천 달러를 가져가며 시총 350만 달러짜리 스테이블코인을 99% 넘게 무너뜨렸습니다. 둘 다 암호학의 실패가 아니고, 컨트랙트 산술에 버그가 있어야 하는 것도 아닙니다. **한 시점의 가격 하나를 진실로 받아들였다**는 것이 전부입니다. 이것이 사후분석 둘이 아니라 카드가 되는 이유는 해법이 원칙이 아니라 **파라미터**이기 때문입니다: 쓸모 있는 산출물은 숫자가 붙은 설계 규칙입니다 — 입력을 움직이는 비용이 그것으로 얻는 이득을 넘어서려면 평균 구간은 얼마나 길어야 하고 검증 범위는 얼마나 좁아야 하는가?",
    howItWorks:
      "The fix Polymarket shipped is public and specific enough to test rather than invent: the single-price snapshot is replaced by a TWAP — a 30-second average for five-minute markets, 60 seconds for 15-minute and four-hour markets — sourced from Chainlink Data Streams, which mirrors what Kalshi already does with regulated indexes and moving averages. That gives a parameter set to attack. The model has three knobs and one curve. Window length: the cost of moving a reference venue's mid by X for T seconds is a function of book depth, while the payoff is the notional held into settlement, so plotting cost-to-manipulate against window length shows where the curve crosses the payoff — and that crossing point, not the window itself, is the design output. Band width: Balance Coin's contribution is that a price failing a plausibility check should not be actionable at all, which is a cheaper control than averaging and independent of it. Delay: a liquidation that fires with zero delay removes the only interval in which a bad price could have been noticed, so the delay is not latency overhead, it is the detection window. The line to carry into verex is the one that generalises past both cases: treat the interval between oracle finalisation and trading halt as an attack surface with its own atomicity requirement rather than an implementation detail. If a position can still be opened after the price that will settle it is already determined, that window is the product.",
    howItWorksKo:
      "폴리마켓이 실제로 적용한 수정은 공개돼 있고 구체적이라 **지어내지 않고 검증**할 수 있습니다: 단일 시점 스냅샷을 TWAP으로 교체 — 5분 시장은 30초 평균, 15분·4시간 시장은 60초 평균이고, 소스는 Chainlink Data Streams입니다. 규제 지수와 이동평균을 쓰는 Kalshi의 방식과 같은 계열입니다. 여기서 공격해 볼 파라미터 집합이 나옵니다. 모델은 노브 세 개와 곡선 하나입니다. **구간 길이**: 기준 거래소의 중간가를 T초 동안 X만큼 움직이는 비용은 호가 깊이의 함수이고 이득은 정산까지 들고 간 계약의 명목금액이므로, 조작비용 대 구간길이를 그리면 곡선이 이득선을 넘는 지점이 보입니다 — 설계 산출물은 구간 자체가 아니라 **그 교차점**입니다. **검증 범위(band)**: Balance Coin이 보태는 것은 타당성 검사를 통과하지 못한 가격은 애초에 실행 가능해서는 안 된다는 점이고, 이건 평균화보다 싸고 평균화와 독립적인 통제입니다. **지연(delay)**: 지연 0으로 발사되는 청산은 잘못된 가격을 알아챌 수 있었던 유일한 구간을 없앱니다 — 지연은 지연시간 낭비가 아니라 **탐지 창**입니다. verex로 옮겨 적을 한 줄은 두 사례를 모두 일반화하는 것입니다: **오라클 확정과 거래 중단 사이의 간격을 구현 세부사항이 아니라 자체 원자성 요구를 가진 공격면으로 다룰 것.** 그 포지션을 정산할 가격이 이미 정해진 뒤에도 포지션을 열 수 있다면, 그 창이 곧 상품입니다.",
  },
  {
    // DKG(분산 키 생성) 카드 (jay 요청, 2026-08-21). third-party-blast-radius 바로 앞에 둔다 —
    // 둘 다 "위원회의 n이 정말 n인가"를 묻고, 이 카드가 그 아래 깔린 원시 기능이다.
    // dvt 카드에 덧붙이지 않은 이유: 그쪽은 done + 손으로 쓴 페이지(docsHref)이고, DKG 는
    // DVT 한 곳이 아니라 keyper 위원회·MPC 수탁·랜덤성 비콘까지 걸쳐 있어 범위가 더 넓다.
    key: "dkg-resharing",
    title: "The ceremony ends, the committee doesn't",
    titleKo: "의식은 끝나지만 위원회는 남는다",
    description:
      "Distributed key generation is written up as a one-time event. Every real deployment is a committee whose membership changes — and the second ceremony, resharing, is the one nobody budgets for.",
    descriptionKo:
      "분산 키 생성은 일회성 사건으로 서술됩니다. 그런데 실제 배포된 것은 전부 구성원이 바뀌는 위원회이고, 두 번째 의식인 리셰어링은 아무도 예산에 넣지 않는 쪽입니다.",
    status: "soon",
    howTo:
      "Not yet scoped — run an off-the-shelf DKG at n=7, t=5, then remove one participant and check whether the group public key survives. Measure operations, not cryptography. First thing to go looking for: a live deployment that has actually reshared in production, not one that documents it could.",
    howToKo:
      "아직 범위 미정 — 기존 라이브러리로 n=7, t=5 DKG를 돌린 뒤 참여자 하나를 빼고 그룹 공개키가 살아남는지 본다. 암호학이 아니라 운영을 잰다. 가장 먼저 찾아볼 것: 운영 중에 실제로 리셰어링을 해 본 배포 — 문서상 가능하다고만 적힌 것 말고.",
    purpose:
      "Distributed key generation is the protocol by which **n** parties jointly produce one keypair such that the private key is never assembled anywhere, and any **t** of them can sign or decrypt with it. It is the primitive underneath four things this catalogue already has cards for: DVT validator keys (`dvt`), the keyper committees in threshold-encrypted mempools (`encrypted-mempool`), MPC custody (the custodian in `fisheries-receivable-rail`), and randomness beacons.\n\nEvery write-up states the same property — *t-of-n, no single point of compromise* — and it is true. **What almost none of them state is what happens after the ceremony.** A DKG is described as an event; every real deployment is a **committee**, and committees change. An operator leaves. A new one joins. One loses its share to a dead disk. Each of those needs a *second* ceremony — **resharing** — that has to be at least as trustworthy as the first, and it is the part that gets skipped in the documentation and, suspiciously often, in the deployment.\n\nThat matters more than it sounds, because of one property worth stating precisely: **resharing can preserve the group's public key.** Shares are re-randomised, membership changes, the public key stays. And the public key is usually the part nailed down somewhere else — a validator pubkey registered on the beacon chain, a deposit address a customer saved, a key ID baked into an already-broadcast encrypted transaction. If a deployment can reshare, changing the operator set is an operation. If it cannot, **\"change the operator set\" quietly means \"migrate everything that ever referenced the old key.\"**",
    purposeKo:
      "분산 키 생성(DKG)은 **n**개 주체가 하나의 키쌍을 함께 만들되 **개인키가 어디에서도 조립되지 않고**, 그중 **t**개가 모이면 서명하거나 복호화할 수 있게 하는 프로토콜입니다. 이 카탈로그가 이미 카드를 가진 넷의 밑에 깔린 원시 기능입니다 — DVT 검증인 키(`dvt`), 암호화 멤풀의 keyper 위원회(`encrypted-mempool`), MPC 수탁(`fisheries-receivable-rail`의 수탁사), 그리고 랜덤성 비콘.\n\n모든 글이 같은 성질을 말합니다 — *t-of-n, 단일 침해 지점 없음* — 그리고 사실입니다. **그런데 거의 아무도 말하지 않는 것은 의식이 끝난 다음입니다.** DKG는 **사건**으로 서술되지만, 실제 운영되는 것은 전부 **위원회**이고 위원회는 바뀝니다. 운영자가 떠나고, 새 운영자가 들어오고, 누군가는 디스크가 죽어 지분(share)을 잃습니다. 그 각각에 **두 번째 의식** — **리셰어링(resharing)** — 이 필요하고, 그것은 첫 번째만큼 신뢰할 수 있어야 합니다. 그리고 이 부분이 문서에서 빠지고, 수상하리만치 자주 배포에서도 빠집니다.\n\n이게 들리는 것보다 중요한 이유는 성질 하나 때문입니다: **리셰어링은 그룹의 공개키를 보존할 수 있습니다.** 지분은 다시 무작위화되고 구성원은 바뀌지만 공개키는 그대로입니다. 그리고 **공개키야말로 대개 다른 곳에 못 박혀 있는 부분**입니다 — 비콘 체인에 등록된 검증인 공개키, 고객이 저장해 둔 입금 주소, 이미 브로드캐스트된 암호화 트랜잭션에 박힌 key ID. 리셰어링이 되면 운영자 교체는 **운영 작업**입니다. 안 되면 **\"운영자 집합을 바꾼다\"는 말은 조용히 \"그 키를 참조한 모든 것을 이전한다\"가 됩니다.**",
    howItWorks:
      "### What a DKG actually produces\n\n| Output | Who holds it | Note |\n|---|---|---|\n| **The private key** | **Nobody, ever** | Exists only implicitly, as the interpolation of shares |\n| The public key | Everyone; published | This is what other systems bind to |\n| Share *i* | Participant *i* | Useless alone below the threshold |\n| **The transcript** | Should be public | The evidence that the key was generated as claimed |\n\nThe last row deserves the hardest look. A threshold claim is only as good as the ability of an outsider to check that the ceremony really ran with the claimed participants and the claimed threshold.\n\n### The three membership events\n\n| Event | What has to happen | The question that decides it |\n|---|---|---|\n| An operator leaves | Reshare to n−1, or replace in place | **Does the group public key survive?** |\n| An operator joins | Reshare to n+1 | Who authorises it, and can the incumbents veto? |\n| A share is lost | Recover from ≥ t others, or reshare | **Is recovery distinguishable from theft?** |\n\nThat last question is the sharp one. A recovery procedure that lets *t* participants reconstruct a share for a member who lost theirs is, structurally, also a procedure that lets *t* colluding participants hand a share to anyone. Whatever separates the two is policy sitting outside the cryptography — which is the same boundary the `aml-compliance` card is about.\n\n### The measurement, and it is small\n\nRun a real DKG locally — n = 7, t = 5, using an existing library rather than hand-rolling one — then measure the **operations**, not the cryptography:\n\n1. Rounds and wall-clock for the initial ceremony.\n2. Remove one participant. **Does the group public key change?**\n3. Add one. How many rounds, and how much of the group must be online at once?\n4. Kill a participant mid-ceremony. Does the protocol abort, restart, or exclude it?\n5. Have an outsider verify the transcript using public data only.\n\nOutput is one table nobody publishes and every operator needs:\n\n| Event | Rounds | Online quorum required | Downtime | Public key preserved |\n|---|---|---|---|---|\n\n### Where the n stops being n\n\nSame shape as `stake-concentration` and `aqua-shared-liquidity`: a set that looks like n independent units while the real unit of independence is smaller. For a key committee the correlated axes are concrete — same cloud region, same client implementation, same jurisdiction, one operator running several nominally separate nodes.\n\n**The threshold t is arithmetic. The independence of the n is an empirical claim, and it is the one nobody measures.** `encrypted-mempool` hit this from the other side — fewer than k honest keypers restores mempool-stage MEV — and `third-party-blast-radius` asks it about committee capture.\n\n### What breaks in each card if resharing turns out to be impossible\n\n| Card | The key that is nailed down elsewhere | Consequence |\n|---|---|---|\n| `dvt` | Validator pubkey registered on the beacon chain | Changing operators means exiting and re-depositing |\n| `encrypted-mempool` | Key provider ID and key ID, in the plaintext envelope | A committee change invalidates references already broadcast |\n| `fisheries-receivable-rail` | The custody address a customer saved | \"Rotate the operator set\" becomes \"move the assets\" |\n\n### Open questions\n\n- **Does anyone publish the ceremony transcript?** If not, the threshold is an assertion rather than a verifiable fact, and every downstream card is trusting a claim it cannot check.\n- **Which DKG is actually deployed** — Pedersen with a complaint round (biasable, and one malicious participant can force a restart), GJKR, FROST for Schnorr thresholds, or a BLS variant. The choice determines abort behaviour, and abort behaviour is the operational property.\n- **Has any live deployment actually reshared in production**, as opposed to documenting that it could? **That single data point is worth more than any amount of spec reading**, and it is the first thing to go looking for.",
    howItWorksKo:
      "### DKG가 실제로 만들어 내는 것\n\n| 산출물 | 누가 갖나 | 비고 |\n|---|---|---|\n| **개인키** | **아무도, 한 번도** | 지분의 보간으로만 암묵적으로 존재 |\n| 공개키 | 모두, 공개됨 | 다른 시스템이 묶이는 대상 |\n| 지분 *i* | 참여자 *i* | 임계치 미만에서는 단독으로 무용 |\n| **트랜스크립트** | 공개되어야 함 | 주장한 대로 키가 생성됐다는 증거 |\n\n마지막 행을 가장 세게 봐야 합니다. 임계 주장은 **외부인이 그 의식이 정말 주장된 참여자와 주장된 임계치로 돌았는지 확인할 수 있는 만큼만** 값어치가 있습니다.\n\n### 구성원 변경 세 가지\n\n| 사건 | 무엇이 일어나야 하나 | 성패를 가르는 질문 |\n|---|---|---|\n| 운영자가 떠남 | n−1로 리셰어, 또는 자리 교체 | **그룹 공개키가 살아남나?** |\n| 운영자가 들어옴 | n+1로 리셰어 | 누가 승인하고, 기존 구성원이 거부할 수 있나? |\n| 지분 분실 | t개 이상에서 복구, 또는 리셰어 | **복구와 절도가 구별되나?** |\n\n마지막 질문이 날카로운 쪽입니다. 지분을 잃은 구성원을 위해 *t*명이 지분을 복원해 주는 절차는, 구조적으로 **공모한 *t*명이 아무에게나 지분을 넘겨줄 수 있는 절차와 같습니다.** 둘을 가르는 것이 무엇이든 그것은 암호학 **바깥의 정책**이고, `aml-compliance` 카드가 다루는 바로 그 경계입니다.\n\n### 측정 — 작습니다\n\n로컬에서 진짜 DKG를 돌립니다. n = 7, t = 5, 직접 구현하지 말고 기존 라이브러리로. 그리고 암호학이 아니라 **운영**을 잽니다:\n\n1. 최초 의식의 라운드 수와 실제 소요 시간.\n2. 참여자 하나를 뺀다. **그룹 공개키가 바뀌는가?**\n3. 하나를 더한다. 몇 라운드이고, 그룹의 몇 %가 동시에 온라인이어야 하는가?\n4. 의식 도중에 참여자 하나를 죽인다. 프로토콜이 중단되는가, 재시작하는가, 배제하는가?\n5. 외부인이 공개 데이터만으로 트랜스크립트를 검증하게 한다.\n\n산출물은 **아무도 발표하지 않고 모든 운영자가 필요로 하는** 표 하나입니다:\n\n| 사건 | 라운드 | 필요한 온라인 정족수 | 다운타임 | 공개키 보존 |\n|---|---|---|---|---|\n\n### n이 n이기를 멈추는 지점\n\n`stake-concentration`·`aqua-shared-liquidity`와 같은 형태입니다 — 겉보기엔 독립 단위 n개인데 실제 독립성의 단위는 더 작다는 것. 키 위원회에서 상관된 축은 구체적입니다: 같은 클라우드 리전, 같은 클라이언트 구현, 같은 관할권, 명목상 분리된 노드 여럿을 한 운영자가 돌리는 경우.\n\n**임계치 t는 산술입니다. n의 독립성은 경험적 주장이고, 아무도 재지 않는 쪽이 그것입니다.** `encrypted-mempool` 카드가 반대편에서 같은 지점에 부딪혔고(정직한 keyper가 k 미만이면 멤풀 단계 MEV가 되살아난다), `third-party-blast-radius`는 위원회 장악에 대해 같은 질문을 합니다.\n\n### 리셰어링이 불가능하다면 각 카드에서 무엇이 깨지나\n\n| 카드 | 다른 곳에 못 박혀 있는 키 | 결과 |\n|---|---|---|\n| `dvt` | 비콘 체인에 등록된 검증인 공개키 | 운영자 교체 = 出금 후 재예치 |\n| `encrypted-mempool` | 평문 봉투 안의 key provider ID·key ID | 위원회 변경이 이미 브로드캐스트된 참조를 무효화 |\n| `fisheries-receivable-rail` | 고객이 저장해 둔 수탁 주소 | \"운영자 집합 교체\"가 \"자산 이전\"이 됨 |\n\n### 열린 질문\n\n- **의식 트랜스크립트를 공개하는 곳이 있는가?** 없다면 임계치는 검증 가능한 사실이 아니라 **주장**이고, 하위의 모든 카드는 확인할 수 없는 주장을 믿고 있는 셈입니다.\n- **실제로 배포된 DKG가 어느 것인가** — 이의제기 라운드가 있는 Pedersen(편향 가능하고, 악의적 참여자 하나가 재시작을 강제할 수 있음), GJKR, Schnorr 임계 서명용 FROST, 혹은 BLS 변형. 선택이 **중단(abort) 동작**을 결정하고, 중단 동작이 곧 운영 성질입니다.\n- **운영 중에 실제로 리셰어링을 해 본 배포가 있는가** — \"할 수 있다\"고 문서에 적은 것 말고. **그 데이터 한 점이 어떤 스펙 독해보다 값어치가 큽니다**, 그리고 가장 먼저 찾아볼 것입니다.",
  },
  {
    // 서드파티 사고 네 건을 한 카드로 (jay, 2026-08-17). 브리핑은 "SRI·CSP로 잠글 것"으로
    // 정리했는데, 조사해 보니 폴리마켓 건에서는 둘 다 막지 못했을 통제다 — 그 어긋남 자체가
    // 카드의 척추라 그대로 카드에 적었다. rwa-multichain 카드와 같은 방식(원 논지를 적고,
    // 그 논지가 멈추는 자리를 표시).
    key: "third-party-blast-radius",
    title: "Trusted third parties — the blast radius nobody maps",
    titleKo: "신뢰된 서드파티 — 아무도 그리지 않는 폭발 반경",
    description:
      "Four 2026 incidents with one root: a vendor you authorized. And the control everyone reaches for first — SRI and CSP — would have stopped none of them.",
    descriptionKo:
      "2026년 사고 네 건, 뿌리는 하나 — 내가 승인한 협력사. 그리고 가장 먼저 손이 가는 통제인 SRI·CSP는 그중 어느 것도 막지 못했을 것입니다.",
    status: "soon",
    howTo:
      "Not yet scoped — start with an inventory of one real frontend: every third-party script, every vendor holding customer PII, and each vendor's own vendors where discoverable. Sources: Polymarket incidents 2026-05-22 and 2026-06-25; Trezor/ShipMonk disclosure 2026-08-13; Bits of Gold disclosure 2026-08-16.",
    howToKo:
      "아직 범위 미정 — 실제 프론트엔드 하나의 인벤토리부터: 모든 서드파티 스크립트, 고객 개인정보를 쥔 모든 협력사, 그리고 알아낼 수 있는 범위에서 그 협력사의 협력사까지. 출처: 폴리마켓 2026-05-22·2026-06-25 사고, Trezor/ShipMonk 공지 2026-08-13, Bits of Gold 공지 2026-08-16.",
    purpose:
      "Four incidents in four months, and the interesting thing is not that they happened but that they share a root the usual threat model draws outside the boundary. On 2026-06-25 a compromised third-party vendor injected a wallet-drainer into Polymarket's frontend; about $2.94M left at least 11 wallets, the stolen pUSD was bridged from Polygon to Ethereum and consolidated into roughly 1,893 ETH, and every affected user was reimbursed — the vendor has still not been named publicly. On 2026-08-13 Trezor disclosed that its fulfilment partner ShipMonk had been breached, exposing 13,689 customers (11,742 with name, email, phone and shipping address; 1,947 partially) who ordered between 2026-05-10 and 2026-08-08 across seven countries — and ShipMonk's own root cause was a vulnerability in Metabase, a third party of the third party. On 2026-08-16 Bits of Gold, holder of Israel's first VASP licence, disclosed roughly 200,000 customers exposed through unauthorised access to a third-party support and analytics system. And back on 2026-05-22, $700,000 left a Polymarket internal top-up wallet in 5,000-POL batches every 30 seconds because a six-year-old private key was still valid. The reflex answer to the frontend case is to lock third-party scripts down with SRI and CSP, and that is exactly where the reflex fails. SRI verifies that a file matches a hash — the malicious script came from the trusted vendor's own infrastructure, so it was the expected file. CSP is a whitelist of where a script may load from — the vendor was on the whitelist. Both answer \"was this script authorized?\" and the attack's entire premise is that it was. The question worth building around is the one neither control asks: what is this authorized script allowed to do?",
    purposeKo:
      "넉 달에 네 건인데, 흥미로운 건 사고가 났다는 사실이 아니라 **네 건이 공유하는 뿌리를 통상적인 위협 모델이 경계 바깥에 그린다**는 점입니다. 2026-06-25, 침해된 서드파티 협력사가 폴리마켓 프론트엔드에 지갑 드레이너 스크립트를 주입해 최소 11개 지갑에서 약 294만 달러가 빠져나갔고, 탈취된 pUSD는 폴리곤에서 이더리움으로 브릿지돼 약 1,893 ETH로 합쳐졌습니다. 전액 보상은 이뤄졌지만 **문제의 협력사 이름은 지금도 공개되지 않았습니다.** 2026-08-13, Trezor는 물류 파트너 ShipMonk의 침해로 고객 13,689명(전체 노출 11,742명 — 이름·이메일·전화·배송지, 부분 노출 1,947명)이 드러났다고 공지했습니다. 대상은 7개국에서 2026-05-10~08-08 사이 주문한 고객이고, ShipMonk 쪽 원인은 **Metabase의 취약점** — 협력사의 협력사입니다. 2026-08-16, 이스라엘 최초 VASP 라이선스 보유사 Bits of Gold가 서드파티 지원·분석 시스템 무단 접근으로 약 20만 명이 노출됐다고 공지했습니다. 그리고 2026-05-22에는 6년 된 개인키가 여전히 유효했다는 이유로 폴리마켓 내부 충전 지갑에서 30초마다 5,000 POL씩 70만 달러가 빠져나갔습니다. 프론트엔드 건에 대한 반사적 답은 \"서드파티 스크립트를 SRI·CSP로 잠근다\"이고, **바로 그 지점에서 반사가 빗나갑니다.** SRI는 파일이 해시와 일치하는지 검증하는데, 악성 스크립트는 신뢰된 협력사 **자신의 인프라**에서 왔으므로 기대된 그 파일이 맞았습니다. CSP는 스크립트를 어디서 불러올 수 있는지의 화이트리스트인데, 그 협력사는 화이트리스트에 있었습니다. 둘 다 \"이 스크립트는 승인되었는가?\"에 답하고, 공격의 전제가 바로 **승인되어 있었다**는 것입니다. 만들 가치가 있는 질문은 두 통제 모두 묻지 않는 쪽입니다 — **승인된 이 스크립트가 무엇을 할 수 있게 되어 있는가?**",
    howItWorks:
      "The build is an inventory and a containment test, in that order. Inventory: for one real frontend, list every third-party script and every vendor holding customer PII, and go one layer down where it is discoverable — ShipMonk's exposure arrived through Metabase, and a list that stops at direct vendors would have missed it. Capability rather than origin: for each entry, write what it could do if it turned hostile today, and for scripts make the test concrete — can it reach the wallet-signing path at all? Containment: since SRI and CSP shrink the origin set and nothing else, the thing worth prototyping is isolation — moving the signing surface into an origin that third-party JavaScript cannot address, and treating \"our own page may prompt for a signature\" as itself a privilege to be scoped rather than an ambient property of the site. Then the same question turned inward: a private key that has been valid for six years has a blast radius measured in years, so rotation age belongs in the inventory next to the vendors, not in a separate ops checklist. One consumer-side corollary lands here because this catalogue has no hardware-wallet card to hang it on: choose a device on audit history, signing scheme and entropy source rather than brand — and now add fulfilment and supply-chain handling to that list. July's Coldcard defect is the inside-the-device version of the same lesson: a 2021 build-configuration error routed seed generation to a software PRNG instead of the STM32 hardware RNG, leaving roughly 40 bits of effective entropy on Mk2/Mk3 devices, and at least 1,719 BTC — about $111M across more than 5,200 addresses — was swept once someone noticed. ShipMonk is the who-shipped-the-device version, and the leaked list is worse than it looks precisely because no key was touched: a verified roster of hardware-wallet owners with delivery addresses is raw material for targeted phishing and for the physical coercion this space calls a wrench attack, and it appears in no threat model drawn around the device.",
    howItWorksKo:
      "만들 것은 **인벤토리와 봉쇄 테스트**이고 순서가 그대로입니다. **인벤토리**: 실제 프론트엔드 하나를 대상으로 모든 서드파티 스크립트와 고객 개인정보를 쥔 모든 협력사를 적고, 알아낼 수 있는 한 **한 겹 더 내려갑니다** — ShipMonk의 노출은 Metabase를 통해 왔고, 직접 협력사에서 멈춘 목록은 그것을 놓쳤을 것입니다. **출처가 아니라 권한**: 각 항목에 대해 \"오늘 적대적으로 돌아서면 무엇을 할 수 있는가\"를 적고, 스크립트는 검사를 구체화합니다 — **지갑 서명 경로에 닿을 수 있는가?** **봉쇄**: SRI·CSP는 출처 집합만 줄이므로, 프로토타이핑할 가치가 있는 것은 **격리**입니다 — 서명 표면을 서드파티 JS가 주소 지정할 수 없는 오리진으로 옮기고, \"우리 페이지가 서명을 요청할 수 있다\"는 것 자체를 사이트의 기본 성질이 아니라 **범위를 정해야 할 권한**으로 다루는 것. 그다음 같은 질문을 안쪽으로 돌립니다: 6년간 유효했던 개인키의 폭발 반경은 **연 단위**로 측정되므로, 키 교체 연한은 별도 운영 체크리스트가 아니라 협력사 목록 옆 같은 인벤토리에 들어가야 합니다. 소비자 쪽 따름정리 하나가 여기 붙습니다 — 이 카탈로그에 하드웨어 월렛 카드가 아직 없어서입니다: 기기는 브랜드가 아니라 **감사 이력·서명 방식·엔트로피 소스**로 고르고, 이제 **물류 위탁·공급망 관리**를 그 목록에 더합니다. 7월의 Coldcard 결함이 같은 교훈의 \"기기 안\" 판본입니다 — 2021년의 빌드 설정 오류가 시드 생성을 STM32 하드웨어 RNG 대신 소프트웨어 PRNG로 흘려보내 Mk2/Mk3에 유효 엔트로피 약 40비트만 남겼고, 누군가 알아챈 뒤 5,200개 넘는 주소에서 최소 1,719 BTC(약 1억 1,100만 달러)가 쓸려 나갔습니다. ShipMonk는 같은 교훈의 **\"기기를 배송한 사람\"** 판본이고, 유출된 목록이 겉보기보다 나쁜 이유는 **키가 하나도 건드려지지 않았다는 바로 그 점** 때문입니다: 배송지가 붙은 하드웨어 월렛 보유자 명부는 표적 피싱과 이 바닥이 렌치 공격이라 부르는 물리적 강압의 완벽한 원재료인데, 기기를 중심으로 그린 어떤 위협 모델에도 등장하지 않습니다.",
  },
  {
    // Ripple Mint 출시를 계기로 (jay, 2026-08-17). 같은 브리핑에 있던 Balance Coin 붕괴는
    // 이 카드가 아니라 price-at-a-moment 카드로 보냈다 — 그쪽은 가격 메커니즘의 실패고,
    // 이 카드는 발행·상환 운영의 문제라 축이 다르다. jay의 3주째 결론("승부처는 TPS가 아니라
    // 분모와 유통")에 붙는 항목.
    key: "stablecoin-redemption-desk",
    title: "The redemption desk — what actually makes a stablecoin's denominator",
    titleKo: "상환 창구 — 스테이블코인의 분모를 만드는 것",
    description:
      "Ripple Mint turns issuance and redemption into an institutional workflow. The claim worth testing: circulation is won at the redemption desk, not on the chain.",
    descriptionKo:
      "Ripple Mint는 발행과 상환을 기관 워크플로우로 제품화했습니다. 검증해 볼 주장: 유통은 체인이 아니라 상환 창구에서 갈린다.",
    status: "soon",
    howTo:
      "Not yet scoped — start by writing down one issuer's redemption path end to end (eligibility, SLA, suspension conditions, audit trail) and see which parts are actually documented. Source: Ripple Mint launch, 2026-07-23.",
    howToKo:
      "아직 범위 미정 — 발행사 한 곳의 상환 경로를 처음부터 끝까지 적어 보는 것부터(자격 요건, SLA, 중단 조건, 감사 추적), 그리고 그중 실제로 문서화된 부분이 어디까지인지 확인합니다. 출처: Ripple Mint 출시, 2026-07-23.",
    purpose:
      "This catalogue keeps arriving at the same conclusion from different directions — the contest is not TPS but the denominator and its circulation — and stablecoins are where that can be stated most precisely. What builds a stablecoin's denominator is not its chain or its peg mechanism but whether an institution can get out at par, on a schedule, with a record its auditor will accept. Ripple Mint is the mature end of exactly that. Launched 2026-07-23, it lets eligible institutions mint, redeem, bridge and manage RLUSD through both a browser interface and an API, and the detail worth stealing is not the minting: a single reference ID tracks one operation from fiat deposit through issuance request and on-chain settlement to redemption payout. That is a reconciliation primitive, and reconciliation — not throughput — is what an operations team is actually short of. So the card's question is whether the framing survives contact with specifics: what does a redemption SLA actually promise, what conditions suspend it, and what does an institution need on the reporting side that a chain explorer structurally cannot give?",
    purposeKo:
      "이 카탈로그는 여러 방향에서 같은 결론에 계속 도착합니다 — **승부처는 TPS가 아니라 분모와 그 유통**이고, 스테이블코인은 그것을 가장 정확하게 말할 수 있는 자리입니다. 스테이블코인의 분모를 만드는 것은 체인도 페그 메커니즘도 아니고, **기관이 액면가로, 정해진 일정에, 감사인이 받아들일 기록과 함께 빠져나올 수 있는가**입니다. Ripple Mint가 정확히 그 성숙한 쪽 끝입니다. 2026-07-23 출시로, 자격 있는 기관이 브라우저 인터페이스와 API 양쪽으로 RLUSD를 민팅·상환·브릿지·관리할 수 있게 했는데, 훔쳐 올 만한 디테일은 민팅이 아닙니다: **단일 참조 ID 하나가 법정화폐 입금 → 발행 요청 → 온체인 정산 → 상환 지급까지 한 건의 작업을 추적합니다.** 이건 **대사(reconciliation) 원시 기능**이고, 운영팀에 실제로 모자란 것은 처리량이 아니라 대사입니다. 그래서 카드의 질문은 이 프레이밍이 구체적인 것들과 부딪혀도 살아남는가입니다: 상환 SLA는 실제로 무엇을 약속하고, 어떤 조건이 그것을 중단시키며, 기관이 리포팅 쪽에서 필요로 하는 것 중 체인 익스플로러가 **구조적으로** 줄 수 없는 것은 무엇인가?",
    howItWorks:
      "The comparison set is one issuer's institutional path against at least one other, on four axes rather than on marketing copy: who is eligible and what onboarding costs, how long redemption takes and under what conditions it can be suspended, what the audit trail looks like end to end, and what happens when the same unit exists on more than one chain. That last axis is not hypothetical here — RLUSD's circulating supply on the XRP Ledger passed its Ethereum supply for the first time around the launch, with total market cap near $1.6B, which makes bridging part of the redemption story rather than a side feature: a unit redeemed has to be a unit burned on whichever chain it was actually sitting on. The contrast case is deliberately kept nearby rather than inside: Balance Coin held the opposite position on every one of these axes, and the reason its $3.5M denominator went to near zero in a single transaction is that there was no redemption desk, so there was no floor under the price — but the mechanism of that failure is an oracle problem and belongs to the price-at-a-moment card. What belongs here is only the operational half. The line back to verex is that an issuer's redemption path is a payment integration with a settlement guarantee attached — structurally the same shape as the AP2 and Toss cards, minus the card network — and the reference-ID-per-operation pattern is borrowable on its own, whether or not RLUSD is ever the asset.",
    howItWorksKo:
      "비교 대상은 발행사 한 곳의 기관 경로 대 최소 한 곳 이상이고, 홍보 문구가 아니라 **축 네 개**로 봅니다: 누가 자격이 있고 온보딩 비용은 얼마인가, 상환에 얼마나 걸리며 어떤 조건에서 중단될 수 있는가, 감사 추적은 끝에서 끝까지 어떻게 생겼는가, 같은 단위가 둘 이상의 체인에 존재할 때 무슨 일이 벌어지는가. 마지막 축은 여기서 가정이 아닙니다 — 출시 무렵 RLUSD의 XRP Ledger 유통량이 처음으로 이더리움 유통량을 넘었고 시총은 16억 달러 근처입니다. 그러면 **브릿징은 부가 기능이 아니라 상환 이야기의 일부**가 됩니다: 상환된 한 단위는 그것이 실제로 앉아 있던 체인에서 소각된 한 단위여야 하니까요. 대조 사례는 카드 안에 넣지 않고 옆에 둡니다 — Balance Coin은 이 네 축 전부에서 정반대 위치에 있었고, 350만 달러짜리 분모가 트랜잭션 한 건에 0 근처로 간 이유는 **상환 창구가 없어서 가격 아래에 바닥이 없었다**는 것입니다. 다만 그 실패의 메커니즘은 오라클 문제라 price-at-a-moment 카드 소관이고, 여기 남는 것은 **운영 쪽 절반**뿐입니다. verex로 돌아오는 선은 이것입니다: 발행사의 상환 경로는 **정산 보증이 붙은 결제 연동**이고, 구조상 AP2·토스 카드와 같은 모양에서 카드망만 빠진 것입니다. 그리고 작업 한 건당 참조 ID 하나라는 패턴은 RLUSD가 자산이 되든 안 되든 그 자체로 가져다 쓸 수 있습니다.",
  },
  {
    // MCP 새 스펙(2026-07-28)을 계기로 (jay, 2026-08-17). 기존 google-adk-mcp 카드와 겹치지
    // 않게 축을 갈랐다 — 그쪽은 "ADK 에이전트를 MCP 서버로 감쌀 수 있는가"라는 프레임워크
    // 질문이고, 이 카드는 그 아래의 프로토콜 질문이다. LLM 트랙 Day 39(MCP 서버 직접 구현)를
    // 재개할 때의 기준 스펙도 이 카드가 정한다.
    key: "mcp-stateless-server",
    title: "Building an MCP server on the stateless spec",
    titleKo: "무상태 스펙 위에서 MCP 서버 만들기",
    description:
      "The 2026-07-28 revision drops the session handshake, so an MCP server becomes an ordinary stateless HTTP service — deployable to serverless and edge, and authorized like any enterprise API.",
    descriptionKo:
      "2026-07-28 개정이 세션 핸드셰이크를 걷어내면서 MCP 서버는 평범한 무상태 HTTP 서비스가 됩니다 — 서버리스·엣지에 배포되고, 여느 사내 API처럼 인가됩니다.",
    status: "soon",
    howTo:
      "Not yet scoped — build one narrow tool server against 2026-07-28 from the start rather than porting a 2025-11-25 one, deploy it to Cloud Run, and connect it to Claude. Spec: blog.modelcontextprotocol.io, release candidate 2026-07-28.",
    howToKo:
      "아직 범위 미정 — 2025-11-25 서버를 포팅하지 말고 처음부터 2026-07-28 기준으로 좁은 도구 서버 하나를 만들어 Cloud Run에 올리고 Claude에 연결해 봅니다. 스펙: blog.modelcontextprotocol.io, 2026-07-28 릴리스 후보.",
    purpose:
      "The reason to build one now rather than a year ago is that the shape of the answer changed. Until this revision an MCP server was a stateful conversation: an initialize/initialized handshake, an Mcp-Session-Id header, and a server that had to remember which client it was talking to. The 2026-07-28 revision removes both — every request is self-contained, with protocol version, client identity and capabilities travelling in _meta, Streamable HTTP requests routed by Mcp-Method and Mcp-Name headers, and list and resource-read results cacheable. What that changes practically is deployment: a stateless request/response service runs on serverless or edge without sticky sessions, which is the difference between \"an MCP server is a process I keep running\" and \"an MCP server is a function I deploy.\" The second change carries more weight for real work — authorization now aligns with deployed OAuth 2.0 and OIDC practice, so pointing a server at an enterprise identity provider like Entra or Okta stops being a workaround. That is the half that decides whether an MCP server may ever touch company data, and it is why building against the new spec is not the same exercise as building against the old one. The adoption figure is context rather than argument: SDK downloads passed 400 million a month, roughly 4× this year.",
    purposeKo:
      "지금 만들어 볼 이유가 1년 전과 다른 것은 **답의 모양 자체가 바뀌었기 때문**입니다. 이번 개정 전까지 MCP 서버는 상태를 가진 대화였습니다 — initialize/initialized 핸드셰이크, Mcp-Session-Id 헤더, 그리고 지금 어느 클라이언트와 말하고 있는지 기억해야 하는 서버. 2026-07-28 개정은 둘 다 없앱니다 — 모든 요청이 자기완결적이고, 프로토콜 버전·클라이언트 신원·능력은 `_meta`에 실려 가며, Streamable HTTP 요청은 `Mcp-Method`·`Mcp-Name` 헤더로 라우팅되고, list와 resource-read 결과는 캐시 가능합니다. 실무적으로 바뀌는 것은 **배포**입니다: 무상태 요청/응답 서비스는 sticky session 없이 서버리스나 엣지에서 돕니다. 즉 \"MCP 서버는 내가 계속 띄워 두는 프로세스\"와 \"MCP 서버는 내가 배포하는 함수\"의 차이입니다. 실제 업무에는 두 번째 변화가 더 무겁습니다 — **인가가 실제로 배포된 OAuth 2.0·OIDC 관행에 맞춰졌습니다.** Entra나 Okta 같은 사내 IdP에 서버를 붙이는 일이 더는 우회가 아닙니다. 바로 이 절반이 MCP 서버가 회사 데이터에 닿아도 되는지를 결정하고, 그래서 **새 스펙으로 만드는 것은 옛 스펙으로 만드는 것과 같은 연습이 아닙니다.** 채택 수치는 논거가 아니라 배경입니다: SDK 다운로드 월 4억 회 돌파, 올해만 약 4배.",
    howItWorks:
      "Build one narrow server — one or two tools over a real data source — directly on 2026-07-28 rather than porting, because Tasks is an explicit breaking change (poll-based tasks/get, tasks/update, cooperative tasks/cancel) and porting means learning the old model twice. Three things are worth verifying by doing rather than reading. First, that a cold-started serverless instance can serve a request with no prior state at all — that is the whole claim of the stateless core, and it either holds on a real cold start or it does not. Second, what _meta must actually carry for a client to work without the handshake, which is the part a spec summary never makes concrete enough to implement from. Third, whether the cacheability of list and resource-read results survives a real deployment, since that is where the stateless design either pays for its extra per-request payload or does not. The authorization half deserves the most time: put the server behind an OAuth/OIDC provider and walk the token path end to end, because \"the approval path for company data is standardised now\" is a claim that is either true in an hour or false all week. Two existing items connect. The google-adk-mcp card asks the framework question — whether a verex-desk subagent can be wrapped in ADK and served over MCP — and this card asks the protocol question underneath it, so doing this one first turns that one into a wrapper exercise instead of two unknowns at once. The LLM track's Day 39 (implement an MCP server by hand) should restart on this spec rather than the one it was written against. One caution before building: Roots, Sampling and Logging are deprecated with documented replacements and a minimum twelve-month removal window.",
    howItWorksKo:
      "좁은 서버 하나 — 실제 데이터 소스 위의 도구 한두 개 — 를 포팅하지 말고 **처음부터 2026-07-28로** 만듭니다. Tasks가 명시적 파괴적 변경(폴링 기반 `tasks/get`·`tasks/update`, 협조적 `tasks/cancel`)이라, 포팅은 옛 모델을 두 번 배우는 일이 되기 때문입니다. 읽지 말고 **해봐야** 확인되는 것 셋. 첫째, 콜드 스타트한 서버리스 인스턴스가 **선행 상태 없이** 요청을 처리하는가 — 무상태 코어의 주장 전부가 이것이고, 실제 콜드 스타트에서 성립하거나 아니거나입니다. 둘째, 핸드셰이크 없이 클라이언트가 동작하려면 `_meta`가 실제로 무엇을 실어야 하는가 — 스펙 요약만으로는 구현할 만큼 구체화되지 않는 부분입니다. 셋째, list·resource-read 결과의 캐시 가능성이 실제 배포에서도 유지되는가 — 무상태 설계가 늘어난 요청당 페이로드값을 하는지가 여기서 갈립니다. **인가 절반에 시간을 가장 많이 써야 합니다**: 서버를 OAuth/OIDC 제공자 뒤에 두고 토큰 경로를 끝까지 걸어 봅니다. \"이제 회사 데이터 승인 경로가 표준화됐다\"는 주장은 한 시간이면 참이거나 일주일 내내 거짓이거나 둘 중 하나이기 때문입니다. 기존 항목 둘과 이어집니다. **google-adk-mcp** 카드는 프레임워크 질문(verex-desk 서브에이전트를 ADK로 감싸 MCP로 서빙할 수 있는가)이고 이 카드는 그 아래의 프로토콜 질문이므로, **이 카드를 먼저 하면** 그쪽은 미지수 둘이 아니라 래퍼 연습 하나가 됩니다. LLM 트랙 **Day 39(MCP 서버 직접 구현)**도 작성 당시 스펙이 아니라 이 스펙으로 재개하는 편이 낫습니다. 만들기 전 주의 하나: Roots·Sampling·Logging은 대체 수단이 문서화된 채 deprecated이고, 제거까지 최소 12개월이 보장됩니다.",
  },
  {
    // 수협은행의 인피닛블록 지분 14.95% 취득(2026-08-20)을 계기로 추가 (jay, 2026-08-21).
    // jay 요청이 "가능한 시너지와 상상해 본 서비스"였으므로, 남의 글의 빈칸을 찾는 카드가
    // 아니라 agentic-intent-veto 처럼 **만들 물건을 설계하는** 형태다.
    // aml-compliance 바로 앞에 둔다 — 둘 다 "기술이 멈추고 제도가 시작되는 자리"를 다루고,
    // 이 카드의 결론(진짜 의존성은 체인이 아니라 등록부)이 그쪽 2열 지도로 이어진다.
    key: "fisheries-receivable-rail",
    title: "The custody was never the hard part",
    titleKo: "수탁은 애초에 어려운 쪽이 아니었다",
    description:
      "A fisheries bank just bought 14.95% of a digital-asset custodian. Design the one service only those two could ship — then find the number that decides whether it should exist.",
    descriptionKo:
      "수산 전문 은행이 디지털자산 수탁사 지분 14.95%를 샀습니다. 그 둘만 만들 수 있는 서비스를 설계하고, 그것이 존재할 값어치가 있는지 가르는 숫자를 찾습니다.",
    status: "soon",
    howTo:
      "Not yet scoped — the first task is not code. Ask one question: today's gap between auction hammer and settlement, and what a fisher pays to close it. Sources: 연합뉴스 2026-08-20 (수협은행 · 인피닛블록 지분 14.95%, 공동 2대 주주), 은행법 제37조 (15% 한도) — to verify.",
    howToKo:
      "아직 범위 미정 — 첫 작업은 코드가 아닙니다. 질문 하나부터: 오늘 낙찰과 정산 사이 간격, 그리고 어업인이 그것을 메우는 데 내는 값. 출처: 연합뉴스 2026-08-20(수협은행·인피닛블록 지분 14.95%, 공동 2대 주주), 은행법 제37조 15% 한도 — 확인 필요.",
    purpose:
      "On 2026-08-20 Sh Suhyup Bank took a **14.95%** stake in 인피닛블록, a licensed Korean VASP whose business is digital-asset custody, becoming joint second-largest shareholder alongside a partnership agreement. The company's stack is described as extending to internal controls, security and **stablecoin issuance management**.\n\n**The number worth noticing is 14.95%.** Under the Banking Act a bank may not hold more than 15% of the voting shares of a company that is not its subsidiary; crossing that line makes the target a subsidiary and pulls in approval and consolidation. So 14.95% looks deliberate — influence bought while staying outside consolidation. *(That reading fits the number and should be verified against the statute before the card leans on it.)* The consequence is operational rather than legal: **the bank cannot direct the custodian.** Anything they ship has to work as a partnership between two independently-governed firms, and that constrains the design more than any technology choice does.\n\n**Custody is not the differentiator.** Korea has several licensed custodians. A bank buying into one buys a licence and a balance sheet, not an edge — every other bank can buy the same thing. The edge, if it exists, is the part nobody else has: **the fish.** Suhyup is the one bank whose franchise sits on a physical supply chain — 위판장 auction houses, fishers, seafood distribution, vessels and fishing rights as collateral. So the interesting question is not \"what can a bank do with custody\" but **\"what can only these two build?\"**",
    purposeKo:
      "2026-08-20 Sh수협은행이 국내 디지털자산 수탁사 **인피닛블록**의 지분 **14.95%**를 확보해 공동 2대 주주가 되고 전략적 파트너십을 체결했습니다. 인피닛블록은 수탁업을 영위하는 가상자산사업자(VASP)이고, 기사에 따르면 내부통제·보안·**스테이블코인 발행관리**까지 확장 가능한 인프라를 갖고 있습니다.\n\n**눈여겨볼 숫자는 14.95%입니다.** 은행법상 은행은 자회사가 아닌 다른 회사의 의결권 있는 지분을 15% 넘게 보유할 수 없고, 그 선을 넘으면 자회사가 되어 승인과 연결이 따라옵니다. 그러니 14.95%는 **연결 밖에 머물면서 영향력만 산** 의도적인 숫자로 읽힙니다. *(숫자에 들어맞는 해석이지만, 카드가 이 위에 논지를 세우기 전에 조문으로 확인할 것.)* 결과는 법률이 아니라 **운영**의 문제입니다 — **은행이 수탁사를 지시할 수 없습니다.** 두 회사가 각자 지배구조를 가진 채 파트너십으로 굴러가야 하고, 이 제약이 어떤 기술 선택보다 서비스 모양을 크게 좌우합니다.\n\n**수탁은 차별점이 아닙니다.** 국내에 라이선스 수탁사는 여럿입니다. 은행이 한 곳에 들어간다고 사는 것은 라이선스와 재무제표이지 우위가 아닙니다 — 다른 은행도 똑같이 살 수 있으니까요. 우위가 있다면 **아무도 갖지 못한 쪽**, 즉 **수산물**입니다. 수협은 물리적 공급망 위에 프랜차이즈가 얹힌 유일한 은행입니다 — 위판장, 어업인, 수산물 유통, 어선·어업권 담보. 그래서 흥미로운 질문은 \"은행이 수탁으로 무엇을 할 수 있나\"가 아니라 **\"이 둘만 만들 수 있는 것은 무엇인가\"**입니다.",
    howItWorks:
      "### The imaginary service: catch-to-cash\n\nAt a 위판장 auction a lot sells and the fisher holds a claim on proceeds that settle later. Tokenise that claim at the moment the hammer falls, custody it, and advance against it. **The fisher is paid at the hammer instead of at settlement.**\n\n| Layer | Who | What it actually is |\n|---|---|---|\n| **The fact** | The auction house | \"Lot, species, weight, grade, hammer price, buyer\" — signed at close |\n| **The instrument** | 인피닛블록 | A custodied claim on the settlement proceeds |\n| **The money** | 수협은행 | An advance against the claim; settlement extinguishes it |\n\n### Why only these two could ship it\n\nNot because of the chain. Because **Suhyup is the counterparty at both ends** — it banks the auction house, the fisher, and frequently the buyer. That closes the loop that kills most receivables-tokenisation pilots, where the party who must honour the claim is a stranger to the party who issued it. Here they are inside the same institution, which is a structural advantage no amount of protocol design substitutes for.\n\n### The gap, and it is the same gap three other cards found\n\nThe token is the easy half. The instrument is worth exactly what the auction attestation is worth — **true, and timely.** That is the box `rwa-multichain` left open (who signs the fact, and who is liable when the fact is wrong) and the question `price-at-a-moment` asks about a settlement price nobody verified. A signed catch record is a verifiable credential in every respect, and the hard part is never the signature. It is **correction and revocation**:\n\n| Real-world event | What must happen to the token |\n|---|---|\n| Buyer rejects the lot on arrival | The claim must shrink or die **after** issuance |\n| Grade revised on re-inspection | The amount changes, the identity does not |\n| The auction house's own system is down | No attestation exists, so nothing can be issued |\n| The fisher already borrowed against the same catch elsewhere | **Double pledge** — needs a registry, not a chain |\n\n**The last row decides the product.** A chain proves the claim exists; it cannot prove the claim was not already pledged somewhere off-chain. Whatever registry answers that is the real dependency, and it is institutional.\n\n### The measurable question, and it comes first\n\nBefore any code: **how long is the gap between hammer and settlement today, and what does a fisher currently pay to close it?**\n\n- If settlement is already T+1 and the fisher's alternative costs near zero, the service has no room to exist.\n- If the gap is a week and the alternative is an advance at a real discount, the design has a number to beat.\n\nThat is one figure, obtainable by asking rather than building, and it should come before anything else on this card.\n\n### Stablecoin — noted and parked\n\nThe article flags stablecoin issuance management as part of the custodian's stack, and Korea's framework is still moving. The honest ordering is worth stating: **a settlement token only matters after the attestation problem is solved.** Issuing a won-denominated token to settle claims nobody can verify moves the unverified claim faster; it does not make it true.",
    howItWorksKo:
      "### 상상해 본 서비스: 위판대금 즉시지급(catch-to-cash)\n\n위판장에서 물량이 낙찰되면 어업인은 나중에 정산될 대금에 대한 청구권을 갖습니다. **낙찰 순간** 그 청구권을 토큰화해 수탁하고, 그것을 담보로 선지급합니다. **어업인은 정산일이 아니라 낙찰 시점에 돈을 받습니다.**\n\n| 층 | 주체 | 실제로 무엇인가 |\n|---|---|---|\n| **사실** | 위판장 | \"물량·어종·중량·등급·낙찰가·매수인\" — 마감 시점에 서명 |\n| **증서** | 인피닛블록 | 정산대금 청구권을 수탁한 것 |\n| **돈** | 수협은행 | 청구권에 대한 선지급, 정산으로 소멸 |\n\n### 왜 이 둘만 만들 수 있나\n\n체인 때문이 아닙니다. **수협이 양쪽 끝의 거래상대**이기 때문입니다 — 위판장도, 어업인도, 흔히 매수인도 수협 거래처입니다. 이것이 대부분의 매출채권 토큰화 파일럿을 죽이는 고리를 닫아줍니다: 보통은 **청구권을 이행할 쪽과 발행한 쪽이 남남**인데, 여기서는 같은 기관 안에 있습니다. 프로토콜 설계로는 대체할 수 없는 구조적 우위입니다.\n\n### 빈칸 — 그리고 다른 카드 셋이 찾아낸 그 빈칸과 같습니다\n\n토큰은 쉬운 쪽입니다. 증서의 값어치는 위판 증명이 **참이고 제때인가**에 정확히 달려 있습니다. 그것이 `rwa-multichain` 카드가 열어둔 칸(누가 사실에 서명하며, 사실이 틀렸을 때 누가 책임지는가)이고, `price-at-a-moment` 카드가 아무도 검증하지 않은 정산 가격에 대해 묻는 질문입니다. 서명된 위판 기록은 모든 면에서 검증가능 자격증명이고, 어려운 부분은 서명이 아니라 **정정과 폐기**입니다:\n\n| 현실에서 벌어지는 일 | 토큰에 무슨 일이 벌어져야 하나 |\n|---|---|\n| 매수인이 도착 후 물량을 거부 | 발행 **이후에** 청구권이 줄거나 소멸해야 함 |\n| 재검사로 등급이 조정됨 | 금액은 바뀌고 동일성은 유지 |\n| 위판장 자체 시스템이 멈춤 | 증명이 없으므로 아무것도 발행 불가 |\n| 어업인이 같은 어획물로 다른 곳에서 이미 대출 | **이중담보** — 체인이 아니라 등록부가 필요 |\n\n**마지막 행이 제품의 성패를 가릅니다.** 체인은 청구권이 존재한다는 것을 증명할 뿐, 그 청구권이 오프체인 어딘가에 이미 담보로 잡히지 않았음을 증명하지 못합니다. 그것에 답하는 등록부가 진짜 의존성이고, 그건 기술이 아니라 제도입니다.\n\n### 측정할 질문, 그리고 이게 먼저입니다\n\n코드보다 먼저: **오늘 낙찰과 정산 사이 간격은 얼마이고, 어업인은 그 간격을 메우는 데 지금 얼마를 내는가?**\n\n- 정산이 이미 T+1이고 어업인의 대안 비용이 0에 가깝다면, 이 서비스는 존재할 자리가 없습니다.\n- 간격이 일주일이고 대안이 실질 할인율이 붙은 선지급이라면, 설계에 **이겨야 할 숫자**가 생깁니다.\n\n만들지 않고 물어서 얻을 수 있는 숫자 하나이고, 이 카드의 무엇보다 앞에 와야 합니다.\n\n### 스테이블코인 — 기록해 두고 미룸\n\n기사는 수탁사의 스택에 스테이블코인 발행관리가 포함된다고 밝히고 있고, 국내 제도는 아직 움직이는 중입니다. 정직한 순서를 적어두는 편이 낫습니다 — **정산 토큰은 증명 문제가 풀린 다음에야 의미가 있습니다.** 아무도 검증할 수 없는 청구권을 원화 토큰으로 정산하면 검증되지 않은 청구권이 더 빨리 움직일 뿐, 참이 되지는 않습니다.",
  },
  {
    // AML 학습 항목 (jay, 2026-08-14 — 국내 거래소 준법감시인 채용 공고를 계기로 추가).
    // dsrv-portal 카드가 "어디까지가 엔지니어링이고 어디부터가 라이선스인가"를 묻는데,
    // 이 카드는 그 경계선 자체를 공부 대상으로 삼는다 — 둘은 짝이다.
    // 2026-08-20 FRC 2026(Financial AX Risk & Compliance) 콘퍼런스 발언을 이 카드에 덧붙였다
    // (jay, 2026-08-21). 새 카드를 만들지 않은 이유 — 같은 층위를 다루는 카드가 이미 여기
    // 있고, 발언이 준 것은 새 주제가 아니라 이 카드가 재야 할 **측정 대상**이기 때문이다:
    // "STR부터 PoC 하라"와 "전문가를 우회하지 말라"가 같은 업무를 반대 방향에서 가리킨다.
    key: "aml-compliance",
    title: "AML — where the cryptography stops",
    titleKo: "AML — 암호학이 멈추는 자리",
    description:
      "Travel Rule, KYC reuse, sanctions screening — the layer this catalogue keeps hitting and calling 'not a technical problem', studied on its own terms.",
    descriptionKo:
      "트래블룰·KYC 재사용·제재 스크리닝 — 이 카탈로그가 계속 부딪히고는 \"기술 문제가 아니다\"라고 넘겼던 층을, 이번엔 그 자체로 공부해 본다.",
    status: "soon",
    howTo:
      "Not yet scoped — a reading study. Start with Korea's 특금법 (VASP registration, 트래블룰) and FATF Recommendation 16, then map which obligations a protocol can carry and which only a licensed entity can.",
    howToKo:
      "아직 범위 미정 — 정독 스터디. 특금법(가상자산사업자 신고·트래블룰)과 FATF 권고 16번부터 시작해, 어떤 의무가 프로토콜로 옮겨지고 어떤 의무가 라이선스를 가진 법인에만 남는지 매핑.",
    purpose:
      "This card exists because of a sentence written on another one. The institutional custody study card promised a separation — which parts are engineering (MPC, approval state machines, AA policies) and which parts are a licence you either have or do not — and then set the licence half aside. Nearly every card since has hit the same wall from a different angle. Verifiable credentials prove an institution signed something but not that the claim is true, so someone has to decide which issuers count. Zero-knowledge selective disclosure can prove an investor is eligible without revealing a birthday, but eligibility is defined by a regulator, not a circuit. The multichain RWA card's hardest question turns out to be who is liable for overissuance rather than how to detect it. In each case the technical work stops at the same boundary, and the boundary is worth studying directly rather than repeatedly noting in passing.\n\n**Why it is live, 2026-08-20.** At the Financial AX Risk & Compliance 2026 conference in Seoul, 송근섭, head of the Korean association of certified anti-money-laundering specialists, argued that financial crime has gone cross-border faster than AML has: digital assets and new payment rails are dissolving the boundary between sectors, so customer identification, beneficial-ownership checks, sanctions screening and suspicious-transaction analysis have to be raised together rather than firm by firm. His practical instruction was to stop waiting for complete data and AI governance before starting, and to run a proof of concept on a controllable task — STR analysis was his example — then widen the scope once effectiveness is shown. His limit was that AI must not become a shortcut past the expert: an organisation should use it to **strengthen** the analyst's judgment, not to route around it. Those two instructions point at the same task from opposite directions, and that tension is what this card can actually measure.",
    purposeKo:
      "이 카드는 다른 카드에 적어둔 문장 하나 때문에 생겼습니다. **기관 커스터디 스터디** 카드가 분리를 약속했죠 — *어디까지가 엔지니어링(MPC·승인 상태기계·AA 정책)이고, 어디부터가 있거나 없거나인 라이선스인가.* 그러고는 라이선스 쪽을 옆으로 치워뒀습니다. 그 뒤의 거의 모든 카드가 각도만 바꿔 같은 벽에 부딪혔습니다. **VC**는 기관이 서명했다는 사실만 증명하고 그 주장이 참인지는 증명하지 못하므로, 결국 **어느 발급자를 신뢰할지 사람이 정해야** 합니다. **ZK 선택적 공개**는 생년월일을 밝히지 않고 적격 투자자임을 증명하지만, **적격의 정의는 회로가 아니라 규제기관이** 씁니다. **멀티체인 RWA** 카드의 가장 어려운 질문도 결국 과발행을 어떻게 탐지하느냐가 아니라 **누가 책임지느냐**로 귀결됐습니다. 매번 기술적 작업이 같은 경계에서 멈추는데, 그 경계를 지나가며 언급만 하지 말고 정면으로 공부해 볼 값어치가 있습니다.\n\n**지금 살아 있는 이유, 2026-08-20.** 서울에서 열린 'Financial AX Risk & Compliance 2026' 콘퍼런스에서 송근섭 국제자금세탁방지전문가협회 대표는 금융범죄가 AML보다 빠르게 초국경화됐다고 지적했습니다 — 디지털자산과 새 지급결제 수단이 업권 경계를 허물고 있으므로, 고객확인·지배구조 확인·제재 스크리닝·의심거래 분석을 개별 회사가 아니라 함께 끌어올려야 한다는 것입니다. 실무 지침은 **완벽한 데이터·AI 거버넌스를 기다리지 말고** 통제 가능한 업무부터 개념검증을 돌리라는 것이었고(예로 STR 분석을 들었습니다), 효과성을 확인한 뒤 범위를 넓히라고 했습니다. 다만 선을 그었습니다 — AI가 전문가를 우회하는 지름길이 되어선 안 되고, 전문가의 판단을 **강화**하는 쪽이어야 한다는 것. **두 지침은 같은 업무를 반대 방향에서 가리키고**, 이 카드가 실제로 측정할 수 있는 것이 그 긴장입니다.",
    howItWorks:
      "Planned as a reading study with a map as its output, not an essay. The Korean layer first, since that is the one that would actually bind: 특금법 registration for a VASP, the 실명확인 입출금계정 requirement that gates everything else, 트래블룰 above the threshold, and the domestic solutions that carry it (CODE, VerifyVASP) — which are, structurally, the same institution-to-institution fact transport the RWA card is about, solved by consortium rather than by protocol. Then the international frame: FATF Recommendation 16 and the originator/beneficiary fields it demands, sanctions screening against OFAC and equivalents, STR and CTR reporting duties, and the risk-based approach that decides how much diligence each customer gets. The output worth producing is a two-column map: obligations a protocol can actually carry (screening a destination address, enforcing a transfer allowlist, proving eligibility without disclosure) against obligations that require a licensed entity with staff and liability (filing a suspicious transaction report, deciding a risk rating, answering a regulator). The tension to keep in view throughout is that AML is built on knowing who, and most of this catalogue is built on not needing to know — reusable KYC credentials are the one place those two genuinely meet, and the interesting question is whether a reused credential satisfies a regulator who wants the underlying evidence on file.\n\n### The tension in the 2026-08-20 position, and how to measure it\n\nSTR triage is precisely where a model substitutes for the analyst's first-pass judgment. So \"start with STR\" and \"do not bypass the expert\" aim at the same task from opposite directions, and the speech offers no test that tells them apart. On an org chart they are identical — a human signs either way.\n\nWhat separates them is measurable:\n\n| Signal | Augmenting | Being rubber-stamped |\n|---|---|---|\n| Analyst override rate | Non-trivial and stable | Falls toward zero |\n| Override precision | Overrides are right more often than the model | Overrides are noise |\n| Time per case | Falls, then plateaus | Falls to a signature |\n| Escalations the model did not flag | Still happen | Stop happening |\n\nThe claim worth testing: **an AI that augments leaves a non-trivial override rate whose overrides are correct more often than chance; an AI that is being rubber-stamped shows a collapsing one.** That is automation bias, and it needs no bank's data — a synthetic alert queue and two arms reproduce the shape.\n\n### One correction to the governance advice\n\n\"Do not wait for perfect governance\" is right, and it is **not** the same as \"start without an audit trail.\" An STR is a regulated filing examined after the fact, so the minimum a PoC owes is a decision record from day one: inputs, model version, score, what the analyst did, and why. That is a far smaller thing than full AI governance, and conflating the two is how good advice becomes an excuse.\n\n### Where the partnership point lands\n\nThe closing argument — that information and expertise sit scattered across firms, supervisors and private specialists, so public-private partnership matters — belongs in this card's existing two-column map rather than in a new card. Sharing typologies is fact transport, which this catalogue already knows how to think about. Deciding a risk rating and signing a filing is not. Add it as a third row: **obligations a consortium can carry**, sitting between what a protocol can carry and what only a licensed entity can.",
    howItWorksKo:
      "에세이가 아니라 **지도 하나를 산출물로** 하는 정독 스터디로 계획합니다. 실제로 구속력을 갖는 **국내 층부터**: 가상자산사업자 **특금법 신고**, 나머지 전부의 관문인 **실명확인 입출금계정** 요건, 기준금액 이상의 **트래블룰**, 그리고 그것을 실어 나르는 국내 솔루션(**CODE·VerifyVASP**) — 이건 구조적으로 RWA 카드가 다룬 **기관 간 사실 전달과 같은 문제**인데, 프로토콜이 아니라 **컨소시엄으로 푼 사례**입니다. 다음으로 국제 프레임: **FATF 권고 16번**과 그것이 요구하는 송신인·수취인 필드, **OFAC 등 제재 목록 스크리닝**, **STR(의심거래보고)·CTR(고액현금거래보고)** 의무, 그리고 고객별 실사 강도를 정하는 **위험기반접근법(RBA)**. 만들 값어치가 있는 산출물은 **두 칸짜리 지도**입니다 — 프로토콜이 실제로 질 수 있는 의무(수취 주소 스크리닝, 전송 화이트리스트 강제, 원문 없이 적격성 증명) 대 **사람과 책임을 가진 법인만 질 수 있는 의무**(의심거래보고 제출, 위험등급 판정, 감독당국 응대). 내내 놓치지 말아야 할 긴장은 이것입니다 — **AML은 \"누구인지 아는 것\" 위에 서 있고, 이 카탈로그의 대부분은 \"알 필요가 없게 만드는 것\" 위에 서 있습니다.** 재사용 가능한 KYC 크리덴셜이 그 둘이 실제로 만나는 유일한 지점이고, 흥미로운 질문은 **재사용된 증명이 원본 증거를 파일로 갖고 싶어 하는 감독당국을 만족시키는가**입니다.\n\n### 2026-08-20 발언의 긴장, 그리고 그것을 재는 법\n\nSTR 트리아지는 **모델이 분석가의 1차 판단을 대체하는 바로 그 자리**입니다. 그러니 \"STR부터 시작하라\"와 \"전문가를 우회하지 말라\"는 같은 업무를 반대 방향에서 겨누고 있고, 발언은 둘을 가르는 시험을 주지 않습니다. 조직도에서는 똑같아 보입니다 — 어느 쪽이든 사람이 서명하니까요.\n\n둘을 가르는 것은 측정 가능합니다:\n\n| 신호 | 강화하고 있음 | 형식적 결재가 되고 있음 |\n|---|---|---|\n| 분석가 번복률 | 유의미하고 안정적 | 0으로 수렴 |\n| 번복의 정확도 | 번복이 모델보다 자주 옳음 | 번복이 잡음 |\n| 건당 소요 시간 | 줄다가 평탄해짐 | 서명 수준까지 떨어짐 |\n| 모델이 안 잡은 건의 상향 보고 | 여전히 발생 | 사라짐 |\n\n시험할 값어치가 있는 주장: **강화하는 AI는 유의미한 번복률을 남기고 그 번복이 우연보다 자주 옳다. 형식적으로 결재되는 AI는 번복률이 붕괴한다.** 이것이 **자동화 편향(automation bias)**이고, 은행 데이터 없이도 됩니다 — 합성 경보 큐와 두 개 군이면 같은 형태가 재현됩니다.\n\n### 거버넌스 조언에 정정 하나\n\n\"완벽한 거버넌스를 기다리지 말라\"는 옳습니다. 그리고 그것은 **\"감사 추적 없이 시작하라\"와 같은 말이 아닙니다.** STR은 사후에 검사받는 규제 보고이므로, PoC가 첫날부터 지고 있어야 할 최소치는 **결정 기록**입니다 — 입력, 모델 버전, 점수, 분석가가 무엇을 했고 왜 그랬는지. 이것은 완전한 AI 거버넌스보다 훨씬 작은 물건이고, 둘을 뭉뚱그리는 순간 좋은 조언이 핑계로 바뀝니다.\n\n### 민관 파트너십 주장이 놓이는 자리\n\n마지막 논점 — 정보와 전문성이 금융회사·감독기관·민간 전문가에게 흩어져 있으니 민관 파트너십이 중요하다 — 은 새 카드가 아니라 **이 카드의 기존 2열 지도**에 놓입니다. 유형(typology) 공유는 사실 전달 문제이고, 이 카탈로그가 이미 다룰 줄 아는 것입니다. 리스크 등급을 정하고 보고서에 서명하는 일은 아닙니다. 세 번째 열로 추가할 것: **컨소시엄이 질 수 있는 의무** — 프로토콜이 질 수 있는 것과 라이선스 보유 기관만 질 수 있는 것 사이에 놓입니다.",
  },
  {
    key: "dsrv-portal",
    title: "Institutional custody study",
    titleKo: "기관 커스터디 스터디",
    description: "MPC · approval flows · AA · AML — and which parts are buildable without a VASP licence.",
    descriptionKo: "MPC · 승인 플로우 · AA · AML — 그리고 VASP 없이 만들 수 있는 부분은 어디까지인가.",
    status: "soon",
    howTo: "Not yet scoped — a reading study first, then whichever PoC items survive the licence question.",
    howToKo: "아직 범위 미정 — 먼저 정독, 그다음 라이선스 질문을 통과한 PoC 항목만.",
    purpose:
      "Everything else in this catalogue is a single wallet acting for itself. Institutional custody is the opposite shape: keys split across an MPC quorum, transactions gated by an approval workflow, and a compliance surface that is legal rather than technical. The useful output is a separation — which parts are engineering (MPC, approval state machines, AA policies) and which parts are a licence you either have or do not.",
    purposeKo:
      "이 카탈로그의 나머지는 전부 「지갑 하나가 자기 자신을 위해 행동한다」입니다. 기관 커스터디는 정반대 모양입니다 — 키는 MPC 정족수로 쪼개지고, 트랜잭션은 승인 워크플로가 막고, 컴플라이언스 표면은 기술이 아니라 법입니다. 유용한 산출물은 분리입니다: 어디까지가 엔지니어링(MPC·승인 상태기계·AA 정책)이고, 어디부터가 있거나 없거나인 라이선스인가.",
    howItWorks:
      "Reading study, not a deployment: MPC signing (threshold schemes vs. the key-splitting DVT already studied elsewhere here), approval workflows as state machines, where account abstraction's policy layer overlaps custody policy, and AML/travel-rule obligations. The PoC candidates are the ones that need no VASP registration — an approval-flow simulator, an AA policy contract with quorum caveats — and those are exactly the ones this card would become.",
    howItWorksKo:
      "배포가 아니라 정독 스터디입니다: MPC 서명(임계 방식 vs. 여기 DVT 카드에서 이미 다룬 키 분할), 상태기계로서의 승인 워크플로, 계정 추상화의 정책 계층이 커스터디 정책과 겹치는 지점, 그리고 AML·트래블룰 의무. PoC 후보는 VASP 등록이 필요 없는 것들 — 승인 플로우 시뮬레이터, 정족수 caveat을 가진 AA 정책 컨트랙트 — 이고, 이 카드가 실제로 될 것도 그것들입니다.",
  },
  {
    // 오늘 본 신원 파편화 문제의 표준화 시도 (jay, 2026-08-14). Privado ID·EAS·Rarimo 가
    // 각자 자기 레지스트리를 갖는 구조를 하나로 합치자는 제안이라, dsrv-portal(7) 다음이자
    // erc-8141(9) 앞인 8번이 제자리다 — 앞은 "누가 보증하나", 뒤는 "프로토콜이 흡수한다".
    key: "erc-7812",
    title: "ERC-7812 — one registry for provable identity",
    titleKo: "ERC-7812 — 증명 가능한 신원의 단일 레지스트리",
    description:
      "A singleton on-chain registry where any protocol can store and prove identity statements by ZK, without publishing the data — Vitalik is a co-author.",
    descriptionKo:
      "어떤 프로토콜이든 신원 관련 주장을 저장하고 ZK로 증명하되 데이터는 공개하지 않는 단일 온체인 레지스트리 — 비탈릭이 공저자다.",
    status: "soon",
    howTo:
      "Read-only study — no wallet needed. Start with the Rationale section on why a singleton, then read the reference implementation. eips.ethereum.org/EIPS/eip-7812 · github.com/rarimo/evidence-registry",
    howToKo:
      "읽기 전용 스터디 — 지갑 불필요. 왜 싱글턴인지를 다룬 Rationale 절부터, 그다음 레퍼런스 구현. eips.ethereum.org/EIPS/eip-7812 · github.com/rarimo/evidence-registry",
    purpose:
      "The identity cards in this catalogue keep arriving at the same wall from different sides, and this proposal is aimed squarely at it. Studying iden3 shows that each identity protocol anchors its own state root in its own contract, so a credential proven to one verifier means nothing to another that watches a different contract — the fragmentation is structural, not a matter of adoption. This ERC's answer is a single permissionless registry that every protocol writes into, which makes the trust surface one immutable contract instead of one per issuer stack. The part worth thinking hardest about is the cross-chain claim: because the whole registry commits to a single Sparse Merkle Tree, moving its state to another chain means moving one bytes32 root rather than replicating a protocol. That is the same problem the multichain RWA card leaves unsolved for supply, solved here for identity by refusing to fragment in the first place — which is also Canton's move, arrived at independently.",
    purposeKo:
      "이 카탈로그의 신원 카드들이 각기 다른 방향에서 같은 벽에 도달하는데, 이 제안은 그 벽을 정면으로 겨냥합니다. iden3를 뜯어보면 **신원 프로토콜마다 자기 상태 루트를 자기 컨트랙트에 앵커링**하므로, 한 검증자에게 증명한 크리덴셜이 다른 컨트랙트를 보는 검증자에게는 아무 의미가 없습니다 — **파편화가 채택의 문제가 아니라 구조의 문제**라는 뜻입니다. 이 ERC의 답은 **모든 프로토콜이 함께 쓰는 하나의 퍼미션리스 레지스트리**이고, 그러면 신뢰 표면이 발급자 스택마다 하나씩이 아니라 **불변 컨트랙트 하나**가 됩니다. 가장 곱씹을 부분은 크로스체인 주장입니다 — 레지스트리 전체가 **하나의 Sparse Merkle Tree에 커밋**되므로, 다른 체인으로 상태를 옮기는 일이 프로토콜을 복제하는 게 아니라 **bytes32 루트 하나를 보내는 일**이 됩니다. 멀티체인 RWA 카드가 공급량에 대해 풀지 못한 채 남긴 그 문제를, 신원에 대해서는 **애초에 파편화하지 않는 방식**으로 푼 셈이고 — 그건 Canton이 독립적으로 도달한 수와 같습니다.",
    howItWorks:
      "The registry is an EvidenceRegistry singleton, deployed deterministically to the same address on mainnet and Sepolia, sitting in front of an EvidenceDB that holds a Sparse Merkle Tree with Poseidon hashing — Poseidon because the tree has to be cheap to verify inside a circuit, the same reason iden3 picked Baby Jubjub over secp256k1. Protocols write statements as leaves; nobody writes the underlying data, only its commitment, so what lands on chain is a hash and what travels to a verifier is a proof. Sparse rather than plain matters for the same reason it did in iden3: only a sparse tree gives non-inclusion proofs, which is what revocation actually requires. The specification is deliberately abstract, and the authors say so — it is a base layer, with more specific ERCs expected on top for on-chain passports, social graphs, POAPs. Reference implementation lives at rarimo/evidence-registry, and Rarimo's own passport and biometric registries are built on it. Status: merged as a draft in February 2025, moved to Review in June 2025, contracts already deployed. Three questions to bring to the read. First, the singleton's honest cost — a shared immutable registry means a bug or a bad standard is shared too, and there is no upgrade path by design. Second, the trust question this catalogue keeps returning to does not go away: the registry proves a statement was recorded, never that it is true, so the issuer allowlist problem simply moves up a level. Third, whether a single global tree stays cheap to prove against once many protocols write to it.",
    howItWorksKo:
      "레지스트리는 **EvidenceRegistry 싱글턴**으로, 결정론적 배포를 통해 메인넷과 Sepolia에 **같은 주소**로 올라가 있습니다. 그 뒤에 **EvidenceDB**가 있고, **Poseidon 해시를 쓰는 Sparse Merkle Tree**를 보관합니다 — Poseidon인 이유는 트리가 **회로 안에서 싸게 검증돼야** 하기 때문이고, iden3가 secp256k1 대신 Baby Jubjub을 고른 것과 같은 이유입니다. 프로토콜들은 주장을 **잎(leaf)으로 기록**하되 원본 데이터는 아무도 쓰지 않고 **커밋먼트만** 올립니다 — 체인에 남는 건 해시이고, 검증자에게 가는 건 증명입니다. 일반 머클이 아니라 **Sparse**인 이유도 iden3에서와 같습니다: **비포함 증명**이 가능해야 폐기(revocation)가 성립하니까요. 명세는 **의도적으로 추상적**이며 저자들도 그렇게 밝힙니다 — 온체인 여권·소셜 그래프·POAP 같은 구체적 용도는 그 위에 별도 ERC로 올라올 것을 상정한 **기반 계층**입니다. 레퍼런스 구현은 `rarimo/evidence-registry`이고, Rarimo 자신의 여권·생체 레지스트리가 그 위에 올라가 있습니다. 상태: **2025-02 draft 병합, 2025-06 Review 단계, 컨트랙트는 이미 배포됨**. 읽을 때 들고 갈 질문 셋. **① 싱글턴의 정직한 대가** — 공유 불변 레지스트리는 버그나 잘못된 표준도 함께 공유한다는 뜻이고, 설계상 업그레이드 경로가 없습니다. **② 이 카탈로그가 반복해서 돌아오는 신뢰 문제는 사라지지 않습니다** — 레지스트리는 *주장이 기록됐다*는 것만 증명하지 *그것이 참이라*는 것은 절대 증명하지 않으므로, 발급자 허용목록 문제가 한 층 위로 옮겨갈 뿐입니다. **③ 여러 프로토콜이 함께 쓰기 시작해도 단일 전역 트리에 대한 증명이 계속 쌀 것인가.**",
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
    purpose:
      "A protocol-native preview of what this project's application-layer AA demos (session keys, atomic batching) do today with smart contracts and delegation — EIP-8141 proposes moving those same properties into Ethereum's base transaction format itself.",
    purposeKo:
      "이 프로젝트의 애플리케이션 레벨 AA 데모(세션 키, 원자적 배치)가 스마트 컨트랙트와 위임으로 지금 하고 있는 일을, 프로토콜 네이티브 수준에서 미리 보여줍니다 — EIP-8141은 같은 속성을 이더리움의 기본 트랜잭션 포맷 자체로 옮기자는 제안입니다.",
    howItWorks:
      "Not a working demo by necessity: EIP-8141 defines a new transaction type where a single transaction carries a sequence of frames (a VERIFY frame for signature/fee authorization, then one or more EXECUTE frames) instead of one implicit call — but no client or RPC can send this transaction type yet, since it requires execution-layer support the network doesn't have. As of writing it's only \"considered for inclusion\" in a future fork, so this stays a diagram/explainer page rather than a live demo.",
    howItWorksKo:
      "구조상 실제 동작하는 데모가 될 수 없습니다: EIP-8141은 트랜잭션 하나가 암묵적 호출 한 번이 아니라 프레임의 시퀀스(서명·수수료 인가를 담당하는 VERIFY 프레임, 이어지는 하나 이상의 EXECUTE 프레임)를 담는 새 트랜잭션 타입을 정의하지만, 아직 어떤 클라이언트나 RPC도 이 타입을 보낼 수 없습니다 — 네트워크에 없는 실행 계층 지원이 필요하기 때문입니다. 이 글을 쓰는 시점 기준 향후 포크에 \"포함 검토 중\"인 단계라, 라이브 데모가 아니라 다이어그램·설명 페이지로 남습니다.",
  },
  {
    key: "pet-clean-room",
    title: "PET clean room (FHE)",
    titleKo: "PET 클린룸 (동형암호)",
    description: "Homomorphic encryption for data that cannot leave its owner — a hands-on study.",
    descriptionKo: "소유자를 떠날 수 없는 데이터를 위한 동형암호 — 손으로 해보는 스터디.",
    status: "soon",
    howTo: "Not yet scoped — start with one FHE operation end to end, then decide if a page is worth it.",
    howToKo: "아직 범위 미정 — FHE 연산 하나를 끝까지 해본 뒤에 페이지를 만들지 정합니다.",
    purpose:
      "The one problem in this catalogue that cryptography solves and a blockchain does not. On-chain work makes data public and verifiable; a clean room needs the opposite — compute over data that never becomes readable, so two parties can learn a joint result without either seeing the other's input. Worth understanding as a distinct tool rather than assuming encryption-at-rest covers it.",
    purposeKo:
      "이 카탈로그에서 유일하게 **암호학이 풀고 블록체인은 못 푸는** 문제입니다. 온체인 작업은 데이터를 공개·검증 가능하게 만들지만, 클린룸에 필요한 건 정반대입니다 — 끝내 읽히지 않는 데이터 위에서 계산해서, 두 주체가 서로의 입력을 보지 않고도 공동 결과만 알아내는 것. 저장 시 암호화로 덮인다고 가정하지 말고 별개의 도구로 이해할 가치가 있습니다.",
    howItWorks:
      "Planned as a hands-on rather than a survey: take one FHE library, run a single aggregate (a sum or a count over encrypted inputs) end to end, and measure what it actually costs in latency and ciphertext size — the two numbers that decide whether any of this is usable. The reference case is a hospital/registry data collaboration, where the legal constraint is that raw records cannot leave the owner at all.",
    howItWorksKo:
      "서베이가 아니라 실습으로 계획했습니다: FHE 라이브러리 하나를 골라 암호문 입력에 대한 집계 하나(합계나 카운트)를 끝까지 돌려보고, 지연과 암호문 크기를 실제로 측정합니다 — 이 기술이 쓸 만한지를 정하는 건 결국 이 두 숫자입니다. 참조 사례는 원본 레코드가 소유자를 아예 떠날 수 없다는 법적 제약이 걸린 병원·레지스트리 데이터 협업입니다.",
  },
  {
    // pet-clean-room 바로 뒤에 두었다 (jay, 2026-08-18) — 둘이 짝이라서. 그쪽은 "끝내 읽히지
    // 않는 데이터 위에서 계산하기"이고, 이 카드는 "값만 가렸을 때 무엇이 새는가"다.
    // 논지의 뼈대는 Sui 자신의 발표 문구다: "체인은 누가 누구에게 언제 냈는지를 보여준다.
    // 금액은 ▦▦▦로 나온다." 그 문장을 무해한 절반으로 내놓았는데, B2B에서는 아닐 수 있다.
    key: "confidential-settlement-metadata",
    title: "Hiding the amount is the easy half",
    titleKo: "금액을 가리는 건 쉬운 절반이다",
    description:
      "Confidential settlement encrypts the invoice value and publishes who paid whom and when. For a supply chain, the second half may be the one worth hiding.",
    descriptionKo:
      "기밀 정산은 청구 금액을 암호화하고 누가 누구에게 언제 냈는지는 공개합니다. 공급망 입장에서는 뒤쪽 절반이 정작 가려야 할 것일 수 있습니다.",
    status: "soon",
    howTo:
      "Not yet scoped — synthesise a B2B payment graph, strip every amount, and see how much commercially sensitive structure is still recoverable from edges and timestamps alone. Source: Mysten Labs' Tessera announcement, 2026-08-10, and Sui's Confidential Transfers (public testing since 2026-06).",
    howToKo:
      "아직 범위 미정 — B2B 결제 그래프를 합성하고 금액을 전부 지운 뒤, 간선과 타임스탬프만으로 상업적으로 민감한 구조가 얼마나 복원되는지 봅니다. 출처: Mysten Labs의 Tessera 발표(2026-08-10), Sui Confidential Transfers(2026-06 공개 테스트).",
    purpose:
      "Institutional privacy converged on one shape in 2026 — Tessera on Sui, XRPL's confidential transfers, Circle's Arc Privacy, Canton, Midnight — and the shape is: encrypt the value, publish the graph. Sui states it without hedging in its own announcement: the chain shows who paid whom and when, and the amount appears as ▦▦▦. That is offered as the harmless half. This card asks whether it is. In B2B settlement the commercially sensitive facts are often structural rather than numeric: who your suppliers are, which relationships are contractual and which are one-off, when a contract started or stopped, whether you have begun paying late. A competitor does not need your invoice value to see that you onboarded a supplier last month and dropped another one. And the asymmetry is worse than it looks — an amount that leaks is one number, while a published graph edge cannot be un-published, and the graph compounds as every later payment adds to it. The point is not that the cryptography is weak. Twisted ElGamal over Ristretto255 with zero-knowledge proofs does exactly what it claims. The point is that the thing left in the clear was chosen for a technical reason, not a privacy one.",
    purposeKo:
      "2026년의 기관용 프라이버시는 한 형태로 수렴했습니다 — Sui의 Tessera, XRPL의 기밀 전송, Circle의 Arc Privacy, Canton, Midnight — 그리고 그 형태는 **값은 암호화하고 그래프는 공개하는 것**입니다. Sui는 자기 발표에서 이를 에두르지 않고 적었습니다: 체인은 **누가 누구에게 언제** 냈는지를 보여주고, 금액은 ▦▦▦로 나온다. 이것이 **무해한 절반**으로 제시됩니다. 이 카드는 정말 그런가를 묻습니다. B2B 정산에서 상업적으로 민감한 사실은 숫자보다 **구조** 쪽인 경우가 많습니다 — 공급업체가 누구인지, 어느 관계가 계약이고 어느 것이 일회성인지, 계약이 언제 시작되고 끊겼는지, 대금을 늦게 내기 시작했는지. 경쟁사는 청구 금액을 몰라도 **지난달에 공급업체 하나가 들어오고 하나가 빠진 것**을 볼 수 있습니다. 게다가 비대칭이 겉보기보다 나쁩니다 — 새어 나간 금액은 **숫자 하나**지만, 공개된 그래프 간선은 **되돌려 감출 수 없고** 이후의 모든 결제가 거기에 더해지며 누적됩니다. 암호학이 약하다는 얘기가 아닙니다. Ristretto255 위의 Twisted ElGamal과 영지식 증명은 주장한 그대로 동작합니다. 요점은 **평문으로 남겨진 것이 프라이버시 판단이 아니라 기술적 제약 때문에 정해졌다**는 것입니다.",
    howItWorks:
      "The measurement runs entirely on synthetic data, which is what makes it doable: build a B2B payment graph with realistic structure — supplier tiers, net-30 cadence, seasonal variance, occasional onboarding and churn, a few relationships that quietly slip late — then publish only what Tessera publishes. Sender, receiver, timestamp. No amounts at all, not even ranges. Then attack it. Interval regularity separates contractual edges from one-off ones; edge start and stop dates give contract initiation and termination; frequency ranks counterparty importance; cadence slippage is a distress signal that arrives before any public filing. The output is a number rather than an opinion: what share of those inferences is recoverable, at what accuracy, with zero value data. Two things make this more than a critique. First, the exposure is inherent, not sloppy — the encryption is on the value because the chain must still name the accounts whose ciphertexts it updates, so hiding the graph too would mean a shielded-pool design, which breaks exactly the auditability institutions are buying. That is a real trilemma and worth stating as one rather than scoring points. Canton is the comparison arm precisely because it resolves it differently, keeping the graph off the public ledger at the cost of being a permissioned network. The second axis is the trust model: Seal grants scoped, time-limited, revocable access to regulators, tax authorities and dispute arbiters, which is the right shape for compliance, and network operators can onboard, freeze accounts, or pause the network. Both are sensible. Both also mean the confidentiality is conditional on whoever holds the threshold shares — worth recording next to the third-party-blast-radius card, because a privacy guarantee an operator can revoke is a policy, not a cryptographic property.",
    howItWorksKo:
      "측정이 전부 **합성 데이터** 위에서 돌아가기 때문에 실제로 해볼 만합니다: 현실적인 구조를 가진 B2B 결제 그래프를 만듭니다 — 공급업체 계층, net-30 주기, 계절 변동, 간헐적인 신규 편입과 이탈, 조용히 지연되기 시작하는 관계 몇 개. 그리고 **Tessera가 공개하는 것만** 공개합니다. 보내는 쪽, 받는 쪽, 타임스탬프. 금액은 범위조차 없이 전부 제거합니다. 그다음 공격합니다. **간격의 규칙성**이 계약 관계와 일회성 거래를 갈라내고, **간선의 시작·종료일**이 계약 개시와 해지를 주며, **빈도**가 거래처 중요도를 순위 매기고, **주기의 미끄러짐**은 어떤 공시보다 먼저 도착하는 부실 신호입니다. 산출물은 의견이 아니라 숫자입니다: **금액 데이터가 0인 상태에서 이 추론들이 얼마나, 어느 정확도로 복원되는가.** 이것이 단순한 비판을 넘어서는 이유가 둘 있습니다. **첫째, 이 노출은 부주의가 아니라 내재적입니다** — 암호화가 값에 걸린 이유는 체인이 여전히 **어느 계정의 암호문을 갱신할지 지목해야** 하기 때문이고, 그래프까지 가리려면 실드풀 설계로 가야 하는데 그러면 기관이 사려는 **감사 가능성**이 정확히 깨집니다. 이건 진짜 트릴레마이므로 점수를 따려 하지 말고 트릴레마로 적어 두는 편이 낫습니다. **Canton이 비교군인 이유가 바로 이것** — 퍼미션드 네트워크라는 대가를 치르고 그래프를 공개 원장 밖에 둠으로써 같은 문제를 다르게 풉니다. **둘째 축은 신뢰 모델**입니다: Seal은 규제기관·과세당국·분쟁 중재인에게 **범위가 정해지고 기한이 있으며 취소 가능한** 접근을 부여하는데 이는 컴플라이언스에 맞는 형태이고, 네트워크 운영자는 회원을 편입하거나 계정을 동결하거나 네트워크를 멈출 수 있습니다. 둘 다 합리적입니다. 그리고 둘 다 **기밀성이 임계 지분을 쥔 쪽에 조건부**라는 뜻이기도 합니다 — `third-party-blast-radius` 카드 옆에 적어 둘 값어치가 있습니다. **운영자가 취소할 수 있는 프라이버시 보장은 암호학적 성질이 아니라 정책**이니까요.",
  },
  {
    key: "stake-concentration",
    title: "Stake concentration risk",
    titleKo: "스테이킹 집중 위험",
    description: "How much stake sits behind one router, one ASN, one data centre — and how close that is to halting finality.",
    descriptionKo: "라우터 하나, ASN 하나, 데이터센터 하나 뒤에 스테이킹이 얼마나 몰려 있는가 — 그리고 그것이 최종성 정지까지 얼마나 가까운가.",
    // done (jay, 2026-08-14): 2026-08-12 솔라나 라우팅 장애를 사례로 상관 장애면을 정리했다 —
    // 상시 구동 측정 파이프라인이 아니라 완결된 검토.
    // date 없음은 의도된 것 (jay, 2026-08-14): 헤드라인으로 올리지 않고 done 묶음의 끝(4번)에 둔다.
    // sortDemoCards는 date 있는 done을 date 없는 done보다 앞에 두므로, 날짜를 지어내지 않고
    // 위치를 낮추는 방법은 date를 비우는 것이다.
    status: "done",
    howTo: "Mapping the correlated failure surface under a validator set: why ASN, not validator count, is the real unit of independence.",
    howToKo: "검증인 집합 아래에 깔린 상관 장애면 정리 — 독립성의 진짜 단위가 검증인 수가 아니라 ASN인 이유.",
    purpose:
      "In 2026 a routing error on Solana took roughly 29% of stake offline at once and the network came within a few percentage points of losing finality. Nothing was hacked and no key was stolen — the consensus math worked exactly as designed. The failure was that a single infrastructure fault could reach a third of the validator set at the same time, which is a question about network topology, not cryptography. The interesting output is a number nobody publishes: for a given chain, what is the largest slice of stake that shares one correlated point of failure, and how does that compare to the fraction that halts finality (33% for both Solana's and Ethereum's BFT thresholds)?",
    purposeKo:
      "2026년 솔라나에서 라우팅 오류 하나로 스테이킹의 약 29%가 한꺼번에 오프라인이 되면서, 네트워크가 최종성 상실까지 불과 몇 퍼센트포인트를 남기고 멈춰 섰습니다. 해킹당한 것도, 키가 털린 것도 아니었습니다 — 합의 알고리즘은 설계대로 정확히 동작했습니다. 문제는 **인프라 결함 하나가 검증인 집합의 3분의 1에 동시에 도달할 수 있었다**는 것이고, 이건 암호학이 아니라 네트워크 토폴로지의 문제입니다. 흥미로운 산출물은 아무도 발표하지 않는 숫자입니다: 어떤 체인에서 하나의 상관된 단일 장애점을 공유하는 스테이킹의 최대 조각은 얼마이고, 그것이 최종성을 정지시키는 비율(솔라나·이더리움 BFT 임계값 모두 33%)에 얼마나 가까운가?",
    howItWorks:
      "Planned as a measurement, not an essay: pull the active validator set and its stake weights from public RPC, resolve each advertised gossip/TPU endpoint to an IP, map those to ASN and hosting provider with a public IP-intelligence dataset, then aggregate stake by ASN, by provider, and by geographic region. The headline figure is the stake-weighted Herfindahl index plus the single largest correlated bucket, both plotted against the 33% halt line. The same pipeline runs unchanged against Ethereum's beacon chain for comparison, where the concentration hides one layer down — in staking pools and the handful of clouds their operators rent from rather than in the validator count itself.",
    howItWorksKo:
      "에세이가 아니라 측정으로 계획했습니다: 공개 RPC에서 활성 검증인 집합과 스테이킹 가중치를 가져오고, 각 검증인이 광고하는 gossip/TPU 엔드포인트를 IP로 해석한 뒤, 공개 IP 인텔리전스 데이터셋으로 ASN과 호스팅 사업자에 매핑하고, 스테이킹을 ASN별·사업자별·지역별로 집계합니다. 핵심 지표는 스테이킹 가중 허핀달 지수와 가장 큰 단일 상관 버킷이며, 둘 다 33% 정지선 위에 함께 그립니다. 같은 파이프라인을 그대로 이더리움 비콘 체인에도 돌려 비교합니다 — 이더리움에서는 집중이 한 겹 아래에 숨어 있습니다. 검증인 **수**가 아니라, 스테이킹 풀과 그 운영자들이 빌려 쓰는 소수의 클라우드에 몰려 있기 때문입니다.",
  },
  {
    key: "sub-2bit-local-llm",
    title: "Sub-2-bit LLMs, locally",
    titleKo: "2비트 미만 LLM 로컬 실행",
    description: "A 2.4T model in 397GB — shrinking the codebook below IQ1_S, and what the last half-bit costs.",
    descriptionKo: "2.4T 모델을 397GB에 — IQ1_S 아래로 코드북 줄이기, 그리고 마지막 반 비트의 대가.",
    status: "soon",
    howTo: "Not yet scoped — start with the 27B model on a 16GB machine via llama.cpp, sweep the 1-bit dtypes, and reproduce the quality curve locally.",
    howToKo: "아직 범위 미정 — 16GB 머신에서 llama.cpp로 27B 모델부터 시작해, 1비트 dtype들을 훑고 품질 곡선을 직접 재현합니다.",
    purpose:
      "\"Runs locally\" hides two very different claims, and Qwen3.8 makes the gap unusually visible. The 27B model on a 16GB machine is the ordinary claim. The 2.4T-A95B model compressed from 4.9TB to 397GB — 91% smaller, still needing roughly 450GB of RAM — is the other one, and it is only \"local\" for someone who owns a server. The second thing worth pinning down is the phrase vendors use for the trade-off: \"retains a lot of accuracy.\" Unsloth's own numbers show perplexity rising 2.58 → 4.49 and top-token agreement falling 78.9% → 66.3% between the largest and smallest 1-bit variants, in exchange for about 22% less disk. Whether that trade is worth taking is a measurement, not an opinion — and it is measurable on hardware I actually have.",
    purposeKo:
      "「로컬에서 돌아간다」는 말에는 아주 다른 두 주장이 섞여 있고, Qwen3.8은 그 간극을 유난히 잘 드러냅니다. 16GB 머신 위의 27B 모델은 평범한 쪽입니다. 4.9TB에서 397GB로 압축된 2.4T-A95B(91% 감소, 그래도 RAM 약 450GB 필요)는 다른 쪽이고, 이건 서버를 소유한 사람에게만 「로컬」입니다. 두 번째로 못 박아 둘 것은 업체들이 트레이드오프를 표현하는 문구입니다 — 「정확도를 상당히 유지한다」. Unsloth 자체 수치로도 1비트 변형 중 가장 큰 것과 가장 작은 것 사이에서 perplexity가 2.58 → 4.49로 오르고 상위 토큰 일치율이 78.9% → 66.3%로 떨어집니다. 대가로 얻는 건 디스크 약 22% 절감입니다. 이 교환이 남는 장사인지는 의견이 아니라 **측정**의 문제이고, 제가 실제로 가진 하드웨어에서 측정할 수 있습니다.",
    howItWorks:
      "The compression trick is narrower than the headline suggests. llama.cpp's IQ1_S spends 1.5625 bits per weight, of which 11 are index bits into a 2048-entry codebook. The Unsloth variants simply shrink that codebook — 1024, 512, then 256 entries — which drops the index to 10, 9 and 8 bits and the weight to 1.4375, 1.3125 and 1.1875 bpw (shipped as TQ2_0, TQ1_0 and Q1_0, names picked so the Hugging Face repo lists them at all). The claim that matters is that these are plain post-training quantizations: no quantization-aware training or distillation, which is exactly what makes them cheap to produce and worth verifying independently. The plan is to run the 27B model across several of these dtypes on hardware I own and reproduce the PPL/KLD/top-p curve myself rather than cite it, then check the practical rule of thumb — RAM+VRAM ≈ quant size, past which disk offloading quietly turns a 20 tok/s figure into something else entirely.",
    howItWorksKo:
      "압축 기법 자체는 헤드라인보다 훨씬 좁은 이야기입니다. llama.cpp의 IQ1_S는 가중치당 1.5625비트를 쓰는데, 그중 11비트가 2048개짜리 코드북을 가리키는 인덱스입니다. Unsloth 변형은 그 코드북을 줄이기만 합니다 — 1024개, 512개, 256개 — 그러면 인덱스가 10·9·8비트로 줄고 가중치가 1.4375·1.3125·1.1875 bpw가 됩니다(각각 TQ2_0·TQ1_0·Q1_0으로 배포되며, 이름은 Hugging Face 저장소에 아예 노출되도록 고른 것입니다). 중요한 주장은 이것들이 **평범한 사후 양자화(PTQ)**라는 점입니다 — QAT나 증류가 없고, 바로 그 점이 생산 비용을 낮추는 동시에 독립적으로 검증할 가치를 만듭니다. 계획은 27B 모델을 이 dtype들로 제가 가진 하드웨어에서 돌려 PPL/KLD/top-p 곡선을 인용하는 대신 직접 재현하고, 실용 규칙(RAM+VRAM ≈ 양자화 크기, 그 선을 넘으면 디스크 오프로딩이 20 tok/s라는 숫자를 조용히 전혀 다른 것으로 바꿔 놓는다)을 확인하는 것입니다.",
  },
  {
    // 로보틱스 트랙 3번째 항목 (jay, 2026-08-17). 배열에서 lerobot-so101 바로 앞에 둔 것은
    // 의도적이다 — 이 카드가 그 카드의 "앞 단계"라서(픽셀 → 밀리미터가 먼저, 팔 움직이기가
    // 그다음). 튜토리얼 링크 모음이 되지 않게 산출물을 숫자 두 개로 못박았다: 재투영 RMS와
    // 자로 잰 거리 대비 tvec 오차율.
    key: "opencv-robot-vision",
    title: "Pixels to millimetres — the step before the arm moves",
    titleKo: "픽셀에서 밀리미터로 — 팔이 움직이기 전 단계",
    description:
      "Camera calibration, ArUco pose and hand-eye alignment on a built-in webcam and a sheet of A4. The output is not a demo but two error numbers.",
    descriptionKo:
      "노트북 웹캠과 A4 한 장으로 하는 카메라 캘리브레이션·ArUco 자세추정·hand-eye 정렬. 산출물은 데모가 아니라 오차 숫자 두 개입니다.",
    status: "soon",
    howTo:
      "Not yet scoped — `pip install opencv-python opencv-contrib-python`, print one DICT_4X4_50 marker from chev.me/arucogen, and check that the axes render on a webcam with rough intrinsics (fx=fy=image width, cx/cy=centre). Real calibration second. docs.opencv.org",
    howToKo:
      "아직 범위 미정 — `pip install opencv-python opencv-contrib-python`, chev.me/arucogen에서 DICT_4X4_50 마커 하나 인쇄, 대략값 내부 파라미터(fx=fy=이미지 폭, cx·cy=중심)로 웹캠에 축이 그려지는지부터 확인. 제대로 된 캘리브레이션은 그다음. docs.opencv.org",
    purpose:
      "The LeRobot card is about moving the arm; this is the step in front of it, and skipping it is why a cheap arm grabs at empty air. A policy trained on demonstrations learns actions in the robot's own coordinate frame, but everything the camera reports is in pixels, and nothing in the imitation-learning loop converts between them for you. So the question this card answers is the plainest one in robotics vision — two hundred pixels on screen is how many millimetres in the world? — and the reason it belongs in this catalogue rather than in a bookmark folder is that the honest answer is a measurement, not a pipeline. It also happens to be free: a built-in webcam and a sheet of A4 are the entire bill of materials, which makes it the cheapest way to find out where the ceiling actually is before spending anything on hardware. The V in VLA starts here.",
    purposeKo:
      "LeRobot 카드가 \"팔을 어떻게 움직이는가\"라면 이 카드는 **그 앞 단계**이고, 이걸 건너뛰는 것이 저가 로봇팔이 허공을 집는 이유입니다. 시연으로 학습된 정책은 로봇 자신의 좌표계에서 행동을 배우는데 카메라가 보고하는 것은 전부 픽셀이고, 모방학습 루프 안 어디에도 그 둘을 변환해 주는 단계는 없습니다. 그래서 이 카드가 답하는 질문은 로보틱스 비전에서 가장 단순한 것입니다 — **화면의 200픽셀은 실제로 몇 밀리미터인가?** 그리고 이것이 북마크 폴더가 아니라 이 카탈로그에 들어가는 이유는, 정직한 답이 파이프라인이 아니라 **측정값**이기 때문입니다. 게다가 비용이 0원입니다 — 노트북 내장 웹캠과 A4 한 장이 자재 명세의 전부라, 하드웨어에 돈을 쓰기 전에 천장이 어디인지 알아내는 가장 싼 방법이기도 합니다. VLA의 V가 여기서 시작합니다.",
    howItWorks:
      "Four steps, and only the last two are optional. Intrinsics: fifteen to twenty chessboard or ChArUco shots through `cv2.calibrateCamera` yield the matrix K (fx, fy, cx, cy) and the distortion coefficients, and reprojection RMS is the first of the two numbers this card exists to produce — under one pixel is the pass mark. Pose: an ArUco marker on the object or the gripper gives full 6-DOF position and rotation relative to the camera, and there is one version trap worth knowing before it costs half an hour — `cv2.aruco.estimatePoseSingleMarkers` was deprecated in OpenCV 4.7, so the current path is `cv2.aruco.ArucoDetector` for corners followed by `cv2.solvePnP` with SOLVEPNP_IPPE_SQUARE, which is why a large share of the tutorials online no longer run as written. Hand-eye: `cv2.calibrateHandEye` aligns the camera frame with the robot base frame, and the classic first mistake is not the algorithm choice (Tsai, Park, Horaud) but the setup — a camera mounted on the arm is eye-in-hand, a camera on a tripod is eye-to-hand, and getting that backwards produces a transform that is wrong in a way that still looks plausible. Inference: `cv2.dnn` runs an ONNX detector with no second framework, which is the natural lightweight pairing for an edge board like the Jetson Orin Nano Super and the reason that item sits next in the queue. The second number is the one that actually settles what this camera can do: put the marker at a distance measured with a ruler, compare it to tvec, and record the error as a percentage. Everything above is setup for those two figures — RMS and range error — and a card that reports them is worth more than one that reports that the axes rendered.",
    howItWorksKo:
      "단계는 넷이고 뒤의 둘만 선택입니다. **내부 파라미터**: 체스보드나 ChArUco 보드를 15~20장 찍어 `cv2.calibrateCamera`에 넣으면 행렬 K(fx·fy·cx·cy)와 왜곡계수가 나오고, **재투영 RMS**가 이 카드가 만들려는 두 숫자 중 첫 번째입니다 — 1픽셀 미만이 합격선. **자세추정**: 물체나 그리퍼에 붙인 ArUco 마커가 카메라 기준 6DOF 위치와 회전을 바로 줍니다. 여기 30분을 잡아먹기 전에 알아둘 **버전 함정**이 하나 있습니다 — `cv2.aruco.estimatePoseSingleMarkers`는 OpenCV 4.7에서 폐기됐으므로, 현행 경로는 `cv2.aruco.ArucoDetector`로 코너를 검출하고 `cv2.solvePnP`(플래그 `SOLVEPNP_IPPE_SQUARE`)로 자세를 푸는 것입니다. 인터넷 예제 상당수가 적힌 대로 돌지 않는 이유가 이것입니다. **hand-eye**: `cv2.calibrateHandEye`가 카메라 좌표계와 로봇 베이스 좌표계를 정렬하는데, 초보의 첫 실수는 알고리즘 선택(Tsai·Park·Horaud)이 아니라 **설정**입니다 — 카메라가 팔에 붙어 있으면 eye-in-hand, 삼각대에 있으면 eye-to-hand이고, 이걸 반대로 잡으면 **그럴듯해 보이면서 틀린** 변환이 나옵니다. **추론**: `cv2.dnn`은 별도 프레임워크 없이 ONNX 검출 모델을 돌리는데, Jetson Orin Nano Super 같은 엣지 보드와 짝지을 때의 자연스러운 경량 조합이고 그 항목이 큐에서 다음 순서인 이유이기도 합니다. 이 카메라로 어디까지 할 수 있는지를 실제로 결정하는 것은 **두 번째 숫자**입니다: 마커를 자로 잰 거리에 놓고 `tvec`과 비교해 오차를 퍼센트로 기록합니다. 위의 전부는 그 두 수치 — **RMS와 거리 오차율** — 를 위한 준비이고, 그것을 보고하는 카드가 \"축이 그려졌다\"고 보고하는 카드보다 값어치가 큽니다.",
  },
  {
    key: "lerobot-so101",
    title: "LeRobot + SO-101 — the cheapest hands-on robotics entry",
    titleKo: "LeRobot + SO-101 로봇팔 — 손으로 만지는 로보틱스의 최저가 입구",
    description:
      "Hugging Face's LeRobot library plus a $100-130 6-DOF arm: the whole imitation-learning loop — record demos, train a policy, replay autonomously — on a desk.",
    descriptionKo:
      "Hugging Face LeRobot 라이브러리 + $100~130짜리 6DOF 로봇팔: 시연 녹화 → 정책 학습 → 자율 재생이라는 모방학습 전체 루프를 책상 위에서.",
    status: "soon",
    howTo:
      "Not yet scoped — start with `pip install lerobot` and run the training/eval loop on a public Hub dataset in simulation (gym-aloha, pusht), no hardware needed. github.com/huggingface/lerobot · huggingface.co/docs/lerobot/so101",
    howToKo:
      "아직 범위 미정 — `pip install lerobot`부터, 로봇 없이 HF Hub 공개 데이터셋과 시뮬레이션(gym-aloha·pusht)에서 학습·평가 루프를 먼저 돌립니다. github.com/huggingface/lerobot · huggingface.co/docs/lerobot/so101",
    purpose:
      "If the GR00T card is the map of physical AI, this is the first shovel. The point is not the arm — it is that the full imitation-learning pipeline a VLA foundation model is fine-tuned with becomes reproducible at the smallest possible scale, on a laptop and a $100 piece of hardware, instead of staying a diagram in a paper. Two questions worth answering by doing rather than reading: how few lines of code separate \"load dataset\" from \"trained policy\" once the dataset format is standardised, and what a robot episode (observation images + joint states + actions) actually looks like next to the text-token datasets an LLM developer already knows.",
    purposeKo:
      "GR00T 항목이 피지컬 AI의 \"지도\"였다면, 이건 **첫 삽**입니다. 핵심은 로봇팔 자체가 아니라, VLA 파운데이션 모델을 파인튜닝할 때 쓰는 모방학습 파이프라인 전체가 논문 속 다이어그램이 아니라 노트북 한 대와 $100짜리 하드웨어에서 재현 가능한 최소 규모로 내려온다는 점입니다. 읽는 대신 해봐야 답이 나오는 질문 둘: 데이터셋 포맷이 표준화되고 나면 \"데이터셋 로드\"와 \"학습된 정책\" 사이가 코드 몇 줄인가, 그리고 로봇 에피소드(관측 이미지 + 관절 상태 + 행동)는 LLM 개발자가 이미 아는 텍스트 토큰 데이터셋 옆에 놓았을 때 무엇이 같고 무엇이 다른가.",
    howItWorks:
      "LeRobot bills itself as the `transformers` of robotics: one package holding a dataset standard (`LeRobotDataset`), pretrained policies (ACT, Diffusion Policy, π0, GR00T-N family) and the training/eval scripts, so the loop runs against Hub datasets and simulated environments before any hardware exists. The hardware half is the SO-101 — a 6-DOF arm of 3D-printed frame plus six STS3215 servos, roughly $100-130 a kit and $220-260 for a leader+follower pair (Seeed Studio, WowRobo, PartaBot). The leader arm is moved by hand to record teleoperated demonstrations; fine-tuning an ACT policy on those recordings makes the follower arm reproduce the motion on its own — assembly included, a weekend-sized project. The staging matters: simulation first, one arm second, and LeRobot's planned NVIDIA Cosmos 3 support is the bridge back to the GR00T stack rather than a separate track. Source: github.com/huggingface/lerobot · huggingface.co/docs/lerobot/so101",
    howItWorksKo:
      "LeRobot은 스스로를 \"로보틱스판 `transformers`\"로 표방합니다 — 데이터셋 표준(`LeRobotDataset`), 사전학습 정책(ACT·Diffusion Policy·π0·GR00T-N 계열), 학습·평가 스크립트가 한 패키지에 들어 있어서, **로봇이 없어도** Hub 공개 데이터셋과 시뮬레이션 환경으로 루프를 먼저 돌릴 수 있습니다. 하드웨어 쪽은 SO-101 — 3D 프린트 프레임 + STS3215 서보 6개의 6DOF 팔로, 킷 기준 $100~130, 리더+팔로워 페어는 $220~260입니다(Seeed Studio·WowRobo·PartaBot). 사람이 직접 쥐고 움직이는 **리더 팔**로 teleop 시연을 녹화하고, 그 데이터로 ACT 정책을 파인튜닝하면 **팔로워 팔**이 동작을 자율적으로 재현합니다 — 조립 포함 주말 프로젝트 규모. 순서가 중요합니다: 시뮬레이션이 먼저, 실물 팔이 그다음이고, LeRobot의 NVIDIA Cosmos 3 지원 예정은 별도 트랙이 아니라 GR00T 스택으로 돌아가는 다리입니다. 출처: github.com/huggingface/lerobot · huggingface.co/docs/lerobot/so101",
  },
  // ── 참조 전용 (README 의 "📎 Reference only" 행). 읽고 이해한 것이지 만들 항목이 아니라
  // href 가 없다 — 원문은 docs/knowledge/*.html, docs/features/*.md 에 있다.
  {
    key: "merkle-vs-verkle",
    title: "Merkle vs Verkle",
    titleKo: "Merkle vs Verkle",
    description: "Why proof size, not hashing speed, is what decides whether stateless clients are possible.",
    descriptionKo: "무상태 클라이언트의 가능 여부를 가르는 건 해싱 속도가 아니라 증명 크기라는 것.",
    status: "soon",
    howTo: "Reference — docs/knowledge/merkle-vs-verkle.html.",
    howToKo: "참조 — docs/knowledge/merkle-vs-verkle.html.",
    purpose:
      "The state-bloat problem this catalogue keeps running into from the application side, looked at from the protocol side. Every card here that writes a storage slot — an enforcer's spent counter, a token balance — adds to state that every node keeps live forever. Verkle trees do not delete any of it; they change what a node must carry to *prove* a piece of it, which is the difference between \"state is too big\" and \"state is too big to sync\".",
    purposeKo:
      "이 카탈로그가 애플리케이션 쪽에서 계속 부딪히는 상태 팽창 문제를, 프로토콜 쪽에서 본 것입니다. 스토리지 슬롯을 쓰는 여기 모든 카드 — 강제기의 지출 카운터, 토큰 잔고 — 가 모든 노드가 영구히 살려 두는 상태에 더해집니다. Verkle 트리는 그걸 지우지 않습니다. 노드가 그중 한 조각을 *증명*하기 위해 들고 다녀야 하는 양을 바꿀 뿐이고, 그게 \"상태가 너무 크다\"와 \"상태가 너무 커서 동기화가 안 된다\" 사이의 차이입니다.",
    howItWorks:
      "Reading note, not a demo: how a Merkle proof's size grows with tree width (you must supply every sibling at every level), why vector commitments collapse that to a constant-size proof regardless of width, and what Ethereum's Verge roadmap intends to buy with the swap — stateless clients that validate without holding the state. Also what it costs: heavier cryptography, and a migration of the entire state trie.",
    howItWorksKo:
      "데모가 아니라 정독 노트입니다: 머클 증명의 크기가 트리 폭에 따라 어떻게 늘어나는지(각 레벨의 형제 노드를 전부 제출해야 한다), 벡터 커밋먼트가 어떻게 폭과 무관한 상수 크기 증명으로 그것을 접는지, 그리고 이더리움 Verge 로드맵이 그 교체로 사려는 것 — 상태를 들고 있지 않고도 검증하는 무상태 클라이언트. 대가도 함께: 더 무거운 암호학, 그리고 상태 트라이 전체의 마이그레이션.",
  },
  {
    key: "linera-microchains",
    title: "Linera microchains",
    titleKo: "Linera 마이크로체인",
    description: "One chain per user — removing blockspace contention instead of pricing it.",
    descriptionKo: "사용자당 체인 하나 — 블록스페이스 경합에 값을 매기는 대신 없애버리기.",
    status: "soon",
    howTo: "Reference — docs/knowledge/linera-microchains.html.",
    howToKo: "참조 — docs/knowledge/linera-microchains.html.",
    purpose:
      "Almost every scaling design here takes contention as a given and competes for the block: PBS auctions it, gas prices it, a relayer sequences around it. Linera's premise is that contention is a choice — give each user their own chain and there is nothing to contend for. Worth reading precisely because it rejects the assumption the rest of the catalogue is built on.",
    purposeKo:
      "여기 있는 거의 모든 확장 설계는 경합을 주어진 것으로 두고 블록을 놓고 경쟁합니다 — PBS는 경매에 부치고, 가스는 값을 매기고, 릴레이어는 그 주위로 순서를 잡습니다. Linera의 전제는 **경합이 선택**이라는 것입니다: 사용자마다 자기 체인을 주면 다툴 대상이 없습니다. 카탈로그의 나머지가 딛고 선 가정을 정면으로 거부하기 때문에 읽을 가치가 있습니다.",
    howItWorks:
      "Reading note: the microchain model where each user owns a chain they alone extend, validators run all of them, and cross-chain messages replace shared-state contention. The interesting question the note tracks is not throughput but composability — what happens to an application whose whole point is that many users touch the same state, like an order book.",
    howItWorksKo:
      "정독 노트: 각 사용자가 자기만 확장하는 체인을 소유하고, 검증자들이 그 전부를 돌리며, 공유 상태 경합을 체인 간 메시지가 대체하는 마이크로체인 모델. 노트가 따라가는 흥미로운 질문은 처리량이 아니라 **조합 가능성**입니다 — 여러 사용자가 같은 상태를 건드리는 것이 존재 이유인 애플리케이션(오더북 같은)은 어떻게 되는가.",
  },
  {
    key: "web-stack-layers",
    title: "Web stack layers",
    titleKo: "웹 스택 계층",
    description: "A five-layer map of the stack, with this project overlaid on it.",
    descriptionKo: "스택의 5계층 지도 위에 이 프로젝트를 얹어 본 것.",
    status: "soon",
    howTo: "Reference — docs/knowledge/web-stack-layers.html.",
    howToKo: "참조 — docs/knowledge/web-stack-layers.html.",
    purpose:
      "An orientation map rather than a study: which layer each piece of this project actually lives at, and where the gaps are. Useful mostly for noticing that several cards which sound like different problems turn out to sit at the same layer — and that one or two layers have nothing on them at all.",
    purposeKo:
      "스터디라기보다 방향 지도입니다: 이 프로젝트의 각 조각이 실제로 어느 계층에 사는지, 그리고 빈 곳은 어디인지. 서로 다른 문제처럼 들리던 카드 여럿이 사실 같은 계층에 앉아 있다는 것, 그리고 어떤 계층은 아예 비어 있다는 것을 알아차리는 데 주로 쓸모가 있습니다.",
    howItWorks:
      "A static five-layer diagram with the project's routes and demos placed on it. No code.",
    howItWorksKo: "프로젝트의 라우트와 데모를 얹은 정적 5계층 다이어그램. 코드는 없습니다.",
  },
  {
    key: "kb-hybrid-payment",
    title: "KB hybrid payment flow",
    titleKo: "KB 하이브리드 결제 플로우",
    description: "A card rail (ISO 8583) meeting on-chain settlement — where the two systems actually touch.",
    descriptionKo: "카드 레일(ISO 8583)과 온체인 정산이 만나는 지점 — 두 시스템이 실제로 닿는 곳.",
    status: "soon",
    howTo: "Reference — docs/features/kb-hybrid-payment-flow.md. No dev item.",
    howToKo: "참조 — docs/features/kb-hybrid-payment-flow.md. 개발 항목 없음.",
    purpose:
      "The AP2 and Toss cards settle an agent's purchase through a payment rail, but treat the rail as a black box. This flow map opens it: an ISO 8583 authorization is decades-old, message-based, and reversible, while on-chain settlement is final and irreversible. Mapping where they meet is mapping where the reversibility mismatch has to be absorbed by somebody — and that somebody is a business decision, not a technical one.",
    purposeKo:
      "AP2와 Toss 카드는 에이전트의 구매를 결제 레일로 정산하지만, 레일 자체는 블랙박스로 둡니다. 이 플로우 맵이 그것을 엽니다: ISO 8583 승인은 수십 년 된 메시지 기반 규격이고 **되돌릴 수 있는** 반면, 온체인 정산은 최종적이고 **되돌릴 수 없습니다.** 둘이 만나는 지점을 그린다는 건 곧 그 되돌림 가능성의 불일치를 **누가 떠안는가**를 그리는 것이고, 그 누구는 기술이 아니라 사업의 결정입니다.",
    howItWorks:
      "A flow map only: the card-rail leg (authorization, capture, settlement, chargeback windows) against an Avalanche-subnet settlement leg, with the touch points marked. Explicitly no development item attached.",
    howItWorksKo:
      "플로우 맵만 있습니다: 카드 레일 구간(승인·매입·정산·차지백 기간)과 Avalanche 서브넷 정산 구간을 나란히 두고 닿는 지점을 표시합니다. 개발 항목은 명시적으로 붙어 있지 않습니다.",
  },
  {
    key: "cre-cloud",
    title: "CRE × Cloud — four hybrid patterns",
    titleKo: "CRE × Cloud — 하이브리드 4패턴",
    description: "Cloud holds the private truth, CRE is the verified bridge, the chain settles.",
    descriptionKo: "진실은 클라우드에, 검증된 다리는 CRE, 정산은 체인.",
    status: "soon",
    howTo: "Reference — docs/features/cre-cloud.md.",
    howToKo: "참조 — docs/features/cre-cloud.md.",
    purpose:
      "Most of this catalogue assumes the interesting data is already on-chain. Real institutional workloads are the opposite: the authoritative record is in a private system that cannot be published, and the chain is only the settlement venue. That inversion is what the four patterns — RWA servicing, proof of reserves, DvP, prediction-market settlement — all share, and it is the same split this project keeps arriving at from the other direction: enforce on-chain, remember off-chain.",
    purposeKo:
      "이 카탈로그의 대부분은 흥미로운 데이터가 이미 온체인에 있다고 가정합니다. 실제 기관 워크로드는 정반대입니다 — 권위 있는 기록은 공개할 수 없는 사설 시스템에 있고, 체인은 정산 장소일 뿐입니다. 네 패턴(RWA 서비싱·준비금 증명·DvP·예측시장 정산)이 공유하는 게 그 뒤집힘이고, 이 프로젝트가 반대 방향에서 계속 도달하는 바로 그 분리이기도 합니다: **강제는 온체인, 기억은 오프체인.**",
    howItWorks:
      "Reading note: four patterns sharing one shape — a private system of record, a verified bridge that attests to it without publishing it, and on-chain settlement conditioned on that attestation. The load-bearing question in each is what the bridge's attestation is actually worth, since the chain cannot check the private data itself.",
    howItWorksKo:
      "정독 노트: 하나의 모양을 공유하는 네 패턴 — 사설 원장, 그것을 공개하지 않으면서 증명하는 검증된 다리, 그리고 그 증명에 조건부인 온체인 정산. 각각에서 핵심 질문은 **그 다리의 증명이 실제로 얼마짜리인가**입니다. 체인은 사설 데이터 자체를 검사할 수 없으니까요.",
  },
  {
    key: "thirdweb",
    title: "Thirdweb — platform survey",
    titleKo: "Thirdweb — 플랫폼 서베이",
    description: "Contracts, wallets/AA, backend tx, Unity SDK — breadth bought with best-in-class parts.",
    descriptionKo: "컨트랙트·지갑/AA·백엔드 tx·Unity SDK — 각 부문 1등을 내주고 산 넓이.",
    status: "soon",
    howTo: "Reference — docs/features/thirdweb.md. Already used in the AA card's pillars ②③.",
    howToKo: "참조 — docs/features/thirdweb.md. AA 카드의 ②③ 요소에서 이미 쓰고 있습니다.",
    purpose:
      "Not a neutral survey — this project already depends on it. The AA card's sponsored-gas and atomic-batch pillars run on thirdweb's 4337 stack, and the D1 gas decision on the agent PoC turns on exactly the tradeoff this note names: thirdweb gives you a paymaster, but only for a 4337 account, which is a different account type from the 7702/7710 one the mandate story is built on. Breadth is convenient right up to the point where one part has to be the best one.",
    purposeKo:
      "중립적 서베이가 아닙니다 — 이 프로젝트가 이미 의존하고 있습니다. AA 카드의 가스 대납·원자적 배치 요소가 thirdweb의 4337 스택 위에서 돌고, 에이전트 PoC의 D1 가스 결정이 정확히 이 노트가 짚는 트레이드오프에 달려 있습니다: thirdweb은 paymaster를 주지만 **4337 계정에 한해서**이고, 그건 위임 서사가 딛고 선 7702/7710 계정과 다른 종류입니다. **넓이는 편리합니다 — 어느 한 부분이 반드시 최고여야 하는 지점 전까지는.**",
    howItWorks:
      "Reading note across four surfaces (contract deploys, Connect wallets and account abstraction, Engine for backend-signed transactions, the Unity SDK), each rated against doing it directly. The touchpoints that matter here are named: the AA pillars already shipped, backend transactions for the AP2 path, and the Unity track the game card would need.",
    howItWorksKo:
      "네 표면(컨트랙트 배포, Connect 지갑·계정 추상화, 백엔드 서명 트랜잭션용 Engine, Unity SDK)에 걸친 정독 노트로, 각각을 직접 구현하는 경우와 견줍니다. 여기서 의미 있는 접점은 명시되어 있습니다 — 이미 나간 AA 요소들, AP2 경로의 백엔드 트랜잭션, 그리고 게임 카드가 필요로 할 Unity 트랙.",
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
    purpose:
      "A deliberate non-EVM data point: every other on-chain demo here is Ethereum-family (Hyperliquid, Sepolia AA, PBS); Solana is the largest ecosystem with a genuinely different execution model, worth understanding rather than assuming EVM concepts transfer.",
    purposeKo:
      "의도적으로 넣은 non-EVM 비교 대상입니다 — 여기 있는 다른 온체인 데모는 전부 이더리움 계열(Hyperliquid, Sepolia AA, PBS)이고, Solana는 실행 모델 자체가 다른 가장 큰 생태계라 EVM 개념이 그대로 통한다고 가정하지 않고 별도로 이해할 가치가 있습니다.",
    howItWorks:
      "Planned: an Anchor (Rust) program deployed to Solana devnet — starting with a PDA-based counter, then a small SPL-token escrow to exercise Solana's account model (all state passed in explicitly, rather than living in contract storage) and cross-program invocations. The page would connect via Phantom/wallet-adapter and call the program through its Anchor-generated TypeScript client. Not yet built.",
    howItWorksKo:
      "계획: Solana devnet에 배포하는 Anchor(Rust) 프로그램 — PDA 기반 카운터로 시작해서, Solana의 계정 모델(컨트랙트 저장소가 아니라 모든 상태를 명시적으로 전달)과 cross-program invocation을 연습할 수 있는 소규모 SPL 토큰 에스크로로 이어집니다. 페이지는 Phantom/wallet-adapter로 연결하고, Anchor가 생성한 TypeScript 클라이언트로 프로그램을 호출할 예정입니다. 아직 미구현.",
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
    purpose:
      "Consuming someone else's MCP server (Zapier's, exposing 8,000+ app integrations as tools) rather than building one from scratch — the \"client\" side of the same protocol this project's own knowledge-base work explores from the \"server\" side.",
    purposeKo:
      "직접 구축하는 대신 다른 곳의 MCP 서버(8,000개 이상의 앱 연동을 툴로 노출하는 Zapier)를 소비하는 쪽 — 이 프로젝트의 지식베이스 작업이 \"서버\" 쪽에서 다루는 것과 같은 프로토콜을 \"클라이언트\" 쪽에서 탐구합니다.",
    howItWorks:
      "Planned: a server-side route holds the Zapier MCP connection (URL + auth token, never exposed to the browser) and either forwards tool calls through the Anthropic API's native MCP connector, or acts as a generic MCP client via @modelcontextprotocol/sdk, listing available tools and executing whichever the model selects — scoped to an explicit allowlist of safe actions (e.g. \"send email to self\") to avoid handing an agent unrestricted access to real accounts. Not yet built.",
    howItWorksKo:
      "계획: 서버 라우트가 Zapier MCP 연결(URL + 인증 토큰, 브라우저에 절대 노출 안 함)을 들고 있고, Anthropic API의 네이티브 MCP 커넥터로 툴 호출을 전달하거나, @modelcontextprotocol/sdk로 직접 범용 MCP 클라이언트 역할을 하며 사용 가능한 툴 목록을 보여주고 모델이 선택한 것을 실행합니다 — 에이전트에게 실제 계정에 대한 무제한 접근을 주지 않도록 안전한 액션(예: \"내게 이메일 보내기\")만 명시적으로 허용 목록에 넣습니다. 아직 미구현.",
  },
  {
    key: "agents-computer-use",
    title: "Can Agents Use a Computer Yet?",
    titleKo: "에이전트는 이제 컴퓨터를 쓸 수 있나",
    description:
      "a16z's 2026 update on computer-use agents in production — OSWorld benchmark jump from 42% to 85% in a year, and what buyers actually pay for once the model stops being the bottleneck.",
    descriptionKo:
      "컴퓨터 사용 에이전트가 프로덕션에 들어간 2026년 a16z 업데이트 — OSWorld 벤치마크가 1년 만에 42%에서 85%로 뛴 것과, 모델이 병목이 아니게 된 뒤 구매자가 실제로 돈을 내는 지점.",
    status: "soon",
    href: "/poc/agents-computer-use",
    howTo: "Reading notes — no demo, no wallet needed.",
    howToKo: "정독 노트 — 데모 없음, 지갑 불필요.",
    purpose:
      "Tracking where computer-use agents actually stand in production, not in demos — the piece is built on interviews with real operators (a CPG data platform running 15-20M portal interactions/month, a systems integrator running 27 live workflows), not just benchmark numbers. A useful checkpoint for judging whether an \"agent operates a browser/UI\" idea is worth building now versus still a research toy.",
    purposeKo:
      "컴퓨터 사용 에이전트가 데모가 아니라 프로덕션에서 실제로 어디까지 와 있는지 추적하는 글 — 벤치마크 숫자뿐 아니라 실제 운영자 인터뷰(월 1500~2100만 건의 포털 상호작용을 처리하는 CPG 데이터 플랫폼, 27개 라이브 워크플로를 돌리는 시스템 통합사)를 근거로 삼는다. \"에이전트가 브라우저/UI를 조작한다\"는 아이디어가 지금 만들 만한 것인지, 아직 리서치 토이인지 판단할 때 쓸 만한 체크포인트.",
    howItWorks:
      "OSWorld-Verified (a real-desktop benchmark) jumped from 42% a year ago to 85% today (Claude Opus 4.6-class models), above the ~72% human baseline — but the piece's real argument is that the benchmark stopped mattering: once models cleared a \"good enough\" bar, buyers stopped comparing models and started buying infrastructure — verification, escalation, error handling, and a common pattern where an agent runs a workflow once, caches it as deterministic code, and is only re-invoked when something breaks (cost falls over a workflow's lifetime). Cost comparison: agent inference runs ~$6-8/hr ($3-15 range) versus ~$10/hr offshore BPO versus $30-45/hr fully-loaded US labor — roughly break-even against BPO today, 70-80% margin against US labor. The failure mode that matters most isn't the UI click failing, it's silent failures with no verifiable signal at run time (e.g. an insurance claim that \"succeeded\" on screen but stalls two days later on a phone call nobody logged). Source: https://www.a16z.news/p/can-agents-use-a-computer-yet-weve",
    howItWorksKo:
      "OSWorld-Verified(실제 데스크톱 환경 벤치마크)가 1년 전 42%에서 오늘 85%(Claude Opus 4.6급 모델)로 뛰어 인간 기준선 약 72%를 넘어섰다 — 하지만 글의 진짜 주장은 벤치마크가 더 이상 중요하지 않게 됐다는 것이다: 모델이 \"충분히 좋은\" 문턱을 넘자, 구매자들은 모델 비교를 멈추고 인프라를 사기 시작했다 — 검증, 에스컬레이션, 오류 처리, 그리고 에이전트가 워크플로를 한 번 실행한 뒤 결정론적 코드로 캐싱해두고 뭔가 깨질 때만 다시 호출되는 흔한 패턴(워크플로 수명 동안 비용이 떨어진다). 비용 비교: 에이전트 추론은 시간당 약 $6-8($3-15 범위) vs 역외 BPO 약 $10/hr vs 완전 부담 기준 미국 인건비 $30-45/hr — 오늘 기준 BPO와 거의 손익분기, 미국 인건비 대비 70-80% 마진. 가장 중요한 실패 유형은 UI 클릭 실패가 아니라, 실행 시점엔 검증할 신호가 없는 조용한 실패다(예: 화면상 \"접수 완료\"된 보험 청구가 이틀 뒤 아무도 기록하지 않은 전화 한 통 때문에 멈춰버리는 경우). 출처: https://www.a16z.news/p/can-agents-use-a-computer-yet-weve",
  },
  {
    // cross-border-rail-interop 뒤, tokenized-money-banks 앞에 두어 결제·증권 묶음을 만든다
    // (jay, 2026-08-18). 한국어 기사에 없던 두 가지가 카드의 축이 됐다 — 1차 발행은 Progmat
    // 이었고 이번에 ibet for Fin 으로 갈아탔다는 것, 그리고 "증권사를 거치지 않는다"는데도
    // SMBC 닛코가 재무 어드바이저로 남아 있다는 것.
    key: "st-self-distribution",
    title: "What tokenization actually removed",
    titleKo: "토큰화가 실제로 없앤 것",
    description:
      "Toyota Finance sold a ¥1B bond through its own payments app with no securities firm distributing it. The intermediary did not disappear — the account-opening step did.",
    descriptionKo:
      "토요타파이낸스가 증권사 판매 없이 자사 결제 앱으로 10억엔 채권을 팔았습니다. 사라진 것은 중개자가 아니라 증권계좌 개설 단계입니다.",
    status: "soon",
    howTo:
      "Not yet scoped — start by writing out who is still in the deal and what each one is paid for, then compare against the pre-token bond. Sources: Toyota Finance news release, 2026-08-18 issuance (self-offering, ibet for Fin); the 2025-03 first issuance for the before-picture.",
    howToKo:
      "아직 범위 미정 — 이 거래에 **아직 누가 남아 있고 각자 무엇의 대가를 받는지**를 적어 보고, 토큰화 이전 채권과 나란히 놓는 것부터. 출처: 토요타파이낸스 뉴스릴리스, 2026-08-18 발행(자체모집, ibet for Fin), 비교군으로 2025-03 1차 발행.",
    purpose:
      "The headline is disintermediation — Toyota Finance recruits investors itself, no securities firm distributing, subscribe from the TOYOTA Wallet app with no brokerage account. The interesting part is what that sentence quietly does not say. A securities firm is still in the deal: SMBC Nikko as financial advisor, Sumitomo Mitsui Bank as bond administrator. And the reason Toyota can self-distribute at all is not that a token removed a licensing requirement — the ibet for Fin consortium restricts security-token sales to FSA-registered financial instruments operators and registered financial institutions, and Toyota Finance is one. So the rail is permissioned to exactly the licensed parties it always was. What actually went away is narrower and more valuable than \"the middleman\": the **account-opening step**. In retail securities that step is where the funnel dies — a customer who already has your app is a customer who does not have to open a brokerage account, pass a new KYC, and fund it before they can buy anything. That is the claim worth testing, and it is a distribution claim, not a settlement one. Two more things are worth noticing because the Korean reporting omits them. The first issuance in 2025-03 ran on **Progmat**; this one runs on **ibet for Fin** — they switched platforms between bond one and bond two, which tells you the chain is the replaceable part. And ¥1B at a ¥100,000 minimum caps the book at 10,000 investors, which for Toyota Finance is not funding. This is a customer-engagement pilot wearing a bond.",
    purposeKo:
      "헤드라인은 탈중개입니다 — 토요타파이낸스가 직접 투자자를 모집하고, 증권사 판매가 없고, 증권계좌 없이 TOYOTA Wallet 앱에서 청약합니다. 흥미로운 부분은 **그 문장이 조용히 말하지 않는 것**입니다. 증권사는 여전히 이 거래 안에 있습니다 — SMBC 닛코가 **재무 어드바이저**, 미쓰이스미토모은행이 **사채관리자**입니다. 그리고 토요타가 자체 모집을 할 수 있는 이유는 토큰이 인가 요건을 없애서가 아닙니다 — **ibet for Fin 컨소시엄은 ST 판매·유통을 금융청 등록 금융상품거래업자와 등록금융기관으로 제한**하고, 토요타파이낸스가 바로 그 자격을 가진 곳입니다. 즉 레일은 **원래 인가받던 주체들에게 그대로 퍼미션드**입니다. 실제로 사라진 것은 \"중간상\"보다 좁고 더 값어치 있습니다: **증권계좌 개설 단계**입니다. 리테일 증권에서 퍼널이 죽는 지점이 정확히 거기입니다 — 이미 우리 앱을 쓰는 고객은 **증권계좌를 새로 열고, 새 KYC를 통과하고, 입금까지 해야** 비로소 살 수 있는 고객이 아닙니다. 검증할 값어치가 있는 주장은 이것이고, 이건 **정산이 아니라 유통(distribution)의 주장**입니다. 한국어 보도가 빠뜨린 것 둘도 짚을 값어치가 있습니다. 2025-03 1차 발행은 **Progmat** 위에서 돌았고 이번은 **ibet for Fin**입니다 — 1호와 2호 사이에 **플랫폼을 갈아탔다**는 것은 체인이 이 구조에서 **교체 가능한 부품**이라는 뜻입니다. 그리고 10억엔을 10만엔 최소 단위로 나누면 장부는 최대 **1만 명**에서 닫힙니다. 토요타파이낸스에게 이건 자금조달이 아닙니다. **채권의 옷을 입은 고객 참여 파일럿**입니다.",
    howItWorks:
      "Three things to work out, and the first is just bookkeeping. Write the participant list for this deal and for an ordinary retail bond side by side, and mark what each party is paid for: underwriter, distributor, transfer agent, bond administrator, custodian, financial advisor. The claim to test is not \"fewer parties\" but \"the same parties, different jobs\" — and if the fee stack is roughly unchanged while the customer experience is transformed, that is a finding about where value actually sat. Second, the funnel arithmetic, which is where the real number is. The pre-token path costs a customer a brokerage account, a KYC pass and a funding transfer before the first yen is invested; the token path costs an app they already opened. Model the conversion difference and it prices the whole exercise, because ¥1B is not the point — 10,000 investors already inside Toyota's ecosystem is. Third, and this is the part with no established answer: **the coupon is not all of the return.** Qualifying investors receive TOYOTA Wallet QUICPay balance, and a lottery distributes Fuji Speedway tickets and special test-drive experiences. Part of the yield is paid in ecosystem value that is only redeemable inside the issuer, which raises a question a bond desk cannot answer with a spreadsheet: what is the implied yield including perks, how do you value a non-transferable benefit, and is it a security feature or a marketing expense that happens to be attached to a security? A loyalty programme fused with a debt instrument is the actual novelty here, more than the ledger. Reads with tokenized-money-banks (the balance-sheet half of putting an asset onchain) and cross-border-rail-interop (the other case where the ledger turns out to be the replaceable part).",
    howItWorksKo:
      "따져 볼 것 셋이고, 첫째는 그냥 장부 정리입니다. **이 거래의 참여자 목록과 평범한 리테일 채권의 참여자 목록을 나란히 적고**, 각자가 무엇의 대가를 받는지 표시합니다 — 인수인, 판매사, 명의개서대리인, 사채관리자, 수탁자, 재무 어드바이저. 검증할 주장은 \"참여자가 줄었다\"가 아니라 **\"같은 참여자, 다른 역할\"**이고, **수수료 스택이 거의 그대로인데 고객 경험만 바뀌었다면** 그것 자체가 가치가 실제로 어디에 있었는지에 대한 발견입니다. 둘째, **퍼널 산수** — 진짜 숫자가 여기 있습니다. 토큰 이전 경로는 첫 1엔을 넣기 전에 고객에게 **증권계좌 + KYC 통과 + 입금 이체**를 요구하고, 토큰 경로는 **이미 열어 둔 앱**을 요구합니다. 그 전환율 차이를 모델링하면 이 실험 전체의 값이 매겨집니다. **10억엔이 요점이 아니라, 이미 토요타 생태계 안에 있는 1만 명이 요점**이기 때문입니다. 셋째, 정답이 정해져 있지 않은 부분: **쿠폰이 수익의 전부가 아닙니다.** 조건을 충족한 투자자에게 **TOYOTA Wallet QUICPay 잔액**을 주고, 추첨으로 **후지 스피드웨이 관람권과 특별 시승 체험**을 제공합니다. 수익의 일부가 **발행사 안에서만 상환되는 생태계 가치**로 지급되는 것이고, 이는 채권 데스크가 스프레드시트로 답할 수 없는 질문을 만듭니다: **혜택을 포함한 내재 수익률은 얼마이고, 양도 불가능한 편익을 어떻게 평가하며, 이것은 증권의 특성인가 아니면 증권에 붙은 마케팅 비용인가?** **로열티 프로그램과 채무증권의 융합**이 여기서의 진짜 새로움이지 원장이 아닙니다. `tokenized-money-banks`(자산을 온체인에 올릴 때의 대차대조표 절반), `cross-border-rail-interop`(원장이 교체 가능한 부품으로 드러나는 또 다른 사례)과 함께 읽습니다.",
  },
  {
    // 기존 카드에 덧붙이지 않고 새로 만들었다 (jay, 2026-08-18). tokenized-money-banks 가
    // 제일 가깝지만 그건 "정산 자산을 은행 대차대조표에서 어떻게 다루나"(바젤 LCR/NSFR)이고,
    // 이 카드는 "국가 간 레일을 어떻게 잇나"라 질문이 다르다. 특정 리포트의 정독 노트인
    // 그 카드에 국가 간 상호운용 얘기를 섞으면 주제가 흐려져서, 대신 서로 참조만 걸었다.
    // 바로 앞에 둔 것은 둘이 같은 묶음으로 읽히게 하려는 것.
    key: "cross-border-rail-interop",
    title: "Linking payment systems is a routing problem",
    titleKo: "결제 시스템을 잇는 것은 라우팅 문제다",
    description:
      "Most of what \"link national payment systems and CBDCs\" requires is addressing, FX quoting and settlement coordination — and a shared ledger only earns its place on one of them.",
    descriptionKo:
      "\"국가 결제 시스템과 CBDC를 잇는다\"에 실제로 필요한 일은 대부분 주소 지정·FX 호가·정산 조율이고, 공유 원장이 값을 하는 자리는 그중 하나뿐입니다.",
    status: "soon",
    howTo:
      "Not yet scoped — start by splitting \"linking\" into its four jobs and marking which one a shared ledger actually improves, using BIS Project Nexus as the no-ledger baseline. Source: RBI governor's remarks on BRICS weighing payment-system and CBDC links (2026-08, early stage); BIS Nexus and mBridge published material.",
    howToKo:
      "아직 범위 미정 — \"잇는다\"를 네 가지 일로 쪼개고 공유 원장이 실제로 개선하는 것이 어느 쪽인지 표시하는 것부터. 무원장 기준선은 BIS Project Nexus. 출처: BRICS가 결제 시스템·CBDC 연결을 검토 중이라는 RBI 총재 발언(2026-08, 초기 단계), BIS Nexus·mBridge 공개 자료.",
    purpose:
      "The news is real and the conclusion attached to it usually is not, which is why this belongs in the catalogue rather than in a bookmark. India's central bank governor has said BRICS is weighing links between national fast-payment systems and CBDCs — UPI and CIPS are the systems named — and the reporting is explicit that this is early-stage, with technical, regulatory and governance hurdles outstanding. What the reporting does not contain is any public chain. Every \"and this is where chain X becomes extremely relevant\" post supplies that step itself, and the gap between the sourced claim and the appended one is the same gap the rwa-multichain card was written to record. So the question worth building around is not whether a particular ledger wins a mandate, but the prior one: when you connect N national payment systems, what actually has to be shared? Break the work into addressing and routing, FX price discovery, liquidity and prefunding, and final settlement, and most of it is a messaging and standards problem that BIS Project Nexus already solves with a hub-and-spoke model and no ledger at all. The one leg where a shared ledger has a genuine argument is settlement atomicity: across time zones neither bank wants to pay first, and that Herstatt exposure is what correspondent banking handles worst.",
    purposeKo:
      "뉴스는 진짜이고 거기 붙은 결론은 대개 아닌데, 그래서 이건 북마크가 아니라 카탈로그에 들어갑니다. 인도 중앙은행 총재가 **BRICS가 국가 즉시결제 시스템과 CBDC의 연결을 검토 중**이라고 말했고 — 거명된 시스템은 UPI와 CIPS입니다 — 보도는 이것이 **초기 단계**이며 기술·규제·거버넌스 장애물이 남아 있다고 분명히 적습니다. **보도에 없는 것은 어떤 공개 체인도 언급되지 않는다는 점**입니다. \"그래서 여기서 X 체인이 극도로 중요해진다\"는 글들은 그 단계를 **스스로 채워 넣은 것**이고, 출처가 있는 주장과 덧붙여진 주장 사이의 그 간극이 바로 `rwa-multichain` 카드를 쓰게 만든 그 간극입니다. 그래서 만들 가치가 있는 질문은 어느 원장이 채택되느냐가 아니라 그 앞의 질문입니다: **N개의 국가 결제 시스템을 연결할 때 실제로 공유되어야 하는 것은 무엇인가?** 일을 **주소 지정·라우팅**, **FX 가격 발견**, **유동성·선충전**, **최종 정산** 넷으로 쪼개 보면 대부분은 메시징과 표준의 문제이고, **BIS Project Nexus가 원장 없이 허브앤스포크로 이미 풀고 있는 것**입니다. 공유 원장이 진짜 논거를 갖는 유일한 다리는 **정산 원자성**입니다 — 시차를 사이에 두고 어느 은행도 먼저 내고 싶어 하지 않으며, 그 헤르슈타트 익스포저가 코레스 뱅킹이 가장 못 다루는 부분입니다.",
    howItWorks:
      "The comparison has a built-in baseline, which is what makes it measurable rather than speculative. Nexus is the no-ledger arm: a multilateral hub so each domestic instant-payment system makes one connection instead of N-squared bilateral ones, with a prototype that connected the test systems of the Eurosystem, Malaysia and Singapore and let payments be addressed by mobile number, now extending across ASEAN. That is the bar. mBridge is the ledger arm: a chain built by central banks for central banks for multi-currency CBDC settlement, at minimum-viable-product stage as of 2024 — and the question to put to it is not whether it works but what it bought over the hub. The measurable core is the prefunding number. Correspondent banking's real cost is not the fee, it is nostro and vostro balances parked in every corridor to cover settlement risk, and that capital is idle by construction. Model one corridor with and without atomic payment-versus-payment, and the difference in required prefunded liquidity, derived from corridor volume, settlement lag and FX volatility, is a figure that decides the argument rather than restating it. Only after that is there a fair way to assess a specific chain. XRPL's relevant features for this are the native DEX with auto-bridging and escrow, which target the FX and PvP leg rather than the messaging leg — so the honest comparison is that leg against a Nexus-style hub plus existing RTGS, and it is not the comparison the promotional posts make. One constraint belongs in the card so the measurement does not mislead: adoption here is decided by governance rather than throughput. Who operates the hub, whose currency bridges, what happens under sanctions, and whether a member can be excluded are the questions that have historically settled which rail wins, and a card that measured only latency and cost would be measuring the wrong thing. Reads alongside tokenized-money-banks, which asks the balance-sheet half of the same subject.",
    howItWorksKo:
      "비교에 **기준선이 이미 존재**한다는 점이 이 작업을 추측이 아니라 측정으로 만듭니다. **Nexus가 무원장 쪽**입니다 — 각 국내 즉시결제 시스템이 N제곱의 양자 연결 대신 **한 번만 연결**하면 되는 다자 허브이고, 시제품이 유로시스템·말레이시아·싱가포르의 테스트 시스템을 연결해 **휴대폰 번호로 주소 지정**해 송금하는 것을 보였으며 지금 ASEAN 전역으로 확장 중입니다. **이게 넘어야 할 선**입니다. **mBridge가 원장 쪽**입니다 — 중앙은행이 중앙은행을 위해 만든 다중통화 CBDC 정산용 체인으로 2024년 기준 MVP 단계이고, 여기 던질 질문은 작동하느냐가 아니라 **허브 대비 무엇을 더 샀느냐**입니다. 측정의 핵심은 **선충전 금액**입니다. 코레스 뱅킹의 진짜 비용은 수수료가 아니라 정산 위험을 덮으려고 **모든 코리도에 세워 두는 노스트로·보스트로 잔고**이고, 그 자본은 구조적으로 놀고 있습니다. 코리도 하나를 **원자적 PvP가 있을 때와 없을 때**로 모델링하고, 코리도 거래량·정산 지연·FX 변동성에서 도출한 **필요 선충전 유동성의 차이**를 구하면, 논쟁을 되풀이하는 대신 **결정하는 숫자**가 나옵니다. 특정 체인을 공정하게 평가할 수 있는 것은 그다음입니다. XRPL이 여기서 갖는 관련 기능은 **네이티브 DEX의 자동 브리징과 에스크로**로, 메시징 다리가 아니라 **FX·PvP 다리**를 겨냥합니다 — 그러니 정직한 비교는 **그 다리 대 Nexus식 허브 + 기존 RTGS**이고, 홍보성 글들이 하는 비교는 이것이 아닙니다. 측정이 오도되지 않도록 제약 하나를 카드에 넣어 둡니다: **여기서 채택을 결정하는 것은 처리량이 아니라 거버넌스**입니다. 허브를 누가 운영하는가, 누구의 통화가 브리지가 되는가, 제재 상황에서는 어떻게 되는가, 회원을 배제할 수 있는가 — 역사적으로 어느 레일이 이기는지를 결정해 온 것은 이 질문들이고, 지연시간과 비용만 재는 카드는 **틀린 것을 재는 것**입니다. 같은 주제의 대차대조표 절반을 다루는 `tokenized-money-banks`와 함께 읽습니다.",
  },
  {
    key: "tokenized-money-banks",
    title: "Tokenized Money for Banks",
    titleKo: "은행을 위한 토큰화된 화폐",
    description:
      "Tempo Research's primer on the three product families banks can use to put a settlement asset onchain — tokenized deposits, first-party stablecoins, and third-party stablecoins — and the Basel LCR/NSFR cost each one hard-codes.",
    descriptionKo:
      "은행이 결제 자산을 온체인에 올릴 때 쓸 수 있는 세 가지 상품군 — 토큰화 예금, 1자 발행 스테이블코인, 3자 스테이블코인 — 과 각각이 하드코딩하는 바젤 LCR/NSFR 비용을 정리한 Tempo Research 리포트.",
    status: "soon",
    href: "/poc/tokenized-money-banks",
    howTo: "Reading notes — no demo, no wallet needed.",
    howToKo: "정독 노트 — 데모 없음, 지갑 불필요.",
    purpose:
      "A structured way to read every \"bank issues a stablecoin\" headline: the report separates three genuinely different balance-sheet moves that get talked about as one thing, and shows why a bank ends up needing all three rather than picking a winner. Useful background for anything touching bank-adjacent stablecoin rails or institutional settlement design.",
    purposeKo:
      "\"은행이 스테이블코인을 발행한다\"는 헤드라인들을 구조적으로 읽는 방법 — 하나로 뭉뚱그려 얘기되는 세 가지 실제로 다른 대차대조표 움직임을 분리하고, 은행이 왜 하나를 고르는 대신 셋 다 필요하게 되는지 보여준다. 은행 인접 스테이블코인 레일이나 기관 결제 설계를 건드리는 작업에 유용한 배경지식.",
    howItWorks:
      "Three families, each a different trade on the balance sheet. (1) Tokenized deposits — the claim stays a deposit, just wrapped in a token; cheapest Basel treatment (25% LCR runoff, 50% NSFR ASF for the permissioned variant) but narrow reach — JPMD on Base is the live example. (2) First-party stablecoins — the bank issues against a segregated reserve pool; the claim converts from deposit to redemption contract, which is the expensive move: LCR runoff jumps from 25% to 100%, NSFR ASF drops from 50% to 0%, and it can be issued on the parent's own balance sheet, through a licensed subsidiary, or through a bank consortium. (3) Third-party stablecoins — the bank doesn't issue at all, just facilitates access (prefunded inventory or a deposit-secured loan) to reach venues that don't accept bank-claim tokens, at the cost of the claim leaving the bank's balance sheet entirely. The report's core claim: these aren't competing options, they're complementary — a single institutional client might use a tokenized deposit for intra-network settlement, a first-party stablecoin for treasury rebalancing, and a third-party stablecoin to hedge weekend exposure on Hyperliquid-style venues, so a bank offering only one can't fully serve them. Source: https://research.4pillars.io/en/research/tokenized-money-for-banks",
    howItWorksKo:
      "세 개의 상품군, 각각 대차대조표에서 다른 트레이드를 만든다. (1) 토큰화 예금 — 청구권은 여전히 예금이고 토큰으로 감싸기만 함; 바젤 처리가 가장 저렴(퍼미션드 변형은 LCR 유출 25%, NSFR ASF 50%)하지만 도달 범위가 좁음 — Base 위의 JPMD가 실제 사례. (2) 1자 발행 스테이블코인 — 은행이 분리된 준비금 풀을 대가로 발행; 청구권이 예금에서 상환 계약으로 바뀌는 게 비싼 지점이다: LCR 유출이 25%→100%로, NSFR ASF가 50%→0%로 바뀌고, 모회사 자체 대차대조표·인가받은 자회사·은행 컨소시엄 중 하나로 발행 가능. (3) 3자 스테이블코인 — 은행이 아예 발행하지 않고 접근만 중개(선충전 재고 또는 예금 담보 대출)해서 은행 청구 토큰을 받지 않는 venue에 도달하되, 대가로 청구권이 은행 대차대조표를 완전히 떠난다. 리포트의 핵심 주장: 이 셋은 경쟁 관계가 아니라 상호보완적이다 — 한 기관 고객이 네트워크 내 결제엔 토큰화 예금을, 트레저리 리밸런싱엔 1자 스테이블코인을, Hyperliquid류 venue의 주말 익스포저 헤지엔 3자 스테이블코인을 동시에 쓸 수 있어, 하나만 제공하는 은행은 그 고객을 완전히 커버할 수 없다. 출처: https://research.4pillars.io/en/research/tokenized-money-for-banks",
  },
  {
    key: "dvt",
    title: "DVT in the protocol",
    titleKo: "프로토콜에 흡수된 DVT",
    // 상세 페이지를 손으로 쓴다 (jay, 2026-08-13) — 생성된 이중언어 카드 요약은 그대로 두고,
    // 그 아래에 사고 실험 세션 노트를 덧붙인 형태다. 생성기는 docsHref 가 topics/ 를 가리키면
    // 그 파일을 정본으로 보고 덮어쓰지도 지우지도 않는다.
    docsHref: "topics/pocs-dvt.html",
    description: "Reading notes on absorbing distributed validators into the protocol — m-of-n without splitting keys, plus what it makes buildable.",
    descriptionKo: "분산 밸리데이터를 프로토콜이 직접 다루자는 제안 정독 노트 — 키를 쪼개지 않는 m-of-n, 그리고 그것이 만들어내는 것들.",
    // 목업이지 라이브가 아니다 (jay, 2026-08-11) — 페이지는 완성됐지만 돌아가는 건 없다.
    // /live 는 "열어서 실제로 해볼 수 있는 것"만 답해야 하고, 정독 노트는 거기 해당하지 않는다.
    // href 는 그대로라 카드는 계속 눌린다 — DemoCard 가 soon+href 를 목업 배지로 렌더한다.
    status: "done",
    href: "/poc/dvt",
    date: "2026-08-05",
    howTo: "Read-only design analysis — no wallet needed. Start with the two diagrams contrasting DVT today against the proposal.",
    howToKo: "읽기 전용 설계 분석 — 지갑 불필요. 오늘의 DVT와 제안을 대비시킨 다이어그램 두 장부터 보세요.",
    purpose:
      "Reading a live protocol-design discussion closely enough to separate three things people usually blur: what the proposal actually changes, what it leaves unresolved, and which parts of the idea can be built one layer up without waiting for it. It is also a second instance of a pattern this site already documents elsewhere — middleware doing a job well until the protocol absorbs it, which is exactly what ERC-4337 bundlers face from native account abstraction.",
    purposeKo:
      "진행 중인 프로토콜 설계 논의를, 사람들이 흔히 뭉뚱그리는 세 가지를 분리할 만큼 자세히 읽는 작업입니다: 제안이 실제로 바꾸는 것, 미해결로 남긴 것, 그리고 제안을 기다리지 않고 한 층 위에서 지금 만들 수 있는 부분. 이 사이트가 이미 다른 곳에서 기록하고 있는 패턴의 두 번째 사례이기도 합니다 — 미들웨어가 어떤 일을 잘 해내다가 프로토콜에 흡수되는 흐름으로, ERC-4337 번들러가 네이티브 계정 추상화 앞에서 맞고 있는 상황과 같습니다.",
    howItWorks:
      "Today's DVT (Obol, SSV) splits one validator key with Shamir sharing or threshold BLS and runs an off-chain consensus round to reassemble a signature each time; the protocol still sees a single validator, and all distribution lives in middleware. The proposal never splits the key: each participant registers their own (n ≤ 16), the protocol groups them m-of-n, and BLS aggregation plus a participation bitfield — the same grammar as today's attestation aggregation — decides whether enough took part. That removes both the per-signature consensus round and the DKG ceremony, and it is only possible because EIP-7251 raised the max effective balance so that 32·n ETH standing up n slots is arithmetic the protocol can do internally. The page is explicit that this is an ethresear.ch-stage discussion with no assigned EIP number, lists the four questions it leaves open (slashing attribution, latency budget, the m<n collusion trade-off, the n ≤ 16 rationale), and separates PoC candidates into those buildable today at the application layer and those that genuinely wait on adoption.",
    howItWorksKo:
      "오늘의 DVT(Obol·SSV)는 하나의 밸리데이터 키를 샤미르 분할이나 임계 BLS로 쪼갠 뒤, 서명이 필요할 때마다 오프체인 합의 라운드로 재조립합니다 — 프로토콜은 여전히 밸리데이터 하나만 보고, 분산은 전부 미들웨어에 삽니다. 제안은 키를 쪼개지 않습니다: 각 참여자가 자기 키를 등록하고(n ≤ 16), 프로토콜이 m-of-n으로 묶으며, BLS 집계와 참여 비트필드(오늘날 attestation 집계와 같은 문법)로 충분한 인원이 참여했는지 판정합니다. 이로써 서명마다의 합의 라운드와 DKG 세리머니가 함께 사라지고, 이것이 가능한 이유는 EIP-7251이 유효 잔고 상한을 올려 32·n ETH가 n개 슬롯을 세운다는 산수를 프로토콜이 내부적으로 할 수 있게 되었기 때문입니다. 페이지는 이것이 EIP 번호가 없는 ethresear.ch 단계의 논의임을 명시하고, 미해결로 남은 질문 넷(슬래싱 귀속, 지연 예산, m<n 공모 트레이드오프, n ≤ 16의 근거)을 나열하며, PoC 후보를 애플리케이션 계층에서 지금 만들 수 있는 것과 실제로 채택을 기다려야 하는 것으로 구분합니다.",
    diagrams: [
      {
        title: "Today — one key split, reassembled outside the protocol",
        titleKo: "오늘 — 키 하나를 쪼개, 프로토콜 밖에서 재조립",
        src: `flowchart LR
    K["One validator key"] -->|"Shamir / threshold BLS"| S1["Share 1"]
    K --> S2["Share 2"]
    K --> S3["Share 3"]
    S1 --> C["Off-chain consensus round<br/>QBFT-family, every signature"]
    S2 --> C
    S3 --> C
    C -->|"reassembled signature"| P["Protocol<br/>sees one validator"]`,
      },
      {
        title: "The proposal — separate keys, grouped m-of-n by the protocol",
        titleKo: "제안 — 따로 있는 키들을 프로토콜이 m-of-n으로 묶음",
        src: `flowchart LR
    K1["Participant 1<br/>own key"] --> AGG["BLS aggregate<br/>+ participation bitfield"]
    K2["Participant 2<br/>own key"] --> AGG
    K3["Participant 3<br/>own key"] --> AGG
    AGG -->|"m of n present?"| P["Protocol<br/>groups them natively"]
    P -->|"bitfield is public"| D["Per-operator uptime<br/>becomes on-chain data"]`,
      },
    ],
  },
  {
    key: "toss-payments",
    title: "Toss Payments",
    titleKo: "토스페이먼츠",
    description: "KRW settlement example via Toss Payments — the domestic counterpart to AP2/Stripe.",
    descriptionKo: "토스페이먼츠를 통한 KRW 정산 예시 — AP2/Stripe의 국내 버전.",
    status: "live",
    href: "/poc/toss",
    date: "2026-08-04",
    howTo: "Click \"buy\" → Toss test Checkout.",
    howToKo: "\"구매\" 클릭 → 토스 테스트 결제.",
    purpose:
      "The KRW-native counterpart to the Stripe example — the same agentic-settlement pattern, but through Korea's dominant local payment rail instead of an international one, since Stripe doesn't yet support merchant accounts registered in Korea.",
    purposeKo:
      "Stripe 예시의 KRW 버전 — 같은 에이전틱 결제 패턴을, 국제 결제망이 아니라 한국의 대표적인 로컬 결제 레일로 보여줍니다. Stripe가 아직 한국에 등록된 가맹점 계정을 지원하지 않기 때문에 나온 대안입니다.",
    howItWorks:
      "The client loads Toss's hosted payment SDK via script tag and calls requestPayment, redirecting to Toss's payment page. On successful return, the query string carries a paymentKey/orderId/amount triple, which the server independently re-submits to Toss's payment-confirmation API using a server-only secret key before releasing the purchased content. Because Toss's confirm endpoint checks the submitted amount against what it actually authorized, a tampered redirect URL (e.g. a lower amount) fails confirmation server-side rather than being trusted.",
    howItWorksKo:
      "클라이언트가 script 태그로 Toss의 호스팅 결제 SDK를 로드하고 requestPayment를 호출해 Toss 결제 페이지로 리다이렉트합니다. 결제 성공 후 돌아오면 쿼리스트링에 paymentKey/orderId/amount가 담겨 있고, 서버가 서버 전용 secret key로 Toss의 결제승인 API에 이를 독립적으로 다시 제출한 뒤에만 구매 콘텐츠를 공개합니다. Toss의 confirm 엔드포인트가 제출된 금액을 실제 승인된 금액과 대조하기 때문에, 리다이렉트 URL을 조작(예: 금액을 낮춤)해도 서버 측 승인에서 걸러지고 그대로 신뢰되지 않습니다.",
    diagrams: [
      {
        title: "Payment window, then server-side confirmation",
        titleKo: "결제창, 그리고 서버 측 승인",
        src: `sequenceDiagram
    participant U as Browser (visitor)
    participant TW as Toss Payment Widget SDK
    participant T as Toss Payments
    participant S as rabbit server

    U->>TW: requestPayment() [client key]
    TW->>T: open hosted payment page
    U->>T: pay (test card)
    T-->>U: redirect /poc/toss?paymentKey&orderId&amount
    U->>S: GET /poc/toss?...
    S->>T: POST /v1/payments/confirm [secret key]
    T-->>S: status "DONE" (rejects on amount mismatch)
    S-->>U: release purchased content`,
      },
    ],
  },
  // ── 학습 백로그 (jay의 Notion 큐에서 옮겨온 항목들, 2026-08-13 추가).
  // 아직 스코프도 안 잡힌 "읽기/훑어보기" 대상이라 href 없음 — 실제로 뭔가 만들면 그때 카드를 바꾼다.
  {
    key: "google-adk-mcp",
    title: "Google ADK Python 2.5 — agent-as-MCP-server",
    titleKo: "Google ADK Python 2.5 훑어보기",
    description:
      "New ADK release: sandboxed code exec on Cloud Run, serving an agent as an MCP server, and a fresh ADK Go — the 30-minute question is whether a verex-desk subagent can be wrapped in ADK and called from Claude via MCP.",
    descriptionKo:
      "ADK 새 릴리스: Cloud Run 샌드박스 코드 실행 격리, 에이전트를 MCP 서버로 서빙, ADK Go 신규 릴리스 — verex-desk 서브에이전트를 ADK로 감싸 Claude에서 MCP로 부를 수 있는지가 30분 질문.",
    status: "soon",
    howTo:
      "Not yet scoped — a 30-minute skim. Start with the MCP-serving section of the release log. (Notion queue, added 2026-08-08.)",
    howToKo:
      "아직 범위 미정 — 30분 훑어보기. 릴리스 로그의 MCP 서빙 섹션부터. (Notion 지시, 2026-08-08 추가.)",
    purpose:
      "\"Serving an agent as an MCP server\" is the piece that lines up exactly with Claude's MCP ecosystem — the question worth 30 minutes is whether a verex-desk subagent can be wrapped in ADK and called from Claude over MCP.",
    purposeKo:
      "\"에이전트를 MCP 서버로\" = Claude 쪽 MCP 생태계와 정확히 맞물리는 조각 — verex-desk의 서브에이전트를 ADK로 감싸 Claude에서 호출하는 구조가 가능한지가 30분 질문.",
    howItWorks:
      "The new Agent Development Kit release: sandboxed code execution isolation on Cloud Run, the ability to serve an agent as an MCP server, and improved Live API. ADK Go also shipped a new release.",
    howItWorksKo:
      "Agent Development Kit의 새 릴리스: Cloud Run 샌드박스에서 코드 실행 격리 · 에이전트를 MCP 서버로 서빙 가능 · Live API 개선. ADK Go도 새 릴리스.",
  },
  {
    key: "google-skills-repo",
    title: "Google Skills Repository — 90+ agent skills",
    titleKo: "Google Skills Repository(90+ 스킬) 둘러보기",
    description:
      "~90 distilled-knowledge skills for agents (product, architecture, best practices) — same family as Claude's SKILL.md ecosystem, worth comparing formats and trigger design.",
    descriptionKo:
      "에이전트용 '증류된 지식' 스킬 ~90개(제품·아키텍처·베스트 프랙티스) — Claude의 SKILL.md 생태계와 같은 계열, 스킬 포맷과 트리거 설계 비교.",
    status: "soon",
    howTo:
      "Not yet scoped — a 30-minute skim. Pick 2-3 well-written skills and steal their structure. (Notion queue, added 2026-08-08.)",
    howToKo:
      "아직 범위 미정 — 30분 훑어보기. 잘 쓴 스킬 2~3개를 골라 구조만 훔쳐오기. (Notion 지시, 2026-08-08 추가.)",
    purpose:
      "This report itself runs on a SKILL.md, so the value isn't the content — it's comparing how Google structures skill format and trigger design against Claude's approach.",
    purposeKo:
      "이 리포트 자체가 SKILL.md로 굴러가므로, 스킬 포맷이 어떻게 다른가(트리거 설계·구조)를 비교하는 것이 값어치.",
    howItWorks:
      "~90 skills of distilled knowledge for agents — product, architecture, and best-practice knowledge packaged the same way Claude's SKILL.md ecosystem is.",
    howItWorksKo:
      "에이전트용 '증류된 지식' 스킬 ~90개(제품·아키텍처·베스트 프랙티스). Claude의 SKILL.md 생태계와 같은 계열.",
  },
  {
    key: "ai-agent-course",
    title: "Free 3-hour AI agent build & monetize course",
    titleKo: "AI 에이전트 구축·수익화 3시간 무료 코스 훑기",
    description:
      "A free ex-Google-engineer course spanning agent design, human handoff, RAG/vector DBs, Cloud deployment, WhatsApp monetization, and loops-vs-graphs — the value is seeing the whole stack in one arc.",
    descriptionKo:
      "전 구글 엔지니어의 무료 코스 — 에이전트 설계부터 휴먼 핸드오프, RAG·벡터DB, Cloud 배포, WhatsApp 수익화, 루프 vs 그래프까지 전체 스택을 한 번에.",
    status: "soon",
    howTo:
      "Not yet scoped — first 30 minutes: the design intro (00:00) and the loops-vs-graphs chapter (2:24). (Notion queue, added 2026-08-07.)",
    howToKo:
      "아직 범위 미정 — 첫 30분: 목차 기준 00:00(설계)·2:24(루프 vs 그래프)만. (Notion 지시, 2026-08-07 추가.)",
    purpose:
      "The value is the end-to-end arc — Agents → RAG → Deployment → Leads → Revenue in one course, sitting at the intersection of the LLM track (RAG/agents) and the \"sell AI agent services\" business category.",
    purposeKo:
      "전체 스택(Agents → RAG → Deployment → Leads → Revenue)을 한 번에 보여주는 구성이 값어치 — LLM 트랙(RAG·에이전트 파트)과 'AI 에이전트 서비스 판매' 비즈니스 카테고리의 교차점.",
    howItWorks:
      "Agent system design → human handoff → RAG/vector DBs → Google Cloud deployment → WhatsApp monetization → conversation-to-lead conversion → loops vs. graphs → multi-tool agent graphs.",
    howItWorksKo:
      "에이전트 시스템 설계 → 휴먼 핸드오프 → RAG·벡터 DB → Google Cloud 배포 → WhatsApp 유료 비즈니스화 → 대화→리드 전환 → 루프 vs 그래프 → 멀티툴 에이전트 그래프.",
  },
  {
    key: "circuit-breaker-saga",
    later: true, // 지금은 중요하지 않음 (jay, 2026-08-14)
    title: "Microservice patterns — Circuit Breaker & Saga",
    titleKo: "마이크로서비스 디자인 패턴 2제 정리",
    description:
      "Circuit Breaker (fail fast on inter-service calls, probe recovery half-open) and Saga (distributed transactions as local-transaction chains plus compensations) — verex's settlement pipeline is a Saga; its RPC/indexer calls want a breaker.",
    descriptionKo:
      "Circuit Breaker(서비스 간 통신 — 실패 임계치 넘으면 회로 개방, 유예 후 half-open 복구 탐색)와 Saga(분산 트랜잭션을 로컬 트랜잭션 연쇄+보상 트랜잭션으로) 정리.",
    status: "soon",
    howTo: "Not yet scoped — a reading note. (Notion queue, added 2026-08-07.)",
    howToKo: "아직 범위 미정 — 정독 노트. (Notion 지시, 2026-08-07 추가.)",
    purpose:
      "Verex's settlement pipeline (oracle lookup → settlement → payout) is literally a Saga, and its RPC/indexer calls want a circuit breaker as a baseline.",
    purposeKo:
      "Verex 연결: 정산 파이프라인(오라클 조회→정산→페이아웃)이 정확히 Saga 구조이고, RPC·인덱서 호출부에는 Circuit Breaker가 기본기입니다.",
    howItWorks:
      "Circuit Breaker (inter-service calls): trip the circuit and fail fast once failures cross a threshold, then probe recovery half-open after a cooldown. Saga (data consistency): resolve a distributed transaction as a chain of local transactions plus compensating transactions — eventual consistency without 2PC.",
    howItWorksKo:
      "① Circuit Breaker(서비스 간 통신): 연쇄 장애 방지 — 실패가 임계치를 넘으면 회로를 열어 호출을 즉시 실패시키고, 유예 후 half-open으로 회복을 탐색. ② Saga(데이터 일관성): 분산 트랜잭션을 로컬 트랜잭션의 연쇄 + 보상 트랜잭션(compensation)으로 풀기 — 2PC 없이 최종 일관성.",
  },
  {
    key: "slack-claude-notion",
    later: true, // 지금은 중요하지 않음 (jay, 2026-08-14)
    title: "Slack · Claude · Notion integration",
    titleKo: "Slack · Claude · Notion 통합해 보기",
    description:
      "Wire the three tools together via Claude's Slack/Notion MCP connectors — e.g. a Slack thread that Claude summarizes and logs to Notion.",
    descriptionKo:
      "Claude의 Slack/Notion 커넥터(MCP)로 세 도구를 잇는 워크플로우 실험 — 예: Slack 대화 → Claude 정리 → Notion 기록.",
    status: "soon",
    howTo: "Not yet scoped.",
    howToKo: "아직 범위 미정.",
    purpose:
      "Connects to the still-on-hold \"Claude Tag for Slack\" idea — this is the workflow that idea would actually serve.",
    purposeKo: "보류 중인 'Slack용 Claude Tag' 아이디어와 연결.",
    howItWorks:
      "Experiment with Claude's Slack/Notion connectors (MCP) to chain the three tools — e.g. a Slack conversation gets summarized by Claude and logged to Notion.",
    howItWorksKo:
      "Claude의 Slack/Notion 커넥터(MCP)로 세 도구를 잇는 워크플로우 실험. 예: Slack 대화 → Claude 정리 → Notion 기록.",
  },
  {
    key: "claude-tag-slack",
    later: true, // 지금은 중요하지 않음 (jay, 2026-08-14)
    title: "\"Claude Tag\" for Slack (on hold)",
    titleKo: "(보류) Slack용 'Claude Tag' 시도",
    description: "On hold — would lean on Notion↔Slack integration features.",
    descriptionKo: "보류 — Notion↔Slack 연동 기능 활용 예정.",
    status: "soon",
    howTo: "On hold, not yet scoped.",
    howToKo: "보류 — 아직 범위 미정.",
    purpose:
      "Feeds into the Slack · Claude · Notion integration item above rather than standing alone.",
    purposeKo: "위 'Slack · Claude · Notion 통합' 항목과 연결되는 아이디어.",
    howItWorks:
      "Would lean on Notion↔Slack integration features to bring a Claude Tag-style presence into Slack.",
    howItWorksKo: "Notion↔Slack 연동 기능을 활용.",
  },
  {
    key: "apple-container",
    title: "Apple container",
    titleKo: "Apple `container` 써보기",
    description:
      "Apple's official open-source tool for running Linux containers as lightweight VMs on Apple Silicon — a Docker Desktop alternative candidate.",
    descriptionKo:
      "애플 공식 오픈소스 — Mac(Apple Silicon)에서 Linux 컨테이너를 경량 VM으로 실행 — Docker Desktop 대안 검토.",
    status: "soon",
    howTo: "Not yet scoped. github.com/apple/container",
    howToKo: "아직 범위 미정. github.com/apple/container",
    purpose:
      "A Docker Desktop alternative candidate for local infra across two PCs and midnight automated jobs.",
    purposeKo: "Docker Desktop 대안 검토 — 2대 PC·자정 자동작업의 로컬 인프라 후보.",
    howItWorks:
      "Apple's official open source — runs Linux containers as lightweight VMs on Apple Silicon Macs. Written in Swift, OCI-compatible (pulls/pushes Docker images as-is), at 1.0.0, requires macOS 26.",
    howItWorksKo:
      "애플 공식 오픈소스 — Mac(Apple Silicon)에서 Linux 컨테이너를 경량 VM으로 실행. Swift 제작 · OCI 호환(Docker 이미지 그대로 pull/push) · 1.0.0 릴리스 · macOS 26 필요.",
  },
  {
    key: "alibaba-page-agent",
    title: "Alibaba page-agent",
    titleKo: "Alibaba `page-agent` 살펴보기",
    description:
      "An in-page GUI agent (24k★) — one script tag or npm install lets natural language drive a webpage's UI, no screenshots or browser extension needed.",
    descriptionKo:
      "웹페이지 안에 심는 in-page GUI 에이전트(24k★) — 스크립트 한 줄/npm으로 자연어로 웹 UI 조작, 스크린샷·확장 불필요.",
    status: "soon",
    howTo: "Not yet scoped. github.com/alibaba/page-agent",
    howToKo: "아직 범위 미정. github.com/alibaba/page-agent",
    purpose:
      "Same family as Clicky's \"landing conversation layer\" — a candidate for a Verex landing/SaaS copilot or smart form-filling.",
    purposeKo:
      "Clicky의 '랜딩 대화 레이어'와 같은 계열 — Verex 랜딩/SaaS 코파일럿·스마트 폼 채우기 후보.",
    howItWorks:
      "An in-page GUI agent embedded directly in a webpage — one script tag or npm install lets natural language operate the web UI. No screenshots, browser extension, or headless browser needed (text-based DOM); connects to any LLM (BYO); has a beta MCP server; built on browser-use.",
    howItWorksKo:
      "웹페이지 안에 심는 in-page GUI 에이전트 — 스크립트 한 줄/npm으로 '자연어로 웹 UI 조작'. 스크린샷·브라우저 확장·헤드리스 불필요(텍스트 기반 DOM) · LLM 자유 연결(BYO) · MCP 서버 베타 · browser-use 기반.",
  },
  {
    key: "google-glass-stitch",
    title: "Google Glass form factor & Stitch",
    titleKo: "Google Glass · Stitch",
    description:
      "A note that Google Glass will likely land as a \"use only when needed\" form factor, plus trying out Stitch.",
    descriptionKo:
      "Google Glass는 '필요할 때만 쓰는' 형태가 될 것이라는 메모, 그리고 Stitch 사용해보기.",
    status: "soon",
    howTo: "Not yet scoped.",
    howToKo: "아직 범위 미정.",
    purpose: "A quick idea to revisit, not yet expanded.",
    purposeKo: "짧게 남겨둔 메모 — 아직 펼쳐보지 않음.",
    howItWorks:
      "Google Glass is expected to land as a \"use only when needed\" form factor rather than always-on wear; separately, try out Stitch.",
    howItWorksKo: "Google Glass는 '필요할 때만 쓰는' 형태가 될 것 · Stitch 사용해보기.",
  },
  {
    key: "simplicity-ctf",
    title: "Simplicity CTF",
    titleKo: "Simplicity CTF 나중에 도전",
    description:
      "Blockstream's first Simplicity CTF — unlock 0.01 LBTC (~$600) locked in a contract for the reward; hands-on practice with Simplicity, the new smart-contract language for Bitcoin/Liquid.",
    descriptionKo:
      "Blockstream의 첫 Simplicity CTF — 컨트랙트에 잠긴 0.01 LBTC(~$600) 해제하면 보상. Simplicity(비트코인/Liquid용 신 스마트컨트랙트 언어) 실전 학습 기회.",
    status: "soon",
    howTo:
      "Not yet scoped — for later. github.com/Arvolear/simplicity-ctf (added 2026-07-07)",
    howToKo:
      "아직 범위 미정 — 시간 날 때 도전. github.com/Arvolear/simplicity-ctf (7/7 추가)",
    purpose: "A hands-on way to actually learn Simplicity rather than just read about it.",
    purposeKo: "Simplicity 실전 학습 기회 — 시간 날 때 도전.",
    howItWorks:
      "Blockstream's first Simplicity CTF — solve it to unlock 0.01 LBTC (~$600) locked in a contract.",
    howItWorksKo:
      "Blockstream의 첫 Simplicity CTF — 컨트랙트에 잠긴 0.01 LBTC(~$600) 해제하면 보상.",
  },
  {
    // 로보틱스/AI 미래 대비 트랙의 첫 항목 (jay, 2026-08-13) — 서베이가 아니라 실제로
    // 손으로 만져보는 단계별 계획. GR00T N1.7 최소 VRAM(16GB+) 조사 결과 Jetson Orin Nano
    // Super(8GB)로는 직접 추론이 안 돼, 클라우드 GPU부터 시작하는 순서로 정정했다.
    key: "isaac-groot",
    title: "NVIDIA Isaac GR00T — humanoid foundation model",
    titleKo: "NVIDIA Isaac GR00T — 휴머노이드 파운데이션 모델",
    description:
      "A staged, hands-on plan to actually run and fine-tune GR00T — cloud GPU inference first, then a $100 SO-101 arm via LeRobot, Jetson hardware last.",
    descriptionKo:
      "GR00T를 실제로 돌리고 파인튜닝해보는 단계별 계획 — 클라우드 GPU 추론부터, $100대 SO-101 로봇팔(LeRobot 연동)까지, Jetson 하드웨어는 맨 마지막.",
    status: "soon",
    docsHref: "knowledge/isaac-groot.html",
    howTo:
      "Not yet scoped — start on a rented 16GB+ GPU following NVIDIA's e2e workflow doc, no hardware purchase needed. github.com/NVIDIA/Isaac-GR00T",
    howToKo:
      "아직 범위 미정 — 하드웨어 구매 없이 대여한 16GB+ GPU에서 NVIDIA e2e 워크플로 문서부터. github.com/NVIDIA/Isaac-GR00T",
    purpose:
      "A blockchain developer can't survive on blockchain alone — this is the first concrete, hands-on attempt at the robotics/AI adjacent track the daily report's future-dev queue exists for. Not a survey: a staged plan to actually run a real humanoid foundation model rather than just read about one.",
    purposeKo:
      "블록체인 개발자로만은 버틸 수 없다는 판단에서, 데일리 리포트 future-dev 큐가 존재하는 로보틱스·AI 인접 트랙을 실제로 손으로 만져보는 첫 항목입니다. 서베이가 아니라, 읽고 끝내는 대신 진짜 휴머노이드 파운데이션 모델을 직접 돌려보는 단계별 계획입니다.",
    howItWorks:
      "GR00T N1.7-3B needs 16GB+ VRAM even for inference alone (RTX 4090, L40, H100, Jetson AGX Thor/Orin, or DGX Spark) — the $399 Jetson Orin Nano Super's 8GB isn't enough on its own, so the plan starts on a rented cloud GPU (roughly $0.3-0.7/hr) following NVIDIA's e2e workflow doc, no hardware purchase required. Once the model and pipeline are familiar, NVIDIA's July 2026 integration of GR00T 1.7 into Hugging Face's LeRobot means a $100-130 SO-101 arm becomes a complete loop — collect demonstrations, fine-tune the actual GR00T checkpoint, deploy back to the arm — rather than toy imitation-learning code. Isaac Lab (open source, headless-capable) covers simulation-scale practice without any physical robot. A Jetson AGX Thor dev kit ($3,499-5,499, the real-time inference target NVIDIA actually designs GR00T for) stays a later-stage purchase, not a starting point.",
    howItWorksKo:
      "GR00T N1.7-3B는 추론만 해도 16GB+ VRAM이 필요합니다(RTX 4090·L40·H100·Jetson AGX Thor/Orin·DGX Spark) — $399짜리 Jetson Orin Nano Super는 8GB라 이 모델을 직접 못 돌리므로, 하드웨어 구매 없이 대여한 클라우드 GPU(시간당 대략 $0.3~0.7)에서 NVIDIA의 e2e 워크플로 문서를 따라가는 것부터 시작합니다. 모델·파이프라인이 익숙해지면, 2026년 7월 NVIDIA가 GR00T 1.7을 Hugging Face LeRobot에 정식 통합한 덕분에 $100~130짜리 SO-101 로봇팔이 완결된 루프가 됩니다 — 시연 데이터 수집 → 실제 GR00T 체크포인트 파인튜닝 → 다시 팔에 배포, 장난감 모방학습 코드가 아니라. Isaac Lab(오픈소스, 헤드리스 실행 가능)은 물리 로봇 없이 시뮬레이션 규모의 연습을 담당합니다. Jetson AGX Thor 개발자 키트($3,499~5,499, NVIDIA가 실제로 GR00T 실시간 추론을 설계한 타깃)는 시작점이 아니라 나중 단계의 구매 항목으로 남겨둡니다.",
  },
  {
    // 에이전트가 같이 쓰는 "기록 시스템" 트랙 (jay, 2026-08-18) — 동기화·공유 서비스가
    // 아니라 아카이브. 경로/계정이 아니라 노드 ID와 다이제스트가 권위인 쪽을 실제로 써본다.
    key: "docbank",
    title: "Docbank — self-sovereign document vault",
    titleKo: "Docbank — 자기주권형 문서 보관소",
    description:
      "A Go document system where stable node IDs and immutable SHA-256 versions — not paths or a provider account — are the authority for your archive.",
    descriptionKo:
      "경로나 클라우드 계정이 아니라, 안정적인 노드 ID와 불변 SHA-256 버전이 아카이브의 권위가 되는 Go 문서 시스템.",
    status: "soon",
    howTo:
      "Not yet scoped — install, then `docbank add ~/Documents --dest /archive` → `docbank tree /archive` → `docbank web`. Alpha software, so keep independent copies of anything irreplaceable. github.com/kenn-io/docbank",
    howToKo:
      "아직 범위 미정 — 설치 후 `docbank add ~/Documents --dest /archive` → `docbank tree /archive` → `docbank web`. 알파 단계이므로 대체 불가능한 자료는 별도 사본을 유지한 채로. github.com/kenn-io/docbank",
    purpose:
      "Agents that file, retrieve, and revise documents need a system of record, not a sync folder — and a file path makes a poor long-term identity once things get moved and renamed. Docbank is the clearest example so far of the opposite bet: the catalog stays on your machine, a document keeps its identity through moves, every version is named by a verifiable digest, and stale automation hits an explicit revision conflict instead of silently overwriting. Worth running hands-on as a candidate substrate for agent-facing archives — and as a contrast with the sync-and-share model it deliberately isn't.",
    purposeKo:
      "문서를 정리하고 찾아오고 고치는 에이전트에게 필요한 것은 동기화 폴더가 아니라 기록 시스템입니다 — 파일 경로는 이동·이름변경 한 번이면 장기 식별자로서 무너집니다. Docbank는 그 반대편 선택을 가장 선명하게 보여주는 사례입니다: 카탈로그는 내 기기에 남고, 문서는 옮겨져도 정체성을 유지하며, 모든 버전은 검증 가능한 다이제스트로 이름 붙고, 뒤처진 자동화는 조용히 덮어쓰는 대신 명시적 리비전 충돌로 막힙니다. 에이전트용 아카이브의 기반 후보로 직접 돌려볼 가치가 있고, 동시에 이것이 의도적으로 되기를 거부한 sync-and-share 모델과의 대조 사례이기도 합니다.",
    howItWorks:
      "One authenticated daemon owns a vault, and the CLI, web app, TUI, scripts, and external agents all speak the same loopback-authenticated HTTP/OpenAPI contract — Go programs can skip the daemon and embed an independently rooted vault in-process via go.kenn.io/docbank. A node ID survives moves and renames, each content version is immutable and addressed by SHA-256, and writes carry revision preconditions so a stale agent gets a conflict rather than a silent overwrite. Deletion is staged deliberately: trash, permanent delete, GC, and pack reclamation are separate decisions, with revision-bound restore in between. Blobs live loose or packed, optionally in fenced filesystem or S3-compatible stores that hold content without becoming the catalog (Docbank verifies but does not encrypt them). Recovery is provable rather than assumed — incremental snapshot repositories are verified end-to-end before a restore is published, and restore is topology-independent. Apache-2.0, Go 1.26+ with CGO and Node 24+ to build from source; installers refuse any archive whose digest doesn't match the release SHA256SUMS. Sibling project to msgvault, which does the same for messages.",
    howItWorksKo:
      "인증된 데몬 하나가 볼트를 소유하고, CLI·웹앱·TUI·스크립트·외부 에이전트가 모두 같은 루프백 인증 HTTP/OpenAPI 계약을 씁니다 — Go 애플리케이션은 데몬 없이 go.kenn.io/docbank 모듈로 독립 루트 볼트를 인프로세스로 임베드할 수도 있습니다. 노드 ID는 이동·이름변경 후에도 유지되고, 각 콘텐츠 버전은 불변이며 SHA-256으로 주소가 매겨지고, 쓰기에는 리비전 사전조건이 붙어 뒤처진 에이전트는 조용한 덮어쓰기 대신 충돌을 받습니다. 삭제는 단계로 분리됩니다: 휴지통 · 영구 삭제 · GC · 팩 회수가 각각 별개의 결정이고, 그 사이에 리비전 기반 복원이 있습니다. 블롭은 loose 또는 packed 형태로, 필요하면 격리된 파일시스템/S3 호환 스토어에 둘 수 있지만 그 스토어가 카탈로그가 되지는 않습니다(Docbank는 검증은 하되 암호화는 하지 않습니다). 복구는 가정이 아니라 증명 대상입니다 — 증분 스냅샷 저장소를 끝까지 검증한 뒤에야 복원 결과를 공개하고, 복원은 토폴로지에 무관합니다. Apache-2.0이고 소스 빌드에는 Go 1.26+ · CGO · Node 24+가 필요하며, 설치 스크립트는 릴리스 SHA256SUMS와 다이제스트가 맞지 않는 아카이브를 설치하지 않습니다. 메시지에 대해 같은 일을 하는 msgvault의 자매 프로젝트입니다.",
  },
];
