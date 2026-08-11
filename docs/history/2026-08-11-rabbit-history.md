# 2026-08-11 — rabbit

관련 문서:
- [docs/tasks/current-plan.md](../tasks/current-plan.md) — 자율 결제 에이전트 PoC(M1–M4, D1–D5). 아래 두 항목 모두 이 문서가 다루는 `/poc/agent`에 붙는다.
- 서비스 탐방 42/113(OpenZeppelin Defender → Relayer·Monitor)은 **저장소 안에 원본 문서가 없다** — jay가 대화로 전달한 회차 요약이 출처다.

### PoC 카드 추가: OpenZeppelin Relayer · Monitor

**Cause:** jay가 서비스 탐방 42번(Defender 종료 → 오픈소스 Relayer·Monitor)을 PoC 카드로 만들어 달라고 요청. 내일 사고 실험 대상으로 쓸 목적 — `agent` 카드와 같은 방식.

**Reasoning:** 다른 카드처럼 "이 서비스를 쓸까"로 쓰면 카탈로그에 한 줄 더 붙는 것뿐이다. 이 회차의 값어치는 두 군데에 있다고 봤다 — ① Relayer가 다루는 층(논스·가스·재시도)이 `agent` PoC가 **지금 손으로 짜고 있는 바로 그 배관**이라는 것, ② Defender의 종료가 인프라 선택 기준에서 빠져 있는 항목("벤더가 떠날 때 무엇이 남는가")의 사례라는 것. 그래서 `purpose`를 이 두 질문으로 구성하고, 카드가 `agent`와 실제로 접합되게 썼다.

**Change:** [lib/poc-cards.ts](../../lib/poc-cards.ts)에 `oz-relayer` 카드 추가 — `status: "soon"`, `href` 없음(페이지 미구현), `date` 없음. mermaid 다이어그램 1장: 에이전트 틱에서 Relayer가 앉을 자리와, Relayer를 넣어도 **여전히 아무의 일도 아닌** 가스통을 함께 그렸다.

**Result:** `/poc`에 카드 노출(soon 그룹). `tsc --noEmit` 통과. 페이지는 아직 없고, 내일 사고 실험 뒤에 만들지 판단한다.

### /poc/agent: "거의 모두가 틀리는 여섯 가지" 패널 추가

**Cause:** jay와 구매 시나리오(유료 기사 결제)를 한 줄씩 따라가며 나온 오해들 — jay가 묻고 내가 정정한 부분을 카드에 남겨 달라는 요청.

**Reasoning:** 여섯 가지 전부 **화면만 보면 자연스럽게 도달하는** 결론이었다. 원인이 셋으로 정리됐다: 이름이 겹치거나(delegation이 서로 무관한 셋), 비유가 새거나(코드가 계정을 "호출"한다 — 실제로는 EVM이 코드를 로드해 계정의 컨텍스트로 실행), 표준의 범위를 넓게 잡거나(ERC-7710이 강제까지 정의할 것 같지만 실제로는 `redeemDelegations()` 하나뿐이고 permission context는 `bytes[]`로 범위 밖 선언). 목업 바로 아래에 둔 이유는 그 오해들이 **목업을 보는 동안** 생기기 때문이다.

**Change:** [app/poc/agent/page.tsx](../../app/poc/agent/page.tsx)에 패널 추가 — 「흔한 읽기 → 실제」 형식 6항목, 기존 패널과 같은 ko/en 병기. 위치는 저널 목업과 "정해야 할 것" 사이.

**Result:** 두 항목이 페이지의 미결 질문과 직접 연결된다 — ④는 "이 데모가 증명하지 않는 것"에 **표준 기반 강제가 아님**을 추가할 근거이고, ⑥은 저널 열 구성 질문("빠진 열이 있나")에 대한 구체적 답이다: **잔여 가스는 비용 열이 아니라 자체 만료를 가진 두 번째 예산**으로 헤더에 들어가야 한다. 둘 다 아직 반영하지 않았다 — jay 검토 대상.

