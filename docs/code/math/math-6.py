# 비둘기집 원리 → 해시 충돌 — 상자(버킷)보다 물건(입력)이 많으면 충돌은 "반드시" 생긴다.
# 8비트로 자른 해시(256개 버킷)에 무작위 입력을 계속 넣어 첫 충돌이 나오는 시점을 관찰.

import hashlib

def short_hash(data: bytes, bits: int) -> int:
    full = hashlib.sha256(data).digest()
    value = int.from_bytes(full, "big")
    return value % (2 ** bits)   # bits비트로 잘라 버킷 인덱스로 사용

def find_first_collision(bits: int, seed: int = 0):
    buckets = {}
    i = seed
    while True:
        item = f"item-{i}".encode()
        idx = short_hash(item, bits)
        if idx in buckets:
            return i - seed + 1, buckets[idx], item   # 시도 횟수, 먼저 있던 입력, 충돌 입력
        buckets[idx] = item
        i += 1

BITS = 8   # 256개 버킷뿐이라 비둘기집 원리상 257번째 입력까지 가면 충돌이 강제됨
n_buckets = 2 ** BITS
tries, first, second = find_first_collision(BITS)

print(f"버킷 수 = 2^{BITS} = {n_buckets}")
print(f"첫 충돌까지 시도 횟수: {tries}  (비둘기집 원리상 최대 {n_buckets + 1}회 이내 보장)")
print(f"  충돌한 두 입력: {first!r} , {second!r}")

# 생일 문제 근사: 무작위 충돌은 대략 2^(bits/2) 시도에서 기대된다.
expected = int(2 ** (BITS / 2))
print(f"생일 문제 근사 기대 시도 수 ≈ 2^({BITS}/2) = {expected}")
