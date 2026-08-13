# 가스 회계 설계 — opcode별 비용을 합산하고, cold/warm 접근 차등 과금(EIP-2929)과 블록 가스 한도를 시뮬레이션한다.

BASE_COST = {"ADD": 3, "MUL": 5, "SLOAD": 100, "SSTORE_SET": 20000}
COLD_SURCHARGE = 2000     # 슬롯 첫 접근(cold)에 추가로 붙는 과금
BLOCK_GAS_LIMIT = 30000

def run_tx(ops):
    gas_used = 0
    warm_slots = set()     # 트랜잭션 안에서 이미 접근한 슬롯은 이후 warm
    trace = []
    for op, *arg in ops:
        cost = BASE_COST[op]
        if op in ("SLOAD", "SSTORE_SET") and arg:
            slot = arg[0]
            if slot not in warm_slots:
                cost += COLD_SURCHARGE      # cold 접근: 자원 소비가 더 크다고 보고 과금
                warm_slots.add(slot)
        gas_used += cost
        trace.append((op, arg, cost, gas_used))
    return gas_used, trace

# 슬롯 x 를 두 번 읽는 트랜잭션: 첫 접근은 cold, 두 번째는 warm(캐시 지역성을 요금에 반영)
ops = [("SLOAD", "x"), ("ADD",), ("SLOAD", "x"), ("SSTORE_SET", "y"), ("MUL",)]
gas_used, trace = run_tx(ops)

for op, arg, cost, cum in trace:
    print(f"  {op}{arg or ''}: cost={cost:>6}  누적={cum}")

print(f"\n총 가스: {gas_used}, 블록 한도: {BLOCK_GAS_LIMIT}, 한도 내: {gas_used <= BLOCK_GAS_LIMIT}")

# DoS 저항 사고 실험: 이 트랜잭션을 블록 하나에 최대 몇 번 담을 수 있는가
max_repeats = BLOCK_GAS_LIMIT // gas_used
print(f"이 트랜잭션을 블록 하나에 최대 {max_repeats}번 담을 수 있음 (가스가 실행량을 캡핑)")
