#!/usr/bin/env python3
"""Day 2/50 — Exponents & Logarithms.

Exponentiation is repeated multiplication; the logarithm is its inverse.
Three intuitions exercised below:
  1. compound interest      A = P(1+r)^n   (and continuous A = P e^{rt})
  2. log scale              multiples become equal spacing (price charts, mining difficulty)
  3. log(xy) = log x + log y products become sums (log-likelihood, LMSR cost)

Run:  uv run python day02_exp_log.py     (needs numpy)
"""

import numpy as np


def intuitions() -> None:
    # 1) compound interest: 8% over 5 years
    P, r, n = 1.0, 0.08, 5
    print("annual compound :", round(P * (1 + r) ** n, 4))   # 1.4693
    print("continuous      :", round(P * np.exp(r * n), 4))  # 1.4918

    # 2) log scale: ETH 4946 -> 1666, the "multiple" of the drawdown
    peak, now = 4946, 1666
    print("drawdown x      :", round(now / peak, 3),
          " log10:", round(np.log10(now / peak), 3))          # 0.337, -0.472

    # 3) products -> sums: a product of probabilities via log-sum-exp
    ps = np.array([0.6, 0.7, 0.55])
    print("prod            :", round(ps.prod(), 4),
          " exp(sum log)   :", round(np.exp(np.log(ps).sum()), 4))


def exercise() -> None:
    """How far is ETH from $1,666 back to its ATH of $4,946?

    - multiple : 4946 / 1666
    - percent  : (4946/1666) - 1
    - inverse with logs: if it took an annual rate r over 3 years, what is r?
    """
    now, ath = 1666.0, 4946.0
    multiple = ath / now
    percent = (multiple - 1) * 100

    # discrete annual rate r solving (1+r)^3 = multiple
    #   => r = multiple^(1/3) - 1
    r_discrete = multiple ** (1 / 3) - 1

    # continuous annual rate r solving e^{3r} = multiple
    #   => r = ln(multiple) / 3   (this is where log inverts the exponent)
    r_continuous = np.log(multiple) / 3

    print("\n--- exercise: $1,666 -> $4,946 ---")
    print(f"multiple        : {multiple:.4f}x")
    print(f"percent needed  : {percent:.2f}%")
    print(f"annual r (3y, discrete)   : {r_discrete * 100:.2f}%")
    print(f"annual r (3y, continuous) : {r_continuous * 100:.2f}%")


if __name__ == "__main__":
    intuitions()
    exercise()
