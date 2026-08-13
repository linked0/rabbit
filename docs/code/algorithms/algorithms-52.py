# 일관성 모델 지도 — 선형화(linearizable) 읽기와 최종 일관성(eventual) 읽기를 토이 복제 카운터로 비교.
# 선형화는 항상 최신 쓰기를 즉시 보고, 최종 일관성은 복제 지연 동안 stale read가 가능하다.

import random

random.seed(2)

class LinearizableCounter:
    """단일 리더에게만 쓰고 읽는다 -> 항상 최신 값 (선형화 가능)"""
    def __init__(self):
        self.value = 0

    def write(self, delta):
        self.value += delta

    def read(self):
        return self.value

class EventuallyConsistentCounter:
    """리더에 쓰고, 복제본은 비동기로 지연 복제 -> replica read는 stale할 수 있다"""
    def __init__(self, replication_lag=2):
        self.leader_value = 0
        self.replica_value = 0
        self.pending = []  # (도착까지 남은 tick, delta)
        self.replication_lag = replication_lag

    def write(self, delta):
        self.leader_value += delta
        self.pending.append([self.replication_lag, delta])

    def tick(self):
        """시간 한 틱 진행: 복제 지연이 다 된 갱신을 replica에 반영"""
        still_pending = []
        for entry in self.pending:
            entry[0] -= 1
            if entry[0] <= 0:
                self.replica_value += entry[1]
            else:
                still_pending.append(entry)
        self.pending = still_pending

    def read_from_replica(self):
        return self.replica_value

lin = LinearizableCounter()
ec = EventuallyConsistentCounter(replication_lag=2)

lin.write(+1)
ec.write(+1)

print("write-then-read 직후:")
print(f"  linearizable read  = {lin.read()}   (항상 최신)")
print(f"  eventual read      = {ec.read_from_replica()}   (아직 복제 안 됨 -> stale)")

for t in range(1, 3):
    ec.tick()
    print(f"  tick {t} 후 eventual read = {ec.read_from_replica()}")

print("\n결론: 최종 일관성은 갱신이 멈추면 언젠가 수렴하지만, 그 사이엔 stale read를 감수해야 한다.")
