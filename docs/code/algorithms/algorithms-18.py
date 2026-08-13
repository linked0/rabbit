# 조합 생성·그레이 코드 — 반사 이진 그레이 코드를 생성하고 인접 코드의 해밍 거리가 항상 1임을 검증한다.

def gray_code(n):
    return [i ^ (i >> 1) for i in range(1 << n)]      # i와 i>>1의 XOR

def hamming_distance(a, b):
    return bin(a ^ b).count("1")

def to_bits(x, n):
    return format(x, f"0{n}b")

n = 4
codes = gray_code(n)

# 인접 코드가 정확히 1비트만 다른지 검증 (원형으로 마지막→처음도 포함)
distances = [hamming_distance(codes[i], codes[(i + 1) % len(codes)]) for i in range(len(codes))]
assert all(d == 1 for d in distances), "그레이 코드 인접 거리 위반!"

# 그레이 코드 순서로 만든 부분집합과 단순 이진 카운팅 순서로 만든 부분집합이
# "집합으로서는" 동일한지 확인 (순서만 다르고 원소 전체는 같아야 함)
binary_order = list(range(1 << n))
assert set(codes) == set(binary_order)

print(f"n={n} 그레이 코드 ({len(codes)}개):")
for i, c in enumerate(codes):
    prev_dist = distances[i - 1] if i else distances[-1]
    print(f"  step {i:2d}: {to_bits(c, n)}  (직전과 해밍거리={prev_dist})")
print("모든 인접 쌍의 해밍 거리 == 1:", all(d == 1 for d in distances))
print("이진 카운팅과 원소 집합 동일:", set(codes) == set(binary_order))
