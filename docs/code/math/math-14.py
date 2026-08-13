# EIP-1559 수수료시장(base fee = AIMD) — 목표 가스 사용량 대비 초과/부족에 따라
# base fee 를 최대 ±12.5%/블록으로 조정하는 AIMD 컨트롤러를 재현한다.

GAS_LIMIT = 30_000_000
TARGET = GAS_LIMIT // 2          # 목표 사용량 = 가스 한도의 절반
MAX_CHANGE_DENOM = 8             # 블록당 최대 변화폭 = 1/8 (12.5%)


def next_base_fee(base_fee: float, gas_used: int) -> float:
    if gas_used == TARGET:
        return base_fee
    delta = base_fee * abs(gas_used - TARGET) // TARGET // MAX_CHANGE_DENOM
    delta = max(delta, 1)  # 스펙상 최소 1 wei는 움직인다
    if gas_used > TARGET:
        return base_fee + delta   # 혼잡 → 인상
    return max(base_fee - delta, 0)  # 여유 → 인하 (0 미만 방지)


# 블록별 실제 가스 사용량 시나리오: 혼잡 → 완화 → 정확히 목표
gas_used_per_block = [30_000_000, 30_000_000, 20_000_000, 10_000_000, 15_000_000, TARGET]

base_fee = 10 ** 9  # 1 gwei
print(f"target gas = {TARGET:,}, initial base fee = {base_fee:,} wei")
for i, used in enumerate(gas_used_per_block, start=1):
    new_fee = next_base_fee(base_fee, used)
    change_pct = (new_fee - base_fee) / base_fee * 100
    print(f"block {i}: gasUsed={used:>10,}  base_fee {base_fee:>12,} -> {new_fee:>12,} wei  ({change_pct:+.2f}%)")
    base_fee = new_fee

print(f"\n최종 base fee: {base_fee:,} wei — 목표 사용량에서는 그대로 유지됨을 확인")
