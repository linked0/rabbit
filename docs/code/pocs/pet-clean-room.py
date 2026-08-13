"""PET clean room (FHE) PoC -- toy additive homomorphic-style scheme.
ILLUSTRATIVE ONLY, not real FHE/crypto: shows the *idea* of computing on data that
never becomes readable, using modular addition as a stand-in for a homomorphic scheme.
"""

import random

MODULUS = 2**16  # toy field; real FHE uses lattice-based schemes, not plain mod-add


def keygen() -> int:
    """A random additive mask stands in for a real FHE secret key."""
    return random.randrange(MODULUS)


def encrypt(value: int, key: int) -> int:
    return (value + key) % MODULUS


def decrypt(ciphertext: int, key: int) -> int:
    return (ciphertext - key) % MODULUS


def homomorphic_add(ct_a: int, ct_b: int, key_a: int, key_b: int) -> int:
    """Adding two ciphertexts under DIFFERENT keys needs the combined key to decrypt --
    the clean room only ever sees ciphertexts and the combined sum, never the inputs."""
    return (ct_a + ct_b) % MODULUS


if __name__ == "__main__":
    # Two hospitals each hold a private count they will never reveal to each other.
    hospital_a_count = 143
    hospital_b_count = 289

    key_a, key_b = keygen(), keygen()
    ct_a = encrypt(hospital_a_count, key_a)
    ct_b = encrypt(hospital_b_count, key_b)

    print(f"hospital A's true count: {hospital_a_count} -> ciphertext sent to clean room: {ct_a}")
    print(f"hospital B's true count: {hospital_b_count} -> ciphertext sent to clean room: {ct_b}")

    # The clean room only ever handles ciphertexts.
    combined_key = (key_a + key_b) % MODULUS
    ct_sum = homomorphic_add(ct_a, ct_b, key_a, key_b)
    print(f"\nclean room computes on ciphertexts only, never sees raw counts: sum(ct) = {ct_sum}")

    joint_result = decrypt(ct_sum, combined_key)
    print(f"joint result decrypted with the combined key: {joint_result}")
    print(f"matches true total ({hospital_a_count + hospital_b_count}): {joint_result == hospital_a_count + hospital_b_count}")
