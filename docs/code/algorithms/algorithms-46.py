# 벤치마크 방법론 — 워밍업 구간을 제외하고, 분산까지 함께 보고해 회귀를 판정한다.
# 노이즈 범위(표준편차 기반 임계값)를 넘어선 차이만 "회귀"로 인정한다.

import random
import statistics

random.seed(7)

def run_samples(n, base_ms, warmup=3):
    """워밍업 n_warmup개는 버리고, 정상 상태 표본만 반환."""
    raw = [base_ms + random.gauss(0, base_ms * 0.05) for _ in range(n + warmup)]
    # 초반 워밍업 구간은 JIT/캐시 예열 때문에 더 느리다고 가정
    for i in range(warmup):
        raw[i] *= 1.6
    return raw[warmup:]

def summarize(samples):
    mean = statistics.mean(samples)
    stdev = statistics.stdev(samples)
    p95 = sorted(samples)[int(len(samples) * 0.95)]
    return mean, stdev, p95

def is_regression(baseline, candidate, z_threshold=2.0):
    """두 집단 평균 차이가 결합 표준오차의 z_threshold배를 넘으면 회귀로 판정."""
    m0, s0, _ = summarize(baseline)
    m1, s1, _ = summarize(candidate)
    se = ((s0 ** 2) / len(baseline) + (s1 ** 2) / len(candidate)) ** 0.5
    z = (m1 - m0) / se if se else float("inf")
    return z > z_threshold, z

baseline = run_samples(30, base_ms=10.0)
candidate_ok = run_samples(30, base_ms=10.2)   # 무해한 변경
candidate_bad = run_samples(30, base_ms=13.0)  # 실제 회귀

for name, cand in [("무해한 변경", candidate_ok), ("실제 회귀", candidate_bad)]:
    m0, s0, p95_0 = summarize(baseline)
    m1, s1, p95_1 = summarize(cand)
    flagged, z = is_regression(baseline, cand)
    print(f"[{name}] baseline mean={m0:.2f}ms p95={p95_0:.2f}ms | "
          f"candidate mean={m1:.2f}ms p95={p95_1:.2f}ms | z={z:.2f} -> "
          f"{'REGRESSION' if flagged else 'OK'}")
