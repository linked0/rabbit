# Allow creators and users to provide liquidity to markets

**Issue #72** | **State:** OPEN | **Created:** 2026-01-23T04:15:37Z

**Updated:** 2026-01-23T04:25:45Z | **Closed:** N/A

---

## Summary

Enable market creators to contribute their own liquidity at market creation, and allow regular users to provide liquidity to existing markets as LPs (Liquidity Providers).

## Background

Currently, the platform provides 100% of market liquidity. The creator's deposit is separate (penalty-only, Option B — see `docs/task/design/penalty-liquidity-config-ui.md`). This feature would let participants earn LP revenue by contributing their own funds to the liquidity pool.

## Two Capabilities

### 1. Creator Initial Liquidity (at market creation)

The creator configures how much of the total liquidity they personally provide vs. platform support.

- UI wireframe already exists: `docs/images/liquidity-config-wireframe.png`
- Fields: Total Liquidity (read-only), User Liquidity (adjustable), Platform Support (auto-calculated)
- Minimum: 50 USDC (matches penalty deposit)
- Formula: `Total Liquidity = 2 × Initial Liquidity × Number of Outcomes`

### 2. User Liquidity Provision (post-creation)

Any user can add liquidity to an active market and earn proportional LP revenue.

- User deposits USDC → receives LP share tokens
- Earns proportional sales proceeds from token trades
- Can withdraw liquidity (subject to market rules)
- Settlement splits payouts by LP share ratio

## Requirements

- [ ] Dual/Multi-LP settlement logic (proportional splits)
- [ ] `MarketTokenOwnership` table for tracking LP shares
- [ ] `MarketEscrow` table for sales proceeds attribution
- [ ] "Last one gets remainder" precision pattern for settlement
- [ ] LP share calculation for mid-market entries
- [ ] Withdrawal rules (lock period? partial withdrawal?)
- [ ] Settlement fee exemption for LP redemptions
- [ ] Fuzz testing for settlement security (rounding, overdraft)

## Prerequisites

- Penalty deposit system (Option B) shipped and stable
- Validated creator demand for LP participation
- Settlement security audit completed

## Reference

- Design doc: `docs/task/design/penalty-liquidity-config-ui.md` (see "Future Feature" section)
- UI wireframe: `docs/images/liquidity-config-wireframe.png`

---

## Comments

### @linked0 — 2026-01-23T04:25:45Z

It's an reference UI.

<img width="453" height="779" alt="Image" src="https://github.com/user-attachments/assets/584d802b-bcfb-410b-9137-bae881dcf2d3" />

---

