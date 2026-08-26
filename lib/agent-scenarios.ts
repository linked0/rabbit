// /live/aa 의 "이 구성요소로 만드는 에이전트" 4가지 시나리오 — 목록(요약)과 상세 페이지가 함께 쓴다.
// 각 시나리오는 두 장의 그림을 갖는다: 관계도(누가 누구에게 무엇을 주는가)와 순서도(시간 순서).
// 둘이 답하는 질문이 다르다 — 관계도는 "권한과 돈이 어느 방향으로 흐르나", 순서도는 "언제 무슨 일이".
// 설계 배경: docs/tasks/current-plan.md §6, 이름 변경 경위는 docs/history/2026-08-05-rabbit-history.md.

export type ScenarioEntity = {
  name: string;
  nameKo: string;
  role: string;
  roleKo: string;
};

export type AgentScenario = {
  slug: string;
  title: string;
  titleKo: string;
  summary: string; // /live/aa 목록용 한 줄
  summaryKo: string;
  blocks: string; // 쓰이는 구성요소 — 예: "① + ③"
  live: boolean; // 오늘 실제로 동작하는 구성인지
  thesis: string; // 상세 페이지 도입부
  thesisKo: string;
  entities: ScenarioEntity[];
  relation: string; // mermaid flowchart — 권한/자금/데이터의 방향
  sequence: string; // mermaid sequenceDiagram — 시간 순서
  guarantee: string; // 이 구성이 실제로 보장하는 것
  guaranteeKo: string;
  limitation: string; // 보장하지 않는 것 — 정직하게
  limitationKo: string;
};

