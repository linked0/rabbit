# DVT in the protocol — the proposal never splits one validator key (unlike today's
# Obol/SSV, which Shamir-splits a key and reassembles a signature via off-chain
# consensus). Instead each of n participants keeps their own key; the protocol groups
# them m-of-n and a participation bitfield (mocked BLS aggregation) decides if enough
# signed — the same grammar as today's attestation aggregation.

import hashlib
from dataclasses import dataclass


@dataclass
class Participant:
    operator_id: str
    private_key: str  # each operator's own key — never shared or split

    def sign(self, message: str) -> str:
        # Mock signature: a real BLS sig would be a curve point; a hash stands in.
        return hashlib.sha256((self.private_key + message).encode()).hexdigest()[:16]


def bls_aggregate(signatures: list[str]) -> str:
    """Mock aggregation: real BLS sums curve points into one constant-size signature."""
    combined = "".join(sorted(signatures))
    return hashlib.sha256(combined.encode()).hexdigest()[:16]


def protocol_check(n: int, m_threshold: int, signed_by: list[Participant], message: str) -> dict:
    """The protocol groups n registered operators m-of-n and checks the bitfield."""
    bitfield = [1 if p in signed_by else 0 for p in OPERATORS[:n]]
    aggregate_sig = bls_aggregate([p.sign(message) for p in signed_by])
    quorum_met = sum(bitfield) >= m_threshold
    return {
        "bitfield": bitfield,
        "participants_signed": sum(bitfield),
        "threshold": m_threshold,
        "quorum_met": quorum_met,
        "aggregate_signature": aggregate_sig if quorum_met else None,
    }


OPERATORS = [Participant(f"operator-{i}", private_key=f"sk-{i}") for i in range(1, 6)]  # n = 5

if __name__ == "__main__":
    print("DVT absorbed into the protocol — separate keys, m-of-n grouping, participation bitfield\n")

    n, m = 5, 3
    message = "attest(slot=1234)"

    print(f"n={n} registered operators, m={m} required to reach quorum\n")

    # Only 3 of 5 operators actually sign this round.
    signers = OPERATORS[:3]
    result = protocol_check(n, m, signers, message)
    print(f"Signers this round: {[p.operator_id for p in signers]}")
    print(f"Participation bitfield: {result['bitfield']}")
    print(f"Signed {result['participants_signed']}/{n}, threshold {result['threshold']} "
          f"-> quorum_met={result['quorum_met']}")
    print(f"Aggregate signature: {result['aggregate_signature']}\n")

    # Below threshold: only 2 sign.
    signers = OPERATORS[:2]
    result = protocol_check(n, m, signers, message)
    print(f"Signers this round: {[p.operator_id for p in signers]}")
    print(f"Participation bitfield: {result['bitfield']}")
    print(f"Signed {result['participants_signed']}/{n}, threshold {result['threshold']} "
          f"-> quorum_met={result['quorum_met']}")
    print("No aggregate signature: quorum not reached.")
