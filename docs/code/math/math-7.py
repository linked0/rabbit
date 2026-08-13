# Big-O & 가스 — "점근 차수"와 "연산별 상수"는 다르다는 걸 O(n) vs O(1) 조회 비교로 보여준다.
# 참여자 목록을 루프로 순회(O(n))하는 정산과, 매핑으로 바로 조회(O(1))하는 정산을 비교.

import time

GAS_PER_ITER = 3       # 루프 한 바퀴 도는 데 드는 가스(단순화한 상수)
GAS_PER_LOOKUP = 5      # 매핑(dict) 조회 1회 가스

def settle_by_scan(balances: list, target_id: int) -> int:
    # O(n): 참여자 수만큼 전부 훑어야 target 을 찾는다 — 공격자가 n 을 키우면 가스가 비례 증가.
    gas = 0
    for pid, bal in balances:
        gas += GAS_PER_ITER
        if pid == target_id:
            return gas
    return gas

def settle_by_map(balance_map: dict, target_id: int) -> int:
    # O(1): n 과 무관하게 상수 가스.
    _ = balance_map[target_id]
    return GAS_PER_LOOKUP

for n in (10, 100, 1_000, 10_000, 100_000):
    balances = [(i, 100) for i in range(n)]
    balance_map = dict(balances)
    target = n - 1   # 최악의 경우: 리스트 맨 끝

    gas_scan = settle_by_scan(balances, target)
    gas_map = settle_by_map(balance_map, target)
    print(f"n={n:>7}  scan(O(n)) gas={gas_scan:>7}  map(O(1)) gas={gas_map}")

BLOCK_GAS_LIMIT = 30_000_000
n_at_limit = BLOCK_GAS_LIMIT // GAS_PER_ITER
print(f"\n블록 가스 한도 {BLOCK_GAS_LIMIT:,} 기준, scan 방식은 참여자 수가 약 {n_at_limit:,} 명을")
print("넘으면 트랜잭션 하나로 정산이 아예 불가능해진다 — O(1) map 방식은 n 과 무관하게 안전.")
