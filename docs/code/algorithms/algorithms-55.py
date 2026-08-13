# Multi-Paxos·Flexible Paxos — 정족수 설계의 자유도.
# 안전성 조건은 |Q1| + |Q2| > N 뿐이며, Q1(prepare)과 Q2(accept)가 같은 크기일 필요는 없다.

from itertools import combinations

N = 5  # 전체 노드 수

def quorums_intersect_safely(q1_size, q2_size, n=N):
    """모든 가능한 Q1, Q2 조합이 항상 겹치는지 직접 확인 (|Q1|+|Q2|>N과 동치)"""
    nodes = set(range(n))
    for q1 in combinations(nodes, q1_size):
        for q2 in combinations(nodes, q2_size):
            if not (set(q1) & set(q2)):
                return False
    return True

print(f"N={N} 노드 클러스터에서 (Q1=prepare 정족수, Q2=accept 정족수) 조합별 안전성:\n")
for q1_size, q2_size in [(3, 3), (4, 2), (2, 4), (2, 2), (3, 2)]:
    condition_holds = q1_size + q2_size > N
    actually_safe = quorums_intersect_safely(q1_size, q2_size)
    assert condition_holds == actually_safe, "조건식과 실제 검증이 불일치"
    label = "SAFE" if actually_safe else "UNSAFE (충돌 가능)"
    print(f"  Q1={q1_size}, Q2={q2_size}: |Q1|+|Q2|={q1_size+q2_size} > N={N} ? "
          f"{condition_holds} -> {label}")

print("\n(4,2): accept 정족수를 2로 줄이면 정상 경로 지연은 낮아지지만")
print("        prepare(리더 선출) 정족수를 4로 키워야 안전성이 유지된다 — 트레이드오프의 손잡이.")
