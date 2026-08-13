# 해시함수 설계 원리(스펀지·머클-담고르) — 고정 크기 압축함수를 체이닝해 임의 길이 입력을
# 고정 길이로 접는 머클-담고르 구성을 hashlib 없이 토이 버전으로 직접 만들어 본다.

def compress(state: int, block: int, mod: int = 2**32) -> int:
    # 진짜 해시가 아니라 예시용 압축함수 — 비선형 섞기 흉내만 낸다.
    return ((state ^ block) * 2654435761 + 0x9E3779B9) % mod


def merkle_damgard(message: bytes, block_size: int = 4) -> int:
    padded = message + b"\x80" + b"\x00" * ((-len(message) - 1) % block_size)
    state = 0
    for i in range(0, len(padded), block_size):
        block = int.from_bytes(padded[i:i + block_size], "big")
        state = compress(state, block)
    return state


h1 = merkle_damgard(b"hello world")
h2 = merkle_damgard(b"hello world!")   # 한 글자만 달라짐
h3 = merkle_damgard(b"hello world")    # 같은 입력 → 같은 해시

print(f"H('hello world')  = {h1:#010x}")
print(f"H('hello world!') = {h2:#010x}  (한 글자만 달라도 완전히 다른 출력 — 눈사태 효과)")
print(f"determinism check: H('hello world') 재계산 == 원래 값? {h1 == h3}")
