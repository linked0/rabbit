# 프라이버시 프리미티브 — nullifier(중복 사용 방지)와 스텔스 주소(toy DH),
# 그리고 링 서명(AOS, 1-of-n)으로 "권한 증명"과 "신원 노출"을 분리하는 예시.
# 그룹은 학습용 소수: p=23, q=11(부분군 order), g=2. 실무 곡선 크기가 아니라 예시용.

import hashlib, random

p, q, g = 23, 11, 2

def H(*args) -> int:
    return int(hashlib.sha256("|".join(map(str, args)).encode()).hexdigest(), 16) % q

# --- 1) nullifier: 같은 비밀로는 항상 같은 태그가 나와 중복 사용을 검출 ---
spent = set()
def try_spend(secret):
    tag = H("nullify", secret)
    if tag in spent:
        return False
    spent.add(tag)
    return True

secret = 424242
print("첫 인출:", try_spend(secret))          # True
print("같은 비밀로 재인출 시도:", try_spend(secret))  # False — nullifier 재사용 검출

# --- 2) 스텔스 주소: toy Diffie-Hellman 로 송/수신자가 독립적으로 같은 주소 유도 ---
recv_priv = random.randrange(1, q); recv_pub = pow(g, recv_priv, p)
eph_priv = random.randrange(1, q); eph_pub = pow(g, eph_priv, p)
addr_sender = H("addr", pow(recv_pub, eph_priv, p))
addr_receiver = H("addr", pow(eph_pub, recv_priv, p))
print("스텔스 주소 일치(송신자==수신자 유도):", addr_sender == addr_receiver)

# --- 3) 링 서명(AOS): n명 중 누가 서명했는지 숨긴 채 "그중 하나"임만 증명 ---
def ring_sign(msg, pubs, idx, x):
    n = len(pubs); c = [0] * n; z = [0] * n
    k = random.randrange(1, q)
    i = (idx + 1) % n
    c[i] = H(msg, pow(g, k, p))
    while i != idx:
        z[i] = random.randrange(1, q)
        c[(i + 1) % n] = H(msg, pow(g, z[i], p) * pow(pubs[i], c[i], p) % p)
        i = (i + 1) % n
    z[idx] = (k - c[idx] * x) % q
    return c[0], z

def ring_verify(msg, pubs, c0, z):
    c = c0
    for i in range(len(pubs)):
        c = H(msg, pow(g, z[i], p) * pow(pubs[i], c, p) % p)
    return c == c0

secrets = [random.randrange(1, q) for _ in range(3)]
pubs = [pow(g, x, p) for x in secrets]
c0, z = ring_sign("transfer 10", pubs, 1, secrets[1])  # 실제 서명자는 인덱스 1
print("링 서명 검증(서명자가 3명 중 누구인지는 드러나지 않음):", ring_verify("transfer 10", pubs, c0, z))
print("메시지 변조 시 검증 실패:", not ring_verify("transfer 99", pubs, c0, z))
