# UMA Integration for Decentralized Resolution

**Issue #74** | **State:** OPEN | **Created:** 2026-01-23T04:29:16Z

**Labels:** enhancement

**Updated:** 2026-01-23T04:38:25Z | **Closed:** N/A

---

## Summary

Integrate UMA optimistic oracle for decentralized dispute-based resolution. Proposers stake bonds on outcomes, and anyone can dispute within a window — enabling trustless resolution for subjective markets.

## Tasks

- [ ] Design `UMAResolver` adapter contract compatible with `ResolutionOracle`
- [ ] Implement assertion flow: propose → dispute window → finalization
- [ ] Create backend service to monitor UMA assertions and sync resolution state
- [ ] Update market creation to support UMA as resolution source
- [ ] Add UMA resolution status to market detail page
- [ ] Write tests with UMA mock oracle

## Notes

- Ideal for subjective/event markets that can't use Chainlink price feeds
- Consider hybrid: Chainlink for price markets, UMA for event markets
- Bond economics need careful design to prevent spam

