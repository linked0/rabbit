# 2026-08-14 — rabbit 작업 이력

> 소스 문서: 없음 — jay가 대화에 직접 붙여넣은 "오늘의 로보틱스·AI 항목 2"(LeRobot + SO-101) 브리핑에서 나온 작업. 전날의 로보틱스 트랙 첫 항목은 [2026-08-13 이력의 "PoCs에 로보틱스/AI 트랙 첫 항목(NVIDIA Isaac GR00T) 추가"](2026-08-13-rabbit-history.md) 참고.

### PoC 카드 추가: LeRobot + SO-101 로봇팔 (로보틱스 트랙 2번째 항목)

**Cause:** jay가 데일리 브리핑 형식으로 "Hugging Face LeRobot 라이브러리 + SO-101 6DOF 로봇팔($100~130)" 항목을 PoCs에 추가하고 main에 반영해 달라고 요청.
**Reasoning:** 전날 추가한 `isaac-groot`(피지컬 AI의 "지도")와 명백히 이어지지만 별도 카드로 만들었다 — GR00T 카드는 클라우드 GPU에서 파운데이션 모델을 돌리는 단계별 계획이고, 이번 건은 그 스택의 **최소 스케일 재현**(노트북 + $100 하드웨어에서 모방학습 루프 한 바퀴)이라 검증 대상이 다르다. 카드를 "라이브러리·하드웨어 소개"가 아니라 해봐야 답이 나오는 질문 둘로 잡았다: ① 데이터셋 포맷이 표준화된 뒤 "데이터셋 로드 → 학습된 정책" 사이가 코드 몇 줄인가, ② 로봇 에피소드(관측 이미지 + 관절 상태 + 행동)가 LLM 텍스트 토큰 데이터셋과 무엇이 같고 다른가. 브리핑의 액션 아이템(구매 판단 보류, 시뮬레이션 먼저)은 그대로 `howTo`의 "시뮬레이션 우선, 하드웨어 나중" 순서로 반영. 신규 항목이라 `status:"soon"`, `date`·`href` 없음 — Planned 기본값 규칙.
**Change:** `lib/poc-cards.ts`에 `lerobot-so101` 카드 추가(`sub-2bit-local-llm` 뒤, 참조 전용 블록 앞). 출처 URL은 기존 관례대로 `howItWorks`/`howTo` 끝에 평문("Source:"/"출처:")으로 첨부(github.com/huggingface/lerobot · huggingface.co/docs/lerobot/so101). `pnpm docs:pocs`로 `docs/pocs.html`·`docs/topics/pocs-*.html` 재생성 — `docs/topics/pocs-lerobot-so101.html` 신규 생성, 카드 수 32→33.
**Result:** `npx tsc --noEmit` 통과(exit 0). 생성 HTML 태그 짝·로컬 링크 전수 확인(누락 0건). 목록에서 PLANNED 8번으로 노출. `docs/index.html`(상위 6개 카드 섹션)은 변경 없음.
