# Random Walks & the Diffusion Equation — From Newton to Diffusion Models

*Daily Math, Day 39/52 · 2026-08-13 · November section (probability, statistics & financial math)*

Isaac Newton lost his entire fortune in the South Sea Company and said: **"I can
calculate the motion of the heavens, but not the madness of men."** And yet there is a
branch of mathematics that turned exactly that "madness" into something calculable. From
the moment Louis Bachelier modeled stock prices as a random walk in 1900, this one
differential equation has kept resurfacing under the same face for well over a century —
option pricing → the modern derivatives market → today's image-generating AI (diffusion
models).

> **One-line summary** — The equation describing how a random walk's probability density
> spreads over time and the equation describing how heat spreads through an object are
> **the same partial differential equation.** That single fact ties the option pricing
> formula (Black-Scholes) and today's image-generating AI (diffusion models) to the same
> root.

## Bachelier — the first to treat stock prices as a random walk

In 1900, Louis Bachelier treated stock price movements as a stochastic process in a
doctoral thesis meant to explain option prices on the Paris exchange. The premise that
the next price change is random and independent of prior history — this is the
prototype of today's "random walk" or "efficient market hypothesis." It came five years
before Einstein explained Brownian motion (the random jitter of pollen particles in a
liquid) in 1905 using statistical mechanics, yet the two men arrived at
**mathematically identical** equations.

## Why "diffusion" and "random walk" are the same equation

Consider a random walk on a one-dimensional lattice, adding +1 or −1 with equal
probability at each time step. Take the recurrence that the probability `p(x,t)` of
finding the particle at position x at time t satisfies, Taylor-expand it, and take the
continuum limit, and you get the following.

```
p(x, t+Δt) = ½p(x−Δx, t) + ½p(x+Δx, t)
   → (as Δx, Δt → 0, holding Δx²/Δt = 2D)
∂p/∂t = D · ∂²p/∂x²          (the heat/diffusion equation — the one Joseph Fourier used to explain heat conduction in 1822)
```

