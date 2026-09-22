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

### Algorithms Day 3(영속 자료구조·구조 공유) 노트 작성 — jay와 나눈 대화를 그대로 정리

**Cause:** jay가 별도 대화에서 영속 자료구조·구조 공유·Verkle tree를 주제로 심도 있게 논의한 뒤, 그 내용을 `docs/topics/algorithms-3.html`에 정리해 달라고 요청.
**Reasoning:** 커리큘럼 Day 3 항목("영속 자료구조와 구조 공유 — 불변 상태의 O(log n) 갱신")이 정확히 그 대화 주제와 일치 — 새 항목을 만들지 않고 기존 Day 3에 노트를 붙이는 게 맞다고 판단. 이미 `docs/code/algorithms/algorithms-3.py`(영속 연결 리스트 `cons`/`to_list` 예제)가 준비돼 있어 그대로 "관련 코드"로 링크.
**Change:** `docs/algorithms/persistent-structures-structural-sharing.md` 신규 작성(경로 복사 메커니즘, 영속성 3단계, "왜 중요한가"(락프리 읽기 + 저렴한 버전 관리), 실사용 사례 표, 한계 비용 vs 누적 비용 — 이더리움 아카이브/pruned 노드 저장량 대비 — 및 Day 5로의 연결 문장까지 영/한 병기). `docs/knowledge/dev-100-curriculum.md`의 Day 3에 노트 링크(`html/docs/algorithms/...`)와 ✅ 추가.
**Result:** 링크된 항목이라 스텁 페이지가 자동 삭제됨(Day 1·2와 동일 패턴) — 이전 URL `docs/topics/algorithms-3.html`은 더 이상 존재하지 않고, 내용은 `docs/html/docs/algorithms/persistent-structures-structural-sharing.html`로 이동. `tsc --noEmit` 통과, 태그 짝·로컬 링크 전수 확인.

### Algorithms Day 5를 "Verkle tree" 항목으로 좁힘 — 새 Day 삽입 대신 기존 슬롯 재사용

**Cause:** jay가 이더리움 stateless 클라이언트를 가능케 하는 Verkle tree 설명 문장 하나를 "algorithms의 한 항목으로, 상단에, Done 항목들 밑으로" 추가해 달라고 요청.
**Reasoning:** 문자 그대로 새 Day를 끼워 넣으면 Day 4~100 전부가 5~101로 밀려야 하는데, 이 항목들 전부에 이미 번호로 연결된 코드 파일(`docs/code/algorithms/algorithms-N.py`, 97개)과 `explainers.json`/`explainers.en.json` 양쪽의 100개 키가 붙어 있어, 밀어넣기를 하면 이 전부를 재매핑해야 하고 잘못하면 코드·설명이 엉뚱한 항목에 붙는 실수가 날 수 있었다. 확인해보니 Day 5가 이미 "트라이 계열 심화 — Patricia vs MPT vs Verkle"로 정확히 같은 주제였고 상세 설명(EXPLAINERS)도 이미 이 트레이드오프를 다루고 있어, jay에게 옵션을 제시하고 "Day 5 슬롯 재사용"으로 확정받음 — 번호 이동 없이 안전.
**Change:** `docs/knowledge/dev-100-curriculum.md`의 5번 항목 제목을 "Verkle tree — (jay가 준 문장 그대로)"로 교체(기존 코드·explainer는 그대로 유지, 여전히 TODO 상태).
**Result:** 상세 페이지 리드 문단에 그 문장이 그대로 노출되고 그 아래 기존 설명이 이어짐 확인. `tsc` 통과.

### Math Day 3·PoCs DVT를 Done으로 표시

**Cause:** jay가 "DVT in the protocol", "Persistent Data Structures & Structural Sharing", "Propositional Logic", "Sets, Functions, and Relations" 네 개를 모두 Done 상태로 바꿔 달라고 요청 — 뒤 두 개는 확인 결과 Math Day 3("명제논리·집합·함수·관계") 항목 하나의 제목 앞뒤 반쪽씩이었다.
**Reasoning:** Math Day 3는 이미 손으로 쓴 상세 페이지(`docs/topics/math-3.html`, href로 직접 지정)가 있었지만 ✅ 표시만 빠져 있던 상태 — 내용 추가 없이 완료 표시만 필요. DVT PoC 카드도 읽기 노트(`docs/topics/pocs-dvt.html`)는 이미 완성돼 있었고 `status: "soon"`(목업 배지)만 남아 있던 상태.
**Change:** `docs/knowledge/math-50-curriculum.md` Day 3에 ✅ 추가. `lib/poc-cards.ts`의 `dvt` 카드 `status: "soon"` → `"done"`, `date`를 오늘(2026-08-13)로 갱신(CLAUDE.md의 "done 전환 시 date 갱신" 규칙).
**Result:** `docs/math.html`·`docs/pocs.html` 재생성 후 두 항목 모두 DONE 배지로 노출 확인. `tsc` 통과.