### 목업 배지를 회색에서 인디고로

**Cause:** jay 지적 — 목업 카드는 **눌리는데** 배지가 회색이라 "아직 없음"으로 읽힌다. `/poc/agent`가 몇 주째 그 상태였다.

**Reasoning:** 배지는 세 상태를 구분해야 한다(라이브 / 목업 / 준비 중). 목업을 라이브 초록으로 올리면 동작하지 않는 걸 동작한다고 말하는 셈이고, 회색으로 두면 눌린다는 걸 아무도 모른다. 그래서 **세 번째 색**이 필요하다 — 사이트가 이미 쓰는 인디고(`#3f36e2` / 다크 `#8b84ff`, `plink-mail`과 같은 값)를 재사용해 새 색을 도입하지 않았다.

**Change:** [app/globals.css](../../app/globals.css)에 `.poc-badge-mock` 추가(+ 다크 오버라이드), [app/DemoCard.tsx](../../app/DemoCard.tsx)의 배지 클래스를 `isLive → isPreview → soon` 3분기로.

**Result:** `/poc`의 목업 카드(agent, oz-relayer)가 인디고 배지로 구분된다. `tsc --noEmit` 통과.

### /poc/oz-relayer 목업 페이지 + 정산 큐 시뮬레이터

**Cause:** jay 요청 — 카드에 실제 시나리오를 채우고 상세 페이지를 만들 것. 내일 사고 실험의 대상을 눈앞에 세워 두는 용도.

**Reasoning:** 시나리오를 지어내지 않고 **verex의 실제 코드**에서 가져왔다. [verex `packages/api/src/worker.ts`](../../../verex/packages/api/src/worker.ts)는 이름만 안 붙은 릴레이어다 — 직렬 실행이 곧 논스 관리(파일 헤더가 그렇게 말한다), 지수 백오프 5s/25s/125s, 원자적 PENDING→RUNNING 클레임, 2분 뒤 stuck 복구, `onFailed` 보상. 그래서 세 질문이 전부 **검증 가능**해진다: ① 지울 것(논스·가스·재시도) ② 남을 것(`onFailed` — 배관의 옷을 입은 비즈니스 로직) ③ **깨질 것**(단일 레인이 논스만이 아니라 정산 순서까지 부수적으로 직렬화하고 있었다). ③이 진짜 질문인 이유는 이 코드베이스가 이미 그 계열의 버그를 냈기 때문이다 — 08-07의 정산 전 `balanceOf` 사다리 산정.

**Change:** [app/poc/oz-relayer/page.tsx](../../app/poc/oz-relayer/page.tsx)(목업 경고 배너 · 벤더 퇴장 프레이밍 · 세 질문 · Monitor 룰 예시 · 정해야 할 것 · 주장하지 않는 것) + [SettlementQueueMock.tsx](../../app/poc/oz-relayer/SettlementQueueMock.tsx)(블록 단위 스테퍼, 직렬 레인 vs 동시 3건, 체인 지연·가스·재시도는 양쪽 동일하게 두고 동시성만 변수로). 카드에 `href` 추가 → 목업 배지로 승격, `howTo`는 그리드용 한 줄로 축약(세 질문은 페이지로 이동), 다이어그램 3장(오늘의 verex / Relayer 도입 후 / 에이전트 틱에서의 자리).

**Result:** `/poc/oz-relayer` 접근 가능. `tsc --noEmit` 통과. 큐 숫자는 측정값이 아니라 각본이며 페이지가 그렇게 명시한다. Monitor 룰 JSON은 **스키마 미검증** — 실제 필드명은 `openzeppelin-monitor` 저장소에서 확인 필요(페이지에도 그렇게 적어 뒀다).

### 버그: /poc/oz-relayer 가 /login 으로 튀었다 (302)

**Cause:** jay가 카드 링크가 깨졌다고 보고. 재현하니 `/poc/oz-relayer`가 **302 → /login**.

