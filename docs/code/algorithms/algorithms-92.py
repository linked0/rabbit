# 다항식 IOP — Schwartz-Zippel 보조정리: 서로 다른 두 다항식이 랜덤 점에서
# 우연히 같은 값을 낼 확률은 차수/체 크기(p)에 비례해 작아진다 (증명 크기 vs 검증 시간의 근거).

import random

p = 65537  # 작은 소수 유한체 GF(p)

def poly_eval(coeffs, x, p):
    # Horner's method, mod p
    result = 0
    for c in reversed(coeffs):
        result = (result * x + c) % p
    return result

def collision_rate(deg, trials, p):
    f = [random.randrange(p) for _ in range(deg + 1)]
    g = f.copy()
    g[0] = (g[0] + 1) % p  # f - g 는 0이 아닌 차수 deg 다항식
    hits = 0
    for _ in range(trials):
        r = random.randrange(p)
        if poly_eval(f, r, p) == poly_eval(g, r, p):
            hits += 1
    return hits / trials

trials = 20000
for deg in (1, 8, 64):
    rate = collision_rate(deg, trials, p)
    bound = deg / p  # Schwartz-Zippel 상한: 최대 deg/|F| 확률로 충돌
    print(f"deg={deg:3d}  관측 충돌률={rate:.6f}  이론 상한(deg/p)={bound:.6f}")

print("\n결론: 차수가 커질수록 충돌 확률 상한이 커지므로, 검증자가 신뢰할 수")
print("있으려면 체 크기 p 를 다항식 차수보다 충분히 크게 잡아야 한다.")
