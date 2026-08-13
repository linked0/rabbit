# Amortized Analysis via the Potential Method — Prepaying for the Expensive Operation

*Developer Knowledge 100, Day 1/100 · 2026-08-12 · Section A, Advanced Algorithms*

Inserting into a dynamic array is O(1) most of the time, but every so often the whole
array gets copied and that one insert costs O(n). We want to say "O(1) on average," but
we need to prove that "average" isn't just wishful thinking. Amortized analysis is that
proof, and the potential method is its most mechanical tool.

> **One-line summary** — Charge a little extra on cheap operations and bank it; when an
> expensive operation comes along, pay for it out of the bank. The whole proof reduces to
> showing the balance never goes negative.

## Three techniques, and what separates them

| Technique | How it works | When to use it |
|---|---|---|
| Aggregate | Sum the total cost of n operations directly, divide by n | Simplest when there's only one kind of operation |
| Accounting | Charge each operation an arbitrary "fee" and show the balance never goes negative | When there are several kinds of operations |
| **Potential** | Summarize the data structure's state as a single real number Φ and work with its change | When you don't need to track *where* the banked cost lives |

The accounting method has to follow the banked cost around — "this element is carrying
its own future copy cost." The potential method collapses that into a single state
function, which is why the proof gets shorter. All three give the same conclusion; they
just express it differently.

## Definition

For the state $D_i$ after the i-th operation, fix a potential function $\Phi(D_i) \ge 0$
with $\Phi(D_0) = 0$. The **amortized cost** of the i-th operation is its actual cost plus
the change in potential.

```
ĉ_i = c_i + Φ(D_i) − Φ(D_{i−1})
```

Summing the amortized cost over n operations telescopes the middle terms away:

```
Σ ĉ_i = Σ c_i + Φ(D_n) − Φ(D_0) = Σ c_i + Φ(D_n) ≥ Σ c_i
```

In other words, **if Φ ≥ 0 and Φ(D_0) = 0, the sum of amortized costs is an upper bound on
the sum of actual costs**. So showing "ĉ_i ≤ O(1) for every i" is enough to conclude the
total cost is O(n). All the creativity in the proof goes into picking Φ.

## Example 1 — why doubling a dynamic array is O(1) amortized

When the array fills up, double its capacity and copy everything over. With `num`
elements and `size` capacity, pick the potential

```
Φ = 2·num − size
```

This is "a bank balance that grows as the remaining headroom before the array fills
shrinks." Right after a doubling, num = size/2, so Φ = 0; when the array is full,
num = size, so Φ = num.

- **Insert without a copy**: c = 1, num goes up by 1 and size stays the same → ΔΦ = 2.
  `ĉ = 1 + 2 = 3`
- **Insert that triggers a copy**: just before, num = size = k. Cost including the copy is
  c = k + 1. The new state has num = k+1, size = 2k, so Φ_new = 2(k+1) − 2k = 2 and
  Φ_old = 2k − k = k.
  `ĉ = (k + 1) + (2 − k) = 3`

Both cases give ĉ = 3 = O(1). The k in the expensive insert's cost is exactly cancelled by
the −k in ΔΦ — meaning the k preceding cheap inserts had already banked that cost. **A
single worst-case insert is still O(n), but the sum over n inserts is O(n)** — and telling
those two apart is the entire point of this analysis.

```python
# See for yourself that the bank balance never actually goes negative
num, size, total = 0, 1, 0
phi = lambda: 2 * num - size
for i in range(1, 33):
    before = phi()
    if num == size:                 # full → double capacity + copy
        cost = num + 1; size *= 2
    else:
        cost = 1
    num += 1
    amortized = cost + phi() - before
    total += cost
    assert phi() >= 0 and amortized <= 3
    print(f"i={i:2} cost={cost:2} Φ={phi():2} ĉ={amortized} total={total}")
```

## Example 2 — why 2x works, but so would 1.5x or 3x

Generalize the growth factor to r > 1: Φ takes the form
(r/(r−1))·num − (1/(r−1))·size, and the amortized cost becomes a constant around
r/(r−1) + 1. The closer r is to 1, the bigger that constant (copies happen more often);
the larger r is, the more memory gets wasted. **The constant is set by r, but the fact
that it's O(1) holds for any r > 1** — which is why 1.5x (friendlier to memory reuse) and
2x (simpler arithmetic) both show up in practice.

Conversely, if growth is **additive** (always +c), total cost becomes Θ(n²) and the
amortized argument breaks down. Geometric growth is the condition that makes this whole
argument work.

## A trap: halving the shrink threshold breaks it

If the policy is "double when full, halve when at most half full," alternating insert and
delete near the boundary triggers a copy on every single operation, and O(n) repeats.
The standard fix is **halve only when at most a quarter full**, and with that change,
defining Φ separately for the num ≥ size/2 region and the region below it proves O(1)
again. This is where the potential method earns its keep in practice — it lets you decide
whether a policy change is safe **by calculation, not by intuition**.

## Practical connection — Verex

