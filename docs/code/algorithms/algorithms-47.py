# eBPF로 프로덕션 관측 — 커널 프로브가 이벤트를 map에 쌓고, 유저스페이스가 읽어 히스토그램을 낸다.
# 실제 커널 훅 대신 "probe가 이벤트를 map에 기록한다"는 구조만 순수 파이썬으로 흉내낸다.

import random
from collections import defaultdict

random.seed(1)

class EbpfMap:
    """kprobe/tracepoint가 기록하는 공유 map(dict)을 흉내"""
    def __init__(self):
        self.hist = defaultdict(int)  # latency bucket(us, 로그 스케일) -> count

    def record(self, latency_us):
        bucket = 1
        while bucket * 2 <= latency_us:
            bucket *= 2
        self.hist[bucket] += 1

def bpftrace_like_probe(events, ebpf_map):
    """실제로는 커널이 syscall 진입/종료 시각차를 계산해 넣어주는 부분을 시뮬레이션"""
    for latency_us in events:
        ebpf_map.record(latency_us)

# 유휴 상태: 대부분 짧은 지연
idle_events = [max(1, int(random.gauss(50, 15))) for _ in range(200)]
# 부하 상태: 디스크 I/O 경합으로 꼬리가 길어짐
loaded_events = [max(1, int(random.gauss(50, 15))) for _ in range(200)]
loaded_events += [int(random.gauss(4000, 800)) for _ in range(20)]  # I/O 경합 스파이크

idle_map = EbpfMap()
loaded_map = EbpfMap()
bpftrace_like_probe(idle_events, idle_map)
bpftrace_like_probe(loaded_events, loaded_map)

def print_hist(name, m):
    print(f"--- {name} (syscall latency, us, log2 bucket) ---")
    for bucket in sorted(m.hist):
        print(f"  <= {bucket:5d}us : {'#' * m.hist[bucket]} ({m.hist[bucket]})")

print_hist("idle", idle_map)
print_hist("loaded", loaded_map)
print("\n부하 상태에서 4000us대 버킷이 새로 등장 -> 재배포 없이 I/O 경합 구간을 특정.")
