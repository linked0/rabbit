# 스택 머신 vs 레지스터 머신 — 같은 식 (a+b)*c 를 두 모델로 실행하고 명령 수를 비교한다.

def run_stack_machine(program):
    stack = []
    for op in program:
        if isinstance(op, (int, float)):
            stack.append(op)
        elif op == "ADD":
            b, a = stack.pop(), stack.pop()
            stack.append(a + b)
        elif op == "MUL":
            b, a = stack.pop(), stack.pop()
            stack.append(a * b)
    return stack[-1]

def run_register_machine(program, regs):
    regs = dict(regs)
    for dest, op, *args in program:
        if op == "ADD":
            regs[dest] = regs[args[0]] + regs[args[1]]
        elif op == "MUL":
            regs[dest] = regs[args[0]] * regs[args[1]]
    return regs

env = {"A": 3, "B": 4, "C": 5}

# (a+b)*c 를 스택 머신 명령으로: PUSH a, PUSH b, ADD, PUSH c, MUL (피연산자는 암묵적으로 스택 상단)
stack_program = [env["A"], env["B"], "ADD", env["C"], "MUL"]

# (a+b)*c 를 3-주소 레지스터 명령으로: r1 = A + B; r2 = r1 * C (피연산자를 이름으로 명시)
register_program = [("r1", "ADD", "A", "B"), ("r2", "MUL", "r1", "C")]

stack_result = run_stack_machine(stack_program)
register_result = run_register_machine(register_program, env)["r2"]

assert stack_result == register_result == (3 + 4) * 5

print(f"스택 머신 결과={stack_result}, 명령 수={len(stack_program)} "
      f"(피연산자 암묵적 — EVM처럼 DUP/SWAP 같은 스택 정리 연산이 늘 수 있음)")
print(f"레지스터 머신 결과={register_result}, 명령 수={len(register_program)} "
      f"(피연산자 명시 — 값 재사용이 이름으로 드러나 레지스터 할당·JIT에 유리)")
