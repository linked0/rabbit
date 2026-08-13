"""PBS (searcher / relay) PoC — a simplified proposer-builder-separation auction.
Illustrates the core mechanism: searchers submit bundles with a bid, a relay picks the
highest bid to hand to the proposer, simulating each bundle first to reject reverts.
"""

import random
from dataclasses import dataclass


@dataclass
class Bundle:
    searcher: str
    bid_wei: int
    txs: list[str]
    reverts: bool = False


def simulate(bundle: Bundle) -> bool:
    """Mimics eth_callBundle: would this bundle revert if included?"""
    return not bundle.reverts


class Relay:
    def __init__(self):
        self.mempool: list[Bundle] = []

    def submit(self, bundle: Bundle) -> None:
        self.mempool.append(bundle)

    def run_auction(self) -> Bundle | None:
        valid = [b for b in self.mempool if simulate(b)]
        rejected = [b for b in self.mempool if not simulate(b)]
        for b in rejected:
            print(f"  reject {b.searcher}: bundle reverts, dropped before relay sees a bid")
        if not valid:
            return None
        winner = max(valid, key=lambda b: b.bid_wei)
        return winner


if __name__ == "__main__":
    random.seed(7)
    relay = Relay()
    relay.submit(Bundle("searcher-A", bid_wei=12_000_000_000_000, txs=["swap(WETH,USDC)"]))
    relay.submit(Bundle("searcher-B", bid_wei=18_500_000_000_000, txs=["arb(pool1,pool2)"]))
    relay.submit(Bundle("searcher-C", bid_wei=25_000_000_000_000, txs=["liquidate(user42)"], reverts=True))
    relay.submit(Bundle("searcher-D", bid_wei=16_000_000_000_000, txs=["sandwich(tx99)"]))

    print("bundles submitted to relay:")
    for b in relay.mempool:
        print(f"  {b.searcher}: bid={b.bid_wei / 1e18:.6f} ETH  txs={b.txs}")

    print("\nrunning auction (simulate, then pick highest bid among non-reverting bundles):")
    winner = relay.run_auction()
    print(f"\nwinning bundle: {winner.searcher} at {winner.bid_wei / 1e18:.6f} ETH -> forwarded to proposer")