### PoCs 상단에 외부 리서치 정독 노트 2건 추가 — DVT를 3번으로 밀어냄

**Cause:** jay가 `/Users/jay/work/temp`에 저장해 둔 파일 두 개(a16z 뉴스레터 "Can Agents Use a Computer Yet?" mhtml, Tempo Research "Tokenized Money for Banks" PDF)를 PoCs 목록 상단 항목으로 만들고 출처 링크도 넣어 달라고 요청, 동시에 "DVT in the protocol이 3번이 되어야 한다"고 지정.
**Reasoning:** PoCs 목록의 번호는 `sortDemoCards()`가 매기고(같은 status면 date 내림차순, 같은 date면 배열 순서 유지) DVT가 `status:"done", date:"2026-08-13"`로 이미 1번을 차지하고 있었으므로, 같은 status·같은 date로 새 카드 둘을 `dvt` 항목보다 배열상 앞에 넣기만 하면 안정 정렬(stable sort)로 정확히 1·2번이 되고 DVT가 자동으로 3번으로 밀림 — 별도 순번 필드를 손댈 필요가 없었다. PDF는 poppler(`brew install poppler`)로 텍스트 추출, mhtml은 Python `email` 모듈로 멀티파트를 파싱해 가장 큰 `text/html` 파트를 뽑아 태그를 벗겼다. `DemoCard`엔 출처 URL을 위한 전용 필드가 없어 DVT 카드의 관례(정독 노트 = `status:"done"`, purpose·howItWorks에 실제 내용 요약)를 따르되, `howItWorks`/`howItWorksKo` 문장 끝에 "Source: <url>"/"출처: <url>"을 평문으로 덧붙였다(다른 필드처럼 escapeHtml되는 자리라 링크 태그를 심어도 그대로 이스케이프되어 보일 것이었음).
**Change:** `lib/poc-cards.ts`에 `agents-computer-use`, `tokenized-money-banks` 두 카드를 `dvt` 항목 바로 앞에 추가(둘 다 `status:"done"`, `date:"2026-08-13"`, 원문 요약 + 출처 URL 포함). `pnpm docs:pocs`로 `docs/pocs.html`·`docs/index.html`·`docs/topics/pocs-*.html` 재생성.
**Result:** 생성된 목록에서 1=Can Agents Use a Computer Yet?, 2=Tokenized Money for Banks, 3=DVT in the protocol 순서 확인. 두 상세 페이지 모두 영/한 본문에 출처 URL 노출 확인. `tsc --noEmit` 통과, 태그 짝·로컬 링크 전수 확인(기존 `docs/index.html` `&lt;div&gt;` 불일치는 이번 변경 이전부터 있던 것으로 재확인, 무관).

### 새 리서치 카드 둘을 Done → Planned로 정정, DVT를 다시 3번으로

**Cause:** jay가 방금 추가한 두 카드(Can Agents Use a Computer Yet?, Tokenized Money for Banks)는 Done이 아니라 Planned여야 한다고 정정. 그리고 곧이어 "DVT in the protocol는 3번"이라고 다시 한번 지정.
**Reasoning:** 두 카드를 `status:"soon"`으로 바꾸면 `sortDemoCards()`의 done→soon 순위 규칙상 done 그룹보다 무조건 뒤로 밀려서, "DVT 앞에 배치"로 3번을 만들던 이전 트릭이 더 이상 통하지 않는다 — done 카드끼리의 자체 순서로 3번을 만들어야 했다. 이미 done 카드가 두 개 더 있었다(agent 2026-08-12, oz-relayer 2026-08-12). DVT의 `date`를 오늘(2026-08-13, 상태를 플래그만 바꾼 날)이 아니라 원래 값인 2026-08-05(정독 노트 본문이 실제로 완성됐던 날 — CLAUDE.md의 "date는 카드를 만든 날이 아니라 실제로 완결된 날" 규칙에 더 맞는 값)로 되돌리면, 두 08-12 카드보다 뒤로 가면서 정확히 3번이 된다 — 다른 카드는 전혀 건드리지 않았다.
**Change:** `lib/poc-cards.ts`에서 `agents-computer-use`·`tokenized-money-banks`의 `status`를 `"soon"`으로, `date` 필드를 제거(구현 전 카드는 날짜를 비워둔다는 기존 규칙). `dvt`의 `date`를 `"2026-08-05"`로 되돌림. `pnpm docs:pocs` 재생성.
**Result:** 목록 순서 1=Autonomous payment agent, 2=OpenZeppelin Relayer & Monitor, 3=DVT in the protocol, 두 신규 카드는 PLANNED 배지로 이동해 14·15번 확인. `tsc --noEmit` 통과, 태그 짝 확인.

### PoC 카드 추가: 스테이킹 집중 위험 (솔라나 라우팅 장애 29% 사건)

