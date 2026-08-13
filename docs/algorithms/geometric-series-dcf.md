# Sequences & Series — Where a Geometric Series Turns Into a Discount Rate

*Daily Math, Day 1/52 · 2026-08-12 · Opening section (the time value of money and markets)*

"Why does the value of an infinitely continuing cash flow come out to a finite number?"
sounds like a finance question, but the whole answer is in the high-school geometric
series. If the common ratio is less than 1, the infinite sum converges — that one line is
DCF's terminal value, a token's total supply, and Bitcoin's 21 million.

> **One-line summary** — The discount rate is the common ratio that decides "how fast to
> shrink the future." For the sum to be finite, that ratio has to be under 1, and that
> condition is exactly the valuation assumption `d > g`.

## The finite sum: derived in one line of algebra

Let a geometric sequence with first term a and common ratio r have partial sum S over n
terms. Multiply both sides by r and subtract, and the middle terms all cancel.

```
S    = a + ar + ar² + … + ar^(n−1)
rS   =     ar + ar² + … + ar^(n−1) + ar^n
─────────────────────────────────────────
S−rS = a − ar^n        →     S = a(1 − r^n)/(1 − r)     (r ≠ 1)
```

This isn't something to memorize — it's a one-line derivation. This same telescoping
(collapsing like a telescope) shows up again in exactly the same shape in the potential
function proof for amortized analysis.

## The infinite sum: it all comes down to the convergence condition

If `|r| < 1`, then r^n → 0 as n → ∞, so

```
S∞ = a / (1 − r)          (only when |r| < 1)
```

If `|r| ≥ 1`, the terms don't shrink and the series diverges. This one condition is the
gate to everything that follows.

| Form | Sum | Condition |
|---|---|---|
| Finite geometric series | a(1 − r^n)/(1 − r) | r ≠ 1 |
| Infinite geometric series | a/(1 − r) | \|r\| < 1 |
| Perpetuity | CF/d | d > 0 |
| Growing perpetuity (Gordon) | CF/(d − g) | **d > g** |

## The discount rate *is* the common ratio

1 unit of currency a year from now is worth 1/(1+d) of it today (discount rate d). Move a
cash flow CF that grows by g each period into present value and sum it, and each term's
ratio to the last is constant — a geometric series.

```
PV = CF/(1+d) + CF(1+g)/(1+d)² + CF(1+g)²/(1+d)³ + …
   → first term a = CF/(1+d),  common ratio r = (1+g)/(1+d)
   → PV = a/(1−r) = CF/(d−g)
```

Here, `r < 1 ⟺ (1+g) < (1+d) ⟺ g < d`. **The valuation assumption that "growth has to be
below the discount rate" isn't a finance convention — it's the series' convergence
condition** — and setting d ≤ g makes the value diverge, at which point the calculation
itself becomes meaningless. It's common for terminal value to make up more than half of
total value in a DCF, which is another way of saying that half comes out of this one
line.

```python
CF, d, g, N = 100.0, 0.08, 0.03, 200

closed = CF / (d - g)                       # Gordon growth model
partial, term = 0.0, CF / (1 + d)
r = (1 + g) / (1 + d)
for k in range(N):                          # how fast the partial sum catches up
    partial += term
    if k in (9, 49, 99, 199):
        print(f"n={k+1:3}  partial={partial:10.4f}  error={closed-partial:8.4f}")
    term *= r
print(f"closed form = {closed:.4f}")           # 2000.0000
```

Convergence speed is also set by the common ratio — r = 1.03/1.08 ≈ 0.954, so the decimal
places don't settle until around the 100th term. **The closer d and g get to each other,
the larger the value gets, and the more unstable it becomes at the same time** — which is
the practical warning this formula carries.

## Where the same series shows up in blockchain

- **Bitcoin's total supply** — the block reward halves every 210,000 blocks, so
  `50 × 210,000 × (1 + ½ + ¼ + …) = 50 × 210,000 × 2 = 21,000,000`.
  The answer to "why exactly 21 million" is the sum of the infinite geometric series,
  `1/(1−½) = 2`.
