# IR과 SSA 형식 — 분기가 있는 프로그램을 SSA로 변환하고 phi 노드로 값을 합류시킨다.
# 원본: x=1; if cond: x=2; y = x+1   →  SSA: x1=1; (분기) x2=2; x3=phi(x1,x2); y=x3+1

def original(cond):
    x = 1
    if cond:
        x = 2
    y = x + 1
    return y

def ssa_form(cond):
    x1 = 1                          # entry 블록에서의 정의
    x2 = None
    if cond:
        x2 = 2                      # then 블록에서의 새 정의 (재대입이 아니라 새 이름)
        pred = "then"
    else:
        pred = "entry"
    # 합류 지점의 phi: 어느 선행 블록에서 왔는지에 따라 값을 고른다
    x3 = x2 if pred == "then" else x1
    y = x3 + 1
    return y

for cond in (True, False):
    o, s = original(cond), ssa_form(cond)
    print(f"cond={cond}: original={o}, ssa={s}, 일치={o == s}")
    assert o == s
