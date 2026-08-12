# 2026-08-12 — rabbit 작업 이력

> 소스 문서: 없음 — jay와의 대화(Cloud Run 스케일링 상한 + Jay Chat 비용 논의)에서 직접 나온 작업.
> 배경은 [docs/features/ai-chat.md](../features/ai-chat.md)의 Jay Chat 가드레일 절.

### Cloud Run max-instances 1로 고정 (라이브 + deploy.sh)

- **Cause:** 어제 Jay Chat 쿼터 점검에서 인메모리 시간당 토큰 예산이 인스턴스마다 따로
  잡혀서, 스케일아웃 시 실효 쿼터가 배수로 늘어나는 구멍을 확인. 라이브 서비스는
  gcloud 기본값(max 20)으로 돌고 있었다.
- **Reasoning:** 데모/포트폴리오 사이트라 인스턴스 1개(동시 80요청)로도 여유가 크고,
  1개로 고정하면 토큰 예산 카운터가 정확히 하나가 된다. 배포 중엔 Cloud Run이 구·신
  리비전을 잠깐 병행하므로 다운타임 없음.
- **Change:** 라이브 `rabbit` 서비스에 `gcloud run services update --max-instances 1` 적용
  + `scripts/deploy.sh`의 `gcloud run deploy`에 `--max-instances 1` 플래그 추가(재배포에도 유지).
- **Result:** 라이브 리비전 maxScale=1 확인. 같은 논리로 verex 4개 서비스도 정리
  (verex 저장소 이력 참조).

### Jay Chat: gpt-4o-mini → Qwen Flash 전환 + 쿼터 3× (150k→450k/시간)

- **Cause:** jay가 Qwen API를 구독 — 어제 가격 비교(Qwen Flash $0.05/$0.40 vs
  gpt-4o-mini $0.15/$0.60 per 1M in/out, 일반 턴 기준 ~45% 저렴)에 이어 전환 결정.
  싸진 단가만큼 시간당 예산을 3배로 올리기로 함.
- **Reasoning:** DashScope의 OpenAI 호환 엔드포인트라 전환은 URL·모델명·키만 교체
  (스트리밍 `stream_options.include_usage` 사용량 캡처 포함 그대로 동작). 시크릿은
  기존 `rabbit-jay-chat-key`(OpenAI)를 남기고 `rabbit-jay-chat-qwen-key`를 새로 파서,
  문제 시 코드만 되돌리면 즉시 롤백 가능. 450k/시간 최악치 월 비용 ≈ $41
  (기존 150k×gpt-4o-mini ≈ $27과 같은 자릿수).
- **Change:** `lib/jay-chat.ts` — 모델 `qwen-flash`, 엔드포인트
  `dashscope-intl.aliyuncs.com/compatible-mode/v1`, 키 env `JAY_CHAT_QWEN_API_KEY`,
  예산 기본값 450000. `app/JayChatClient.tsx` — 안내 문구를 Qwen Flash로.
  `scripts/deploy.sh` — 시크릿 배선 교체 + 예산 기본값 450000. `.env.example` /
  `docs/features/ai-chat.md` 동기화. 브랜치 `claude/jay-chat-qwen-flash`.
- **Result:** `tsc --noEmit` 통과. **미완:** `.env.local`의 `JAY_CHAT_QWEN_API_KEY=`가
  비어 있음 — jay가 DashScope 키를 붙여넣어야 배포 가능. 배포 전이라 라이브는 아직
  gpt-4o-mini + 150k로 동작 중.

### 오너 전용 챗 삭제 + LLM 키를 AI_API_KEY 하나로 통일 (위 Qwen 항목 일부 대체)

- **Cause:** jay가 "왜 AI_PROVIDER/AI_API_KEY 를 안 쓰고 새 변수를 만드냐"고 물었고, 분리 키의
  근거(오너 챗 보호)를 듣자 "그 개인 챗은 안 쓴다, 지워도 된다"고 결정.
- **Reasoning:** 전용 키의 존재 이유는 "남용 시 개인 챗을 죽이지 않고 단독 폐기"였는데,
  유일한 다른 소비자(오너 챗)가 사라지면 격리로 얻는 게 없다. 변수 하나가 정답이 됨.
