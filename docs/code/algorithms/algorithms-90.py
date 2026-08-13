# 유한체·다항식 산술과 NTT — 소수체 F_p 위에서 단위근을 이용한 NTT로 다항식 곱셈을
# O(n log n) 에 수행하고, 결과가 나이브 O(n^2) 합성곱과 정확히 일치함을 검증한다 (교육용).

MOD = 998244353          # NTT 친화 소수: MOD - 1 이 2의 큰 거듭제곱을 인수로 가짐
ROOT = 3                  # MOD 의 원시근

def ntt(a, invert):
    n = len(a)
    j = 0
    for i in range(1, n):    # bit-reversal permutation
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j ^= bit
        if i < j:
            a[i], a[j] = a[j], a[i]

    length = 2
    while length <= n:
        w = pow(ROOT, (MOD - 1) // length, MOD)
        if invert:
            w = pow(w, MOD - 2, MOD)  # 페르마 소정리로 역원 계산
        for i in range(0, n, length):
            wn = 1
            for k in range(length // 2):
                u = a[i + k]
                v = a[i + k + length // 2] * wn % MOD
                a[i + k] = (u + v) % MOD
                a[i + k + length // 2] = (u - v) % MOD
                wn = wn * w % MOD
        length <<= 1

    if invert:
        n_inv = pow(n, MOD - 2, MOD)
        for i in range(n):
            a[i] = a[i] * n_inv % MOD
    return a

def poly_multiply_ntt(a, b):
    n = 1
    while n < len(a) + len(b):
        n <<= 1
    fa = a + [0] * (n - len(a))
    fb = b + [0] * (n - len(b))
    ntt(fa, False)
    ntt(fb, False)
    fc = [(x * y) % MOD for x, y in zip(fa, fb)]
    return ntt(fc, True)[: len(a) + len(b) - 1]

def poly_multiply_naive(a, b):
    result = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        for j, y in enumerate(b):
            result[i + j] = (result[i + j] + x * y) % MOD
    return result

poly_a = [1, 2, 3, 4]      # 1 + 2x + 3x^2 + 4x^3
poly_b = [5, 6, 7]          # 5 + 6x + 7x^2

ntt_result = poly_multiply_ntt(poly_a[:], poly_b[:])
naive_result = poly_multiply_naive(poly_a, poly_b)

print("F_p with p =", MOD, "| primitive root =", ROOT)
print("NTT-based product:  ", ntt_result)
print("naive O(n^2) product:", naive_result)
print("NTT matches naive convolution exactly:", ntt_result == naive_result)
