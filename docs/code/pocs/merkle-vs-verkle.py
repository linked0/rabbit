"""Merkle vs Verkle PoC -- proof size grows with tree width, not with hashing speed.
Illustrates the core mechanism: a Merkle proof needs one sibling hash per level, so
wider trees (more children per node) need more siblings per level to prove membership.

The Verkle half mirrors the Merkle half line-for-line -- same tree, same leaf. The ONLY
thing that changes is how many openings a proof carries per level:
  Merkle: (children in the group - 1) siblings per level  -> grows with width
  Verkle: exactly ONE opening         per level           -> constant, any width

NOTE: a production Verkle uses an IPA/KZG *vector commitment* (elliptic-curve math) so
that one O(1) opening proves a child at any position. The Verkle commitment below is
still a hash, so the file runs with no libraries -- it only MODELS the proof-*size*
property, and is NOT cryptographically sound. The point is size, not crypto.
"""

import hashlib


def h(*parts: str) -> str:
    return hashlib.sha256("|".join(parts).encode()).hexdigest()[:12]


# ── Merkle ────────────────────────────────────────────────────────────────────
def build_tree(leaves: list[str], branching: int) -> list[list[str]]:
    """Builds a Merkle tree with `branching` children per node; returns levels bottom-up."""
    levels = [leaves]
    while len(levels[-1]) > 1:
        cur = levels[-1]
        nxt = []
        for i in range(0, len(cur), branching):
            group = cur[i:i + branching]
            nxt.append(h(*group))
        levels.append(nxt)
    return levels


def proof_size(levels: list[list[str]], leaf_index: int, branching: int) -> int:
    """Count sibling hashes needed to prove one leaf's membership -- (branching - 1) per level."""
    siblings = 0
    idx = leaf_index
    for level in levels[:-1]:
        siblings += branching - 1  # every level, you must supply all other children in the group
        idx //= branching
    return siblings


# ── Verkle (same tree shape; only the proof model differs) ──────────────────────
def verkle_build_tree(leaves: list[str], branching: int) -> list[list[str]]:
    """Same shape as build_tree; commit stands in for a vector commitment over the children."""
    levels = [leaves]
    while len(levels[-1]) > 1:
        cur = levels[-1]
        nxt = []
        for i in range(0, len(cur), branching):
            group = cur[i:i + branching]
            nxt.append(h("vc", *group))  # a real Verkle uses an IPA/KZG commitment here
        levels.append(nxt)
    return levels


def verkle_proof_size(levels: list[list[str]], leaf_index: int, branching: int) -> int:
    """ONE constant-size opening per level, regardless of width -- what a vector commitment buys."""
    return len(levels) - 1


if __name__ == "__main__":
    leaves = [f"leaf{i}" for i in range(64)]

    # bytes per opening: a 32B sibling hash (Merkle) vs one 48B EC opening (Verkle, BLS12-381 G1)
    MB, VB = 32, 48
    print(f"{'branch':>6}{'depth':>7}{'merkle_open':>13}{'verkle_open':>13}{'merkle_B':>10}{'verkle_B':>10}")
    for branching in (2, 4, 8, 16):
        mt = build_tree(leaves, branching)
        vt = verkle_build_tree(leaves, branching)
        mo = proof_size(mt, leaf_index=5, branching=branching)
        vo = verkle_proof_size(vt, leaf_index=5, branching=branching)
        print(f"{branching:>6}{len(mt) - 1:>7}{mo:>13}{vo:>13}{mo * MB:>10}{vo * VB:>10}")

    # why Verkle deliberately picks a WIDE node (Ethereum's design is 256-ary):
    # width is free for proof SIZE, so go wide -> shallow tree -> tiny proof.
    print("\n--- wide node: free for Verkle, ruinous for Merkle ---")
    for branching in (2, 16, 256):
        mt = build_tree(leaves, branching)
        vt = verkle_build_tree(leaves, branching)
        print(f"branch={branching:>3}  depth={len(mt) - 1}  "
              f"merkle openings={proof_size(mt, 5, branching):>3}   "
              f"verkle openings={verkle_proof_size(vt, 5, branching)}")

    print("\nMerkle: wider = bigger proof (siblings pile up), so real trees stay binary.")
    print("Verkle: a vector commitment collapses each level's siblings to a constant-size")
    print("opening regardless of width -- so go wide, shallow, tiny. The cost did not vanish;")
    print("it moved into heavier cryptography (per opening), not into more bytes. That")
    print("constant-size property is what makes stateless clients (validate without holding")
    print("the whole state) practical.")
