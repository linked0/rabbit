# [복습] 성능 예산 문서 쓰기 — 종단 지연 목표를 구간별(네트워크/큐/핸들러/DB)로 쪼개
# 각 구간 상한을 정하고, 실측값과 비교해 어느 구간이 예산을 초과했는지 즉시 드러낸다.

budget_ms = {
    "network": 20,
    "queue_wait": 30,
    "handler": 40,
    "db_call": 50,
}
total_budget_ms = sum(budget_ms.values())

# 실측치 두 세트: 정상 배포 vs 회귀가 있는 배포
measured_ok = {"network": 18, "queue_wait": 25, "handler": 35, "db_call": 45}
measured_regressed = {"network": 19, "queue_wait": 28, "handler": 38, "db_call": 95}

def evaluate(name, measured):
    print(f"--- {name} (총 예산 {total_budget_ms}ms) ---")
    violations = []
    for stage, limit in budget_ms.items():
        actual = measured[stage]
        status = "OK" if actual <= limit else "OVER"
        if status == "OVER":
            violations.append(stage)
        print(f"  {stage:10s}: {actual:5.1f}ms / {limit}ms budget -> {status}")
    total_actual = sum(measured.values())
    print(f"  합계: {total_actual:.1f}ms / {total_budget_ms}ms")
    if violations:
        print(f"  조치: 배포 차단 (초과 구간: {', '.join(violations)})")
    else:
        print("  조치: 배포 승인")
    print()

evaluate("정상 배포", measured_ok)
evaluate("회귀가 있는 배포", measured_regressed)
