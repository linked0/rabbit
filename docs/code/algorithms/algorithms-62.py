# 라이트 클라이언트와 상태 없는(stateless) 검증 — Merkle 증명 하나로 전체 데이터 없이 포함 여부를 검증한다.
# 전체 트리를 갖지 않고도 leaf + 형제 해시 경로(proof) + 루트만으로 위조 여부를 탐지한다.

import hashlib

def h(*parts):
    return hashlib.sha256(b"".join(parts)).digest()

def merkle_root(leaves):
    layer = leaves
    while len(layer) > 1:
        layer = [h(layer[i], layer[i + 1]) for i in range(0, len(layer), 2)]
    return layer[0]

def merkle_proof(leaves, index):
    proof = []
    layer, idx = leaves, index
    while len(layer) > 1:
        sibling_idx = idx ^ 1
        is_left = sibling_idx < idx           # 형제가 왼쪽에 있는지
        proof.append((layer[sibling_idx], is_left))
        layer = [h(layer[i], layer[i + 1]) for i in range(0, len(layer), 2)]
        idx //= 2
    return proof

def verify(leaf, proof, root):
    computed = leaf
    for sibling, is_left in proof:
        computed = h(sibling, computed) if is_left else h(computed, sibling)
    return computed == root

accounts = [f"account-{i}:balance={i * 100}".encode() for i in range(8)]
leaves = [h(a) for a in accounts]
root = merkle_root(leaves)

target_index = 5
proof = merkle_proof(leaves, target_index)

# 라이트 클라이언트: 전체 accounts 리스트 없이, leaf 하나 + proof + root만으로 검증
print("헤더의 상태 루트:", root.hex())
print("account-5 포함 증명 검증:", verify(leaves[target_index], proof, root))

# 공격자가 값을 조작한 leaf를 제시하면 검증에 실패해야 한다
forged_leaf = h(b"account-5:balance=999999")
print("조작된 leaf 검증(실패해야 정상):", verify(forged_leaf, proof, root))
