# 2026-08-14 — rabbit 작업 이력

> 소스 문서: 없음 — jay가 대화에 직접 붙여넣은 "오늘의 로보틱스·AI 항목 2"(LeRobot + SO-101) 브리핑에서 나온 작업. 전날의 로보틱스 트랙 첫 항목은 [2026-08-13 이력의 "PoCs에 로보틱스/AI 트랙 첫 항목(NVIDIA Isaac GR00T) 추가"](2026-08-13-rabbit-history.md) 참고.

### PoC 카드 추가: LeRobot + SO-101 로봇팔 (로보틱스 트랙 2번째 항목)

**Cause:** jay가 데일리 브리핑 형식으로 "Hugging Face LeRobot 라이브러리 + SO-101 6DOF 로봇팔($100~130)" 항목을 PoCs에 추가하고 main에 반영해 달라고 요청.
**Reasoning:** 전날 추가한 `isaac-groot`(피지컬 AI의 "지도")와 명백히 이어지지만 별도 카드로 만들었다 — GR00T 카드는 클라우드 GPU에서 파운데이션 모델을 돌리는 단계별 계획이고, 이번 건은 그 스택의 **최소 스케일 재현**(노트북 + $100 하드웨어에서 모방학습 루프 한 바퀴)이라 검증 대상이 다르다. 카드를 "라이브러리·하드웨어 소개"가 아니라 해봐야 답이 나오는 질문 둘로 잡았다: ① 데이터셋 포맷이 표준화된 뒤 "데이터셋 로드 → 학습된 정책" 사이가 코드 몇 줄인가, ② 로봇 에피소드(관측 이미지 + 관절 상태 + 행동)가 LLM 텍스트 토큰 데이터셋과 무엇이 같고 다른가. 브리핑의 액션 아이템(구매 판단 보류, 시뮬레이션 먼저)은 그대로 `howTo`의 "시뮬레이션 우선, 하드웨어 나중" 순서로 반영. 신규 항목이라 `status:"soon"`, `date`·`href` 없음 — Planned 기본값 규칙.
**Change:** `lib/poc-cards.ts`에 `lerobot-so101` 카드 추가(`sub-2bit-local-llm` 뒤, 참조 전용 블록 앞). 출처 URL은 기존 관례대로 `howItWorks`/`howTo` 끝에 평문("Source:"/"출처:")으로 첨부(github.com/huggingface/lerobot · huggingface.co/docs/lerobot/so101). `pnpm docs:pocs`로 `docs/pocs.html`·`docs/topics/pocs-*.html` 재생성 — `docs/topics/pocs-lerobot-so101.html` 신규 생성, 카드 수 32→33.
**Result:** `npx tsc --noEmit` 통과(exit 0). 생성 HTML 태그 짝·로컬 링크 전수 확인(누락 0건). 목록에서 PLANNED 8번으로 노출. `docs/index.html`(상위 6개 카드 섹션)은 변경 없음.

### PoC 카드 상태 변경: "Stake concentration risk" → done

**Cause:** jay가 `stake-concentration` 카드를 done으로 올려 달라고 요청. 배경은 대화에서 정리한 2026-08-12 솔라나 라우팅 장애 — Teraswitch(AS20326)의 BGP 오설정으로 밸리데이터 약 90개가 33분간 오프라인, 스테이킹 28.83%가 delinquent가 되어 최종성 정지선(33.34%)의 86%까지 도달한 건.

**Reasoning:** 카드가 원래 계획한 "측정 파이프라인"(RPC → 엔드포인트 → ASN 매핑 → 허핀달 지수)은 아직 구현하지 않았지만, 이 항목이 답하려던 **개념적 질문**은 종결됐다고 판단 — *독립성의 진짜 단위는 밸리데이터 수가 아니라 ASN이다*. 즉 `oz-relayer` 카드와 같은 성격의 완결(상시 구동 데모가 아니라 완결된 검토)이라 같은 패턴을 따랐다: `// done (jay, …)` 주석 + `status` + `date`. 프로젝트 규칙(`.claude/CLAUDE.md`)대로 `date`를 함께 넣어야 done 카드 중 최신으로 정렬되므로 `2026-08-14`(KST 확인) 지정. `howTo`가 "아직 범위 미정"으로 남아 있으면 done 상태와 모순이라 완료형 한 줄로 교체.

