# 커밋먼트 — Pedersen 커밋먼트를 모듈러 지수 연산으로 구현해 binding·hiding·덧셈 준동형을 시연.
# 이산로그 가정 기반 토이 그룹 (실제 EC 대신 소수체 위 지수 연산으로 개념만 재현, 교육용).

import secrets

P = 2**127 - 1        # 토이 소수 (실제로는 소수인지 별도 검증 필요 — 데모 목적)
G, H = 5, 7             # 서로 이산로그 관계를 모르는 두 "생성원" (토이 값)

def commit(value, blinding):
    return (pow(G, value, P) * pow(H, blinding, P)) % P

def open_commitment(commitment, value, blinding):
    return commit(value, blinding) == commitment

# --- hiding: 커밋먼트만 봐서는 값을 알 수 없다 ---
secret_value = 1000
blinding = secrets.randbelow(P)
c = commit(secret_value, blinding)
print("commitment (looks random, reveals nothing):", c)

# --- binding: 다른 값으로는 같은 커밋먼트를 열 수 없다 ---
print("opens correctly with real (value, blinding):", open_commitment(c, secret_value, blinding))
print("fails to open with a different value:", not open_commitment(c, secret_value + 1, blinding))

# --- 덧셈 준동형: 커밋먼트끼리 곱하면 값의 합에 대한 커밋먼트가 된다 ---
v1, b1 = 30, secrets.randbelow(P)
v2, b2 = 12, secrets.randbelow(P)
c1, c2 = commit(v1, b1), commit(v2, b2)

c_sum_direct = commit(v1 + v2, (b1 + b2) % P)
c_sum_from_commitments = (c1 * c2) % P

print()
print("commit(v1)*commit(v2) mod P:", c_sum_from_commitments)
print("commit(v1+v2, b1+b2) directly:", c_sum_direct)
print("additively homomorphic:", c_sum_from_commitments == c_sum_direct)
print("=> lets a verifier check sums (e.g. 'inputs balance outputs') without seeing v1, v2")
