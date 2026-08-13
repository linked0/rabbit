"""Simplicity CTF: a toy combinator evaluator in Simplicity's spirit --
small pure functions composed (not a stack of imperative statements) to
check an unlock condition, mirroring the CTF's "unlock the locked LBTC" goal.
"""

# Combinators: each takes an "environment" (witness bytes) and returns a value.
def unit(_env):
    return ()

def iden(env):
    return env

def comp(f, g):
    """Sequential composition: g after f."""
    return lambda env: g(f(env))

def pair(f, g):
    """Parallel composition: run f and g on the same input, pair results."""
    return lambda env: (f(env), g(env))

def case(f, g):
    """Branch on a boolean-tagged input: (True, x) -> f(x), (False, x) -> g(x)."""
    def run(env):
        tag, value = env
        return f(value) if tag else g(value)
    return run


# Build an unlock condition purely by combinator composition, Simplicity-style:
# witness = (has_preimage, preimage_bytes)
SECRET_HASH = hash("liquid-bitcoin-secret") & 0xFFFF

def check_preimage(preimage):
    return (hash(preimage) & 0xFFFF) == SECRET_HASH

def reject(_env):
    return False

unlock_program = case(
    f=lambda preimage: check_preimage(preimage),  # tag=True branch: verify preimage
    g=reject,                                       # tag=False branch: always fail
)

for label, witness in [
    ("correct preimage", (True, "liquid-bitcoin-secret")),
    ("wrong preimage", (True, "guess")),
    ("no preimage supplied", (False, None)),
]:
    unlocked = unlock_program(witness)
    print(f"{label}: witness={witness} -> unlocked={unlocked}")
