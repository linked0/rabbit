# Math for AI & Markets — 50-Day Track

Small, self-contained math notes building the intuition behind LLMs and prediction
markets. Each day is one script + one short note.

| Day | Topic | File |
|-----|-------|------|
| 2 | Exponents & logarithms | [`day02_exp_log.py`](day02_exp_log.py) |
| 3 | Limits & continuity | [`day03_limits_continuity.py`](day03_limits_continuity.py) |

---

## Setup & Run

Every script needs **numpy**. Run from `/Users/jay/work/task/math` — pick one way:

**A. uv (recommended — zero manual setup).** The `pyproject.toml` here declares `numpy`,
so uv builds the environment on first run automatically:

```bash
cd /Users/jay/work/task/math
uv run python day03_limits_continuity.py
```

**B. venv + pip (classic virtual environment):**

```bash
cd /Users/jay/work/task/math
python3 -m venv .venv
source .venv/bin/activate
pip install numpy
python day03_limits_continuity.py
```

> ⚠️ A bare `python day03_limits_continuity.py` on system Python fails with
> `ModuleNotFoundError: No module named 'numpy'`, and a global `pip install numpy` is
> blocked by PEP 668 on Homebrew. Use **A** or **B** above — both isolate dependencies.

---

## Day 2/50 — Exponents & Logarithms

**Exponentiation is repeated multiplication; the logarithm is its inverse.**

Three intuitions:

1. **Compound interest** — discrete `A = P(1+r)^n`, continuous `A = P·e^{rt}`.
   The exponent is "how many times the base multiplies in."
2. **Log scale** — turns *multiples* into *equal spacing*. On a log price chart,
   $100→$200 and $200→$400 look the same distance; both are "×2". Mining difficulty
   and Richter/decibel scales work the same way.
3. **Product → sum** — `log(xy) = log x + log y`. A long product (e.g. a chain of
   probabilities) underflows to 0 in floating point; summing logs instead stays
   stable. This is the *log-sum-exp* trick.

### Exercise — ETH $1,666 → ATH $4,946

| Question | Answer |
|----------|--------|
| Multiple needed (`4946/1666`) | **2.9688×** |
| Percent gain (`(4946/1666)-1`) | **196.88%** |
| Annual rate over 3 years (discrete, `(1+r)^3 = 2.9688`) | **r ≈ 43.72%/yr** |
| Annual rate over 3 years (continuous, `e^{3r} = 2.9688`) | **r ≈ 36.27%/yr** |

The key step is the inverse: `(1+r)^3 = M` solved with a cube root, or `e^{3r} = M`
solved with `ln` — the logarithm "undoes" the exponent. The continuous rate is lower
because continuous compounding works harder for the same end value.

```bash
cd /Users/jay/work/task/math
uv run python day02_exp_log.py      # or: pip install numpy && python day02_exp_log.py
```

### Connection — Verex / AI

The **log-sum** trick reappears directly in:
- **LLM log-likelihood** — token probabilities are multiplied; we sum their logs
  instead (numerically stable, and the basis of cross-entropy loss).
- **LMSR cost function** `C = b·ln Σ e^{q_i/b}` — the prediction-market pricing rule
  used in market makers. The `ln`/`exp` pair here is the same machinery.

This is the bridge to **softmax / entropy** (Days 25–26), which are `exp`/`log` over a
score vector.

---

## Day 3/50 — Limits & Continuity

**A limit is "where a function heads as `x` gets arbitrarily close to some value."**
It's the foundation for derivatives (Day 4), expectations, and probabilistic convergence.

Three intuitions:

1. **Continuous compounding** — annual rate `r` compounded `n` times is `(1 + r/n)^n`,
   which converges to `e^r` as `n → ∞`. This is the canonical case of a limit showing
   up in real finance and probability — and the bridge back to Day 2's `e`.
2. **Continuity** — `f` is continuous at `a` when `lim_{x→a} f(x) = f(a)`: the limit
   *equals* the function value, so the graph never breaks. Polynomials, `exp`, and `log`
   are continuous on their domain — and continuity is the prerequisite for
   differentiability (Day 4).
3. **Probabilistic limit** — `f^k → 0` as `k → ∞`. In Data Availability Sampling (DAS),
   if a fraction `f` of data is withheld, the chance that `k` independent samples *all*
   miss it is `f^k`, which collapses toward 0. That vanishing limit is what makes
   sampling "sound".

### Exercise

| Question | Answer |
|----------|--------|
| `(1 + r/n)^n` with `r = 0.40`, `n → ∞` | **`e^0.4 ≈ 1.4918`** |
| `f^k` with `f = 0.5` — first `k` below 1-in-a-million | **`k = 20`** (`f^20 ≈ 9.5e-7`) |

`(a)` confirms the compounding limit at a bigger rate; `(b)` shows how *fast* a miss
probability vanishes — 20 samples already drive a 50%-withholding attack below 1e-6.

```bash
cd /Users/jay/work/task/math
uv run python day03_limits_continuity.py    # or: pip install numpy && python day03_limits_continuity.py
```

### Connection — Verex / AI

Limits are the common language of three later topics:
- **Derivatives → gradient descent** (Day 4) — a derivative *is* a limit of slopes.
- **Expectations → LMSR price** — the market price is a limit/derivative of the cost
  function `C = b·ln Σ e^{q_i/b}`, which is only well-defined because it's **continuous**
  and smooth.
- **Probabilistic convergence → DAS soundness** — `f^k → 0` is the safety argument for
  sampling-based data availability.
