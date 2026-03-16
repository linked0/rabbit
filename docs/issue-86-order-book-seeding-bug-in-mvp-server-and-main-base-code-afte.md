# Order book seeding bug in  mvp server and main base code after user creates a new market

**Issue #86** | **State:** CLOSED | **Created:** 2026-01-23T07:38:03Z

**Assignees:** linked0

**Updated:** 2026-01-29T05:36:45Z | **Closed:** 2026-01-29T05:36:45Z

---

  
 
Body:
 ### I found this issue in MVP server and also our main base code server when a user tries to buy shares in a new market which was created from the UI.

  **To reproduce this error (either MVP server or main base code):**
  1. Create a new market using $100 liquidity
  2. Try to buy $100 shares of any outcome
  3. Transaction fails with `ERC1155InsufficientBalance` error


  ### MVP testing
<img width="2086" height="1291" alt="Image" src="https://github.com/user-attachments/assets/89578ee2-48ad-48ae-9cbd-c3e3e82baba9" />

###Main base code  testing

<img width="2237" height="1127" alt="Image" src="https://github.com/user-attachments/assets/126004a5-980a-4604-aade-8810ccf04133" />

  
  ##Order book seeding requires 2x token balance causing ERC1155InsufficientBalance errors

  
  ## Problem

  When trading a market  with which was created using  $100 initial liquidity, trades fail with `ERC1155InsufficientBalance` error.

  **Error:**
  execution reverted: 0x03dee4c5... (ERC1155InsufficientBalance)

  ## Root Cause

  The order seeding formula uses **value-based distribution** instead of **token-based distribution**:

  **Current Formula (Value-Based):**
  ```typescript
  // OrderSeedService.ts line 63
  shares: liquidityUSDC * 0.30 / (price + 0.01)

  This tries to maintain "$30 USDC worth" at each price level:
  - 51¢: $30 / 0.51 = 58.82 shares
  - 52¢: $25 / 0.52 = 48.08 shares
  - 53¢: $20 / 0.53 = 37.74 shares
  - 54¢: $15 / 0.54 = 27.78 shares
  - 55¢: $10 / 0.55 = 18.18 shares
  - Total: 190.6 shares needed

  But server only has 100 tokens from splitting 100 USDC.

  Impact

  - ✅ Market creation succeeds
  - ✅ Order book appears with correct structure
  - ❌ Trading fails when trying to match orders (server doesn't have enough tokens)



  Current Workaround

  Run yarn provision:all after creating markets. This mints an additional 200 tokens per market, giving the server enough balance to fulfill the oversold orders.

  Proper Fix

  Change from value-based to token-based distribution (industry standard):

  // Distribute X% of available tokens (not X% of USDC value)
  shares: availableTokens * 0.30  // 30% of 100 tokens = 30 shares

  This ensures:
  - 100 USDC → 100 tokens → 100 shares distributed (1:1 ratio)
  - No ERC1155InsufficientBalance errors
  - Ready for user-provided liquidity (no hidden 2x requirement)

  Industry Standard Reference

  - Polymarket: Uses AMM (CPMM-1) with 1:1 capital efficiency
  - Kalshi: Uses CLOB with token-based order distribution
  - Both achieve full liquidity depth with 1:1 deposit:token ratio

  Files to Modify

  1. api/src/services/OrderSeedService.ts (lines 54-68)

  2. api/src/services/BatchProcessor.ts (lines 338-340)
    
  

---

## Comments

### @linked0 — 2026-01-29T02:42:37Z

## Fix Implemented ✅

Changed from **value-based** to **token-based** distribution in `OrderSeedService.ts`.

### Before (Value-Based) - Caused ERC1155InsufficientBalance
```typescript
// Distributed by USDC value, creating MORE shares than available tokens
shares: liquidityUSDC * 0.30 / (price + 0.01)
// At 51¢: $100 * 0.30 / 0.51 = 58.82 shares
// Total SELL orders: ~190 shares (but only 100 tokens exist!)
```

### After (Token-Based) - Fixed
```typescript
// Distribute available tokens proportionally (1:1 ratio from splitPosition)
const availableTokens = liquidityUSDC;
shares: availableTokens * 0.30  // 30% of 100 tokens = 30 shares
// Total SELL orders: 100 shares (30 + 25 + 20 + 15 + 10 = 100%)
```

### Files Modified
1. `api/src/services/OrderSeedService.ts` (lines 51-76) - Token-based share calculation
2. `api/src/services/BatchProcessor.ts` (lines 331-338) - Updated comments

### Result
- $100 liquidity → 100 tokens minted → 100 shares distributed
- No more ERC1155InsufficientBalance errors
- No need to run `yarn provision:all` after market creation

---

### @Abdulkarim4u — 2026-01-29T02:55:24Z

Thank you. yeah thats a great fix . no need to keep redoing yarn provision:all 

---

