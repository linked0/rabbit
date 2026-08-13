# ERC-8141 — a transaction carries a sequence of frames instead of one implicit call:
# a VERIFY frame (signature/fee authorization) followed by one or more EXECUTE frames.
# Simulates the frame structure and runs it in sequence, aborting if VERIFY fails.

from dataclasses import dataclass, field
from typing import Callable


@dataclass
class Frame:
    kind: str  # "VERIFY" or "EXECUTE"
    description: str
    run: Callable[[dict], bool]


@dataclass
class FrameTransaction:
    frames: list[Frame] = field(default_factory=list)

    def execute(self, context: dict) -> bool:
        for frame in self.frames:
            print(f"  [{frame.kind}] {frame.description} ...", end=" ")
            ok = frame.run(context)
            print("OK" if ok else "FAILED")
            if frame.kind == "VERIFY" and not ok:
                print("  -> VERIFY frame failed: transaction aborted before any EXECUTE frame runs.")
                return False
            if frame.kind == "EXECUTE" and not ok:
                print("  -> EXECUTE frame failed: transaction reverts.")
                return False
        return True


def verify_signature_and_fee(ctx: dict) -> bool:
    return ctx.get("signature_valid", False) and ctx.get("balance", 0) >= ctx.get("max_fee", 0)


def execute_transfer(ctx: dict) -> bool:
    ctx["balance"] -= ctx["transfer_amount"]
    return ctx["balance"] >= 0


def execute_approve(ctx: dict) -> bool:
    ctx["allowance"] = ctx.get("allowance", 0) + ctx["approve_amount"]
    return True


def build_transaction() -> FrameTransaction:
    return FrameTransaction(frames=[
        Frame("VERIFY", "signature + fee authorization", verify_signature_and_fee),
        Frame("EXECUTE", "transfer 50 tokens", execute_transfer),
        Frame("EXECUTE", "approve spender for 20 tokens", execute_approve),
    ])


if __name__ == "__main__":
    print("EIP-8141 Frame Transaction — VERIFY then EXECUTE, EXECUTE, ...\n")

    print("Case 1: valid signature, sufficient balance")
    ctx = {"signature_valid": True, "balance": 100, "max_fee": 5, "transfer_amount": 50, "approve_amount": 20}
    ok = build_transaction().execute(ctx)
    print(f"Transaction succeeded: {ok}, final state: {ctx}\n")

    print("Case 2: invalid signature — VERIFY frame blocks all EXECUTE frames")
    ctx = {"signature_valid": False, "balance": 100, "max_fee": 5, "transfer_amount": 50, "approve_amount": 20}
    ok = build_transaction().execute(ctx)
    print(f"Transaction succeeded: {ok}")
