# 스트리밍 처리 의미론 — 워터마크로 이벤트 시간 윈도우를 닫고, 늦은 데이터를 걸러낸다.
# event_time 이 뒤섞여 도착해도 워터마크(진행 추정치) 기준으로 윈도우 완결을 판단한다.

events = [
    # (event_time, payload) — 도착 순서는 뒤섞여 있다 (네트워크 지연 시뮬레이션)
    (1, "a"), (2, "b"), (5, "c"), (3, "d"), (9, "e"), (4, "late-for-w1"),
]

WINDOW = 5          # [0,5), [5,10) 처럼 크기 5 윈도우
ALLOWED_LATENESS = 1  # 워터마크를 지난 뒤에도 1만큼은 늦은 데이터로 받아준다

def window_of(t):
    start = (t // WINDOW) * WINDOW
    return (start, start + WINDOW)

state = {}          # window -> 누적 payload 리스트
closed = set()       # 이미 결과를 낸(닫힌) 윈도우
late_dropped = []
watermark = -1

for event_time, payload in events:
    watermark = max(watermark, event_time - 1)  # 단순화한 워터마크 추정: max(event_time) - 1
    w = window_of(event_time)
    if w in closed and watermark - ALLOWED_LATENESS >= w[1]:
        late_dropped.append((event_time, payload))
        continue
    state.setdefault(w, []).append(payload)
    # 워터마크가 윈도우 끝을 지나면 그 윈도우를 닫고 결과를 낸다(exactly-once: 한 번만 emit)
    if watermark >= w[1] and w not in closed:
        closed.add(w)

for w in sorted(state):
    status = "closed" if w in closed else "open"
    print(f"window {w} ({status}): {state[w]}")
print("late data (dropped after allowed lateness):", late_dropped)
print("final watermark:", watermark)
