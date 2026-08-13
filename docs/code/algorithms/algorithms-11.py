# Day 11: 위상정렬·DAG 스케줄링 — Kahn 알고리즘으로 순서·병렬 레이어·최장 경로를 구한다
# 진입차수 0인 정점을 레이어 단위로 소진시키면 위상순서와 병렬 실행 스케줄이 동시에 나온다.

from collections import defaultdict

def topo_layers(nodes, edges):
    graph = defaultdict(list)
    indeg = {n: 0 for n in nodes}
    for u, v in edges:
        graph[u].append(v)
        indeg[v] += 1

    layer = [n for n in nodes if indeg[n] == 0]
    layers, order, remaining = [], [], dict(indeg)
    while layer:
        layers.append(sorted(layer))
        order.extend(layer)
        next_layer = []
        for u in layer:
            for v in graph[u]:
                remaining[v] -= 1
                if remaining[v] == 0:
                    next_layer.append(v)
        layer = next_layer
    if len(order) != len(nodes):
        raise ValueError("사이클이 존재해 위상정렬 불가")
    return order, layers

# 트랜잭션 5개(A~E)가 스토리지 슬롯 접근으로 서로 의존(충돌)하는 상황을 DAG로 모델링
nodes = ["A", "B", "C", "D", "E"]
edges = [("A", "C"), ("B", "C"), ("C", "D"), ("C", "E")]   # A,B 끝나야 C 실행, C 끝나야 D,E 실행

order, layers = topo_layers(nodes, edges)
print("위상정렬 순서 =", order)
print("병렬 실행 레이어 =", layers)
print(f"레이어 수(=최장 경로 길이) = {len(layers)} -> {len(nodes)}개 트랜잭션을 {len(layers)}단계에 실행 가능")
