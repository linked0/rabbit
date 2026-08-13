# 용량 계획·SLO와 에러 예산 — 가용성 목표에서 허용 실패량(에러 예산)을 계산하고,
# 실측 실패율로 예산 소진율을 구해 배포를 계속할지 판단한다.

def error_budget_minutes(slo_percent, period_days=30):
    """기간 동안 허용되는 다운타임(분)"""
    period_minutes = period_days * 24 * 60
    allowed_failure_ratio = 1 - slo_percent / 100
    return period_minutes * allowed_failure_ratio

def budget_status(slo_percent, downtime_minutes_so_far, days_elapsed, period_days=30):
    total_budget = error_budget_minutes(slo_percent, period_days)
    consumed_ratio = downtime_minutes_so_far / total_budget
    # 지금까지 경과한 기간 대비 정상 소진 속도(1.0이면 딱 예산대로 소진 중)
    expected_ratio_by_now = days_elapsed / period_days
    burn_rate = consumed_ratio / expected_ratio_by_now if expected_ratio_by_now else 0
    return total_budget, consumed_ratio, burn_rate

slo = 99.9  # 월 가용성 목표
total_budget = error_budget_minutes(slo)
print(f"SLO {slo}% -> 30일 에러 예산: {total_budget:.1f}분")

scenarios = [
    ("정상 운영", 10.0, 15),   # 15일 경과, 다운타임 10분
    ("장애 다발", 35.0, 15),   # 같은 15일에 다운타임 35분
]

for name, downtime, days in scenarios:
    budget, consumed, burn = budget_status(slo, downtime, days)
    action = "배포 계속 (여유 있음)" if burn < 1.0 else "기능 출시 중단, 신뢰성 작업 우선"
    print(f"[{name}] {days}일 경과, 다운타임 {downtime}분 -> "
          f"소진율 {consumed*100:.1f}%, burn rate {burn:.2f}x -> {action}")

# 용량 계획: 이용률이 1에 가까워질수록 대기시간이 급격히 발산 (M/M/1 근사)
def expected_wait_factor(utilization):
    """대기행렬 이론: 대기시간은 rho / (1 - rho) 에 비례해 발산"""
    if utilization >= 1:
        return float("inf")
    return utilization / (1 - utilization)

print("\n이용률별 대기시간 배율 (M/M/1 근사):")
for rho in [0.5, 0.7, 0.9, 0.95, 0.99]:
    print(f"  rho={rho:.2f} -> wait factor={expected_wait_factor(rho):.2f}")
