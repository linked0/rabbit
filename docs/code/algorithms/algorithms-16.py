# NP-난해와 환원 — subset-sum을 완전탐색(지수)과 그리디 근사로 풀어 오차를 비교한다.
# "환원" 감각: 정확한 다항 시간 해가 없다고 판단되면 근사/휴리스틱으로 전환하는 실무 지점을 보여준다.

def brute_force_subset_sum(nums, target):
    n = len(nums)
    best = []
    for mask in range(1 << n):                      # 2^n 가지 부분집합을 전부 확인
        subset = [nums[i] for i in range(n) if mask & (1 << i)]
        s = sum(subset)
        if s <= target and s > sum(best):
            best = subset
    return best

def greedy_approx_subset_sum(nums, target):
    # 큰 값부터 넣을 수 있는 만큼 채우는 O(n log n) 휴리스틱 — 최적 보장은 없다
    remaining = target
    chosen = []
    for x in sorted(nums, reverse=True):
        if x <= remaining:
            chosen.append(x)
            remaining -= x
    return chosen

nums = [23, 17, 41, 8, 15, 30, 4]
target = 60

exact = brute_force_subset_sum(nums, target)
approx = greedy_approx_subset_sum(nums, target)

print("입력:", nums, "목표:", target)
print(f"완전탐색(지수, 2^{len(nums)}={1 << len(nums)}가지 확인): {exact} 합={sum(exact)}")
print(f"그리디 근사(O(n log n)):                    {approx} 합={sum(approx)}")
print(f"근사 오차: {target - sum(approx)} (목표 대비 {sum(approx) / target:.1%} 달성)")
