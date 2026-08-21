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
