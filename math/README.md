# Math for AI & Markets — 50-Day Track

Small, self-contained math notes building the intuition behind LLMs and prediction
markets. Each day is one script + one short note.

| Day | Topic | File |
|-----|-------|------|
| 2 | Exponents & logarithms | [`day02_exp_log.py`](day02_exp_log.py) |

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
