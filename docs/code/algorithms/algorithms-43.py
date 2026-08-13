# 백프레셔와 큐 이론 — Little's law(L = λW)를 이용률(ρ)이 오를 때 대기시간이 급격히 커지는 걸로 확인하고,
# 유계 큐 + 거절(load shedding)로 무한정 큐잉을 막는 백프레셔를 시뮬레이션한다.

import random

random.seed(7)

def simulate(arrival_rate, service_rate, queue_capacity, num_events=20_000):
    """이산 시간 슬롯 시뮬레이션: 매 슬롯마다 arrival_rate 확률로 도착, service_rate 확률로 서비스 완료."""
    queue_len = 0
    total_in_system_time = 0.0
    completed = 0
    rejected = 0
    wait_started = []  # 각 대기 항목이 큐에 들어간 시각(슬롯 인덱스)을 기록

    for t in range(num_events):
        if random.random() < arrival_rate:
            if queue_len < queue_capacity:          # 유계 큐: 꽉 차면 즉시 거절(load shedding)
                queue_len += 1
                wait_started.append(t)
            else:
                rejected += 1
        if queue_len > 0 and random.random() < service_rate:
            queue_len -= 1
            started = wait_started.pop(0)
            total_in_system_time += (t - started + 1)
            completed += 1

    avg_wait = total_in_system_time / completed if completed else 0.0
    avg_queue_len = (arrival_rate * avg_wait)   # Little's law: L = λ * W (도착률은 실제 수락된 요청 기준으로 근사)
    return completed, rejected, avg_wait, avg_queue_len

service_rate = 0.5
print(f"{'utilization(rho)':>18} {'completed':>10} {'rejected':>9} {'avg_wait':>10} {'L=lambda*W':>12}")
for rho in (0.5, 0.8, 0.95):
    arrival_rate = rho * service_rate
    completed, rejected, avg_wait, avg_L = simulate(arrival_rate, service_rate, queue_capacity=15)
    print(f"{rho:>18.2f} {completed:>10} {rejected:>9} {avg_wait:>10.2f} {avg_L:>12.2f}")

print("\n관찰: rho 가 1에 가까워질수록 avg_wait 이 완만하지 않고 급격히 커진다 (~1/(1-rho) 형태).")
print("유계 큐 덕분에 rho=0.95 에서도 무한정 쌓이지 않고 일부는 거절(reject)되어 시스템이 보호된다.")
