# 2026-08-26 — rabbit 작업 이력

> 소스 문서: [docs/tasks/current-plan.md](../tasks/current-plan.md) — J2 Phase 2의 R-A(mandate) 체인 선택. 전날 항목은 [2026-08-25-rabbit-history.md](2026-08-25-rabbit-history.md).

### R-A의 mandate를 anvil에서 온체인으로 — MetaMask ERC-7715가 아니라 delegation 직접 서명으로

**Cause:** Phase 2 UI(R-A·R-E·R-I) 착수 전 확인하다가, `app/poc/aa/SessionKeyDemo.tsx`의 ERC-7715 부여 흐름이 **Sepolia에 하드코딩**돼 있고 부여 전에 `ensureSepolia()`를 부른다는 걸 발견했다. J2의 MockUSDC는 anvil(31337)에 있으므로 그대로는 쓸 수 없다. jay에게 세 안(a: 서버가 상한·만료 강제 / b: Sepolia 부여 + anvil 거래 / c: delegation framework를 anvil에 배포)을 냈고 jay가 **c**를 골랐다 — "MetaMask 메커니즘을 알게 되니까".

**Reasoning:** c를 낼 때는 "규모 미검증"이라 적었는데, `@metamask/smart-accounts-kit`(이미 설치돼 있음) 내부를 열어보니 **지원되는 API가 이미 있었다**: `deploySmartAccountsEnvironment()`가 DelegationManager·EntryPoint·SimpleFactory·구현체 3종·caveat enforcer 약 35종을 임의 체인에 배포하고, `overrideDeployedEnvironment(chainId, version, env)`가 그 주소를 SDK에 등록한다. R-A가 필요로 하는 **금액 + 만료**는 배포 목록 안의 `ERC20TransferAmountEnforcer`와 `TimestampEnforcer`에 정확히 대응한다.

그런데 경로가 둘로 갈린다. **c1**(MetaMask의 `wallet_requestExecutionPermissions`)은 확장 프로그램이 답하는 호출이라 **MetaMask가 31337을 지원 체인으로 들고 있어야** 하고, 게다가 `deploySmartAccountsEnvironment`는 CREATE2가 아닌 평범한 배포라 주소가 MetaMask가 아는 값과 일치할 수 없다. SDK에 하드코딩된 주소가 하나도 없다는 점이 이를 뒷받침한다 — DelegationManager 주소는 **응답으로 지갑이 알려주는 값**이다. **c2**(`signDelegation`)는 `verifyingContract`와 `chainId`를 **호출자가 넘기는** 평범한 EIP-712 `eth_signTypedData_v4`이므로 ERC-7715 지원과 무관하게 anvil에서 동작한다. 따라서 **c2가 실질 경로**이고 c1은 2분짜리 프로브(`wallet_getSupportedExecutionPermissions`가 chainId 목록을 반환)로 확인만 한다.

부수 효과 하나: 소유자가 평범한 EOA가 아니라 **Hybrid 스마트 계정**(서명자는 jay의 MetaMask EOA)이 된다 — `redeemDelegations`가 소유자 컨텍스트에서 실행돼야 하기 때문이다. 대신 EIP-7702가 필요 없어져 anvil의 Prague 하드포크 문제를 통째로 피한다. 그 계정에 MockUSDC를 넣는 수단은 **이미 만들어져 있다** — V-B의 주소 지정 faucet(`POST /faucet {address}`).

**Change:** 아직 코드 없음 — 조사와 결정만. 계획서 R-A 항목과 O-질문 갱신은 구현과 함께 간다.

**Result:** R-A가 **서버가 약속하는 경계**에서 **체인이 산술로 막는 경계**로 올라간다 — 데모의 핵심 주장이 실제로 참이 된다. 비용은 R-A에 약 1일 추가(프레임워크 배포 스크립트 + 소유자 스마트 계정 + redeem 경로). **미확인 하나:** MetaMask가 31337에서 typed-data 서명을 정상 표시하는지는 실제 팝업을 봐야 안다.

### 2026-08-25 이력 파일의 stash 충돌 해소

