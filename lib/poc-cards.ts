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
    href: "/ap2",
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
    diagram: `sequenceDiagram
    participant U as Browser (visitor)
    participant S as rabbit server
    participant ST as Stripe

    U->>S: POST /api/ap2/checkout (form submit)
    S->>ST: checkout.sessions.create() [secret key]
    ST-->>S: session { url, id }
    S-->>U: 303 redirect
    U->>ST: pay (hosted Checkout page)
    ST-->>U: redirect to /ap2?session_id=...
    U->>S: GET /ap2?session_id=...
    S->>ST: checkout.sessions.retrieve(session_id)
    ST-->>S: payment_status: "paid"
    S-->>U: release purchased content`,
  },
  {
    key: "aa",
    title: "AA — delegatable accounts & session keys",
    titleKo: "AA — 위임형 계정 & 세션 키",
    description: "ERC-7702/7715 delegation + a 4-pillar Agentic AA demo (paymaster, atomic tx, KYA).",
    descriptionKo: "ERC-7702/7715 위임 + 4대 요소 Agentic AA 데모 (paymaster, 원자적 트랜잭션, KYA).",
    status: "live",
    href: "/etc/aa",
    howTo:
      "Connect MetaMask on Sepolia → grant a scoped session key → watch it spend within the granted limit, no re-sign popup.",
    howToKo: "Sepolia에서 MetaMask 연결 → 범위 제한 세션 키 부여 → 재서명 팝업 없이 한도 내에서 지출되는 것을 확인.",
    purpose:
      "Four properties account abstraction gives an autonomous agent that a plain wallet (EOA) can't: scoped delegation, gas independence, atomic multi-step execution, and (conceptually) on-chain identity checks — using two different AA standards side by side to show they solve overlapping problems differently.",
    purposeKo:
      "계정 추상화(AA)가 일반 지갑(EOA)은 줄 수 없는, 자율 에이전트를 위한 네 가지 속성 — 범위 제한 위임, 가스 독립, 원자적 다단계 실행, 그리고 (개념적으로) 온체인 신원 확인 — 을 보여줍니다. 서로 다른 두 AA 표준을 나란히 사용해, 겹치는 문제를 다른 방식으로 푸는 것을 대비시킵니다.",
    howItWorks:
      "Pillar ① uses MetaMask's ERC-7715 permission API: the owner wallet grants a browser-generated, single-use session account a capped ERC-20 allowance (\"≤5 test USDC, 1 hour\") via a signed permission request; the session account then spends within that limit by signing and broadcasting its own transaction directly — no further wallet popup, because the permission itself is the authorization. Pillars ②–③ switch to ERC-4337 (bundler-based smart accounts) via thirdweb: connecting a wallet wraps it in a smart contract account, gas is covered by a paymaster instead of the user's own ETH (pillar ②), and two calls can be bundled into one UserOperation that succeeds or reverts as a single atomic unit (pillar ③). Pillar ④ (on-chain agent identity/reputation via ERC-8004) is left as a written explainer rather than a live demo, since that standard's testnet deployment status hasn't been verified.",
    howItWorksKo:
      "① 세션 키는 MetaMask의 ERC-7715 권한 API를 사용합니다: 소유자 지갑이 서명된 권한 요청으로, 브라우저에서 생성한 1회용 세션 계정에 한도가 걸린 ERC-20 허용량(\"최대 5 테스트 USDC, 1시간\")을 부여합니다. 이후 세션 계정은 그 한도 안에서 직접 서명·전송하며, 권한 자체가 인가이므로 추가 지갑 팝업이 없습니다. ②~③은 thirdweb을 통한 ERC-4337(번들러 기반 스마트 계정)로 전환됩니다: 지갑을 연결하면 스마트 컨트랙트 계정으로 감싸지고, 가스는 사용자의 ETH 대신 paymaster가 대신 냅니다(②). 두 개의 호출을 하나의 UserOperation으로 묶어 성공/실패가 원자적으로 함께 처리됩니다(③). ④(ERC-8004 기반 온체인 신원/평판)는 라이브 데모 대신 설명으로만 제공하는데, 해당 표준의 테스트넷 배포 여부가 아직 확인되지 않았기 때문입니다.",
    diagram: `sequenceDiagram
    participant O as Owner wallet (MetaMask)
    participant B as Session account (browser)
    participant RPC as Public Sepolia RPC
    participant SA as Smart account (thirdweb)
    participant PM as thirdweb Paymaster

    Note over O,RPC: Pillar ① — ERC-7715 session key
    B->>O: wallet_requestExecutionPermissions(up to 5 USDC, 1h)
    O-->>B: signed permission (one popup)
    B->>RPC: sendTransactionWithDelegation()
    Note over B,RPC: session account signs itself, no popup

    Note over O,PM: Pillars ②③ — ERC-4337 smart account
    O->>SA: connect + wrap in smart account
    SA->>PM: submit UserOperation (2 batched calls)
    PM-->>SA: sponsor gas + execute atomically`,
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
    href: "/etc/toss",
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
    diagram: `sequenceDiagram
    participant U as Browser (visitor)
    participant TW as Toss Payment Widget SDK
    participant T as Toss Payments
    participant S as rabbit server

    U->>TW: requestPayment() [client key]
    TW->>T: open hosted payment page
    U->>T: pay (test card)
    T-->>U: redirect /etc/toss?paymentKey&orderId&amount
    U->>S: GET /etc/toss?...
    S->>T: POST /v1/payments/confirm [secret key]
    T-->>S: status "DONE" (rejects on amount mismatch)
    S-->>U: release purchased content`,
  },
];
