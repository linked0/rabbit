# false sharing·캐시라인 정렬 — 무관한 변수가 같은 64바이트 캐시라인에 있으면 코어끼리 그 라인 소유권을 계속 뺏고 뺏긴다.
# 해결책은 코어별 카운터를 캐시라인 경계(보통 64B)로 패딩해 서로 다른 라인에 떨어뜨리는 것. (구조 시연 — 실측 타이밍은 생략)

import ctypes

CACHE_LINE = 64
NUM_CORES = 4

# 패딩 없는 버전: int64 카운터 4개가 한 캐시라인(64B = int64 8개)에 다 들어가 서로 겹친다.
class UnpaddedCounters(ctypes.Structure):
    _fields_ = [(f"c{i}", ctypes.c_int64) for i in range(NUM_CORES)]

# 패딩 버전: 카운터마다 캐시라인 크기만큼 자리를 배정해 서로 다른 라인에 놓는다.
class PaddedCounter(ctypes.Structure):
    _fields_ = [("value", ctypes.c_int64), ("_pad", ctypes.c_uint8 * (CACHE_LINE - 8))]

class PaddedCounters(ctypes.Structure):
    _fields_ = [(f"c{i}", PaddedCounter) for i in range(NUM_CORES)]

unpadded = UnpaddedCounters()
padded = PaddedCounters()

def cache_line_of(struct_instance, field_owner, field_name):
    base = ctypes.addressof(struct_instance)
    offset = field_owner.__dict__[field_name].offset
    return (base + offset) // CACHE_LINE

unpadded_lines = {cache_line_of(unpadded, UnpaddedCounters, f"c{i}") for i in range(NUM_CORES)}
padded_lines = {cache_line_of(padded, PaddedCounters, f"c{i}") for i in range(NUM_CORES)}

# 각 코어가 자기 카운터만 증가시키는 워크로드를 흉내낸다 (정오만 확인, 실측 타이밍은 재지 않음).
for i in range(NUM_CORES):
    setattr(unpadded, f"c{i}", i * 1_000_000)
    getattr(padded, f"c{i}").value = i * 1_000_000

print("struct size — unpadded:", ctypes.sizeof(unpadded), "bytes  padded:", ctypes.sizeof(padded), "bytes")
print("distinct cache lines — unpadded:", len(unpadded_lines), "/", NUM_CORES, "counters share", unpadded_lines)
print("distinct cache lines — padded  :", len(padded_lines), "/", NUM_CORES, "counters")
print("padding gives every core its own cache line:", len(padded_lines) == NUM_CORES)
