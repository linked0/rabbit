# 재귀 증명과 증명 집계 — 여러 스텝의 증명을 접어 "이전까지 전부 유효했음"을
# 상수 크기 하나로 압축하는 폴딩(재귀 검증)을 해시 체인으로 단순화해 시연.
# (실제 SNARK 재귀와 달리 여기선 검증도 재실행하지만, 접힘/집계의 구조만 보여주는 예시)

import hashlib

def h(*parts: bytes) -> bytes:
    m = hashlib.sha256()
    for p in parts:
        m.update(p)
    return m.digest()

def step_proof(prev_proof: bytes, statement: bytes) -> bytes:
    # "이 스텝이 유효하다"는 증명을 이전 증명과 접어(fold) 하나의 값으로 만든다
    return h(prev_proof, statement)

def verify_chain(genesis: bytes, statements: list, final_proof: bytes) -> bool:
    # 재귀 증명이라면 검증자는 final_proof 하나만 확인하면 되지만,
    # 여기서는 폴딩 구조 설명을 위해 재실행으로 대신 확인한다.
    acc = genesis
    for s in statements:
        acc = step_proof(acc, s)
    return acc == final_proof

genesis = h(b"genesis")
statements = [f"tx-{i}".encode() for i in range(5)]

# 증명자: 각 스텝을 순서대로 접어 하나의 집계 증명(final_proof)을 만든다
acc = genesis
individual_sizes = 0
for s in statements:
    acc = step_proof(acc, s)
    individual_sizes += len(acc)
final_proof = acc

print("스텝 수:", len(statements))
print("집계 전 개별 증명 총 크기(byte):", individual_sizes)
print("집계된 최종 증명 크기(byte):", len(final_proof), "← 스텝 수와 무관하게 일정")
print("최종 증명 검증 결과:", verify_chain(genesis, statements, final_proof))

tampered = statements.copy()
tampered[2] = b"tx-2-tampered"
print("중간 statement 조작 시 검증 실패:", not verify_chain(genesis, tampered, final_proof))
