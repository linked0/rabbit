# 리스크·포트폴리오 행렬(공분산·상관) — 세 자산의 수익률에서 공분산·상관행렬을 구하고
# 포트폴리오 분산 = w^T Σ w 가 개별 분산의 가중합보다 작아지는 분산투자 효과를 확인한다.

import numpy as np

rng = np.random.default_rng(42)
n_days = 500

# 자산 A, B는 서로 강한 양의 상관, 자산 C는 거의 무상관이 되도록 수익률 생성
factor = rng.normal(0, 0.01, n_days)
returns_A = factor + rng.normal(0, 0.003, n_days)
returns_B = factor + rng.normal(0, 0.003, n_days)
returns_C = rng.normal(0, 0.01, n_days)
R = np.vstack([returns_A, returns_B, returns_C])  # shape (3, n_days)

cov = np.cov(R)
corr = np.corrcoef(R)
print("공분산 행렬 Σ:\n", np.round(cov, 6))
print("\n상관계수 행렬:\n", np.round(corr, 3))

w = np.array([1 / 3, 1 / 3, 1 / 3])
portfolio_var = w @ cov @ w  # 이차형식 w^T Σ w
weighted_avg_var = w @ np.diag(cov)  # 상관을 무시하고 개별 분산만 가중합한 값

print(f"\n동일가중 포트폴리오 분산 (w^T Σ w) = {portfolio_var:.6f}")
print(f"상관 무시한 개별분산 가중합          = {weighted_avg_var:.6f}")
print(f"→ 실제 포트폴리오 분산이 더 {'작음' if portfolio_var < weighted_avg_var else '크거나 같음'}: "
      f"C가 A,B와 무상관이라 분산투자 효과가 발생")
