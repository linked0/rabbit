"""OpenZeppelin Relayer PoC -- nonce-managed transaction queue.
Illustrates the core mechanism: the relayer assigns strictly increasing nonces, retries
failed sends with backoff, and never re-uses a nonce even across retries/failures.
"""

from dataclasses import dataclass, field


@dataclass
class TxRequest:
    id: str
    payload: str
    should_fail_times: int = 0  # simulate transient failures before success


@dataclass
class Relayer:
    next_nonce: int = 0
    sent: list[tuple[int, str]] = field(default_factory=list)  # (nonce, tx id)

    def submit(self, req: TxRequest) -> None:
        nonce = self.next_nonce
        self.next_nonce += 1  # nonce is consumed here, permanently -- never reused
        attempts = 0
        backoff = [5, 25, 125]
        while True:
            attempts += 1
            ok = attempts > req.should_fail_times
            print(f"  nonce={nonce} tx={req.id} attempt={attempts} -> {'CONFIRMED' if ok else 'fails, retry'}")
            if ok:
                self.sent.append((nonce, req.id))
                return
            if attempts > len(backoff):
                print(f"  nonce={nonce} tx={req.id} -> exhausted retries, giving up (nonce still not reused)")
                self.sent.append((nonce, f"{req.id} (FAILED)"))
                return
            print(f"    backing off {backoff[attempts - 1]}s before retry")


if __name__ == "__main__":
    relayer = Relayer()
    queue = [
        TxRequest("settle-match-1", "transfer(A,B,10)", should_fail_times=0),
        TxRequest("settle-match-2", "transfer(C,D,5)", should_fail_times=2),
        TxRequest("settle-match-3", "transfer(E,F,7)", should_fail_times=0),
    ]

    print("processing queue, one lane, strictly increasing nonces:")
    for req in queue:
        relayer.submit(req)

    print("\nfinal nonce -> tx mapping (no nonce ever reused):")
    for nonce, tx_id in relayer.sent:
        print(f"  nonce {nonce}: {tx_id}")