- **Change:** `app/chat/`·`app/api/chat/`·`lib/ai.ts`(Ollama 로컬 경로 포함) 삭제,
  `ChatMessage` 타입은 `lib/jay-chat.ts` 로 이동. Jay Chat 키를 `AI_API_KEY` 로 변경
  (위 항목의 `JAY_CHAT_QWEN_API_KEY`/`rabbit-jay-chat-qwen-key` 계획은 폐기 — 기존
  `rabbit-ai-key` 시크릿 재사용). deploy.sh 에서 `AI_PROVIDER` env 와 jay-chat 전용 시크릿
  배선 제거. `.env.example`·`docs/features/ai-chat.md` 동기화.
- **Result:** `tsc --noEmit` + `pnpm build`(62페이지) 통과. **배포 전 필수:** `.env` 의
  `AI_API_KEY` 값이 아직 옛 OpenAI 키 — jay 가 DashScope 키로 교체해야 Jay Chat 이 동작.

### .env.local → .env 통일 (rabbit + verex)

- **Cause:** jay — "두 파일 체제(.env / .env.local)가 헷갈린다, 로컬 머신에선 .env 하나만 쓰겠다."
- **Reasoning:** Next.js 는 둘 다 읽으므로 rename 만으로 동작 동일. 안전 조건은 "커밋 금지"인데
  rabbit 은 `.gitignore`(5행 `.env`) + `.gcloudignore`(`.env`/`.env.*`) 둘 다 이미 차단 —
  Cloud Build 업로드에도 안 들어간다.
- **Change:** rabbit `.env.local` → `.env` rename, `scripts/deploy.sh` 의 `source` 와
  README·코드 주석의 경로 표기 일괄 수정. verex 는 `packages/web/.env.local`(빈 플레이스홀더)을
  `packages/web/.env` 로 병합 후 삭제, `scripts/dev-local.sh` 자동 생성 경로도 `.env` 로.
- **Result:** 두 저장소 모두 `git check-ignore` 로 `.env` 무시 확인. `env.local` 참조 잔존 0건
  (역사적 문서 제외).

### Jay Chat: 출력 상한 500→1000 + 예시 질문 풀 7→29개

- **Cause:** jay 스크린샷 — 한국어 경력 요약 답변이 "Sapiens AI (202"에서 뚝 잘림
  (`MAX_OUTPUT_TOKENS = 500`, finish_reason=length; 한국어는 1–1.5자당 1토큰이라 목록형
  답변이 상한에 걸림). 추가 요청: 예시 질문 20개 이상 + 학력(대학·전공·학번)·블록체인
  세부 경력 질문 포함.
- **Reasoning:** 500 상한은 gpt-4o-mini 시절 비용 방어 — Qwen Flash 단가($0.40/M 출력)에선
  1000토큰 = $0.0004라 의미가 없고 총량은 시간당 예산(450k)이 묶는다. 질문 풀은 기존 설계
  (3개 노출, 물으면 교체) 유지한 채 풀만 확장. 학력·경력 데이터는 resume-career.md 에
  이미 있어 코퍼스 추가는 불필요 — 질문 칩만 추가하면 된다.
- **Change:** `lib/jay-chat.ts` MAX_OUTPUT_TOKENS 500→1000. `app/JayChatClient.tsx`
  PROMPT_POOL 7→29개(ko/en 병렬) — Verex·Nostra·Bosagora·BC카드·DAO·NFT·보안·L2·
  학력(대학/전공/학번) 등 코퍼스가 답할 수 있는 범위로 선정.
- **Result:** `tsc --noEmit` 통과, 머지·배포 (jay 승인, "you can merge it and deploy").

### Jay Chat 400 오류 수정 — 2000자 제한을 user 메시지로 한정

- **Cause:** jay 스크린샷 — 긴 답변 뒤 다음 질문이 "Error: messages 배열이 필요합니다"로
  실패. 출력 상한 1500토큰 인상의 부작용: 한국어 답변이 2000자를 넘기 시작했는데,
  검증이 어시스턴트 메시지에도 2000자 제한을 걸어 — 클라이언트가 매 턴 전체 히스토리를
  재전송하므로 — 긴 답변 하나가 이후 대화 전체를 400으로 막았다.
- **Reasoning:** 2000자 가드의 목적은 방문자 입력 남용 방지 — 봇 자신의 답변까지 검사할
  이유가 없다. 어시스턴트 히스토리는 거부 대신 8000자에서 절단(조작된 초대형 페이로드
  무력화). catch-all 하나로 뭉뚱그린 에러도 원인별 메시지로 분리(구조/개수/user 길이).
  덤: system 역할 주입 거부 — outgoing 이 [페르소나 system, ...히스토리]라 주입 통로였다.
