# 외부 정렬 — 메모리에 다 못 올리는 데이터를 런(run)으로 쪼개 정렬 후 k-way 병합한다.
# 비용은 비교 횟수가 아니라 "몇 번 디스크를 훑는가(패스 수)"로 세는 게 핵심이다.

import heapq
import random

random.seed(1)
data = random.sample(range(1000), 37)     # "디스크에 있는" 전체 데이터
MEMORY_CAPACITY = 6                        # 메모리에 한 번에 올릴 수 있는 크기

def make_sorted_runs(data, capacity):
    runs = []
    for i in range(0, len(data), capacity):
        chunk = data[i:i + capacity]
        runs.append(sorted(chunk))         # 런 하나 = 메모리에 올려 정렬 후 "디스크"에 기록
    return runs

def k_way_merge(runs):
    # heapq.merge 는 여러 정렬된 이터러블을 O(N log k) 로 병합한다 (k = 런 개수)
    return list(heapq.merge(*runs))

runs = make_sorted_runs(data, MEMORY_CAPACITY)
merged = k_way_merge(runs)

import math
num_passes = math.ceil(math.log(len(runs), MEMORY_CAPACITY)) if len(runs) > 1 else 1

print("input size:", len(data), "| memory capacity:", MEMORY_CAPACITY)
print("number of sorted runs:", len(runs))
for i, r in enumerate(runs):
    print(f"  run {i}: {r}")
print("merged result is sorted:", merged == sorted(data))
print("approx merge passes needed (log_k of run count):", num_passes)