**Reasoning:** 원인은 라우팅이 아니라 [middleware.ts](../../middleware.ts)의 인증 가드였다. `PUBLIC_PATHS`는 **명시적 허용 목록**이고(prefix 매칭을 일부러 안 쓴다), 새 페이지는 자동으로 비공개가 된다. `/poc/agent`도 같은 이유로 개별 항목이 있었는데, 새 페이지를 추가하며 이 단계를 빠뜨렸다. 실패가 빌드·타입체크 어디에도 안 걸리는 종류라 — 라우트는 정상이고 미들웨어만 가로챈다 — `tsc` 통과를 근거로 삼은 게 잘못이었다.

**Change:** `PUBLIC_PATHS`에 `/poc/oz-relayer` 추가. 이후 **실제 curl 스모크 테스트**로 검증(200 확인). 앞으로 새 공개 페이지는 빌드가 아니라 HTTP 상태로 확인한다.

**Result:** `/poc/oz-relayer` 200. 허브 카드에서 정상 진입.

### IA 개편: 「라이브」 상단 메뉴 신설, TIL 을 PoCs 로 흡수

**Cause:** jay 요청 두 건 — ① 라이브 카드를 별도 상단 메뉴로 분리 ② PoCs와 TIL을 PoCs 하나로 합칠 것.

**Reasoning:** 카탈로그가 16장을 넘기면서 `/poc` 한 그리드에 라이브·목업·준비 중이 섞였고, "지금 돌아가는 게 뭐냐"에 답하려면 배지를 하나씩 읽어야 했다. **두 질문을 두 페이지로 나눈다** — `/live`는 "돌아가는 것", `/poc`는 "만들고 있는 것과 계획". 카드 데이터는 여전히 [lib/poc-cards.ts](../../lib/poc-cards.ts) 한 곳이고 `status === "live"` 하나로 갈리므로, 카드가 라이브가 되면 손댈 것 없이 옮겨간다. TIL은 카드 포맷도 컴포넌트도 같아서 메뉴를 둘로 나눌 만큼 다른 물건이 아니었다 — `/poc` 안 섹션으로 흡수하되, 공유된 링크가 죽지 않게 `/til`은 리다이렉트로 남기고 상세(`/til/lmsr-hybrid-amm`)는 유지.

**Change:** [app/live/page.tsx](../../app/live/page.tsx) 신설(피처드 + 라이브 그리드) · [app/poc/page.tsx](../../app/poc/page.tsx)는 비라이브 + TIL 섹션 · [app/til/page.tsx](../../app/til/page.tsx)는 `/poc` 리다이렉트 · [app/Nav.tsx](../../app/Nav.tsx)에 라이브 추가·TIL 제거 · `middleware.ts`에 `/live` 공개 추가 · `.env.local`에 `ALLOW_LIVE=true`.

**Result:** 빌드 통과, 6개 라우트 스모크 테스트 통과(`/live` 200 · `/poc` 200 · `/til` 307→/poc · 상세 200). ⚠️ **메뉴는 `ALLOW_LIVE` 에 의존한다** — `deploy.sh`가 `ALLOW_*`를 전부 Cloud Run env로 전달하므로 배포 시 따라가지만, 안 따라가면 메뉴가 **조용히** 사라진다(Nav.tsx 주석이 경고하는 바로 그 실패 모드).

### PoC 카드 4장 추가 — README 표에 있는데 카드가 없던 것

**Cause:** jay 요청 — `docs/features/README.md`에 있는데 PoCs에 없는 기능을 카드로 추가.

**Reasoning:** 표의 모든 행을 카드로 만들지는 **않았다**. "📎 Reference only"로 표시된 행들(KB 하이브리드 결제·CRE×Cloud·Thirdweb·Merkle vs Verkle·Linera·Web Stack)은 README 스스로 "no dev item"이라 적어 두었고, 카드로 만들면 만들 계획이 있는 것처럼 보인다. **라우트가 있거나 만들 의도가 있는 넷**만 넣었다.

