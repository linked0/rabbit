# 2026-08-24 — rabbit 작업 이력

> 소스 문서: 없음 — jay가 PoC 카드를 지목해 직접 지시. 대상은 [lib/poc-cards.ts](../../lib/poc-cards.ts)의 `agentic-intent-veto`. 전날 항목은 [2026-08-21-rabbit-history.md](2026-08-21-rabbit-history.md).

### PoC 카드 `agentic-intent-veto`("한도는 틀린 불변식이다")를 done 으로

**Cause:** jay가 "The budget is the wrong invariant" 카드를 done 으로 바꾸라고 지시.

**Reasoning:** `aqua-shared-liquidity` 때와 같은 판단이다 — **상태 플래그만 뒤집으면 카드가 자기 배지와 모순된다.** 이 카탈로그의 done 은 `oz-relayer` 패턴(사고가 완결됐다는 뜻이지 코드가 돈다는 뜻이 아니다)이고, done 카드는 ① 정렬 기준인 `date`(완결 선언일)를 갖고 ② `howTo` 가 "무엇을 시작할지"가 아니라 **"무엇을 정리했는지" 한 줄 요약**이다. 이 카드의 `howTo` 는 `"Not yet scoped — …"` 로 시작하고 있었다. `purpose`·`howItWorks` 는 손대지 않았다 — 적대적 판매자 사례와 인텐트 거부 설계는 **미완의 계획이 아니라 결과물**이기 때문이다.

**Change:** `status: "soon"` → `"done"`, `date: "2026-08-24"` 추가, `howTo`/`howToKo` 를 완결 요약으로 재작성 — "한도가 왜 묶어야 할 대상이 아닌가: 100달러 중 50달러를 엉뚱한 것에 쓴 에이전트는 모든 검사를 통과했고, 온체인에는 지급거절이 없다". 해커톤 출처(Google Cloud × Solana, 2026-08)는 보존하되 "적대적 판매자 사례는 논증으로 가는 단계가 아니라 논증 그 자체"로 시제를 바꿨다.

**Result:** `tsc --noEmit` 통과. 상태 분포 done 6→7, soon 44→43. 날짜가 가장 최신이라 **done 묶음 맨 앞**으로 이동 — 렌더 순서 agentic-intent-veto → aqua-shared-liquidity → rwa-multichain → agent → oz-relayer → dvt → stake-concentration. **작업 중 확인한 것:** 다른 세션이 `ca436dc`·`3e02f7f`·`c6d9b15` 세 커밋을 main 에 올려 카드가 51→53장이 되어 있었다(L1 zkEVM optional proofs, governance capture cost). 이 브랜치는 그 위에서 갈라져 나왔으므로 충돌 없이 함께 올라간다.

### 인피닛블록 Pre-A 공지: 기존 카드의 낡은 주장 정정 + 새 카드 `cap-table-ceiling`

> 소스 문서: 없음 — jay가 인피닛블록 대표의 Pre-A 마무리 공지(LinkedIn, 2026-08-24)를 붙여넣고 지시. 나흘 전 같은 회사 뉴스로 만든 카드는 `fisheries-receivable-rail`([2026-08-21 이력](2026-08-21-rabbit-history.md) 참조).

**Cause:** jay가 인피닛블록 Pre-A 공지를 PoC 항목으로 요청. 공지 내용 — 전략적 투자자 **Sh수협은행·iM뱅크·HFR(KOSDAQ 230240)**, 국내 **은행 지분 약 30%**, SK증권 포함 시 **40%에 육박**.

**Reasoning:** 먼저 **기존 카드가 틀려졌다.** 나흘 전 `fisheries-receivable-rail`의 purpose는 "은행 **한 곳**이 14.95%"를 축으로 세워져 있었는데, 공지는 은행이 **둘 이상**이고 합계 약 30%라고 말한다. 그대로 두면 사실 오류가 되므로 해당 문단에 갱신 문단을 붙였다. 다만 **새 사실은 기존 독해를 무너뜨리지 않고 날카롭게 만든다** — 은행 합계가 30%인데 그중 하나가 14.95%라면 나머지도 같은 한도 바로 아래에 앉아 있다는 뜻이다. **그리고 그게 새 질문이고, 서비스 설계 카드에 들어갈 내용이 아니라서 카드를 뗐다.** 기존 카드는 *무엇을 만들 수 있나*, 새 카드는 *누가 쥐고 있나*다.

**Change:** ① `fisheries-receivable-rail`의 `purpose`/`purposeKo`에 "2026-08-24 갱신" 문단 추가, `cap-table-ceiling`로 연결. ② 새 카드 `cap-table-ceiling` — "한도는 보유자별이고, 지배력은 그렇지 않다", `status: "soon"`, 기존 카드 **바로 뒤**(같은 회사에서 갈라진 두 질문이라 붙여 둠). 내용은 승인 층위 표(개별 14.95% → 심사 미발동 / 두 번째 은행 → 동일 / **합계 30% → 보는 절차 없음**), 이 수탁사가 표준 레일이 됐을 때 40% 계층이 무엇인지의 표, `stake-concentration` 방법을 주주명부에 적용하는 측정 5단계.

**Result:** 카드 53→54장 렌더, 키 57개 중복 0, `tsc --noEmit` 통과. **카드가 이 카탈로그의 반복되는 형태에 또 하나를 더한다** — `stake-concentration`(검증인), `aqua-shared-liquidity`(오더북), `dkg-resharing`(키 위원회)에 이어 **주주명부**에서 같은 것을 찾았다: 겉보기엔 독립 단위 N개인데 실제 독립성의 단위는 더 작다. **의도적으로 넣은 안전장치 둘:** 첫째, 담합 주장이 아님을 본문에 못 박았다 — 상관된 행동에 음모는 필요 없고 공유된 유인이면 충분하며, 같은 감독기관이 그것을 제공한다(검증인이 같은 클라우드를 쓰는 것과 같은 논리). 둘째, **`howTo`의 첫 작업을 만들기가 아니라 질문으로 두었다** — 공동보유·동일인 같은 개념이 서로 무관한 은행들의 동일 대상 보유에 미치는지 **먼저 확인해야** 하고, 미친다면 이 카드가 말하는 빈칸은 존재하지 않는다. 약 30%가 공시가 아니라 회사 진술이라는 점도 열린 질문에 적어 두었다.
