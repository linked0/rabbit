# [복습] 알고리즘 선택 실전 기준표 — 입력 크기별 정렬 비용과 접근 패턴(배열 vs 연결리스트)의 실측 차이를 비교한다.

import time
import random

def insertion_sort(a):
    a = a[:]
    for i in range(1, len(a)):
        key = a[i]
        j = i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = key
    return a

def timeit(fn, *args, repeat=1):
    start = time.perf_counter()
    for _ in range(repeat):
        fn(*args)
    return (time.perf_counter() - start) / repeat

random.seed(42)
small = [random.randint(0, 100) for _ in range(10)]
large = [random.randint(0, 100) for _ in range(2000)]

t_ins_small = timeit(insertion_sort, small, repeat=2000)
t_sorted_small = timeit(sorted, small, repeat=2000)
t_ins_large = timeit(insertion_sort, large, repeat=5)
t_sorted_large = timeit(sorted, large, repeat=5)

# 배열 순회(지역성 좋음) vs 연결 리스트류 포인터 추적(지역성 나쁨) 비교
class Node:
    __slots__ = ("value", "next")
    def __init__(self, value, next=None):
        self.value = value
        self.next = next

arr = list(range(100_000))
head = None
for v in reversed(arr):
    head = Node(v, head)

def sum_linked(n):
    total = 0
    while n:
        total += n.value
        n = n.next
    return total

t_array = timeit(sum, arr, repeat=20)
t_linked = timeit(sum_linked, head, repeat=20)

print(f"n=10:   insertion_sort={t_ins_small * 1e6:.2f}us  builtin(Timsort)={t_sorted_small * 1e6:.2f}us")
print(f"n=2000: insertion_sort={t_ins_large * 1e3:.2f}ms  builtin(Timsort)={t_sorted_large * 1e3:.2f}ms")
print(f"n=100000 순회: array={t_array * 1e3:.3f}ms  linked-list={t_linked * 1e3:.3f}ms "
      f"(연결리스트가 {t_linked / t_array:.1f}배 — 캐시 지역성 차이)")
