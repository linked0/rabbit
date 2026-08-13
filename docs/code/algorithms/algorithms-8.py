# Day 8: 순서 통계 — Quickselect로 k번째로 작은 원소를 전체 정렬 없이 찾기
# 퀵정렬의 분할을 재사용하되 필요한 한쪽 구간만 재귀해 기대 O(n) 시간에 선택한다.

import random

def quickselect(arr, k):
    """arr에서 k번째로 작은 원소(0-indexed)를 반환."""
    arr = arr[:]
    lo, hi = 0, len(arr) - 1
    while True:
        if lo == hi:
            return arr[lo]
        pivot = arr[random.randint(lo, hi)]
        lt, gt, i = lo, hi, lo
        while i <= gt:
            if arr[i] < pivot:
                arr[i], arr[lt] = arr[lt], arr[i]
                lt += 1; i += 1
            elif arr[i] > pivot:
                arr[i], arr[gt] = arr[gt], arr[i]
                gt -= 1
            else:
                i += 1
        if k < lt:
            hi = lt - 1
        elif k > gt:
            lo = gt + 1
        else:
            return pivot

random.seed(3)
data = [random.randint(0, 1000) for _ in range(1000)]
k = 500
result = quickselect(data, k)
expected = sorted(data)[k]
print(f"데이터 {len(data)}개 중 {k}번째(0-indexed)로 작은 값 = {result}")
print(f"sorted()로 검증한 값 = {expected}, 일치 = {result == expected}")
