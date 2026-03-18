# Subgraph Implementation for Data Indexing

**Issue #80** | **State:** OPEN | **Created:** 2026-01-23T04:30:18Z

**Labels:** enhancement

**Updated:** 2026-01-23T04:38:33Z | **Closed:** N/A

---

## Summary

Implement a subgraph (The Graph) for indexing on-chain events, enabling efficient historical queries for trade history, positions, and market lifecycle.

## Tasks

- [ ] Design subgraph schema: Market, Outcome, Position, Trade entities
- [ ] Implement AssemblyScript event handlers (ConditionPreparation, PositionSplit, Transfer, etc.)
- [ ] Deploy to The Graph hosted service or self-hosted graph-node
- [ ] Implement GraphQL queries for frontend (history, volume, charts, leaderboard)
- [ ] Add subgraph health monitoring
- [ ] Create migration plan from SyncService to subgraph-backed queries

## Notes

- Complements but doesn't fully replace current SyncService
- Real-time data still needs WebSocket; subgraph is for historical queries
- Consider Goldsky for production reliability

