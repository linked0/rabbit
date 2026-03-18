# Improve Trading UX: Implement Async Off-chain Matching (Non-blocking)

**Issue #89** | **State:** OPEN | **Created:** 2026-01-26T06:46:07Z

**Labels:** enhancement

**Assignees:** linked0

**Updated:** 2026-01-26T07:38:39Z | **Closed:** N/A

---

**Context**
Currently, the trading flow is **synchronous and blocking**.
1. User signs order.
2. API submits transaction to Blockchain.
3. API **waits** for block confirmation (`tx.wait()`).
4. API responds to Frontend.

This causes a **2-3 second delay** for every trade, creating a sluggish user experience compared to CEXs or Polymarket.

**Proposed Solution**
Implement an **Asynchronous Matching Engine** pattern:
1. **Instant ACK**: API receives the Signed Order, validates validity (balance/signature), saves to DB as `PENDING`, and **immediately responds 200 OK**.
2. **Background Processing**: A queue/worker picks up the `PENDING` order and executes the `CTFExchange.matchOrders` transaction.
3. **Websocket Notification**: Once the blockchain confirms the tx, the server pushes a `ORDER_CONFIRMED` event via WebSocket to update the UI status from 'Pending' to 'Confirmed'.

**Tasks**
- [ ] Refactor `POST /api/trade` to be non-blocking (return immediately after DB save).
- [ ] Implement a **Job Queue** (e.g., BullMQ or simple in-memory queue) for order processing.
- [ ] **Nonce Management**: Implement a robust local nonce manager (Mutex/Redis) to handle concurrent queue processing without 'nonce too low' errors.
- [ ] **Stuck Transaction Handling**: Add logic to detect and speed up stuck transactions (resubmit with higher gas).
- [ ] Update Frontend to handle 'Pending' state optimistically (show 'Order Placed' immediately).
- [ ] Add WebSocket event `TRADE_CONFIRMED` to handle final settlement notification.

**Definition of Done**
- Trading feels 'instant' to the user (< 200ms response).
- Blockchain matching happens transparently in the background. /
- Failures in background matching are gracefully handled (Undo optimistic update / notify user).

