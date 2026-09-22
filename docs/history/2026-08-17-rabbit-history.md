# 2026-08-17 — rabbit 작업 이력

> 소스 문서: 없음 — jay가 대화에 붙여넣은 1inch Aqua 광고 문구("What if liquidity didn't mean handing over your tokens?")에서 출발한 작업. 1차 출처는 1inch 공식 문서(1inch.com/aqua/learn)와 2026-07-27 공개 보도. 논리 구조를 공유하는 선행 카드는 [2026-08-14 이력의 "PoC 카드 상태 변경: Stake concentration risk → done"](2026-08-14-rabbit-history.md) 참고.

### PoC 카드 추가: 공유 유동성(1inch Aqua) — 호가된 깊이 vs 실제 잔고

**Cause:** jay가 팟캐스트 광고 문구 한 줄("토큰을 넘기지 않는 유동성")을 붙여넣고 "이것과 관련된 PoC 항목이 뭐가 될까"를 물은 뒤, 카드로 추가하고 main에 반영해 달라고 요청.

**Reasoning:** 광고가 파는 것은 **자기수탁**(토큰이 지갑을 떠나지 않음)인데, 그건 사실이라 카드로 만들 거리가 아니다. 문서를 읽고 찾은 카드가 될 지점은 두 문장을 나란히 놓았을 때 드러난다 — ① 공식 예시가 "10만 달러 잔고 → 세 포지션이 합계 30만 달러 호가", ② 공식 문서가 "그 순간 잔고가 부족하면 스왑은 그냥 revert 된다". 즉 **호가된 깊이는 약속이 아니라 상한**이고, 자기수탁의 대가로 호가와 체결 가능성이 분리됐다. 게다가 공개 문서는 *두 주문이 같은 잔고를 동시에 노릴 때* 무슨 일이 벌어지는지를 설명하지 않아, 측정할 빈칸이 남아 있다. 이 형태는 `stake-concentration` 카드와 동일하다(겉보기엔 독립 단위 N개, 실제 독립성의 단위는 더 작다) — 검증인/ASN에서 오더북/잔고로 옮겼을 뿐이라, 같은 사고 도구를 다른 도메인에 적용한 짝으로 삼았다. 대안으로 검토한 별도 카드 둘 중 `withdrawal-authority-models`(approve+pull vs Permit2 vs ERC-4337 세션키)는 **독립 카드로 만들지 않고 이 카드의 한 섹션으로 접었다** — 기존 AA·AP2·ERC-7702 카드와 겹쳐 목록만 묽어지기 때문. `aqua-vs-amm-capital`(자본 효율 비교)은 이번엔 보류. 신규 항목이라 `status:"soon"`, `date`·`href` 없음 — Planned 기본값 규칙.

**Change:** `lib/poc-cards.ts`에 `aqua-shared-liquidity` 카드 추가(`rwa-multichain` 뒤, `aml-compliance` 앞 — soon 묶음 앞쪽). `howItWorks`는 문서화된 동작(allowance는 에스크로가 아닌 권한 상한, SwapVM이 원자적으로 pull) → 측정 계획(anvil 포크에서 잔고의 3배를 호가하는 포지션 셋, 같은 블록에 경합 주문, 잔고를 호가 대비 90%·50%·10%로 스윕, 산출물은 실현/광고 깊이 곡선 + revert 비율 + taker 가스) → 인출 권한 모델 비교 섹션 순으로 구성. 출처는 기존 관례대로 `howTo` 끝에 평문 첨부. `pnpm docs:pocs`로 재생성 — `docs/topics/pocs-aqua-shared-liquidity.html` 신규 생성, 카드 수 36→37.

**Result:** `npx tsc --noEmit` 통과(exit 0). 목록에서 **6번**(DONE 4개 + `rwa-multichain` 다음)으로 노출되고 `rwa-multichain`의 "soon 묶음 맨 앞" 위치는 유지. 생성 HTML 38개 전수 검사 — 태그 짝·로컬 링크 신규 이슈 0건. 검출된 2건(`docs/index.html`의 div 28/27 불일치, `file:///Users/jay/...` 절대경로 링크 1건)은 모두 HEAD에도 동일하게 존재하는 **기존 이슈**로 이번 변경과 무관.

### PoC 카드 3개 추가: 브리핑 3건을 다른 이음매로 잘라 재구성

**Cause:** jay가 데일리 브리핑 3건(폴리마켓 정산 규칙 개편 + 프론트엔드 공급망 공격, Trezor 배송 파트너·Bits of Gold 유출, Ripple Mint 출시 + Balance Coin 붕괴)을 순차로 붙여넣으며 각각 "이것도 PoC 항목으로" 요청.

