# 병렬 알고리즘 모델 — DAG의 work(T1)/span(T∞)을 계산하고, Amdahl vs Gustafson 속도향상을 비교한다.

from collections import defaultdict

# 태스크: id -> (실행시간, 선행 태스크 목록)
tasks = {
    "a": (2, []), "b": (3, ["a"]), "c": (1, ["a"]),
    "d": (4, ["b"]), "e": (2, ["c"]), "f": (1, ["d", "e"]),
}

def topo_order():
    indeg = {k: len(v[1]) for k, v in tasks.items()}
    children = defaultdict(list)
    for k, (_, ds) in tasks.items():
        for d in ds:
            children[d].append(k)
    ready = [k for k, v in indeg.items() if v == 0]
    order = []
    while ready:
        n = ready.pop()
        order.append(n)
        for c in children[n]:
            indeg[c] -= 1
            if indeg[c] == 0:
                ready.append(c)
    return order

order = topo_order()
work = sum(d for d, _ in tasks.values())            # T1: 프로세서 1개로 걸리는 총 시간
finish = {}
for t in order:
    start = max((finish[d] for d in tasks[t][1]), default=0)
    finish[t] = start + tasks[t][0]
span = max(finish.values())                          # T∞: 임계 경로(의존성 사슬) 길이
parallelism = work / span

def amdahl(p, serial_fraction):
    return 1 / (serial_fraction + (1 - serial_fraction) / p)

def gustafson(p, serial_fraction):
    return p - serial_fraction * (p - 1)

print(f"work T1={work}, span T∞={span}, 병렬성 T1/T∞={parallelism:.2f}")
for p in (1, 2, 4, 8):
    lower_bound = max(work / p, span)                 # 좋은 스케줄러가 보장하는 하한
    print(f"p={p}: 하한 Tp>={lower_bound:.2f}, "
          f"Amdahl(s=0.1)={amdahl(p, 0.1):.2f}x, Gustafson(s=0.1)={gustafson(p, 0.1):.2f}x")
