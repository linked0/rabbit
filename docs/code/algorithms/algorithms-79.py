# 캐시 일관성·무효화·스탬피드 방지 — TTL 만료 순간 다수 요청이 몰리는 스탬피드를
# single-flight(락)로 한 요청만 원본을 조회하게 막는 것을 시연한다.

import time
import threading

origin_calls = 0
origin_lock = threading.Lock()

def slow_origin_fetch(key):
    global origin_calls
    with origin_lock:
        origin_calls += 1
    time.sleep(0.05)  # 원본 DB/서비스 호출을 흉내
    return f"value-for-{key}"

class SingleFlightCache:
    def __init__(self):
        self.store = {}       # key -> (value, expires_at)
        self.inflight = {}    # key -> threading.Event (동시 요청 합류용)
        self.lock = threading.Lock()

    def get(self, key, ttl=1.0):
        with self.lock:
            entry = self.store.get(key)
            if entry and entry[1] > time.time():
                return entry[0]
            if key in self.inflight:
                event = self.inflight[key]
            else:
                event = threading.Event()
                self.inflight[key] = event
                event = None  # 이 스레드가 원본을 조회할 담당자
        if event is not None:
            event.wait()
            return self.store[key][0]
        value = slow_origin_fetch(key)
        with self.lock:
            self.store[key] = (value, time.time() + ttl)
            waiter = self.inflight.pop(key)
            waiter.set()
        return value

cache = SingleFlightCache()
results = []
def worker():
    results.append(cache.get("hot-key"))

threads = [threading.Thread(target=worker) for _ in range(20)]
for t in threads: t.start()
for t in threads: t.join()

print("concurrent requests:", len(threads))
print("origin fetches actually made:", origin_calls)  # 1 이어야 stampede 방지 성공
print("all results identical:", len(set(results)) == 1)
