# 에이전트 루프 설계 — 읽기 전용/쓰기 도구를 분리하고, 쓰기 도구에는 승인 게이트 +
# 멱등 키를 붙여 "재시도가 부작용을 중복 실행하지 않는지" 검증하는 최소 예시.

executed_writes = {}  # idempotency_key -> result (실제로 실행된 부작용의 기록)
call_log = []

def read_balance(account):  # 읽기 전용 도구: 언제 재시도해도 안전
    call_log.append(("read", account))
    return {"acct-1": 100}.get(account, 0)

def send_payment(account, amount, idempotency_key, approved):
    # 되돌릴 수 없는 행위 -> 승인 게이트 필수
    if not approved:
        raise PermissionError("승인 게이트 미통과: 결제 도구는 approved=True 필요")
    if idempotency_key in executed_writes:
        return executed_writes[idempotency_key]  # 재시도여도 재실행하지 않고 이전 결과 반환
    call_log.append(("write", account, amount))
    result = {"status": "sent", "account": account, "amount": amount}
    executed_writes[idempotency_key] = result
    return result

def agent_step_with_retry(tool_fn, *args, max_retries=3, **kwargs):
    for attempt in range(max_retries):
        try:
            return tool_fn(*args, **kwargs)
        except PermissionError:
            raise  # 권한 실패는 재시도로 해결되지 않음 -> 즉시 중단
        except Exception:
            if attempt == max_retries - 1:
                raise
    return None

balance = agent_step_with_retry(read_balance, "acct-1")
print("잔고 조회:", balance)

key = "payment-req-42"  # 이 요청 전체를 대표하는 멱등 키 (네트워크 재시도에도 동일)
r1 = agent_step_with_retry(send_payment, "acct-1", 10, key, True)
r2 = agent_step_with_retry(send_payment, "acct-1", 10, key, True)  # 네트워크 재시도 흉내
print("첫 결제 호출:", r1)
print("재시도 호출(동일 idempotency_key):", r2)
write_calls = [c for c in call_log if c[0] == "write"]
print("실제로 실행된 write 부작용 횟수:", len(write_calls), "(재시도에도 1회만 실행됨)")

try:
    send_payment("acct-1", 999, "payment-req-99", approved=False)
except PermissionError as e:
    print("승인 없는 결제 시도 차단:", e)
