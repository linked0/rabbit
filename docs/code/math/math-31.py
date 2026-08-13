# Day 31 — 뉴턴법/고정점 반복(StableSwap 필수)
# f(x) = x^2 - 2 의 근(sqrt(2))을 뉴턴법으로 찾고, 오차가 제곱으로 줄어드는 이차수렴을 확인한다.

import math


def f(x):
    return x ** 2 - 2


def f_prime(x):
    return 2 * x


x = 1.0  # 초기값
true_root = math.sqrt(2)
print(f"뉴턴법으로 sqrt(2) = {true_root:.10f} 근사:\n")

prev_error = None
for step in range(6):
    error = abs(x - true_root)
    ratio = error / (prev_error ** 2) if prev_error else float("nan")
    print(f"step {step}: x = {x:.10f}, error = {error:.2e}, error/prev_error^2 = {ratio:.4f}")
    prev_error = error
    x = x - f(x) / f_prime(x)

print(f"\n최종 x = {x:.12f}")
print("오차/이전오차^2 값이 일정 상수로 수렴 -> 이차수렴(quadratic convergence)의 증거")
