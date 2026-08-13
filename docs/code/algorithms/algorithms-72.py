# B+트리 vs LSM → 이더리움 클라이언트의 DB 선택 — 랜덤 쓰기 워크로드에서 두 구조의 실제 디스크 비용을 비교한다.
# B+트리는 갱신마다 랜덤 페이지 쓰기, LSM은 순차 flush + 백그라운드 컴팩션으로 대가를 뒤로 미룬다.

import math
import random
random.seed(1)

PAGE_SIZE = 4096
N_WRITES = 2000
KEY_SPACE = 500   # 키 공간이 작을수록 같은 페이지가 자주 재기록된다 (지역성 ↑)

def bplus_tree_cost(n_writes, key_space, page_size=PAGE_SIZE, keys_per_page=64):
    # 단순화: 랜덤 키 쓰기마다 그 키가 속한 페이지 하나를 통째로 다시 쓴다 (in-place 갱신)
    total_page_writes = 0
    for _ in range(n_writes):
        key = random.randint(0, key_space - 1)
        _page = key // keys_per_page
        total_page_writes += 1
    return total_page_writes * page_size

def lsm_cost(n_writes, record_size=64, level_multiplier=4):
    logical = n_writes * record_size
    # flush 1회 + 레벨을 타고 내려가며 평균 level_multiplier배 정도 재기록된다고 근사
    amplification = 1 + math.log(max(n_writes // 100, 1), level_multiplier)
    return logical * amplification

bplus_bytes = bplus_tree_cost(N_WRITES, KEY_SPACE)
lsm_bytes = lsm_cost(N_WRITES)

print(f"랜덤 쓰기 {N_WRITES}건, 키 공간 {KEY_SPACE} (지역성 낮음)")
print(f"B+트리 예상 디스크 기록량: {bplus_bytes:,} bytes (페이지 단위 랜덤 쓰기)")
print(f"LSM 예상 디스크 기록량:   {lsm_bytes:,.0f} bytes (순차 flush + 컴팩션 증폭)")
print("→ 랜덤 쓰기 편중 워크로드일수록 LSM이 유리한 이유: 쓰기를 순차화해 증폭을 뒤로 미룬다")
