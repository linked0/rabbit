# 벡터·행렬·행렬곱·역행렬 — numpy로 기본 연산과, AB != BA(비교환성), A@A^-1=I 를 확인한다.

import numpy as np

A = np.array([[1.0, 2.0], [3.0, 4.0]])
B = np.array([[0.0, 1.0], [1.0, 0.0]])
v = np.array([1.0, 2.0])

print("A =\n", A)
print("A @ v (선형변환으로서의 행렬-벡터곱) =", A @ v)

AB = A @ B
BA = B @ A
print("\nA@B =\n", AB)
print("B@A =\n", BA)
commute = np.allclose(AB, BA)
print(f"A@B == B@A ? {commute} → 이 예처럼 행렬곱은 일반적으로 교환법칙이 성립하지 않는다")

det_A = np.linalg.det(A)
print(f"\ndet(A) = {det_A:.4f} (0이 아니므로 A는 가역)")

A_inv = np.linalg.inv(A)
identity_check = A @ A_inv
print("A @ A_inv =\n", np.round(identity_check, 10), "→ 단위행렬 I 확인")

# Ax = b 를 풀 때는 명시적 역행렬보다 solve()가 수치적으로 더 안정적이고 빠르다
b = np.array([5.0, 10.0])
x_via_solve = np.linalg.solve(A, b)
x_via_inv = A_inv @ b
print(f"\nAx=b 해: solve()={x_via_solve}, inv()@b={x_via_inv} (둘 다 일치, solve가 권장 방식)")
