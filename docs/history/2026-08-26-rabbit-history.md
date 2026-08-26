# 2026-08-26 — rabbit 작업 이력

> 소스 문서: 없음 — jay가 2026-08-26 일일 리포트 본문을 붙여넣으며 "이 내용을 PoC 항목 여러 개로 추가하고, PoCs 상세 페이지를 반응형으로, 지금보다 보기 좋고 구조 있게 만들어 달라"고 직접 지시. 대상은 [lib/poc-cards.ts](../../lib/poc-cards.ts), [scripts/rtd-shell.mjs](../../scripts/rtd-shell.mjs), [scripts/generate-pocs-html.mjs](../../scripts/generate-pocs-html.mjs). 전날 항목은 [2026-08-25-rabbit-history.md](2026-08-25-rabbit-history.md).

### PoCs 상세 페이지 — 표에 CSS가 아예 없었다

**Cause:** jay: "현재 스타일이 너무 밋밋하고 구조가 없어 읽기 어렵다. 반응형으로도 보이게 해 달라." 확인해 보니 원인이 취향 문제가 아니었다 — `PAGE_CSS`에 `table`·`th`·`td`·`code`·`blockquote` 규칙이 **하나도 없었다.** 카드 본문(`howItWorks`)은 표가 핵심 자료인데(`event-contract-plumbing` 8행, `monad-last-general-purpose-l1` 3행) 브라우저 기본 스타일로 떨어지고 있었다. `.solo` 상세 페이지에는 폭·여백이 고정값이라 좁은 화면 대응도 없었다.

**Reasoning:** 표를 CSS만으로 반응형으로 만들 수는 없다 — 표 자체에 `overflow`를 걸면 `width:100%`와 열 정렬이 깨진다. **스크롤은 바깥 상자가 맡고 표는 평범한 표로 남아야** 해서, 마크다운이 만든 `<table>`을 `.table-wrap`으로 감싸는 후처리(`wrapTables`)를 `rtd-shell.mjs`에 두고 pocs 생성기의 블록 렌더에서 호출했다. 감싸지 못한 표가 남아도 페이지가 넘치지 않도록 `.solo article > table` 폴백도 같이 뒀다. 껍데기가 `rtd-shell.mjs` 하나이므로 algorithms·math·logs 상세 페이지도 같은 개선을 받는다 — 그래서 세 생성기를 모두 다시 돌렸다(그 페이지들의 diff는 CSS 블록뿐).

**Change:** ① `PAGE_CSS` 전면 손질 — 표(머리글 대문자·얼룩무늬·둥근 상자·가로 스크롤), 인라인 코드 칩, 인용, 목록 마커, `h2` 색 막대·`h3` 점으로 위계, `clamp()` 기반 유동 폭/여백, 640px 이하 전용 규칙(본문 16px, pager 한 줄에 하나, 표 오른쪽 그림자로 "더 있음" 표시). ② 상세 페이지 구조 변경 — 번호·상태·제목·요약·`howTo`·언어 전환 알약을 `<header class="topic-hero">` 하나로 모으고, 본문은 `#en`/`#ko` 두 상자로 분리. 예전에는 h1과 요약이 본문 문단들과 같은 상자에 얹혀 있어 **글이 어디서 시작하는지가 보이지 않았다.**

**Result:** Chrome(설치본) 실측 — 1280px·390px 모두 `document.scrollWidth == window.innerWidth`(가로 넘침 0), 390px에서 표 4개가 전부 자기 상자 안에서만 스크롤. 다크모드 확인. 재생성된 파일: `docs/pocs.html` + `docs/topics/*.html` 전체. **남은 것:** `docs/index.html`(손으로 쓴 대시보드, 자체 CSS)은 390px에서 101px 넘침이 있고 이건 이번 변경 이전부터 있던 것 — 원인은 `.grid`의 `minmax(300px, 1fr)`이고 `minmax(min(300px,100%), 1fr)` 한 줄로 고쳐지지만, 상세 페이지 범위 밖이라 손대지 않고 보고만 했다.

### PoC 카드 5장 신설 — 2026-08-26 일일 리포트에서

**Cause:** jay가 리포트 본문(프로토콜 라운드업 · 개인 필자 항목 · Decipher 항목 · LinkedIn/a16z/Four Pillars 각도)을 붙여넣고 "여러 개의 PoC 항목으로 추가하라"고 지시.

**Reasoning:** 리포트의 8개 소재를 그대로 8장으로 만들지 않고 **답할 수 있는 질문 단위로 5장에 묶었다.** ① 잭슨홀·GENIUS 시행규칙은 독립 카드가 아니라 법역 카드의 "가지가 둘이어야 하는 이유"로 들어가는 편이 강했다. ② Decipher 항목(방심위 논거의 제품 언어 번역)과 Four Pillars 항목(3층 대조)은 **같은 축**이라 한 장으로 합쳤다 — 논거 3개를 설계 레버 3개로 옮기는 표가 그 카드의 실질이다. ③ EIP-8141은 이미 `erc-8141` 카드가 있어 새로 만들지 않고 참조만 걸었다. 카드 다섯 장 모두 `status: "soon"`(기존 규칙: 새 항목은 기본이 Planned). EIP-8131·8279는 내용을 확신할 수 없어 `howTo` 첫 작업을 "만들기"가 아니라 **"두 제안을 읽고 무엇을 단위로 재는지 한 문장으로 쓰기, 그 문장이 안 써지면 카드는 거기서 멈춤"** 으로 뒀다 — `korea-digital-asset-act`가 쓴 것과 같은 확인-우선 형식.

