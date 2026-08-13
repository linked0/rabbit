# 공급·수요·효용·시장균형 — 블록 공간(수직 공급)은 같은 수요 충격을 전부 가격으로 받는다.
# 우상향 공급 vs 수직 공급(가스 상한)에 같은 수요 충격(+50)을 주고 가격 변화를 비교한다.

import numpy as np

p = np.linspace(0, 100, 1001)

# ① 우상향 공급: D(p) = 100 - 2p, S(p) = 10 + p
D, S = 100 - 2 * p, 10 + p
i = np.argmin(np.abs(D - S))
base_elastic = p[i]                      # p* = 30

# ② 수직 공급(가스 상한): S = 40 고정
j = np.argmin(np.abs(D - 40))
base_vertical = p[j]                     # p* = 30 — 출발점을 같게 맞춘다

# 같은 수요 충격(+50)을 양쪽에 준다
D2 = 150 - 2 * p
shocked_elastic = p[np.argmin(np.abs(D2 - (10 + p)))]
shocked_vertical = p[np.argmin(np.abs(D2 - 40))]

for name, a, b in [("우상향 공급", base_elastic, shocked_elastic),
                    ("수직 공급  ", base_vertical, shocked_vertical)]:
    print(f"{name}: {a:.0f} -> {b:.0f}  ({(b / a - 1) * 100:+.0f}%)")
