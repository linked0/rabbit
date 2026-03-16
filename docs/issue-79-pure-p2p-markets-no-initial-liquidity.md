# Pure P2P Markets (No Initial Liquidity)

**Issue #79** | **State:** OPEN | **Created:** 2026-01-23T04:30:16Z

**Labels:** enhancement

**Updated:** 2026-01-23T04:38:31Z | **Closed:** N/A

---

## Summary

Allow market creation without platform-provided initial liquidity. Markets operate purely peer-to-peer with limit orders waiting for counterparties.

## Tasks

- [ ] Add market type flag: `LIQUIDITY_PROVIDED` vs `PURE_P2P`
- [ ] Update market creation API to skip initial order seeding for P2P
- [ ] Design P2P market UI (empty orderbook state, pending orders display)
- [ ] Implement order expiration policies for stale P2P orders
- [ ] Add market filtering: P2P vs liquidity-backed
- [ ] Consider reduced deposit/fees for P2P markets (less platform risk)

## Notes

- No smart contract changes needed (orderbook is off-chain)
- P2P markets may have wider spreads — set user expectations
- Good for niche topics where platform doesn't want capital exposure

