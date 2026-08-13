"""Hyperliquid Trading PoC — a tiny limit-order-book matching engine.
Illustrates the core mechanism: bids/asks sorted by price-time priority, matched on crossing.
"""

from dataclasses import dataclass, field
from itertools import count

_order_id = count(1)


@dataclass
class Order:
    side: str  # "buy" or "sell"
    price: float
    size: float
    id: int = field(default_factory=lambda: next(_order_id))


class OrderBook:
    def __init__(self):
        self.bids: list[Order] = []  # highest price first
        self.asks: list[Order] = []  # lowest price first

    def submit(self, side: str, price: float, size: float) -> list[str]:
        order = Order(side, price, size)
        fills = []
        book = self.asks if side == "buy" else self.bids
        book.sort(key=lambda o: o.price if side == "sell" else -o.price)

        while order.size > 0 and book:
            best = book[0]
            crosses = price >= best.price if side == "buy" else price <= best.price
            if not crosses:
                break
            traded = min(order.size, best.size)
            fills.append(f"  fill: {traded} @ {best.price} (order #{best.id} vs #{order.id})")
            order.size -= traded
            best.size -= traded
            if best.size <= 0:
                book.pop(0)

        if order.size > 0:
            (self.bids if side == "buy" else self.asks).append(order)
        return fills


if __name__ == "__main__":
    ob = OrderBook()
    print("resting ask: sell 2.0 @ 100")
    ob.submit("sell", 100, 2.0)
    print("resting ask: sell 1.0 @ 101")
    ob.submit("sell", 101, 1.0)

    print("\nincoming: buy 2.5 @ 101 (crosses the book)")
    for line in ob.submit("buy", 101, 2.5):
        print(line)

    print(f"\nremaining asks: {[(o.price, o.size) for o in ob.asks]}")
    print(f"remaining bids: {[(o.price, o.size) for o in ob.bids]}")
