# 인라이닝·루프 변환·자동 벡터화 — LICM(불변식 끌어올리기)과 루프 언롤링이 연산 횟수를 어떻게 줄이는지 센다.

def naive_scale_shift(xs, a, b):
    ops = 0
    out = []
    for x in xs:
        invariant = a * b + 1     # 매 반복 다시 계산됨 (루프 불변식인데 안 끌어올림)
        ops += 2
        out.append(x + invariant)
        ops += 1
    return out, ops

def licm_scale_shift(xs, a, b):
    ops = 0
    invariant = a * b + 1         # 루프 밖으로 한 번만 끌어올림
    ops += 2
    out = []
    for x in xs:
        out.append(x + invariant)
        ops += 1
    return out, ops

def unrolled_sum(xs, factor=4):
    # 루프를 factor개씩 묶어 반복 증분/조건 검사 오버헤드를 줄인다 (unrolling)
    total, n, i, iterations = 0, len(xs), 0, 0
    while i + factor <= n:
        total += xs[i] + xs[i + 1] + xs[i + 2] + xs[i + 3]
        i += factor
        iterations += 1
    while i < n:
        total += xs[i]
        i += 1
        iterations += 1
    return total, iterations

xs = list(range(1, 21))
r1, ops1 = naive_scale_shift(xs, 3, 5)
r2, ops2 = licm_scale_shift(xs, 3, 5)
assert r1 == r2

total_unrolled, iters = unrolled_sum(xs, factor=4)
assert sum(xs) == total_unrolled

print(f"결과 동일: {r1 == r2}, naive 연산수={ops1}, LICM 연산수={ops2} "
      f"(불변식 재계산 {len(xs) - 1}회 절약)")
print(f"합계={total_unrolled}: naive 반복수={len(xs)}, unrolled(factor=4) 반복수={iters} "
      f"(루프 오버헤드 ~{len(xs) - iters}회 절약)")
