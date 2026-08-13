# 결정론적 실행 — 부동소수점·시간·난수를 봉인해, 같은 입력이면 언제나 같은 결과가 나오게 만든다.
# float 대신 정수 고정소수점을, wall-clock 대신 주입된 시각을, os 난수 대신 시드 고정 PRNG 를 쓴다.

import random
import hashlib

SCALE = 10_000  # 고정소수점: 정수를 1/10000 단위로 취급 (부동소수점 연산 순서 의존성을 제거)

def fixed_add(a_scaled, b_scaled):
    return a_scaled + b_scaled  # 정수 덧셈은 결합/교환 법칙이 정확히 성립 — float 처럼 순서에 안 흔들림

def deterministic_run(seed, injected_time, events):
    rng = random.Random(seed)          # 벽시계 대신 시드로 재현 가능한 난수
    balance = 0
    log = []
    for ev in events:
        amount_scaled = int(round(ev * SCALE))
        balance = fixed_add(balance, amount_scaled)
        jitter = rng.randint(0, 99)     # 진짜 os.urandom 대신 시드 기반 — 리플레이 가능
        log.append((injected_time, balance, jitter))
        injected_time += 1              # time.time() 대신 명시적으로 흘려보내는 논리 시계
    return balance, log

events = [1.0001, 2.0002, -0.5, 3.3333]

# 같은 입력으로 3번 독립 실행 → 항상 같은 최종 잔고와 로그가 나와야 한다(결정론 검증).
runs = [deterministic_run(seed=42, injected_time=1000, events=events) for _ in range(3)]
digests = [hashlib.sha256(repr(r).encode()).hexdigest() for r in runs]

print("balance (scaled by 1e4):", runs[0][0])
print("balance (real value):", runs[0][0] / SCALE)
print("run 1 == run 2 == run 3 :", runs[0] == runs[1] == runs[2])
print("output hashes identical:", len(set(digests)) == 1, digests[0][:16])
