# RCU(Read-Copy-Update) — 갱신자는 복사본을 고쳐 포인터를 원자적으로 교체하고, 독자는 락 없이 항상 일관된 스냅샷만 본다.

import threading
import time

class RcuBox:
    def __init__(self, initial):
        self._ptr = initial  # 단일 참조 슬롯 — 이 슬롯 교체 하나가 "발행(publish)" 원자 연산

    def read(self):
        return self._ptr     # 독자: 락 없이 현재 포인터만 읽는다 — 항상 완전한 옛 버전 또는 새 버전

    def update(self, mutate_fn):
        old = self._ptr
        new = dict(old)      # 복사본을 만들어 그 위에서만 수정 (기존 독자가 보는 old 는 절대 안 건드림)
        mutate_fn(new)
        self._ptr = new       # 원자적 포인터 교체 = 발행. 이 순간 이후 신규 독자는 new 만 본다.
        return old            # 회수는 유예 기간 이후에(여기서는 즉시 반환만 시연)

config = RcuBox({"rate_limit": 100, "region": "kr"})
seen_versions = []

def reader(idx):
    for _ in range(5):
        snapshot = config.read()          # 항상 완전한 dict 하나 (반쯤 갱신된 상태를 절대 보지 않음)
        seen_versions.append(dict(snapshot))
        time.sleep(0.001)

readers = [threading.Thread(target=reader, args=(i,)) for i in range(4)]
for t in readers:
    t.start()

old_snapshot = config.update(lambda d: d.__setitem__("rate_limit", 500))  # 갱신자: 복사 -> 수정 -> 교체

for t in readers:
    t.join()

consistent = all(v in ({"rate_limit": 100, "region": "kr"}, {"rate_limit": 500, "region": "kr"}) for v in seen_versions)
print("old snapshot untouched:", old_snapshot)
print("current snapshot:", config.read())
print("every reader saw a fully-consistent old-or-new version:", consistent)
