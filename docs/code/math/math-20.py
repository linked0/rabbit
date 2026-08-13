# 유한체 GF(p) 위 선형대수 — 페르마 소정리로 모듈러 역원을 구하고,
# 가우스 소거법을 mod p 로 그대로 적용해 Ax=b (mod p) 를 정확히 푼다.

P = 17  # 작은 소수를 법으로 사용


def mod_inv(a: int, p: int = P) -> int:
    return pow(a % p, p - 2, p)  # 페르마 소정리: a^(p-1) ≡ 1  =>  a^(p-2) ≡ a^-1


def gauss_solve_mod_p(A: list, b: list, p: int = P) -> list:
    n = len(A)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]  # 첨가행렬
    for col in range(n):
        pivot_row = next(r for r in range(col, n) if M[r][col] % p != 0)  # 실수와 달리 크기 비교 불필요
        M[col], M[pivot_row] = M[pivot_row], M[col]
        inv = mod_inv(M[col][col], p)
        M[col] = [(x * inv) % p for x in M[col]]  # 피벗을 1로
        for r in range(n):
            if r != col and M[r][col] != 0:
                factor = M[r][col]
                M[r] = [(M[r][k] - factor * M[col][k]) % p for k in range(n + 1)]
    return [row[-1] for row in M]


A = [[2, 3], [5, 1]]
b = [7, 4]

x = gauss_solve_mod_p(A, b)
print(f"GF({P}) 위에서 Ax ≡ b (mod {P}) 풀이: x = {x}")

# 검산: Ax mod p == b
check = [sum(A[i][j] * x[j] for j in range(2)) % P for i in range(2)]
print(f"검산 Ax mod {P} = {check}, b = {b} → {'일치' if check == b else '불일치'}")

print(f"\n예: 5의 모듈러 역원 mod {P} = {mod_inv(5)}  (검산: 5*inv mod {P} = {5 * mod_inv(5) % P})")
