# Day 34 — 볼록집합/볼록함수 판별
# 정의(선분 부등식)와 2차 조건(Hessian이 준정부호)으로 볼록함수 여부를 판별한다.

import numpy as np


def is_convex_by_definition(f, x, y, n_thetas=11):
    """f(theta*x + (1-theta)*y) <= theta*f(x) + (1-theta)*f(y) 가 모든 theta에서 성립하는지 확인."""
    for theta in np.linspace(0, 1, n_thetas):
        lhs = f(theta * x + (1 - theta) * y)
        rhs = theta * f(x) + (1 - theta) * f(y)
        if lhs > rhs + 1e-9:
            return False
    return True


def f_convex(x):  # f(x) = x^2, 볼록함수
    return x ** 2


def f_nonconvex(x):  # f(x) = -x^2 + sin(4x)*3, 오목/비볼록 성격
    return -(x ** 2) + 3 * np.sin(4 * x)


x1, x2 = -2.0, 3.0
print(f"f(x)=x^2 은 [{x1},{x2}]에서 볼록? -> {is_convex_by_definition(f_convex, x1, x2)}")
print(f"f(x)=-x^2+3sin(4x) 는 [{x1},{x2}]에서 볼록? -> {is_convex_by_definition(f_nonconvex, x1, x2)}")


# 다변수: Hessian이 준정부호(고유값이 모두 0 이상)이면 볼록
def hessian_psd(H):
    eigenvalues = np.linalg.eigvalsh(H)
    return np.all(eigenvalues >= -1e-9), eigenvalues


# g(x,y) = x^2 + 2y^2 의 Hessian은 상수: [[2,0],[0,4]]
H_convex = np.array([[2.0, 0.0], [0.0, 4.0]])
psd, eigs = hessian_psd(H_convex)
print(f"\ng(x,y)=x^2+2y^2 의 Hessian 고유값 = {eigs} -> 준정부호(볼록)? {psd}")

# h(x,y) = x^2 - y^2 (안장점 형태) 의 Hessian
H_saddle = np.array([[2.0, 0.0], [0.0, -2.0]])
psd2, eigs2 = hessian_psd(H_saddle)
print(f"h(x,y)=x^2-y^2 의 Hessian 고유값 = {eigs2} -> 준정부호(볼록)? {psd2}")
