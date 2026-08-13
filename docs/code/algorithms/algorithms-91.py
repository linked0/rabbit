# 산술화 — R1CS·AIR·PLONKish
# y = x^3 + x + 5 (x=3 -> y=35) 를 R1CS 제약 A·z ∘ B·z = C·z 로 평탄화해 검증한다.

# witness 벡터 z = [1, out, x, sym1, y]  (0=상수, 1=공개출력, 2=입력, 3~4=중간값)
IDX = {"one": 0, "out": 1, "x": 2, "sym1": 3, "y": 4}
N = len(IDX)

def row(**coeffs):
    r = [0] * N
    for name, c in coeffs.items():
        r[IDX[name]] = c
    return r

# 제약 1: x * x = sym1
# 제약 2: sym1 * x = y
# 제약 3: (y + x + 5*one) * one = out
A = [row(x=1), row(sym1=1), row(y=1, x=1, one=5)]
B = [row(x=1), row(x=1), row(one=1)]
C = [row(sym1=1), row(y=1), row(out=1)]

def dot(r, z):
    return sum(a * b for a, b in zip(r, z))

def check_r1cs(z):
    for a, b, c in zip(A, B, C):
        if dot(a, z) * dot(b, z) != dot(c, z):
            return False
    return True

x = 3
sym1 = x * x
y = sym1 * x
out = y + x + 5
z = [1, out, x, sym1, y]

print("witness z =", z)
print("R1CS 제약 3개 모두 만족:", check_r1cs(z))

bad_z = z.copy()
bad_z[IDX["out"]] += 1  # 결과를 조작하면
print("조작된 out 은 거부됨:", not check_r1cs(bad_z))
