# 서명 스킴 비교 — ECDSA의 nonce 재사용이 개인키를 복원시키는 함정을 토이 곡선 위에서 재현한다.
# 실제 secp256k1 대신 작은 소수 곡선으로 개념만 시연 (교육용, 프로덕션 서명엔 검증된 라이브러리 사용).

# 아주 작은 유한체 위의 "장난감" 타원곡선 대신, ECDSA 서명 수식만 정수 mod n 산술로 재현한다.
# 서명 공식: s = k^-1 * (h + r * priv_key) mod n  (r 은 nonce k 로부터 유도된 값이라고 가정)

n = 1000000007  # 그룹 위수 역할을 하는 소수 (토이 값)
priv_key = 123456789 % n

def sign(h, k, r):
    """h: 메시지 해시, k: nonce, r: nonce로부터 나온 값(실제론 k*G의 x좌표)"""
    k_inv = pow(k, -1, n)
    s = (k_inv * (h + r * priv_key)) % n
    return s

def recover_priv_key_from_nonce_reuse(h1, s1, h2, s2, r):
    """같은 nonce r로 서명한 서명 두 개만으로 개인키를 복원한다."""
    # s1 - s2 = k^-1 * (h1 - h2)  =>  k = (h1 - h2) / (s1 - s2)
    k = ((h1 - h2) * pow((s1 - s2) % n, -1, n)) % n
    # s1 = k^-1 * (h1 + r * priv) => priv = (s1 * k - h1) / r
    recovered = ((s1 * k - h1) * pow(r, -1, n)) % n
    return recovered

reused_nonce_k = 999999937
r = (reused_nonce_k * 7) % n  # r 은 k 로부터 결정론적으로 유도된다고 가정 (토이 모델)

h1, h2 = 42, 4242  # 서로 다른 두 메시지의 해시
s1 = sign(h1, reused_nonce_k, r)
s2 = sign(h2, reused_nonce_k, r)  # 실수로 같은 nonce 재사용

recovered_priv = recover_priv_key_from_nonce_reuse(h1, s1, h2, s2, r)
print("actual private key:", priv_key)
print("recovered from two signatures sharing a nonce:", recovered_priv)
print("nonce reuse breaks ECDSA:", recovered_priv == priv_key)

print()
print("EdDSA fixes this by deriving nonce deterministically as hash(priv_key || message),")
print("so the same key+message always reuses the SAME nonce safely (no accidental reuse across msgs).")
