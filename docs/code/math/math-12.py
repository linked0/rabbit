# 경매(1·2위가격, 수입동등정리) — 균등분포 가치를 가진 입찰자들로 1위가격/2위가격 경매를
# 몬테카를로 시뮬레이션해, 판매자 기대 수입이 이론대로 수렴하는지 확인.

import random

random.seed(42)
N_BIDDERS = 4
N_TRIALS = 200_000

def second_price_bid(value):
    return value   # 2위가격 경매: 자기 가치 그대로 입찰이 우월전략

def first_price_bid(value, n):
    # 균등분포[0,1], 위험중립 n명 대칭 균형 shading: b(v) = v * (n-1)/n
    return value * (n - 1) / n

total_revenue_2nd = 0.0
total_revenue_1st = 0.0

for _ in range(N_TRIALS):
    values = [random.random() for _ in range(N_BIDDERS)]

    # 2위가격: 최고 낙찰, 지불액 = 두 번째로 높은 "입찰액"(=가치, 우월전략이므로) 이 낙찰자가 냄.
    sorted_vals = sorted(values, reverse=True)
    revenue_2nd = second_price_bid(sorted_vals[1])
    total_revenue_2nd += revenue_2nd

    # 1위가격: 각자 shading 한 입찰액 중 최고가가 낙찰, 그 금액을 지불.
    bids = [first_price_bid(v, N_BIDDERS) for v in values]
    revenue_1st = max(bids)
    total_revenue_1st += revenue_1st

avg_2nd = total_revenue_2nd / N_TRIALS
avg_1st = total_revenue_1st / N_TRIALS

print(f"입찰자 수 = {N_BIDDERS}, 시행 횟수 = {N_TRIALS:,}")
print(f"2위가격 경매 판매자 평균 수입: {avg_2nd:.4f}")
print(f"1위가격 경매 판매자 평균 수입: {avg_1st:.4f}")
print(f"차이: {abs(avg_2nd - avg_1st):.4f}  (수입동등정리대로 서로 근접해야 함)")

# 이론값: n명 균등분포[0,1]에서 최고 두 순서통계량의 기댓값 = (n-1)/(n+1)
theoretical = (N_BIDDERS - 1) / (N_BIDDERS + 1)
print(f"이론적 기대 수입 (n-1)/(n+1) = {theoretical:.4f}")
