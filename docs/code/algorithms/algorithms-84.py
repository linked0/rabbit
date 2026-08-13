# 난수 생성과 CSPRNG 품질 — 통계적 검정(빈도·런) 통과가 예측불가능성을 뜻하지 않음을 보인다.
# 선형합동생성기(LCG)는 검정을 통과해도 상태 복원이 쉽고, secrets 는 OS 엔트로피 기반이라 다르다.

import secrets

class WeakLCG:
    """교육용 취약 PRNG — 통계 검정은 통과하지만 관측값으로 상태를 복원해 다음 값을 예측 가능."""
    def __init__(self, seed):
        self.state = seed
        self.a, self.c, self.m = 1103515245, 12345, 2**31

    def next(self):
        self.state = (self.a * self.state + self.c) % self.m
        return self.state

def monobit_test(bits):
    """간단 빈도 검정: 0/1 비율이 균형에 가까운지만 본다 (진짜 무작위성 증명은 아님)."""
    ones = sum(bits)
    return abs(ones - len(bits) / 2) < len(bits) * 0.05

lcg = WeakLCG(seed=42)
lcg_bits = [lcg.next() & 1 for _ in range(1000)]
print("LCG passes naive monobit test:", monobit_test(lcg_bits))

# 취약점: 연속된 출력 두 개만 관측하면 다음 값을 그대로 예측할 수 있다 (선형 재귀이므로)
attacker_lcg = WeakLCG(seed=1)
observed = [attacker_lcg.next() for _ in range(2)]
recovered = WeakLCG(seed=42)
recovered.state = lcg.state  # 공격자가 내부 상태를 역산했다고 가정
predicted_next = recovered.next()
actual_next = lcg.next()
print("LCG next value predictable once state is known:", predicted_next == actual_next)

# CSPRNG: secrets 모듈은 OS 엔트로피(os.urandom)를 쓰고, 이전 출력으로 다음을 예측할 수 없다
csprng_bits = [secrets.randbits(1) for _ in range(1000)]
print("CSPRNG passes naive monobit test too:", monobit_test(csprng_bits))
print("=> passing a statistical test proves nothing about predictability;")
print("   seed source and state-recovery resistance are what make a generator crypto-safe")
