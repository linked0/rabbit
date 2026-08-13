# 락프리 CAS 와 ABA 문제 — 값이 A->B->A 로 되돌아오면 순진한 CAS 는 "안 변했다"고 착각한다.
# 해결책: 포인터에 버전(태그)을 붙여, 값이 같아도 버전이 다르면 CAS 가 실패하게 만든다.

import threading

lock = threading.Lock()

def cas_naive(cell, expected, new):
    """cell[0] 값만 비교하는 순진한 CAS — ABA 에 취약."""
    with lock:
        if cell[0] == expected:
            cell[0] = new
            return True
        return False

def cas_tagged(cell, expected_value, expected_version, new_value):
    """(값, 버전) 쌍을 함께 비교하는 태그드 포인터 CAS — 값이 되돌아와도 버전은 못 되돌린다."""
    with lock:
        if cell[0] == expected_value and cell[1] == expected_version:
            cell[0] = new_value
            cell[1] += 1
            return True
        return False

# --- ABA 시나리오: 순진한 CAS ---
cell = ["A", 0]  # [value, version] 이지만 naive CAS 는 version 을 무시
read_value = cell[0]                 # 스레드1이 "A" 를 읽었다(포인터를 들고 대기 중이라 가정)
cell[0] = "B"                        # 다른 스레드가 A -> B 로 바꿨다가
cell[0] = "A"                        # 다시 A 로 되돌려놓았다 (스택으로 치면 pop/push/pop/push)
naive_ok = cas_naive(cell, read_value, "C")   # 스레드1은 "안 변했네" 하고 착각 -> 성공해버림 (버그)
print("naive CAS after A->B->A round-trip succeeded:", naive_ok, "  <- ABA 로 인한 잘못된 성공")

# --- 같은 시나리오를 태그드 포인터로 방어 ---
cell2 = ["A", 0]
read_value2, read_version2 = cell2[0], cell2[1]   # 스레드1이 값과 버전을 함께 읽음
cell2[0] = "B"; cell2[1] += 1                      # A -> B, version 0 -> 1
cell2[0] = "A"; cell2[1] += 1                      # B -> A, version 1 -> 2 (값은 되돌아왔지만 버전은 못 돌아옴)
tagged_ok = cas_tagged(cell2, read_value2, read_version2, "C")
print("tagged CAS after A->B->A round-trip succeeded:", tagged_ok, "  <- 버전 불일치로 정확히 거부됨")
print("final tagged cell state:", cell2)
