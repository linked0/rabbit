# 2026-08-21 — rabbit 작업 이력

> 소스 문서: 없음 — jay와의 대화에서 나온 docs 폴더 구조 결정("하위 폴더마다 `images/` vs 루트 `docs/images/` 하나")을 verex·rabbit·nostra-server 세 저장소에 일괄 적용한 작업. 결정의 근거와 전체 맥락은 verex 저장소의 `docs/history/2026-08-21-verex-history.md`에 기록. 전날 항목은 [2026-08-19-rabbit-history.md](2026-08-19-rabbit-history.md).

### docs 이미지를 루트 `docs/images/` 한 곳으로 통합 (주제별 하위 폴더)

**Cause:** jay가 세 저장소의 docs 이미지 배치를 하나의 규칙으로 통일하라고 지시. 코드와 무관하고 기능에 영향이 없으므로 커밋·머지까지 위임받음.

**Reasoning:** 루트 한 곳으로 모으는 근거는 ① 폴더를 넘나드는 재사용, ② 문서가 폴더 사이를 이동해도 `../images/`로 깊이가 일정, ③ 고아 파일 탐지 용이 — 세 가지(상세는 verex 항목). rabbit에서는 **두 곳을 예외로 남겼다**: `docs/archive/`는 `index.html` + `sections/*.html` + `images/`가 한 덩어리인 **자기완결적 HTML 스냅샷**이고, 그 안의 `profile.jpg`는 아카이브 자신의 HTML이 `../images/profile.jpg`로 참조한다 — 밖으로 빼면 아카이브가 깨진다. `docs/zsub/`는 `zshrc`·`karabiner.json`·`gitconfig`가 모인 **개인 설정 덤프**이지 문서가 아니라, 그 안의 `hanamichi.png`도 그대로 뒀다. "통째로 이동·삭제되는 폴더는 자기 이미지를 갖는다"는 예외 규칙에 해당.

**Change:** 이미지 3장 이동(`git mv`) — `tasks/images/investment-basic-ui.png` → `images/ui/`, `tasks/images/japanese.png` → `images/reference/`, `tasks/login-server-error.png`(폴더에 들어가 있지도 않았음) → `images/issues/`. 참조 갱신 6건: `jun-19-rabbit.md`, `jul-01-rabbit-design.md`, `jul-02-rabbit-design.md`의 이미지 문법과, `jun-19-rabbit-design.md`의 소제목 안 링크·`Jun-16-tasks.md`/`Jun-16-plan.md`의 인라인 코드 경로까지. 빈 `docs/tasks/images/` 제거. **코드 변경 없음.**

**Result:** docs 내 상대 경로 이미지 링크 전부 해석됨(스크립트 검증, MISS 0). 저장소 **최상위** `archive/`(docs 밖)와 `docs/archive/`, `docs/zsub/`는 손대지 않음. **참고로 발견한 것:** `docs/history/`에 `2026-08-18-verex-history.md`가 섞여 있다 — 다른 저장소 이름의 이력 파일이라 정리 대상으로 보이나, 이번 작업 범위가 아니라 그대로 뒀다.

### current-plan 리셋: 시작도 못 한 계획을 아카이브하고 features 백로그로 이관

