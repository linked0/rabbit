# 임계 서명·MPC·DKG — Shamir 비밀 분산으로 (t, n) 임계 스킴의 핵심(다항식 보간)을 구현한다.
# t개 지분이 모이면 비밀(상수항)을 복원하고, t-1개로는 아무 정보도 얻지 못함을 보인다. (교육용)

import secrets

PRIME = 2**127 - 1  # 큰 소수 체 (토이 규모)

def make_shares(secret_value, t, n):
    """t-1차 다항식을 무작위 계수로 만들고, n개 지분 (x, f(x))을 반환한다."""
    coeffs = [secret_value] + [secrets.randbelow(PRIME) for _ in range(t - 1)]
    def f(x):
        return sum(c * pow(x, i, PRIME) for i, c in enumerate(coeffs)) % PRIME
    return [(x, f(x)) for x in range(1, n + 1)]

def lagrange_interpolate_at_zero(shares):
    """t개 지분 (x_i, y_i) 으로부터 f(0) = 비밀을 라그랑주 보간으로 복원한다."""
    secret = 0
    for i, (xi, yi) in enumerate(shares):
        num, den = 1, 1
        for j, (xj, _) in enumerate(shares):
            if i == j:
                continue
            num = (num * -xj) % PRIME
            den = (den * (xi - xj)) % PRIME
        secret = (secret + yi * num * pow(den, -1, PRIME)) % PRIME
    return secret

SECRET_KEY = 424242424242424242
t, n = 3, 5  # (t,n) 임계: 5명 중 3명이 모여야 서명(복원) 가능

shares = make_shares(SECRET_KEY, t, n)
print(f"generated {n} shares for a ({t},{n}) threshold scheme")
print("shares:", shares)

recovered_with_t = lagrange_interpolate_at_zero(shares[:t])
print(f"recovered with exactly t={t} shares:", recovered_with_t)
print("matches original secret:", recovered_with_t == SECRET_KEY)

# t-1개(부족한 지분)로 복원을 시도하면 완전히 다른(무의미한) 값이 나온다
recovered_with_t_minus_1 = lagrange_interpolate_at_zero(shares[:t - 1] + [(999, 12345)])
print(f"attempting recovery with only t-1 shares gives garbage:", recovered_with_t_minus_1)
print("=> below threshold, the polynomial is underdetermined: any value is equally consistent")
