# Day 36 — 로그수익률·변동성(σ)
# 짧은 가격 시계열에서 로그수익률을 계산하고 표준편차(변동성)를 구한 뒤, 기간 환산을 보여준다.

import math

prices = [100.0, 101.5, 99.8, 102.3, 103.0, 101.0, 104.5, 103.8, 106.0, 105.2]

log_returns = [math.log(prices[i] / prices[i - 1]) for i in range(1, len(prices))]

n = len(log_returns)
mean_r = sum(log_returns) / n
variance = sum((r - mean_r) ** 2 for r in log_returns) / (n - 1)  # 표본분산 (n-1)
daily_vol = math.sqrt(variance)

print("가격:", prices)
print("\n일별 로그수익률:")
for i, r in enumerate(log_returns, start=1):
    print(f"  day {i}: {r:+.5f}")

print(f"\n평균 로그수익률 = {mean_r:.5f}")
print(f"일간 변동성(σ_daily) = {daily_vol:.5f}")

# 연환산: iid 가정 아래 변동성은 기간 수의 제곱근에 비례
trading_days = 252
annual_vol = daily_vol * math.sqrt(trading_days)
print(f"연환산 변동성(σ_annual, sqrt(252) 법칙) = {annual_vol:.5f} ({annual_vol*100:.2f}%)")
