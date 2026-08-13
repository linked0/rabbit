# Toss Payments — client presents paymentKey/orderId/amount from a redirect, but the
# server independently re-confirms against its own authorized record before releasing
# content. A tampered amount in the redirect must fail, never be trusted as-is.

from dataclasses import dataclass


@dataclass
class AuthorizedPayment:
    payment_key: str
    order_id: str
    authorized_amount: int  # what Toss actually authorized, held server-side


# Simulates Toss's own record of what was actually approved during the payment window.
TOSS_AUTHORIZED_RECORDS = {
    "pk_abc123": AuthorizedPayment("pk_abc123", "order_001", authorized_amount=15000),
}


def client_redirect(payment_key: str, order_id: str, claimed_amount: int) -> dict:
    """What the browser's redirect query string carries — untrusted input."""
    return {"paymentKey": payment_key, "orderId": order_id, "amount": claimed_amount}


def server_confirm(redirect_payload: dict) -> bool:
    """Server-side confirm step: re-check the claimed amount against Toss's own
    authorized record using a server-only secret key (mocked as a dict lookup)."""
    record = TOSS_AUTHORIZED_RECORDS.get(redirect_payload["paymentKey"])
    if record is None:
        return False
    if record.order_id != redirect_payload["orderId"]:
        return False
    return record.authorized_amount == redirect_payload["amount"]


def release_content_if_confirmed(redirect_payload: dict) -> str:
    if server_confirm(redirect_payload):
        return "content released"
    return "confirmation rejected — content withheld"


if __name__ == "__main__":
    print("Toss Payments — client presents amount, server independently re-checks\n")

    print("Case 1: honest redirect, amount matches Toss's authorized record")
    honest = client_redirect("pk_abc123", "order_001", claimed_amount=15000)
    print(f"  redirect payload: {honest}")
    print(f"  -> {release_content_if_confirmed(honest)}\n")

    print("Case 2: tampered redirect, amount lowered by the client")
    tampered = client_redirect("pk_abc123", "order_001", claimed_amount=100)
    print(f"  redirect payload: {tampered}")
    print(f"  -> {release_content_if_confirmed(tampered)}")