The EVM is designed in exactly the opposite direction. Gas charges the **worst-case cost
of every operation up front** — if amortization were allowed, one transaction could spend
down a neighboring transaction's banked balance, and that would break DoS resistance. So
pushing to a dynamic array in Solidity doesn't get amortized O(1); it costs the full
storage-write price every single time.

Amortized thinking actually gets used off-chain. Verex's ChainJob worker's exponential
backoff (5s → 25s → 125s) admits the same style of argument — because the retry interval
grows geometrically, the total number of retries stays bounded logarithmically even
through a run of consecutive failures. Indexer batch sizes, order-book snapshot
intervals — any design that "occasionally does something expensive in bulk" is a
candidate for this analysis, and there's one test: **does the frequency of the expensive
thing shrink in inverse proportion to its cost?**

## Exercises

1. In the Python code above, change the growth factor to 1.5x and to 3x, measure how the
   upper bound on ĉ changes, and compare it against r/(r−1) + 1.
2. Implement the "halve when at most half full" policy, reproduce the Θ(n²) blowup when
   alternating insert and delete, and confirm switching to the 1/4 policy makes it linear
   again.
3. For a stack's multipop operation (popping k elements at once), set Φ = stack size and
   prove by hand that push, pop, and multipop are all amortized O(1).

## Related code

[docs/code/algorithms/algorithms-1.py](../code/algorithms/algorithms-1.py) — the Python
code above, pulled out into a runnable file.

---

# 한국어

# 포텐셜 함수로 하는 분할상환 분석 — 비싼 연산의 값을 미리 치러 두기

*개발자 지식 100 Day 1/100 · 2026-08-12 · A 고급 알고리즘 구간*

동적 배열에 원소를 넣는 비용은 대부분 O(1)인데, 가끔 배열 전체를 복사하느라 O(n)이 된다.
"평균적으로 O(1)"이라고 말하고 싶지만, 그 '평균'이 운에 기대는 말이 아니라는 걸
증명해야 한다. 분할상환분석(amortized analysis)이 그 증명이고, 포텐셜 함수는
그중 가장 기계적인 도구다.

> **한 줄 정리** — 싼 연산에서 요금을 조금씩 더 받아 저금해 두고, 비싼 연산이 오면
> 그 저금으로 낸다. 저금 잔액이 음수가 되지 않는다는 것만 보이면 증명이 끝난다.

## 세 가지 기법과 그 차이

| 기법 | 방식 | 쓸 때 |
|---|---|---|
| 총계(aggregate) | n번 연산의 총비용을 직접 세고 n으로 나눔 | 연산이 한 종류일 때 가장 간단 |
| 회계(accounting) | 연산마다 임의의 '요금'을 매기고 잔액이 음수가 아님을 보임 | 연산 종류가 여러 개일 때 |
| **포텐셜(potential)** | 자료구조의 상태를 하나의 실수 Φ로 요약하고 그 변화량으로 계산 | 상태에 저금이 '어디' 쌓였는지 추적하지 않아도 될 때 |

회계법은 "이 원소가 자기 복사 비용을 들고 있다"처럼 저금의 **위치**를 따라다녀야 한다.
포텐셜법은 그걸 상태 함수 하나로 뭉개기 때문에 증명이 짧아진다. 셋은 표현만 다를 뿐
같은 결론을 준다.

## 정의

상태 $D_i$ (i번째 연산 후)에 대해 포텐셜 함수 $\Phi(D_i) \ge 0$, $\Phi(D_0) = 0$ 을 잡는다.
i번째 연산의 **분할상환 비용**은 실제 비용에 포텐셜 변화량을 더한 값이다.

```
ĉ_i = c_i + Φ(D_i) − Φ(D_{i−1})
```

n번의 총 분할상환 비용을 더하면 가운데가 전부 소거(telescoping)되어

```
Σ ĉ_i = Σ c_i + Φ(D_n) − Φ(D_0) = Σ c_i + Φ(D_n) ≥ Σ c_i
```

즉 **Φ ≥ 0 이고 Φ(D_0) = 0 이면 분할상환 비용의 합은 실제 비용의 합의 상한**이다.
그래서 "모든 i에 대해 ĉ_i ≤ O(1)"만 보이면 총비용이 O(n)이라는 결론이 따라온다.
증명의 창의성은 전부 Φ를 고르는 데 들어간다.

## 예제 1 — 동적 배열 doubling이 왜 O(1) 분할상환인가

배열이 가득 차면 크기를 2배로 늘리고 전부 복사한다. 원소 수를 `num`, 용량을 `size`라 할 때
포텐셜을 이렇게 잡는다.

```
Φ = 2·num − size
```

이 값은 "가득 차기까지 남은 여유가 줄어들수록 커지는 저금"이다.
용량을 막 2배로 늘린 직후엔 num = size/2 이므로 Φ = 0, 가득 찼을 땐 num = size 이므로 Φ = num.

- **복사 없는 삽입**: c = 1, num이 1 늘고 size는 그대로 → ΔΦ = 2.
  `ĉ = 1 + 2 = 3`
