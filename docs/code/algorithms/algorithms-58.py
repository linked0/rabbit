# 나카모토 합의의 확률적 최종성 — 공격자 해시파워 비율과 확인 수(confirmation)에 따른
# 되돌림(reorg) 성공 확률을 랜덤 워크 시뮬레이션으로 추정한다 (selfish mining 없이 정직한 다수 가정).

import random

random.seed(11)

def simulate_reorg_attempt(attacker_ratio, confirmations, max_steps=10000):
    """정직한 체인이 confirmations만큼 앞서 있을 때, 공격자가 따라잡는지 랜덤 워크로 시뮬레이션.
    lead > 0: 정직한 체인이 앞선 블록 수. 공격자가 lead를 0 이하로 만들면 추월 성공."""
    lead = confirmations
    for _ in range(max_steps):
        if random.random() < attacker_ratio:
            lead -= 1  # 공격자가 블록을 캔다
        else:
            lead += 1  # 정직한 채굴자가 블록을 캔다
        if lead <= 0:
            return True  # 공격자가 따라잡음 (reorg 성공)
        if lead > confirmations + 50:
            return False  # 격차가 충분히 벌어져 사실상 안전
    return False

def estimate_reorg_probability(attacker_ratio, confirmations, trials=2000):
    successes = sum(
        simulate_reorg_attempt(attacker_ratio, confirmations) for _ in range(trials)
    )
    return successes / trials

print("공격자 해시파워 비율별, 확인 수(confirmation)에 따른 되돌림 성공 확률 (시뮬레이션):\n")
for attacker_ratio in [0.10, 0.30, 0.45]:
    print(f"attacker_ratio = {attacker_ratio}")
    for conf in [1, 3, 6]:
        p = estimate_reorg_probability(attacker_ratio, conf, trials=1000)
        print(f"  confirmations={conf}: 되돌림 확률 ≈ {p*100:.1f}%")
    print()

print("-> 확인 수가 늘수록, 공격자 비율이 낮을수록 되돌림 확률이 지수적으로 감소한다.")
print("   (해시파워가 정직한 쪽보다 크면(>=50%) 확인 수와 무관하게 결국 따라잡는다.)")
