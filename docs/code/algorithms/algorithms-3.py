# 영속 연결 리스트 — 구조 공유로 갱신마다 새 버전을, 이전 버전은 그대로.
# cons(x, node) 는 새 헤드 노드 하나만 만들고 나머지 체인은 공유한다 — O(1) 갱신.

class Node:
    __slots__ = ("value", "next")
    def __init__(self, value, next=None):
        self.value = value
        self.next = next

def cons(value, node):          # 새 버전 하나 생성 (기존 node 는 손대지 않음)
    return Node(value, node)

def to_list(node):
    out = []
    while node:
        out.append(node.value)
        node = node.next
    return out

v0 = None
v1 = cons(1, v0)                # v1: [1]
v2 = cons(2, v1)                # v2: [2, 1] — v1 의 노드를 그대로 공유
v3 = cons(3, v1)                # v3: [3, 1] — v2 와 무관하게 v1 에서 또 분기

print("v1 =", to_list(v1))      # [1]
print("v2 =", to_list(v2))      # [2, 1]
print("v3 =", to_list(v3))      # [3, 1]  ← v1 을 공유하지만 v2 와 독립
print("v2 tail is v1 node:", v2.next is v1)  # True — 복사 없이 포인터 공유