- **Change:** `app/api/jay-chat/route.ts` — 검증 분리(원인별 400 메시지), user 만 2000자
  제한, 어시스턴트는 recent 구성 시 8000자 절단, role 을 user/assistant 로 한정.
- **Result:** `tsc --noEmit` 통과. 2600자 어시스턴트 히스토리 + 새 질문 요청이 400 대신
  정상 스트리밍되는 것을 배포 후 확인 (아래 검증).

### Jay Chat: 한국어 이름 "이현재" 고정

- **Cause:** jay 스크린샷 — 연락 방법 답변이 "하현재씨"로 시작 (성 환각).
- **Reasoning:** 시스템 프롬프트가 이름을 PROFILE.name("Hyunjae Lee", 영문)으로만 전달 —
  한국어 답변에서 모델이 "Lee"를 스스로 음차하다 성을 지어냈다. 이름을 양 언어로,
  사실로 명시하고 "항상 이현재로 쓸 것"을 지시하면 해결 (jay: "답변을 '이현재는'로 고정").
- **Change:** `lib/about-me.ts` 시스템 메시지 서두에 이름 규칙 추가 — 한국어 이현재 /
  영문 Hyunjae Lee, 한국어 답변에선 반드시 "이현재", 다른 성 변형 금지.
- **Result:** 배포 후 프로덕션에서 연락·경력 질문 재현 — "이현재" 정상 표기 확인 (아래).

### 문서 색인 정리 — PoCs·Logs 6장 + "완료(done)" 상태 신설

- **Cause:** jay — 색인의 PoCs/Logs 섹션이 길어져 훑기 어려움. 그리고 OpenZeppelin
  Relayer & Monitor 는 사고 실험·구현을 마쳤는데 "준비 중"으로 남아 있어 사실과 달랐다.
- **Reasoning:** 색인은 "지금 무엇이 있나"만 답하고 전체는 View All 페이지가 맡는 구조가
  이미 있었으므로, 두 섹션 모두 6장으로 자른다. 상태는 라이브(돌아감)·준비 중(아직) 둘뿐이라
  "끝났지만 상시 데모는 아님"을 표현할 이름이 없었다 — done 을 세 번째 상태로 추가.
  덤으로 "soon + href = 목업" 추론을 폐기했다: DVT 는 읽을 페이지가 있어도 계획이고,
  게임·에이전트는 페이지가 있고 완료다 — 추론이 사실과 어긋나기 시작하면 데이터가 직접
  말하게 하는 게 맞다. 결과적으로 목업 배지를 쓰는 카드가 0이 되어 그 상태는 사라졌다.
- **Change:** `lib/demo-cards.ts` status 에 "done" 추가(정렬 live→done→soon),
  `DemoCard.tsx`·`TechNotes.tsx`·`home/page.tsx` 배지를 status 전용으로,
  `globals.css` 에 `.poc-badge-done`(하늘색) 추가·`.poc-badge-mock` 제거.
  oz-relayer·agent·game 을 done 으로, `/poc/[key]` 의 "아직 만들지 않았습니다" 배너는
  soon 일 때만. `generate-pocs-html.mjs` 색인 6장 + Logs 섹션 손으로 6장.
- **Result:** `tsc` + 링크 검사 통과. **미해결:** 게임 카드는 배지가 완료인데 본문은 Unity
  트랙이 "아직 시작 전"이라고 말한다 — 문구 정리는 jay 확인 대기.

### View All 페이지를 read-the-docs 레이아웃으로 (레일 + 본문)

- **Cause:** jay 가 verex `/docs` 를 보여주며 "이런 패널인데 전 항목이 다 보여야 한다".
- **Reasoning:** 색인이 6장만 보여주게 된 뒤로 pocs.html 이 "전부 있는 곳"이 됐는데,
  상단 TOC 하나로 18개를 훑기는 어렵다. 좌측 고정 레일은 어디까지 스크롤했든 목록이
  눈앞에 남는다. 레일 표기는 두 번 바뀌었다: 글자 배지(DONE/MOCK/PLANNED) → jay 가
  "점이 낫다" → 큰 색 점 하나(10px)로 확정, 라벨은 hover 툴팁으로만.
  묶음도 출처(PoCs/Algorithms)에서 상태(PoCs/Done)로 바꾸고 Done 을 아래로 내렸다.
