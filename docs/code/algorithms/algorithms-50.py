# 카오스 엔지니어링·장애 주입 설계 — 정상 상태를 정의하고, 장애(지연 주입)를 걸어 가설이 깨지는지 관찰한다.
# 폭발 반경을 작게 시작하고, abort 조건을 넘으면 즉시 실험을 중단한다.

import random

random.seed(5)

def call_dependency(latency_ms, fail_rate=0.0):
    """외부 의존(RPC/DB) 호출을 흉내: 지연과 실패율을 파라미터로 받음"""
    ok = random.random() > fail_rate
    return ok, latency_ms + random.uniform(-2, 2)

def measure_steady_state(n_calls, injected_latency_ms=0, injected_fail_rate=0.0):
    latencies, errors = [], 0
    for _ in range(n_calls):
        ok, lat = call_dependency(10 + injected_latency_ms, injected_fail_rate)
        latencies.append(lat)
        if not ok:
            errors += 1
    error_rate = errors / n_calls
    avg_latency = sum(latencies) / len(latencies)
    return avg_latency, error_rate

# 1. 정상 상태(steady state) 정의: 평균 지연 < 20ms, 에러율 < 1%
baseline_latency, baseline_error = measure_steady_state(200)
print(f"[정상 상태] 평균 지연 {baseline_latency:.1f}ms, 에러율 {baseline_error*100:.1f}%")

# 2. 가설: "RPC 노드에 100ms 지연이 추가돼도 평균 지연은 150ms 미만, 에러율은 5% 미만이다"
def run_experiment(injected_latency_ms, injected_fail_rate, blast_radius_calls):
    ABORT_ERROR_RATE = 0.20  # 폭발 반경을 넘는 피해가 감지되면 즉시 중단
    latency, error_rate = measure_steady_state(
        blast_radius_calls, injected_latency_ms, injected_fail_rate
    )
    aborted = error_rate > ABORT_ERROR_RATE
    return latency, error_rate, aborted

for label, inj_latency, inj_fail in [
    ("작은 폭발 반경: RPC 지연 +100ms", 100, 0.02),
    ("의존 서비스 오류 응답 20%", 0, 0.20),
]:
    latency, error_rate, aborted = run_experiment(inj_latency, inj_fail, blast_radius_calls=50)
    hypothesis_holds = latency < 150 and error_rate < 0.05
    status = "ABORT (폭발 반경 초과)" if aborted else (
        "가설 유지" if hypothesis_holds else "가설 깨짐 -> 결함 발견"
    )
    print(f"[{label}] 지연 {latency:.1f}ms, 에러율 {error_rate*100:.1f}% -> {status}")
