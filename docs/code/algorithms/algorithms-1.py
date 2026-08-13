# Day 1: 분할상환분석 심화 — 포텐셜 함수(potential method)로 비용 증명
# 동적 배열(더블링) push 연산의 실제 비용을 포텐셜 함수로 상각해 상수 시간임을 검증한다.

def potential(size, capacity):
    return 2 * size - capacity

def simulate_dynamic_array_pushes(n):
    size, capacity = 0, 0
    actual_costs, amortized_costs = [], []
    prev_phi = potential(size, capacity)
    for _ in range(n):
        if size == capacity:
            new_capacity = max(1, capacity * 2)
            cost = capacity + 1          # 기존 원소 복사 + 새 원소 삽입
            capacity = new_capacity
        else:
            cost = 1
        size += 1
        phi = potential(size, capacity)
        amortized_costs.append(cost + phi - prev_phi)
        actual_costs.append(cost)
        prev_phi = phi
    return actual_costs, amortized_costs

n = 20
actual, amortized = simulate_dynamic_array_pushes(n)
print(f"n={n} push 연산")
print("실제 비용 :", actual)
print("상각 비용 :", amortized)
print(f"실제 비용 합계 = {sum(actual)}, 상각 비용 합계 = {sum(amortized)}")
print(f"상각 비용 최댓값 = {max(amortized)} (모든 연산에서 <=3 이어야 함: {all(a <= 3 for a in amortized)})")
