# [복습] 검증 가능한 시스템 체크리스트 — 결정성·커밋먼트·증명 방식·검증 비용을
# 머클 트리로 시연: 잎 하나의 값을 O(log n) 증명으로 검증(전체 재실행 O(n) 불필요).

import hashlib

def H(*parts) -> bytes:
    m = hashlib.sha256()
    for p in parts:
        m.update(p)
    return m.digest()

def build_tree(leaves):
    level = [H(b"leaf", x) for x in leaves]
    tree = [level]
    while len(level) > 1:
        if len(level) % 2:
            level = level + [level[-1]]
        level = [H(b"node", level[i], level[i + 1]) for i in range(0, len(level), 2)]
        tree.append(level)
    return tree  # tree[0]=leaf hashes ... tree[-1]=[root]

def merkle_proof(tree, index):
    proof = []
    for level in tree[:-1]:
        sibling = index ^ 1
        if sibling < len(level):
            proof.append(level[sibling])
        index //= 2
    return proof

def verify_proof(leaf, index, proof, root):
    h = H(b"leaf", leaf)
    for sib in proof:
        h = H(b"node", sib, h) if index % 2 else H(b"node", h, sib)
        index //= 2
    return h == root

leaves = [f"account-{i}:balance={i*10}".encode() for i in range(8)]
tree = build_tree(leaves)
root = tree[-1][0]

idx = 5
proof = merkle_proof(tree, idx)
print("커밋먼트(root):", root.hex()[:16], "...")
print(f"leaf[{idx}] 증명 크기: {len(proof)} 해시  (전체 잎 {len(leaves)}개 재실행 없이 검증)")
print("증명 검증 결과:", verify_proof(leaves[idx], idx, proof, root))

tampered_leaf = b"account-5:balance=9999"
print("변조된 leaf 는 같은 증명으로 거부됨:", not verify_proof(tampered_leaf, idx, proof, root))

# 체크리스트: 결정성(같은 입력->같은 root) / 커밋먼트(root) / 증명방식(머클 증명)
# / 검증 비용(O(log n) < 재실행 O(n)) / 폴백(불일치 시 이의제기 대상은 root 제공자)
print("\n[체크리스트] 결정성 O, 커밋먼트 O, 증명방식=머클, 검증<재실행 O, 폴백 주체=? (명시 필요)")
