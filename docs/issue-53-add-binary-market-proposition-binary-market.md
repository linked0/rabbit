# Add Binary Market(Proposition Binary Market)

**Issue #53** | **State:** CLOSED | **Created:** 2026-01-15T01:15:49Z

**Assignees:** Abdulkarim4u

**Updated:** 2026-01-30T07:21:51Z | **Closed:** 2026-01-30T07:21:51Z

---

**### Proposition Binary Market**

_“Will X happen?” → Yes / No_

The issue is:
  1. Frontend enforces minimum 2 outcomes 
  2. Backend API validates at least 2 outcomes (batch.ts:15)
  3. BatchProcessor creates a market group with multiple markets

  To fix this, I need to:
  1. Add a market type selector in the frontend (Binary vs Multi-Outcome)
  2. Allow single outcome for binary markets
  3. Update backend to handle binary markets differently

