# ECC·디지털 서명 — 작은 소수체 위의 토이 타원곡선 + Schnorr 서명(교육용, 실서비스 금지)
# 곡선: y^2 = x^3 + a*x + b (mod p). secp256k1 규모가 아니라 원리를 보기 위한 장난감 파라미터.

p, a, b = 97, 2, 3
INF = None  # 무한원점(항등원)

def inv(x, m=p):
    return pow(x, -1, m)  # 파이썬 내장 모듈러 역원(내부적으로 확장 유클리드)

def on_curve(P):
    if P is INF:
        return True
    x, y = P
    return (y * y - (x ** 3 + a * x + b)) % p == 0

def point_add(P, Q):
    if P is INF:
        return Q
    if Q is INF:
        return P
    x1, y1 = P
    x2, y2 = Q
    if x1 == x2 and (y1 + y2) % p == 0:
        return INF  # P + (-P) = O
    if P == Q:
        lam = (3 * x1 * x1 + a) * inv(2 * y1) % p
    else:
        lam = (y2 - y1) * inv(x2 - x1) % p
    x3 = (lam * lam - x1 - x2) % p
    y3 = (lam * (x1 - x3) - y1) % p
    return (x3, y3)

def scalar_mul(k, P):
    R, base = INF, P
    while k > 0:
        if k & 1:
            R = point_add(R, base)
        base = point_add(base, base)
        k >>= 1
    return R

# 곡선 위의 점 하나를 찾아 생성원 G로 쓰고, 그 위수 n(G^n = O)을 직접 센다
G = next((x, y) for x in range(p) for y in range(p) if on_curve((x, y)))
n = 1
acc = G
while acc is not INF:
    acc = point_add(acc, G)
    n += 1
print(f"곡선 y^2=x^3+{a}x+{b} mod {p}, G={G}, G의 위수 n={n}")

# --- Schnorr 서명 (해시는 hashlib.sha256으로 대체한 단순화 버전, 교육용) ---
import hashlib, random

def H(*parts):
    m = hashlib.sha256("|".join(str(x) for x in parts).encode()).hexdigest()
    return int(m, 16) % n

d = 42 % n or 7          # 개인키
Q = scalar_mul(d, G)      # 공개키
message = "transfer 10 USDC to bob"

k = random.randrange(1, n)
R = scalar_mul(k, G)
e = H(R[0], message)
s = (k + e * d) % n
print(f"\n서명 (R, s) = ({R}, {s})")

# 검증: s*G =? R + e*Q
lhs = scalar_mul(s, G)
rhs = point_add(R, scalar_mul(e, Q))
print("검증 결과 s*G == R + e*Q :", lhs == rhs)

# 다른 메시지로는 같은 서명이 통과하지 못함을 확인
e_wrong = H(R[0], "transfer 10000 USDC to bob")
lhs_wrong = scalar_mul(s, G)
rhs_wrong = point_add(R, scalar_mul(e_wrong, Q))
print("변조된 메시지 검증(실패해야 정상) :", lhs_wrong == rhs_wrong)
