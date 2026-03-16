# [BUG] Partially Filled Orders Cannot Be Matched Again - OrderFilledOrCancelled Error

**Issue #99** | **State:** OPEN | **Created:** 2026-01-29T15:08:14Z

**Assignees:** linked0, Abdulkarim4u

**Updated:** 2026-01-29T15:08:14Z | **Closed:** N/A

---

## 🐛 Bug Description

When a limit order is partially filled, subsequent attempts to match the remaining shares fail with contract error `0x7b38b76e` (`OrderFilledOrCancelled()`). This prevents the remaining portion of partially filled orders from being executed.

## 🔄 Steps to Reproduce

1. **Alice/ Trader 1 ** places a Buy Limit order: 20 shares at 51¢ ($10.20 total)
2. **Bob/Trader2 who has shares ** Market Sells 10 shares → ✅ **SUCCESS** (partial fill)
   - Database state: `originalSize: 20, remainingSize: 10, status: PARTIALLY_FILLED`
3. **Bob** tries to Market Sell another 10 shares → ❌ **FAILS**
   - Error: `execution reverted: 0x7b38b76e` (OrderFilledOrCancelled)

## 📊 Expected Behavior

- Bob's second sell should match against Alice's remaining 10 shares
- Trade should execute successfully
- Alice should receive all 20 shares across two trades

## ❌ Actual Behavior

- Second trade fails with `OrderFilledOrCancelled()` error
- Alice's order remains stuck as `PARTIALLY_FILLED` in database
- Remaining 10 shares cannot be filled

## 🔍 Root Cause Analysis

### The Problem: Duplicate Order Hash

The CTFExchange contract uses order hash-based tracking:
```solidity
mapping(bytes32 => uint256) public filled; // orderHash => filledAmount
```

**First fill (10 shares):**
1. Contract calculates `orderHash = keccak256(abi.encode(order))`
2. Records `filled[orderHash] = 10 shares`
3. ✅ Transaction succeeds

**Second fill attempt (remaining 10 shares):**
1. System retrieves order from database: `status: PARTIALLY_FILLED, remainingSize: 10`
2. Constructs order struct with **SAME nonce, salt, and signature**
3. Calculates **SAME orderHash**
4. Contract checks: `filled[orderHash] > 0` → Already processed! → ❌ **REVERT**

### Why Our Current Approach Fails

**Database correctly updates:**
```typescript
{
  orderId: "abc-123",
  remainingSize: 10,        // ✅ Correct
  status: "PARTIALLY_FILLED",
  nonce: 0,                 // ❌ Same nonce = same hash
  salt: "...",              // ❌ Same salt = same hash
  signature: "..."          // ❌ Same signature = same hash
}
```

**But on-chain:**
```solidity
filled[orderHash] = 10;  // Contract: "This order was already processed!"
```

The contract doesn't differentiate between "fully filled" and "partially filled" - it only knows if an order hash has been used.

## ✅ Proposed Solution

### Recommended: One Order Per Fill (Polymarket Approach)

**How it works:**
- After ANY fill (partial or full), mark the order as `FILLED` and close it
- User must place a NEW order for remaining amount if desired

**Why this approach:**
- ✅ Matches industry standard (Polymarket, 0x Protocol)
- ✅ No complex state management
- ✅ Prevents OrderFilledOrCancelled error entirely
- ✅ No smart contract changes needed
- ✅ Simple implementation

**Code Changes Required:**

#### 1. Exclude PARTIALLY_FILLED from order matching

**File:** `/api/src/routes/orders.ts` (line ~385)

```typescript
const matchingDbOrders = await prisma.order.findMany({
  where: {
    outcomeId,
    side: oppositeSide,
    status: 'OPEN',  // ✅ CHANGE: Remove 'PARTIALLY_FILLED' from array
    isActive: true,
    price: signedOrder.side === 0
      ? { lte: price }
      : { gte: price },
  },
  orderBy: {
    price: signedOrder.side === 0 ? 'asc' : 'desc',
  },
});
```

