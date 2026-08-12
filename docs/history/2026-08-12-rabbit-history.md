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
