# Day 14: 랜덤화·근사 알고리즘 — LP 완화 + 랜덤 라운딩으로 Set Cover 근사
# 정수계획을 LP로 완화해 얻은 분수해를 확률로 삼아 반복 라운딩하면 근사 정수해를 얻는다.

import random

universe = set(range(1, 7))
sets = {"S1": {1, 2, 3}, "S2": {3, 4, 5}, "S3": {5, 6, 1}}
# 대칭 인스턴스: 원소마다 정확히 2개 집합이 덮으므로 x_S=0.5는 LP 완화의 실행가능(대칭적 최적) 분수해
x = {name: 0.5 for name in sets}
lp_value = sum(x.values())

def greedy_cover(sets, universe):
    remaining, chosen = set(universe), []
    while remaining:
        best = max(sets, key=lambda s: len(sets[s] & remaining))
        chosen.append(best)
        remaining -= sets[best]
    return chosen

def randomized_round(sets, x, universe, rng, max_rounds=30):
    covered, chosen, rounds = set(), set(), 0
    while covered != universe and rounds < max_rounds:
        rounds += 1
        for name in sets:
            if rng.random() < x[name]:
                chosen.add(name)
        covered = set().union(*(sets[s] for s in chosen)) if chosen else set()
    return chosen, rounds

rng = random.Random(7)
greedy = greedy_cover(sets, universe)
rounded, rounds = randomized_round(sets, x, universe, rng)

print(f"LP 완화 하한(분수 비용) = {lp_value}")
print(f"그리디 정수해 = {greedy} (비용 {len(greedy)})")
print(f"랜덤 라운딩 결과 = {sorted(rounded)} (비용 {len(rounded)}, {rounds}회 반복 후 커버 완료)")
print(f"전체 원소 커버 확인 = {set().union(*(sets[s] for s in rounded)) == universe}")
