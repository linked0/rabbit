# Day 38 — 랜덤워크/GBM(개념)
# 대칭 단순 랜덤워크를 시뮬레이션하고, 로그값이 랜덤워크를 따르는 기하 브라운 운동(GBM) 근사 경로도 만든다.

import random
import math

random.seed(1)

# 1) 대칭 단순 랜덤워크: 매 스텝 +1 또는 -1
n_steps = 20
walk = [0]
for _ in range(n_steps):
    step = random.choice([-1, 1])
    walk.append(walk[-1] + step)

print(f"단순 랜덤워크 경로 ({n_steps}스텝):")
print(walk)
print(f"최종 위치 = {walk[-1]}, 이론적 표준편차(sqrt(n)) = {math.sqrt(n_steps):.3f}\n")

# 2) 이산시간 GBM 근사: S_t = S_0 * exp(sum of small normal increments)
# dlogS = (mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z, Z ~ N(0,1)
S0 = 100.0
mu = 0.05      # 연간 기대수익률
sigma = 0.2    # 연간 변동성
n_gbm_steps = 10
dt = 1 / 252   # 하루 단위

prices = [S0]
for _ in range(n_gbm_steps):
    z = random.gauss(0, 1)
    drift = (mu - 0.5 * sigma ** 2) * dt
    diffusion = sigma * math.sqrt(dt) * z
    next_price = prices[-1] * math.exp(drift + diffusion)
    prices.append(next_price)

print(f"GBM 근사 가격 경로 ({n_gbm_steps}일):")
for i, p in enumerate(prices):
    print(f"  day {i}: {p:.4f}")