**Change:** [lib/poc-cards.ts](../../lib/poc-cards.ts)에 `monad-last-general-purpose-l1` 다음으로 5장 삽입 — `quick-slots-10s`(12→10초 슬롯: 앱 코드에 적히지 않은 채 박힌 "12"의 목록), `l1-data-pricing-dimensions`(EIP-8131·8279: 가스 한 숫자가 감춘 교차보조, 이 프로젝트는 바이트 과다 사용자인가), `tokenized-equity-claim-rail`(Coinbase·Base·Alpaca: 파생이 아니라 청구권이라 문제가 금융공학에서 부기로 옮겨간다, B20), `jurisdiction-decides-the-category`(8일 세 판정 + 방심위 논거 → 설계 레버 표), `publish-by-default-rule`(선별 규칙 하나, 새 채널 아님). 카드 수 63 → 68, 목록 표시 60 → 65.

**Result:** `tsc --noEmit` 통과, `docs:pocs`·`docs:curriculum`·`docs:logs` 재생성 완료, 상세 페이지 5개 신규 생성. **열린 질문:** 리포트가 인용한 사실(EIP 번호와 티어, Alpaca 커스터디 구조, B20 명칭, 잭슨홀 주제문)은 전부 리포트 본문에만 근거가 있고 1차 문서로 확인하지 않았다 — 각 카드의 `howTo`에 "확인할 것"으로 명시해 뒀다.

### 언어 전환을 본문 두 덩어리의 머리에도

**Cause:** jay: "한국어 버전에도 영어로 갈 수 있는 같은 버튼이 있으면 좋겠다." 처음 구현에서 전환 알약은 `topic-hero` 한 곳에만 있었고, 한국어 본문을 읽다가 영어로 돌아가려면 **페이지 맨 위까지 스크롤해 올라가는 길밖에 없었다.**

**Reasoning:** 각 상자 머리의 `<p class="lang-label">`(단순 라벨)을 같은 전환 알약으로 교체했다 — 라벨 자리를 그대로 쓰므로 새 UI 요소가 늘지 않고, 알약 두 개 중 지금 언어가 `.on` 으로 칠해져 **라벨 역할도 겸한다.** hero 의 전환은 진입점으로 남겼다. `.lang-label` 규칙 자체는 지우지 않았다 — algorithms·math 상세 페이지가 아직 그것을 쓴다.

**Change:** [rtd-shell.mjs](../../scripts/rtd-shell.mjs)에 `.lang-switch a.on`(강조색 배경)과 `.solo article .lang-switch` 여백 규칙 추가, [generate-pocs-html.mjs](../../scripts/generate-pocs-html.mjs)의 `#en`·`#ko` 상자 머리를 각각 `on` 위치만 다른 같은 `<nav class="lang-switch">` 로 교체.

**Result:** 한국어 본문 상단에서 `English` 한 번으로 영어 본문으로 이동, 반대도 동일. Chrome 실측으로 확인.

### PoC 카드 3장 추가 — 2026-08-26 리포트 파트 A·B·C

**Cause:** jay가 같은 날 리포트의 세 파트(Glamsterdam 딥다이브 · LeRobot+GR00T · AI 게이트웨이 계층)를 붙여넣고 "PoCs 항목으로 추가하라"고 지시.

**Reasoning:** 세 파트 모두 **기존 카드와 겹치는 지점이 있어서**, 부품 소개가 아니라 **기존 카드가 세워 둔 전제를 대상으로 삼는 방식**으로 각도를 잡았다. ① 파트 A는 포크 일정이 아니라 **회의록이 스스로 단 단서("다음 콜로 연기")가 유통 중 탈락하는 경로**를 대상으로 했다 — 그리고 ePBS(EIP-7732)가 블록 빌딩을 프로토콜 안으로 옮기므로, 프로토콜 **밖** 시장 위에 서 있는 기존 `pbs` 카드와 직접 이어진다. ② 파트 B는 `lerobot-so101`·`reachy-mini`·`isaac-groot` 셋이 이미 있어, 새 카드를 **그 셋이 공유하던 전제("하드웨어를 사야 시작된다")가 깨졌다**는 명제로 세웠다 — 앞선 카드들은 틀린 게 되는 게 아니라 첫 단계에서 두 번째 단계로 내려앉는다. ③ 파트 C는 `mcp-stateless-server`·`agent`·`senpi-harness` 가 전부 **에이전트를 만드는** 카드이고 **통치하는** 카드는 없다는 빈칸을 겨냥했다.

**Change:** [lib/poc-cards.ts](../../lib/poc-cards.ts)에 3장 추가 — `fork-date-provenance`(숫자가 아니라 주장의 지위를 기록하는 상태 칸), `lerobot-groot-one-workflow`(네 단계가 하나의 워크플로가 되면서 진입 비용이 조립에서 사라진 자리), `agent-gateway-layer`(이 리포트 자체가 에이전트가 만드는데 에이전트별 신원·지출 상한·툴별 기록이 없다). 카드 68 → 71장, 목록 표시 65 → 68.

**Result:** `tsc --noEmit` 통과, 상세 페이지 3개 신규 생성. **열린 질문:** 세 카드의 수치(9/28 Sepolia 슬롯, 200M 가스, MCP SDK 월 1.959억 다운로드, TrueFoundry 3~4ms·350+ RPS)는 전부 리포트 또는 벤더/2차 자료 근거이며 1차 확인이 안 됐다 — 각 `howTo`에 확인 대상으로 명시했다. 특히 파트 A 카드는 **1차 사료 확인 자체가 첫 작업**이다.
