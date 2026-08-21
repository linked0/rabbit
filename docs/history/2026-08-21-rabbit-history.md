# 2026-08-21 — rabbit 작업 이력

> 소스 문서: 없음 — jay와의 대화에서 나온 docs 폴더 구조 결정("하위 폴더마다 `images/` vs 루트 `docs/images/` 하나")을 verex·rabbit·nostra-server 세 저장소에 일괄 적용한 작업. 결정의 근거와 전체 맥락은 verex 저장소의 `docs/history/2026-08-21-verex-history.md`에 기록. 전날 항목은 [2026-08-19-rabbit-history.md](2026-08-19-rabbit-history.md).

### docs 이미지를 루트 `docs/images/` 한 곳으로 통합 (주제별 하위 폴더)

**Cause:** jay가 세 저장소의 docs 이미지 배치를 하나의 규칙으로 통일하라고 지시. 코드와 무관하고 기능에 영향이 없으므로 커밋·머지까지 위임받음.

**Reasoning:** 루트 한 곳으로 모으는 근거는 ① 폴더를 넘나드는 재사용, ② 문서가 폴더 사이를 이동해도 `../images/`로 깊이가 일정, ③ 고아 파일 탐지 용이 — 세 가지(상세는 verex 항목). rabbit에서는 **두 곳을 예외로 남겼다**: `docs/archive/`는 `index.html` + `sections/*.html` + `images/`가 한 덩어리인 **자기완결적 HTML 스냅샷**이고, 그 안의 `profile.jpg`는 아카이브 자신의 HTML이 `../images/profile.jpg`로 참조한다 — 밖으로 빼면 아카이브가 깨진다. `docs/zsub/`는 `zshrc`·`karabiner.json`·`gitconfig`가 모인 **개인 설정 덤프**이지 문서가 아니라, 그 안의 `hanamichi.png`도 그대로 뒀다. "통째로 이동·삭제되는 폴더는 자기 이미지를 갖는다"는 예외 규칙에 해당.

**Change:** 이미지 3장 이동(`git mv`) — `tasks/images/investment-basic-ui.png` → `images/ui/`, `tasks/images/japanese.png` → `images/reference/`, `tasks/login-server-error.png`(폴더에 들어가 있지도 않았음) → `images/issues/`. 참조 갱신 6건: `jun-19-rabbit.md`, `jul-01-rabbit-design.md`, `jul-02-rabbit-design.md`의 이미지 문법과, `jun-19-rabbit-design.md`의 소제목 안 링크·`Jun-16-tasks.md`/`Jun-16-plan.md`의 인라인 코드 경로까지. 빈 `docs/tasks/images/` 제거. **코드 변경 없음.**

**Result:** docs 내 상대 경로 이미지 링크 전부 해석됨(스크립트 검증, MISS 0). 저장소 **최상위** `archive/`(docs 밖)와 `docs/archive/`, `docs/zsub/`는 손대지 않음. **참고로 발견한 것:** `docs/history/`에 `2026-08-18-verex-history.md`가 섞여 있다 — 다른 저장소 이름의 이력 파일이라 정리 대상으로 보이나, 이번 작업 범위가 아니라 그대로 뒀다.