**Cause:** `docs/history/2026-08-25-rabbit-history.md`가 `git stash pop` 충돌 상태로 남아 `<<<<<<< Updated upstream` 마커를 그대로 담고 있었다. `git status`에도 unmerged로 잡혔다.

**Reasoning:** 두 쪽이 경쟁하는 내용이 아니었다 — upstream 쪽은 PoC 카드 항목 둘(`l1-zkevm-optional-proofs` → done, `monad-last-general-purpose-l1` 신설), stash 쪽은 J2 Phase 1 구현 항목. 같은 날 파일에 append 되는 서로 다른 항목이므로 **둘 다 남기고 마커 세 줄만 제거**하는 것이 유일하게 맞는 해소다. 순서는 J2 작업이 나중이므로 맨 아래.

**Change:** 마커 3줄 제거(내용 손실 0, 항목 5개 전부 보존), `pnpm docs:html` 재생성.

**Result:** 마커 0개, 항목 5개. 다만 `.git/index.lock`(0바이트, 08-26 00:03 생성, 실행 중인 git 프로세스 없음)이 남아 `git add`로 unmerged 상태를 정리하지 못했다 — **같은 증상이 두 번째**이므로 자정 무렵 무언가가 중단되고 있다는 신호로 기록한다.


### R-A · R-E · R-I 구현 — 그리고 옵션 c 가 실제로 통했다

> 소스 문서: [current-plan.md](../tasks/current-plan.md)의 R-A · R-E · R-I. 확인 절차는 같은 문서 [Built so far](../tasks/current-plan.md) 절.

**Cause:** jay가 "go ahead"로 Phase 2 의 UI 층(R-A·R-E·R-I)을 지시. 직전 결정은 옵션 **c**(delegation framework 를 anvil 에 직접 배포) 채택.

**Reasoning:** c 를 제안할 때 "규모 미검증"이라 적었는데 **과소평가였다.** `@metamask/smart-accounts-kit/utils` 에 `deploySmartAccountsEnvironment()` 가 이미 있고, DelegationManager·SimpleFactory·구현체 3종·caveat enforcer 약 35종을 임의 체인에 배포한다 — anvil 에서 **240ms**. 그리고 c 는 두 갈래였는데 예상대로 갈렸다: **c1**(MetaMask 의 ERC-7715 팝업)은 확장이 답하는 호출이고 DelegationManager 주소도 지갑이 응답으로 준다(SDK 에 하드코딩 주소가 0개인 것이 증거). 우리 배포는 CREATE2 도 아니라 주소가 맞을 수 없다. **c2**(평범한 EIP-712 `Delegation` 서명)는 `verifyingContract` 와 `chainId` 를 우리가 넘기므로 어느 체인에서든 된다 — 이쪽으로 갔다. 다만 c1 을 "안 된다"고 단정하지 않고 **콘솔에 지갑의 지원 체인 목록을 직접 묻는 버튼**을 넣었다. 기억이 아니라 증거로 재검토할 수 있게.

부수 결정 둘. ① **위임 구조체는 서버가 만들고 브라우저는 서명만 한다** — O1 과 똑같은 이유로, 정의가 두 벌이면 *틀린 메시지에 대한 유효한 서명*이 나오고 에러는 구조체를 언급하지 않는다. ② **틱이 주문보다 인출을 먼저 한다** — 주문을 먼저 냈다가 인출이 거절되면 정산 불가능한 호가가 남고, 그건 verex W6.5 와 같은 실패 모양이다.

그리고 만료 처리에서 **기존 코드가 거짓말을 하고 있었다**: DB 의 만료 시각만 보고 저널에 "chain refused"라고 적었는데 체인에 묻지도 않았다. 시뮬레이션(가스 0)으로 실제로 물어보고 enforcer 가 낸 문자열을 그대로 적도록 고쳤다.