**Reasoning:** 브리핑 단위로 카드 3개를 만들지 않고 **주제 축으로 다시 갈랐다.** 사실 확인 과정에서 폴리마켓의 "5초짜리 수법"(단일 시점 스냅샷 정산)과 Balance Coin 오라클 공격(타당 범위 검사·청산 지연 없이 가격 수용)이 **같은 결함의 두 도메인 판본**이라는 게 드러났기 때문 — 따로 두면 같은 논증을 두 번 하게 된다. 그래서 브리핑 #9의 정산 절반과 브리핑 #10의 Balance 절반을 한 카드로 묶고, 남은 절반들을 각각 서드파티 신뢰 문제와 발행·상환 운영 문제로 보냈다. 결과적으로 요청 3건 → 카드 3장은 같지만 경계선이 다르다. 가장 값어치 있는 발견은 브리핑 #9의 교훈 ②("서드파티 스크립트는 SRI·CSP로 잠글 것")가 **틀렸다**는 것: 악성 스크립트가 신뢰된 협력사 자신의 인프라에서 왔으므로 SRI 해시는 일치했고, 협력사는 CSP 화이트리스트에 있었다. 둘 다 "승인되었는가"에 답하는데 공격의 전제가 승인되어 있었다는 것이다. 이 어긋남을 지우지 않고 카드의 척추로 삼았다 — `rwa-multichain` 카드와 같은 방식(원 논지를 적고, 그것이 멈추는 자리를 표시). jay가 "🔜 하드웨어 월렛 항목에 기준 한 줄 추가"를 요청했으나 **카탈로그에 하드웨어 월렛 카드가 없어서**(가장 가까운 것은 `dsrv-portal` 기관 커스터디), 해당 기준선(브랜드가 아니라 감사 이력·서명 방식·엔트로피 소스 + 공급망·배송 위탁사)을 서드파티 카드의 소비자 쪽 따름정리로 넣고 Coldcard 엔트로피 결함을 "기기 안" 대조 사례로 붙였다.

**Change:** `lib/poc-cards.ts`에 세 카드 추가(`aqua-shared-liquidity` 뒤). ① `price-at-a-moment` — 폴리마켓 TWAP 전환(5분 시장 30초, 15분·4시간 60초, Chainlink Data Streams)과 Balance Coin 오라클 공격을 한 논증으로; 설계 산출물을 원칙이 아니라 파라미터(구간 길이·검증 범위·지연)로 잡고 조작비용 곡선이 이득선을 넘는 교차점을 찾는 측정으로 구성. ② `third-party-blast-radius` — 사고 4건(폴리마켓 06-25 프론트엔드 ~$294만/11지갑, 05-22 6년 된 키 $70만, Trezor/ShipMonk 13,689명·근본 원인은 Metabase 취약점, Bits of Gold 약 20만 명)을 하나의 뿌리로 묶고, SRI/CSP 반증 → 권한 기반 인벤토리 + 서명 표면 격리 프로토타입으로. ③ `stablecoin-redemption-desk` — Ripple Mint(2026-07-23)의 작업당 단일 참조 ID를 대사 원시 기능으로 보고, 상환 경로를 축 4개(자격·SLA/중단조건·감사추적·멀티체인)로 비교. 전 카드 `status:"soon"`, `date` 없음.

**Result:** `npx tsc --noEmit` 통과(exit 0). 카드 37→40. 생성 HTML 전수 검사 신규 이슈 0건(기존 2건은 동일). 목록 7·8·9번으로 노출.

### PoC 카드 추가: 무상태 MCP 스펙(2026-07-28) 위에서 서버 직접 구현

**Cause:** jay가 MCP 새 스펙 브리핑을 붙여넣고 "직접 MCP를 만드는 것에 대한 PoC 추가" 요청.

