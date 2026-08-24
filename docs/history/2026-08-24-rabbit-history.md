# 2026-08-24 — rabbit 작업 이력

> 소스 문서: 없음 — jay가 PoC 카드를 지목해 직접 지시. 대상은 [lib/poc-cards.ts](../../lib/poc-cards.ts)의 `agentic-intent-veto`. 전날 항목은 [2026-08-21-rabbit-history.md](2026-08-21-rabbit-history.md).

### PoC 카드 `agentic-intent-veto`("한도는 틀린 불변식이다")를 done 으로

**Cause:** jay가 "The budget is the wrong invariant" 카드를 done 으로 바꾸라고 지시.

**Reasoning:** `aqua-shared-liquidity` 때와 같은 판단이다 — **상태 플래그만 뒤집으면 카드가 자기 배지와 모순된다.** 이 카탈로그의 done 은 `oz-relayer` 패턴(사고가 완결됐다는 뜻이지 코드가 돈다는 뜻이 아니다)이고, done 카드는 ① 정렬 기준인 `date`(완결 선언일)를 갖고 ② `howTo` 가 "무엇을 시작할지"가 아니라 **"무엇을 정리했는지" 한 줄 요약**이다. 이 카드의 `howTo` 는 `"Not yet scoped — …"` 로 시작하고 있었다. `purpose`·`howItWorks` 는 손대지 않았다 — 적대적 판매자 사례와 인텐트 거부 설계는 **미완의 계획이 아니라 결과물**이기 때문이다.

**Change:** `status: "soon"` → `"done"`, `date: "2026-08-24"` 추가, `howTo`/`howToKo` 를 완결 요약으로 재작성 — "한도가 왜 묶어야 할 대상이 아닌가: 100달러 중 50달러를 엉뚱한 것에 쓴 에이전트는 모든 검사를 통과했고, 온체인에는 지급거절이 없다". 해커톤 출처(Google Cloud × Solana, 2026-08)는 보존하되 "적대적 판매자 사례는 논증으로 가는 단계가 아니라 논증 그 자체"로 시제를 바꿨다.

**Result:** `tsc --noEmit` 통과. 상태 분포 done 6→7, soon 44→43. 날짜가 가장 최신이라 **done 묶음 맨 앞**으로 이동 — 렌더 순서 agentic-intent-veto → aqua-shared-liquidity → rwa-multichain → agent → oz-relayer → dvt → stake-concentration. **작업 중 확인한 것:** 다른 세션이 `ca436dc`·`3e02f7f`·`c6d9b15` 세 커밋을 main 에 올려 카드가 51→53장이 되어 있었다(L1 zkEVM optional proofs, governance capture cost). 이 브랜치는 그 위에서 갈라져 나왔으므로 충돌 없이 함께 올라간다.
