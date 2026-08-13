# DAG 합의 — Narwhal(데이터 전파)과 Bullshark(순서화)처럼, 전파와 순서 결정을 분리한다.
# 각 정점은 이전 라운드의 과반 정점을 참조하고, 모든 노드가 같은 규칙으로 같은 전체 순서를 뽑는다.

import random

random.seed(9)

N_VALIDATORS = 4
QUORUM = N_VALIDATORS // 2 + 1  # 3

class Vertex:
    def __init__(self, round_no, validator, refs):
        self.round_no = round_no
        self.validator = validator
        self.refs = refs  # 참조하는 이전 라운드 정점들의 (round, validator) 목록
        self.id = (round_no, validator)

def build_dag(n_rounds):
    dag = {0: [Vertex(0, v, refs=[]) for v in range(N_VALIDATORS)]}
    for r in range(1, n_rounds):
        prev_vertices = dag[r - 1]
        dag[r] = []
        for v in range(N_VALIDATORS):
            # 이전 라운드 중 과반(QUORUM)개를 무작위로 참조 (가용성 증명을 흉내)
            refs = random.sample([pv.id for pv in prev_vertices], QUORUM)
            dag[r].append(Vertex(r, v, refs))
    return dag

def deterministic_order(dag, n_rounds):
    """각 라운드의 validator 0을 anchor로 삼아, anchor가 참조하는 조상들을 순서대로 나열 (Bullshark 축약판)"""
    order = []
    seen = set()
    for r in range(n_rounds - 1, -1, -1):
        anchor = next(v for v in dag[r] if v.validator == 0)
        stack = [anchor.id]
        local_order = []
        while stack:
            vid = stack.pop()
            if vid in seen:
                continue
            seen.add(vid)
            local_order.append(vid)
            rr, vv = vid
            vertex = next(v for v in dag[rr] if v.validator == vv)
            stack.extend(vertex.refs)
        order.extend(reversed(local_order))
    return order

dag = build_dag(n_rounds=3)
for r in sorted(dag):
    print(f"round {r}: {[v.id for v in dag[r]]}, 참조 예시(v0)={dag[r][0].refs}")

order_node_a = deterministic_order(dag, n_rounds=3)
order_node_b = deterministic_order(dag, n_rounds=3)  # 다른 노드가 같은 DAG로 동일하게 계산했다고 가정
print(f"\n전체 순서 (노드 A 계산): {order_node_a}")
print(f"전체 순서 (노드 B 계산): {order_node_b}")
print(f"두 노드의 순서 동일: {order_node_a == order_node_b} "
      f"(같은 DAG에 같은 규칙 -> 추가 통신 없이 결정적으로 동일한 전체 순서)")