**Change:** `scripts/deploy-delegation.mjs`(프레임워크 배포), `scripts/verify-delegation.mjs`(주장 3개를 실제 체인에서 검증, self-contained), `lib/delegation.ts`(환경 로드·위임 생성·redeem·시뮬레이션), `app/api/agent/{preflight,markets}` 신설, `mandate/prepare` 신설, `mandate`·`tick` 확장(온체인 인출, 정직한 만료, 인용 뉴스 → 헤드라인+출처 해석), 콘솔 `app/poc/agent/console/`(Preflight·MandatePanel·NewsPanel·JournalPanel·Console·page). 목업 `/poc/agent` 는 **덮어쓰지 않고** 링크만 추가 — 저쪽은 어디서나 열리는 논증, 이쪽은 기계 앞에서만 열리는 조작판이다. 계획서에 §"The mandate is enforced on chain"과 18단계 확인 절차, O9·O10 신설, O7 반쯤 답함. verex 계획서에는 W6 구현 상태와 **"대체로 서명 단계를 삭제하는 것"이 틀렸다는 정정**을 인용문으로 박았다.

**Result:** `npx tsc --noEmit` 통과, `npx next build` 통과, 그리고 **`pnpm delegation:verify` 가 살아 있는 체인에서 3/3**:
① 위임 안에서 4 USDC 인출 성공 ② 상한 초과 → `ERC20TransferAmountEnforcer:allowance-exceeded`, 잔고 불변 ③ 만료 후 → `TimestampEnforcer:expired-delegation`, 잔고 불변. ③ 이 데모의 전부다 — **아무도 취소하지 않았고** 창이 닫혔을 뿐인데 같은 코드가 계속 무해하게 거절당한다. R-A 가 "서버가 약속하는 경계"에서 "체인이 산술로 막는 경계"로 올라갔다. **미착수:** R-F(스케줄러), R-G, R-H, V-E, W1. 콘솔이 브라우저에 SDK 를 165kB 실어 보내는 문제는 O10 으로 기록(로컬 전용이라 급하지 않다).


### 실행 중인 아키텍처를 별도 문서로 — 계획서의 다이어그램이 설계이지 현실이 아니어서

> 소스 문서: [docs/features/autonomous-trading-agent.md](../features/autonomous-trading-agent.md) 신설. 상위 계획은 [current-plan.md](../tasks/current-plan.md).

**Cause:** jay가 "테스트용 카드와 페이지를 만들었는가"와 "현재 아키텍처를 제대로 된 파일에 기술해 달라"를 물었다.

**Reasoning:** 계획서의 *Architecture* 절이 **설계**를 그린 것인데 구현 중에 두 군데가 달라졌다 — ① mandate 는 ERC-7715 팝업으로 부여되지 않고 평범한 EIP-712 서명이다 ② 위임자는 소유자의 EOA 가 아니라 **Hybrid 스마트 계정**이다. 계획서만 읽은 사람은 존재하지 않는 것을 찾게 된다. 그렇다고 계획서의 그림을 고쳐 덮어쓰면 *왜 설계가 바뀌었는지*가 사라지므로, **설계는 계획서에 두고 현실은 별도 파일**로 나눴다(계획서 쪽에는 경고 인용문 + 링크만). 같은 이유로 히스토리와도 역할이 겹치지 않는다 — 히스토리는 "어떻게 여기 왔나", 이 파일은 "지금 무엇이 도는가"다.

기술한 것 중 반복해서 오해가 났던 셋을 앞쪽에 놓았다: **컨트랙트는 rabbit 이 아니라 anvil 위에 있다**(저장소는 배포 트랜잭션을 보내는 스크립트를 가질 뿐), **두 저장소는 정확히 네 지점에서만 만난다**, **rabbit 은 3100 이고 verex web 이 3000 이다**.

**카드는 만들지 않았다** — 의도적이다. 콘솔은 anvil 과 verex API 가 도는 기계에서만 열리므로, PoC 카드에 걸면 방문자는 연결 오류 페이지를 보게 된다. 목업 `/poc/agent` 는 인프라 없이도 성립하는 논증이라 카드는 계속 그쪽을 가리키고, 목업에서 콘솔로 가는 링크만 추가했다.

