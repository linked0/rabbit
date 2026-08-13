# Day 6: 확률적 자료구조 — Bloom Filter로 집합 포함 여부를 확률적으로 판정
# 비트 배열 + k개의 해시로 원소를 삽입하고, 거짓 양성(false positive)이 실제로 발생함을 확인한다.

import hashlib

class BloomFilter:
    def __init__(self, size, k):
        self.size = size
        self.k = k
        self.bits = [0] * size

    def _hashes(self, item):
        for i in range(self.k):
            h = hashlib.sha256(f"{i}:{item}".encode()).digest()
            yield int.from_bytes(h, "big") % self.size

    def add(self, item):
        for idx in self._hashes(item):
            self.bits[idx] = 1

    def might_contain(self, item):
        return all(self.bits[idx] for idx in self._hashes(item))

bf = BloomFilter(size=64, k=3)
inserted = [f"tx-{i}" for i in range(20)]
for item in inserted:
    bf.add(item)

checked, false_positives = 2000, 0
for i in range(checked):
    probe = f"probe-{i}"
    if probe not in inserted and bf.might_contain(probe):
        false_positives += 1

print(f"삽입 원소 {len(inserted)}개, 비트 배열 크기 {bf.size}, 해시 개수 {bf.k}")
print(f"might_contain('tx-5') = {bf.might_contain('tx-5')} (실제 포함 원소 -> 항상 True)")
print(f"거짓 양성 {false_positives} / {checked}회 (비율 {false_positives / checked:.3%})")
