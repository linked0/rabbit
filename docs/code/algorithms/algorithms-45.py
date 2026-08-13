# 프로파일링 심화 — perf 처럼 "일정 주기마다 인터럽트를 걸어 콜스택을 표본화"하는 걸 signal 타이머로 재현한다.
# 플레임그래프의 너비는 "오래 걸린 구간"이 아니라 "표본에서 자주 잡힌 스택(=CPU 를 많이 먹은 코드)"임에 유의.

import signal
from collections import Counter

samples = []  # 각 표본: 인터럽트가 걸린 순간의 콜스택(튜플)

def on_timer_tick(signum, frame):    # perf_events 의 오버플로 인터럽트 핸들러에 해당
    stack = []
    f = frame
    while f is not None:
        stack.append(f.f_code.co_name)
        f = f.f_back
    samples.append(tuple(reversed(stack)))

def cache_miss_heavy(n):        # 캐시 미스가 잦다고 가정한(=CPU 를 오래 점유하는) 함수
    total = 0
    for i in range(n):
        total += i * i
    return total

def branch_miss_heavy(n):       # 분기 예측 실패가 잦다고 가정한 함수
    total = 0
    for i in range(n):
        total += -i if i % 7 == 0 else i
    return total

def workload():
    cache_miss_heavy(3_000_000)   # 실행 시간이 더 긴 쪽 -> 표본에서 더 넓은 프레임을 차지해야 정상
    branch_miss_heavy(500_000)

signal.signal(signal.SIGVTALRM, on_timer_tick)          # CPU(가상) 시간 기준 인터럽트 등록
signal.setitimer(signal.ITIMER_VIRTUAL, 0.001, 0.001)    # 1ms 주기 샘플링 (perf -F 1000 과 같은 아이디어)
try:
    workload()
finally:
    signal.setitimer(signal.ITIMER_VIRTUAL, 0)            # 타이머 해제
    signal.signal(signal.SIGVTALRM, signal.SIG_DFL)

# 플레임그래프 접기(fold): 같은 스택 경로를 하나로 묶어 등장 횟수(=CPU 점유 비율 proxy)를 센다.
folded = Counter(";".join(s) for s in samples if s)
total_samples = sum(folded.values())

print("folded stacks (flamegraph 입력 포맷과 동일한 'stack;stack;...;count'):")
for stack, count in folded.most_common(5):
    pct = count / total_samples * 100 if total_samples else 0
    print(f"  {count:>4} ({pct:4.1f}%)  {stack}")

cache_related = sum(c for s, c in folded.items() if "cache_miss_heavy" in s)
branch_related = sum(c for s, c in folded.items() if "branch_miss_heavy" in s)

print("\ntotal samples captured:", total_samples)
print("cache_miss_heavy 가 차지한 표본 비율:", f"{cache_related / total_samples:.0%}" if total_samples else "n/a")
print("branch_miss_heavy 가 차지한 표본 비율:", f"{branch_related / total_samples:.0%}" if total_samples else "n/a")
print("-> 실행 시간이 더 긴 함수가 더 넓은 프레임(더 많은 표본)을 차지한다:",
      cache_related >= branch_related)
