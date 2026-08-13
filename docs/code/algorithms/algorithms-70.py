# WAL·그룹 커밋·fsync 비용 — 변경을 로그에 먼저 순차 기록하고, 여러 트랜잭션을 모아 fsync 한 번으로 묶어 내구화한다.
# 트랜잭션마다 fsync하는 방식과, 짧은 창 안의 여러 트랜잭션을 묶어 fsync 한 번으로 처리하는 그룹 커밋을 비교한다.

class WAL:
    def __init__(self):
        self.log = []
        self.fsync_calls = 0

    def append(self, record):
        self.log.append(record)   # 순차 기록 (아직 장치까지 내구화되지는 않음)

    def flush(self):
        self.fsync_calls += 1     # fsync: 실제 장치까지 강제로 내려보내는, 비용이 큰 호출

txns = [f"txn-{i}: UPDATE balance SET ..." for i in range(12)]

# 방식 1: 트랜잭션마다 즉시 fsync
wal1 = WAL()
for t in txns:
    wal1.append(t)
    wal1.flush()
print(f"개별 커밋: fsync 호출 {wal1.fsync_calls}회 (트랜잭션 수만큼)")

# 방식 2: 그룹 커밋 — 4개씩 모아 fsync 한 번
wal2 = WAL()
GROUP_SIZE = 4
for i in range(0, len(txns), GROUP_SIZE):
    for t in txns[i:i + GROUP_SIZE]:
        wal2.append(t)
    wal2.flush()                 # 그룹 전체를 한 번의 fsync로 내구화
print(f"그룹 커밋(그룹 크기 {GROUP_SIZE}): fsync 호출 {wal2.fsync_calls}회")

def replay(wal):
    return list(wal.log)   # 크래시 복구: 로그를 처음부터 재생해 마지막 커밋 상태를 되살린다

print(f"\n복구 재생 결과 (마지막 3건): {replay(wal2)[-3:]}")