**Change:** `lib/poc-cards.ts`의 `stake-concentration` 카드 — `status: "soon"` → `"done"`, `date: "2026-08-14"` 추가, done 사유 주석 추가, `howTo`/`howToKo`를 "Not yet scoped …" → "Mapping the correlated failure surface under a validator set …"로 교체. `pnpm docs:pocs`로 재생성.

**Result:** `npx tsc --noEmit` 통과(exit 0). 카드가 PLANNED 6번 → **DONE 1번**으로 이동(정렬 규칙대로 date 기준 최신), 페이저 링크도 자동 재연결. 생성 HTML 로컬 링크 누락 0건. `docs/index.html`의 div 짝 불일치(28/27)는 HEAD에도 동일하게 존재하는 **기존 이슈**로, 이번 변경과 무관. **남은 것:** `howItWorks`/`purpose` 본문이 여전히 "에세이가 아니라 측정으로 계획했습니다"로 시작해 done 상태와 어긋난다 — 문안은 jay 판단이 필요해 이번엔 손대지 않음.

### Stake concentration 카드 위치 정정: 1번 → 4번 (date 필드 제거)

**Cause:** 위 작업 직후 jay가 "1번이 아니라 4번으로 해달라"고 요청. done 묶음의 헤드라인으로 올리지 않겠다는 판단.

**Reasoning:** 위치는 `sortDemoCards()`가 `status` → `date` 내림차순으로만 결정하므로, 배열 순서를 손으로 바꿔도 효과가 없다. 4번(done 4장 중 마지막)에 두려면 `date`가 `dvt`의 `2026-08-05`보다 오래돼야 하는데, 실제 작업일은 08-12~08-14이라 **그보다 이른 날짜는 전부 지어낸 값**이 된다. 대신 [`lib/demo-cards.ts:53-55`](../../lib/demo-cards.ts)의 규칙을 이용했다 — *date가 있는 카드가 date 없는 카드보다 앞에 온다.* 즉 `date`를 비우면 날짜를 조작하지 않고도 done 묶음의 끝으로 내려간다. 프로젝트 규칙의 "done으로 바꿀 때 date를 채워라"는 **새 done 카드를 맨 위로 띄우기 위한** 조항이므로, 맨 위에 두지 않겠다는 이번 요청에서는 date를 비우는 것이 규칙의 의도와 어긋나지 않는다고 판단. 그 판단 근거를 카드 주석에 남겨 다음 편집자가 "규칙 위반"으로 오해하지 않게 했다.

**Change:** `lib/poc-cards.ts`의 `stake-concentration`에서 `date: "2026-08-14"` 줄 삭제, 삭제 이유를 주석으로 명시. `pnpm docs:pocs` 재생성.

**Result:** `npx tsc --noEmit` 통과. 순서가 `agent`(1) · `oz-relayer`(2) · `dvt`(3) · `stake-concentration`(**4**) · `dsrv-portal`(5)로 확정. 페이저도 "← 3. DVT / 5. Institutional custody →"로 재연결. 로컬 링크 누락 0건. **부수 발견:** 이번 재생성에서 `pocs-oz-relayer.html`·`pocs-stake-concentration.html`의 이전-글 링크만 `../topics/pocs-*.html` 형태로 나왔다(다른 파일은 모두 같은 디렉터리 상대경로). 경로는 정상 해석되어 깨지지 않지만 생성 스크립트의 일관성 문제로 보이며, `scripts/generate-pocs-html.mjs` 수정이 필요해 이번 범위에서는 제외.
