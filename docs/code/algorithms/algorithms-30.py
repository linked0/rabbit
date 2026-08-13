# Rust 소유권·차용 검사기 우회 패턴 — RefCell류 런타임 검사와 arena(인덱스) 패턴을 파이썬으로 흉내낸다.

class BorrowError(Exception):
    pass

class RefCell:
    # aliasing XOR mutation 규칙(불변 차용 다수 OR 가변 차용 단 하나)을
    # 컴파일 타임이 아니라 런타임에 검사로 옮긴 패턴
    def __init__(self, value):
        self._value = value
        self._shared_borrows = 0
        self._mut_borrowed = False

    def borrow(self):
        if self._mut_borrowed:
            raise BorrowError("이미 가변 차용 중인데 불변 차용 시도")
        self._shared_borrows += 1
        return self._value

    def release_borrow(self):
        self._shared_borrows -= 1

    def borrow_mut(self):
        if self._mut_borrowed or self._shared_borrows > 0:
            raise BorrowError("다른 차용이 있는데 가변 차용 시도")
        self._mut_borrowed = True

    def set(self, value):
        if not self._mut_borrowed:
            raise BorrowError("가변 차용 없이 값 변경 시도")
        self._value = value
        self._mut_borrowed = False

cell = RefCell(10)
v1, v2 = cell.borrow(), cell.borrow()      # 불변 차용은 여러 개 동시에 허용
print("동시 불변 차용:", v1, v2)
try:
    cell.borrow_mut()                      # 불변 차용이 살아있는데 가변 차용 시도 -> 위반
except BorrowError as e:
    print("차단됨:", e)
cell.release_borrow(); cell.release_borrow()
cell.borrow_mut()
cell.set(20)
print("가변 차용 해제 후 값 변경 성공:", cell._value)

# arena(인덱스) 패턴: 참조 대신 정수 인덱스로 구조를 표현해 차용 문제 자체를 피한다
class Arena:
    def __init__(self):
        self.nodes = []  # (value, children_indices)

    def add(self, value, children=()):
        self.nodes.append((value, list(children)))
        return len(self.nodes) - 1  # 인덱스를 "참조"처럼 반환

    def sum_subtree(self, idx):
        value, children = self.nodes[idx]
        return value + sum(self.sum_subtree(c) for c in children)

arena = Arena()
leaf1 = arena.add(1)
leaf2 = arena.add(2)
root = arena.add(10, children=[leaf1, leaf2])
print("arena 트리 합:", arena.sum_subtree(root))
