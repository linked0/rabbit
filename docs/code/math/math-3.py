# 명제논리·집합·함수·관계 — 함의(→)의 대우(¬q→¬p)가 항상 동치임을 진리표로 확인.
# 곱집합의 부분집합으로서의 "관계"와, 정의역 원소마다 값이 유일한 "함수"도 함께 점검.

def implies(p, q):
    return (not p) or q

def contrapositive(p, q):
    return implies(not q, not p)

# p -> q 와 그 대우 ¬q -> ¬p 가 모든 진리값 조합에서 같은지 확인 (진리표 4행)
rows = [(p, q) for p in (False, True) for q in (False, True)]
same = all(implies(p, q) == contrapositive(p, q) for p, q in rows)
print("p→q ≡ ¬q→¬p (모든 행 일치)?", same)
for p, q in rows:
    print(f"  p={p!s:5} q={q!s:5} p→q={implies(p,q)!s:5} ¬q→¬p={contrapositive(p,q)}")

# 관계 R ⊆ A×B: A×B 의 부분집합이면 뭐든 관계다.
A = {1, 2, 3}
B = {"a", "b"}
R = {(1, "a"), (2, "b"), (2, "a")}
print("\nR ⊆ A×B ?", R.issubset({(a, b) for a in A for b in B}))

# 함수는 "정의역의 각 원소가 정확히 하나의 값"을 갖는 특수한 관계.
def is_function(rel, domain):
    seen = {}
    for a, b in rel:
        if a in seen and seen[a] != b:
            return False
        seen[a] = b
    return set(seen.keys()) == domain

f_ok = {(1, "a"), (2, "b"), (3, "a")}      # 1->a, 2->b, 3->a : 함수
f_bad = {(1, "a"), (1, "b"), (2, "a")}     # 1이 두 값을 가짐: 함수 아님
print("f_ok 는 함수?", is_function(f_ok, A))
print("f_bad 는 함수?", is_function(f_bad, A))