- **Change:** `scripts/rtd-shell.mjs` 신설 — 레일·필터·스크롤 스파이·CSS 를 한 곳에 두고
  pocs/algorithms/math 세 페이지가 공유한다(생성기마다 CSS 를 복사하면 갈라진다).
  본문 17px/1.75, 폭 960px 로 확대.
- **Result:** 세 페이지 모두 같은 껍데기로 생성, 마크업·인라인 JS 검증 통과.

### Algorithms·Math 커리큘럼 — 원본 md 하나에서 색인·전체·항목 페이지 생성

- **Cause:** jay 가 "개발자 지식 100"과 "매일의 수학 50" 커리큘럼 전문을 주며 색인 섹션과
  View All 페이지를, 이어서 항목마다 상세 페이지를, 마지막으로 그 상세 페이지에 개념
  설명까지 요청.
- **Reasoning:** 손으로 관리하던 Algorithms 섹션(4장, 옛 50 트랙 혼재)을 커리큘럼 md 를
  원본으로 하는 생성물로 바꾼다 — 매일 ✅ 와 노트 링크만 찍으면 세 표면이 함께 갱신되므로
  표류가 구조적으로 불가능해진다. 노트가 있는 항목은 중간 페이지를 거치지 않고 노트로
  직행(jay 지적), 없는 항목만 스텁을 만든다. 스텁은 빈 안내 대신 커리큘럼이 정한 하루치
  형식(개념·코드/수식·연습·실무연결)을 미리 깔고, 개념·연습·연결은 설명 데이터로 채운다.
  "코드·수식"만 비워 둔다 — 손으로 짜 보는 게 그 칸의 목적이라 대신 채우면 의미가 없다.
- **Change:** `docs/knowledge/dev-100-curriculum.md`(100)·`math-50-curriculum.md`(50) 신설,
  `scripts/generate-curriculum-html.mjs` + `pnpm docs:curriculum` 로
  색인 두 섹션(각 6장)·`docs/algorithms.html`·`docs/math.html`·`docs/topics/*.html`(147) 생성.
  설명은 `docs/knowledge/explainers.json` 에 분리 보관(없으면 뼈대만 그린다).
- **Result:** 전 페이지 링크 전수 검사 0건 깨짐. 생성 직후 검사로 버그 둘을 잡았다 —
  상세 페이지의 앞뒤 링크가 한 단계 깊은 경로였던 것, 절대 URL 에 `../` 가 붙던 것.
  **알아 둘 것:** 기존 노트가 "매일의 수학 Day 8/50"인데 같은 주제가 커리큘럼에선 9번이다
  (7월이 1–8, 8월이 9부터) — 9번에 연결해 두었고 번호 정정은 jay 판단.

### 커리큘럼 상세 페이지에 개념 설명 채우기 (147개)

- **Cause:** jay — "detail page 에 개념 설명을 넣어 두면 나중에 그걸로 배울 수 있다".
  빈 양식만 있는 페이지는 나중에 다시 열 이유가 없다는 지적.
- **Reasoning:** 147개를 순차로 쓰면 한 세션에 담기지 않아 서브에이전트 10개로 나눠 병렬
  집필했다. 지시는 셋이었다 — 교과서 수준 정확성, 확실하지 않은 수치·연도·고유명사 금지,
  Verex 연결이 자연스럽지 않으면 일반 시스템 실무로 쓸 것(억지 연결 금지). 실제로 여러
  에이전트가 이 규칙을 근거로 연결을 거절했다(예: GBM 은 [0,1] 로 유계인 예측시장 가격에
  직접 적용되지 않는다고 명시, 로그수익률 대신 로그오즈 제안).
  "코드·수식" 칸만 비워 둔다 — 손으로 짜 보는 게 그 칸의 목적이라 대신 채우면 의미가 없다.
- **Change:** `docs/knowledge/explainers.json` (개념·왜·연습·실무연결 4필드 × 147),
  생성기가 있으면 채우고 없으면 뼈대만 그리도록 분기. 커리큘럼 md 는 체크리스트로 유지 —
  설명은 재생성 가능한 데이터라 원본과 분리했다.
- **Result:** 147/147 채움(빈 개념 칸 0), 표본 검사에서 비잔틴 정족수(3f+1·2f+1 교집합),
  Pedersen/KZG/FRI 트레이드오프, 확장 유클리드 역원 모두 정확. **주의:** 분량이 큰 생성
  콘텐츠라 그날 공부할 때 함께 읽고 다듬는 것을 전제로 한다.

