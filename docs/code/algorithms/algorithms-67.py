# 멱등성과 "정확히 한 번" — 아웃박스 패턴 — 상태 변경과 메시지 발행을 한 트랜잭션에 묶고, 재시도는 멱등 키로 걸러낸다.
# 같은 멱등 키로 재시도해도 잔고는 한 번만 차감되고, 릴레이가 outbox를 중복 전송해도 소비자는 한 번만 반영한다.

ledger = {"alice": 1000}
outbox = []          # 상태 변경과 같은 트랜잭션에서 커밋된다고 가정하는 발행 대기 이벤트
processed_keys = {}  # idem_key -> 처리 결과 캐시

def withdraw(idem_key, account, amount):
    if idem_key in processed_keys:
        return f"[중복 요청 무시] 캐시된 결과 반환: {processed_keys[idem_key]}"
    ledger[account] -= amount
    outbox.append({"key": idem_key, "type": "withdrawn", "account": account, "amount": amount})
    result = f"{account} 잔고 {amount} 차감, 잔액={ledger[account]}"
    processed_keys[idem_key] = result
    return result

print(withdraw("req-1", "alice", 100))
print(withdraw("req-1", "alice", 100))   # 네트워크 재시도로 같은 요청이 다시 옴
print(withdraw("req-1", "alice", 100))   # 또 재시도
print("최종 잔액:", ledger["alice"], "(3번 호출됐지만 100만 한 번 차감)")

# 릴레이: outbox를 읽어 브로커로 보내되 at-least-once라 중복 전송될 수 있다 — 소비자는 key로 dedupe
consumer_applied = set()

def consume(event):
    if event["key"] in consumer_applied:
        return "소비자: 이미 반영된 이벤트, 무시"
    consumer_applied.add(event["key"])
    return f"소비자: {event['type']} 반영 완료"

print()
for _ in range(2):  # 릴레이가 같은 이벤트를 두 번 보냈다고 가정
    print(consume(outbox[0]))
