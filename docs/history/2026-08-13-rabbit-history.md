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

### Algorithms·Math·PoCs 전 항목에 "관련 코드" 추가 (185개 파이썬 파일)

**Cause:** jay가 "PoC·Algorithms·Math의 모든 항목 상세 페이지에 관련 코드를 추가하고, 없으면 상세 페이지를 만들고, 링크를 하나 더 달아 달라"고 요청. 이후 "python 파일 하나만이 아니라, 개념·흐름 설명과 코드가 같이 있는 상세 페이지를 원한다"고 두 차례 더 구체화.
**Reasoning:** 카드 데이터·커리큘럼 마크다운은 이미 "단일 소스 → 여러 표면 생성" 원칙을 따르고 있어서, 코드도 같은 패턴이 맞다고 판단 — `docs/code/{algorithms,math,pocs}/<id>.py` 라는 **파일 존재 여부만으로 자동 인식**되는 컨벤션을 만들면, 커리큘럼 md나 카드 데이터를 단 한 줄도 손대지 않고도 상세 페이지(로컬 정적 문서 + 라이브 Next.js 페이지 둘 다)에 코드가 얹힌다. 표준 라이브러리 우선, 필요한 곳(선형대수·PCA 등)만 numpy 허용. 100+52+33=185개라는 규모 때문에 알고리즘/수학은 Day 구간별 7+4개, PoC는 3개 배치로 나눠 병렬 서브에이전트에 위임하고, 각자 `python3`로 실행 검증까지 하도록 지시.
**Change:**
  - `scripts/generate-curriculum-html.mjs`·`scripts/generate-pocs-html.mjs`: `docs/code/.../<id>.py`가 있으면 상세 페이지의 "코드·수식"/"Related code" 섹션에 그대로 박스 코드로 얹고 파일 링크를 단다 (없으면 기존 안내 문구 유지).
  - `app/TechNotes.tsx` + `lib/code-snippet.ts`(신규): 라이브 `/poc/[key]` 페이지도 같은 `docs/code/pocs/<key>.py`를 서버에서 읽어 렌더링. `Dockerfile`에 `docs/code/`만 별도 COPY 추가(배포 이미지엔 `docs/` 전체가 아니라 필요한 산출물만 — 기존 Docker 정책 그대로).
  - `scripts/rtd-shell.mjs`: `pre`/`code` 스타일, `app/globals.css`: `.card-code` 스타일 추가.
  - **Algorithms·Math 목록 페이지를 PoCs와 같은 포맷으로 재구성** (jay, "should have the same format as the PoCs — summary and link to the detail page") — 항목마다 제목·상태 한 줄 + 요약(subtitle) + "Detail →" 링크로 바뀜(기존엔 제목만 있는 압축 목록).
  - PoCs 상세에서 `docsHref`가 있으면 "Detail →"과 "Open on jaylabs.xyz →"를 **나란히** 보여주도록 수정(기존엔 둘 중 하나만).
  - `docs/code/{algorithms,math,pocs}/` 아래 185개 `.py` 파일 신규 작성(7개 병렬 서브에이전트가 Algorithms Day 구간별, 4개가 Math Day 구간별, 3개가 PoC 키 구간별을 맡았고, 이미 완결 노트가 있던 5개 항목(algorithms-1/2, math-1/2/39)은 기존 노트의 파이썬 코드를 그대로 실행 파일로 빼서 직접 작성).
  - Math 아이템 39 삽입(전날 작업)으로 `docs/knowledge/explainers.json`의 math 키가 밀렸던 것을 뒤늦게 발견해 39 이상 키를 전부 +1 시프트해 수정 — 고치지 않았으면 Day 40 이후 항목이 전부 엉뚱한 개념 설명을 보여줄 뻔했다.
**Result:** 185개 파일 전수 `python3 -m py_compile` + 실제 실행 검증 완료 (서브에이전트 실행 중 발견된 버그 몇 건은 그 자리에서 수정됨 — 예: Day 82 길이확장공격이 실제로 위조 서명을 검증까지 하지 않던 문제, Day 43 백프레셔 큐 용량이 너무 커서 거부가 안 보이던 문제). 최종 점검에서 `docs/code/pocs/erc-7702.py`가 철회(revoke) 시나리오에서 `NoneType.execute` 로 죽는 버그를 추가로 잡아 수정. `tsc --noEmit` 통과, `docs/algorithms.html`·`docs/math.html`·`docs/pocs.html` 태그 짝·링크 존재 전수 확인(누락 0건). `docs/index.html`의 `<div>` 짝 안 맞음(31 vs 30)은 **오늘 작업 이전부터 있던 문제**로 확인 — 이번 변경과 무관해 손대지 않음, 별도 처리 필요.

### 전 상세 페이지 이중언어화 (영어 먼저, 한국어 뒤) + PoCs 상세 페이지 신설