- **복사가 일어나는 삽입**: 직전에 num = size = k. 복사 비용 포함 c = k + 1.
  새 상태는 num = k+1, size = 2k 이므로 Φ_new = 2(k+1) − 2k = 2, Φ_old = 2k − k = k.
  `ĉ = (k + 1) + (2 − k) = 3`

두 경우 모두 ĉ = 3 = O(1). 비싼 삽입의 k가 ΔΦ의 −k와 정확히 상쇄된다 — 앞선 k번의 싼
삽입이 이미 그 비용을 저금해 뒀다는 뜻이다. **최악 단건은 여전히 O(n)이지만 총합은 O(n)**이고,
이 둘을 구분하는 것이 이 분석의 전부다.

```python
# 저금이 실제로 음수가 되지 않는지 눈으로 확인해 보는 코드
num, size, total = 0, 1, 0
phi = lambda: 2 * num - size
for i in range(1, 33):
    before = phi()
    if num == size:                 # 가득 참 → 2배 확장 + 복사
        cost = num + 1; size *= 2
    else:
        cost = 1
    num += 1
    amortized = cost + phi() - before
    total += cost
    assert phi() >= 0 and amortized <= 3
    print(f"i={i:2} cost={cost:2} Φ={phi():2} ĉ={amortized} 누적={total}")
```

## 예제 2 — 왜 1.5배가 아니라 2배여도, 3배여도 되는가

성장률을 r > 1로 두면 Φ = (r/(r−1))·(num) − (1/(r−1))·size 꼴로 일반화되고,
분할상환 비용은 r/(r−1) + 1 정도의 상수가 된다. r이 1에 가까울수록 상수가 커지고(복사가 잦다),
r이 클수록 메모리 낭비가 커진다. **상수는 r이 정하고, O(1)이라는 사실은 r > 1이면 항상 성립한다** —
실무에서 1.5배(메모리 재사용에 유리)와 2배(계산이 쉬움)가 갈리는 이유가 여기 있다.

반대로 성장이 **덧셈**(매번 +c)이면 총비용이 Θ(n²)이 되어 분할상환이 성립하지 않는다.
등비적 성장이 조건이라는 점이 핵심이다.

## 함정: 축소(shrink)를 반씩 하면 무너진다

"가득 차면 2배, 절반 이하면 절반"으로 만들면, 경계에서 삽입·삭제를 번갈아 할 때
매 연산이 복사를 유발해 O(n)이 반복된다. 표준 해법은 **1/4 이하일 때 절반으로 줄이는 것**이고,
이때 Φ를 num ≥ size/2 구간과 아닌 구간으로 나눠 정의하면 다시 O(1)이 증명된다.
포텐셜법의 실전 가치가 여기서 드러난다 — 정책을 바꿨을 때 그게 안전한지 아닌지를
"직관"이 아니라 계산으로 판별할 수 있다.

## 실무·Verex 연결

EVM은 정확히 반대 방향으로 설계돼 있다. 가스는 **연산마다 최악의 비용을 선불로** 받는다 —
분할상환을 인정하면 한 트랜잭션이 이웃 트랜잭션의 저금을 쓰는 셈이 되어 DoS 방어가 무너지기
때문이다. 그래서 Solidity에서 동적 배열에 push 하는 비용은 분할상환 O(1)이 아니라 매번
스토리지 쓰기 값 그대로다.

분할상환 사고가 실제로 쓰이는 자리는 오프체인 쪽이다. Verex의 ChainJob 워커가 쓰는
지수 백오프(5s → 25s → 125s)도 같은 형태의 논증을 받는다 — 재시도 간격이 등비로 늘어나기
때문에 실패가 이어져도 총 재시도 횟수가 로그로 묶인다. 인덱서의 배치 크기, 오더북 스냅샷
주기처럼 "가끔 비싼 일을 몰아서 하는" 설계는 전부 이 분석의 대상이고, 판단 기준은 하나다:
**비싼 일의 빈도가 그 비용에 반비례해 줄어드는가.**

## 연습

1. 위 파이썬 코드에서 성장률을 1.5배와 3배로 바꿔 ĉ의 상한이 어떻게 변하는지 측정하고,
   r/(r−1) + 1 과 비교해 볼 것.
2. "절반 이하면 절반으로 축소" 정책을 구현해 삽입·삭제를 번갈아 돌렸을 때 총비용이
   Θ(n²)로 튀는 것을 재현하고, 1/4 정책으로 바꿔 다시 선형이 되는지 확인할 것.
3. 스택의 multipop(한 번에 k개 pop) 연산에 Φ = 스택 크기를 잡고, push·pop·multipop 세
   연산 모두 분할상환 O(1)임을 손으로 증명해 볼 것.

## 관련 코드

[docs/code/algorithms/algorithms-1.py](../code/algorithms/algorithms-1.py) — 위 파이썬 코드를 그대로 실행 가능한 파일로 뺀 것.
