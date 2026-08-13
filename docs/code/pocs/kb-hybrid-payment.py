# KB hybrid payment flow — where a card rail (ISO 8583) meets on-chain settlement.
# Illustrates the core tension: ISO 8583 auth is reversible (chargebacks), on-chain
# settlement is final. Routing decides who has to absorb that reversibility mismatch.

from dataclasses import dataclass


@dataclass
class PaymentLeg:
    rail: str
    reversible: bool
    settlement_window: str


CARD_RAIL = PaymentLeg(rail="ISO 8583 (card network)", reversible=True, settlement_window="T+1 to T+2, chargeback window ~120 days")
ONCHAIN_RAIL = PaymentLeg(rail="Avalanche subnet settlement", reversible=False, settlement_window="final on confirmation")

# Below this threshold, the reversibility of the card rail is an acceptable business
# risk; above it, finality of on-chain settlement is preferred to avoid chargeback
# exposure on a large-value transfer. This threshold is the "touch point" the card
# describes — a business decision about who absorbs the mismatch, not a technical one.
CHARGEBACK_RISK_THRESHOLD_USD = 1000.0


def route_payment(amount_usd: float) -> PaymentLeg:
    """Decide which settlement leg carries this payment."""
    if amount_usd < CHARGEBACK_RISK_THRESHOLD_USD:
        return CARD_RAIL
    return ONCHAIN_RAIL


def describe(amount_usd: float) -> str:
    leg = route_payment(amount_usd)
    absorbs = "merchant accepts chargeback risk" if leg.reversible else "buyer accepts irreversibility"
    return (
        f"${amount_usd:>8,.2f} -> {leg.rail:<28} "
        f"(reversible={leg.reversible!s:<5}, window={leg.settlement_window}) | {absorbs}"
    )


if __name__ == "__main__":
    print("KB hybrid payment routing — card rail vs on-chain settlement\n")
    for amount in (25.00, 450.00, 999.99, 1000.00, 15000.00):
        print(describe(amount))

    print(f"\nRouting threshold: ${CHARGEBACK_RISK_THRESHOLD_USD:,.2f}")
    print("Below it: card rail's reversibility is the safer default.")
    print("At/above it: on-chain finality avoids chargeback exposure on large sums.")