**Cause:** jay가 "상세 페이지에 영어판을 먼저 넣어 달라"고 요청, 이어서 "PoCs도 Algorithms·Math 처럼 상세 페이지 자체가 있어야 하고, Open on jaylabs.xyz 옆에 Detail 링크도 있어야 한다"고 구체화.
**Reasoning:** PoC 카드 데이터엔 이미 `*Ko` 필드가 있어 그대로 쓰면 됐지만, Algorithms·Math의 EXPLAINERS(concept/why/exercise/link)는 한국어뿐이라 번역이 새로 필요했다 — 100+52=147개(완료 5개 제외) 규모라 Day 구간별 7+4개 병렬 서브에이전트에 위임해 `docs/knowledge/explainers.en.json`을 만들고, 완료된 5개 노트는 직접 영어 버전을 써서 같은 파일에 병합했다. PoCs는 상세 페이지가 아예 없어서(라이브 `/poc/[key]`만 있었음) Algorithms·Math 와 같은 `docs/topics/pocs-<key>.html` 생성 로직을 추가.
**Change:** `scripts/generate-curriculum-html.mjs`가 스텁 페이지마다 영어 article(제목·개념·코드·연습·연결) + `<hr>` + 한국어 article을 렌더링(그룹 라벨 영어 매핑 표 포함). `scripts/generate-pocs-html.mjs`에 `docs/topics/pocs-<key>.html` 생성 로직 추가(영어 먼저, 한국어 뒤, `docsHref` 있는 카드는 건너뜀 + prune). `scripts/rtd-shell.mjs`에 `.lang-divider`/`.lang-label` 스타일 추가. `scripts/generate-docs-html.mjs`(저장소 전체 마크다운 변환기)의 "← Index" 링크도 `docs/algorithms/*.md` 노트에 한해 `algorithms.html`/`math.html`로 가도록 수정(어느 커리큘럼이 그 노트를 링크하는지로 판별) — 나머지 파일은 그대로 Workspace Index.
**Result:** algorithms 98/98, math 49/49 영어 엔트리 확보(서브에이전트가 빠뜨린 algorithms Day 3은 직접 채움), `explainers.en.json` 검증 완료. 329개 마크다운 전체 재변환으로 "← Index" 수정이 다른 파일에 영향 없음을 확인. `tsc` 통과, 링크·태그 전수 확인.

### 목록 페이지 통일 — What·How it works·Why, 코드는 상세에만

**Cause:** jay가 "PoCs도 Algorithms·Math 랑 같은 포맷(요약+링크)이어야 한다, 목록엔 코드 없어도 된다" → 이후 "그래도 why·how it works는 목록에 있는 게 낫다, 있는 그대로 복사해서" → "설명이 너무 단순하다, 좀 더" 세 차례에 걸쳐 다듬음.
**Reasoning:** 목록과 상세가 같은 원문에서 다른 분량만 보여주게 설계 — Algorithms·Math는 concept 문단의 앞 2문장(What)·다음 2문장(How)·why 필드(Why)로 나눠 쓰고, PoCs는 description(What)·howItWorks 앞 2문장(How)·purpose 앞 2문장(Why)을 그대로 복사. 상세 페이지 원문은 손대지 않는다. 완료 표시된 5개 항목(algorithms 1/2, math 1/2/39)은 애초에 EXPLAINERS가 없어 목록에 Why/How가 안 뜨는 공백이 있었는데, 그 5개만 직접 새로 써서 `explainers.json`/`explainers.en.json`에 채워 넣었다.
**Change:** `scripts/generate-curriculum-html.mjs`에 `firstSentences`/`sentenceRange` 헬퍼 추가, `scripts/generate-pocs-html.mjs`도 같은 규칙의 `firstSentences` 추가. 두 스크립트 모두 목록 `<li>`에 `topic-summary`(What)·`topic-how`(How it works)·`topic-why`(Why) 세 줄 + Detail 링크로 렌더링.
**Result:** 세 목록 페이지 포맷 통일 확인, 완료 항목 5개도 Why/How 정상 노출. `tsc` 통과, 링크·태그 전수 확인.

### "View All Logs" 페이지 신설 (docs/logs.html) — 기존 링크는 죽은 페이지였다

**Cause:** jay가 index.html의 "Logs" 섹션(최신 6개 카드) 제거 + "View All Logs →" 링크를 Rabbit/Verex Tasks 링크보다 앞에 두라고 요청. 이후 "View All Logs 페이지가 히스토리 파일을 전부 안 보여준다"고 지적.
**Reasoning:** 원인 확인 결과 "View All Logs"는 `docs/logs/summary.md`(2026-06-15에 멈춘 별개의 손으로 쓰는 리서치 다이어리)를 가리키고 있었다 — jay가 실제로 매일 쓰는 `docs/history/YYYY-MM-DD-<repo>-history.md`(56개)와는 처음부터 다른 시스템이라 자연히 안 맞았다. Algorithms·Math·PoCs 와 같은 "폴더를 스캔해 자동 생성" 패턴으로 `docs/logs.html`을 새로 만들어, 목록이 다시는 stale 해지지 않게 함.
**Change:** `scripts/generate-logs-html.mjs`(신규) — `docs/history/*.md` 전체를 스캔해 날짜순 정렬, 파일명으로 Rabbit/Verex 배지 판별(파일명에 표시 없는 초기 파일만 본문 "verex" 언급 횟수로 폴백), 그날의 `### 제목` 헤딩들을 브리핑으로 보여줌. `package.json`에 `docs:logs` 스크립트 추가. `docs/index.html`의 "View All Logs →"가 `logs.html`을 가리키도록 변경. 이후 피드백 반영: 브리핑을 한 줄로 이어붙이던 것을 항목별 줄바꿈으로, 페이지 전체를 한국어로, 항목 사이 구분선 제거, 줄 간격 축소(`scripts/rtd-shell.mjs`에 `.no-divider` 수정자 추가 — 다른 목록 페이지엔 영향 없음).
**Result:** 56개 히스토리 파일 전부 노출 확인, 파일명 기반 Rabbit/Verex 라벨이 본문 언급 휴리스틱보다 우선하도록 수정(오분류 사례 1건 발견·수정). `tsc` 통과, 링크·태그 전수 확인, 다른 세 목록 페이지 미영향 확인.
