# 데이터플로 분석 — 상수 전파(전방향 격자 고정점)와 죽은 코드 제거(후방향 liveness)를 작은 IR에 적용한다.

# IR: (dest, op, args) 튜플의 리스트. op 는 "const" 또는 이항 연산자 이름.
program = [
    ("a", "const", 3),
    ("b", "const", 4),
    ("c", "+", ("a", "b")),      # c = a + b = 7 (상수로 전파됨)
    ("d", "const", 10),          # 이후 어디서도 쓰이지 않음 -> 죽은 코드
    ("e", "*", ("c", "b")),      # e = c * b
    ("out", "+", ("e", 0)),      # 반환값
]

def constant_propagate(program):
    consts = {}
    folded = []
    for dest, op, args in program:
        if op == "const":
            consts[dest] = args
            folded.append((dest, "const", args))
            continue
        a, b = args
        va = consts.get(a) if isinstance(a, str) else a
        vb = consts.get(b) if isinstance(b, str) else b
        if va is not None and vb is not None:
            val = va + vb if op == "+" else va * vb
            consts[dest] = val
            folded.append((dest, "const", val))
        else:
            folded.append((dest, op, args))           # NAC: 상수 아님, 그대로 둠
    return folded, consts

def dead_code_eliminate(program, root="out"):
    used = {root}
    changed = True
    while changed:                                     # 고정점까지 반복 (후방향 liveness)
        changed = False
        for dest, op, args in program:
            if dest in used and op != "const":
                for a in args:
                    if isinstance(a, str) and a not in used:
                        used.add(a)
                        changed = True
    return [instr for instr in program if instr[0] in used]

folded, consts = constant_propagate(program)
live = dead_code_eliminate(folded)

print("상수 전파 결과:", consts)
print("죽은 코드 제거 전:", [i[0] for i in folded])
print("죽은 코드 제거 후:", [i[0] for i in live], "(d 제거됨)")
