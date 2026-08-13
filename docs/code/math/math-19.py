# 내적·노름·코사인 유사도 — L1/L2/L∞ 노름, 코사인 유사도, 코시-슈바르츠 부등식을 확인한다.

import numpy as np

u = np.array([3.0, 4.0, 0.0])
v = np.array([1.0, 2.0, 2.0])

dot = np.dot(u, v)
print(f"u={u}, v={v}")
print(f"내적 u·v = {dot}")

l1 = np.linalg.norm(u, 1)
l2 = np.linalg.norm(u, 2)
linf = np.linalg.norm(u, np.inf)
print(f"\nu의 노름: L1={l1}, L2={l2}, L∞={linf}")

cos_sim = dot / (np.linalg.norm(u) * np.linalg.norm(v))
print(f"\n코사인 유사도 cos(u,v) = {cos_sim:.4f}")

# 코시-슈바르츠: |u·v| <= ||u|| * ||v||  → 이 부등식 덕분에 cos_sim이 항상 [-1, 1] 안에 있다
cauchy_schwarz_bound = np.linalg.norm(u) * np.linalg.norm(v)
print(f"|u·v| = {abs(dot):.4f}  <=  ||u||*||v|| = {cauchy_schwarz_bound:.4f} ? {abs(dot) <= cauchy_schwarz_bound}")

# 크기가 다른 두 벡터라도 방향이 같으면 코사인 유사도는 1
w = u * 10  # u와 방향은 같고 크기만 10배
print(f"\nw = 10*u 의 코사인 유사도(u,w) = {np.dot(u, w) / (np.linalg.norm(u) * np.linalg.norm(w)):.4f} → 스케일 무시, 방향만 비교")
