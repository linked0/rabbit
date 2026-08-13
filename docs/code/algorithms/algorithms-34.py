# 형식 검증 — SAT(브루트포스 충족가능성 판정)와 심볼릭 실행(경로 조건 수집 후 반례 탐색)의 최소 예제.
# 실제로는 CDCL SAT/SMT 솔버를 쓰지만, 작은 변수 공간에서는 완전 탐색으로도 같은 개념을 보여줄 수 있다.

from itertools import product

def sat_solve(clauses, variables):
    """clauses: [[('x',True), ('y',False)], ...] 형태의 CNF. 모든 대입을 완전 탐색해 충족 대입을 찾는다."""
    for values in product([False, True], repeat=len(variables)):
        assignment = dict(zip(variables, values))
        if all(any(assignment[var] == want for var, want in clause) for clause in clauses):
            return assignment
    return None  # UNSAT

# (x OR y) AND (NOT x OR y) AND (x OR NOT y)  ->  x=True, y=True 를 만족해야 한다.
clauses = [[('x', True), ('y', True)], [('x', False), ('y', True)], [('x', True), ('y', False)]]
model = sat_solve(clauses, ['x', 'y'])
print("SAT model:", model)

def vault_withdraw(balance, amount, is_owner):
    """검증 대상 함수: 소유자만, 그리고 잔고 범위 안에서만 출금할 수 있어야 한다는 invariant를 건다."""
    if is_owner and amount <= balance:
        return balance - amount
    return balance  # 조건 불충족이면 상태 불변

def invariant_holds(balance):
    return balance >= 0  # 성질: "잔고는 절대 음수가 될 수 없다"

# 심볼릭 실행: 입력 변수(balance, amount, is_owner)를 구체값 대신 작은 범위 전체로 탐색해
# 경로마다 invariant 위반 여부를 SMT 대신 브루트포스로 판정한다.
counterexample = None
for balance in range(0, 5):
    for amount in range(0, 7):
        for is_owner in (False, True):
            result = vault_withdraw(balance, amount, is_owner)
            if not invariant_holds(result):
                counterexample = (balance, amount, is_owner, result)
                break

print("invariant: withdraw 후 balance >= 0")
print("counterexample found:", counterexample)  # None 이면 이 유한 범위 안에서는 증명된 것
print("proved within explored bounds:", counterexample is None)
