"""AP2 -- Stripe settlement PoC -- client "paid" claim vs server-side re-verification.
Illustrates the core mechanism: the server never trusts a client redirect alone; it
independently checks payment_status against its own mock payment record store.
"""

from dataclasses import dataclass


@dataclass
class PaymentRecord:
    session_id: str
    payment_status: str  # "paid" | "unpaid"


class MockStripe:
    """Stands in for Stripe's API: the source of truth the server re-checks against."""

    def __init__(self):
        self._sessions: dict[str, PaymentRecord] = {}

    def create_checkout_session(self, session_id: str) -> str:
        self._sessions[session_id] = PaymentRecord(session_id, "unpaid")
        return f"https://checkout.mock/{session_id}"

    def pay(self, session_id: str) -> None:
        """Simulates the buyer actually paying on Stripe's hosted page."""
        self._sessions[session_id].payment_status = "paid"

    def retrieve(self, session_id: str) -> PaymentRecord:
        return self._sessions[session_id]


class Server:
    def __init__(self, stripe: MockStripe):
        self.stripe = stripe

    def release_content(self, session_id: str, client_claims_paid: bool) -> str:
        # The point of the demo: client_claims_paid is IGNORED. Only Stripe's own
        # record, fetched server-side, decides whether content is released.
        record = self.stripe.retrieve(session_id)
        if record.payment_status == "paid":
            return "CONTENT RELEASED: here is your purchased data"
        return "DENIED: payment_status is not 'paid' per Stripe -- redirect alone proves nothing"


if __name__ == "__main__":
    stripe = MockStripe()
    server = Server(stripe)

    session_id = "cs_test_123"
    url = stripe.create_checkout_session(session_id)
    print(f"server created checkout session -> {url}")

    print("\nattacker skips payment, hits the success URL directly claiming paid=True:")
    print(" ", server.release_content(session_id, client_claims_paid=True))

    print("\nlegit buyer actually pays on Stripe's hosted page:")
    stripe.pay(session_id)
    print(" ", server.release_content(session_id, client_claims_paid=True))
