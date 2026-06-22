#!/usr/bin/env python3
"""Day 3/50 — Limits & Continuity.

A limit is "where a function heads as x gets arbitrarily close to some value."
It is the foundation for derivatives (Day 4), expectations, and probabilistic
convergence.

Three things exercised below:
  1. continuous compounding   (1 + r/n)^n  ->  e^r   as n -> infinity
  2. continuity               f is continuous at a  when  lim_{x->a} f(x) = f(a)
  3. probabilistic limit      f^k -> 0  as k -> infinity   (DAS sampling soundness)

Run:  uv run python day03_limits_continuity.py     (needs numpy)
"""

import numpy as np


def limits() -> None:
    # 1) continuous compounding converges to e^r
    #    annual rate r compounded n times -> (1 + r/n)^n -> e^r
    r = 0.05  # 5%/yr
    print("--- limit: (1 + r/n)^n -> e^r ---")
    for n in [1, 4, 12, 365, 100_000]:
        print(f"n={n:>7} : {(1 + r / n) ** n:.6f}")
    print(f"limit e^r : {np.exp(r):.6f}")          # 1.051271...


def continuity() -> None:
    # 2) continuity means the limit equals the function value: lim_{x->a} f = f(a)
    #    polynomials / exp / log are continuous on their domain, so approaching a
    #    from either side lands exactly on f(a) — the graph never breaks.
    def f(x):
        return x**2 - 3 * x + 2

    a = 2.0
    left = f(a - 1e-9)
    right = f(a + 1e-9)
    print("\n--- continuity at a = 2:  lim f(x) == f(a)? ---")
    print(f"f(a-)     : {left:.9f}")
    print(f"f(a+)     : {right:.9f}")
    print(f"f(a)      : {f(a):.9f}")
    print(f"continuous: {np.isclose(left, f(a)) and np.isclose(right, f(a))}")


def probabilistic_limit() -> None:
    # 3) f^k -> 0 as k -> infinity. In Data Availability Sampling (DAS), if a
    #    fraction f of data is withheld, the chance that k independent samples
    #    ALL miss it is f^k — and it collapses toward 0 fast. That vanishing
    #    limit is exactly what makes sampling "sound".
    f = 0.5
    print("\n--- probabilistic limit: f^k -> 0  (f = 0.5) ---")
    for k in [1, 5, 10, 20, 40]:
        print(f"k={k:>3} : {f**k:.3e}")


def exercise() -> None:
    """Day 3 exercise.

    (a) Change r to 0.40 (+40% — the gain needed to recover a 28.6% loss) and
        confirm (1 + r/n)^n converges to e^0.4 ~= 1.4918.
    (b) For f = 0.5, k = 1..40, show how fast f^k approaches 0.
    """
    print("\n--- exercise (a): r = 0.40 -> e^0.4 ---")
    r = 0.40
    for n in [1, 12, 365, 1_000_000]:
        print(f"n={n:>9} : {(1 + r / n) ** n:.6f}")
    print(f"limit e^0.4 : {np.exp(r):.6f}")        # 1.491825...

    print("\n--- exercise (b): f^k for f = 0.5, k = 1..40 ---")
    f, ks = 0.5, np.arange(1, 41)
    vals = f**ks
    for k in (1, 10, 20, 30, 40):
        print(f"k={k:>3} : {f**k:.3e}")
    # first k where the miss-probability drops below one in a million
    k_safe = int(ks[np.argmax(vals < 1e-6)])
    print(f"first k with f^k < 1e-6 : k = {k_safe}")


if __name__ == "__main__":
    limits()
    continuity()
    probabilistic_limit()
    exercise()