**Change:** `docs/features/autonomous-trading-agent.md` 신설(9개 절 — 한 문장 요약, 프로세스·포트, 컨트랙트 소유권, 키, mandate 구조, 틱 흐름, 두 저장소의 접점 4개, 미착수 목록, 페이지가 둘인 이유). 계획서 *Architecture* 절에 "이건 설계다" 경고 + 링크, setup 블록에 rabbit 포트(3100)와 콘솔 URL 명시. `docs/features/README.md` 의 B1 에 "부분 구현" 상태와 링크.

**Result:** 문서만 변경. `npx tsc --noEmit` 통과, `pnpm docs:html` 377개 파일, 새 페이지 태그 균형 정상, 내부 앵커·파일 링크 전수 검사 통과(계획서의 `UmaCtfAdapter.sol` 링크 하나만 깨져 있는데 **내 변경 이전부터 있던 것** — verex 의 컨트랙트 소스는 rabbit 으로 미러링되지 않는다. 별건으로 남긴다).


### `agent` 카드 done → **live**, 그리고 페이지가 목업이기를 그만두다

> 소스 문서: [lib/poc-cards.ts](../../lib/poc-cards.ts) — PoC 카드의 유일한 원본. 구조 설명은 [autonomous-trading-agent.md](../features/autonomous-trading-agent.md).

**Cause:** jay가 카드를 live 로 올리라고 지시. 직전 답변에서 나는 "콘솔이 로컬 전용이라 공개 카드로 걸면 방문자가 연결 오류를 본다"는 이유로 카드를 만들지 않았다고 보고했는데, jay가 그럼에도 live 를 택했다.

**Reasoning:** 지시를 그대로 따르되, **live 가 참이 되도록** 주변을 맞췄다. 그냥 `status` 만 바꾸면 카드는 "지금 돌아감"이라 말하는데 페이지 배너는 *"Mock — nothing here is running yet"* 이라 적혀 있어 서로 모순된다. 그래서 셋을 함께 고쳤다. ① **href 는 조작판이 아니라 `/poc/agent`** — 조작판은 anvil+verex 가 필요하므로 카드가 걸면 깨진다. 이 페이지는 인프라 없이 열리고 무엇이 만들어졌는지 보여준다. ② **배너 교체** — 목업 경고 대신 "만들어졌고 로컬 체인 위에서 돈다" + `pnpm delegation:verify` 의 **실제 출력**(두 enforcer 의 거절 문구)을 그대로 실었다. 방문자가 코드를 읽지 않고 주장을 확인할 수 있는 유일한 지점이다. ③ **"아직 무인 운영은 아니다"** 패널 신설 — 카드가 live 라는 이유로 스케줄러가 없다는 사실을 숨기지 않는다.

원래 있던 *"이 목업을 두고 정해야 할 것"* 열린 질문 넷은 구현이 전부 답했으므로 **질문을 지우지 않고 답과 나란히** 남겼다(무엇을 물었는지가 사라지면 왜 지금 모양이 이런지도 사라진다). 특히 "신호를 무엇으로 할까 — 가격?"의 답이 **뉴스**로 바뀐 게 크다: 가격 방아쇠는 에이전트를 규칙 실행기로 만들지만, 뉴스를 읽고 확률을 추정하면 판단이 판단이 되고 살아 있는 호가라는 독립된 기준과 겨룰 수 있다. `AgentJournalMock` 은 지우지 않고 "손으로 쓴 삽화"라고 그 자리에서 밝혔다 — 체인 없이 저널의 모양을 볼 유일한 방법이다.

**Change:** `lib/poc-cards.ts` 의 `agent` 카드 — `status: "done"` → `"live"`, `date: "2026-08-12"` → `"2026-08-26"`(실제로 동작하게 된 날), `howTo`·`howItWorks` EN/KO 전면 개정(Chainlink 가격 신호 → 뉴스+LLM, 여섯 갈래 거절, 스케줄러 부재 명시), 다이어그램을 실제 틱 흐름으로 교체. `app/poc/agent/page.tsx` 배너·질문 절 개정. `pnpm docs:pocs` 실행.