**Reasoning:** 기존 `google-adk-mcp` 카드가 이미 MCP를 다루므로 **축을 명시적으로 갈랐다** — 그쪽은 "verex-desk 서브에이전트를 ADK로 감싸 MCP로 서빙할 수 있는가"라는 프레임워크 질문이고, 이 카드는 그 아래의 프로토콜 질문이다. 순서도 카드에 적었다: 이 카드를 먼저 하면 ADK 카드가 미지수 둘이 아니라 래퍼 연습 하나가 된다. 카드의 논지는 "MCP를 배우자"가 아니라 **이번 개정으로 답의 모양이 바뀌었다**는 것 — 핸드셰이크와 `Mcp-Session-Id` 제거로 서버가 "계속 띄워 두는 프로세스"에서 "배포하는 함수"가 되고(서버리스·엣지), OAuth 2.0/OIDC 정렬로 사내 IdP 연결이 우회가 아니게 된다. 후자가 회사 데이터 접근 가부를 결정하므로 시간을 가장 많이 쓸 항목으로 지정. 포팅 대신 신규 구현을 지시한 이유는 Tasks가 명시적 파괴적 변경이라 포팅이 옛 모델을 두 번 가르치기 때문. jay가 언급한 LLM 트랙 Day 39 재개 기준 스펙도 이 카드가 정하도록 본문에 명시.

**Change:** `lib/poc-cards.ts`에 `mcp-stateless-server` 추가. 검증 항목 셋을 "읽지 말고 해봐야 아는 것"으로 구체화(콜드 스타트 무상태 처리, 핸드셰이크 없이 `_meta`가 실어야 하는 것, list/resource-read 캐시 가능성의 실배포 생존). Roots·Sampling·Logging deprecated(제거까지 최소 12개월) 주의 포함. `status:"soon"`, `date` 없음.

**Result:** `npx tsc --noEmit` 통과(exit 0). 카드 40→41, 목록 10번. 생성 HTML 42개 전수 검사 신규 이슈 0건.

### PoC 카드 추가: 해커톤 출품작을 가정한 설계 — "한도는 틀린 불변식이다"

**Cause:** jay가 Google Cloud × Solana 에이전틱 커머스 해커톤(2026-08, 160명 참가·본선 10팀) 안내문을 붙여넣고 "네가 나간다고 가정하고 아이디어를 내달라"고 요청 → 초안 확인 후 카드로 추가·머지 지시.

**Reasoning:** 대회 주제가 "예산 한도 안에서 사람 승인 없이 결제·정산·서명"이라 대부분의 출품작이 **에이전트 + 세션키 + 한도**의 해피패스로 수렴한다고 보고, 그 수렴 지점 자체를 공격 대상으로 잡았다. 논지 한 줄: **한도는 금액을 제약하지 구매를 제약하지 않는다** — $100 중 $50을 엉뚱한 것에 쓴 에이전트는 세션키·한도·서명 모든 검사를 통과한 것이고, 온체인에는 차지백이 없다. 그래서 불변식을 한도에서 **사전 서명된 의도**로 갈아 끼우고(판매자 콘텐츠를 보기 전에 품목 클래스·최대 단가·수량·판매자 allowlist·만료를 커밋, 정산을 잔고가 아니라 커밋과 대조), 승인과 최종 정산 사이에 **거부권 창**(30~60초, 에이전트가 가질 수 없는 저권한 감시 키만 취소 가능 — 권한을 서로소로)을 둔다. 두 번째가 공격받을 지점("판매자가 30초를 기다리나")이라 반론을 설계 안에 미리 답해 뒀다: **카드망의 auth/capture를 에이전트용으로 다시 만든 것**이지 새 트레이드오프가 아니다 — 이건 `rwa-multichain` 카드가 반대 방향에서 이미 도달한 지점이다. 체인·클라우드 선택 근거도 카드에 명시(서브초 파이널리티가 30초 창을 블록타임 부산물이 아닌 제품 결정으로 만든다 / 커밋 발행자와 감시자는 에이전트가 닿을 수 없는 곳에 있어야 하므로 감사 로그를 가진 정책 서비스). 카탈로그 내 위치로는 **AP2(Intent·Cart Mandate) · AA(세션키 권한 분리) · price-at-a-moment(지연은 탐지 창이다)** 세 카드의 수렴점이라 새 주제가 아니다.

**Change:** `lib/poc-cards.ts`에 `agentic-intent-veto` 추가. 이 카탈로그에서 드문 형태(정독 노트도 사고 실험도 아닌 **만들 물건의 설계**)라 배열에서 `aqua-shared-liquidity` 바로 뒤 — soon 묶음 앞쪽에 두었고, 그 이유를 카드 주석에 적었다. `howItWorks`에 구현 범위를 좁게 못박음: 솔라나 프로그램 하나(커밋 대조 + 타임락 정산 + 감시자 취소), 적대적 판매자 API, Cloud Run 정책 서비스 — 지갑 UI·멀티체인·토큰 없음. 데모 스크립트(같은 에이전트를 인젝션 실린 판매자 API에 두 번 실행)도 본문에 포함. `status:"soon"`, `date` 없음.

