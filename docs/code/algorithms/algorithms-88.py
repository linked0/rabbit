# 다중정밀 산술(bignum) — Barrett 리덕션을 직접 구현해 나눗셈 없이 모듈러 축약을 하고,
# 파이썬 내장 % 연산과 결과가 일치하는지 검증한다 (Montgomery와 대비되는 단발성 리덕션 기법).

def barrett_precompute(modulus, k):
    """mu = floor(4^k / modulus) 를 미리 계산 — 이후 리덕션에서 나눗셈 대신 시프트+곱셈만 쓴다."""
    return (1 << (2 * k)) // modulus

def barrett_reduce(x, modulus, k, mu):
    """x < modulus^2 가정. 나눗셈 없이 근사 몫을 구하고 보정한다."""
    q_hat = (x * mu) >> (2 * k)
    r = x - q_hat * modulus
    while r >= modulus:      # 근사 오차 보정 (최대 2번이면 충분함이 알려져 있다)
        r -= modulus
    while r < 0:
        r += modulus
    return r

MODULUS = (1 << 61) - 1   # 토이 소수 모듈러스 (61비트)
K = MODULUS.bit_length()
MU = barrett_precompute(MODULUS, K)

import random
random.seed(7)
mismatches = 0
for _ in range(2000):
    a = random.getrandbits(60)
    b = random.getrandbits(60)
    product = a * b                      # 모듈러 곱셈에서 실제로 리덕션이 필요한 값
    expected = product % MODULUS         # 파이썬 내장 나눗셈 기반 리덕션
    got = barrett_reduce(product, MODULUS, K, MU)
    if got != expected:
        mismatches += 1

print("modulus:", MODULUS, "| k (bit length):", K)
print("precomputed mu = floor(4^k / modulus):", MU)
print("random trials:", 2000, "| mismatches vs builtin %:", mismatches)
print("Barrett reduction matches builtin modulo:", mismatches == 0)
print("note: Montgomery reduction instead converts to a special representation")
print("      once and amortizes it over many multiplications (e.g. modexp loops).")
