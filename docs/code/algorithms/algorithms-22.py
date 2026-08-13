# 레지스터 할당(그래프 컬러링) — 간섭 그래프를 k개 물리 레지스터로 그리디 색칠하고, 실패하면 스필한다.

interference = {
    "t1": {"t2", "t3"},
    "t2": {"t1", "t3", "t4"},
    "t3": {"t1", "t2", "t4"},
    "t4": {"t2", "t3", "t5"},
    "t5": {"t4"},
}
spill_cost = {"t1": 3, "t2": 1, "t3": 5, "t4": 2, "t5": 4}  # 접근횟수*중첩깊이 근사치
K = 3  # 사용 가능한 물리 레지스터 수

def simplify_order(graph, k):
    g = {n: set(neigh) for n, neigh in graph.items()}
    stack, spilled = [], []
    while g:
        low_degree = [n for n, neigh in g.items() if len(neigh) < k]
        if low_degree:
            n = min(low_degree, key=lambda n: spill_cost[n])   # 차수<k 정점을 스택으로
        else:
            n = min(g, key=lambda n: spill_cost[n] / max(1, len(g[n])))  # 잠재적 스필 후보
            spilled.append(n)
        stack.append(n)
        for neigh in g.values():
            neigh.discard(n)
        del g[n]
    return stack, spilled

def color(order, graph, k):
    colors = {}
    for n in reversed(order):
        used = {colors[m] for m in graph[n] if m in colors}
        available = [c for c in range(k) if c not in used]
        colors[n] = available[0] if available else None    # None = 실제 스필
    return colors

order, potential_spills = simplify_order(interference, K)
colors = color(order, interference, K)

print(f"제거 순서(스택): {order}")
print(f"단계에서 걸러진 잠재 스필 후보: {potential_spills}")
for t, c in colors.items():
    where = f"R{c}" if c is not None else "MEMORY(spill)"
    print(f"  {t} -> {where}")
