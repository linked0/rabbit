# 수열·급수·시그마 — 등비급수와 할인율(DCF)
# 고든 성장모형 PV = CF/(d-g) 의 닫힌 형태와, 부분합이 거기로 수렴하는 속도를 함께 본다.

CF, d, g, N = 100.0, 0.08, 0.03, 200

closed = CF / (d - g)                       # 고든 성장모형
partial, term = 0.0, CF / (1 + d)
r = (1 + g) / (1 + d)
for k in range(N):                          # 부분합이 얼마나 빨리 붙는지
    partial += term
    if k in (9, 49, 99, 199):
        print(f"n={k+1:3}  부분합={partial:10.4f}  오차={closed-partial:8.4f}")
    term *= r
print(f"닫힌 형태 = {closed:.4f}")           # 2000.0000
