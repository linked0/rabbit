# Day 27 — 미분·기울기·연쇄법칙
# 수치미분으로 도함수를 근사하고, 연쇄법칙 f(g(x))의 도함수를 직접 계산과 비교한다.

def numerical_diff(f, x, h=1e-6):
    return (f(x + h) - f(x - h)) / (2 * h)


def f(x):
    return x ** 3 + 2 * x


def f_prime_exact(x):
    return 3 * x ** 2 + 2


x0 = 2.0
print(f"f'({x0}) 수치미분 근사 = {numerical_diff(f, x0):.6f}")
print(f"f'({x0}) 해석적 값   = {f_prime_exact(x0):.6f}")

# 연쇄법칙: h(x) = g(f(x)), g(u) = sin(u) 라 하면 h'(x) = g'(f(x)) * f'(x)
import math


def g(u):
    return math.sin(u)


def h(x):
    return g(f(x))


def h_prime_chain_rule(x):
    g_prime = math.cos(f(x))  # g'(u) = cos(u), u = f(x)
    return g_prime * f_prime_exact(x)


print(f"\nh'({x0}) 수치미분 근사 = {numerical_diff(h, x0):.6f}")
print(f"h'({x0}) 연쇄법칙 계산 = {h_prime_chain_rule(x0):.6f}")
