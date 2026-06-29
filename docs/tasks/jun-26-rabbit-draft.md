# Tasks for Rabbit — Jun 26

## 1. Top Menu
- Top Menu should be displayed once in the home page.

## 2. AI Chat: 나만의 KB (RAG)

### Overview
이 작업은 **AI Chat** 카테고리에 들어가는 기능이며, **RAG**(Retrieval-Augmented Generation)를
사용한다. 매일 생성하는 리포트·메모·생각정리를 "검색 가능한 개인 지식베이스(KB)"로 만들어,
로컬 LLM/MCP로 질의·요약하게 하는 것이 목표다.

> 오늘 Tech Item 실습 완료 — 나만의 KB (Karpathy / NotebookLM MCP)

### 🛠️ 오늘의 Tech Item: 나만의 KB (Karpathy 스타일 개인 지식베이스 + NotebookLM/MCP)

**한 줄 요약**: 매일 리포트·메모·생각정리를 "검색 가능한 개인 지식베이스(KB)"로 만들어,
로컬 LLM/MCP로 질의·요약하게 하는 것.

**핵심 내용**: Jay는 이미 매일 리포트·`reflection.md`·`mike-memory.md`·Notion으로 막대한 1차
텍스트를 생성한다. 이 흩어진 자산을 하나의 KB로 묶고(예: 폴더 → 임베딩 → 벡터DB), NotebookLM
또는 로컬 RAG(섹션 7 LLM 트랙의 ChromaDB/Qdrant)로 "내 과거 생각에게 질문"하게 만드는 것이
목표다. Karpathy식 접근은 거창한 시스템보다 "마찰 없는 입력 + 좋은 검색"에 방점을 둔다. MCP로
감싸면 Claude/Cowork가 직접 이 KB를 도구처럼 호출할 수 있다.

### Tasks (오늘 할 것)

1. `morning-blockchain-report` 폴더의 `.md`들을 한 곳에서 grep/검색 가능하게 인덱싱 스크립트
   1개 작성 (가장 단순: ripgrep + 파일명 날짜 정렬).
2. 로컬 임베딩(`nomic-embed`) + ChromaDB로 `reflection.md`·`mike-memory.md`만 먼저 색인
   (섹션 7 Day 12~16과 연계).
3. "내가 6월에 ETH에 대해 뭐라고 적었지?"를 자연어로 질의해보고 결과 품질 1줄 평가.

#### 첫 번째 액션 (30분)
워크스페이스 폴더에서 `rg -i "ETH" *.md | rg "2026-06"` 같은 한 줄로 "수동 KB 검색"부터 체험
→ 이게 충분히 유용하면 그때 임베딩으로 확장.

### Verex 연결
Verex 설계 결정·차별화 가설이 `mike-memory`에 누적 중 — 이를 RAG로 질의하면 "왜 factory 패턴을
골랐지?"에 과거 근거를 즉시 소환할 수 있다(의사결정 추적성).

---

## 3. rabbit-aiaas Agent-as-a-Service
- 온체인 지갑/결제 (waiaas / x402)
- This should be an separate project in /Users/jay/work/task/rabbit-aiaas
- This service introduce the rabbit-privider to the rabbit-agent app

> 초안. 다음 단계에서 다듬고 확장한다.

### Overview
사람이 매번 카드를 긁거나 승인하지 않아도, 에이전트(소프트웨어)가 직접 지갑을 들고 소액을
결제·정산한다. 사람은 **한도·규칙(policy)** 만 정해둔다. (AP2 / M2M 카테고리와 연결)

### 에이전트에게 붙는 4가지 (waiaas류)
1. **정체성(identity)**
2. **지갑** (스마트 계정 / MPC)
3. **지출 정책** (한도·허용목록·시간창)
4. **정산/감사 로그**

### 시나리오

#### 개인용
1. **리서치/구매 에이전트** — 유료 API 호출당 USDC 소액 자동결제. 사용자는 "주당 $20,
   항공 예약은 5만 원 이하만" 같은 정책만 설정. 한도 초과 시 정지.
2. **구독·청구 자동화** — 지갑에 스테이블코인 충전 → SaaS 구독료·API 충전 자동 처리.
   "월 $50 한도, 새 서비스 가입은 먼저 물어봐."
3. **일상 위임** — 반복 소액 결제(신간 구매, 주차비 정산 등).

#### 서비스/사업자용 (큰 그림)
**API를 "키 발급 + 월 청구" 대신 "호출당 결제"로 판매 (x402 패턴)**
```
에이전트  → GET /premium-data
서버      → HTTP 402 Payment Required (가격 $0.01, 받을 주소 0x..., 체인 Base)
에이전트 지갑 → USDC 0.01 자동 전송
서버      → 결제 확인 후 데이터 응답
```

## 4. rabbit-agent Project
- A new category is added for this in the top menu of Rabbit web app
- It communicate with the rabbit-privider service

## 5. rabbit-privider Project
- This is an app to provide philosophical aphorism for 0.01 USDC or some stable coin to ai agent like rabbit-agent.
- We can use real stable coin rails later in refinement step so we should design for that too.
- We implement the feature in a testnet


### 다음 단계
- 가장 단순한 PoC 범위 결정(개인 시나리오 1개 또는 x402 402-flow 1개).
- 지갑/체인/스테이블코인 선택(Base + USDC 가정).
- 정책 엔진 최소 형태 정의.

## 6. Spagettis in separate project
- I should be moved into /Users/jay/work/task/rabbit-spagettis

## 7. rabbit-hole
- Please add simple 3D unity project in /Users/jay/work/rabbit-hole
- This repo should be added as sub module in /Users/jay/work/task/rabbit for Game category

## 8. All the projects deployed in the same instance.
- All the projects are deployed at the same GCP instance as the instance that rabbit app is deployed.
- So prepare the deployment.
