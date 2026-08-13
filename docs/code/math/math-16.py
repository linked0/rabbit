# 조합 게임이론(제로섬 vs 비제로섬) — 제로섬(Matching Pennies)의 minimax=maximin 값을
# 그리드서치로 확인하고, 비제로섬(죄수의 딜레마)의 순수전략 내시균형을 직접 탐색한다.

import numpy as np

# --- 제로섬: Matching Pennies. Row 이득 행렬 (Column 이득은 정확히 -Row) ---
A = np.array([[1, -1],
              [-1, 1]], dtype=float)

ps = np.linspace(0, 1, 2001)  # Row가 action0을 고를 확률 p

# Row(최대화)가 p를 고르면, Column(최소화)은 자신에게 최선인(=Row에게 최악인) 열을 선택
maximin = max(min(p * A[0, 0] + (1 - p) * A[1, 0], p * A[0, 1] + (1 - p) * A[1, 1]) for p in ps)
# Column(최소화)이 q를 고르면, Row(최대화)는 자신에게 최선인 행을 선택
minimax = min(max(q * A[0, 0] + (1 - q) * A[0, 1], q * A[1, 0] + (1 - q) * A[1, 1]) for q in ps)

print("Matching Pennies (제로섬) — payoff 행렬:")
print(A)
print(f"maximin(row가 확보 가능한 최소 기대이득의 최대치) = {maximin:.4f}")
print(f"minimax(column이 허용하는 최대 기대손실의 최소치) = {minimax:.4f}")
print("→ 두 값이 (거의) 같다 = minimax 정리: 혼합전략 하에서 게임의 값이 유일하게 존재\n")

# --- 비제로섬: 죄수의 딜레마. Row/Col 각자의 payoff 행렬이 따로 있고 합이 일정하지 않음 ---
# 행/열: 0=협력, 1=배신
R = np.array([[3, 0], [5, 1]])  # Row의 payoff
C = np.array([[3, 5], [0, 1]])  # Column의 payoff

nash = []
for i in range(2):
    for j in range(2):
        row_best = max(R[:, j]) == R[i, j]     # Row가 j 고정 시 i가 최선인가
        col_best = max(C[i, :]) == C[i, j]     # Column이 i 고정 시 j가 최선인가
        if row_best and col_best:
            nash.append((i, j))

labels = ["협력", "배신"]
print("죄수의 딜레마 (비제로섬) — 순수전략 내시균형:")
for i, j in nash:
    print(f"  - (Row={labels[i]}, Col={labels[j]})  payoff=({R[i,j]}, {C[i,j]})")
print("→ payoff 합이 칸마다 다르다(3+3=6 vs 5+0=5 vs 1+1=2): 제로섬이 아니라서 협력이 상호 이득이지만,")
print("  각자의 지배전략은 배신이라 균형은 (배신, 배신)뿐 — 파레토 열등한 결과가 균형이 된다.")
