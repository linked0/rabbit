# Day 4: 함수형 업데이트와 상태 diff — copy-on-write의 실제 비용
# 불변 이진트리(배열)를 path copying으로 갱신하고, 두 버전의 diff를 노드 공유 여부로 빠르게 계산한다.

class Leaf:
    __slots__ = ("value",)
    def __init__(self, value):
        self.value = value

class Branch:
    __slots__ = ("left", "right")
    def __init__(self, left, right):
        self.left = left
        self.right = right

def build(values):
    if len(values) == 1:
        return Leaf(values[0])
    mid = len(values) // 2
    return Branch(build(values[:mid]), build(values[mid:]))

def update(node, index, value, size):
    if size == 1:
        return Leaf(value)
    half = size // 2
    if index < half:
        return Branch(update(node.left, index, value, half), node.right)   # right는 그대로 공유
    return Branch(node.left, update(node.right, index - half, value, size - half))

def collect(node, out):
    if isinstance(node, Leaf):
        out.append(node.value)
    else:
        collect(node.left, out)
        collect(node.right, out)

def count_leaves(node):
    return 1 if isinstance(node, Leaf) else count_leaves(node.left) + count_leaves(node.right)

def diff(a, b, offset, changed):
    if a is b:
        return                       # 포인터가 같으면 서브트리 전체가 동일 -> 즉시 종료
    if isinstance(a, Leaf):
        if a.value != b.value:
            changed.append(offset)
        return
    mid = offset + count_leaves(a.left)
    diff(a.left, b.left, offset, changed)
    diff(a.right, b.right, mid, changed)

n = 8
v0 = build(list(range(n)))
v1 = update(v0, 5, 999, n)
v2 = update(v1, 2, -1, n)

out0, out1, out2 = [], [], []
collect(v0, out0); collect(v1, out1); collect(v2, out2)
print("v0 =", out0)
print("v1 (index5 갱신) =", out1)
print("v2 (v1에서 index2 갱신) =", out2)

changed01 = []
diff(v0, v1, 0, changed01)
print("v0 -> v1 diff =", changed01, ", left 서브트리 공유:", v0.left is v1.left)

changed12 = []
diff(v1, v2, 0, changed12)
print("v1 -> v2 diff =", changed12, ", right 서브트리 공유:", v1.right is v2.right)