> 소스 문서: [docs/tasks/archive/2026-08-21-current-plan-agentic-aa.md](../tasks/archive/2026-08-21-current-plan-agentic-aa.md) (이번에 아카이브된 그 계획) · 결과물은 [docs/tasks/current-plan.md](../tasks/current-plan.md)와 [docs/features/README.md → Backlog](../features/README.md#backlog).

**Cause:** jay가 "current-plan.md는 아카이브하고 새 current plan 파일이 필요하다, 구현 안 된 마일스톤·기능은 features README로 넣어라"고 지시. 기존 계획(*Agentic AA — the autonomy loop*, 2026-08-06 작성)은 **한 줄도 시작되지 않은 상태**였다 — M1·M2·M4·M5·§8 미착수, M3는 손으로 쓴 목업, 그리고 M1을 막는 **D2(세션 키 보관 위치)** 결정이 15일째 미응답.

**Reasoning:** 두 가지를 구분했다. 2026-08-06 아카이브는 **끝나서** 졸업한 것이고, 이번 건은 **시작을 안 해서** 졸업한다 — 그래서 "완료" 표가 아니라 **백로그**로 간다. 계획 문서에 그대로 두는 선택지는 버렸다: 활성 작업이 하나도 없는 계획서는 콜드 세션에게 "이걸 하는 중"이라고 거짓말을 한다. 반대로 삭제도 아니다 — D1·D5는 이미 결정이 났고 U1~U4는 다시 유도할 이유가 없는 설계 자산이라, 설계 산문은 아카이브에 **원문 그대로** 두고 상태 표만 features로 옮겼다. 새 계획서는 **활성 작업 0개**로 시작한다. jay가 "다음 건 이따 정하겠다"고 했으므로, 후보 목록은 **메뉴이지 약속이 아니라**는 걸 문서에 명시했다.

**Change:** ① `docs/tasks/current-plan.md` → `archive/2026-08-21-current-plan-agentic-aa.md` (`git mv`, 미착수 사실을 밝힌 배너 추가). ② 아카이브 두 개의 상대 링크 깊이 교정 — **2026-08-06 아카이브는 그때 경로를 안 고쳐서 `../features/…` 링크 16개가 이미 깨져 있었다**(`docs/tasks/features/`는 존재하지 않음). 같은 작업이라 함께 고쳤다. ③ `docs/features/README.md`에 `## Backlog` 신설 — **B1**(자율 루프: M1–M5 표 + D1–D5 결정 표), **B2**(Unity 시각화: U1–U4). 표에 Unity 행 추가, 자율 루프 행은 "목업만 존재"로 정정. ④ 새 `current-plan.md` 작성 — Roadmap status(9행, 코드 대조), 게이트 P0 + 후보 5개(각 Why now/Gate/Done when), 그리고 **어느 문서에 무엇을 쓰는지**를 정한 표. ⑤ 아카이브된 계획을 가리키던 살아있는 참조 2건 정정: `app/poc/agent/page.tsx`의 D1–D5 안내 문구(사용자에게 보이는 텍스트), `docs/features/agentic-aa.md`의 Status 줄.

**Result:** `npx tsc --noEmit` 통과. docs 내 상대 링크 검증 MISS 0(아카이브 링크 교정 포함). features/README가 이제 **저장소 전체의 유일한 상태 소스**다 — 예외였던 "current-plan이 추적하는 한 작업"이 사라졌으므로. 후보 5개 중 추천은 **C2(CI/CD)** — 가장 작고, 뒤따르는 모든 작업을 싸게 만들고, verex에 복사할 `deploy-staging.yml`이 이미 있다. **다음 결정은 jay의 P0 한 문장**이고, 그게 정해지면 이 파일은 그 작업 중심으로 다시 쓰인다.

### Workspace Index의 Verex 카드를 rabbit 내부 미러에서 verex GitHub Pages로 전환

> 소스 문서: 없음 — jay와의 대화에서 나온 결정("verex 부분은 https://linked0.github.io/verex/ 로 링크한다"). 작업은 새 병렬 워크스페이스 `/Users/jay/work-agent/rabbit`(브랜치 `claude/docs-parallel`)에서 수행.

**Cause:** jay가 `docs/index.html`의 Verex 카드를 rabbit 안에 복사해 둔 사본이 아니라 verex의 GitHub Pages로 직접 걸라고 지시. 배경에는 미러의 구조적 결함이 있다 — `scripts/sync-verex-docs.mjs`의 헤더 주석이 밝히듯, 미러는 2026-08-01 스냅샷에서 멈춰 verex에 새 문서를 추가해도 rabbit 카드는 옛 내용을 계속 보여줬다.

**Reasoning:** 동기화를 더 자주 돌리는 것도 선택지였지만, 그건 같은 실패 모드를 주기만 줄여 유지하는 방식이다. 링크로 바꾸면 **사본 자체가 없어지므로 낡을 것이 없다.** 확인 결과 verex의 Pages는 이미 살아 있었다 — 소스 `main:/docs`, 오늘 04:07 UTC 빌드 성공. 루트 URL만 404였는데 원인은 Pages 설정이 아니라 `verex/docs/`에 `index.md`가 없어서 Jekyll이 `/`에서 내놓을 게 없었던 것. `features/`·`history/`는 `README.md`가 디렉터리 인덱스 역할을 해 이미 200이었다. 카드 제목의 "Latest Log: 2026-08-18"처럼 **날짜를 박아둔 표기도 함께 제거**했다 — 라이브 인덱스를 가리키는데 제목만 고정 날짜면 미러와 똑같은 종류의 거짓말이 된다.

**Change:** ① `docs/index.html`의 Verex 링크 5개를 `https://linked0.github.io/verex/...`로 교체(카드 4개 + "View All Verex Tasks"), 외부 링크이므로 `target="_blank" rel="noopener noreferrer"` 추가, 배지 `HTML` → `GH PAGES`, card-path 표기를 URL로 변경, "Latest Log: 2026-08-18" → "Logs". Rabbit 카드는 손대지 않음. ② 링크 대상이 404이던 두 곳을 verex 쪽에서 신규 작성 — `verex/docs/index.md`(사이트 랜딩), `verex/docs/tasks/README.md`(tasks 인덱스). 이어서 jay가 "Verex — Logs 는 history 폴더의 파일 목록을 보여줘야 한다"고 요청해 `verex/docs/history/index.md`를 Liquid 자동 생성 목록으로 추가했다. **Rabbit 로그 카드는 jay의 지시로 원래대로 둔다** — `logs.html`은 `pnpm docs:logs`를 손으로 돌려야 갱신되는 스냅샷이라 자동 갱신되는 Verex 쪽과 성격이 달랐고, jay가 현행 유지를 택했다. ③ 변경 이유를 파일 내 주석으로 기록(기존 한국어 주석 관례 유지).

**Result:** 링크 4개는 즉시 200으로 동작(`features/`, `tasks/current-plan.html`, `tasks/jun-19-verex-design.html`, `history/`). 나머지 2개(사이트 루트, `tasks/`)는 새로 만든 인덱스 파일이 **verex `main`에 머지·푸시된 뒤** 동작한다 — Pages가 `main:/docs`만 서빙하기 때문. 이로써 rabbit 안의 Verex 미러 3종(`docs/history/*verex*.md` 24개, `projects/verex/**`, `docs/html/projects/verex/**` 30개 380KB)과 `scripts/sync-verex-docs.mjs`가 모두 죽은 자산이 됐다 — 삭제는 jay 확인 대기. 삭제 시 "All Logs" 카드 수치는 64 → 약 40(rabbit 전용)으로 줄어든다.

### current-plan을 저장소 간 이음새 문서로 전환 — J2 "mandated trader"

> 소스 문서: [docs/tasks/current-plan.md](../tasks/current-plan.md) (이번에 새로 쓴 이음새 계획) · verex 쪽 몫(W1·W6·W7)은 verex 저장소의 `docs/history/2026-08-21-verex-history.md`. 이 저장소의 앞 항목: 같은 날 "current-plan 리셋" 항목(위).

**Cause:** jay가 두 프로젝트에 걸친 시나리오를 제시했다 — **rabbit에서 무인으로 도는 에이전트가 verex 예측시장에서 스스로 판단해 거래하고 정산까지 받는다.** 아침에 비워둔 rabbit의 P0(다음 작업 고르기)의 답이 이것으로 정해졌고, 동시에 "rabbit 계획서가 두 저장소 구현을 담을 수 있느냐"는 앞선 질문의 답도 확정됐다: **A안 — 이음새만 소유하고 저장소별 상세는 링크**.

**Reasoning:** 쓰기 전에 큰 갈림길 네 개를 jay에게 물었고 전부 답을 받았다 — ① 만다트는 **거래가 아니라 자금 조달**을 강제한다 ② 접속은 **REST 먼저, MCP는 래퍼로** ③ **LLM이 확률을 추정하고 결정적 규칙이 집행**한다 ④ 루프는 **해소·상환까지 전부**. ①이 가장 중요했다: ERC-7710 enforcer는 *호출*을 검사하는데 CTF 주문은 *서명*이라, 세션 키가 주문에 서명해도 enforcer를 통과하지 않는다. 자금 조달을 묶으면 범위는 좁아도 **완전히 정직한 산술 주장**이 된다 — 가진 적 없는 돈은 잃을 수 없다. 더 센 버전(EIP-1271 스마트 계정 + 커스텀 검증 컨트랙트)은 O4로 기록만 하고 만들지 않는다.

**Change:** `docs/tasks/current-plan.md`를 **Rabbit ⇄ Verex 이음새 계획**으로 새로 씀 — 시나리오(관찰→추정→결정→체결→감시→기록), 각 한도가 실제로 어디서 강제되는지 그린 아키텍처, 저장소 상태 요약, **구현 매트릭스**(6열 15행: 항목 · rabbit이 만들 것 · verex가 만들 것 · 의존 · 견적), Phase 0–5 빌드 순서, 열린 질문 O1–O6, "이 데모가 증명하지 않는 것". 문서 소유 규칙을 명시: **한 저장소 안에서 끝나는 일은 그 저장소 계획서로.**

**Result:** 두 가지가 나왔고 둘 다 표를 그리기 전엔 안 보였다. **하나 — 두 저장소가 실제로 맞물리는 행은 딱 두 개다**(R-B 주문 서명 ⇄ V-A 주문 수용, R-G 상환 ⇄ V-D 주소 기반 상환). 나머지는 전부 한쪽이 혼자 하는 일이라 P0·V-A~V-C와 R-A가 병렬로 굴러간다 — 예상보다 훨씬 덜 얽혀 있다. **둘 — verex W1이 먼저여야 하는 이유가 바뀌었다.** 뻔한 이유는 "해소 안 된 마켓에선 상환 불가"인데, 진짜 이유는 W1의 fresh seed가 스테이징 거래 행을 **삭제**한다는 것이다. 에이전트가 먼저 거래하면 재시드가 저널이 가리키는 행을 지운다. 가스 비대칭도 확인했다 — 외부 maker는 **거래엔 가스가 안 들고**(오퍼레이터가 `matchOrders` 전송) **상환에만** 든다. **다음 결정은 O1**: rabbit이 verex `packages/sdk`의 주문 서명 코드를 어떻게 얻느냐(퍼블리시 / 복사 / 얇은 재구현). **Phase 2(R-B)가 여기서 막히고**, 나머지는 안 막힌다.

### Workspace 인덱스 Logs 행: "All Logs" → "Rabbit — Logs", 순서 재배치

> 소스 문서: 없음 — jay가 인덱스 페이지 카드 스크린샷을 보고 직접 지시.

**Cause:** jay가 Logs 행의 세 번째 카드("All Logs — 64 entries")를 지목. 이름을 **Rabbit — Logs**로, 순서는 **Rabbit → Verex → Rabbit Latest Log**로.

**Reasoning:** 바로 옆 카드가 이미 "Verex — Logs"인데 이쪽만 "All Logs"라 **스코프가 안 보였다** — 실제로는 rabbit의 `logs.html`을 가리킨다. 이름을 맞추면 앞의 둘이 두 저장소의 로그 색인 **쌍**이 되고 마지막이 오늘로 가는 지름길이 된다는 게 jay가 지시한 순서의 논리다. 제목의 `— N entries`는 뺐다: 손으로 관리하는 숫자였고 **이미 한 번 63에 멈춰 낡은 채 방치**된 적이 있어, 다시 틀릴 자리를 없애는 쪽을 골랐다.

**Change:** `docs/index.html` Logs 행 — 카드 rename + 재배치, 다른 카드들과 맞추려 `HTML` 배지 추가, 이유를 HTML 주석으로 남김. **남겨둔 것:** 같은 페이지 하단 "View All Logs →" 링크는 같은 스코프 흐림이 있지만 지시 범위 밖이라 그대로 뒀다.

**Result:** `<a>` 태그 72/72 균형, `div` 28/27은 이전부터 있던 불균형이라 그대로. 카드 3개 전부 링크 유효.

### PoC 카드 `aqua-shared-liquidity` 를 done 으로

> 소스 문서: 없음 — jay가 카드를 지목해 직접 지시. 카드 원본은 [lib/poc-cards.ts](../../lib/poc-cards.ts)의 `aqua-shared-liquidity`.

**Cause:** jay가 "Shared liquidity — quoted depth vs. the balance behind it" 카드를 done 으로 바꾸라고 지시.

**Reasoning:** 상태 플래그만 뒤집으면 카드가 자기 배지와 모순된다. 이 카탈로그에서 done 은 `oz-relayer` 패턴 — **사고가 완결됐다**는 뜻이지 코드가 돌아간다는 뜻이 아니고, 기존 done 카드들은 ① 정렬 기준이 되는 `date`(완결 선언일)를 갖고 ② `howTo` 가 "무엇을 시작할지"가 아니라 **"무엇을 정리했는지" 한 줄 요약**이다(stake-concentration 이 그 예). 이 카드의 `howTo` 는 "Not yet scoped — start on an anvil fork…" 였다. 그대로 두면 DONE 배지 옆에서 "아직 범위 미정"이라고 말한다 — 이전에 지적해 둔 stake-concentration 의 결함을 하나 더 만드는 셈이라 같이 고쳤다. `howItWorks` 의 측정 설계는 손대지 않았다: done 카드에서 측정 설계는 **미래 계획이 아니라 결과물**이다.

**Change:** `status: "soon"` → `"done"`, `date: "2026-08-21"` 추가, `howTo`/`howToKo` 를 완결 요약으로 재작성(출처 1inch.com/aqua/learn·2026-07-27·13개 체인은 보존). 배열 위치는 **의도적으로 그대로** — soon 이던 시절엔 무날짜라 배열 순서가 곧 렌더 순서였지만 done 은 `date` 로 정렬되므로 이제 배열이 렌더에 영향을 주지 않는다. 그 이유를 카드 주석에 남겨, 다음 사람이 "왜 안 옮겼지"를 다시 묻지 않게 했다.

**Result:** `npx tsc --noEmit` 통과. 상태 분포 done 5→6, soon 41→40. `docs:pocs` 재생성 후 카드가 **done 묶음 맨 앞**으로 이동(날짜 최신) — 렌더 순서 aqua → rwa-multichain → agent → oz-relayer → dvt → stake-concentration. `pocs.html` 은 live 카드를 제외하고 그리므로(`status !== 'live'`) 이게 정상 위치다.

### `aqua-shared-liquidity` 카드에 시장미시구조 분석 추가 — 역선택을 누가 지느냐

> 소스 문서: jay가 대화에서 직접 쓴 설명(오더북 → 메이커/테이커 → 역선택 → 스프레드 4종 → HFT 취소 → Aqua revert → 예측시장 → LMSR vs CLOB). 반영 위치는 [lib/poc-cards.ts](../../lib/poc-cards.ts) `aqua-shared-liquidity` 의 `howItWorks`/`howItWorksKo`.

**Cause:** jay가 `docs/topics/pocs-aqua-shared-liquidity.html` 에 이 설명을 요약해 넣으라고 지시.

**Reasoning:** **그 파일은 손으로 고칠 수 없다** — `scripts/generate-pocs-html.mjs` 가 카드의 `description`·`howTo`·`purpose`·`howItWorks` 로 생성하므로 직접 편집하면 다음 `docs:pocs` 에 지워진다. 그래서 소스인 카드에 넣고 재생성했다. 넣을 필드는 `howItWorks` — `rwa-multichain` 이 이미 "재분석 2026-08-17" 블록을 같은 방식으로 이어 붙인 선례가 있다. 요약하면서 **카드의 기존 논지를 바꾸는 두 줄**을 살렸다: ① Aqua는 애초에 역선택을 풀려던 물건이 아니고(수탁·자본 효율 문제다), 메이커에게는 오히려 **탈출구를 주어 개선**한다 — AMM LP는 거절할 수 없어 LVR을 그대로 맞지만 Aqua LP는 잔고를 빼면 된다. ② 그 보호가 곧 테이커의 문제라, **위험이 사라진 게 아니라 옮겨간** 것이다.

**Change:** `howItWorks`/`howItWorksKo` 에 "Market microstructure, 2026-08-21" 블록 추가 — 스프레드가 왜 존재하는가(역선택), quoted/effective/realized 셋과 그 차이가 곧 정보에 넘어간 돈이라는 것, HFT 취소가 남긴 phantom liquidity, Aqua revert가 그 취소의 온체인 판이되 **실패한 시도의 비용이 0에서 0이 아닌 값으로 옮겨간** 비대칭, 예측시장이 0/1로 끝나 정답이 하나라서 역선택이 가장 심하다는 것, LMSR의 `b`는 역선택을 없애는 게 아니라 **상한을 씌우는** 것, 그래서 LMSR/CLOB은 기술 취향이 아니라 **위험 부담 주체의 선택**이라는 것, 그리고 Verex가 CLOB 안에 LMSR 호가 중심을 둔 자리(`lmsr.ts`·`mm.ts`).

**Result:** `tsc --noEmit` 통과, 토픽 페이지 재생성(태그 균형 p 12/12, div·article 2/2). **카드의 작업 우선순위가 뒤집혔다** — 새로 들어온 미확인 질문 "**revert가 잦은 LP에게 페널티가 있는가**"가 기존 anvil 체결률 실험보다 **먼저** 와야 한다고 카드 본문에 명시했다. 없으면 넓게 걸고 빼는 전략이 항상 우세해 호가를 정직하게 유지할 유인이 없고, 있으면 그게 이 설계의 진짜 방어선이라 나머지는 장식이다. 공개 문서에 없는 항목이라 PoC로 확인할 값어치가 가장 크다. **따로 발견한 것:** 토픽 페이지는 `escapeHtml` 만 거쳐 `<p>` 하나에 들어가므로 카드 본문의 `**강조**`와 `\n\n` 이 **문자 그대로 렌더된다** — 이 카드만이 아니라 전 카드 공통(rwa-multichain 만 18곳). 생성기를 고칠 값어치가 있지만 이번 지시 범위 밖이라 두었다.

### PoC 상세 페이지 생성기가 블록 마크다운을 렌더하게 + aqua 카드를 그 형식으로 재구성

> 소스 문서: 없음 — jay가 렌더된 페이지 스크린샷을 보고 "이런 구조 없는 형식은 읽을 수가 없다"고 지적, 이어서 손으로 쓴 [pocs-dvt.html](../topics/pocs-dvt.html)을 기준으로 제시. 대상은 [scripts/generate-pocs-html.mjs](../../scripts/generate-pocs-html.mjs)와 [lib/poc-cards.ts](../../lib/poc-cards.ts).

**Cause:** 카드 상세 페이지가 `escapeHtml`만 거쳐 `<p>` 하나에 통째로 들어가고 있었다. 그래서 카드 본문의 `**강조**`가 별표로 그대로 찍히고 문단 구분이 전부 뭉개져, 1,700자짜리 문단 덩어리로 보였다.

**Reasoning:** jay가 지목한 `pocs-dvt.html`은 **손으로 쓴 페이지**다 — 카드에 `docsHref`가 있으면 생성기가 덮어쓰지 않는다(`rwa-multichain`도 같다). 제목 40개·표 16개·목록 12개로 실제로 읽힌다. 반면 생성 페이지 47장은 평평한 텍스트 필드 넷으로만 만들어져 **구조가 생길 수가 없었다.** 그래서 고칠 곳은 카드가 아니라 생성기다. **marked를 그대로 쓰지 않은 이유는 돌려보고 정했다** — CommonMark의 delimiter flanking 규칙 때문에 `**"따옴표 구절"**뒤에 조사가 바로 붙으면 strong으로 닫히지 않는다(닫는 `**`가 punctuation 뒤 + 글자 앞이라 양쪽 flanking이 되어 닫을 자격을 잃는다). 이스케이프 여부와 무관하고, 이 저장소 한국어 본문에 흔한 문형이라 카드 7장에서 별표가 남았다. 처음엔 CJK 조사 문제로 의심했지만 **테스트로 반증됐고 원인은 따옴표였다.** 그래서 `**...**`만 먼저 자리표시자로 빼고 블록 구조만 marked에 맡긴 뒤 복원한다.

**Change:** ① 생성기에 `mdRender()` 추가 — 이스케이프 → 강조 토큰화 → marked(표·목록·제목·코드펜스) → `<strong>` 복원. `md`/`mdInline`으로 `description`·`howTo`·`purpose`·`howItWorks`(+Ko)에 적용. ② `aqua-shared-liquidity` 카드 네 필드를 그 형식으로 재구성 — h3 24개, 표 14개, 목록 6개. ③ 손으로 쓴 `pocs-rwa-multichain.html`에 남아 있던 볼드 17쌍을 `<strong>`으로.

**Result:** 생성 페이지에서 별표 사라짐(남은 둘은 `2**16`·`**schema`로 파이썬 코드 스니펫이라 **정상**). aqua 페이지 최장 문단 **1,668자 → 476자**, 중앙값 107자, 실제 `<table>` 14개. dvt와 같은 층위의 구조가 됐고, **앞으로는 카드가 `docsHref`로 도망칠 이유가 없다.** 참고로 jay가 보던 페이지는 `~/work-agent/rabbit` 클론(브랜치 `agent-parked`, `a4eb103`)이라 이쪽 변경이 아직 반영돼 있지 않다.

### PoC 카드 둘: AML 카드에 FRC 2026 발언 덧붙임 + 수협×인피닛블록 카드 신설

> 소스 문서: 없음 — jay가 기사 두 건을 붙여넣고 지시. ① 디지털데일리 2026-08-20 「송근섭 국제자금세탁방지전문가협회 대표…AI로 AML 대응 고도화해야」 ② 연합뉴스 2026-08-20 「수협은행, 인피닛블록 출자로 2대주주」.

**Cause:** jay가 기사 둘을 PoC 항목으로 요청. 두 번째는 **"가능한 시너지와 상상해 본 서비스"**를 함께 설계해 달라는 주문이었다.

**Reasoning:** 첫 건은 **새 카드를 만들지 않았다** — `aml-compliance` 카드가 이미 같은 층위("암호학이 멈추는 자리")를 다루고, jay의 기존 규칙("관련 카드가 있으면 거기에 덧붙여라")에 해당한다. 발언이 준 것은 새 주제가 아니라 **이 카드가 재야 할 측정 대상**이었다: "STR부터 PoC 하라"와 "전문가를 우회하지 말라"가 **같은 업무를 반대 방향에서 가리킨다** — STR 트리아지가 바로 모델이 분석가의 1차 판단을 대체하는 자리이기 때문이다. 두 번째는 남의 글의 빈칸을 찾는 형태가 아니라 `agentic-intent-veto`처럼 **만들 물건을 설계하는** 카드로 썼다.

**Change:** ① `aml-compliance`의 `purpose`/`howItWorks`에 블록 추가 — 강화와 형식적 결재를 가르는 **관찰 가능한 신호 표**(번복률·번복 정확도·건당 시간·미탐지 상향보고), "완벽한 거버넌스를 기다리지 말라 ≠ 감사 추적 없이 시작하라"는 정정, 민관 파트너십 주장을 기존 2열 지도의 **세 번째 열**(컨소시엄이 질 수 있는 의무)로 배치. ② 새 카드 `fisheries-receivable-rail` — "수탁은 애초에 어려운 쪽이 아니었다", `status: "soon"`, `aml-compliance` 바로 앞.

**Result:** 카드 50장 렌더(49→50), 키 53개 중복 0, `tsc --noEmit` 통과. 새 카드에서 나온 판단 둘: **14.95%는 사업 숫자가 아니라 지배구조 숫자다** — 은행법상 자회사 아닌 회사 지분 15% 한도 바로 아래라, 연결 밖에 머물며 영향력만 산 것으로 읽힌다(조문 확인 필요로 표시). 결과적으로 **은행이 수탁사를 지시할 수 없어** 서비스 모양이 기술보다 지배구조에 좌우된다. 그리고 **수탁은 차별점이 아니다** — 라이선스와 재무제표는 다른 은행도 산다. 우위는 수협만 가진 물리적 공급망(위판장·어업인·어선 담보)이라, 상상한 서비스는 **낙찰 시점 위판대금 청구권 토큰화**다. 다만 결론은 이 카탈로그가 계속 도달하는 자리와 같다 — **진짜 의존성은 체인이 아니라 이중담보를 답해 줄 등록부**이고, 코드보다 먼저 물어야 할 숫자는 "오늘 낙찰과 정산 사이 간격, 그리고 어업인이 그것을 메우는 값"이다.

### PoC 카드 신설: DKG — "의식은 끝나지만 위원회는 남는다"

> 소스 문서: 없음 — jay가 "DKG를 PoC 항목으로 추가"라고만 지시. 인접 카드는 [dvt](../topics/pocs-dvt.html), `encrypted-mempool`, `third-party-blast-radius`, `fisheries-receivable-rail`.

**Cause:** jay가 DKG를 PoC 항목으로 요청. 약어만 주어져 **분산 키 생성(distributed key generation)**으로 읽었다 — 이 카탈로그에 이미 DVT 검증인 키, 암호화 멤풀의 keyper 위원회, MPC 수탁 카드가 있어 맥락이 한 방향을 강하게 가리킨다. (OriginTrail의 Decentralized Knowledge Graph일 가능성은 남아 있으므로 답변에서 해석을 밝혀 두었다.)

**Reasoning:** `dvt` 카드에 덧붙이지 않았다 — 그쪽은 `done`이고 `docsHref`로 **손으로 쓰는 페이지**라 append가 어색하고, DKG는 DVT 한 곳이 아니라 keyper 위원회·MPC 수탁·랜덤성 비콘까지 걸치는 더 넓은 원시 기능이다. 카드의 각을 잡을 때 "t-of-n이라 안전하다"를 반복하는 것은 값어치가 없다고 봤다 — 모든 글이 이미 그 말을 하고, 그건 참이다. **아무도 말하지 않는 쪽은 의식이 끝난 다음이다.** DKG는 *사건*으로 서술되지만 실제 배포된 것은 전부 **위원회**이고, 위원회는 바뀐다(운영자 이탈·합류·지분 분실). 각각에 두 번째 의식인 **리셰어링**이 필요하고 그것은 첫 번째만큼 신뢰돼야 하는데, 문서에서도 배포에서도 자주 빠진다.

**Change:** 새 카드 `dkg-resharing`, `status: "soon"`, `third-party-blast-radius` 바로 앞. 내용은 새 블록 마크다운 형식으로 — DKG 산출물 표(개인키는 **아무도** 갖지 않음 / 공개키 / 지분 / **트랜스크립트**), 구성원 변경 세 사건 표, n=7·t=5로 **암호학이 아니라 운영을 재는** 측정 5단계와 그 결과 표 서식, "n이 n이기를 멈추는 지점", 그리고 리셰어링이 불가능할 때 **다른 카드 셋에서 각각 무엇이 깨지는지** 표.

**Result:** 카드 51장 렌더(50→51), 키 54개 중복 0, `tsc --noEmit` 통과. 페이지 구조 h3 8·표 6·목록 2. **카드의 축이 된 판단:** 리셰어링은 **그룹 공개키를 보존할 수 있고**, 공개키야말로 대개 다른 곳에 못 박혀 있는 부분이다 — 비콘 체인의 검증인 공개키, 고객이 저장한 입금 주소, 이미 브로드캐스트된 봉투 안의 key ID. 그래서 **리셰어링이 되면 운영자 교체는 운영 작업이고, 안 되면 "그 키를 참조한 모든 것의 이전"이 된다.** 그리고 날카로운 질문 하나가 따라 나왔다 — **복구와 절도가 구별되는가.** 지분을 잃은 구성원을 위해 t명이 복원해 주는 절차는 구조적으로 공모한 t명이 아무에게나 넘기는 절차와 같다. 둘을 가르는 것은 암호학 바깥의 정책이고, 이는 `aml-compliance` 카드의 경계와 정확히 같다. **가장 먼저 확인할 것:** 운영 중 실제로 리셰어링을 해 본 배포가 있는지 — 문서상 가능하다고만 적힌 것 말고.

### Math 39번(랜덤워크·열확산 방정식)을 done → planned 로 되돌림

> 소스 문서: [docs/knowledge/math-50-curriculum.md](../knowledge/math-50-curriculum.md) — Math 섹션의 유일한 원본. 생성물은 `docs/math.html`과 `docs/index.html`의 `MATH:BEGIN/END` 구간.

**Cause:** jay가 랜덤워크·열확산 방정식 항목을 planned 로 바꿔 달라고 요청. 대시보드에서 DONE 배지를 달고 있었다.

**Reasoning:** 이 카드는 손으로 고칠 수 없다 — `docs/index.html`의 `MATH:BEGIN/END` 사이는 `scripts/generate-curriculum-html.mjs`가 다시 쓰는 구간이고, 완료 여부는 커리큘럼 마크다운 줄 끝의 **`✅` 하나**로만 표현된다(`done = text.endsWith('✅')`). 그래서 원본에서 `✅`만 떼고 생성기를 다시 돌렸다. 노트 링크는 그대로 뒀다 — 글은 이미 존재하고, 바뀐 것은 "학습 완료" 표시뿐이다.

**Change:** `docs/knowledge/math-50-curriculum.md` 39번 줄의 `✅` 제거 후 `node scripts/generate-curriculum-html.mjs` 실행 → `docs/math.html`, `docs/index.html` 재생성.

**Result:** Math 완료 수 4 → **3 / 52**. 항목 39는 TODO(회색 점)로 38번과 같은 상태가 됐다. **부수 효과: 대시보드 Math 섹션에서 이 카드가 사라졌다** — 색인은 `[...done, ...todo].slice(0, 6)`이라 done 3개 + todo 상위 3개(귀납법·그래프 기초·비둘기집)만 남고 39번은 순서상 그 아래로 밀린다. 전체 목록 `math.html`에는 그대로 있다. 카드가 색인에 계속 보여야 한다면 정렬 규칙 쪽을 바꿔야 하고, 그건 별개 결정이다.
