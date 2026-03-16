# Risk Mitigation Strategy

**Issue #58** | **State:** OPEN | **Created:** 2026-01-16T00:48:35Z

**Assignees:** linked0

**Updated:** 2026-01-21T01:46:31Z | **Closed:** N/A

---

## Overview
To protect the platform's capital from the risks of acting as the initial liquidity provider, we must implement advanced trading logic.

## Sub tasks
1. **Spread Capture (Markup)**
    - Initial orders provided by the admin should not be at fair value (0.50) but should include a spread (e.g., sell YES @ 0.55, NO @ 0.55) to build a profit buffer against adverse selection.

2. **Dynamic AMM Pricing**
    - Implement an inventory-balancing algorithm that automatically adjusts prices based on the platform's remaining token inventory.
    - If traders buy heavily into one outcome, the price for that outcome should rise to curb demand and capture premium.

3. **Negative Risk (NegRisk) Implementation**
    - For multi-outcome markets, allow "NO" orders on one outcome to serve as liquidity for "YES" orders on others.
    - This aggregates liquidity and reduces the capital required from the platform by letting traders bet against each other's conflicting positions.

## Details
**Dynamic Automated Market Maker (AMM) Pricing**
- Concept: Since the platform acts as the initial liquidity provider (LP), it shouldn't just sell tokens at a fixed price. It needs to adjust prices based on demand to balance its book.
- Price Adjustment (Slippage): If traders start buying a lot of "YES" tokens, the platform's algorithm (or AMM) should automatically raise the price of YES and lower the price of NO.
- Result: As the platform sells off its "YES" inventory, it charges more and more for it. Ideally, the premium charged on the popular token covers the potential loss on the unpopular one.

**Negative Risk (NegRisk)**
- Concept: primarily a feature for users (allowing them to buy "NO" on 5 different outcomes without paying 5x collateral), it significantly helps the Platform/LP manage risk in multi-outcome markets.
- Capital Efficiency: Instead of locking 
1.00.
- Liquidity Aggregation: When users place Limit Orders (bids) on "NO" for Option A, B, and C, NegRisk logic can effectively treat those combined "NO" bets as liquidity for a "YES" bet on Option D.
- Effect: This helps the platform (or any LP) fill orders on one side using the liquidity from the other side, rather than taking the opposing side itself with its own capital.
- Reducing Platform Exposure: By enabling traders to effectively bet against each other across different outcomes (e.g., Trader A bets YES on France, which acts as liquidity for Trader B betting YES on Argentina), the platform steps out of the middle. The platform becomes a matcher of risk between users rather than the sole counterparty absorbing the risk.

