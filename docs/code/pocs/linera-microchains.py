"""Linera microchains PoC -- one chain per user, plus a cross-chain message delivery.
Illustrates the core mechanism: independent per-user chains remove contention for a
shared block; interaction between users happens via explicit cross-chain messages.
"""

from dataclasses import dataclass, field


@dataclass
class Microchain:
    owner: str
    blocks: list[str] = field(default_factory=list)
    inbox: list[str] = field(default_factory=list)

    def extend(self, operation: str) -> None:
        """Only the owner extends their own chain -- no contention with anyone else."""
        self.blocks.append(operation)

    def receive(self, message: str) -> None:
        self.inbox.append(message)
        self.blocks.append(f"applied cross-chain message: {message}")


class Validator:
    """Runs every microchain, and relays messages between them."""

    def __init__(self):
        self.chains: dict[str, Microchain] = {}

    def create_chain(self, owner: str) -> Microchain:
        chain = Microchain(owner=owner)
        self.chains[owner] = chain
        return chain

    def send_cross_chain(self, sender: str, recipient: str, message: str) -> None:
        self.chains[sender].extend(f"send to {recipient}: {message}")
        self.chains[recipient].receive(f"from {sender}: {message}")


if __name__ == "__main__":
    validator = Validator()
    alice = validator.create_chain("alice")
    bob = validator.create_chain("bob")
    carol = validator.create_chain("carol")

    # Each user extends their own chain independently -- no shared block to contend for.
    alice.extend("deposit 10 USDC")
    bob.extend("deposit 5 USDC")
    carol.extend("deposit 20 USDC")

    # One cross-chain message: alice pays bob. This is the only point where chains touch.
    validator.send_cross_chain("alice", "bob", "pay 3 USDC")

    for name, chain in validator.chains.items():
        print(f"\nchain[{name}] blocks:")
        for b in chain.blocks:
            print(f"  - {b}")
