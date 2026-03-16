# Implement Batch Market Creation in CTFExchange Contract

**Issue #96** | **State:** OPEN | **Created:** 2026-01-27T07:31:51Z

**Updated:** 2026-01-27T07:31:51Z | **Closed:** N/A

---

## Problem Description
When creating multiple markets in rapid succession (e.g., creating a group of markets via the API), we encounter the `REPLACEMENT_UNDERPRICED` (replacement fee too low) error. 

This occurs because we are sending multiple distinct transactions (one for each market) from the same account (Server Wallet) almost simultaneously. If the network hasn't mined the first transaction yet, the subsequent transactions with higher nonces or same nonces can conflict or be treated as replacements without sufficient gas price bumps.

While we implemented a client-side fix using sequential nonce management (tracking `currentNonce` locally), this is a fragile solution that relies on perfect synchronization with the blockchain state.

## Error Log
```
Failed: replacement fee too low (transaction="0xf90...", info={ "error": { "code": -32000, "message": "replacement transaction underpriced" } }, code=REPLACEMENT_UNDERPRICED)
```

## Proposed Solution: Batch Processing in Smart Contract
Instead of forcing the backend to manage nonces for N separate transactions, the `CTFExchange` smart contract should support a **Batch Market Creation** function.

### Recommendation
Add a function `createBinaryMarketBatch` to the `CTFExchange` contract.

```solidity
function createBinaryMarketBatch(
    bytes32[] calldata conditionIds, 
    string[] calldata titles, 
    uint256[] calldata endTimes
    // ... other necessary parameters
) external {
    require(conditionIds.length == titles.length, "Mismatched arrays");
    
    for (uint i = 0; i < conditionIds.length; i++) {
        _createBinaryMarket(conditionIds[i], titles[i], endTimes[i]);
    }
}
```

### Benefits
1.  **Atomicity:** All markets in a group are created in a single transaction.
2.  **Gas Efficiency:** Reduces base transaction overhead.
3.  **Reliability:** Eliminates `REPLACEMENT_UNDERPRICED` errors entirely for group creation.
4.  **Simpler Backend:** The API no longer needs complex manual nonce tracking re-sync logic.

