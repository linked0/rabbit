"""LMSR (Logarithmic Market Scoring Rule): cost function C(q) = b*ln(sum(exp(q_i/b))),
prices p_i = exp(q_i/b) / sum(exp(q_j/b)). Buying shares of one outcome shifts
its price up and the cost paid is C(q_after) - C(q_before).
"""
import math

def cost(q, b):
    return b * math.log(sum(math.exp(qi / b) for qi in q))

def prices(q, b):
    exps = [math.exp(qi / b) for qi in q]
    total = sum(exps)
    return [e / total for e in exps]

def buy(q, outcome_idx, shares, b):
    q_after = list(q)
    q_after[outcome_idx] += shares
    trade_cost = cost(q_after, b) - cost(q, b)
    return q_after, trade_cost


b = 100  # liquidity parameter: higher b = deeper market, higher worst-case subsidy
n_outcomes = 2
q = [0.0, 0.0]  # outstanding shares per outcome, starts at zero net position

print(f"initial prices: {[round(p, 4) for p in prices(q, b)]} (should be uniform)")
print(f"worst-case subsidy bound b*ln(n) = {b * math.log(n_outcomes):.2f}\n")

q, paid = buy(q, outcome_idx=0, shares=50, b=b)
print(f"bought 50 shares of outcome 0, paid {paid:.2f}")
print(f"prices after trade: {[round(p, 4) for p in prices(q, b)]}")

q, paid = buy(q, outcome_idx=0, shares=50, b=b)
print(f"\nbought another 50 shares of outcome 0, paid {paid:.2f} (costs more -- price moved)")
print(f"prices after trade: {[round(p, 4) for p in prices(q, b)]}")
