# 2026-09-10 — rabbit 작업 이력

> 소스 문서: [docs/features/README.md](../features/README.md) (기능 설계 허브) ·
> [jayverse-number.md](../features/jayverse-number.md) · [jayverse-wallet.md](../features/jayverse-wallet.md)
> 브랜치: `claude/readme-services`. 오늘 rabbit·jayverse-number·jayverse-auditor 세 저장소가
> `main` 에 병합·푸시됐고 프로덕션(www.jaylabs.xyz)이 재배포됐다.

### README 허브 재편 — #9 Number 신설, Base App 8번, Auditor 는 Completed 로

**Cause:** jay: "완성된 서비스 문서는 Per-service 아래에 두고 Authority Auditor 를 거기로 옮겨라.
Base App 을 8번, 새 9번은 Portfolio 용 Math & Investment 로."

**Reasoning:** Auditor 는 이제 실제로 빌드돼 `main` 에 병합된 유일한 서비스라, "초안(drafting)"
목록에 두면 무엇이 도면이고 무엇이 도는 물건인지 구분이 흐려진다. 그래서 초안 표에서 빼
별도 "Completed — built" 섹션으로 분리했다. Portfolio 는 rabbit 을 떠나 독립 프로젝트가 되므로
committed 서비스 목록에 9번으로 편입.

**Change:** `docs/features/README.md` — 설계 표에서 Auditor 제거→Completed 섹션 신설, Base App
9→8, 신규 9번 "Math & Investment (Number)". 실행 표·포트 노트도 같은 번호로 갱신(Number :3090).
새 설계 문서 `jayverse-number.md` 추가. docs HTML 미러 재생성.

**Result:** 허브가 "초안 vs 빌드됨"을 한눈에 구분. tsc 클린, 프로덕션 반영.

### 텔레그램 알림 정책 반전 — 홈 제외 모든 상단 메뉴 + Jay Chat 시작

**Cause:** jay: "상단 메뉴 페이지(홈 제외)에 진입할 때와 Jay Chat 시작 시 텔레그램을 보내라."

**Reasoning:** 2026-08-05 결정은 정반대였다 — "홈 방문 + 챗 시작" 딱 둘만, 페이지마다 붙이면
소음이라는 이유였다. 이번엔 그 판단을 뒤집는다: 홈은 누구나 처음 닿는 곳이라 정보량이 가장 낮은
신호이고, 그보다 깊은(projects·데모·auditor) 진입이 "의도를 갖고 왔다"는 진짜 신호다. 기존
서버 컴포넌트 패턴(headers()→notifyPageView)을 유지해 in-memory 디바운스를 살렸다 —
미들웨어(edge)로 옮기면 디바운스 Map 이 불안정해진다.

**Change:** 홈의 notifyPageView 제거, 공용 서버 컴포넌트 `app/NotifyPageView.tsx` 신설,
projects·game·live·live/aa·live/agent/console·live/auditor 6개 페이지에 삽입.
`lib/visitor-notify.ts` 주석을 새 정책으로 갱신.

**Result:** 6개 페이지가 `ƒ (Dynamic)` 로 전환(방문마다 핑), tsc·build 통과. jay 확인:
상단 메뉴 중 관리자 전용은 Portfolio 뿐이라 나머지 5개는 실제 방문자에게도 핑이 뜬다.

### Portfolio 메뉴 제거 — number.jaylabs.xyz 로 분리 시작

**Cause:** jay: "Portfolio 를 rabbit 에서 빼고 독립 프로젝트로 만든다(관리자 전용,
number.jaylabs.xyz). 메뉴 지우고 Cloud Run env 도 바꿔라."

**Reasoning:** 코드(라우트)까지 지금 다 빼면 number 가 아직 스캐폴드뿐이라 Portfolio 에 접근
불가 공백이 생긴다. 그래서 "메뉴 항목 먼저, 코드는 number 가 호스팅한 뒤"로 나눴다 —
설계 문서(jayverse-number.md)에 이 순서를 명시.

**Change:** `app/Nav.tsx` 의 PORTFOLIO 항목 제거(+근거 주석). `/portfolio`·`/invest`·
`/dashboard`·`/simulate` 라우트와 코드는 이전 전까지 보존.

**Result:** 프로덕션에서 메뉴 사라짐, `/portfolio` 는 302→/login(관리자 전용, 라우트 유지) —
의도대로. hot-demo 링크(AA·Settlement Agent·Auditor)는 `deploy.sh` 가 `.env` 의 ALLOW_* 를
Cloud Run env 로 자동 전달해 재배포로 라이브(`/live/auditor` 200 확인).

### 인덱스 Current Projects — Memo 카드 2번째로, 이름 "Memo" 로 축약

**Cause:** jay: "Rabbit — Memo 카드를 두 번째로 올리고 이름을 Memo 로 바꿔라." (소스 문서 없음 —
인덱스 UI 직접 지시.)

