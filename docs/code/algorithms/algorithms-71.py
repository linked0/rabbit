# LSM 트리 튜닝 — 컴팩션·쓰기 증폭·읽기 증폭 — 레벨을 쌓고 병합할 때마다 같은 데이터가 몇 번씩 다시 쓰이는지 측정한다.
# memtable → SSTable flush → 레벨 컴팩션 과정에서 논리적 쓰기량 대비 실제 디스크 기록량(쓰기 증폭)을 계산한다.

class LSMTree:
    def __init__(self, level_multiplier=4, level0_size=4):
        self.levels = []                      # levels[i] = 그 레벨에 쌓인 바이트 수
        self.level_multiplier = level_multiplier
        self.level0_size = level0_size
        self.logical_bytes_written = 0
        self.actual_bytes_written = 0

    def flush_memtable(self, size):
        self.logical_bytes_written += size
        self.actual_bytes_written += size     # memtable → L0 flush (1회 기록)
        if not self.levels:
            self.levels.append(0)
        self.levels[0] += size
        self._maybe_compact(0)

    def _maybe_compact(self, i):
        capacity = self.level0_size * (self.level_multiplier ** i)
        if self.levels[i] <= capacity:
            return
        moved = self.levels[i]
        self.levels[i] = 0
        if i + 1 >= len(self.levels):
            self.levels.append(0)
        self.levels[i + 1] += moved
        self.actual_bytes_written += moved    # 컴팩션도 디스크에 다시 쓰는 비용이다
        self._maybe_compact(i + 1)

tree = LSMTree()
for _ in range(50):
    tree.flush_memtable(size=1)

write_amp = tree.actual_bytes_written / tree.logical_bytes_written
print("레벨별 현재 크기:", tree.levels)
print(f"논리 쓰기량={tree.logical_bytes_written}, 실제 디스크 기록량={tree.actual_bytes_written}")
print(f"쓰기 증폭(write amplification) = {write_amp:.2f}x")

# 읽기 증폭: 하나의 키를 찾으려면 최악의 경우 각 레벨을 다 확인해야 한다
levels_to_check = len([lv for lv in tree.levels if lv > 0])
print(f"읽기 증폭(최악의 경우 확인해야 할 레벨 수) ≈ {levels_to_check}")
