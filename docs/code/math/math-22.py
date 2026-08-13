# 고유값/고유벡터 — Av = λv 를 수치로 검증하고, 대각화 A=PDP^-1 로 A^n 계산을 단순화한다.

import numpy as np

A = np.array([[4.0, 1.0], [2.0, 3.0]])

eigvals, eigvecs = np.linalg.eig(A)
print("A =\n", A)
print(f"\n고유값: {eigvals}")
print("고유벡터(열 벡터):\n", eigvecs)

# 검증: 각 고유쌍에 대해 Av == λv
for i in range(len(eigvals)):
    lam, v = eigvals[i], eigvecs[:, i]
    lhs, rhs = A @ v, lam * v
    print(f"\nλ_{i}={lam:.4f}: Av={lhs}, λv={rhs}, 일치? {np.allclose(lhs, rhs)}")

# 대각화: A = P D P^-1  →  A^n = P D^n P^-1 (대각원소만 거듭제곱하면 됨)
P = eigvecs
D = np.diag(eigvals)
P_inv = np.linalg.inv(P)

n = 5
A_power_direct = np.linalg.matrix_power(A, n)
A_power_via_diag = (P @ np.diag(eigvals ** n) @ P_inv).real

print(f"\nA^{n} 직접 계산:\n{A_power_direct}")
print(f"A^{n} 대각화로 계산 (P D^{n} P^-1):\n{np.round(A_power_via_diag, 6)}")
print(f"일치? {np.allclose(A_power_direct, A_power_via_diag)}")
