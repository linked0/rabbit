# Day 35 — 조건부확률·베이즈·기대값·정규분포
# 질병 검사 예시로 베이즈 정리를 수치로 계산: P(질병|양성) = P(양성|질병)P(질병) / P(양성)

prior_disease = 0.01          # P(질병) — 사전확률(유병률)
p_positive_given_disease = 0.95   # P(양성|질병) — 민감도
p_positive_given_healthy = 0.05   # P(양성|건강) — 위양성률

p_healthy = 1 - prior_disease
p_positive = (p_positive_given_disease * prior_disease
              + p_positive_given_healthy * p_healthy)

p_disease_given_positive = (p_positive_given_disease * prior_disease) / p_positive

print(f"사전확률 P(질병) = {prior_disease}")
print(f"P(양성) (전체확률) = {p_positive:.4f}")
print(f"베이즈 정리로 계산한 P(질병|양성) = {p_disease_given_positive:.4f}")
print("-> 검사가 정확해 보여도 유병률이 낮으면 사후확률은 여전히 낮다는 직관을 확인한다.\n")

# 기대값과 정규분포: 표준정규분포에서 표본을 뽑아 표본평균이 이론적 기대값(0)에 가까워짐을 확인
import random

random.seed(42)
n = 100_000
samples = [random.gauss(mu=0, sigma=1) for _ in range(n)]
sample_mean = sum(samples) / n
sample_var = sum((s - sample_mean) ** 2 for s in samples) / n

print(f"N(0,1)에서 {n}개 표본 추출")
print(f"표본평균 = {sample_mean:.6f} (이론값 0)")
print(f"표본분산 = {sample_var:.6f} (이론값 1)")