**Change:** `game`(/game, Unity WebGL 트랙 — 지금 캔버스 자리표시자) · `jayverse`(/jayverse 스텁) · `dsrv-portal`(기관 커스터디: MPC·승인 플로우·AA·AML, VASP 없이 되는 부분 분리) · `pet-clean-room`(FHE 클린룸, 서베이 아닌 실측 계획).

**Result:** PoCs 카드 16장. 넷 다 `status: "soon"`이고 `game`/`jayverse`만 `href`가 있다.

### 「알고리즘」 상단 메뉴 신설 — 카드는 옮겨 적지 않고 키로 고른다

**Cause:** jay 요청 — Algorithms 상단 메뉴를 만들고 `LMSR & the hybrid AMM`, `Geometric series → DCF valuation` 두 장을 그리로.

**Reasoning:** 두 카드 본문이 길어서(LMSR 카드만 50줄 가까이) **파일 간 복사가 그 자체로 오타·분기 위험**이다. 같은 내용이 두 파일에 살면 한쪽만 고쳐지는 날이 온다. 그래서 [lib/algorithm-cards.ts](../../lib/algorithm-cards.ts)를 **키로 고르는 얇은 층**으로 만들었다 — 소스는 여전히 `til-cards.ts` 한 곳이고, 갈리는 건 "어느 허브에 뜨는가" 뿐이다. 카드를 옮기려면 `ALGORITHM_KEYS`에 key 하나만 추가하면 `/poc`가 자동으로 뺀다. 메뉴를 가른 근거는 답하는 질문이 다르다는 것 — PoCs는 "무엇을 만들고 있나", 알고리즘은 "어떤 결과를 이해했고 어디에 쓰이나".

**Change:** [lib/algorithm-cards.ts](../../lib/algorithm-cards.ts)(키 기반 분기 + `TIL_REMAINING`) · [app/algorithms/page.tsx](../../app/algorithms/page.tsx) 신설 · `/poc`는 `TIL_REMAINING`을 그림 · Nav에 알고리즘 추가 · `middleware.ts` 공개 · `.env.local`에 `ALLOW_ALGORITHMS=true`. 메뉴 순서도 jay 지시대로 **PoCs → 라이브 → 알고리즘**.

**Result:** 스모크 테스트 통과 — `/algorithms` 200, 메뉴 순서 확인.

**이후 정정 (같은 날, jay):** `amortized-potential-function`을 알고리즘으로 추가하고, **LMSR은 다시 빼서 라이브로** 보냈다. 결과적으로 알고리즘 허브는 「이해했지만 아직 코드가 없는 것」(등비급수→DCF, 포텐셜 함수 분할상환)이 됐고, 완성된 LMSR 노트는 라이브가 가져간다. 이때 `/poc`가 TIL 쪽 라이브 카드를 걸러내지 않고 있다는 게 드러나서(LMSR이 `/poc`와 `/live`에 함께 떴다) 두 소스에 같은 규칙을 걸었다 — **이 페이지는 "만들고 있는 것"만 답한다.** 검증: LMSR이 `/live`에만 1회, `/poc`·`/algorithms`에 0회.

### 카드 상세를 12장 쓰는 대신 동적 라우트 하나로

**Cause:** jay 요청 — "준비 중" 카드 전부에 상세 페이지를 만들고 링크할 것. 대상이 12장이 넘었다.

**Reasoning:** 손으로 12장을 쓰면 **같은 내용이 두 곳에 살면서 갈라진다.** 카드는 이미 `purpose`/`howItWorks`/`diagrams`를 들고 있고 `TechNotes`가 그것을 그대로 렌더한다. 그래서 [app/poc/[key]/page.tsx](../../app/poc/%5Bkey%5D/page.tsx) 하나로 카드 데이터를 펼친다 — 카드를 추가하면 **상세가 저절로 생긴다.** 전용 페이지가 있는 카드는 Next의 정적 세그먼트 우선 규칙 덕에 가로채이지 않는다. `DemoCard`에는 `card.href ?? /poc/{key}` fallback을 넣어 **눌리지 않는 카드가 사라졌다**. 배지는 여전히 `card.href` 기준 — 열리는 것과 만들어진 것은 다른 이야기라 「목업(인디고)」과 「준비 중(회색)」을 유지한다.

