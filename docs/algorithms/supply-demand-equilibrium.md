# Supply, Demand, Utility, Market Equilibrium — Price Is Discovered, Not Computed

*Daily Math, Day 2/52 · 2026-08-11 · Entry point into August's section (game theory & economics)*

**Where to stop**: it's enough to have graphical intuition for where supply and demand
curves cross, and to be able to explain "how does price move when supply is a vertical
line." A full read of a microeconomics textbook is out of scope.

## Equilibrium is convergence, not computation

The demand curve `D(p)` — "the quantity people will buy at price p" — slopes downward,
and the supply curve `S(p)` — "the quantity people will sell at price p" — slopes upward.
The equilibrium price `p*` is where they meet.

```
D(p*) = S(p*)
```

What matters is that this equation isn't **an answer you solve for — it's the point
where feedback arrives.** Excess demand (more buyers than sellers) pushes price up,
which trims demand; excess supply pushes price down, which fills it back in. Nobody
computes p* and announces it, yet the market gets there anyway — that's **discovery**.

## Why block space is special: the supply curve is vertical

For an ordinary good, supply rises along with price. Block space doesn't work that way —
**the per-block gas ceiling is fixed**, so no matter how high the price goes, the amount
that fits in one block stays the same. That means the supply curve is vertical, and once
it is, **price is set entirely by the demand side.**

```python
import numpy as np

p = np.linspace(0, 100, 1001)

# ① Upward-sloping supply: D(p) = 100 - 2p, S(p) = 10 + p
D, S = 100 - 2*p, 10 + p
i = np.argmin(np.abs(D - S))
base_elastic = p[i]                      # p* = 30

# ② Vertical supply (the gas ceiling): S = 40, fixed
j = np.argmin(np.abs(D - 40))
base_vertical = p[j]                     # p* = 30 — matched to the same starting point

# Give both the same demand shock (+50)
D2 = 150 - 2*p
shocked_elastic  = p[np.argmin(np.abs(D2 - (10 + p)))]
shocked_vertical = p[np.argmin(np.abs(D2 - 40))]

for name, a, b in [("elastic supply", base_elastic, shocked_elastic),
                   ("vertical supply", base_vertical, shocked_vertical)]:
    print(f"{name}: {a:.0f} -> {b:.0f}  ({(b/a - 1)*100:+.0f}%)")
```

Even with the same size demand shock, **the elastic-supply side takes on a small price
rise and a volume increase, splitting the shock — while the vertical-supply side can't
add any volume at all, so the entire shock goes into price.** That one picture is why gas
fees can spike 10x on a single memecoin mint.

## From here it leads into EIP-1559

**Hand price discovery in a vertical-supply market to a (first-price) auction** and every
user has to guess "how much will everyone else bid" — guess wrong and you either overpay
or don't get included. What EIP-1559 did was **move that discovery into an algorithm** —
a base fee that rises and falls based on the previous block's congestion, a feedback
loop. Instead of the market rediscovering price from scratch every time, the protocol
remembers the previous observation.

**Other cases in the same grammar**
- **EIP-8363** — adds a burn term to the staking demand curve, changing its slope.
- **LMSR** (November) — replaces a prediction market's price discovery, not with an order
  book, but with **a single curve.**
  `C(q) = b·ln(Σe^(qᵢ/b))`, and worst-case subsidy is bounded above by `b·ln(n)`.

All three cases treat "who discovers the price, and how" as the design surface.

## Exercise

Compare the rate of price increase between the two supply shapes in the code above, and
sum up in one sentence **"why is gas-fee volatility especially large."**

## Related code

[docs/code/math/math-2.py](../code/math/math-2.py) — the Python code above, pulled out
into a runnable file.

---

# 한국어

# 공급·수요·시장균형 — 가격은 계산되는 게 아니라 발견된다

*매일의 수학 Day 8/50 · 2026-08-11 · 8월 영역(게임이론·경제학) 입장*

**멈춤선**: 수요·공급 곡선의 교차를 그래프 직관으로 갖고, "공급이 수직선일 때 가격이
어떻게 움직이는가"를 설명할 수 있으면 충분. 미시경제 교과서 정독은 하지 않는다.