**Result:** `npx tsc --noEmit` 통과(exit 0). 카드 41→42, 목록 **7번**. 생성 HTML 43개 전수 검사 신규 이슈 0건(기존 2건 동일).

### PoC 카드 추가: OpenCV — 픽셀에서 밀리미터로 (로보틱스 트랙 3번째)

**Cause:** jay가 데일리 브리핑 "오늘의 로보틱스·AI 항목 3"(OpenCV 캘리브레이션 · ArUco 자세추정 · hand-eye, 비용 0원)을 붙여넣고 PoC 항목 추가를 지시. 머지는 나중에 한꺼번에 하기로 하고 **커밋만**.

**Reasoning:** 튜토리얼 링크 모음이 되지 않게 **산출물을 숫자 두 개로 못박았다** — 재투영 RMS(1픽셀 미만이 합격선)와 자로 잰 거리 대비 `tvec` 오차율. 이 카탈로그의 다른 카드들과 같은 기준("에세이가 아니라 측정")을 로보틱스 비전에 적용한 것이고, "축이 그려졌다"로 끝나는 카드와 값어치가 갈리는 지점이 여기다. 카드의 논지는 이 단계를 건너뛰면 저가 로봇팔이 허공을 집는 이유 — 정책은 로봇 좌표계에서 행동을 배우는데 카메라는 픽셀만 보고하고, 모방학습 루프 어디에도 그 변환이 없다. 브리핑이 짚은 **버전 함정**(`estimatePoseSingleMarkers`가 OpenCV 4.7에서 폐기 → `ArucoDetector` + `solvePnP(SOLVEPNP_IPPE_SQUARE)`)과 **eye-in-hand / eye-to-hand 혼동**은 둘 다 "그럴듯해 보이면서 틀린" 결과를 내는 함정이라 본문에 명시적으로 남겼다.

**Change:** `lib/poc-cards.ts`에 `opencv-robot-vision` 추가. 배열에서 `lerobot-so101` **바로 앞**에 둔 것은 의도적이며(픽셀→밀리미터가 먼저, 팔 움직이기가 그다음) 그 이유를 카드 주석에 적었다. 다음 큐 항목(Jetson Orin Nano Super)과의 연결도 `cv2.dnn` + ONNX 대목에 걸어 뒀다. `status:"soon"`, `date` 없음 — Planned 기본값 규칙.

**Result:** `npx tsc --noEmit` 통과(exit 0). 카드 42→43, 목록 **18번**(`sub-2bit-local-llm` 다음, `lerobot-so101` 앞). 생성 HTML 44개 전수 검사 신규 이슈 0건(기존 2건 동일). **푸시하지 않음** — jay 지시대로 커밋까지만.

### 워크스페이스 인덱스 갱신: Current Projects의 Logs 행을 08-17로

**Cause:** jay가 "Current Projects에 변경사항을 반영하고 머지하라 — current plan·features·logs처럼"이라고 지시. `docs/index.html`의 Current Projects 섹션이 3행 구조(1행 Rabbit · 2행 Verex · 3행 Logs)인데, Logs 행이 각각 08-14(rabbit)·08-12(verex)를 가리키고 있어 오늘 추가한 이력과 어긋나 있었다.

**Reasoning:** 이 섹션은 `pnpm docs:pocs`가 손대지 않는 **수기 관리 영역**이다(생성기는 PoCs 섹션만 다시 쓴다). 그래서 카드 3장의 href·제목·경로를 직접 고쳤다. Verex 이력 파일은 rabbit이 워크스페이스 허브라 `rabbit/docs/history/`에도 사본이 존재하는 구조여서, 카드가 가리킬 대상을 만들기 위해 `verex/docs/history/2026-08-17-verex-history.md`를 복사해 왔다 — 기존 08-10~08-12 verex 파일들과 같은 방식. 전체 로그 수는 `pnpm docs:logs`가 세므로 손으로 세지 않고 생성기 출력(60건)을 카드 문구에 반영했다.

**Change:** `verex/docs/history/2026-08-17-verex-history.md`를 `docs/history/`로 복사. `pnpm docs:html`(신규 파일의 HTML 미러 생성)과 `pnpm docs:logs`(58 → 60건) 실행. `docs/index.html`의 Logs 행 카드 3장 수정 — Rabbit Latest Log 08-14 → **08-17**, Verex Latest Log 08-12 → **08-17**, All Logs 58 → **60 entries**. 1행·2행(Rabbit/Verex의 Feature Designs·Current Plan·Latest Task)은 경로가 그대로 유효해 건드리지 않았다 — 파일 안 주석의 지시와 같다.

