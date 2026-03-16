# Admin Fund Reserve for Market Cancellation Refunds

**Issue #97** | **State:** OPEN | **Created:** 2026-01-28T07:44:41Z

**Updated:** 2026-01-28T07:44:41Z | **Closed:** N/A

---

## Summary
When a market is cancelled due to policy violations, the platform needs to refund traders based on their cost basis. However, if the exchange balance doesn't have sufficient funds to cover these refunds (e.g., due to price movements or liquidity withdrawal), the admin needs a mechanism to top up the exchange.

## Problem
- Market cancellation triggers refunds based on **cost basis** (off-chain trade history)
- The on-chain collateral pool may not match the total cost basis refund amount
- Example: User bought 100 shares at $0.80 each ($80 total cost), but current pool only has $60 due to other redemptions

## Requirements

### 1. Admin Fund Reserve
- [ ] Admin wallet should maintain a reserve fund for emergency refunds
- [ ] Define minimum reserve threshold (e.g., percentage of total active market value)
- [ ] Alert system when reserve falls below threshold

### 2. Top-Up Mechanism
- [ ] Admin endpoint to deposit additional funds to exchange contract
- [ ] Automatic top-up trigger when cancellation refund exceeds available balance
- [ ] Transaction logging for audit purposes

### 3. Refund Guarantee
- [ ] Ensure all cost-basis refunds can be honored
- [ ] Handle edge cases where refund exceeds available collateral
- [ ] Clear error handling if funds are insufficient

## Technical Considerations
- Exchange contract may need modification to allow admin deposits
- Off-chain tracking of expected refund liability
- Integration with existing voluntary-close and forfeiture flows

## Related
- Cancellation Refund Policy (Cost Basis) in User Guide
- Voluntary close endpoint: `POST /api/markets/:id/voluntary-close`
- Admin forfeit endpoint: `POST /api/admin/forfeit`

## Acceptance Criteria
- [ ] Admin can deposit funds to exchange for refund coverage
- [ ] System calculates expected refund liability before cancellation
- [ ] Warning if admin reserve is insufficient for pending cancellation
- [ ] All traders receive full cost-basis refunds regardless of pool state

