# 2026-08-21 — nostra-server 작업 이력

> 소스 문서: 없음 — jay와의 대화에서 나온 docs 폴더 구조 결정("하위 폴더마다 `images/` vs 루트 `docs/images/` 하나")을 verex·rabbit·nostra-server 세 저장소에 일괄 적용한 작업. 결정의 근거와 전체 맥락은 verex 저장소의 `docs/history/2026-08-21-verex-history.md`에 기록. 이 저장소의 `docs/history/`는 이번에 처음 생성됐다.

### docs 이미지를 루트 `docs/images/` 한 곳으로 통합 (주제별 하위 폴더)

**Cause:** jay가 세 저장소의 docs 이미지 배치를 하나의 규칙으로 통일하라고 지시. 코드와 무관하고 기능에 영향이 없으므로 커밋·머지까지 위임받음.

**Reasoning:** 세 저장소 중 이 저장소가 **주제별 하위 폴더의 효용이 실제로 드러나는 유일한 사례**다 — 이미지가 31장이라 평평하게 두면 잡동사니가 된다. 기존에는 `docs/task/images/`(28장)와 `docs/task/dev-logs/images/`(3장)로 나뉘어 있었는데, 이 분할선은 **주제가 아니라 "어느 문서가 처음 썼는가"**를 따른 것이라 검색에 도움이 되지 않았다. 실제로 `../images/`(design·dev-logs에서 상위 참조)와 `./images/`(dev-logs 자체 폴더)가 뒤섞여 같은 표기가 서로 다른 폴더를 가리키고 있었다. 이동 전 참조 수를 세어 보니 **31장 중 14장이 어디에서도 참조되지 않는 고아**였다 — 루트 한 곳으로 모으면 이런 점검이 명령 한 줄로 끝난다는 근거 ③이 그대로 확인된 셈. 고아 파일은 **삭제하지 않고** 주제 폴더로 함께 옮겼다(삭제는 지시받은 범위 밖).

**Change:** 31장을 `docs/images/` 아래 주제 폴더 7개로 이동(`git mv`) — `design/`(6, 바이너리 마켓·차트·진행 카드), `detail-page/`(6), `withdrawal/`(6), `features/`(4, 입금·거래소 연결), `trading/`(3), `rewards/`(3), `dev-logs/`(3, 날짜 스탬프 스크린샷). 참조 17건을 전부 `../../images/<주제>/<파일>` 형태로 갱신 — `![...]()` 문법과 `<img src="...">` 태그 양쪽 모두. 대상 문서는 `task/design/binary-markets.md`, `task/design/charts-and-progress.md`, `task/dev-logs/`의 5개 파일. 빈 `docs/task/images/`·`docs/task/dev-logs/images/` 제거. **코드 변경 없음.**

**Result:** 이미지 참조 17건 전부 실제 파일로 해석됨(스크립트 검증, MISS 0). `ProgressCard&Confetti.png`처럼 `&`가 든 파일명도 경로만 바꾸고 이름은 유지(리네임은 지시 범위 밖 — 다만 URL 안전성 측면에서 나중에 정리할 후보). **남은 것:** 고아 이미지 14장(`features/` 4, `withdrawal/` 4, `trading/` 3, `rewards/` 3)을 살릴지 지울지는 jay 판단.
