# 행렬식과 랭크 — det=0 <=> 열이 선형종속 <=> 역행렬 없음 <=> 랭크 부족, 을 수치로 확인한다.

import numpy as np

A_full_rank = np.array([[1.0, 2.0, 0.0],
                         [0.0, 1.0, 3.0],
                         [4.0, 0.0, 1.0]])

# 세 번째 열을 앞 두 열의 선형결합으로 만들어 일부러 랭크를 하나 부족하게 만든 행렬
A_deficient = A_full_rank.copy()
A_deficient[:, 2] = 2 * A_full_rank[:, 0] - A_full_rank[:, 1]

for name, A in [("full-rank 행렬", A_full_rank), ("랭크 부족 행렬 (열3 = 2*열1 - 열2)", A_deficient)]:
    det = np.linalg.det(A)
    rank = np.linalg.matrix_rank(A)
    invertible = not np.isclose(det, 0)
    print(f"[{name}]")
    print(f"  det(A) = {det:.6f}")
    print(f"  rank(A) = {rank} (정방행렬 크기 = {A.shape[0]})")
    print(f"  역행렬 존재? {invertible}\n")

# 랭크-널리티 정리: rank(A) + dim(null(A)) = n (열 개수)
n = A_deficient.shape[1]
rank_deficient = np.linalg.matrix_rank(A_deficient)
# SVD로 영공간 차원을 구한다 (특이값이 ~0인 개수)
_, S, _ = np.linalg.svd(A_deficient)
nullity = np.sum(np.isclose(S, 0))
print(f"랭크-널리티 검증: rank({rank_deficient}) + nullity({nullity}) = {rank_deficient + nullity} = n({n})")
