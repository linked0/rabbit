# 최소제곱법(Least Squares) — 과결정계 Ax=b를 lstsq로 풀고, 정규방정식 AᵀAx=Aᵀb 및
# "잔차는 열공간과 직교한다"는 기하적 성질을 직접 검증한다.

import numpy as np

# 직선 y = a*x + c 를 5개의 잡음 섞인 점에 최소제곱으로 맞추는 과결정계 (미지수 2개, 식 5개)
x_data = np.array([0.0, 1.0, 2.0, 3.0, 4.0])
y_data = np.array([1.1, 2.9, 4.8, 7.2, 8.9])  # 대략 y ≈ 2x + 1 근처의 잡음 데이터

A = np.column_stack([x_data, np.ones_like(x_data)])  # [a, c]를 구하기 위한 설계행렬
b = y_data

x_lstsq, residuals, rank, sv = np.linalg.lstsq(A, b, rcond=None)
a_hat, c_hat = x_lstsq
print(f"lstsq 해: y ≈ {a_hat:.4f}*x + {c_hat:.4f}")

# 정규방정식으로 직접 풀어서 lstsq 결과와 일치하는지 확인 (교육적 검증용, 실무는 lstsq/QR 권장)
x_normal_eq = np.linalg.solve(A.T @ A, A.T @ b)
print(f"정규방정식(AᵀAx=Aᵀb) 해: {x_normal_eq}")
print(f"lstsq와 일치? {np.allclose(x_lstsq, x_normal_eq)}")

# 기하적 성질: 최적점에서 잔차 벡터는 A의 열공간과 직교 → Aᵀ(Ax-b) ≈ 0
residual = A @ x_lstsq - b
orthogonality = A.T @ residual
print(f"\n잔차 벡터: {np.round(residual, 4)}")
print(f"Aᵀ·잔차 (열공간과의 직교성, ≈0이어야 함): {np.round(orthogonality, 10)}")