export const AGENT_SCENARIOS: AgentScenario[] = [
  {
    slug: "aggregating-buyer",
    title: "Aggregating buyer — purchases across providers under one cap",
    titleKo: "집계 구매자 — 여러 공급자에서 사되, 한도는 하나",
    summary:
      "An agent buys from several providers on your behalf and settles each one, never exceeding the limit you approved once. A failed leg reverts the whole order.",
    summaryKo:
      "에이전트가 여러 공급자에서 대신 구매하고 각각 정산하되, 한 번 승인한 한도를 절대 넘지 않습니다. 한 건이라도 실패하면 주문 전체가 되돌아갑니다.",
    blocks: "① + ③",
    live: true,
    thesis:
      "This is the /live/ap2 and /live/toss demos with the human taken out of every individual purchase. You approve a budget once; the agent decides which providers to buy from and settles with each. The interesting property is not that it can pay — it is that a partially-completed order is impossible.",
    thesisKo:
      "/live/ap2와 /live/toss 데모에서, 개별 구매마다 사람이 빠진 형태입니다. 예산은 한 번 승인하고, 어느 공급자에서 살지는 에이전트가 정해 각각 정산합니다. 흥미로운 성질은 결제할 수 있다는 게 아니라, 절반만 완료된 주문이 불가능하다는 점입니다.",
    entities: [
      {
        name: "You (owner wallet)",
        nameKo: "나 (오너 지갑)",
        role: "Approves a budget once, then goes away. Holds the funds the whole time.",
        roleKo: "예산을 한 번 승인하고 자리를 뜹니다. 자금은 계속 내 계정에 있습니다.",
      },
      {
        name: "Agent",
        nameKo: "에이전트",
        role: "Decides what to buy and from whom. Holds the session key, holds no funds.",
        roleKo: "무엇을 누구에게서 살지 결정합니다. 세션 키는 갖되 자금은 갖지 않습니다.",
      },
      {
        name: "DelegationManager + enforcers",
        nameKo: "DelegationManager + enforcer",
        role: "Checks every spend against the budget and the deadline before it executes.",
        roleKo: "지출 하나하나를 예산·기한과 대조한 뒤에야 실행시킵니다.",
      },
      {
        name: "Providers A / B",
        nameKo: "공급자 A / B",
        role: "Sell the data. They see a normal payment from your address and need to know nothing about delegation.",
        roleKo: "데이터를 팝니다. 내 주소에서 온 평범한 결제로 보일 뿐, 위임에 대해 알 필요가 없습니다.",
      },
    ],
    relation: `flowchart LR
    U["You<br/>funds live here"] -->|"one signed budget<br/>5 USDC, 1 hour"| A["Agent<br/>decides what to buy"]
    A -->|"redeem, per order"| DM["DelegationManager<br/>+ enforcers"]
    DM -->|"execute as you"| U
    U -->|"payment"| P1["Provider A"]
    U -->|"payment"| P2["Provider B"]
    P1 -->|"data"| A
    P2 -->|"data"| A`,
    sequence: `sequenceDiagram
    actor U as You
    participant A as Agent
    participant DM as DelegationManager
    participant P1 as Provider A
    participant P2 as Provider B

    U->>A: grant a budget once (5 USDC, 1 hour)
    Note over U: you are done — no further approvals

    A->>A: decide: buy from A and B together
    A->>DM: redeem, one atomic order (pay A, pay B)
    DM->>DM: within budget? before the deadline?
    DM->>P1: pay 2 USDC
    DM->>P2: pay 2 USDC
    Note over DM,P2: if paying B failed, paying A reverts too

    A->>DM: redeem again (pay 2 USDC)
    DM-->>A: rejected — would exceed the 5 USDC budget
    Note over A: the agent stops itself`,
    guarantee:
      "Your funds never move to the agent, only out of your account under a rule it cannot change. A multi-provider order either completes fully or leaves no trace — you never end up having paid provider A for half a dataset.",
    guaranteeKo:
      "자금이 에이전트에게 옮겨가지 않고, 에이전트가 바꿀 수 없는 규칙 아래 내 계정에서 나갈 뿐입니다. 여러 공급자 주문은 전부 완료되거나 흔적조차 남기지 않습니다 — 반쪽짜리 데이터셋 값을 공급자 A에게 지불한 상태로 끝나는 일이 없습니다.",
    limitation:
      "Nothing here judges whether the data was worth buying, or whether the provider delivers what it promised. The limit bounds how much can be lost, not whether the purchase was wise.",
    limitationKo:
      "그 데이터를 살 가치가 있었는지, 공급자가 약속한 것을 실제로 주는지는 여기서 판단하지 않습니다. 한도는 얼마까지 잃을 수 있는지를 묶을 뿐, 그 구매가 현명했는지는 다루지 않습니다.",
  },
  {
    slug: "pay-per-call",
    title: "Pay-per-call consumer — pays for each inference or API call",
    titleKo: "호출당 결제 소비자 — 추론·API 호출마다 지불",
    summary:
      "An agent paying cents per model call can't stop for a signature each time, and shouldn't need funding before it can start.",
    summaryKo:
      "모델 호출마다 몇 센트씩 내는 에이전트는 매번 서명을 위해 멈출 수 없고, 시작 전에 자금을 채워둘 필요도 없어야 합니다.",
    blocks: "① + ②",
    live: true,
    thesis:
      "Two different frictions have to disappear for per-call payment to work at all. The session key removes the approval per call; the paymaster removes the funding step before the first call. Neither alone is enough — an agent that needs no approvals but has no ETH still cannot move.",
    thesisKo:
      "호출당 결제가 성립하려면 서로 다른 마찰 두 개가 사라져야 합니다. 세션 키는 호출마다의 승인을 없애고, paymaster는 첫 호출 전의 충전 단계를 없앱니다. 어느 하나만으로는 부족해요 — 승인이 필요 없어도 ETH가 없으면 여전히 움직일 수 없습니다.",
    entities: [
      {
        name: "You",
        nameKo: "나",
        role: "Sets a per-period budget once. Never sees an individual call.",
        roleKo: "기간별 예산을 한 번 정합니다. 개별 호출은 보지 않습니다.",
      },
      {
        name: "Agent",
        nameKo: "에이전트",
        role: "Calls the model, pays per call, decides when it has learned enough to stop.",
        roleKo: "모델을 호출하고, 호출마다 지불하고, 언제 충분한지 스스로 판단해 멈춥니다.",
      },
      {
        name: "Smart account (ERC-4337)",
        nameKo: "스마트 계정 (ERC-4337)",
        role: "The account that acts. Holds no ETH — that's the point.",
        roleKo: "실제로 행동하는 계정. ETH를 갖지 않는 게 요점입니다.",
      },
      {
        name: "Bundler + Paymaster",
        nameKo: "Bundler + Paymaster",
        role: "The bundler submits the operation; the paymaster pays the gas for it.",
        roleKo: "bundler가 작업을 제출하고, paymaster가 그 가스를 대신 냅니다.",
      },
      {
        name: "Model / API provider",
        nameKo: "모델 / API 공급자",
        role: "Serves the call once payment lands. Charges per request, not per month.",
        roleKo: "결제가 도착하면 호출에 응답합니다. 월 단위가 아니라 요청 단위로 과금합니다.",
      },
    ],
    relation: `flowchart LR
    U["You"] -->|"one budget<br/>per period"| A["Agent"]
    A -->|"UserOperation<br/>per call"| B["Bundler"]
    B --> EP["EntryPoint"]
    PM["Paymaster"] -->|"pays the gas"| EP
    EP -->|"executes"| SA["Smart account<br/>zero ETH"]
    SA -->|"payment per call"| API["Model / API provider"]
    API -->|"result"| A`,
    sequence: `sequenceDiagram
    actor U as You
    participant A as Agent
    participant B as Bundler
    participant PM as Paymaster
    participant API as Model provider

    U->>A: approve a budget for this task
    loop until the task is done or the budget runs out
      A->>B: UserOperation, pay for one call
      B->>PM: who covers the gas?
      PM-->>B: sponsored
      B->>API: payment lands
      API-->>A: result
      A->>A: decide whether another call is worth it
    end
    Note over A: stops on its own — task complete, or budget spent`,
    guarantee:
      "The agent can start from nothing: no ETH, no top-up, no faucet. It pays only for what it uses, and the total it can spend was fixed before it began.",
    guaranteeKo:
      "에이전트는 무(無)에서 시작할 수 있습니다: ETH도, 충전도, faucet도 필요 없습니다. 쓴 만큼만 지불하고, 총액은 시작 전에 이미 정해져 있습니다.",
    limitation:
      "Someone still pays the gas — the paymaster's sponsorship is a business decision, not free money. In production you would fund the paymaster and set policies for whose operations it sponsors.",
    limitationKo:
      "가스는 결국 누군가 냅니다 — paymaster의 대납은 공짜 돈이 아니라 사업적 결정이에요. 실제 운영에서는 paymaster에 자금을 넣고, 누구의 작업을 대납할지 정책을 정해야 합니다.",
  },
  {
    slug: "scheduled-operator",
    title: "Scheduled operator — acts at 3am, on a mandate that expires",
    titleKo: "스케줄 운영자 — 새벽 3시에 행동하고, 위임은 만료된다",
    summary:
      "A rebalancer or renewal job runs while you sleep. What makes it safe is arithmetic, not trust.",
    summaryKo:
      "리밸런서나 갱신 작업이 자는 동안 돕니다. 이걸 안전하게 만드는 건 신뢰가 아니라 산수입니다.",
    blocks: "①",
    live: true,
    thesis:
      "This is the case where the session key earns its keep most obviously, because you are asleep. The mandate is bounded in two independent ways — an amount and a deadline — and both are enforced by contracts the agent has no control over. Nothing needs to be revoked when the window closes; it simply stops working.",
    thesisKo:
      "세션 키가 가장 분명하게 제 값을 하는 경우입니다. 자고 있으니까요. 위임은 서로 독립된 두 방향으로 묶여 있고 — 금액과 기한 — 둘 다 에이전트가 통제할 수 없는 컨트랙트가 강제합니다. 기한이 지나도 취소할 게 없습니다. 그냥 동작하지 않게 될 뿐이에요.",
    entities: [
      {
        name: "You",
        nameKo: "나",
        role: "Grants a mandate in the evening, with an amount and an expiry. Then sleeps.",
        roleKo: "저녁에 금액과 만료가 붙은 위임을 부여합니다. 그리고 잡니다.",
      },
      {
        name: "Scheduler / agent",
        nameKo: "스케줄러 / 에이전트",
        role: "Runs on a server, wakes on a timer, decides whether action is needed at all.",
        roleKo: "서버에서 돌며 타이머에 깨어나, 애초에 행동이 필요한지부터 판단합니다.",
      },
      {
        name: "TimestampEnforcer",
        nameKo: "TimestampEnforcer",
        role: "Compares block time against the deadline. Stateless — expiry is a computation, not an event.",
        roleKo: "블록 시간을 기한과 비교합니다. 무상태예요 — 만료는 사건이 아니라 계산입니다.",
      },
      {
        name: "Amount enforcer",
        nameKo: "금액 enforcer",
        role: "Keeps a running total per delegation and rejects the spend that would exceed it.",
        roleKo: "위임마다 누적 합계를 들고 있다가, 한도를 넘길 지출을 거부합니다.",
      },
      {
        name: "Target protocol",
        nameKo: "대상 프로토콜",
        role: "The vault, DEX, or subscription being operated on.",
        roleKo: "운용 대상인 볼트, DEX, 또는 구독 서비스.",
      },
    ],
    relation: `flowchart TB
    U["You, in the evening"] -->|"mandate: amount + expiry"| A["Scheduler agent<br/>runs on a server"]
    A -->|"03:00 — redeem"| DM["DelegationManager"]
    DM --> TE["TimestampEnforcer<br/>past the deadline?"]
    DM --> AE["Amount enforcer<br/>over the total?"]
    TE -->|"ok"| X["Execute as you"]
    AE -->|"ok"| X
    X --> P["Target protocol"]
    TE -->|"expired"| S["Rejected — agent stops"]`,
    sequence: `sequenceDiagram
    actor U as You
    participant A as Scheduler agent
    participant DM as DelegationManager
    participant EN as Enforcers
    participant P as Target protocol

    U->>A: mandate — up to X, until 09:00
    Note over U: asleep

    A->>A: 03:00 — is action needed?
    A->>DM: redeem
    DM->>EN: within the amount? before 09:00?
    EN-->>DM: ok
    DM->>P: rebalance, as you

    A->>A: 09:30 — wake again
    A->>DM: redeem
    DM->>EN: before 09:00?
    EN-->>DM: no — expired
    DM-->>A: rejected
    Note over A: nothing to revoke — the window simply closed`,
    guarantee:
      "The worst an overnight bug or a compromised server can do is spend up to the amount you set, and only until the deadline. After that the same code keeps running and keeps failing harmlessly.",
    guaranteeKo:
      "밤새 버그가 나거나 서버가 털려도 할 수 있는 최악은 정해둔 금액까지, 기한까지 쓰는 것뿐입니다. 그 뒤로는 같은 코드가 계속 돌면서 계속 무해하게 실패합니다.",
    limitation:
      "Expiry is judged by block time, not your wall clock, and nothing notifies you when the mandate lapses. The agent has to notice its own rejection — the chain will not remind it.",
    limitationKo:
      "만료 판정은 벽시계가 아니라 블록 시간 기준이고, 위임이 끝났다고 알려주는 것도 없습니다. 에이전트가 자기 거부를 스스로 알아채야 합니다 — 체인은 상기시켜주지 않습니다.",
  },
  {
    slug: "counterparty-check",
    title: "Counterparty check — deciding whether to deal with another agent",
    titleKo: "거래 상대 확인 — 다른 에이전트와 거래할지 판단",
    summary:
      "Once agents transact with each other, the question shifts from what it may spend to whether it has behaved honestly before.",
    summaryKo:
      "에이전트끼리 거래하기 시작하면 질문이 '얼마를 쓸 수 있나'에서 '지금까지 정직하게 행동했나'로 옮겨갑니다.",
    blocks: "④",
    live: false,
    thesis:
      "The first three scenarios all bound what your own agent can do to you. This one is the opposite direction: something you cannot solve with spending limits, because the risk is the counterparty, not your own code. ERC-8004 proposes an on-chain identity and reputation registry for exactly this. It is early enough that this page stays an explainer — its testnet deployment status has not been verified here.",
    thesisKo:
      "앞의 세 시나리오는 모두 내 에이전트가 나에게 할 수 있는 일을 묶는 것이었습니다. 이건 반대 방향이에요 — 지출 한도로는 풀 수 없는 문제인데, 위험이 내 코드가 아니라 거래 상대에게 있기 때문입니다. ERC-8004은 정확히 이를 위한 온체인 신원·평판 레지스트리를 제안합니다. 아직 초기 단계라 이 페이지는 설명으로 남습니다 — 테스트넷 배포 여부를 여기서 확인하지 못했습니다.",
    entities: [
      {
        name: "Your agent",
        nameKo: "내 에이전트",
        role: "Wants to buy from, or delegate to, an agent it has never met.",
        roleKo: "처음 보는 에이전트에게서 사거나, 그쪽에 위임하려 합니다.",
      },
      {
        name: "Counterparty agent",
        nameKo: "상대 에이전트",
        role: "Has an on-chain identity and a history someone can look up.",
        roleKo: "온체인 신원과, 조회 가능한 이력을 갖고 있습니다.",
      },
      {
        name: "Identity registry (ERC-8004)",
        nameKo: "신원 레지스트리 (ERC-8004)",
        role: "Answers who this address claims to be, and who vouches for that claim.",
        roleKo: "이 주소가 누구라고 주장하는지, 그 주장을 누가 보증하는지 답합니다.",
      },
      {
        name: "Attestors",
        nameKo: "보증인",
        role: "Past counterparties who recorded how the deal went.",
        roleKo: "거래가 어떻게 끝났는지 기록해 둔 과거 거래 상대들.",
      },
    ],
    relation: `flowchart LR
    MA["Your agent"] -->|"before dealing:<br/>who is this?"| REG["Identity + reputation<br/>registry"]
    AT["Past counterparties"] -->|"attestations"| REG
    REG -->|"identity + history"| MA
    MA -->|"proceed, or walk away"| CA["Counterparty agent"]
    CA -->|"outcome recorded"| REG`,
    sequence: `sequenceDiagram
    participant MA as Your agent
    participant REG as Identity registry
    participant CA as Counterparty agent

    MA->>CA: proposes a deal
    MA->>REG: look up this address
    REG-->>MA: identity, attestations, past outcomes
    MA->>MA: enough history to risk it?

    alt reputation is sufficient
      MA->>CA: proceed
      MA->>REG: record the outcome
    else unknown or poor
      MA->>MA: walk away — no transaction
    end`,
    guarantee:
      "Nothing yet — this is the one block on the page that is not demonstrable. Written here as an explainer rather than dressed up as a working demo.",
    guaranteeKo:
      "아직 없습니다 — 이 페이지에서 유일하게 시연 불가능한 구성요소입니다. 동작하는 데모인 척하는 대신 설명으로 적어 둡니다.",
    limitation:
      "Reputation systems inherit hard problems: identities are cheap to create, attestations can be bought, and a long clean history can be built specifically to be spent on one large fraud. On-chain records make the history readable, not trustworthy.",
    limitationKo:
      "평판 시스템은 어려운 문제들을 그대로 물려받습니다: 신원은 만들기 싸고, 보증은 살 수 있으며, 깨끗한 장기 이력을 단 한 번의 대형 사기를 위해 일부러 쌓을 수도 있습니다. 온체인 기록은 이력을 읽을 수 있게 만들 뿐, 믿을 수 있게 만들지는 않습니다.",
  },
];

export function findScenario(slug: string): AgentScenario | undefined {
  return AGENT_SCENARIOS.find((s) => s.slug === slug);
}
