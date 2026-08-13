"""Moralis Wallet API: fetch a mock wallet snapshot (token balances) and
compute a simple portfolio summary using mock prices, instead of indexing
chain data yourself.
"""

def mock_moralis_get_wallet_tokens(address):
    # Simulates what Moralis's Wallet API would return for token balances.
    return {
        "address": address,
        "tokens": [
            {"symbol": "ETH", "balance": 1.85},
            {"symbol": "USDC", "balance": 2500.0},
            {"symbol": "LINK", "balance": 120.0},
        ],
    }


MOCK_PRICES_USD = {"ETH": 3200.0, "USDC": 1.0, "LINK": 14.5}


def summarize_portfolio(snapshot, prices):
    rows = []
    total = 0.0
    for token in snapshot["tokens"]:
        price = prices.get(token["symbol"], 0.0)
        value = token["balance"] * price
        total += value
        rows.append((token["symbol"], token["balance"], price, value))
    return rows, total


address = "0xA1b2C3d4E5f6789012345678901234567890AbCd"
snapshot = mock_moralis_get_wallet_tokens(address)
print(f"wallet snapshot for {snapshot['address']}:")

rows, total = summarize_portfolio(snapshot, MOCK_PRICES_USD)
for symbol, balance, price, value in rows:
    print(f"  {symbol:5s} balance={balance:>10.4f}  price=${price:>8.2f}  value=${value:>10.2f}")

print(f"\ntotal portfolio value: ${total:,.2f}")
