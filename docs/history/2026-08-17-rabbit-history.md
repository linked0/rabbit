# 2026-08-17 — rabbit 작업 이력

> 소스 문서: 없음 — jay가 대화에 붙여넣은 1inch Aqua 광고 문구("What if liquidity didn't mean handing over your tokens?")에서 출발한 작업. 1차 출처는 1inch 공식 문서(1inch.com/aqua/learn)와 2026-07-27 공개 보도. 논리 구조를 공유하는 선행 카드는 [2026-08-14 이력의 "PoC 카드 상태 변경: Stake concentration risk → done"](2026-08-14-rabbit-history.md) 참고.

### PoC 카드 추가: 공유 유동성(1inch Aqua) — 호가된 깊이 vs 실제 잔고

**Cause:** jay가 팟캐스트 광고 문구 한 줄("토큰을 넘기지 않는 유동성")을 붙여넣고 "이것과 관련된 PoC 항목이 뭐가 될까"를 물은 뒤, 카드로 추가하고 main에 반영해 달라고 요청.

**Reasoning:** 광고가 파는 것은 **자기수탁**(토큰이 지갑을 떠나지 않음)인데, 그건 사실이라 카드로 만들 거리가 아니다. 문서를 읽고 찾은 카드가 될 지점은 두 문장을 나란히 놓았을 때 드러난다 — ① 공식 예시가 "10만 달러 잔고 → 세 포지션이 합계 30만 달러 호가", ② 공식 문서가 "그 순간 잔고가 부족하면 스왑은 그냥 revert 된다". 즉 **호가된 깊이는 약속이 아니라 상한**이고, 자기수탁의 대가로 호가와 체결 가능성이 분리됐다. 게다가 공개 문서는 *두 주문이 같은 잔고를 동시에 노릴 때* 무슨 일이 벌어지는지를 설명하지 않아, 측정할 빈칸이 남아 있다. 이 형태는 `stake-concentration` 카드와 동일하다(겉보기엔 독립 단위 N개, 실제 독립성의 단위는 더 작다) — 검증인/ASN에서 오더북/잔고로 옮겼을 뿐이라, 같은 사고 도구를 다른 도메인에 적용한 짝으로 삼았다. 대안으로 검토한 별도 카드 둘 중 `withdrawal-authority-models`(approve+pull vs Permit2 vs ERC-4337 세션키)는 **독립 카드로 만들지 않고 이 카드의 한 섹션으로 접었다** — 기존 AA·AP2·ERC-7702 카드와 겹쳐 목록만 묽어지기 때문. `aqua-vs-amm-capital`(자본 효율 비교)은 이번엔 보류. 신규 항목이라 `status:"soon"`, `date`·`href` 없음 — Planned 기본값 규칙.

**Change:** `lib/poc-cards.ts`에 `aqua-shared-liquidity` 카드 추가(`rwa-multichain` 뒤, `aml-compliance` 앞 — soon 묶음 앞쪽). `howItWorks`는 문서화된 동작(allowance는 에스크로가 아닌 권한 상한, SwapVM이 원자적으로 pull) → 측정 계획(anvil 포크에서 잔고의 3배를 호가하는 포지션 셋, 같은 블록에 경합 주문, 잔고를 호가 대비 90%·50%·10%로 스윕, 산출물은 실현/광고 깊이 곡선 + revert 비율 + taker 가스) → 인출 권한 모델 비교 섹션 순으로 구성. 출처는 기존 관례대로 `howTo` 끝에 평문 첨부. `pnpm docs:pocs`로 재생성 — `docs/topics/pocs-aqua-shared-liquidity.html` 신규 생성, 카드 수 36→37.

**Result:** `npx tsc --noEmit` 통과(exit 0). 목록에서 **6번**(DONE 4개 + `rwa-multichain` 다음)으로 노출되고 `rwa-multichain`의 "soon 묶음 맨 앞" 위치는 유지. 생성 HTML 38개 전수 검사 — 태그 짝·로컬 링크 신규 이슈 0건. 검출된 2건(`docs/index.html`의 div 28/27 불일치, `file:///Users/jay/...` 절대경로 링크 1건)은 모두 HEAD에도 동일하게 존재하는 **기존 이슈**로 이번 변경과 무관.
