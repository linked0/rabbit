# 랜덤워크·열확산 방정식 — 뉴턴에서 디퓨전 모델까지
# 이산 무작위 보행을 여러 번 표본추출하면, 스텝 수가 커질수록 도착 위치의 분포가
# 정규분포(가우시안)로 수렴한다 — 중심극한정리가 곧 확산 방정식의 해가 되는 이유.

import random
import statistics

def random_walk(steps: int) -> int:
    return sum(random.choice((-1, 1)) for _ in range(steps))


for steps in (10, 100, 1000):
    samples = [random_walk(steps) for _ in range(4000)]
    mean = statistics.fmean(samples)
    stdev = statistics.pstdev(samples)
    theoretical_stdev = steps ** 0.5     # 이산 보행의 이론적 표준편차 = sqrt(steps)
    print(f"steps={steps:4}  mean={mean:6.2f}  stdev={stdev:6.2f}  이론값(sqrt(steps))={theoretical_stdev:6.2f}")