**Change:** `docs/index.html`(손편집 파일, 생성물 아님) Current Projects 섹션에서 Memo 카드
블록을 5번째→2번째(All PoCs 바로 뒤)로 이동, 카드 제목 `Rabbit — Memo`→`Memo`. 링크·색
(`#db2777`)·경로(docs/memo.md)는 그대로.

**Result:** 진행 중 프로젝트 줄 맨 앞쪽에서 현재 작업 런북 진입점이 바로 보인다.

### PoC `base-app-mini-app` 완료 처리 — "Base App: 미니앱이 사는 것과 빌리는 것"

**Cause:** jay: "#47 … make this done." Base App 미니앱을 만들지/미니앱 환경을 짓지 논의한
끝에 "안 만든다"로 결론 — 소득은 아키텍처 이해뿐이라 이미 있던 카드(`base-app-mini-app`,
status `soon`+important)를 done 으로 확정. (소스 문서 없음 — 논의 기반.)

**Reasoning:** 처음엔 신규 중복 카드(`base-app-mini-app-buys-and-rents`)를 만들었다가, 같은
제목의 카드가 이미 #47 로 존재함을 확인하고 되돌렸다(`git checkout --`). "make it done" 은
새 카드가 아니라 기존 #47 을 완료로 바꾸라는 뜻이었다.

**Change:** `lib/poc-cards.ts` 의 `base-app-mini-app` — `status: "soon"→"done"`, `doneAt:
"2026-09-10"` 추가(`date` 는 안 붙임 → done 블록 끝으로 가라앉아 번호 요동 최소화). 재생성.

**Result:** #47(important)→#45(done, RECENTLY DONE 하늘색 점). 경계에서 3장만 이동
(Base App 47→45, Censorship 45→46, MCP 46→47), 나머지 전부 고정. tsc 클린. 커밋만, 푸시 대기.

### PoC 신규 6장 추가 — 2026-09-10 Trend & Tech 다이제스트에서

**Cause:** jay: "add these new items" + "make some important if worth." 오늘자 트렌드
다이제스트(사실/각도/잴것/주의 포맷)의 후보들을 카드로. (소스 문서 없음 — 붙여넣은 다이제스트.)

**Reasoning:** 먼저 중복 트리아지. 컨센시스/메타마스크 분리는 기존
`distribution-splits-from-infrastructure` 가 이미 커버 → **추가 안 함**(중복 방지, 직전 base-app
중복 교훈). invariant·robotics 계열은 기존 카드와 각도가 달라 신규로. 나머지 넷은 기존 카드 없음.
전이 가능한(허브) 둘만 important 로.

**Change:** `lib/poc-cards.ts` 배열 맨 앞에 6장 추가(전부 `updated: 2026-09-10`, `status: soon`):
- **important**: `op-return-is-a-shared-state-channel`(신뢰 없는 공유 상태, 강제≠합의; 598.5 BTC),
  `an-invariant-is-a-stop-not-an-alarm`(오탐 비용 비대칭; 로그만이면 장식; 감시자 격리).
- **new/yellow**: `which-etf-window-not-the-size`(economics), `services-ppi-is-the-bridge-to-core`
  (economics), `lerobot-the-format-outlives-the-framework`(future), `tenderly-lower-the-cost-to-start-watching`.
상호 참조: liquid-issuance-not-authorization, foundry-invariant-reachability, robotics-entry-decision,
Verex 정산.

**Result:** 사이드바 234→240. important #46/#47, new 은 각 섹션 내(Tenderly #64, ETF #132,
PPI #133, LeRobot #174). tsc 클린, 6개 상세 페이지 생성, 표·제목 렌더 확인(`\n` 은 copy-json 만).
커밋만, 푸시 대기.

### PoC `layerzero-default-is-a-choice` 완료 처리 — 그리고 세 커밋 푸시

**Cause:** jay: "make 50 … done and push it." #50 LayerZero 카드(기본 검증자 = 아무도
적어두지 않은 신뢰 가정)를 done 으로. Atlas 구현 논의 흐름에서 LayerZero 축을 정리 완료로 표시.

**Reasoning:** 또 트리아지 먼저 — 같은 제목 카드가 이미 #50(`layerzero-default-is-a-choice`,
soon+important)로 존재. "make 50 done" 은 신규가 아니라 기존 #50 을 done 으로(base-app 과 같은 패턴).

**Change:** `lib/poc-cards.ts` 의 `layerzero-default-is-a-choice` — `status: "soon"→"done"`,
`doneAt: "2026-09-10"`. 재생성(7장만 변경).

**Result:** #50(important)→#46(done, RECENTLY DONE 하늘색). tsc 클린. 이 커밋 포함 세 개
(base-app done, 신규 6장, layerzero done)를 `HEAD:main` 으로 푸시하고 로컬 main 도 ff.
