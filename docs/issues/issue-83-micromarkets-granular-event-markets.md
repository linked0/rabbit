# Micromarkets (Granular Event Markets)

**Issue #83** | **State:** OPEN | **Created:** 2026-01-23T04:31:32Z

**Labels:** enhancement

**Updated:** 2026-01-23T04:38:37Z | **Closed:** N/A

---

## Summary

Support granular, time-scoped markets within larger events (e.g., first-half results, player stats, hourly price targets).

## Tasks

- [ ] Design parent-event → child-micromarket data model with time-window scoping
- [ ] Implement template-based rapid market creation for common types
- [ ] Integrate real-time data feeds for automated rapid resolution
- [ ] Build live event page UI with active micromarkets and real-time odds
- [ ] Implement batch settlement for high-frequency resolution
- [ ] Add position limits and manipulation detection for short-window markets

## Notes

- Start with crypto price micromarkets (data feeds already available)
- Sports micromarkets need reliable live APIs (expensive)
- Gas costs may require off-chain settlement with periodic on-chain checkpoints