- **Token emission/vesting** — an emission schedule that shrinks by a fixed ratio each
  period has a total that's computable in closed form. The closer the decay rate is to 1,
  the more "it ends eventually" becomes, in practice, never ending.
- **Exponential backoff** — Verex's ChainJob 5s → 25s → 125s is a **divergent** geometric
  sequence with common ratio 5. The divergence is the point: bundling the total retry
  count on a log scale keeps the system standing even through a run of consecutive
  failures.
- **The present value of a fee stream** — when a protocol's collected fees are valued like
  an asset, the calculation used is exactly the PV = CF/(d−g) above.

## Pitfalls

1. **d ≤ g** — divergence. The spreadsheet spits out a negative number, and the code
   quietly produces something bizarre. Validate the assumption before the calculation.
2. **1 − r in fixed-point** — when d and g are close, the denominator approaches zero and
   precision collapses. If you're doing this math in Solidity, design the division order
   and scale first.
3. **The r = 1 exception** — the derivation's denominator becomes zero, so it needs
   separate handling (sum = a·n).

## Exercises

1. In the code above, raise g to 0.07 (keeping d = 0.08) and check how much larger the
   value gets and how much slower the partial sum converges, then see what happens at
   g = 0.08.
2. Write the halving schedule in code, confirm total supply converges to 21,000,000, and
   see how the total changes if the halving interval isn't 210,000.
3. `1 + ½ + ⅓ + ¼ + …` (the harmonic series) diverges even though its terms go to 0 —
   explain in one paragraph why it's different from a geometric series.

## Related code

[docs/code/math/math-1.py](../code/math/math-1.py) — the Python code above, pulled out
into a runnable file.

---

# 한국어

# 수열·급수·시그마 — 등비급수가 할인율이 되는 지점

*매일의 수학 Day 1/52 · 2026-08-12 · 시작 구간(값의 시간가치와 시장)*

"무한히 이어지는 현금흐름의 가치가 왜 유한한 숫자로 나오는가"는 금융의 질문처럼 보이지만,
답은 전부 고등학교 등비급수에 있다. 공비가 1보다 작으면 무한합이 수렴한다 —
그 한 줄이 DCF의 터미널 밸류이고, 토큰 총발행량이고, 비트코인의 2,100만 개다.

> **한 줄 정리** — 할인율은 "미래를 얼마나 빨리 줄일 것인가"를 정하는 공비다.
> 공비가 1보다 작아야 합이 유한하고, 그 조건이 곧 `d > g` 라는 밸류에이션 가정이다.

## 유한합: 한 줄 트릭으로 유도한다

첫항 a, 공비 r인 등비수열의 n항까지 합 S를 놓고, 양변에 r을 곱해 빼면 가운데가 전부 지워진다.

```
S    = a + ar + ar² + … + ar^(n−1)
rS   =     ar + ar² + … + ar^(n−1) + ar^n
─────────────────────────────────────────
S−rS = a − ar^n        →     S = a(1 − r^n)/(1 − r)     (r ≠ 1)
```

암기 대상이 아니라 **유도 한 줄**이다. 이 telescoping(망원경식 소거)은 분할상환분석의
포텐셜 함수 증명에서도 똑같은 모양으로 다시 나온다.

## 무한합: 수렴 조건이 전부다

`|r| < 1` 이면 n → ∞ 일 때 r^n → 0 이므로

```
S∞ = a / (1 − r)          (|r| < 1일 때만)
```

`|r| ≥ 1` 이면 항이 줄지 않아 발산한다. 이 조건 하나가 아래 모든 이야기의 관문이다.

| 형태 | 합 | 조건 |
|---|---|---|
| 유한 등비급수 | a(1 − r^n)/(1 − r) | r ≠ 1 |
| 무한 등비급수 | a/(1 − r) | \|r\| < 1 |
| 영구연금(perpetuity) | CF/d | d > 0 |
| 성장 영구연금(Gordon) | CF/(d − g) | **d > g** |

