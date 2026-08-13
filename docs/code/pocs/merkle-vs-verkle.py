"""Merkle vs Verkle PoC -- proof size grows with tree width, not with hashing speed.
Illustrates the core mechanism: a Merkle proof needs one sibling hash per level, so
wider trees (more children per node) need more siblings per level to prove membership.
"""

import hashlib


def h(*parts: str) -> str:
    return hashlib.sha256("|".join(parts).encode()).hexdigest()[:12]


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


if __name__ == "__main__":
    leaves = [f"leaf{i}" for i in range(64)]

    for branching in (2, 4, 8, 16):
        tree = build_tree(leaves, branching)
        size = proof_size(tree, leaf_index=5, branching=branching)
        print(f"branching={branching:>2}  depth={len(tree) - 1}  proof size for leaf #5 = {size} sibling hashes")

    print("\nMerkle: proof size scales with tree width (more siblings per level to submit).")
    print("Verkle: a vector commitment collapses each level's siblings to a constant-size")
    print("proof regardless of width -- that constant-size property is what makes stateless")
    print("clients (validate without holding the whole state) practical.")