**Change:** 동적 상세 라우트 + `DemoCard` fallback + 참조 카드 6장 추가(merkle-vs-verkle · linera-microchains · web-stack-layers · kb-hybrid-payment · cre-cloud · thirdweb). 처음엔 "no dev item"이라 뺐던 것들인데, jay가 다시 물어서 넣었다 — 목록의 목적이 "무엇을 읽고 이해했는가"이기도 하다면 읽기 자료를 숨기는 쪽이 목록을 좁게 만든다.

**Result:** 10개 상세 라우트 200 확인, 프로덕션 빌드 exit 0.

### 미들웨어: 명시적 허용 목록 규칙을 /poc 아래에서만 푼다

**Cause:** 동적 상세 라우트가 전부 **302 → /login**. `/poc/oz-relayer`와 **정확히 같은 실패를 하루에 두 번** 겪었다.

**Reasoning:** `PUBLIC_PATHS`는 명시적 허용 목록이고 "prefix 매칭 금지"가 이 파일의 규칙이었다. 그런데 동적 라우트는 **원리상 손으로 적을 수 없다** — 카드가 늘면 경로도 는다. 그리고 이 실패는 빌드에도 `tsc`에도 안 잡히고 **배포 후에야 보인다.** `/poc` 서브트리는 설계상 전부 공개(데모 허브, 오너 데이터를 다루는 페이지가 들어올 일이 없음)이므로 여기서만 prefix를 허용했다. 주석에 "비공개가 필요한 페이지가 생기면 /poc 밖에 두거나 예외를 명시하라"고 남겨, 그때 이 결정이 다시 꺼내지도록 했다.

**Change:** [middleware.ts](../../middleware.ts)에 `isPublicPocPath` — `/poc` 및 `/poc/*`. 개별 항목 5개(`/poc/aa/scenarios/*` 4개 포함) 제거.

**Result:** 상세 라우트 전부 200. **교훈: 새 공개 페이지는 빌드가 아니라 HTTP 상태로 검증한다.**

### 카드 상태·배치 정리 (jay 지시)

**Cause / Change / Result:** 연속된 큐레이션 지시를 한 항목으로 묶는다.
- **DVT → 목업** — 페이지는 완성됐지만 돌아가는 건 없다. `/live`는 "열어서 실제로 해볼 수 있는 것"만 답해야 한다.
- **자율 결제 에이전트 → 라이브.** ⚠️ **페이지 상단 배너는 여전히 "아직 아무것도 실제로 돌지 않습니다"라고 말한다** — 카드와 페이지가 서로 다른 말을 하는 중이라 둘 중 하나를 맞춰야 한다.
- **라이브는 카테고리가 아니라 필터로 재정의.** LMSR이 `status: "live"`인데 `/live`에 안 뜬다는 지적에서 나왔다 — `/live`가 `POC_CARDS`만 읽고 있었다. 이제 모든 카드 소스에서 `status === "live"`를 모은다. 같은 카드가 알고리즘과 라이브에 함께 보이는 건 중복이 아니라 **필터의 정의**다.
- **포텐셜 함수 분할상환 분석 → 알고리즘.**
- **JayVerse 제거** — 메뉴와 카드 둘 다. `/jayverse` 라우트는 남아 있지만 어디서도 링크하지 않는다.

### 논의에서 남은 미결 항목 (반영 안 함)

**Cause:** 위 논의 중 결론이 났지만 코드/문서에 아직 넣지 않은 것들. 잊히지 않게 여기 남긴다.

