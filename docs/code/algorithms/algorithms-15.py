# Day 15: 온라인 알고리즘과 경쟁비 — 캐시 교체(LRU/FIFO) 대 오프라인 최적(Belady)
# 미래를 모른 채 결정하는 온라인 알고리즘의 비용을 오프라인 최적과 비교해 경쟁비를 측정한다.

def lru_misses(seq, k):
    cache, misses = [], 0
    for x in seq:
        if x in cache:
            cache.remove(x); cache.append(x)
        else:
            misses += 1
            if len(cache) >= k:
                cache.pop(0)
            cache.append(x)
    return misses

def fifo_misses(seq, k):
    cache, order, misses = set(), [], 0
    for x in seq:
        if x not in cache:
            misses += 1
            if len(cache) >= k:
                oldest = order.pop(0)
                cache.remove(oldest)
            cache.add(x); order.append(x)
    return misses

def belady_misses(seq, k):
    cache, misses = [], 0
    for i, x in enumerate(seq):
        if x in cache:
            continue
        misses += 1
        if len(cache) >= k:
            future = seq[i + 1:]
            farthest = max(cache, key=lambda c: future.index(c) if c in future else float("inf"))
            cache.remove(farthest)
        cache.append(x)
    return misses

k = 4
seq = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5] * 3   # LRU에 불리하도록 순환 접근 패턴

lru, fifo, opt = lru_misses(seq, k), fifo_misses(seq, k), belady_misses(seq, k)

print(f"캐시 크기 k={k}, 요청 {len(seq)}건")
print(f"LRU miss = {lru}, FIFO miss = {fifo}, 오프라인 최적(Belady) miss = {opt}")
print(f"LRU 경쟁비 ≈ {lru/opt:.2f} (이론 상한 k={k})")
print(f"FIFO 경쟁비 ≈ {fifo/opt:.2f}")
