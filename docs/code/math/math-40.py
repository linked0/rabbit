# VaR·꼬리리스크 — 손실분포의 분위수(VaR)와 조건부 꼬리손실(CVaR/ES)
# VaR는 "얼마나 자주 넘는가"만 말하고, CVaR는 "넘었을 때 얼마나 큰가"까지 말해준다.

import random
import statistics

random.seed(7)

# 일간 로그수익률을 정규분포로 근사 시뮬레이션 (평균 0, 변동성 2%)
N = 20_000
mu, sigma = 0.0, 0.02
returns = [random.gauss(mu, sigma) for _ in range(N)]
losses = sorted(-r for r in returns)  # 손실 = -수익률, 오름차순

def var(losses_sorted, alpha):
    """신뢰수준 alpha(예: 0.99)에서의 Value at Risk = 손실분포의 alpha 분위수."""
    idx = int(alpha * len(losses_sorted))
    return losses_sorted[idx]

def cvar(losses_sorted, alpha):
    """VaR를 넘는 손실들의 평균 (Expected Shortfall)."""
    idx = int(alpha * len(losses_sorted))
    tail = losses_sorted[idx:]
    return statistics.mean(tail)

for alpha in (0.95, 0.99):
    v = var(losses, alpha)
    c = cvar(losses, alpha)
    print(f"alpha={alpha:.2f}  VaR={v*100:6.3f}%  CVaR={c*100:6.3f}%  (CVaR >= VaR: {c >= v})")

# 극단 꼬리(팻테일) 샘플 몇 개를 강제로 섞어 VaR는 그대로인데 CVaR만 커지는 걸 보여준다
losses2 = sorted(losses + [0.30, 0.35, 0.40])  # 블랙스완급 손실 3건 추가
v99, c99 = var(losses2, 0.99), cvar(losses2, 0.99)
print(f"\n꼬리 이벤트 추가 후 alpha=0.99  VaR={v99*100:6.3f}%  CVaR={c99*100:6.3f}%")
print("-> VaR는 거의 안 변해도 CVaR는 크게 뛴다: VaR만으로는 꼬리위험을 과소평가한다.")
