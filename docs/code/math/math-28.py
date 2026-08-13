# Day 28 — 편미분/그래디언트
# 다변수 함수의 편미분을 수치로 구해 그래디언트 벡터를 만들고, 최급상승 방향임을 확인한다.

import numpy as np


def f(v):
    x, y = v
    return x ** 2 + 3 * y ** 2 - 2 * x * y


def gradient(f, v, h=1e-6):
    grad = np.zeros_like(v)
    for i in range(len(v)):
        v_plus = v.copy()
        v_minus = v.copy()
        v_plus[i] += h
        v_minus[i] -= h
        grad[i] = (f(v_plus) - f(v_minus)) / (2 * h)
    return grad


v0 = np.array([1.0, 2.0])
grad = gradient(f, v0)
print(f"f({v0}) = {f(v0):.4f}")
print(f"gradient = {grad}")

# 그래디언트 방향으로 조금 이동하면 함수값이 증가, 반대 방향이면 감소해야 한다.
step = 0.01
unit = grad / np.linalg.norm(grad)
f_plus = f(v0 + step * unit)
f_minus = f(v0 - step * unit)
print(f"\ngradient 방향으로 이동: f = {f_plus:.6f} (증가해야 함)")
print(f"반대 방향으로 이동:   f = {f_minus:.6f} (감소해야 함)")
print(f"원래 값:              f = {f(v0):.6f}")