**Cause:** jay가 "솔라나 네트워크에서 라우팅 오류로 스테이킹의 29%가 오프라인이 되어 최종성 상실 위기를 가까스로 넘긴 사건이 집중 위험을 드러냈다"는 내용으로 PoC 항목 하나를 만들어 메인 브랜치에 푸시해 달라고 요청.
**Reasoning:** 이미 `solana` 카드가 있었지만 그건 EVM-vs-솔라나 아키텍처 비교 + devnet Anchor 프로그램이라 주제가 달라 별도 카드로 만들었다 — 이번 건의 핵심은 체인 아키텍처가 아니라 **네트워크 토폴로지**이기 때문이다(합의는 설계대로 동작했고, 인프라 결함 하나가 검증인 3분의 1에 동시 도달한 것이 문제였다). 카드를 "사건 요약"이 아니라 **측정 가능한 질문**으로 잡았다: 하나의 상관된 단일 장애점을 공유하는 스테이킹 최대 조각 vs. 최종성 정지 임계값 33%. 이더리움 비콘 체인에도 같은 파이프라인을 돌려 비교하도록 범위를 잡았다(거기서는 집중이 검증인 수가 아니라 스테이킹 풀과 그 운영자들이 쓰는 소수 클라우드에 숨어 있다). 신규 항목이므로 `status:"soon"`, `date`·`href` 없음 — Planned 기본값 규칙(2026-08-13 jay 정정) 적용.
**Change:** `lib/poc-cards.ts`에 `stake-concentration` 카드 추가(`pet-clean-room` 뒤, 참조 전용 블록 앞). `pnpm docs:pocs`로 `docs/pocs.html`·`docs/index.html`·`docs/topics/pocs-*.html` 재생성 — 새 상세 페이지 `docs/topics/pocs-stake-concentration.html` 생성되고 나머지 topic 페이지는 번호/pager만 1씩 밀림.
**Result:** `tsc --noEmit` 통과. 상세 페이지 영/한 양쪽 PLANNED 배지 확인, 목록에서 6번으로 노출. index의 링크가 아직 없는 `/poc/stake-concentration`를 가리키는 것은 기존 PLANNED 카드(`dsrv-portal`, `pet-clean-room`)와 동일한 생성기 관례라 그대로 두었다.

### PoC 카드 추가: 2비트 미만 LLM 로컬 실행 (Qwen3.8 / Unsloth 동적 1비트 양자화)

**Cause:** jay가 Unsloth의 "Qwen3.8 - How to Run Locally" 문서 내용을 붙여넣고 PoC 항목으로 추가해 메인에 반영해 달라고 요청.
**Reasoning:** 카드를 "새 모델 소개"로 쓰면 모델 버전과 함께 금방 낡으므로, 오래 가는 두 질문으로 잡았다. ① 「로컬에서 돌아간다」가 섞어 쓰는 두 주장의 분리 — 16GB에서 도는 27B와, 4.9TB→397GB로 줄였지만 여전히 RAM 450GB가 필요해 서버 소유자에게만 「로컬」인 2.4T-A95B는 같은 단어로 부를 수 없다. ② 「정확도를 상당히 유지한다」는 문구의 수치화 — 원문 표 자체가 1비트 변형 최대↔최소 사이에서 PPL 2.578→4.489, top-p 일치율 78.882%→66.257%를 보여주고 그 대가가 디스크 약 22% 절감이므로, 남는 장사인지는 의견이 아니라 측정 문제로 프레이밍했다. 기법 설명은 실제로 좁은 이야기라 정확히 적었다 — IQ1_S(1.5625bpw)의 11비트 인덱스가 가리키는 코드북 2048개를 1024/512/256으로 줄여 인덱스를 10/9/8비트로, 가중치를 1.4375/1.3125/1.1875bpw로 낮춘 것(TQ2_0·TQ1_0·Q1_0, HF 저장소 노출 때문에 고른 이름)이고 QAT/증류 없는 PTQ라는 점이 검증 가치의 핵심. 실행 계획은 2.4T가 아니라 **가진 하드웨어에서 되는 27B**로 잡아 곡선을 인용 대신 재현하는 것으로 뒀다. 신규 항목이므로 `status:"soon"`, `date`·`href` 없음.
**Change:** `lib/poc-cards.ts`에 `sub-2bit-local-llm` 카드 추가(`stake-concentration` 뒤, 참조 전용 블록 앞). `pnpm docs:pocs` 재생성 — `docs/topics/pocs-sub-2bit-local-llm.html` 신규 생성, 카드 수 31→32.
**Result:** `tsc --noEmit` 통과, 영/한 양쪽 PLANNED 배지 확인(목록 7번). 붙여넣은 원문에 URL이 없어 출처 링크는 넣지 않았다 — 필요하면 Unsloth 문서 URL을 받아 `howItWorks` 끝에 기존 관례("Source: <url>")대로 덧붙이면 된다.