**Result:** 카드가 `/live` 허브에 뜬다(`app/live/page.tsx` 가 모든 소스에서 `status === "live"` 를 모은다). **의도된 부수 효과 하나** — `docs/topics/pocs-agent.html` 이 **삭제됐다.** 생성기 주석대로 *"라이브는 /live 허브 소관이라"* 정적 PoCs 카탈로그에서 빠지기 때문이다. 카드 하나가 목록을 떠나면서 이후 번호가 한 칸씩 당겨져 topics 61개 파일이 변경됐는데 **전부 번호 재배열**이다. `npx tsc --noEmit` 통과.

**남긴 관찰(미조치):** `middleware.ts` 는 `/poc/*` 를 전부 공개로 두고, 그 자리 주석이 *"비공개가 필요한 페이지가 생기면 /poc 밖에 두거나 예외를 명시할 것"* 이라고 적어 뒀다. 조작판이 바로 그 페이지다 — 다만 `/api/agent/*` 는 이미 미들웨어와 라우트 양쪽에서 오너 전용이라 데이터가 새지는 않는다. 방문자에게는 패널이 전부 에러로 보일 뿐이다. jay 지시 범위 밖이라 손대지 않고 기록만 한다.


### 아키텍처 문서에 기동 절차·콘솔 사용법 추가, 그리고 `j2-` 이름을 버림

> 소스 문서: [autonomous-trading-agent.md](../features/autonomous-trading-agent.md) (구 `j2-architecture.md`).

**Cause:** jay가 ① 컨트랙트 배포·시딩·콘솔 사용법을 아키텍처 문서에 넣고 ② **"j2 가 모호하니 파일명을 바꾸라"**고 지시.

**Reasoning:** 이름부터 — "J2"는 두 저장소를 잇는 이 작업의 **내부 라벨**이고 계획서 밖에서는 아무 의미가 없다. 반년 뒤 `docs/features/` 를 훑는 사람에게 `j2-architecture.md` 는 열어봐야만 정체를 알 수 있는 파일이다. 형제 파일들이 `agentic-aa.md`·`ai-chat.md`처럼 **무엇인지로** 이름 붙어 있으므로 같은 규칙을 따라 `autonomous-trading-agent.md` 로 했다. `agentic-aa.md`(세션 키/AA 데모)와 헷갈리지 않도록 "trading" 을 넣었다. 파일 첫머리에 옛 이름을 한 줄 남긴다 — 링크가 아니라 검색으로 찾아오는 사람을 위해서다.

절차는 **§3 기동**과 **§4 콘솔 사용**으로 나눠 넣었다. 순서가 조용히 틀어지는 지점 둘을 본문에 못 박았다: ① **anvil 이 먼저** — verex 의 시드가 곧 forge 배포라 체인이 없으면 시딩 자체가 성립하지 않는다. ② **SDK 빌드** — rabbit 이 `file:` 링크로 `dist/` 를 보는데 심링크는 스스로 다시 빌드하지 않는다. 그리고 §3.4 를 UI 이전에 두었다 — `pnpm delegation:verify` 는 verex 도 Postgres 도 MetaMask 도 없이 도는데, 데모의 중심 주장이 깨졌다면 패널 세 개 들어가서가 아니라 여기서 알아야 하기 때문이다. 콘솔 절에는 여섯 판정을 한 자리에서 다 보는 조작 순서를 표로 넣고, 기본값(쿨다운 3600초, edge 0.05)으로는 불가능하다는 사실을 명시했다 — 그게 없으면 "왜 계속 SKIP_COOLDOWN 만 나오지"로 시간을 버린다.

**Change:** 파일명 변경 + 참조 9곳 갱신(계획서 2, features README 1, 히스토리 3, `app/poc/agent/page.tsx` 3). §3(기동, 5개 소절: 체인 → verex → rabbit → 검증 → 정리)·§4(콘솔) 신설, 이후 절 번호 4–9 → 6–11 재배열. 낡은 생성물 `docs/html/docs/features/j2-architecture.html` 삭제.

