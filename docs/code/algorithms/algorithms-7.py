# Day 7: 스트리밍/스케치 알고리즘 — Misra-Gries로 heavy hitter 근사 탐지
# 고정 개수 카운터만 유지하며 스트림을 한 번 훑어 빈도 상위 원소를 근사한다.

import random
from collections import Counter

def misra_gries(stream, k):
    counters = {}
    for item in stream:
        if item in counters:
            counters[item] += 1
        elif len(counters) < k - 1:
            counters[item] = 1
        else:
            for key in list(counters):
                counters[key] -= 1
                if counters[key] == 0:
                    del counters[key]
    return counters

random.seed(0)
heavy = ["A", "B", "C"]
stream = []
for _ in range(3000):
    if random.random() < 0.6:
        stream.append(random.choice(heavy))        # 60%는 소수의 heavy hitter
    else:
        stream.append(f"noise-{random.randint(0, 500)}")

exact = Counter(stream)
approx = misra_gries(stream, k=10)

print("정확 카운트 상위 5개 :", exact.most_common(5))
print("Misra-Gries 근사 결과(카운터 <=9개) :", approx)
print("실제 heavy hitter(A,B,C)가 근사 결과에 모두 포함:", all(h in approx for h in heavy))
