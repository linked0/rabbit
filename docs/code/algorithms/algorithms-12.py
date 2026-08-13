# Day 12: 최대 유량·최소 컷과 매칭 — Edmonds-Karp로 최대 유량을 구하고 최소 컷을 복원
# BFS로 최단 증가 경로를 찾아 유량을 밀어 넣고, 잔여 그래프에서 도달 가능한 집합이 곧 최소 컷이다.

from collections import defaultdict, deque

def edmonds_karp(capacity, source, sink):
    graph = defaultdict(dict)
    for (u, v), cap in capacity.items():
        graph[u][v] = graph[u].get(v, 0) + cap
        graph[v].setdefault(u, 0)

    def bfs_path():
        parent = {source: None}
        queue = deque([source])
        while queue:
            u = queue.popleft()
            if u == sink:
                break
            for v, cap in graph[u].items():
                if cap > 0 and v not in parent:
                    parent[v] = u
                    queue.append(v)
        if sink not in parent:
            return None
        path, v = [], sink
        while parent[v] is not None:
            path.append((parent[v], v))
            v = parent[v]
        return list(reversed(path))

    flow = 0
    while True:
        path = bfs_path()
        if path is None:
            break
        path_flow = min(graph[u][v] for u, v in path)
        for u, v in path:
            graph[u][v] -= path_flow
            graph[v][u] += path_flow
        flow += path_flow

    reachable, queue = {source}, deque([source])
    while queue:
        u = queue.popleft()
        for v, cap in graph[u].items():
            if cap > 0 and v not in reachable:
                reachable.add(v); queue.append(v)
    min_cut = [(u, v) for (u, v) in capacity if u in reachable and v not in reachable]
    return flow, min_cut

capacity = {
    ("S", "A"): 3, ("S", "B"): 2,
    ("A", "B"): 1, ("A", "T"): 2,
    ("B", "T"): 3,
}
max_flow, min_cut = edmonds_karp(capacity, "S", "T")
print("최대 유량 =", max_flow)
print("최소 컷 간선 =", min_cut, "(용량 합 =", sum(capacity[e] for e in min_cut), ")")
