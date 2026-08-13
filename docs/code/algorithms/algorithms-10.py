# Day 10: 세그먼트 트리 심화 — Lazy Propagation으로 구간 갱신·구간 합을 O(log n)에 처리
# 보류값(lazy)을 노드에 쌓아두고 실제 방문 시점에만 자식으로 밀어내려 구간 갱신 비용을 낮춘다.

class LazySegTree:
    def __init__(self, n):
        self.sum = [0] * (4 * n)
        self.lazy = [0] * (4 * n)

    def _push_down(self, node, lo, hi):
        if self.lazy[node] == 0:
            return
        mid = (lo + hi) // 2
        for child, clo, chi in ((node * 2, lo, mid), (node * 2 + 1, mid + 1, hi)):
            self.lazy[child] += self.lazy[node]
            self.sum[child] += self.lazy[node] * (chi - clo + 1)
        self.lazy[node] = 0

    def range_add(self, node, lo, hi, l, r, delta):
        if r < lo or hi < l:
            return
        if l <= lo and hi <= r:
            self.sum[node] += delta * (hi - lo + 1)
            self.lazy[node] += delta
            return
        self._push_down(node, lo, hi)
        mid = (lo + hi) // 2
        self.range_add(node * 2, lo, mid, l, r, delta)
        self.range_add(node * 2 + 1, mid + 1, hi, l, r, delta)
        self.sum[node] = self.sum[node * 2] + self.sum[node * 2 + 1]

    def range_sum(self, node, lo, hi, l, r):
        if r < lo or hi < l:
            return 0
        if l <= lo and hi <= r:
            return self.sum[node]
        self._push_down(node, lo, hi)
        mid = (lo + hi) // 2
        return (self.range_sum(node * 2, lo, mid, l, r) +
                self.range_sum(node * 2 + 1, mid + 1, hi, l, r))

n = 10
tree = LazySegTree(n)
tree.range_add(1, 0, n - 1, 2, 5, 3)   # 인덱스 2~5에 +3
tree.range_add(1, 0, n - 1, 0, 9, 1)   # 전체 구간에 +1
print("구간 합 [0,9] =", tree.range_sum(1, 0, n - 1, 0, 9), "(기대값: 3*4 + 1*10 = 22)")
print("구간 합 [2,5] =", tree.range_sum(1, 0, n - 1, 2, 5), "(기대값: (3+1)*4 = 16)")
print("구간 합 [6,9] =", tree.range_sum(1, 0, n - 1, 6, 9), "(기대값: 1*4 = 4)")
