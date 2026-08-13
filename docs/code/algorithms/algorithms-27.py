# EVM 인터프리터 내부 — PUSH 데이터를 건너뛰며 JUMPDEST 비트맵을 만들고, 메모리 확장 비용의 2차 항을 계산한다.

PUSH1, JUMPDEST, JUMP = 0x60, 0x5B, 0x56

# 단순화된 바이트코드: PUSH1 0x5B(=JUMPDEST와 같은 바이트값이지만 데이터!), PUSH1 5, JUMP, JUMPDEST, STOP
bytecode = [PUSH1, 0x5B, PUSH1, 0x05, JUMP, JUMPDEST, 0x00]

def build_jumpdest_bitmap(code):
    valid = [False] * len(code)
    pc = 0
    while pc < len(code):
        op = code[pc]
        if op == JUMPDEST:
            valid[pc] = True
            pc += 1
        elif PUSH1 <= op <= PUSH1 + 31:          # PUSHn: 즉시 데이터 n바이트를 건너뜀
            n = op - PUSH1 + 1
            pc += 1 + n                            # 데이터 안의 0x5B는 목적지로 안 침
        else:
            pc += 1
    return valid

valid = build_jumpdest_bitmap(bytecode)
print("바이트코드:", [hex(b) for b in bytecode])
print("유효 JUMPDEST 위치:", [i for i, v in enumerate(valid) if v])
print("pc=1(0x5B, PUSH1의 데이터 바이트)이 무효인 이유: PUSH1 뒤 1바이트라 건너뜀 ->", not valid[1])

def memory_expansion_cost(words):
    # 옐로페이퍼 근사: 3*words + words^2 / 512  (선형 항 + 2차 항)
    return 3 * words + (words * words) // 512

prev_words = 0
for target_words in (1, 10, 100, 1000, 10000):
    total_now = memory_expansion_cost(target_words)
    marginal = total_now - memory_expansion_cost(prev_words)
    print(f"words={target_words:>6}: 누적비용={total_now:>10}, 이전 대비 한계비용={marginal:>10}")
    prev_words = target_words
