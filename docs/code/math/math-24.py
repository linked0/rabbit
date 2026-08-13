# 수치선형대수(조건수) — κ(A) = σ_max/σ_min 이 클수록 입력의 작은 오차가
# 해의 큰 오차로 증폭됨을 잘 조건화된 행렬과 거의 특이한 행렬을 비교해 확인한다.

import numpy as np

A_good = np.array([[2.0, 0.0], [0.0, 3.0]])          # 축이 직교, 스케일도 비슷 → 잘 조건화됨
A_bad = np.array([[1.0, 1.0], [1.0, 1.0001]])         # 두 행이 거의 평행 → 특이행렬에 근접

b = np.array([1.0, 1.0])
b_perturbed = b + np.array([1e-4, -1e-4])  # b에 아주 작은 오차 주입

for name, A in [("잘 조건화됨", A_good), ("거의 특이 (ill-conditioned)", A_bad)]:
    cond = np.linalg.cond(A)
    x = np.linalg.solve(A, b)
    x_perturbed = np.linalg.solve(A, b_perturbed)

    rel_input_err = np.linalg.norm(b_perturbed - b) / np.linalg.norm(b)
    rel_output_err = np.linalg.norm(x_perturbed - x) / np.linalg.norm(x)

    print(f"[{name}] κ(A) = {cond:.2f}")
    print(f"  입력 상대오차 = {rel_input_err:.2e}")
    print(f"  출력(해) 상대오차 = {rel_output_err:.2e}  (κ(A) * 입력오차 ≈ {cond * rel_input_err:.2e})")
    print(f"  증폭 배율 = {rel_output_err / rel_input_err:.2f}\n")

print("→ 조건수가 큰 A_bad에서 동일한 입력 오차가 훨씬 크게 증폭됨을 확인 — 문제 자체의 성질이지 알고리즘 탓이 아니다.")
