# 테일 레이턴시 — hedged request(느리면 복제본에 한 번 더 요청)로 p99 꼬리를 줄이는 걸 시뮬레이션한다.
# 백엔드 3대 중 하나가 가끔 크게 느려질 때, 단일 요청 대비 hedge 를 걸면 총 요청은 조금 늘지만 꼬리는 크게 줄어든다.

import random

random.seed(11)

def backend_latency_ms(server_id):
    # 대부분 10ms 내외, 가끔(5%) 200ms 근처로 튀는 "롱테일" 서버를 흉내낸다.
    if random.random() < 0.05:
        return random.uniform(150, 250)
    return random.uniform(5, 15)

def single_request(num_backends=3):
    server = random.randrange(num_backends)
    return backend_latency_ms(server), 1  # (지연, 사용한 요청 수)

def hedged_request(hedge_delay_ms=20, num_backends=3):
    """첫 요청이 hedge_delay_ms 안에 안 끝나면 다른 서버에 한 번 더 보내고, 먼저 끝난 쪽을 쓴다."""
    server1 = random.randrange(num_backends)
    latency1 = backend_latency_ms(server1)
    if latency1 <= hedge_delay_ms:
        return latency1, 1                       # 첫 응답이 충분히 빨랐다 -> hedge 발동 안 함
    server2 = (server1 + 1) % num_backends
    latency2 = backend_latency_ms(server2)
    finish = min(latency1, hedge_delay_ms + latency2)   # 두 번째 요청은 hedge_delay 이후에 출발
    return finish, 2

def percentile(values, p):
    s = sorted(values)
    idx = int(len(s) * p) - 1
    return s[max(0, idx)]

N = 5000
single_latencies, single_calls = [], 0
hedged_latencies, hedged_calls = [], 0

for _ in range(N):
    lat, calls = single_request()
    single_latencies.append(lat)
    single_calls += calls
for _ in range(N):
    lat, calls = hedged_request()
    hedged_latencies.append(lat)
    hedged_calls += calls

print(f"{'metric':>14} {'single':>10} {'hedged':>10}")
print(f"{'p50 (ms)':>14} {percentile(single_latencies, 0.50):>10.1f} {percentile(hedged_latencies, 0.50):>10.1f}")
print(f"{'p99 (ms)':>14} {percentile(single_latencies, 0.99):>10.1f} {percentile(hedged_latencies, 0.99):>10.1f}")
print(f"{'total calls':>14} {single_calls:>10} {hedged_calls:>10}")
print(f"\nextra request overhead: {(hedged_calls / single_calls - 1) * 100:.1f}%  (요청 수는 조금만 늘었다)")
