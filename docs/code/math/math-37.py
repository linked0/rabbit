# Day 37 — 집중부등식(Chebyshev·Hoeffding)
# 시뮬레이션으로 실제 이탈확률을 구하고, Chebyshev·Hoeffding 상한과 비교해 부등식이 보장임을 확인한다.

import random
import math

random.seed(0)

# Chebyshev: P(|X - mu| >= k*sigma) <= 1/k^2, X ~ Uniform(0,1) 표본평균으로 확인
n_trials = 200_000
mu_uniform = 0.5
var_uniform = 1 / 12
sigma_uniform = math.sqrt(var_uniform)

k = 2.0
count_exceed = 0
for _ in range(n_trials):
    x = random.uniform(0, 1)
    if abs(x - mu_uniform) >= k * sigma_uniform:
        count_exceed += 1

empirical_prob = count_exceed / n_trials
chebyshev_bound = 1 / k ** 2
print(f"Chebyshev: P(|X-mu|>={k}*sigma) 실제 = {empirical_prob:.4f}, 상한 1/k^2 = {chebyshev_bound:.4f}")
print(f"-> 실제 <= 상한 ? {empirical_prob <= chebyshev_bound}\n")

# Hoeffding: 독립 [0,1] 변수 n개 평균이 참평균에서 t 이상 벗어날 확률 <= 2*exp(-2*n*t^2)
n_samples = 100
t = 0.1
n_experiments = 20_000
count_exceed_hoeffding = 0
true_mean = 0.5

for _ in range(n_experiments):
    sample = [random.uniform(0, 1) for _ in range(n_samples)]
    sample_mean = sum(sample) / n_samples
    if abs(sample_mean - true_mean) >= t:
        count_exceed_hoeffding += 1

empirical_hoeffding = count_exceed_hoeffding / n_experiments
hoeffding_bound = 2 * math.exp(-2 * n_samples * t ** 2)
print(f"Hoeffding: P(|mean-mu|>={t}) 실제 = {empirical_hoeffding:.5f}, 상한 = {hoeffding_bound:.5f}")
print(f"-> 실제 <= 상한 ? {empirical_hoeffding <= hoeffding_bound}")
