# 재귀관계와 생성함수(가볍게) — 피보나치 점화식을 (1) 메모이제이션 재귀, (2) 반복 계산,
# (3) 특성방정식 닫힌 형태(비네 공식)로 각각 구현해 세 방법의 결과가 일치하는지 확인.

from functools import lru_cache
import math

@lru_cache(maxsize=None)
def fib_memo(n):
    if n <= 1:
        return n
    return fib_memo(n - 1) + fib_memo(n - 2)   # F(n) = F(n-1) + F(n-2)

def fib_iter(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

def fib_closed(n):
    # 특성방정식 x^2 = x + 1 의 근 phi, psi 로부터 얻는 닫힌 형태(비네 공식).
    phi = (1 + math.sqrt(5)) / 2
    psi = (1 - math.sqrt(5)) / 2
    return round((phi ** n - psi ** n) / math.sqrt(5))

print(" n | memo | iter | closed")
for n in range(0, 16):
    m, i, c = fib_memo(n), fib_iter(n), fib_closed(n)
    assert m == i == c, f"불일치 at n={n}: {m}, {i}, {c}"
    print(f"{n:2} | {m:4} | {i:4} | {c:4}")

print("\n세 방법 모두 n=0..15 에서 일치.")

# 생성함수 관점: F(x) = x / (1 - x - x^2) 의 계수를 급수 전개로 뽑아 같은 수열이 나오는지 확인.
def fib_via_series(order):
    coeffs = [0] * (order + 1)
    coeffs[1] = 1  # 분자 x
    # (1 - x - x^2) * F(x) = x  =>  F[n] = F[n-1] + F[n-2] (n>=2), F[0]=0, F[1]=1
    for k in range(2, order + 1):
        coeffs[k] = coeffs[k - 1] + coeffs[k - 2]
    return coeffs

series = fib_via_series(15)
print("생성함수 급수 전개로 얻은 F(0..15):", series)