## 할인율이 곧 공비다

1년 뒤의 1원은 지금의 1/(1+d)원이다(할인율 d). 매년 g만큼 성장하는 현금흐름 CF를
현재가치로 옮겨 더하면, 각 항의 비율이 일정한 등비급수가 된다.

```
PV = CF/(1+d) + CF(1+g)/(1+d)² + CF(1+g)²/(1+d)³ + …
   → 첫항 a = CF/(1+d),  공비 r = (1+g)/(1+d)
   → PV = a/(1−r) = CF/(d−g)
```

여기서 `r < 1 ⟺ (1+g) < (1+d) ⟺ g < d` 다. **"성장률이 할인율보다 작아야 한다"는
밸류에이션의 가정은 재무 관습이 아니라 급수의 수렴 조건**이고, d ≤ g로 잡으면 값이
발산해 계산 자체가 무의미해진다. DCF에서 터미널 밸류가 전체 가치의 절반 이상을
차지하는 경우가 흔한데, 그 절반이 이 한 줄에서 나온다는 뜻이기도 하다.

```python
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
```

수렴 속도도 공비가 정한다 — r = 1.03/1.08 ≈ 0.954 라 100항쯤에서야 소수점이 맞는다.
**d와 g가 가까울수록 값이 커지고 동시에 불안정해진다**는 게 이 수식의 실질적 경고다.

## 블록체인에서 같은 급수가 나오는 자리

- **비트코인 총발행량** — 21만 블록마다 보상이 절반이 되므로
  `50 × 210,000 × (1 + ½ + ¼ + …) = 50 × 210,000 × 2 = 21,000,000`.
  "왜 하필 2,100만"이라는 질문의 답이 무한 등비급수의 합 `1/(1−½) = 2` 다.
- **토큰 이미션·베스팅** — 매 기간 일정 비율로 줄어드는 배출 스케줄의 총량은 닫힌 형태로
  계산된다. 감소율이 1에 가까우면 "언젠가 끝난다"가 실무적으로는 끝나지 않는다.
- **지수 백오프** — Verex ChainJob 의 5s → 25s → 125s 는 공비 5인 **발산하는** 등비수열이다.
  발산이 목적이다: 재시도 총 횟수를 로그로 묶어 실패가 이어져도 시스템이 버틴다.
- **수수료 흐름의 현재가치** — 프로토콜이 걷는 수수료를 자산처럼 평가할 때 쓰는 계산이
  정확히 위의 PV = CF/(d−g)이다.

## 함정

1. **d ≤ g** — 발산. 스프레드시트는 음수를 뱉고, 코드는 조용히 이상한 값을 낸다.
   가정 검증을 계산 앞에 두어야 한다.
2. **고정소수점에서의 1 − r** — d와 g가 가까우면 분모가 0에 가까워져 정밀도가 무너진다.
   Solidity에서 이런 계산을 한다면 나눗셈 순서와 스케일을 먼저 설계할 것.
3. **r = 1 예외** — 유도식의 분모가 0이 되므로 별도 처리(합 = a·n)가 필요하다.

## 연습

1. 위 코드에서 g를 0.07로 올려(d = 0.08 유지) 값이 얼마나 커지고 부분합 수렴이 얼마나
   느려지는지 확인하고, g = 0.08에서 무슨 일이 벌어지는지 볼 것.
2. 반감기 스케줄을 코드로 써서 총발행량이 21,000,000에 수렴하는 걸 확인하고,
   반감기 간격을 21만이 아닌 값으로 바꿨을 때 총량이 어떻게 변하는지 볼 것.
3. `1 + ½ + ⅓ + ¼ + …`(조화급수)는 항이 0으로 가는데도 발산한다 — 왜 등비급수와
   다른지 한 문단으로 설명해 볼 것.

## 관련 코드

[docs/code/math/math-1.py](../code/math/math-1.py) — 위 파이썬 코드를 그대로 실행 가능한 파일로 뺀 것.
