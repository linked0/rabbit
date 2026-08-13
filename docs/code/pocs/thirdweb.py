# Thirdweb — platform survey across four surfaces (contracts, Connect wallets/AA,
# Engine backend tx, Unity SDK), each rated against doing it directly. Prints a
# feature-comparison table from a dict of {feature: supported_bool}.

SURFACES = {
    "Contract deploys": {
        "one-click deploy from templates": True,
        "custom Solidity, no thirdweb lock-in": True,
        "gas-optimized beyond OpenZeppelin defaults": False,
    },
    "Connect (wallets / AA)": {
        "ERC-4337 smart accounts": True,
        "sponsored gas (paymaster)": True,
        "ERC-7702 / 7710 delegated accounts": False,  # different account type — the D1 gap
    },
    "Engine (backend tx)": {
        "server-signed transactions": True,
        "managed key custody": True,
        "self-hosted signer, zero vendor dependency": False,
    },
    "Unity SDK": {
        "in-game wallet connect": True,
        "NFT/inventory bridging": True,
        "console-platform support (parity with mobile/web)": False,
    },
}


def coverage(features: dict) -> float:
    return sum(features.values()) / len(features)


def print_table():
    print(f"{'Surface':<26}{'Feature':<45}{'Supported'}")
    print("-" * 80)
    for surface, features in SURFACES.items():
        for feature, supported in features.items():
            mark = "yes" if supported else "NO"
            print(f"{surface:<26}{feature:<45}{mark}")


if __name__ == "__main__":
    print("Thirdweb platform survey — feature coverage by surface\n")
    print_table()

    print("\nCoverage ratio per surface:")
    for surface, features in SURFACES.items():
        print(f"  {surface:<26} {coverage(features):.0%}")

    gaps = [
        f"{surface} / {feature}"
        for surface, features in SURFACES.items()
        for feature, supported in features.items()
        if not supported
    ]
    print("\nGaps where 'best-in-class' breaks (breadth's limit):")
    for gap in gaps:
        print(f"  - {gap}")