The second spatial derivative on the right means "a spot that bulges convexly above its
neighbors gets shaved down, and a spot that dips concavely gets filled in." Whether it's
heat, a scent, or probability mass, the process of pushing local spikes toward the
average all reduces to this one equation — which is why Brownian motion's probability
density, the thermal diffusion of gas molecules, and (as we'll see) deep learning's
diffusion models all end up in the same line.

## Ed Thorp — from blackjack card counting to delta hedging

Ed Thorp flipped the casino's edge in Las Vegas blackjack with card counting, then
carried the same probabilistic thinking into the options market. Hold an option while
continuously rebalancing the underlying asset in the opposite direction by the option's
sensitivity (delta, ∂V/∂S), and the portfolio's value stops moving locally regardless of
whether the underlying goes up or down — **delta hedging**. This is where the strategy of
trading not a directional bet but "how much does the price randomly wobble" (volatility)
was first systematized.

## Black-Scholes-Merton — the diffusion equation becomes an option pricing formula

In 1973, Fischer Black, Myron Scholes, and Robert Merton assumed the underlying follows
geometric Brownian motion (GBM), demanded a risk-free return from a delta-hedgeable
portfolio, and derived the partial differential equation the option price V(S,t) must
satisfy.

```
∂V/∂t + ½σ²S² ∂²V/∂S² + rS ∂V/∂S − rV = 0
```

Change variables to log-price `x = ln S` and reversed time (τ = T−t), and this equation
resolves into **the same shape** as the heat/diffusion equation above — only the
diffusion coefficient changes, to the asset's annual variance σ²/2. The intuition that
"option price = the expected value over every possible future scenario, discounted back
to today" turns out to fit exactly the boundary-value problem of the very equation
Bachelier, Einstein, and Fourier each discovered from a different problem. This one
formula became the pricing language for today's hundreds-of-trillions-of-dollars
derivatives market.

## Jim Simons — attacking the market with pattern recognition

The mathematician Jim Simons founded Renaissance Technologies and hired
physicists, statisticians, and codebreakers, approaching market data not as parameters
of a diffusion model but as a **pattern-recognition / machine-learning** problem (hidden
Markov models, among others). The Medallion Fund posted an unprecedented roughly 66%
average annual return — a case where, instead of refining any single diffusion model
further, a century-long trend got bent once more by filtering out the residual pattern
that model couldn't explain from the data itself.

## To today's AI — diffusion models run the same equation in reverse

**Diffusion models**, the core of today's image and video generation AI, use exactly
this diffusion equation. The forward process adds Gaussian noise to an original image a
little at a time, like a random walk, until it becomes pure noise — Brownian motion
itself. A trained neural network approximates the **reverse** of this process (at each
point in time, "which direction to push to reduce the noise" — the gradient/score of the
probability density), and repeatedly integrating that reverse diffusion equation turns
pure noise into an image. The very same partial differential equation Bachelier applied
to stock prices and Black-Scholes applied to options is, some 120-odd years later,
applied to pixels — that's today's generative AI.

## Where the same math shows up in blockchain and Verex

- **Price oracle modeling** — approximate the asset price an on-chain oracle feeds as
  GBM, and liquidation thresholds and margin requirements can be computed in the
  language of the diffusion equation, as "how often, and how far, can this deviate."
- **On-chain options and derivatives** — if Verex ever grows beyond prediction markets
  into option-shaped products, the starting point for pricing logic is still this
  Black-Scholes PDE (or its discrete-time cousin, the binomial model).
- **The contrast with LMSR** — Verex's LMSR directly designs "how the price should
  change" as a cost function, whereas Black-Scholes works backward from "assuming price
  moves randomly, what's the fair option price." Laying these two approaches to the same
  stochastic pricing problem side by side, approached from opposite directions, makes
  LMSR's design choices sharper.

## Pitfalls

1. **The GBM assumption is an approximation, not reality** — real asset returns have
   fatter tails than the normal distribution. This is why delta hedging fails in extreme
   events like 2008.
2. **"The same equation" doesn't mean "the same answer."** Different boundary and initial
   conditions (the two ends of a heat-conducting rod, versus an option's expiry
   settlement condition) produce completely different solutions to the same PDE.
3. **The diffusion model's "reverse" is an approximation, not an exact inverse.** Errors
   in the neural network's approximated score function accumulate and distort the
   generated result — especially outside the distribution of the training data.

## Exercises

1. Code the discrete random-walk recurrence above and confirm directly that the
   histogram converges toward a normal distribution (a Gaussian) as the step count
   grows — the central limit theorem made visible.
2. Push the substitution `x = ln S, τ = T − t` all the way through the Black-Scholes PDE
   by hand and confirm you really do get the heat-equation form.
3. Set the DDPM (Denoising Diffusion Probabilistic Models) paper's forward-process
   formula side by side with this note's discrete random-walk recurrence and write down
   where they match and where they differ.

## Related code

[docs/code/math/math-39.py](../code/math/math-39.py) — samples confirming that a
discrete random walk converges to a normal distribution as step count grows.

---

# 한국어

# 랜덤워크·열확산 방정식 — 뉴턴에서 디퓨전 모델까지

*매일의 수학 Day 39/52 · 2026-08-13 · 11월 구간(확률·통계·금융수학)*

아이작 뉴턴은 남해회사(South Sea Company) 주식으로 전 재산을 날리고 이렇게 말했다 —
**"천체의 운동은 계산할 수 있지만, 사람들의 광기는 계산할 수 없다."** 그런데 정확히
그 "광기"를 계산 가능한 대상으로 바꾼 수학이 있다. 1900년 루이 바슐리에가 주가를
무작위 보행(random walk)으로 모델링한 그 순간부터, 이 한 편의 미분방정식은 옵션
가격결정 → 현대 파생상품 시장 → 오늘날의 이미지 생성 AI(디퓨전 모델)까지 백 년 넘게
같은 얼굴로 반복해서 나타난다.

> **한 줄 정리** — 무작위 보행의 확률밀도가 시간에 따라 퍼지는 방정식과 열이 물체 안에서
> 퍼지는 방정식은 **같은 편미분방정식**이다. 이 사실 하나가 옵션 가격결정 공식(블랙-숄즈)과
> 오늘날 이미지 생성 AI(디퓨전 모델)를 같은 뿌리로 묶는다.

## 바슐리에 — 주가를 무작위 보행으로 처음 취급하다

1900년, 루이 바슐리에는 파리 증권거래소 옵션 가격을 설명하기 위한 박사논문에서 주가의
변동을 확률과정으로 취급했다. 다음 순간의 가격 변화가 이전 이력과 무관하게 무작위라는
전제 — 오늘날 "랜덤워크" 또는 "효율적 시장 가설"의 원형이다. 아인슈타인이 1905년
브라운 운동(액체 속 꽃가루 입자의 무작위 떨림)을 통계역학으로 설명한 것보다 5년 앞선
작업이었지만, 두 사람이 도달한 방정식은 **수학적으로 동일**하다.

## 왜 "확산"과 "무작위 보행"이 같은 방정식인가

한 칸 격자 위에서 매 시간 스텝마다 +1 또는 −1을 동일 확률로 더하는 무작위 보행을
생각하자. 위치 x에서 시각 t에 입자를 발견할 확률 `p(x,t)`가 만족하는 점화식을 테일러
전개로 연속극한을 취하면 다음이 나온다.

```
p(x, t+Δt) = ½p(x−Δx, t) + ½p(x+Δx, t)
   → (Δx, Δt → 0, Δx²/Δt = 2D 로 유지)
∂p/∂t = D · ∂²p/∂x²          (열/확산 방정식, 조제프 푸리에가 1822년 열전도를 설명한 그 식)
```

우변의 2계 공간미분은 "주변보다 볼록하게 튀어나온 자리는 깎이고, 오목하게 파인 자리는
채워진다"는 뜻이다 — 열이든 냄새든 확률질량이든, 국소적으로 튀는 것을 평균으로 밀어
넣는 과정은 전부 이 방정식 하나로 요약된다. 브라운 운동의 확률밀도, 기체 분자의 열
확산, 그리고 (뒤에서 볼) 딥러닝의 디퓨전 모델이 전부 같은 줄에 서는 이유다.

## 에드 소프 — 블랙잭 카드 카운팅에서 델타 헤징으로

에드 소프는 라스베이거스 블랙잭에서 카드 카운팅으로 카지노의 우위를 뒤집은 뒤, 같은
확률적 사고를 옵션 시장으로 옮겼다. 옵션 하나를 보유하면서 기초자산을 옵션 가격의
민감도(델타, ∂V/∂S)만큼 반대 포지션으로 계속 재조정하면, 기초자산 가격이 오르든
내리든 포트폴리오 가치는 국소적으로 변하지 않는다 — **델타 헤징**. 방향성 베팅이
아니라 "가격이 얼마나 무작위로 흔들리는가(변동성)"만 사고파는 전략이 여기서 처음
체계화됐다.

## 블랙-숄즈-머튼 — 확산 방정식이 옵션 가격 공식이 되다

1973년 피셔 블랙, 마이런 숄즈, 로버트 머튼은 기초자산이 기하 브라운 운동(GBM)을
따른다는 가정 아래, 델타 헤징이 가능한 포트폴리오의 무위험 수익률을 요구해 옵션
가격 V(S,t)가 만족해야 할 편미분방정식을 유도했다.

```
∂V/∂t + ½σ²S² ∂²V/∂S² + rS ∂V/∂S − rV = 0
```

로그가격 `x = ln S`와 시간 반전(τ = T−t)으로 변수를 바꾸면, 이 식은 위에서 본 열/확산
방정식과 **같은 모양**으로 정리된다 — 확산계수가 자산의 연 변동성 σ²/2으로 바뀔 뿐이다.
"옵션 가격 = 미래의 모든 가능한 시나리오에 대한 기댓값을 오늘로 할인한 것"이라는
직관이, 바슐리에·아인슈타인·푸리에가 각자 다른 문제에서 발견한 같은 방정식의 경계값
문제로 정확히 들어맞는다. 이 공식 하나가 현대 수백조 달러 규모 파생상품 시장의
가격결정 언어가 됐다.

## 짐 사이먼스 — 패턴 인식으로 시장을 공략하다

수학자 짐 사이먼스는 르네상스 테크놀로지를 세우고 물리학자·통계학자·암호해독가를
채용해, 시장 데이터를 확률과정의 파라미터가 아니라 **패턴 인식·기계학습(은닉 마르코프
모델 등)** 문제로 접근했다. 메달리온 펀드는 연평균 약 66%라는 전무후무한 수익률을
기록했다 — 개별 확산 모델을 정교하게 다듬는 대신, 그 모델이 설명하지 못하는 잔여
패턴을 데이터로 걸러내는 쪽으로 한 세기의 흐름을 한 번 더 꺾은 사례다.

## 오늘의 AI로 — 디퓨전 모델은 같은 방정식의 역방향이다

이미지·영상 생성 AI의 핵심인 **디퓨전 모델**은 정확히 이 확산 방정식을 사용한다.
전방 과정(forward process)은 원본 이미지에 가우시안 잡음을 무작위 보행처럼 조금씩
더해 완전한 노이즈로 만든다 — 브라운 운동 그 자체다. 학습된 신경망은 이 과정의
**역방향**(각 시점에서 "어느 방향으로 밀어야 노이즈가 줄어드는가", 즉 확률밀도의
그래디언트/스코어)을 근사하고, 그 역방향 확산 방정식을 반복 적분해 순수 노이즈에서
이미지를 만들어낸다. 바슐리에가 주가에, 블랙-숄즈가 옵션에 썼던 바로 그 편미분방정식이,
120여 년 뒤 픽셀에 적용된 것이 오늘의 생성 AI다.

## 블록체인·Verex에서 같은 수학이 나오는 자리

- **가격 오라클 모델링** — 온체인 오라클이 공급하는 자산 가격을 GBM으로 근사하면,
  청산 임계값·마진 요구량을 "얼마나 자주 얼마나 크게 벗어날 수 있는가"라는 확산
  방정식의 언어로 계산할 수 있다.
- **온체인 옵션·파생상품** — Verex가 예측시장을 넘어 옵션형 상품을 다루게 된다면,
  가격결정 로직의 출발점은 그대로 이 블랙-숄즈 PDE(또는 이산 시간 버전인 이항모형)다.
- **LMSR과의 대비** — Verex의 LMSR은 "가격이 어떻게 변해야 하는가"를 비용함수로
  직접 설계하는 반면, 블랙-숄즈는 "가격이 무작위로 어떻게 움직인다고 가정하면 공정한
  옵션 가격은 얼마인가"를 역산한다 — 같은 확률적 가격 문제를 반대 방향에서 푸는 두
  접근을 나란히 두고 보면 LMSR의 설계 선택이 더 선명해진다.

## 함정

1. **GBM 가정은 현실이 아니라 근사다** — 실제 자산 수익률은 정규분포보다 꼬리가
   두껍다(팻 테일). 2008년 같은 극단적 사건에서 델타 헤징이 실패하는 이유가 여기 있다.
2. **"같은 방정식"이 "같은 답"을 뜻하지 않는다** — 경계조건·초기조건이 다르면 (열이
   퍼지는 막대의 양 끝 vs. 옵션의 만기 정산 조건) 같은 PDE라도 완전히 다른 해가 나온다.
3. **디퓨전 모델의 "역방향"은 정확한 역이 아니라 근사다** — 신경망이 근사하는 스코어
   함수의 오차가 누적되면 생성 결과가 왜곡된다. 학습 데이터 밖의 분포에서 특히 그렇다.

## 연습

1. 위의 이산 무작위 보행 점화식을 코드로 짜서, 스텝 수가 커질수록 히스토그램이
   정규분포(가우시안)로 수렴하는 것을 직접 확인할 것 — 중심극한정리가 그림으로 보인다.
2. 블랙-숄즈 PDE에서 `x = ln S, τ = T − t` 치환을 손으로 끝까지 밀어붙여, 정말 열
   방정식 형태가 나오는지 확인할 것.
3. DDPM(Denoising Diffusion Probabilistic Models) 논문의 forward process 수식과,
   이 노트의 이산 무작위 보행 점화식을 나란히 놓고 어디가 같고 어디가 다른지 적어볼 것.

## 관련 코드

[docs/code/math/math-39.py](../code/math/math-39.py) — 이산 무작위 보행이 스텝 수에 따라 정규분포로 수렴하는 것을 표본으로 확인.
