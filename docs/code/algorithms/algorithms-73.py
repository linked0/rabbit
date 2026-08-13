# 상태 트리 저장 문제 — flat DB·경로 기반 스토리지 — 해시 기반 트리 순회 vs 평평한 키-값 조회의 비용을 비교한다.
# 계정 하나를 읽을 때 해시 기반 트리는 루트부터 여러 번의 랜덤 조회가 필요하지만, flat 레이아웃은 조회 1회로 끝난다.

import hashlib

def h(x):
    return hashlib.sha256(x).hexdigest()

class HashTrieDB:
    """각 노드가 (부모+값)의 해시로 키잉되어, 리프까지 가려면 노드 수만큼 랜덤 조회가 필요하다."""
    def __init__(self):
        self.node_content = {}   # node_hash -> 원래 값 (증명 등에 쓰이는 실제 데이터)
        self.parent_of = {}      # node_hash -> parent node_hash (None = 체인의 시작)
        self.disk_seeks = 0

    def build_path(self, values):
        parent = None
        for v in values:
            node_hash = h((str(parent) + v).encode())
            self.node_content[node_hash] = v
            self.parent_of[node_hash] = parent
            parent = node_hash
        return parent   # 마지막 노드 해시 (조회 대상)

    def get_leaf(self, leaf_hash):
        cur = leaf_hash
        while cur is not None:
            self.disk_seeks += 1     # 노드 하나 읽을 때마다 랜덤 조회 1회
            cur = self.parent_of[cur]
        return self.node_content[leaf_hash]

class FlatDB:
    """계정 주소를 바로 키로 써서 조회가 O(1)에 끝난다."""
    def __init__(self):
        self.store = {}
        self.disk_seeks = 0

    def put(self, key, value):
        self.store[key] = value

    def get(self, key):
        self.disk_seeks += 1
        return self.store[key]

DEPTH = 8
trie = HashTrieDB()
leaf_hash = trie.build_path([f"node{i}" for i in range(DEPTH)])
trie.get_leaf(leaf_hash)

flat = FlatDB()
flat.put("account-0xabc", "balance=1000")
flat.get("account-0xabc")

print(f"해시 기반 트리: 계정 1개 조회에 {trie.disk_seeks}회 랜덤 조회 (트리 깊이={DEPTH})")
print(f"flat DB:       계정 1개 조회에 {flat.disk_seeks}회 조회")
print(f"→ flat 레이아웃이 조회를 {trie.disk_seeks}배 줄인다 (트리는 루트 계산·증명 용도로 별도 유지)")
