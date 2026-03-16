# implement 1/N categorical pricing logic and real-time chart synchronization

**Issue #57** | **State:** OPEN | **Created:** 2026-01-15T09:30:30Z

**Assignees:** Abdulkarim4u

**Updated:** 2026-01-16T00:19:16Z | **Closed:** N/A

---

Logic & Backend:
- Fixed categorical market "50% default" bug by implementing 1/N starting probability logic.
- Updated BatchProcessor and seeding scripts to ensure market sums equal 100% on launch.
- Implemented recursive price lookback logic in PriceHistoryService to prevent 0¢ chart drops.
Frontend & UI/UX:
- Implemented "Perfect Sync" charts: injected synthetic start and live data points to ensure historical lines are always visible and in sync with header percentages.
- Added dynamic price movement labels (↑/↓) showing real-time gains/losses relative to launch price.
- Refined ChartTooltips and legends to show professional dollar volume and live prices.
- Patched homepage "No" buttons to correctly initiate BUY orders instead of SELL.
Documentation:
- Added comprehensive design document in /docs/task/design.
- Added industry-standard charts testing plan in /docs/test.

