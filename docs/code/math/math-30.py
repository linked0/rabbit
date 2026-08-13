# Day 30 — 라그랑주/KKT(개념)
# 등식 제약 x + y = 1 아래에서 f(x,y) = x^2 + y^2 최소화를 라그랑주 승수법으로 푼다.
# L(x,y,lam) = x^2 + y^2 - lam*(x + y - 1); 정상점 조건: 2x=lam, 2y=lam, x+y=1

import numpy as np

# 정상점 조건을 선형연립방정식으로 세운다: [2, 0, -1; 0, 2, -1; 1, 1, 0] [x,y,lam]^T = [0,0,1]^T
A = np.array([
    [2.0, 0.0, -1.0],
    [0.0, 2.0, -1.0],
    [1.0, 1.0, 0.0],
])
b = np.array([0.0, 0.0, 1.0])

x, y, lam = np.linalg.solve(A, b)
print(f"라그랑주 해: x = {x:.4f}, y = {y:.4f}, lambda = {lam:.4f}")
print(f"제약 확인 x + y = {x + y:.4f} (목표: 1)")
print(f"목적함수 f(x,y) = {x**2 + y**2:.6f}")


def f(x, y):
    return x ** 2 + y ** 2


# 대칭성으로 예상되는 답 (0.5, 0.5)과 비교, 제약을 만족하는 다른 점들과 비교해 최소임을 확인
print("\n제약선 위 다른 점들과 비교 (모두 x+y=1을 만족):")
for t in [0.0, 0.3, 0.5, 0.7, 1.0]:
    xt, yt = t, 1 - t
    print(f"  (x,y)=({xt:.2f},{yt:.2f}) -> f = {f(xt, yt):.6f}")
