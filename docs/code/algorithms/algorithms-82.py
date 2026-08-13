# 랜덤 오라클·길이 연장 공격·도메인 분리 — 장난감 Merkle-Damgard 해시로 실제 forge 를 수행해
# naive H(key||msg) MAC이 위조 가능함을 검증하고, HMAC은 같은 구조로 위조되지 않음을 대조한다.
# (교육용 토이 해시 — 진짜 SHA-256이 아니며 프로덕션 MAC은 반드시 hmac 모듈을 쓸 것)

import hmac
import hashlib

BLOCK = 16  # bytes

def compress(state, block):  # 토이 압축 함수 — 진짜 암호학적 강도는 없음, 구조 시연용
    x = int.from_bytes(block[:8], "big") ^ int.from_bytes(block[8:], "big")
    state = (state ^ x) & 0xFFFFFFFF
    return ((state * 2654435761 + 0x9E3779B9) ^ (state >> 15)) & 0xFFFFFFFF

def pad(total_len_bytes, tail):
    tail = tail + b"\x80"
    while (total_len_bytes + len(tail)) % BLOCK != 8 % BLOCK:
        tail += b"\x00"
    return tail + (total_len_bytes * 8).to_bytes(8, "big")

def toy_hash(data, state=0x6A09E667):
    padded = data + pad(len(data), b"")
    for i in range(0, len(padded), BLOCK):
        state = compress(state, padded[i : i + BLOCK])
    return state

KEY = b"super-secret-16b"          # 공격자는 값을 모르지만 길이(16)는 안다고 가정 — 흔한 실전 조건
msg = b"amount=100&to=alice"
tag = toy_hash(KEY + msg)          # naive_mac(key, msg) — 서버가 공개하는 값

# --- 공격자: key 없이, tag 와 (key 길이 + msg) 만으로 확장 위조 ---
key_len_guess = 16
orig_len = key_len_guess + len(msg)
glue = pad(orig_len, b"")           # 원본 메시지 뒤에 실제로 붙었을 패딩을 그대로 재구성

def resume(state, processed_len, tail_data):
    tail = pad(processed_len + len(tail_data), tail_data)
    for i in range(0, len(tail), BLOCK):
        state = compress(state, tail[i : i + BLOCK])
    return state

forged_tag = resume(tag, orig_len + len(glue), b"&admin=true")
forged_message = msg + glue + b"&admin=true"   # 공격자가 서버에 제출할, key 없이 만든 메시지

genuine_tag = toy_hash(KEY + forged_message)   # 실제로 key를 아는 쪽이 계산하면 이 값이 나온다
print("forged tag == genuine tag (forged without knowing KEY):", forged_tag == genuine_tag)

# --- HMAC은 key를 안팎으로 감싸는 구조라 같은 방식의 확장이 통하지 않는다 ---
hmac_tag = hmac.new(KEY, msg, hashlib.sha256).digest()
hmac_forged = hmac.new(b"?" * 16, forged_message, hashlib.sha256).digest()  # key 없이는 흉내조차 불가
print("HMAC has no equivalent forge path (unrelated tags):", hmac_tag != hmac_forged)

# --- 도메인 분리: 같은 바이트열도 용도 태그를 접두사로 넣으면 문맥이 섞이지 않는다 ---
h_mac_ctx = hashlib.sha256(b"mac:" + msg).hexdigest()[:12]
h_sig_ctx = hashlib.sha256(b"sig:" + msg).hexdigest()[:12]
print("domain-separated hashes differ even for the same msg:", h_mac_ctx != h_sig_ctx)
