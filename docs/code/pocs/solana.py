# Solana's account model — unlike EVM contract storage, all state lives in accounts
# that are passed into every instruction explicitly. Simulates a PDA-based counter
# program: the "program" has no storage of its own, only the accounts it's handed.

import hashlib
from dataclasses import dataclass, field


@dataclass
class Account:
    pubkey: str
    owner_program: str
    data: dict = field(default_factory=dict)


def find_program_address(seeds: list, program_id: str) -> str:
    """Mimic Solana's deterministic PDA derivation (real PDAs also walk bump seeds
    off the ed25519 curve; this stdlib version just needs to be deterministic)."""
    joined = b"".join(seed.encode() for seed in seeds) + program_id.encode()
    return "PDA_" + hashlib.sha256(joined).hexdigest()[:16]


COUNTER_PROGRAM_ID = "Counter1111111111111111111111111111111111"


def initialize_counter(owner_pubkey: str) -> Account:
    """Every account a Solana program touches must be passed in explicitly — there
    is no implicit contract storage the way EVM `SSTORE` provides."""
    pda = find_program_address(["counter", owner_pubkey], COUNTER_PROGRAM_ID)
    return Account(pubkey=pda, owner_program=COUNTER_PROGRAM_ID, data={"count": 0})


def increment(counter_account: Account, signer_pubkey: str) -> None:
    """The 'instruction': operates only on the account object it's handed, never on
    hidden global state — this is the account model the card's howItWorks names."""
    if counter_account.owner_program != COUNTER_PROGRAM_ID:
        raise PermissionError("account not owned by this program")
    counter_account.data["count"] += 1
    print(f"  signer={signer_pubkey[:8]}... incremented {counter_account.pubkey[:12]}... "
          f"-> count={counter_account.data['count']}")


if __name__ == "__main__":
    print("Solana account model — PDA-based counter (state passed in, not stored implicitly)\n")

    owner = "User11111111111111111111111111111111111111"
    counter = initialize_counter(owner)
    print(f"Derived PDA for owner: {counter.pubkey}")
    print(f"Owned by program:      {counter.owner_program}\n")

    print("Calling increment three times, passing the account explicitly each time:")
    for _ in range(3):
        increment(counter, owner)

    print(f"\nFinal on-chain state (lives in the account, not the program): {counter.data}")
