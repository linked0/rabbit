# JSON-RPC Standardized API Communication

**Issue #82** | **State:** OPEN | **Created:** 2026-01-23T04:31:30Z

**Labels:** enhancement

**Updated:** 2026-01-23T04:38:35Z | **Closed:** N/A

---

## Summary

Standardize API communication using JSON-RPC 2.0 for consistent request/response patterns, batch requests, and structured error handling.

## Tasks

- [ ] Design JSON-RPC method namespace (market_*, order_*, account_*, admin_*)
- [ ] Implement JSON-RPC server middleware (request parsing, batch support, error codes)
- [ ] Define application error code taxonomy
- [ ] Add subscription methods over WebSocket (market/orderbook/account updates)
- [ ] Migrate existing REST endpoints to JSON-RPC methods
- [ ] Create TypeScript JSON-RPC client SDK

## Notes

- JSON-RPC is familiar to blockchain developers (EVM JSON-RPC standard)
- Can coexist with REST API during migration period
- Batch requests useful for multi-order management

