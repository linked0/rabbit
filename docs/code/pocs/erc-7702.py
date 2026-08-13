"""EIP-7702 PoC -- delegation designator at a fixed address.
Illustrates the core mechanism: an account keeps its address; only its "code slot"
changes to point at an implementation. Calls resolve through that pointer.
"""

DELEGATION_MARKER = "0xef0100"


class Implementation:
    def __init__(self, name: str):
        self.name = name

    def execute(self, account: str, calldata: str) -> str:
        return f"[{self.name}] running as {account}: {calldata}"


# The chain's global code-slot mapping: address -> designator (or None = plain EOA).
code_slots: dict[str, str | None] = {}
implementations = {
    "0xDeleGator...": Implementation("DeleGatorV1"),
    "0xZeroAddr...": None,  # pointing back here undoes the delegation
}


def get_code(address: str) -> str | None:
    return code_slots.get(address)


def authorize(address: str, implementation_address: str) -> None:
    """A type-4 tx: write the 23-byte designator (marker + impl address) into the code slot."""
    code_slots[address] = f"{DELEGATION_MARKER}{implementation_address}"


def call(address: str, calldata: str) -> str:
    designator = get_code(address)
    if designator is None:
        return f"{address} is a plain EOA: can sign, cannot execute calldata"
    if not designator.startswith(DELEGATION_MARKER):
        return f"{address} is an ordinary deployed contract"
    impl_address = designator[len(DELEGATION_MARKER):]
    impl = implementations[impl_address]
    if impl is None:  # pointed at the zero address -> delegation revoked
        return f"{address} delegation revoked: behaves like a plain EOA again"
    return impl.execute(address, calldata)


if __name__ == "__main__":
    owner = "0xOwnerEOA..."
    print(f"before authorization: {call(owner, 'transfer(USDC, 10)')}")

    authorize(owner, "0xDeleGator...")
    print(f"eth_getCode({owner}) -> {get_code(owner)}")
    print(f"after authorization: {call(owner, 'transfer(USDC, 10)')}")

    print("\nowner, balance, nonce untouched -- only the code slot changed")
    print("revoking by pointing the designator back at the zero address:")
    code_slots[owner] = f"{DELEGATION_MARKER}0xZeroAddr..."
    print(f"after revoking: {call(owner, 'transfer(USDC, 10)')}")
