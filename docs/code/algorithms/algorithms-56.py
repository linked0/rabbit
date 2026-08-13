# 비잔틴 정족수(3f+1)와 PBFT 계보 — n=3f+1, 정족수=2f+1일 때
# 서로 다른 두 정족수는 항상 최소 f+1개 노드에서 겹치고, 그 교집합엔 정직한 노드가 반드시 있다.

from itertools import combinations

def check_byzantine_safety(f):
    n = 3 * f + 1
    quorum_size = 2 * f + 1
    nodes = set(range(n))

    min_intersection = n  # 최소 교집합 크기 추적
    for q1 in combinations(nodes, quorum_size):
        for q2 in combinations(nodes, quorum_size):
            overlap = len(set(q1) & set(q2))
            min_intersection = min(min_intersection, overlap)

    # 비잔틴 노드가 최대 f개이므로, 교집합이 f+1개 이상이면 정직한 노드가 반드시 하나 이상 포함
    guaranteed_honest = min_intersection - f
    return n, quorum_size, min_intersection, guaranteed_honest

for f in [1, 2]:
    n, q, min_overlap, honest = check_byzantine_safety(f)
    print(f"f={f}: n={n}, quorum={q} -> 임의의 두 정족수 최소 교집합={min_overlap} "
          f"(이론값 f+1={f+1})")
    print(f"  교집합 중 정직 노드 최소 보장 = {min_overlap} - f = {honest} "
          f"({'안전' if honest >= 1 else '위험'})")

print("\n-> 두 정족수의 교집합에 정직한 노드가 항상 1개 이상 있으므로,")
print("   그 노드가 서로 모순되는 두 값에 동시에 서명할 수 없어 안전성이 성립한다.")
print("   (PBFT: 3단계 통신, HotStuff: 서명 집계로 선형 통신량, Tendermint: lock 규칙으로 즉시 완결성)")
