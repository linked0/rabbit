# 페어링/KZG(개념) — f(X)-f(z)가 (X-z)로 나누어떨어진다는 인수정리가 KZG 증명의 핵심
# 실제 KZG는 이 몫 다항식을 페어링 기반 커밋먼트로 압축하지만, 여기선 그 대수적 뼈대만 GF(p)에서 재현한다.

p = 101  # 작은 소수 유한체

def poly_eval(coeffs, x):
    y = 0
    for c in reversed(coeffs):
        y = (y * x + c) % p
    return y

def poly_sub_const(coeffs, c):
    out = coeffs[:]
    out[0] = (out[0] - c) % p
    return out

def synthetic_division(coeffs, z):
    """(coeffs) / (X - z) 를 합성 나눗셈으로 계산. 몫의 계수와 나머지를 반환."""
    n = len(coeffs)
    quotient = [0] * (n - 1)
    remainder = coeffs[-1]
    for i in range(n - 2, -1, -1):
        quotient[i] = remainder % p
        remainder = (coeffs[i] + remainder * z) % p
    return quotient, remainder

# 예시 다항식 f(X) = 5 + 3X + 2X^2 + X^3  (계수: [5,3,2,1], 상수항이 index 0)
f = [5, 3, 2, 1]
z = 7
y = poly_eval(f, z)
print(f"f(X) = 5 + 3X + 2X^2 + X^3, z={z}  =>  y = f(z) = {y}")

# f(X) - y 는 반드시 (X - z)로 나누어떨어진다 (인수정리)
f_minus_y = poly_sub_const(f, y)
quotient, remainder = synthetic_division(f_minus_y, z)
print(f"몫 다항식 q(X) 계수 = {quotient}, 나머지 = {remainder}  (0이어야 정상)")
assert remainder == 0

# "증명"이 성립함을 재구성으로 검증: q(X)*(X - z) + y 를 다시 펼치면 f(X)와 완전히 같아야 한다
def poly_mul(a, b):
    out = [0] * (len(a) + len(b) - 1)
    for i, ai in enumerate(a):
        for j, bj in enumerate(b):
            out[i + j] = (out[i + j] + ai * bj) % p
    return out

reconstructed = poly_mul(quotient, [(-z) % p, 1])  # (X - z) = [-z, 1]
reconstructed[0] = (reconstructed[0] + y) % p
print("재구성한 f(X) 계수:", reconstructed, " 원본:", f, " 일치:", reconstructed == f)
print("\n실제 KZG는 이 q(X)를 SRS로 만든 상수크기 군 원소로 커밋하고, 검증자는 페어링 한 번으로")
print("commit(f) - y*G1 == commit(q) * (tau - z)*G2 관계를 확인한다 (여기선 다항식 자체로 원리만 재현).")
