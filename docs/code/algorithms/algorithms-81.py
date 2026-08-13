# [복습] 데이터 모델이 성능을 정한다 — 같은 데이터라도 접근 경로(키 설계)에 따라
# "단일 탐색"과 "전체 스캔"으로 갈리는 것을 두 가지 인덱스 구조로 비교한다.

orders = [
    {"order_id": i, "user_id": i % 5, "amount": (i * 37) % 200}
    for i in range(1, 21)
]

# 모델 A: order_id 로만 인덱싱 → "user_id=3의 주문 조회"는 전체 스캔이 필요
by_order_id = {o["order_id"]: o for o in orders}

def find_by_user_scan(user_id):
    return [o for o in by_order_id.values() if o["user_id"] == user_id]  # O(N)

# 모델 B: 접근 패턴("user_id로 자주 조회")에 맞춰 미리 파티셔닝/클러스터링
by_user_id = {}
for o in orders:
    by_user_id.setdefault(o["user_id"], []).append(o)  # 쓰기 시 중복 비용을 지불

def find_by_user_indexed(user_id):
    return by_user_id.get(user_id, [])  # O(1) 탐색 + 결과 크기만큼

target_user = 3
scan_result = find_by_user_scan(target_user)
indexed_result = find_by_user_indexed(target_user)

print("query: orders for user_id =", target_user)
print("model A (scan all orders):", [o["order_id"] for o in scan_result])
print("model B (pre-partitioned by user_id):", [o["order_id"] for o in indexed_result])
print("same result:", scan_result == indexed_result)
print("lesson: model B pays write-time cost to buy O(1) reads for the *actual* query pattern")
