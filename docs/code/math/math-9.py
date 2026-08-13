# 카운팅 원리(순열·조합·이항계수) — nPr, nCr 을 직접 구현해 math.perm/math.comb 와 대조하고,
# 파스칼 항등식 C(n,k) = C(n-1,k-1) + C(n-1,k) 도 조합적으로 검증.

import math
from itertools import permutations, combinations

def n_perm(n, r):
    return math.factorial(n) // math.factorial(n - r)

def n_comb(n, r):
    return math.factorial(n) // (math.factorial(r) * math.factorial(n - r))

n, r = 8, 3
my_perm, my_comb = n_perm(n, r), n_comb(n, r)
print(f"P({n},{r}) 직접계산={my_perm}  math.perm={math.perm(n, r)}  일치? {my_perm == math.perm(n, r)}")
print(f"C({n},{r}) 직접계산={my_comb}  math.comb={math.comb(n, r)}  일치? {my_comb == math.comb(n, r)}")

# 실제로 나열해서 개수를 세어도 같은지 확인 (작은 n으로).
items = list(range(5))
listed_perm = len(list(permutations(items, 3)))
listed_comb = len(list(combinations(items, 3)))
print(f"\n{items} 에서 3개 뽑기: 나열해서 센 순열 수={listed_perm} (공식={n_perm(5,3)}), "
      f"조합 수={listed_comb} (공식={n_comb(5,3)})")

# 파스칼 항등식: 특정 원소를 포함하는 경우(C(n-1,k-1)) + 포함하지 않는 경우(C(n-1,k))
for n in (6, 9, 12):
    for k in range(1, n):
        lhs = math.comb(n, k)
        rhs = math.comb(n - 1, k - 1) + math.comb(n - 1, k)
        assert lhs == rhs, f"파스칼 항등식 불일치: n={n}, k={k}"
print("\n파스칼 항등식 C(n,k)=C(n-1,k-1)+C(n-1,k) 모든 표본에서 성립 확인 완료.")
