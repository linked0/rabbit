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
    // status는 "soon"인데 href가 있다 — 페이지는 열리지만 각본만 도는 목업이라서.
    // DemoCard가 이 조합을 "목업" 배지로 렌더한다 (app/DemoCard.tsx).
    status: "soon",
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
    status: "soon",
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
  // "📎 Reference only" 행(KB 하이브리드 결제·CRE×Cloud·Thirdweb·Merkle vs Verkle·Linera·
  // Web Stack)은 일부러 뺐다 — README 가 그 행들에 "no dev item" 이라고 적어 두었고,
  // 카드로 만들면 만들 계획이 있는 것처럼 보인다. 라우트가 있거나 만들 의도가 있는 넷만 넣는다.
  {
    key: "game",
    title: "Game — Unity WebGL track",
    titleKo: "게임 — Unity WebGL 트랙",
    description: "A 2D canvas placeholder today; the Unity WebGL embed is the actual goal.",
    descriptionKo: "지금은 2D 캔버스 자리표시자 — 진짜 목표는 Unity WebGL 임베드.",
    status: "soon",
    href: "/game",
    howTo: "Open it and play the placeholder. The card is honest that the real track hasn't started.",
    howToKo: "열어서 자리표시자를 해보면 됩니다. 진짜 트랙은 아직 시작 전이라는 걸 카드가 그대로 말합니다.",
    purpose:
      "The only non-financial surface in this catalogue, and the one that would exercise a completely different toolchain: Unity's WebGL build target embedded in a Next.js route, with the browser bridge that implies. Kept as a card rather than quietly dropped because the gap between “a canvas game exists” and “Unity ships to this route” is the whole work, and hiding it would make the placeholder read as the deliverable.",
    purposeKo:
      "이 카탈로그에서 유일하게 금융이 아닌 표면이고, 완전히 다른 툴체인을 쓰게 되는 항목입니다 — Unity의 WebGL 빌드 타깃을 Next.js 라우트에 임베드하고, 그에 따르는 브라우저 브리지를 붙이는 일. 조용히 지우지 않고 카드로 남긴 이유는 「캔버스 게임이 있다」와 「Unity가 이 라우트로 나간다」 사이의 간극이 곧 작업 전체이기 때문입니다. 숨기면 자리표시자가 결과물처럼 읽힙니다.",
    howItWorks:
      "Today: a small 2D canvas game (\"Coin Catcher\") rendered client-side, with no build step beyond the app itself. Planned: a Unity project exported to WebGL, its loader and data files served as static assets, and a thin JS bridge so the page can pass state in and read results out. Not started — the placeholder is not a prototype of the Unity path, it is a different thing occupying the route.",
    howItWorksKo:
      "지금: 클라이언트에서 그리는 작은 2D 캔버스 게임(\"Coin Catcher\") — 앱 외에 별도 빌드 단계가 없습니다. 계획: Unity 프로젝트를 WebGL로 export 하고, 로더와 데이터 파일을 정적 자산으로 서빙하며, 페이지가 상태를 넣고 결과를 읽을 수 있도록 얇은 JS 브리지를 붙입니다. 아직 시작 전입니다 — 자리표시자는 Unity 경로의 프로토타입이 아니라, 그 라우트를 차지하고 있는 다른 물건입니다.",
  },
  {
    key: "jayverse",
    title: "JayVerse",
    titleKo: "JayVerse",
    description: "A Gravia-style dashboard — currently a “coming soon” stub.",
    descriptionKo: "Gravia 스타일 대시보드 — 지금은 \"곧 공개\" 스텁.",
    status: "soon",
    howTo: "Not yet scoped.",
    howToKo: "아직 범위 미정.",
    purpose:
      "A single surface that aggregates everything else here — positions, agent journals, demo state — rather than making a visitor open eight routes to see what exists. It is listed with no route because a dashboard built before the things it aggregates are stable ends up being rewritten with each of them.",
    purposeKo:
      "여기 있는 나머지 전부 — 포지션, 에이전트 저널, 데모 상태 — 를 한 화면에 모으는 표면입니다. 방문자가 여덟 개 라우트를 열어야 무엇이 있는지 알 수 있는 상태를 대체하려는 것입니다. 라우트 없이 올려둔 이유는, 모으려는 대상들이 안정되기 전에 만든 대시보드는 그것들이 바뀔 때마다 다시 쓰이기 때문입니다.",
    howItWorks:
      "Not built. The stub route exists; the design is a Gravia-style panel grid reading from the same card and journal data the individual pages use, so the dashboard has no data source of its own.",
    howItWorksKo:
      "미구현. 스텁 라우트만 있고, 설계는 개별 페이지들이 쓰는 카드·저널 데이터를 그대로 읽는 Gravia 스타일 패널 그리드입니다 — 대시보드가 자기만의 데이터 소스를 갖지 않게 하려는 것입니다.",
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
    key: "dvt",
    title: "DVT in the protocol",
    titleKo: "프로토콜에 흡수된 DVT",
    description: "Reading notes on absorbing distributed validators into the protocol — m-of-n without splitting keys, plus what it makes buildable.",
    descriptionKo: "분산 밸리데이터를 프로토콜이 직접 다루자는 제안 정독 노트 — 키를 쪼개지 않는 m-of-n, 그리고 그것이 만들어내는 것들.",
    status: "live",
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
];
