# Chainlink Integration

**Issue #73** | **State:** OPEN | **Created:** 2026-01-23T04:29:14Z

**Labels:** enhancement

**Updated:** 2026-01-23T04:38:24Z | **Closed:** N/A

---

## Summary

Integrate Chainlink oracle for automated, trustless market resolution using price feeds and event data, replacing manual admin resolution for supported market types.

## Tasks

- [ ] Research available Chainlink data feeds on target chain (BSC/Polygon)
- [ ] Implement `ChainlinkResolver` contract bridging feeds to `ResolutionOracle`
- [ ] Create market-to-feed mapping and automated resolution trigger
- [ ] Add fallback to admin resolution if feed unavailable
- [ ] Update market creation UI to select resolution source
- [ ] Write integration tests with Chainlink mock contracts

## Notes

- Start with price-feed markets (e.g., "Will BTC reach $X by date Y?")
- Consider Chainlink Automation (Keepers) for triggering at market end time
- Current resolution: `api/src/routes/admin.ts` → `adminFinalizeResolution()`

