# Day 33 — 테일러 급수(1차 근사)
# f(x) ≈ f(a) + f'(a)(x-a) 로 exp(x)를 a=0에서 선형근사하고, x가 a에서 멀어질수록 오차가 커짐을 본다.

import math


def f(x):
    return math.exp(x)


def f_prime(x):
    return math.exp(x)  # exp의 도함수는 자기 자신


def taylor_1st_order(x, a):
    return f(a) + f_prime(a) * (x - a)


a = 0.0
print(f"e^x 를 a={a} 에서 1차 테일러 근사:\n")
print(f"{'x':>6} {'실제값':>12} {'근사값':>12} {'오차':>12}")
for x in [0.01, 0.1, 0.3, 0.5, 1.0, 2.0]:
    exact = f(x)
    approx = taylor_1st_order(x, a)
    err = abs(exact - approx)
    print(f"{x:6.2f} {exact:12.6f} {approx:12.6f} {err:12.6f}")

print("\n오차는 대략 (x-a)^2 에 비례해서 커진다 (2차 항이 지배).")
for x in [0.1, 0.2, 0.4]:
    err = abs(f(x) - taylor_1st_order(x, a))
    print(f"  x={x}: 오차={err:.6f}, (x-a)^2={x**2:.6f}, 비율={err / x**2:.4f}")