### View All PoCs — 묶음 해제 + 번호 매기기

- **Cause:** jay — "Merge PoCs and Done in all PoCs page and add number each".
- **Reasoning:** 하루 사이에 출처 기준 → 상태 기준(PoCs/Done) → 묶음 없음으로 정리됐다.
  18장 목록에서 소제목 둘은 구조보다 방해였고, 상태는 색 점이 이미 말한다. 대신 번호를
  붙여 "몇 개 중 몇 번째"를 보이게 했다 — 커리큘럼 페이지와 같은 표기(topic-no)라
  세 페이지의 목록이 같은 문법을 쓴다.
- **Change:** `generate-pocs-html.mjs` 단일 목록 + 1..18 번호(레일·본문 제목 양쪽),
  `rtd-shell.mjs` 에 인라인 번호용 CSS 추가.
- **Result:** 링크·마크업 검사 통과. 순서는 그대로(완료가 앞) — 번호는 그 순서를 드러낼 뿐이다.

### Math 트랙 재번호 + Day 1 신설, 좌측 Done 묶음 제거, 분할상환 노트 작성

- **Cause:** jay — ① "수열·급수·시그마 — 등비급수와 할인율(DCF)"를 Math 첫 항목으로,
  공급·수요는 2번 DONE 으로 ② Math·Algorithms·PoCs 전체 페이지의 좌측 Done 섹션 제거
  (항목은 그대로 두고 묶음만) ③ 포텐셜 함수 분할상환 항목을 더 자세히.
- **Reasoning:** Done 묶음은 같은 항목을 목록에 두 번 싣는 구조라, 순서가 곧 내용인
  커리큘럼에서는 방해가 된다 — 완료는 하늘색 점과 본문 배지가 이미 말한다. Math 는
  월별 구간 앞에 "시작" 구간을 만들어 두 항목을 올리고 전체를 1–51 로 다시 매겼다
  (섹션 제목의 Day 범위와 상단 표도 함께 갱신). 분할상환 항목은 앱 카드 링크 대신
  진짜 노트를 써서 연결했다 — jay 가 "자세히"라고 한 건 설명 네 칸이 아니라 읽을 글이다.
- **Change:** `math-50-curriculum.md` 재구성(51항목), `explainers.json` 의 math 키를
  옛 번호 → 새 번호로 재매핑하고 새 1번 설명 추가. `generate-curriculum-html.mjs` 에서
  Done navGroup 제거 + **스텁 정리 로직 추가**(이번에 쓴 파일만 남긴다).
  `docs/algorithms/amortized-potential-function.md` 신규 — 포텐셜 함수 정의·telescoping
  증명·doubling Φ=2·num−size 계산·성장률 일반화·1/2 축소 함정·EVM 이 분할상환을 인정하지
  않는 이유·연습 3개.
- **Result:** 링크 전수 검사 0건, 스텁 148개(노트 있는 3개는 제외). 재번호 때 옛 스텁
  `math-2.html` 이 남는 걸 검사에서 잡아 정리 로직을 넣었다 — 앞으로 노트를 붙이면
  해당 스텁이 자동으로 사라진다.

### 게임(Unity WebGL) 카드를 PoCs 목록에서 제거

- **Cause:** jay — "remove Game — Unity WebGL track in the PoCs cards and All PoCs".
  같은 날 이 카드를 done 으로 올렸을 때 배지와 본문이 서로 다른 말을 한다고 표시해 뒀는데
  (배지: 완료 / 본문: Unity 트랙 아직 시작 전), 문구를 고치는 대신 목록에서 빼는 쪽으로 정리됐다.
- **Reasoning:** 이 목록이 답하는 질문은 "무엇을 만들고 있나"인데, 캔버스 자리표시자와
  Unity 트랙은 그 질문에 서로 다른 답을 해서 배지 하나로 정리되지 않았다. 라우트와 상단
  메뉴(ALLOW_GAME)는 그대로 두어 게임 자체는 계속 열린다 — 목록에서만 빠진다.
- **Change:** `lib/poc-cards.ts` 의 game 카드 블록 삭제(자리에 이유를 주석으로 남김).
  `pnpm docs:pocs` 재생성 — 색인 6장은 그대로, 전체 목록 18 → 17장.
- **Result:** `tsc` 통과, 링크 검사 0건. 앱 `/poc` 에서도 사라졌고 `/game` 은 200 으로 살아 있다.
