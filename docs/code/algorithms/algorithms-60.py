# 싱글슬롯 파이널리티와 서명 집계 병목 — 검증자 수가 늘수록 서명 집계·전파 비용이 커져
# 슬롯 시간 예산을 넘길 수 있음을 간단한 비용 모델로 보여준다.

SLOT_BUDGET_MS = 4000  # 예: 4초 슬롯

def aggregation_cost_ms(n_validators, per_signature_cost_us=2.0, tree_fanout=64):
    """BLS 서명 집계 비용을 흉내: 서명 검증/병합 비용 + 계층적 집계 트리를 통과하는 라운드 수"""
    merge_cost_ms = (n_validators * per_signature_cost_us) / 1000
    import math
    # 위원회 기반 계층적 집계: fanout마다 한 라운드, 각 라운드에 고정 전파 지연이 붙는다
    rounds = max(1, math.ceil(math.log(n_validators, tree_fanout))) if n_validators > 1 else 1
    propagation_ms_per_round = 150
    return merge_cost_ms + rounds * propagation_ms_per_round, rounds

print(f"슬롯 예산: {SLOT_BUDGET_MS}ms\n")
for n_validators in [1_000, 100_000, 1_000_000, 2_000_000]:
    cost_ms, rounds = aggregation_cost_ms(n_validators)
    remaining = SLOT_BUDGET_MS - cost_ms
    status = "여유 있음" if remaining > 0 else "슬롯 예산 초과!"
    print(f"검증자 {n_validators:>9,}명: 집계 비용 ≈ {cost_ms:7.1f}ms "
          f"(전파 {rounds}라운드) -> 잔여 {remaining:7.1f}ms -> {status}")

print("\n완화 방향 비교 (2,000,000 검증자 기준):")
baseline_cost, _ = aggregation_cost_ms(2_000_000, tree_fanout=64)
committee_cost, rounds = aggregation_cost_ms(2_000_000 // 100, tree_fanout=64)  # 위원회로 1/100 축소
print(f"  전체 검증자 직접 집계: {baseline_cost:.1f}ms")
print(f"  위원회(1/100) 기반 집계: {committee_cost:.1f}ms (라운드 {rounds}) "
      f"-> 슬롯 예산 내로 줄어듦: {committee_cost < SLOT_BUDGET_MS}")
