"""AA -- delegatable accounts & session keys PoC.
Illustrates the core mechanism: a session key granted a scoped, capped allowance that
decrements per spend and is rejected once exhausted -- no re-sign popup needed.
"""

from dataclasses import dataclass


@dataclass
class SessionKey:
    owner: str
    cap: float          # e.g. "<=5 test USDC"
    remaining: float
    revoked: bool = False

    def spend(self, amount: float, memo: str) -> str:
        if self.revoked:
            return f"DENIED ({memo}): session key revoked"
        if amount > self.remaining:
            return f"DENIED ({memo}): {amount} exceeds remaining cap {self.remaining}"
        self.remaining -= amount
        return f"OK ({memo}): spent {amount}, {self.remaining} remaining of {self.cap}"


def grant_session_key(owner: str, cap: float) -> SessionKey:
    """Owner wallet signs one ERC-7715 permission request; no further popups after this."""
    print(f"{owner} signs a permission request granting a session key <= {cap} USDC")
    return SessionKey(owner=owner, cap=cap, remaining=cap)


if __name__ == "__main__":
    session = grant_session_key("0xOwnerEOA...", cap=5.0)

    print("\nsession key spends within its cap, no wallet popup each time:")
    for amount, memo in [(1.5, "buy dataset A"), (2.0, "buy dataset B"), (2.0, "buy dataset C")]:
        print(" ", session.spend(amount, memo))

    print("\nrevoke or exhaustion still blocks further spends:")
    print(" ", session.spend(0.5, "buy dataset D (exhausted)"))

    session2 = grant_session_key("0xOwnerEOA...", cap=3.0)
    session2.revoked = True
    print(" ", session2.spend(0.1, "buy dataset E (revoked)"))
