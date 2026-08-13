# CRE x Cloud — four hybrid patterns sharing one shape:
# private system of record -> verified bridge (attests without publishing) -> on-chain
# settlement conditioned on that attestation. Picks a pattern from a small decision table.

from dataclasses import dataclass


@dataclass
class Pattern:
    name: str
    private_record: str
    bridge_attests: str
    onchain_settles: str


PATTERNS = [
    Pattern("RWA servicing", "loan servicer's ledger", "payment/default status", "token holder distributions"),
    Pattern("Proof of reserves", "custodian's bank balance", "reserve >= liabilities", "mint/pause of wrapped asset"),
    Pattern("DvP", "securities registrar", "asset leg delivered", "cash leg release"),
    Pattern("Prediction-market settlement", "real-world event outcome", "outcome resolution", "payout to winning side"),
]


def select_pattern(workload_keyword: str) -> Pattern:
    """Match an incoming workload description to one of the four patterns."""
    keyword = workload_keyword.lower()
    for pattern in PATTERNS:
        if keyword in pattern.name.lower():
            return pattern
    raise ValueError(f"no CRE x Cloud pattern matches: {workload_keyword!r}")


def attestation_gate(bridge_confidence: float, threshold: float = 0.99) -> bool:
    """On-chain settlement is conditioned on the bridge's attestation clearing a bar,
    since the chain itself cannot inspect the private data behind it."""
    return bridge_confidence >= threshold


if __name__ == "__main__":
    print("CRE x Cloud — four hybrid patterns, one shared shape\n")
    for pattern in PATTERNS:
        print(f"- {pattern.name}")
        print(f"    private record : {pattern.private_record}")
        print(f"    bridge attests : {pattern.bridge_attests}")
        print(f"    chain settles  : {pattern.onchain_settles}")

    print("\nGating settlement on attestation confidence:")
    for workload, confidence in [("proof of reserves", 0.995), ("dvp", 0.80)]:
        pattern = select_pattern(workload)
        cleared = attestation_gate(confidence)
        verdict = "settle on-chain" if cleared else "hold — attestation too weak"
        print(f"  {pattern.name:<28} confidence={confidence:.3f} -> {verdict}")
