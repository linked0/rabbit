"""Institutional custody study PoC -- M-of-N threshold approval gate.
Illustrates the core mechanism behind MPC custody and approval workflows: a transaction
only executes once a quorum of independent signers has approved it.
"""

from dataclasses import dataclass, field


@dataclass
class Transaction:
    id: str
    description: str
    approvals: set[str] = field(default_factory=set)


class ApprovalQuorum:
    def __init__(self, signers: list[str], threshold: int):
        self.signers = set(signers)
        self.threshold = threshold  # "M" of "N"

    def approve(self, tx: Transaction, signer: str) -> str:
        if signer not in self.signers:
            return f"REJECTED: {signer} is not a registered quorum member"
        if signer in tx.approvals:
            return f"NOOP: {signer} already approved {tx.id}"
        tx.approvals.add(signer)
        return f"recorded approval from {signer} ({len(tx.approvals)}/{self.threshold})"

    def can_execute(self, tx: Transaction) -> bool:
        return len(tx.approvals) >= self.threshold

    def execute(self, tx: Transaction) -> str:
        if not self.can_execute(tx):
            return f"BLOCKED: {tx.id} has {len(tx.approvals)}/{self.threshold} approvals"
        return f"EXECUTED: {tx.id} ({tx.description}) -- quorum of {self.threshold} met"


if __name__ == "__main__":
    quorum = ApprovalQuorum(signers=["alice", "bob", "carol", "dave"], threshold=3)
    tx = Transaction(id="withdraw-001", description="withdraw 100 ETH to cold wallet")

    for signer in ["alice", "eve", "bob", "alice", "carol"]:
        print(" ", quorum.approve(tx, signer))
        print("  execute?", quorum.execute(tx))
