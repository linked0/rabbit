# Day 5: 트라이 계열 심화 — 패트리샤(Patricia) 트라이의 경로 압축
# 공통 접두사를 압축해 간선에 저장하는 라딕스 트라이를 구현해 삽입/탐색과 압축 효과를 확인한다.

class PatriciaNode:
    def __init__(self):
        self.children = {}   # edge_label(str) -> PatriciaNode
        self.is_word = False

def common_prefix_len(a, b):
    n, i = min(len(a), len(b)), 0
    while i < n and a[i] == b[i]:
        i += 1
    return i

def insert(root, word):
    node, remaining = root, word
    while remaining:
        for label in list(node.children):
            common = common_prefix_len(label, remaining)
            if common == 0:
                continue
            if common == len(label):
                node, remaining = node.children[label], remaining[common:]
                break
            mid = PatriciaNode()                        # 공통 접두사에서 간선을 분기
            mid.children[label[common:]] = node.children.pop(label)
            node.children[label[:common]] = mid
            node, remaining = mid, remaining[common:]
            break
        else:
            node.children[remaining] = PatriciaNode()
            node, remaining = node.children[remaining], ""
    node.is_word = True

def search(root, word):
    node, remaining = root, word
    while remaining:
        for label, child in node.children.items():
            if remaining.startswith(label):
                node, remaining = child, remaining[len(label):]
                break
        else:
            return False
    return node.is_word

def count_edges(node):
    return sum(1 + count_edges(c) for c in node.children.values())

words = ["romane", "romanus", "romulus", "rubens", "ruber", "rubicon", "rubicundus"]
root = PatriciaNode()
for w in words:
    insert(root, w)

print(f"압축된 간선 수 = {count_edges(root)} (단어 {len(words)}개, 총 문자수 {sum(len(w) for w in words)})")
print("search('romanus') =", search(root, "romanus"))
print("search('roman')   =", search(root, "roman"))
print("search('rubicon')  =", search(root, "rubicon"))