**Reasoning / Change / Result:** 아래 셋은 `current-plan.md` §4의 결정 항목으로 올릴 후보이며, 오늘은 **기록만** 했다.
- **D6 후보 — x402 정산 경로.** x402는 보통 ERC-3009 `transferWithAuthorization`으로 정산하는데, 그 서명은 USDC를 **직접** 때리므로 DelegationManager를 거치지 않는다 → **caveat 강제기가 하나도 실행되지 않는다.** 한도·만료가 전부 우회된다. 온체인 강제를 지키려면 `redeemDelegations` 경로로 결제하고 txHash를 증빙으로 제시해야 한다(~12초 확정 대기, 20분 신선도 창 대비 무의미한 비용). 튜토리얼을 따라가면 자연히 우회 경로를 고르게 되므로 명시적 결정이 필요하다.
- **`allowedTargets`의 확장성.** 목업은 수취인 1개다. 실제 뉴스 구매는 발행사 다수 → x402 facilitator 하나를 허용(대상 1, 상인 다수, 대신 라우팅 신뢰가 facilitator로 이동)하거나 N개를 허용하고 N+1마다 재부여. **숫자를 조이는 것으로 확장되지 않는 유일한 caveat**이라 M1 전에 정할 것.
- **트리거 재검토.** 페이지가 이미 묻는 질문("가격이 맞는 방아쇠인가")에 대해: 시간에 민감한 유료 기사 구매가 ETH/USD보다 낫다. 산 것이 곧 결제의 목적이라 "투자 전략이 아니다"라는 부인이 필요 없고, 건너뜀 행이 사람이 평가할 수 있는 판단("너무 비싸다", "이미 있다")이 된다. 다만 신선도 창이 20분이면 **5분 틱이 곧 지연 예산**이 되어, 타이머 구동에서 이벤트 구동으로 바뀐다.

### 라이브 카드 상세의 "← TIL" 뒤로가기 — 허브 제거가 남긴 고아 라벨 (조사만, 수정 전)

**Cause:** jay 지적 — `/live`에서 LMSR 카드를 열면 상세 페이지 뒤로가기가 "← TIL"인데, TIL은 오늘 상단 메뉴에서 제거된 허브다. 링크가 잘못된 곳이 많아 보인다는 보고.

**Reasoning:** 로컬(3100)·운영(www.jaylabs.xyz) 전 링크를 크롤로 확인 — 404는 0개. 문제는 깨진 링크가 아니라 **뒤로가기가 부모 허브를 하드코딩**하는 설계다. 오늘 "라이브는 카테고리가 아니라 필터"로 바꾸면서 같은 카드가 여러 허브(라이브·PoCs)에서 열리게 됐는데, BackLink는 여전히 허브 하나를 고정으로 가리킨다. TIL 상세는 `href="/til"`(→ `/poc` 리다이렉트)이라 라벨까지 죽은 메뉴를 가리킨다.

**Change:** 없음 — 조사 단계. 발견 사항: ① `app/til/lmsr-hybrid-amm/page.tsx:23` `← TIL` → 존재하지 않는 허브, 클릭 시 `/poc` 착지. ② `/market`·`/xyz`·`/poc/*` 상세도 `/live`에서 들어와도 전부 "← PoCs"로 돌아감. ③ 보너스: `/poc`의 게임 카드는 비로그인 방문자에게 보이는데 `/game`은 middleware 공개 목록에 없어 클릭하면 `/login`으로 튐(oz-relayer 때와 같은 실패 유형).

**Result:** 수정안 제시 후 jay 결정 대기 — 최소안은 TIL 상세 뒤로가기를 "← PoCs"(`/poc`)로 고치고 게임 카드를 공개 여부와 일치시키는 것, 근본안은 허브 카드가 `?from=<hub>`을 넘겨 BackLink가 온 곳으로 돌려보내는 것.

### 뒤로가기·/game 수정 + Workspace Index 에 PoCs 섹션 (jay 승인 — main 머지·배포까지)

**Cause:** 위 조사 항목에 대해 jay 가 수정을 승인했고, 추가로 문서 색인(Workspace Index)에 PoCs 섹션과 "View All PoCs" 페이지를 요청했다 (PoCs 섹션은 Algorithms 앞).

