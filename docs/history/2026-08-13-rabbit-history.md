# 2026-08-13 — rabbit 작업 이력

> 소스 문서: 없음 — jay와의 대화(워크스페이스 인덱스 페이지 링크, Notion 학습 백로그)에서 직접 나온 작업.

### docs/index.html 자기참조 링크에 target="_blank" 추가

**Cause:** jay가 `docs/index.html` 헤더의 `file:///Users/jay/work/rabbit/docs/index.html` 링크가 클릭해도 이동하지 않는다고 보고.
**Reasoning:** href·인코딩 모두 정상이라 파일 자체 문제는 아니었음 — 프리뷰 웹뷰(예: VS Code 내장 HTML 프리뷰) 같은 샌드박스 컨텍스트에서 열람 중이라면, 같은 프레임 안에서 `file://` 로의 네비게이션이 보안상 차단되는 경우가 흔함. `target="_blank"`는 새 창/탭으로 열도록 지시해 이 문제를 우회하고, 일반 브라우저에서도 그대로 잘 동작함.
**Change:** 해당 `<a>` 태그에 `target="_blank" rel="noopener noreferrer"` 추가.
**Result:** 어떤 뷰어에서 열든 안전하게 새 창으로 이동하도록 수정.

### PoCs 카탈로그에 학습 백로그 10개 추가 (Notion 큐)

**Cause:** jay가 Notion에 쌓아둔 학습·조사 백로그 10개(ADK MCP 서빙, Google Skills Repository, AI 에이전트 무료 코스, Circuit Breaker/Saga, Slack·Claude·Notion 통합, Claude Tag for Slack(보류), Apple container, Alibaba page-agent, Google Glass/Stitch, Simplicity CTF)를 All PoCs 페이지에 추가해 달라고 요청.
**Reasoning:** 기존 "soon" 상태의 참조 전용 카드(dsrv-portal 등)와 같은 패턴을 따름 — href 없이 `/poc/[key]` 동적 라우트가 자동으로 상세 페이지를 렌더링. `purpose`/`howItWorks` 필드는 jay가 원문에 이미 적어둔 "Jay 연결" 문장과 사실 설명 문장을 그대로 나눠 담아, 새 내용을 지어내지 않음.
**Change:** `lib/poc-cards.ts`에 10개 카드(`status: "soon"`, href 없음) 추가, `pnpm docs:pocs`로 `docs/pocs.html`·`docs/index.html`의 PoCs 섹션 재생성.
**Result:** `tsc --noEmit` 통과, 생성된 HTML의 태그 짝·링크 존재 여부 전수 확인 완료 (누락 링크 0건). 사이드바 27개 카드, 인덱스 섹션은 6개 카드 유지.

### PoCs에 로보틱스/AI 트랙 첫 항목(NVIDIA Isaac GR00T) 추가 — jay 직접 작성

**Cause:** jay가 로컬에서 직접 `lib/poc-cards.ts`에 `isaac-groot` 카드, `docsHref` 필드(로컬 상세 페이지 링크 지원), `docs/knowledge/isaac-groot.html` 상세 페이지를 추가하고 커밋·main 직푸시를 요청.
**Reasoning:** GR00T N1.7 최소 VRAM 조사 결과 Jetson Orin Nano Super(8GB)로는 직접 추론이 안 돼, 클라우드 GPU 대여 → LeRobot 연동 SO-101 로봇팔 → Jetson 순으로 단계를 재조정한 실전 계획. `docsHref`는 아직 jaylabs.xyz에 페이지가 없는 카드도 로컬 상세 노트로 바로 연결할 수 있게 하는 범용 필드.
**Change:** `lib/demo-cards.ts`에 `docsHref?: string` 추가, `scripts/generate-pocs-html.mjs`가 있으면 "Detail →"로 그 경로를 걸도록 수정, `pnpm docs:pocs`로 재생성.
**Result:** `tsc --noEmit` 통과, `docs/pocs.html`·`docs/knowledge/isaac-groot.html` 태그 짝·링크 존재 전수 확인 완료. 사이드바 28개 카드로 갱신. jay 요청으로 main에 직접 커밋·푸시 (표준 브랜치+PR 절차 생략 — jay 본인 정책의 명시적 예외).
