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
