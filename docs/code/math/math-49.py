# 엔트로피·정보·코딩 — 사건 하나의 정보량 -log2(p), 그리고 분포 전체의 섀넌 엔트로피.

import math

def entropy(probs: list[float]) -> float:
    return -sum(p * math.log2(p) for p in probs if p > 0)


fair_coin = [0.5, 0.5]
biased_coin = [0.9, 0.1]
fair_die = [1 / 6] * 6

for name, dist in [("공정한 동전", fair_coin), ("치우친 동전(0.9/0.1)", biased_coin), ("주사위", fair_die)]:
    h = entropy(dist)
    print(f"{name:20} H = {h:.4f} bits  (최대 = log2({len(dist)}) = {math.log2(len(dist)):.4f})")

# 치우친 분포일수록 "다음 결과가 뭘지 이미 어느 정도 안다" → 엔트로피(불확실성)가 낮다.