**Result:** Current Projects 카드 9개의 링크 대상 전수 확인 — **누락 0건**. `docs/index.html`의 div 28/27 불일치는 HEAD와 동일한 기존 이슈. **남은 것:** `docs/html/projects/verex/**` 미러가 2026-08-01 커밋 시점의 스냅샷으로 고정되어 있다 — `generate-docs-html.mjs`는 REPO_ROOT(rabbit) 안만 순회하므로 형제 저장소인 verex의 최신 문서를 다시 만들 수단이 지금 없다. 그래서 **Verex — Feature Designs 카드는 열리기는 하지만 오늘 추가한 Observability 행이 보이지 않는다.** 해결하려면 생성기에 형제 저장소 경로를 넣거나 verex 문서를 rabbit 안으로 복사하는 절차가 필요해, 이번 범위 밖으로 두고 보고만 한다.

### verex 문서 미러 자동화: 끊겨 있던 재생성 경로 복구

**Cause:** jay가 "rabbit 저장소의 verex features 문서에 Observability 행이 반영됐냐"고 물었고, 답은 아니오였다. 추적해 보니 `docs/html/projects/verex/**`가 2026-08-01 커밋 스냅샷에 멈춰 있었다.

**Reasoning:** 원인은 "생성이 안 된 것"이 아니라 **"생성할 원본이 rabbit 안에 없었던 것"**이다 — `generate-docs-html.mjs`는 REPO_ROOT 안의 `.md`만 순회하는데 rabbit에는 verex features의 마크다운이 아예 없었고, 커밋된 HTML 7개만 있었다. 즉 그 미러는 빌드 산출물이 아니라 **한 번 만들어 넣고 갱신 경로가 끊긴 스냅샷**이었다. 선택지 셋(A: 수동 복사, B: 생성기에 형제 저장소 소스 추가, C: 마크다운 원본도 커밋)에서 jay가 **B+C**를 택했다 — A는 오늘 겪은 표류를 그대로 반복하게 되어 있고, 이 질문이 나온 이유가 바로 그것이다. 구현은 생성기를 건드리지 않는 쪽을 골랐다: 출력 경로 규칙(`docs/html/` + REPO_ROOT 기준 상대경로)이 **기존 미러 경로와 정확히 일치**하므로, 원본만 `projects/verex/`로 가져오면 변환은 기존 생성기가 그대로 처리한다. 동기화 범위는 Current Projects 카드가 거는 두 갈래(`docs/features`, `docs/tasks`)의 `.md`만으로 좁혔고(240KB), 복사할 때 **내용을 한 글자도 고치지 않는다** — 헤더를 덧붙이면 문서 간 상대 링크와 앵커가 어긋나기 때문. 형제 저장소가 없는 머신에서 `docs:html`이 깨지지 않도록 조용히 통과하게 했다.

**Change:** `scripts/sync-verex-docs.mjs` 신규 — `~/work/verex`의 `docs/features`·`docs/tasks` 마크다운을 `projects/verex/`로 복사하고, `projects/verex/SOURCE.txt`에 **verex 커밋 해시**를 남긴다(어느 시점 사본인지 rabbit의 git이 직접 기록하게 하는 것이 C의 요지). SOURCE는 `.txt`로 둬서 생성기가 HTML로 만들지 않게 했다. `package.json`에 `docs:sync-verex` 추가하고 `docs:html`을 `sync && generate`로 연결 — rabbit에는 git hook이 없어 이 연결이 다른 경로를 건드리지 않음을 확인했다. 실행 결과 27개 마크다운이 동기화되고 변환 대상이 334 → 361개로 늘었다.

**Result:** rabbit 쪽 verex Feature Designs 미러에 **Observability 행이 표시된다.** `observability.html`(7,193 B)도 생성됐고, SOURCE.txt가 verex 커밋 `07ec1ca`를 가리킨다. Current Projects 카드 9개 + 미러된 verex README의 내부 링크 전수 확인 — **깨진 링크 0건**(이전에는 features 카테고리 표의 링크 대부분이 미러에 대상 파일이 없어 죽어 있었는데, 원본이 통째로 들어오면서 함께 살아났다). **남은 것:** `docs/html/projects/verex/docs/tasks/summary.html`은 verex에 대응하는 `summary.md`가 없는 **유령 파일**이다. `docs/index.html`의 "View All Verex Tasks →"가 이것을 걸고 있어 지우면 링크가 깨지므로, 이번에는 정리하지 않고 그대로 두고 보고만 한다.
