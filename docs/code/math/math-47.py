# 라그랑주 보간 + Reed-Solomon — GF(p) 위에서 k=3,n=5 RS 인코딩 후 소실 2개 복구
# k개의 점으로 차수 k-1 다항식이 유일 결정된다는 사실을 그대로 부호화/복호화에 사용한다.

p = 97  # 작은 소수 유한체 GF(97)

def gf_inv(x):
    return pow(x, -1, p)

def poly_eval(coeffs, x):
    """coeffs[i]는 x^i의 계수. Horner's method로 f(x) mod p 계산."""
    y = 0
    for c in reversed(coeffs):
        y = (y * x + c) % p
    return y

def lagrange_interpolate(points, x_target=0):
    """points = [(x_i, y_i), ...] 로부터 f(x_target)을 복원 (기본: 상수항 f(0))."""
    total = 0
    for i, (xi, yi) in enumerate(points):
        num, den = 1, 1
        for j, (xj, _) in enumerate(points):
            if i == j:
                continue
            num = (num * (x_target - xj)) % p
            den = (den * (xi - xj)) % p
        total = (total + yi * num * gf_inv(den)) % p
    return total

# 원본 데이터 3개 심볼(k=3)을 다항식 계수로 삼는다: f(x) = c0 + c1*x + c2*x^2
secret_data = [17, 42, 5]  # c0=17(예: 복원 대상), c1=42, c2=5
k, n = 3, 5

# n=5개의 서로 다른 평가점(1..5)에서 계산한 값이 코드워드(RS 부호)
codeword = [(x, poly_eval(secret_data, x)) for x in range(1, n + 1)]
print("Reed-Solomon 코드워드 (x, f(x)):", codeword)

# 5개 중 2개(x=2, x=4)가 소실됐다고 가정 — k=3개만 있으면 복원 가능해야 한다
surviving = [pt for pt in codeword if pt[0] not in (2, 4)]
print("소실 후 살아남은 점:", surviving)

recovered_c0 = lagrange_interpolate(surviving, x_target=0)
print(f"라그랑주 보간으로 복원한 f(0)=c0: {recovered_c0}  (원본과 일치: {recovered_c0 == secret_data[0]})")

# 전체 다항식(3개 계수) 자체도 세 점으로 완전히 복원되는지 확인 (x=0,1,2 세 지점에서 값 비교)
for x_check in (0, 1, 2, 3, 4, 5):
    original = poly_eval(secret_data, x_check)
    via_interp = lagrange_interpolate(surviving, x_target=x_check)
    assert original == via_interp
print("모든 x에서 원본 다항식과 보간 결과 일치 (n-k=2개 소실까지 복구 가능, MDS 부호 성질).")
