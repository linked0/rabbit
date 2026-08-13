# 정수론·모듈러 산술 — 확장 유클리드로 모듈러 역원 구하기 + 페르마 소정리로 교차검증
# ax + ny = gcd(a, n) 을 풀어 gcd=1이면 x가 곧 a의 (mod n) 역원이다.

def ext_gcd(a, n):
    """확장 유클리드: (g, x, y) with a*x + n*y = g = gcd(a, n)."""
    old_r, r = a, n
    old_x, x = 1, 0
    old_y, y = 0, 1
    while r != 0:
        q = old_r // r
        old_r, r = r, old_r - q * r
        old_x, x = x, old_x - q * x
        old_y, y = y, old_y - q * y
    return old_r, old_x, old_y

def mod_inverse(a, n):
    g, x, _ = ext_gcd(a, n)
    if g != 1:
        raise ValueError(f"{a}는 mod {n}에서 역원이 없음 (gcd={g})")
    return x % n

p = 1_000_000_007  # 큰 소수
for a in (3, 12345, 999_999_999):
    inv = mod_inverse(a, p)
    check = (a * inv) % p
    fermat_inv = pow(a, p - 2, p)  # 페르마 소정리: a^(p-2) ≡ a^-1 (mod p)
    print(f"a={a:>10}  ext_gcd 역원={inv:>10}  a*inv mod p={check}  "
          f"페르마 역원과 일치={inv == fermat_inv}")

# 소수가 아닌 법에서는 gcd(a,n)=1일 때만 역원이 존재함을 확인
n = 20
for a in range(1, n):
    from math import gcd
    if gcd(a, n) == 1:
        print(f"mod {n}: a={a} 역원={mod_inverse(a, n)}")
