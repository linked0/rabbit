# Multisignature Requirements for batch order matching

**Issue #69** | **State:** CLOSED | **Created:** 2026-01-22T00:38:57Z

**Assignees:** linked0, Abdulkarim4u

**Updated:** 2026-01-23T00:34:03Z | **Closed:** 2026-01-23T00:34:03Z

---

 # Multi-Signature Requirement for Batch Order Matching

 ## Issue Type
 Documentation / Enhancement Discussion

 ## Summary
 When users buy shares across multiple price levels in the order book, MetaMask prompts them to sign multiple signatures (one per price level). This is the industry-standard approach for DEX order matching, but we should document
 why this happens and explore potential UX improvements.

 ## Current Behavior

 When a user places a market order that matches against multiple limit orders at different prices:

 **Example:**
 - User wants to buy 1000 shares
 - Order book has:
   - 300 shares at 33.8¢
   - 400 shares at 34.8¢
   - 300 shares at 35.8¢

 **Result:** User sees 3 MetaMask signature popups (one for each price level)

 ## Why Multiple Signatures Are Required

 ### Technical Explanation

 Each maker order in the order book has a **different price**, which means a different `makerAmount/takerAmount` ratio. Our implementation creates **separate taker orders** for each maker order because:

 1. **Exact Ratio Matching**: Each taker order needs an exact ratio that crosses with its specific maker order
    - Maker order at 33.8¢: ratio = 0.338 USDC per share
    - Maker order at 34.8¢: ratio = 0.348 USDC per share
    - These cannot share the same taker order signature

 2. **EIP-712 Signature Integrity**: Each taker order is a cryptographically signed message containing:
    ```typescript
    {
      salt: timestamp + index,           // Unique identifier
      makerAmount: exactUSDCAmount,      // Exact USDC to pay
      takerAmount: exactSharesReceived,  // Exact shares to receive
      // ... other order parameters
    }
    ```
    Changing the amounts would invalidate the signature.

 3. **Prevents Ratio Mismatches**: Reusing one taker order across multiple price levels causes the CTF Exchange contract to revert with ratio mismatch errors when fill amounts don't match the signed ratio.

 ### Industry Standard Approach

 This behavior matches how all major decentralized exchanges work:
 - **Uniswap v3**: Each limit order is a separate position with its own signature
 - **dYdX**: Multi-level orders require multiple signatures
 - **0x Protocol**: Each order is individually signed with EIP-712

 The alternative (single signature for multi-level fills) would require:
 - Custom smart contract logic for batch fills
 - Potential security risks from flexible fill amounts
 - Non-standard order matching mechanics

 ## Code Implementation

 The relevant code is in `/api/src/routes/trade.ts` (lines 565-634):

 ```typescript
 // Create individual taker orders for each maker order
 for (let i = 0; i < makerOrders.length; i++) {
   const makerOrder = makerOrders[i];
   const fillAmount = fillAmounts[i];

   const takerOrder = {
     salt: (Date.now() + i).toString(),  // Unique salt per order
     maker: user.walletAddress,
     signer: user.walletAddress,
     taker: makerOrder.maker,
     tokenId: outcome.tokenId,
     makerAmount: (fillAmount * price).toString(),  // Exact USDC amount
     takerAmount: fillAmount.toString(),            // Exact share amount
     // ... other parameters
   };

   // Each order gets its own EIP-712 signature
   const signature = await user.signTypedData(domain, types, takerOrder);

   takerOrders.push({ ...takerOrder, signature });
 }
 ```

 ## User Experience Impact

 ### Current UX
 - **Pro**: Transparent, secure, follows DEX standards
 - **Con**: Multiple popups can feel tedious for large orders

 ### User Feedback Needed
 - Does this feel acceptable for the trading flow?
 - Should we add warnings/education before multi-level orders?
 - Is there demand for a "batch signing" feature?

 ## Potential Future Improvements

 ### Option 1: EIP-2612 Batch Signing
 Implement batch signature support if MetaMask adds native batch signing:
 ```typescript
 // Hypothetical future API
 const signatures = await provider.request({
   method: 'eth_signTypedDataBatch',
   params: [ordersArray]
 });
 ```

 ### Option 2: Meta-Transactions
 Use a meta-transaction relayer to consolidate signatures:
 - User signs once to approve a batch
 - Relayer handles individual order signatures
 - **Tradeoff**: Introduces relayer dependency and gas costs

 ### Option 3: Smart Contract Batching
 Create a custom batch fill contract:
 - User signs one "intent to trade" message
 - Contract handles multi-level matching internally
 - **Tradeoff**: Requires new contract deployment and auditing

 ### Option 4: UX Improvements (No Protocol Changes)
 - Show progress indicator: "Signing order 1 of 3..."
 - Add "what's happening" tooltip during signing
 - Batch small orders into single price level when possible
 - Add settings to limit max signatures per trade

 ## Questions for Discussion

 1. Should we implement Option 4 (UX improvements) immediately?
 2. Is the current multi-signature flow acceptable for MVP/beta?
 3. Should we add a user setting: "Warn me before trades requiring >1 signature"?
 4. Are there security concerns with any of the improvement options?

 ## Related Files
 - `/api/src/routes/trade.ts` - Trade execution and order matching
 - `/web/src/components/OrderCard.tsx` - Frontend order placement UI
 - `/api/src/services/OrderMatchingService.ts` - Order book matching logic

 ## Labels
 - `documentation`
 - `enhancement`
 - `user-experience`
 - `discussion`

 ---

 **Note**: This is working as designed and follows industry standards. This issue is for documentation and discussion of potential UX improvements, not a bug report.

---

## Comments

### @Abdulkarim4u — 2026-01-23T00:33:53Z

Oh I Just realized it already exisits in the base code 

---

### @Abdulkarim4u — 2026-01-23T00:34:03Z

closing this issue 

---