**Result:** 160줄 → 284줄. 앵커·파일 링크 전수 검사 통과, 생성 HTML 태그 균형 정상(19.6KB), `npx tsc --noEmit` 통과, 저장소 전체에 `j2-architecture` 참조 0건(문서 첫머리의 옛 이름 각주 제외).


### 라이브에서 들어왔는데 상단 메뉴는 "PoCs" — 2026-08-11 수정이 절반만 됐던 것

> 소스 문서: 없음 — jay가 `/poc/agent?from=live` 화면을 캡처해 지적(2026-08-26). 관련 결정은 [2026-08-11 이력](2026-08-11-rabbit-history.md)의 "라이브는 카테고리가 아니라 필터".

**Cause:** `agent` 카드를 live 로 올리고 `/live` 에서 열었더니, 되돌아가기는 "← 라이브"인데 **상단 메뉴는 PoCs 가 켜져** 있었다. 한 화면의 두 위젯이 서로 다른 곳을 가리켰다.

**Reasoning:** 근본 원인은 2026-08-11 결정 — **"라이브는 카테고리가 아니라 필터"** — 의 자연스러운 귀결이다. 같은 상세 페이지가 두 허브에서 열리므로 **경로만으로는 어디서 왔는지 알 수 없다.** 그날 `BackLink` 는 `?from=live` 를 읽도록 고쳐졌는데(`BackLinkClient` 신설) `NavLinks` 는 그대로 `pathname.startsWith(m.href)` 로 남았다. 즉 수정이 절반만 적용됐고, 그 절반이 드러나려면 **live 상태이면서 경로가 `/poc/` 아래인 카드**가 필요했다 — 오늘 `agent` 카드가 처음 그 조합이 됐다. 그 전까지는 재현 자체가 불가능했다.

구현에서 한 번 잘못 짚었다: `NavLinks` 안에서 바로 `useSearchParams` 를 부르고 `Suspense fallback` 에 `NavLinks` 자신을 넣었는데, **fallback 도 같이 suspend 하므로** 성립하지 않는다. `BackLink`/`BackLinkClient` 가 이미 같은 문제를 조회(훅)와 판단(렌더)의 분리로 풀어 뒀으므로 그 구조를 그대로 따랐다.

**Change:** `app/NavLinks.tsx` — 훅 제거, `fromLive` 를 prop 으로 받아 참이면 `/live` 만 활성. `app/NavLinksLive.tsx` 신설(`?from=live` 만 읽는 얇은 래퍼). `app/Nav.tsx` — `<Suspense fallback={<NavLinks …/>}><NavLinksLive …/></Suspense>`. fallback 이 훅을 쓰지 않으므로 파라미터를 읽기 전에도 메뉴는 경로 기준으로 정상 표시된다.

**Result:** `/live` → 카드 → 상세에서 메뉴와 되돌아가기가 **둘 다 라이브**를 가리킨다. `/poc` 경유로 들어오면 종전대로 PoCs. `npx tsc --noEmit` 통과, `npx next build` 컴파일 성공(정적 라우트 `/poc/[key]` 포함 — Suspense 없이는 여기서 걸린다). `/live` 는 featured 와 일반 카드 양쪽 모두 `from=live` 를 싣고 있어(`app/live/page.tsx:43`, `DemoCard.tsx:27`) 추가 작업은 없다.


### PoCs 를 사이트에서 내림 — 메뉴 항목 제거 + 정적 생성 비활성화

> 소스 문서: 없음 — jay 지시(2026-08-26). 뒤집힌 결정은 [2026-08-11 이력](2026-08-11-rabbit-history.md)의 "PoCs 가 라이브보다 앞".

**Cause:** jay: *"rabbit 사이트에 PoCs 는 필요 없다. 상단 메뉴에서 PoCs 를 빼고 카드 HTML 생성도 끄라."*

