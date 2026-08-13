# Day 13: 선형계획과 쌍대성 직관 — 경매·배분 문제의 원문제/쌍대문제
# 2변수 LP를 꼭짓점 열거로 풀고, 쌍대 LP도 같은 방식으로 풀어 강쌍대성(최적값 일치)을 확인한다.

def line_intersections(constraints):
    pts = []
    for i in range(len(constraints)):
        for j in range(i + 1, len(constraints)):
            a1, b1, _, c1 = constraints[i]
            a2, b2, _, c2 = constraints[j]
            det = a1 * b2 - a2 * b1
            if abs(det) < 1e-9:
                continue
            pts.append(((c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det))
    return pts

def feasible(pt, constraints, tol=1e-6):
    x, y = pt
    for a, b, op, c in constraints:
        val = a * x + b * y
        if op == "<=" and val > c + tol:
            return False
        if op == ">=" and val < c - tol:
            return False
    return True

def solve_lp_2d(constraints, obj, maximize):
    candidates = [p for p in line_intersections(constraints) if feasible(p, constraints)]
    key = lambda p: obj[0] * p[0] + obj[1] * p[1]
    best = max(candidates, key=key) if maximize else min(candidates, key=key)
    return best, key(best)

# 원문제: maximize x + 2y  s.t.  x+y<=4, x+3y<=6, x,y>=0  (자원 배분: 두 재화를 두 제약 아래 최대화)
primal_constraints = [(1, 1, "<=", 4), (1, 3, "<=", 6), (1, 0, ">=", 0), (0, 1, ">=", 0)]
p_pt, p_val = solve_lp_2d(primal_constraints, (1, 2), maximize=True)

# 쌍대문제: minimize 4u + 6v  s.t.  u+v>=1, u+3v>=2, u,v>=0  (쌍대변수 = 각 제약의 잠재가격)
dual_constraints = [(1, 1, ">=", 1), (1, 3, ">=", 2), (1, 0, ">=", 0), (0, 1, ">=", 0)]
d_pt, d_val = solve_lp_2d(dual_constraints, (4, 6), maximize=False)

print(f"원문제 최적해 (x,y) = ({p_pt[0]:.2f}, {p_pt[1]:.2f}), 최적값 = {p_val:.2f}")
print(f"쌍대문제 최적해 (u,v) = ({d_pt[0]:.2f}, {d_pt[1]:.2f}), 최적값 = {d_val:.2f}")
print(f"강쌍대성 확인 (원문제 최적값 == 쌍대문제 최적값): {abs(p_val - d_val) < 1e-6}")
