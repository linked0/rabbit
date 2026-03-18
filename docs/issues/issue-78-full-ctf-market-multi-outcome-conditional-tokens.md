# Full CTF Market (Multi-Outcome Conditional Tokens)

**Issue #78** | **State:** OPEN | **Created:** 2026-01-23T04:30:15Z

**Labels:** enhancement

**Updated:** 2026-01-23T04:38:30Z | **Closed:** N/A

---

## Summary

Implement true multi-outcome CTF markets with a single conditionId and N outcome slots, replacing the current grouped-binary approach for better capital efficiency and UX.

## Tasks

- [ ] Update smart contracts: `prepareCondition` with N>2 slots, proper partition splitting
- [ ] Update orderbook to handle N-outcome structure with price normalization (sum ≤ 100%)
- [ ] Update API/DB schema for single market with N outcomes (not grouped binaries)
- [ ] Build multi-outcome market detail page (probability bars, per-outcome ordering)
- [ ] Update resolution logic for multi-outcome payouts
- [ ] Design migration path from grouped-binary to true multi-outcome

## Notes

- Fundamental architecture change — plan carefully
- Start with 3-4 outcome markets, then generalize
- `conditionId = keccak256(oracle, questionId, outcomeSlotCount)`

