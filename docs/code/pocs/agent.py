# 자율 결제 에이전트 — 한 틱: 관측 → 판단 → 행동 → 기록.
# 실제 데모는 온체인 잔고/가격을 읽지만, 여기서는 그 결정 로직만 최소로 떼어낸다.

from dataclasses import dataclass


@dataclass
class Policy:
    max_spend_per_tick: float
    price_ceiling: float


def decide(balance: float, price: float, policy: Policy) -> float:
    """이번 틱에 쓸 금액을 정한다 — 정책 밖이면 0."""
    if price > policy.price_ceiling:
        return 0.0
    return min(balance, policy.max_spend_per_tick)


def tick(balance: float, price: float, policy: Policy) -> tuple[float, str]:
    spend = decide(balance, price, policy)
    if spend == 0:
        return balance, f"skip — price {price} > ceiling {policy.price_ceiling}"
    return balance - spend, f"spend {spend:.2f} @ price {price}"


policy = Policy(max_spend_per_tick=10.0, price_ceiling=100.0)
balance = 50.0
for price in (80.0, 120.0, 95.0):
    balance, log = tick(balance, price, policy)
    print(f"balance={balance:6.2f}  {log}")
