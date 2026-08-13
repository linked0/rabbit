"""Circuit Breaker + Saga: two microservice patterns in one toy demo.

Circuit Breaker: an inter-service call site that trips OPEN after N failures,
fails fast while open, then probes recovery via a HALF_OPEN trial after a
cooldown. Saga: a settlement pipeline of local steps, each with a compensating
rollback, undone in reverse order the moment one step fails.
"""
import time


class CircuitBreaker:
    def __init__(self, fail_threshold=3, cooldown=0.05):
        self.fail_threshold = fail_threshold
        self.cooldown = cooldown
        self.failures = 0
        self.state = "CLOSED"
        self.opened_at = None

    def call(self, fn):
        if self.state == "OPEN":
            if time.monotonic() - self.opened_at >= self.cooldown:
                self.state = "HALF_OPEN"
            else:
                raise RuntimeError("circuit open: failing fast")
        try:
            result = fn()
        except Exception:
            self.failures += 1
            if self.state == "HALF_OPEN" or self.failures >= self.fail_threshold:
                self.state, self.opened_at = "OPEN", time.monotonic()
            raise
        else:
            self.failures, self.state = 0, "CLOSED"
            return result


def flaky_rpc(calls=[0]):
    calls[0] += 1
    if calls[0] <= 3:
        raise ConnectionError("oracle RPC timeout")
    return "oracle_price=42"


breaker = CircuitBreaker(fail_threshold=2, cooldown=0.02)
for i in range(5):
    try:
        print(f"attempt {i}: {breaker.call(flaky_rpc)} (state={breaker.state})")
    except Exception as e:
        print(f"attempt {i}: failed ({e}) (state={breaker.state})")
    time.sleep(0.03)

# --- Saga: oracle lookup -> settlement -> payout, with compensations ---
ledger = []

def oracle_lookup():
    ledger.append("oracle_locked")
def undo_oracle_lookup():
    ledger.remove("oracle_locked")

def settle():
    ledger.append("settled")
def undo_settle():
    ledger.remove("settled")

def payout():
    raise RuntimeError("payout provider unavailable")

steps = [(oracle_lookup, undo_oracle_lookup), (settle, undo_settle), (payout, None)]
completed = []
try:
    for step, compensate in steps:
        step()
        completed.append(compensate)
    print("saga completed:", ledger)
except Exception as e:
    print(f"saga failed at step: {e} -- rolling back")
    for compensate in reversed(completed):
        if compensate:
            compensate()
    print("ledger after rollback:", ledger)
