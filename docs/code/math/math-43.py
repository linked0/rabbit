# 상관관계와 공적분(가볍게) — 수준(level) 상관의 함정 vs 스프레드의 평균회귀
# 두 계열이 각자 추세를 가지면 아무 관계가 없어도 수준끼리는 강하게 "상관"돼 보인다(허위회귀).

import random
import statistics

random.seed(3)
N = 500

def corr(xs, ys):
    mx, my = statistics.mean(xs), statistics.mean(ys)
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sx = (sum((x - mx) ** 2 for x in xs)) ** 0.5
    sy = (sum((y - my) ** 2 for y in ys)) ** 0.5
    return cov / (sx * sy)

# 1) 서로 무관한 두 랜덤워크(각자 추세만 가짐) — 진짜 관계는 없다
a_level = [100.0]
b_level = [50.0]
for _ in range(N):
    a_level.append(a_level[-1] + random.gauss(0.15, 1.0))  # 독립적인 상승 추세(추세가 노이즈를 압도)
    b_level.append(b_level[-1] + random.gauss(0.10, 1.0))
a_ret = [a_level[i] - a_level[i - 1] for i in range(1, len(a_level))]
b_ret = [b_level[i] - b_level[i - 1] for i in range(1, len(b_level))]

print(f"[무관한 두 랜덤워크] 수준(level) 상관 = {corr(a_level, b_level):.3f}  (허위로 높게 나옴)")
print(f"[무관한 두 랜덤워크] 수익률(return) 상관 = {corr(a_ret, b_ret):.3f}  (실제로는 0에 가까움)")

# 2) 공적분 관계: 두 계열은 각자 비정상(추세)이지만 스프레드는 평균회귀하도록 구성
x_level = [100.0]
for _ in range(N):
    x_level.append(x_level[-1] + random.gauss(0.0, 1.0))

spread = [0.0]
for _ in range(N):
    # 스프레드가 커질수록 되돌아오는 힘(AR(1), 계수<1 => 평균회귀) + 노이즈
    spread.append(spread[-1] * 0.8 + random.gauss(0.0, 0.5))

y_level = [x_level[i] - spread[i] for i in range(N + 1)]

print(f"\n[공적분 쌍] 수준 상관 = {corr(x_level, y_level):.3f}")
print(f"[공적분 쌍] 스프레드 평균/표준편차 = {statistics.mean(spread):.3f} / {statistics.stdev(spread):.3f}")
print(f"[공적분 쌍] 스프레드가 [-3, 3] 범위 안에 머문 비율 = {sum(-3 <= s <= 3 for s in spread) / len(spread):.2%}")
print("-> 스프레드가 특정 범위를 벗어나지 않고 되돌아온다면 두 계열이 장기적으로 묶여있다는 신호(공적분).")