**Before:**
```typescript
status: { in: ['OPEN', 'PARTIALLY_FILLED'] },  // ❌ Includes partially filled
```

**After:**
```typescript
status: 'OPEN',  // ✅ Only open orders
```

#### 2. Always mark orders as FILLED after any fill

**File:** `/api/src/routes/orders.ts` (line ~697)

```typescript
await prisma.order.update({
  where: { id: matchOrder.id },
  data: {
    remainingSize: { decrement: fillShares },
    status: 'FILLED',           // ✅ CHANGE: Always FILLED (not PARTIALLY_FILLED)
    isActive: false,            // ✅ CHANGE: Deactivate order
  },
});
```

**Before:**
```typescript
status: fillShares >= matchShares ? 'FILLED' : 'PARTIALLY_FILLED',  // ❌ Allows partial
isActive: fillShares >= matchShares ? false : true,
```

**After:**
```typescript
status: 'FILLED',      // ✅ Always mark as FILLED
isActive: false,       // ✅ Always deactivate
```

## 🔬 Alternative Solutions Considered

### Option 2: Increment Nonce After Partial Fill
- **Pros:** Allows true partial fills
- **Cons:** Requires user to re-sign after each partial fill (not practical for auto-matching)
- **Verdict:** ❌ Not recommended (user may be offline)

### Option 3: Smart Contract Upgrade
- **Pros:** Native partial fill support
- **Cons:** Expensive, risky, goes against 0x/Seaport patterns
- **Verdict:** ❌ Not recommended

## 📝 Testing Plan

After implementing the fix:

1. ✅ Alice places buy limit: 20 shares at 51¢
2. ✅ Bob market sells 10 shares
   - Expected: Order marked as `FILLED`, `isActive: false`
3. ✅ Bob market sells 10 more shares
   - Expected: Matches against OTHER orders (not Alice's closed order)
4. ✅ Alice's portfolio shows 10 shares (from first fill)
5. ✅ Alice's open orders tab is empty (order closed after first fill)
6. ✅ Alice can place NEW order for remaining shares if desired

## 📚 References

- **Polymarket:** Uses one-time orders (no partial fill reuse)
- **0x Protocol:** Tracks filled amounts on-chain, but our contract doesn't support this
- **Seaport (OpenSea):** Similar partial fill handling to 0x
- **Our CTFExchange:** Based on simplified 0x design, treats each orderHash as single-use

## 💡 Additional Notes

### UX Consideration

After this fix, users will need to place a new order for remaining shares. Consider adding UI messaging:

```
ℹ️ Your limit order was partially filled (10/20 shares).
   The order has been closed. Place a new order for the remaining 10 shares.
```

### Impact Assessment

- **Breaking Change:** No (existing orders continue working)
- **Data Migration:** No (existing PARTIALLY_FILLED orders will be excluded from matching)
- **User Experience:** Slight degradation (must place new order), but matches industry standard

## 🎯 Success Criteria

- [ ] No more `OrderFilledOrCancelled` errors
- [ ] Partially filled orders are properly closed
- [ ] Users can place new orders for remaining amounts
- [ ] Order matching works correctly for all scenarios
- [ ] Tests pass for partial fill scenarios

## 🔗 Related Files

- `/api/src/routes/orders.ts` (main order matching logic)
- `/api/src/routes/trade.ts` (trade execution)
- `PARTIAL_FILL_BUG_ANALYSIS.md` (detailed technical analysis)

## 📸 Error Logs

```
❌ Error executing batch orders: Error: execution reverted (unknown custom error)
   (action="estimateGas", data="0x7b38b76e", reason=null, ...)

Error code decoded: OrderFilledOrCancelled()
```

---

**Priority:** High 🔴
**Estimated Effort:** Small (2 lines of code changes)
**Risk:** Low (minimal changes, no contract upgrade needed)