**Reasoning:** 2026-08-11 에는 정반대로 판단했었다 — *"이 사이트의 성격은 「무엇을 만들고 있나」가 먼저고, 라이브는 그중 완성된 것"* 이라 PoCs 를 라이브보다 앞에 뒀다. 그 판단이 뒤집힌 것이므로 주석에 근거를 남긴다.

**라우트는 지우지 않았다.** `/poc`, `/poc/[key]`, `/poc/aa` 등은 그대로 살아 있고 미들웨어에서도 여전히 공개다 — **라이브 카드가 `/poc/<key>` 상세로 들어가므로 지우면 라이브가 깨진다.** 사라진 것은 진입점 하나뿐이다.

생성기를 **지우지 않고 가드만 둔** 이유 둘: ① `generate-pocs-html.mjs` 는 자기가 쓰지 않은 `docs/topics/pocs-*.html` 을 **삭제한다.** 무심코 한 번 돌면 66개 파일이 사라지고, 가드가 없으면 그 사고는 `pnpm docs:pocs` 를 습관적으로 친 순간 일어난다. ② `lib/poc-cards.ts` 는 여전히 앱의 정본이다 — `/live` 허브와 `/poc/[key]` 상세가 그걸 읽으므로 데이터는 살아 있고, 생성기도 되살릴 수 있어야 한다. 그래서 `POCS_HTML=1` 탈출구를 뒀다.

pre-commit 훅(`.githooks/pre-commit`)이 이 생성기를 부르지 않는다는 것을 먼저 확인했다 — 훅은 `generate-docs-html.mjs`(마크다운 → `docs/html/`)만 돌린다. 그래서 `docs:pocs` 는 수동 전용이었고 끄는 데 부작용이 없다.

**Change:** `app/Nav.tsx` — `{ href: "/poc", … }` 항목 제거(복원용 한 줄을 주석으로 보존). `scripts/generate-pocs-html.mjs` — 상단에 `POCS_HTML` 가드 + 비활성화 사유. `package.json` — `docs:pocs` 스크립트 제거.

**Result:** `npx tsc --noEmit` 통과, `npx next build` 컴파일 성공. 생성기를 직접 실행해도 안내만 출력하고 exit 0 — 파일을 쓰지도 지우지도 않는다. 배포 env 의 `ALLOW_ETC` 는 이제 아무 메뉴도 제어하지 않는다(지워도 무해). **jay 확인 필요:** 오늘 카드 flip 으로 생긴 `docs/topics` 62개 + `docs/pocs.html` + `docs/index.html` 의 변경분(번호 재배열과 `pocs-agent.html` 삭제)이 작업 트리에 남아 있다. 이제 생성이 꺼졌으니 정적 산출물은 **HEAD 시점으로 얼려 두는 편이 일관적**이라 되돌리기를 권하지만, 되돌리는 명령은 작업 트리를 버리는 종류라 jay 몫으로 남긴다.


### live 상세 5개를 `/poc` → `/live` 로 이동

> 소스 문서: 없음 — jay 지시(2026-08-26). 직전 결정(PoCs 메뉴 제거)의 연장이다.

**Cause:** jay: *"라이브를 담을 폴더가 필요하다 — 상세 페이지를 poc 에서 live 로 옮겨라."* PoCs 가 메뉴에서 사라진 뒤, 실제로 돌아가는 페이지들이 여전히 `/poc` 아래 있는 것이 어색해졌다.

**Reasoning:** 범위를 먼저 물었다. live 카드는 8장인데 **경로 트리가 셋**이다 — `/poc` 아래 5개(ap2·7702·aa·agent·toss), `/market`(hyperliquid), `/xyz`(pbs), `/til/lmsr-hybrid-amm`. jay 지시문의 "poc 에서 live 로"라는 문구대로 **`/poc` 아래 5개만** 옮기기로 했고, 옛 URL 은 공유됐을 수 있어 **영구 리다이렉트**를 남기기로 했다(jay 선택).

옮기면서 세 가지가 조용히 깨질 뻔했고, 셋 다 같은 부류다 — **전제는 코드가 아니라 배치에 있었다.**