## 균형은 계산이 아니라 수렴이다

수요곡선 `D(p)`는 "가격이 p면 사겠다는 양"이라 우하향하고, 공급곡선 `S(p)`는 "가격이
p면 팔겠다는 양"이라 우상향한다. 균형가격 `p*`는 둘이 만나는 점이다.

```
D(p*) = S(p*)
```

중요한 건 이 등식이 **풀어서 얻는 답이 아니라 피드백이 도달하는 자리**라는 것이다.
초과수요(사려는 쪽이 많음)면 가격이 올라 수요를 깎고, 초과공급이면 가격이 내려 수요를
채운다. 아무도 `p*`를 계산해서 공표하지 않는데도 시장이 거기로 간다 — **발견**이다.

## 블록 공간이 특별한 이유: 공급곡선이 수직선

일반 재화는 가격이 오르면 공급이 따라 는다. 블록 공간은 그렇지 않다 — **블록당 가스
상한이 고정**이라 가격이 아무리 올라도 한 블록에 들어가는 양은 그대로다. 공급곡선이
수직선이라는 뜻이고, 그러면 **가격이 전부 수요 쪽에서 결정된다.**

```python
import numpy as np

p = np.linspace(0, 100, 1001)

# ① 우상향 공급: D(p) = 100 - 2p, S(p) = 10 + p
D, S = 100 - 2*p, 10 + p
i = np.argmin(np.abs(D - S))
base_elastic = p[i]                      # p* = 30

# ② 수직 공급(가스 상한): S = 40 고정
j = np.argmin(np.abs(D - 40))
base_vertical = p[j]                     # p* = 30 — 출발점을 같게 맞춘다

# 같은 수요 충격(+50)을 양쪽에 준다
D2 = 150 - 2*p
shocked_elastic  = p[np.argmin(np.abs(D2 - (10 + p)))]
shocked_vertical = p[np.argmin(np.abs(D2 - 40))]

for name, a, b in [("우상향 공급", base_elastic, shocked_elastic),
                   ("수직 공급  ", base_vertical, shocked_vertical)]:
    print(f"{name}: {a:.0f} → {b:.0f}  ({(b/a - 1)*100:+.0f}%)")
```

수요가 같은 크기로 뛰어도 **탄력적 공급 쪽은 가격이 조금 오르고 물량이 늘어 충격을
나눠 받는 반면, 수직 공급 쪽은 물량이 1도 늘 수 없어 충격이 전부 가격으로 간다.**
가스비가 밈코인 민팅 하나에 10배씩 뛰는 이유가 이 그림 한 장이다.

## 여기서 EIP-1559로 이어진다

수직 공급 시장의 가격 발견을 **경매(1st-price)에 맡기면** 사용자는 "남들이 얼마 낼까"를
추측해야 하고, 그 추측이 틀리면 과지불하거나 포함되지 않는다. EIP-1559가 한 일은 그
발견을 **알고리즘으로 옮긴 것**이다 — base fee가 직전 블록의 혼잡도를 보고 오르내리는
피드백 루프. 시장이 매번 처음부터 가격을 찾는 대신, 프로토콜이 이전 관측을 기억한다.

**같은 문법의 다른 사례들**
- **EIP-8363** — 스테이킹 수요곡선에 소각 항을 넣어 기울기를 바꾼다.
- **LMSR**(11월) — 예측시장의 가격 발견을 호가창이 아니라 **곡선 하나**로 대체한다.
  `C(q) = b·ln(Σe^(qᵢ/b))`, 최악 보조금은 `b·ln(n)`으로 상한이 잡힌다.

세 사례 모두 "가격을 누가 어떻게 발견하는가"를 설계 대상으로 삼는다.

## 연습

위 코드에서 두 공급 형태의 가격 상승률을 비교하고, **"왜 가스비 변동성은 유독 큰가"**를
한 문장으로 정리해 볼 것.

## 관련 코드

[docs/code/math/math-2.py](../code/math/math-2.py) — 위 파이썬 코드를 그대로 실행 가능한 파일로 뺀 것.
