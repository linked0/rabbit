# PCA·SVD — 상관된 2D 합성 데이터에서 주성분(최대 분산 방향)을 SVD로 직접 구한다.

import numpy as np

rng = np.random.default_rng(0)
n = 300

# x, y가 강하게 상관되도록 만든 2D 데이터 (주된 퍼짐 방향이 대략 45도가 되게)
t = rng.normal(0, 3, n)
x = t + rng.normal(0, 0.3, n)
y = t * 0.6 + rng.normal(0, 0.3, n)
X = np.column_stack([x, y])  # shape (n, 2)

X_centered = X - X.mean(axis=0)  # PCA는 평균을 원점으로 옮긴 뒤 분산 방향을 찾는다

U, S, Vt = np.linalg.svd(X_centered, full_matrices=False)
print(f"특이값(Σ): {S}")
print("주성분 방향(V의 행, 분산이 큰 순서):\n", Vt)

pc1 = Vt[0]
angle_deg = np.degrees(np.arctan2(pc1[1], pc1[0]))
print(f"\n제1주성분(PC1) 방향 벡터 = {pc1}, x축 대비 각도 ≈ {angle_deg:.1f}도")

# 데이터를 PC1 축 하나에 투영 (2D -> 1D 차원축소)
projected = X_centered @ pc1
explained_var_ratio = (S ** 2) / np.sum(S ** 2)
print(f"\nPC1 하나로 설명되는 분산 비율 = {explained_var_ratio[0]:.4f}")
print(f"투영된 1D 값 예시(앞 5개): {np.round(projected[:5], 3)}")
