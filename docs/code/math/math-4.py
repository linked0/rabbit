# 귀납법/구조적 재귀 — 이진 트리의 "리프 수 = 내부노드 수 + 1"을 구조적 귀납으로 확인.
# 기저: 리프 하나뿐인 트리는 leaves=1, internal=0 → 1=0+1.
# 귀납 단계: 왼쪽/오른쪽 부분트리가 각각 성립한다고 가정하면, 합쳐도 그대로 성립.

class Leaf:
    pass

class Node:
    def __init__(self, left, right):
        self.left = left
        self.right = right

def count_leaves(t):
    if isinstance(t, Leaf):
        return 1
    return count_leaves(t.left) + count_leaves(t.right)   # 재귀 = 귀납 가정 사용

def count_internal(t):
    if isinstance(t, Leaf):
        return 0
    return 1 + count_internal(t.left) + count_internal(t.right)

def check_property(t):
    # 명제 P(t): leaves(t) == internal(t) + 1
    return count_leaves(t) == count_internal(t) + 1

# 무작위로 완전(full) 이진 트리를 만들어 매번 P(t)가 성립하는지 확인.
import random
def random_full_tree(depth):
    if depth == 0 or random.random() < 0.3:
        return Leaf()
    return Node(random_full_tree(depth - 1), random_full_tree(depth - 1))

random.seed(0)
trees = [random_full_tree(4) for _ in range(20)]
results = [check_property(t) for t in trees]

print("검사한 트리 수:", len(trees))
print("모두 P(t) 성립?", all(results))
sample = trees[0]
print(f"예시 트리: 리프={count_leaves(sample)}, 내부노드={count_internal(sample)}")
