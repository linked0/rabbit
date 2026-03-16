# BUY LIMIT (Bug): Volume and Price Line Don't Update After Buy Limit Order Execution

**Issue #102** | **State:** OPEN | **Created:** 2026-01-30T07:20:00Z

**Labels:** bug

**Assignees:** linked0, Abdulkarim4u

**Updated:** 2026-01-30T07:20:00Z | **Closed:** N/A

---

## 🐛 Bug Description
  When placing a **limit buy order** that gets filled, the market volume does not update and the price line on the chart does not move to reflect the new trade. This creates a disconnect between actual trading activity and what users see on the chart.

  ## 📊 Severity
  **HIGH** - Affects core trading functionality and user trust in platform data accuracy

  ## 🔍 Steps to Reproduce

  1. Open a binary proposition market (e.g., "Will Bitcoin reach $100k by 2026?")
  2. Navigate to market detail page
  3. Note current volume and price line position
  4. Place a **limit buy order**:
     - Order Type: **Limit**
     - Trade Type: **Buy**
     - Side: **YES** or **NO**
     - Price: Set limit price (e.g., 51¢)
     - Shares: Enter amount (e.g., 100 shares)
  5. Click "Trade" button
  6. Wait for order to fill (either immediately if price matches, or when matched later)
  7. Observe the chart and volume display

  ## ✅ Expected Behavior

  After limit order fills:
  1. **Volume updates** - Market total volume increases by trade amount
  2. **Price line moves** - Chart shows new price based on filled trade
  3. **"Last" price updates** - Order book shows updated last trade price
  4. **Chart updates** - New data point appears on price history chart
  5. **WebSocket broadcast** - Real-time update sent to all connected clients

  **Example:**
  - Before: Volume = $500, Last price = 50¢
  - Limit buy: 100 shares at 51¢ = $51
  - After: Volume = $551, Last price = 51¢ ✅

  ## ❌ Actual Behavior

  After limit order fills:
  1. **Volume stays the same** - No increase in total volume displayed
  2. **Price line doesn't move** - Chart remains at old position
  3. **"Last" price may not update** - Shows stale price
  4. **Chart doesn't refresh** - No new data point visible
  5. **Appears like trade didn't happen** - User confusion

  **Example:**
  - Before: Volume = $500, Last price = 50¢
  - Limit buy: 100 shares at 51¢ = $51
  - After: Volume = $500 ❌, Last price = 50¢ ❌ (no change!)

  ## 🔧 Technical Investigation

  ### Possible Root Causes

  #### 1. **Backend: Volume Not Updated After Limit Order Fill**

  **Files to Check:**
  - `/api/src/routes/trade.ts` - Trade execution endpoint
  - `/api/src/services/TradeExecutionService.ts` - Limit order matching logic
  - `/api/src/services/MarketOrderService.ts` - Volume calculation

  **Hypothesis:**
  Limit order execution may not be updating `market.totalVolume` or `outcome.totalVolume` in the database.

  **What to verify:**
  ```typescript
  // After limit order fills, check if this happens:
  await prisma.market.update({
    where: { id: marketId },
    data: {
      totalVolume: { increment: tradeAmount } // ← Is this being called?
    }
  });

  await prisma.outcome.update({
    where: { id: outcomeId },
    data: {
      totalVolume: { increment: tradeAmount }, // ← Is this being called?
      currentPrice: newPrice // ← Is price being updated?
    }
  });

  2. Backend: WebSocket Not Broadcasting Volume Updates

  Files to Check:
  - /api/src/services/WebSocketService.ts - WebSocket broadcast logic
  - /api/src/routes/trade.ts - Post-trade WebSocket calls

  Hypothesis:
  WebSocket may be broadcasting price updates but not volume updates for limit orders.

  What to verify:
  // After limit order fills, check if this happens:
  webSocketService.broadcast(marketId, {
    type: 'TRADE_EXECUTED',
    outcomeId,
    price: newPrice,
    volume: newVolume, // ← Is volume being sent?
    marketVolume: totalMarketVolume // ← Is market volume being sent?
  });

  3. Frontend: Chart Not Refreshing After Limit Order

  Files to Check:
  - /web/src/app/market/[id]/page.tsx - Market detail page
  - /web/src/components/charts/PriceChart.tsx - Chart component
  - /web/src/hooks/useWebSocket.ts - WebSocket hooks

  Hypothesis:
  Frontend may only be listening for market order updates, not limit order fills.

  What to verify:
  // Does the frontend refresh data after limit order?
  useTradeUpdates((data) => {
    console.log('Trade update:', data);
    // Is this triggered for limit orders? ✓ or ✗

    // Does it refetch market data?
    fetchMarketData(); // ← Is this being called?

    // Does it update volume state?
    setMarketVolume(data.marketVolume); // ← Is this happening?
  });

  4. Database: Volume Column Not Persisting

  Files to Check:
  - /api/prisma/schema.prisma - Database schema

  Hypothesis:
  Market or Outcome model may not have totalVolume field, or it's not being persisted correctly.

  What to verify:
  model Market {
    id          String @id
    totalVolume Decimal @default(0) // ← Does this exist?
    // ...
  }

  model Outcome {
    id          String @id
    totalVolume Decimal @default(0) // ← Does this exist?
    currentPrice Decimal @default(0.5)
    // ...
  }

  ---
  🧪 Debug Steps

  1. Check Database After Limit Order

  # After placing limit order, run this query:
  SELECT id, title, "totalVolume", "currentPrice"
  FROM "Market"
  WHERE id = 'YOUR_MARKET_ID';

  SELECT id, title, "totalVolume", "currentPrice"
  FROM "Outcome"
  WHERE id = 'YOUR_OUTCOME_ID';

  # Volume should have increased!

  2. Check Server Logs

  # Look for trade execution logs
  grep "Trade executed" api/logs/combined.log

  # Look for volume updates
  grep "Volume updated" api/logs/combined.log

  # Look for WebSocket broadcasts
  grep "TRADE_EXECUTED" api/logs/combined.log

  3. Check Browser Console

  // In browser console, after limit order:
  console.log('WebSocket messages:', websocketMessages);
  // Should see: { type: 'TRADE_EXECUTED', volume: ..., price: ... }

  console.log('Market volume:', marketData.totalVolume);
  // Should show updated volume

  ---
  💡 Comparison: Market Orders vs Limit Orders

  Market Orders (WORKING ✅)

  1. Execute immediately
  2. Volume updates instantly
  3. Price line moves
  4. Chart refreshes
  5. WebSocket broadcasts update

  Limit Orders (BROKEN ❌)

  1. Execute when matched
  2. Volume doesn't update
  3. Price line doesn't move
  4. Chart doesn't refresh
  5. WebSocket broadcast may be missing volume data

  ---
  🔗 Related Code Locations

  Backend

  /api/src/routes/trade.ts
    - Lines ~1041-1100: Trade execution logic
    - Lines ~534-552: Complementary pricing updates

  /api/src/services/TradeExecutionService.ts
    - executeTrade() method
    - Volume calculation logic

  /api/src/services/MarketOrderService.ts
    - executeMarketOrder() method
    - Order matching logic

  /api/src/services/WebSocketService.ts
    - broadcast() method
    - Trade update broadcasts

  Frontend

  /web/src/app/market/[id]/page.tsx
    - Lines ~359-370: Trade updates handler
    - Lines ~394-405: Order book updates handler
    - Lines ~529: Volume display

  /web/src/components/charts/PriceChart.tsx
    - Chart data refresh logic
    - Volume axis updates

  /web/src/hooks/useWebSocket.ts
    - useTradeUpdates hook
    - WebSocket message handling

  ---
  🎯 Proposed Solution

  Option 1: Ensure Volume Update in Trade Execution (Recommended)

  Backend Fix:
  // In /api/src/routes/trade.ts or TradeExecutionService.ts
  async function executeTrade(params) {
    // ... existing trade logic ...

    // ✅ ENSURE volume is updated for ALL trade types (market AND limit)
    const tradeAmount = shares * price;

    // Update outcome volume
    await prisma.outcome.update({
      where: { id: outcomeId },
      data: {
        totalVolume: { increment: tradeAmount },
        currentPrice: newPrice
      }
    });

    // Update market volume (aggregate of all outcomes)
    await prisma.market.update({
      where: { id: marketId },
      data: {
        totalVolume: { increment: tradeAmount }
      }
    });

    // ✅ ENSURE WebSocket broadcasts volume
    webSocketService.broadcast(marketId, {
      type: 'TRADE_EXECUTED',
      outcomeId,
      price: newPrice,
      volume: newOutcomeVolume, // Include updated volume
      marketVolume: newMarketVolume, // Include market volume
      timestamp: new Date()
    });
  }

  Option 2: Add Frontend Polling Fallback

  Frontend Fix:
  // In /web/src/app/market/[id]/page.tsx
  useEffect(() => {
    // After any trade (market or limit), refetch market data
    const refetchAfterTrade = async () => {
      if (tradeExecuted) {
        await fetchMarketData(); // Refresh volume and prices
        await fetchPriceHistory(); // Refresh chart
        setTradeExecuted(false);
      }
    };

    refetchAfterTrade();
  }, [tradeExecuted]);

  Option 3: Add Trade Confirmation Callback

  Full Stack Fix:
  // Backend: Return updated volume in trade response
  const response = await executeTrade(params);
  return {
    success: true,
    trade: response.trade,
    updatedVolume: response.marketVolume, // ← Add this
    updatedPrice: response.price // ← Add this
  };

  // Frontend: Update local state immediately
  const handleTrade = async () => {
    const result = await fetch('/api/trade/execute', { ... });
    const data = await result.json();

    // Update local state immediately (optimistic update)
    setMarketVolume(data.updatedVolume);
    setCurrentPrice(data.updatedPrice);
  };

  ---
  📸 Screenshots

  Before Limit Order:
  - Volume: $500
  - Last: 50¢
  - Chart line at 50¢

  After Limit Order (BUG):
  - Volume: $500 ❌ (should be $551)
  - Last: 50¢ ❌ (should be 51¢)
  - Chart line at 50¢ ❌ (should move to 51¢)

  ---
  🏷️ Labels

  - bug
  - critical
  - trading
  - charts
  - volume
  - limit-orders

  📌 Priority

  HIGH - Affects user experience and trust in platform data

  ✅ Acceptance Criteria

  - Limit buy orders update market volume immediately after fill
  - Limit sell orders update market volume immediately after fill
  - Price line on chart moves to reflect limit order fills
  - "Last" price in order book updates after limit order fills
  - Chart shows new data point after limit order executes
  - WebSocket broadcasts include volume updates for limit orders
  - Manual browser refresh is NOT required to see updates
  - Works for both YES and NO outcomes
  - Works for both binary and head-to-head markets