① **미들웨어의 서브트리 규칙.** `/poc` 아래는 `isPublicPocPath` 로 통째 공개였다. `PUBLIC_PATHS` 는 정확 일치라 `/live/aa/scenarios/<slug>` 같은 하위 경로가 빠지고, 그러면 **배포 후에야** `/login` 으로 튀는 것을 발견하게 된다 — 그 파일 주석이 이미 두 번 데었다고 적어 둔 그 실패다. 규칙을 `isPublicDemoPath` 로 넓혀 경로와 **함께** 옮겼다.

② **`/poc/[key]` 의 전제.** 그 라우트는 *"전용 페이지가 있는 카드는 정적 세그먼트가 동적 세그먼트보다 우선하므로 가로채지 않는다"* 에 기대고 있었다. 정적 세그먼트가 `/live` 로 떠나면서 그 방패가 사라졌다. 실제로는 리다이렉트가 먼저 잡아 주지만, 그러면 **닿을 수 없는 페이지를 생성**하게 된다. `generateStaticParams` 를 `ownedHere` 로 걸러 `/poc/ap2` 같은 죽은 경로를 더는 만들지 않고, 같은 판정을 `hasOwnPage` 와 공유하게 했다(판정이 둘이면 갈라진다).

③ **리다이렉트는 결국 남기지 않기로 했다(jay, 같은 날).** 처음엔 영구 리다이렉트 8줄을 넣었다가 jay가 *"리다이렉트 대신 옮긴 뒤 지워라"* 로 방침을 바꿨다. 옛 `/poc/<name>` 다섯은 이제 404 다. 이 다섯은 대부분 배포된 적 없는 데모 경로라, 규칙 8줄을 영구히 지고 가는 비용이 URL 하나를 버리는 비용보다 크다는 판단. 되살릴 때를 위해 **와일드카드를 쓰지 말라**는 이유는 주석에 남겼다 — `/poc/:path*` 로 통째 넘기면 옮기지 않은 dvt·oz-relayer·`[key]` 상세 67개가 존재하지 않는 `/live/...` 로 튄다.

되돌아가기 기본값도 함께 옮겼다: 옮긴 5개는 `/poc` 가 아니라 **라이브**로, 조작판은 허브가 아니라 **`/live/agent`** 로(시나리오가 `/live/aa` 로 가는 것과 같은 규칙 — 부모는 허브가 아니라 자기 위 페이지다).

**Change:** `git mv app/poc/{ap2,7702,aa,agent,toss} app/live/`. 경계를 둔 정규식으로 경로 문자열 52곳 치환(19개 파일) — `/poc/agent` 가 `/poc/agents-computer-use`(비-live 카드)를 잡지 않도록 `(?![A-Za-z0-9-])` 를 뒀다. `middleware.ts` 서브트리 규칙 확장, `next.config.js` 영구 리다이렉트 8줄, `app/poc/[key]/page.tsx` 의 `generateStaticParams` 필터, BackLink 대상 6곳. 문서는 **현재형 문서만** 갱신(`docs/tasks/current-plan.md`, `docs/features/{README,agentic-aa,autonomous-trading-agent}.md`) — **이력 파일은 손대지 않았다.** `/poc/agent` 는 그때 참이었고, 감사 기록을 고쳐 쓰면 그게 거짓이 된다.

**Result:** 옛 폴더는 `git mv` 로 옮겨졌으므로 **중복 없이 사라졌다** — git 이 rename 으로 추적한다(`RM app/poc/aa/page.tsx -> app/live/aa/page.tsx`). `npx tsc --noEmit` 통과, `npx next build` 컴파일 성공. 라우트가 `/live/{ap2,7702,aa,agent,toss}` + `/live/aa/scenarios/[slug]`(4개 정적) + `/live/agent/console` 로 생성되고, `/poc/[key]` 는 이제 **전용 페이지가 없는 카드만** 생성한다(`/poc/ap2` 등 죽은 경로 소멸). `/poc` 에는 dvt·oz-relayer·`[key]` 가 남았고 메뉴에서 링크되지 않는다 — jay가 정리하기로 하면 다음 결정거리다.
