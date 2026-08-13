# 포스트퀀텀 전환은 조정(coordination) 문제 — 하나의 스킴을 한번에 스왑하는 대신
# 클래식 서명 + 해시 기반(PQ 내성) 서명을 함께 요구하는 "하이브리드 검증" 예시.
# 해시 기반 Lamport 서명은 실제로 양자 내성이 있다고 여겨지는 원시연산이다(1회용).

import hashlib, hmac, os

def H(b: bytes) -> bytes:
    return hashlib.sha256(b).digest()

def msg_to_bits(msg: bytes, bits: int) -> list:
    n = int.from_bytes(hashlib.sha256(msg).digest(), "big")
    return [(n >> i) & 1 for i in range(bits)]

# --- Lamport 서명: 해시만으로 구성된 PQ 내성 1회용 서명 ---
def lamport_keygen(bits=16):
    sk = [(os.urandom(16), os.urandom(16)) for _ in range(bits)]
    pk = [(H(a), H(b)) for a, b in sk]
    return sk, pk

def lamport_sign(msg, sk):
    bits = msg_to_bits(msg, len(sk))
    return [sk[i][b] for i, b in enumerate(bits)]

def lamport_verify(msg, sig, pk):
    bits = msg_to_bits(msg, len(pk))
    return all(H(sig[i]) == pk[i][b] for i, b in enumerate(bits))

# --- "클래식" 서명: 지금 널리 쓰이는 스킴(ECDSA 등)의 자리 표시자 (양자에 취약하다고 가정) ---
classical_key = os.urandom(32)
def classical_sign(msg):
    return hmac.new(classical_key, msg, hashlib.sha256).digest()
def classical_verify(msg, sig):
    return hmac.compare_digest(classical_sign(msg), sig)

# --- 하이브리드 검증: 둘 다 통과해야 유효 — 한쪽이 깨져도 즉시 전면 위험에 빠지지 않는다 ---
def hybrid_verify(msg, classical_sig, pq_sig, pq_pk):
    return classical_verify(msg, classical_sig) and lamport_verify(msg, pq_sig, pq_pk)

msg = b"withdraw 100 to addr X"
sk, pk = lamport_keygen()
c_sig = classical_sign(msg)
pq_sig = lamport_sign(msg, sk)

print("정상 트랜잭션 하이브리드 검증:", hybrid_verify(msg, c_sig, pq_sig, pk))

forged_classical = os.urandom(32)  # 양자 컴퓨터가 클래식 서명을 위조했다고 가정
print("클래식 서명만 위조돼도 하이브리드는 거부:", not hybrid_verify(msg, forged_classical, pq_sig, pk))