**Reasoning:** 뒤로가기는 최소안(← PoCs)으로 — `?from=<hub>` 구조안은 이번 요청 범위가 아니다. `/game` 은 oz-relayer 전례를 따라 라우트를 공개한다(카드가 공개면 라우트도 공개). PoCs 문서는 손으로 쓰지 않고 `lib/poc-cards.ts` 에서 생성한다 — TIL 라벨 표류와 같은 "두 표면이 갈라지는" 실패를 소스 단일화로 막기 위해. lib/*.ts 는 확장자 없는 import 라 Node 가 직접 못 읽어, 기존 devDep 인 tsc 로 CJS 임시 컴파일 후 require 하는 방식을 골랐다(새 의존성 0).

**Change:** ① `app/til/lmsr-hybrid-amm/page.tsx` 뒤로가기를 기본값(← PoCs, `/poc`)으로. ② `middleware.ts` PUBLIC_PATHS 에 `/game` 추가. ③ `scripts/generate-pocs-html.mjs` 신규 — `docs/index.html` 의 POCS:BEGIN/END 마커 사이(컴팩트 카드, Algorithms 앞)와 `docs/pocs.html`(전체 내용, read-the-docs 포맷) 둘 다 생성. `pnpm docs:pocs` 로 재생성.

**Result:** 로컬 검증 — `/game` 비로그인 200(전엔 /login 302), TIL 상세 뒤로가기 `<a href="/poc">PoCs</a>`, pocs.html 에 17개 카드 전부. main 머지·Cloud Run 배포는 이 항목 아래 작업으로 진행.

### 자율 결제 에이전트 → 목업 복귀 + 라이브발 상세의 뒤로가기를 "← 라이브"로

**Cause:** jay 지시 둘 — ① 자율 결제 에이전트를 PoCs 목업으로 되돌릴 것(카드는 라이브인데 페이지 배너는 "아직 안 돈다"고 말하던 모순의 해소), ② 라이브에서 연 상세 페이지의 뒤로가기가 "← PoCs"로 나가는 문제(Toss 스크린샷)를 고칠 것.

**Reasoning:** 라이브는 필터라 같은 상세가 여러 허브에서 열린다 — 뒤로가기를 페이지에 하드코딩하는 한 어느 한쪽은 늘 틀린다. 허브가 출처를 알려주는 게 맞다: 카드 링크에 `?from=live` 를 실어 보내고, BackLink 가 그걸 읽어 온 곳으로 돌려보낸다. `useSearchParams` 는 클라이언트 훅이라 BackLink 를 서버 껍데기(Suspense) + 클라이언트 분기(BackLinkClient)로 쪼갰다 — 정적 프리렌더에서도 빌드가 깨지지 않게.

**Change:** ① `lib/poc-cards.ts` agent 카드 `status: "live"` → `"soon"`(href 유지 → 목업 배지, /live 에서 빠짐). ② `app/BackLinkClient.tsx` 신규 — `from=live` 면 `/live`·"라이브"로 오버라이드. ③ `app/BackLink.tsx` 는 Suspense 래퍼로. ④ `DemoCard` 에 `from` prop, `/live` 페이지가 카드·피처드 링크에 `?from=live` 부여. ⑤ `pnpm docs:pocs` 재생성(18카드 — agent 편입).

**Result:** 로컬 확인 — `/poc/toss` "← PoCs", `/poc/toss?from=live`·`/market?from=live`·`/til/lmsr-hybrid-amm?from=live` 전부 "← 라이브", `/live` 에서 agent 카드 제거·`/poc` 에 목업 배지. `next build` 통과. (검증 교훈: `<a>` 안 텍스트는 React 가 `<!-- -->` 로 쪼개므로 단순 정규식 grep 이 상단 메뉴 링크를 뒤로가기로 오인했다 — "← " 포함 패턴으로 다시 확인함.)
