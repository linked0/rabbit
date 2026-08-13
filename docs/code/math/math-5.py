# 그래프 기초(DAG·트리·해시 링크) — 해시 링크로 만든 체인은 원리상 사이클이 생길 수 없어 항상 DAG.
# 노드 하나(payload)를 바꾸면 그 해시가 바뀌고, 상위 노드가 가리키던 해시도 전부 달라진다.

import hashlib

def h(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:12]

class HashNode:
    def __init__(self, payload, prev_hash=""):
        self.payload = payload
        self.prev_hash = prev_hash
        self.hash = h(f"{payload}|{prev_hash}".encode())

def build_chain(payloads):
    chain = []
    prev = ""
    for p in payloads:
        node = HashNode(p, prev)
        chain.append(node)
        prev = node.hash
    return chain

def verify_chain(chain):
    prev = ""
    for node in chain:
        if node.prev_hash != prev:
            return False
        if h(f"{node.payload}|{node.prev_hash}".encode()) != node.hash:
            return False
        prev = node.hash
    return True

chain = build_chain(["genesis", "tx1", "tx2", "tx3"])
print("원본 체인 유효?", verify_chain(chain))
for n in chain:
    print(f"  {n.payload:10} prev={n.prev_hash or '(none)':14} hash={n.hash}")

# tx2 의 내용을 변조하면 → 그 노드의 해시가 바뀌고, tx3.prev_hash 와 불일치 → 검증 실패.
chain[2].payload = "tx2-tampered"
chain[2].hash = h(f"{chain[2].payload}|{chain[2].prev_hash}".encode())
print("\ntx2 변조 후 체인 유효?", verify_chain(chain))
