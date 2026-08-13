# 마르코프 체인(개념) — 전이행렬의 거듭제곱 vs 정상분포(선형방정식) 비교
# 행 i, 열 j = "상태 i에서 상태 j로 갈 확률" 관례(행 합=1). 분포는 행벡터로 다룬다:
# dist_next[j] = sum_i dist[i] * P[i][j]

def step(dist, P):
    n = len(dist)
    return [sum(dist[i] * P[i][j] for i in range(n)) for j in range(n)]

# 상태: 0=pending, 1=included, 2=dropped (흡수상태가 있는 체인)
P = [
    [0.6, 0.3, 0.1],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
]

dist = [1.0, 0.0, 0.0]  # 전부 pending에서 시작
for t in range(1, 21):
    dist = step(dist, P)
    if t in (1, 2, 5, 10, 20):
        print(f"step={t:2}  분포(pending,included,dropped)={[round(x, 4) for x in dist]}")
print("-> 흡수상태(included/dropped)가 있으면 정상분포는 자명(전부 흡수)해진다.\n")

# 흡수상태가 없는 기약·비주기(순환) 체인에서는 유일한 정상분포로 수렴한다
Q = [
    [0.5, 0.3, 0.2],
    [0.2, 0.5, 0.3],
    [0.3, 0.2, 0.5],
]

dist2 = [1.0, 0.0, 0.0]
for _ in range(200):
    dist2 = step(dist2, Q)
print("Q를 200번 거듭제곱해 근사한 정상분포:", [round(x, 6) for x in dist2])

# 정상분포는 pi = pi*Q, 즉 pi*(Q - I) = 0 을 만족하는 (좌)고유벡터다.
# (Q^T - I)^T pi^T = 0 형태의 3x3 선형시스템을 세우고 정규화 조건으로 한 식을 교체해 가우스 소거로 검증
n = 3
A = [[Q[j][i] - (1.0 if i == j else 0.0) for j in range(n)] for i in range(n)]  # A @ pi = 0  <=>  pi*Q = pi
A[-1] = [1.0, 1.0, 1.0]  # 정규화 행(합=1)으로 교체
b = [0.0, 0.0, 1.0]

M = [row[:] + [b[i]] for i, row in enumerate(A)]
for col in range(n):
    piv = max(range(col, n), key=lambda r: abs(M[r][col]))
    M[col], M[piv] = M[piv], M[col]
    for r in range(n):
        if r != col:
            factor = M[r][col] / M[col][col]
            M[r] = [M[r][k] - factor * M[col][k] for k in range(n + 1)]
pi = [M[i][-1] / M[i][i] for i in range(n)]
print("선형방정식(고유벡터)으로 구한 정상분포 pi:", [round(x, 6) for x in pi])
print("일치 여부:", all(abs(a - b) < 1e-4 for a, b in zip(dist2, pi)))
