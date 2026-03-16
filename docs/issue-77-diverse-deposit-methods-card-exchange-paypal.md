# Diverse Deposit Methods (Card, Exchange, PayPal)

**Issue #77** | **State:** OPEN | **Created:** 2026-01-23T04:30:13Z

**Labels:** enhancement

**Updated:** 2026-01-23T04:38:29Z | **Closed:** N/A

---

## Summary

Expand deposit options beyond MetaMask transfers to include credit/debit cards, crypto from other chains, exchange imports, and PayPal.

## Tasks

- [ ] Integrate fiat on-ramp provider (MoonPay, Transak, or Ramp) for card deposits
- [ ] Support multi-chain crypto deposits (ETH, BSC, Polygon) with auto-swap
- [ ] Implement exchange connection flow (Binance, Coinbase API) for direct transfers
- [ ] Research and integrate PayPal crypto checkout (verify regional availability)
- [ ] Design unified deposit UI with method selection and status tracking
- [ ] Handle KYC/AML compliance per deposit method

## Notes

- Prioritize card deposits first (broadest user reach)
- PayPal availability varies by region
- Reference wireframes in `docs/task/images/features_deposit_option.png`

