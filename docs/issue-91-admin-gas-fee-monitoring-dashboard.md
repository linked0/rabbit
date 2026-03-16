# Admin: Gas Fee Monitoring Dashboard

**Issue #91** | **State:** OPEN | **Created:** 2026-01-26T07:35:01Z

**Labels:** enhancement

**Updated:** 2026-01-26T07:35:01Z | **Closed:** N/A

---

**Context**
We need to monitor gas fees consumed by the server wallet (Operator) to prepare for large-scale usage and funding.

**Requirements**
1.  **Dashboard**: Create a page in the Admin Panel to show:
    *   Current Balance of Server Wallet.
    *   Total Gas Spent (Historical) & Average Gas Price.
    *   Recent Transactions Log.
2.  **Alerts**: UI warning when balance is critically low.
3.  **Estimation**: Helper to help estimate budget (e.g. '1 BNB = ~5000 Trades').

**Tasks**
- [ ] Create API endpoint `/api/admin/gas-stats` to fetch wallet details and history.
- [ ] Implement Admin Frontend page for Gas Monitoring.
- [ ] Add simple forecasting logic.

