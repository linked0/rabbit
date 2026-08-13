# 관계와 동치류 — 정수의 "mod n 합동"이 동치관계임을 반사·대칭·추이성으로 검증하고,
# 그 동치류(잉여류)들이 원래 집합을 서로소인 조각들로 정확히 파티션함을 확인.

MOD = 5
universe = list(range(-6, 12))   # 동치관계 검증에 쓸 표본 집합

def related(a, b):
    return (a - b) % MOD == 0

def is_reflexive(xs):
    return all(related(x, x) for x in xs)

def is_symmetric(xs):
    return all(related(a, b) == related(b, a) for a in xs for b in xs)

def is_transitive(xs):
    return all(
        not (related(a, b) and related(b, c)) or related(a, c)
        for a in xs for b in xs for c in xs
    )

print(f"mod {MOD} 합동 관계 검증 (표본 {len(universe)}개):")
print("  반사성 :", is_reflexive(universe))
print("  대칭성 :", is_symmetric(universe))
print("  추이성 :", is_transitive(universe))

# 동치류(잉여류) 계산: 같은 나머지를 갖는 원소끼리 묶는다.
classes = {r: [] for r in range(MOD)}
for x in universe:
    classes[x % MOD].append(x)

print(f"\n{MOD}개의 동치류(잉여류)로 파티션:")
for r, members in classes.items():
    print(f"  [{r}] = {members}")

# 파티션 검증: 동치류들이 서로소이고, 합쳐서 universe 전체가 되는지.
all_members = [x for members in classes.values() for x in members]
pairwise_disjoint = len(all_members) == len(set(all_members))
covers_universe = set(all_members) == set(universe)
print("\n서로소(중복 없음)?", pairwise_disjoint, " / 전체를 덮음?", covers_universe)
