# Add E2E integration tests to prevent broken code from reaching production

**Issue #66** | **State:** OPEN | **Created:** 2026-01-20T00:31:53Z

**Assignees:** linked0

**Updated:** 2026-01-20T00:41:19Z | **Closed:** N/A

---


## Background

[e2e-test-address-flow.md](https://github.com/user-attachments/files/24725291/e2e-test-address-flow.md)

Currently there are no integration tests that verify the full trading flow works end-to-end.
  This allows broken code to go undetected until manual testing or production.

## Problem

Without E2E tests, we cannot catch:
- Hardcoded network references that break other environments 
- Nonce management issues in blockchain transactions
- Contract address mismatches between SDK and deployed contracts 
- Database and blockchain state desync
- API endpoint regressions

## Solution

Add integration tests that run the full flow against a local Hardhat blockchain:
                     
1. Start Hardhat node 
2. Deploy contracts
3. Start API server with localhost config
4. Run tests: create market → trade → resolve → claim
                  
## Benefits

- Catch breaking changes before merge
- Verify blockchain + database + API work together
- Prevent regressions in critical trading flows
- Confidence when refactoring code

## Test Coverage                                                                            

- [ ] Basic trading flow (buy/sell outcome tokens)
- [ ] Market creation via API
- [ ] Market resolution and claiming 
- [ ] Liquidity and limit orders
 
## Related                                                                                  

- Design doc: `e2e-test-address-flow.md`

---

## Comments

### @linked0 — 2026-01-20T00:34:21Z

Need to fix following error when pushing the working branch.
I bypassed the error for now using `git push -f --no-verify`.

```
nostra-server git:(integration-test) git push -f
📦 Running build...
[api]: Process started
[api]: src/__tests__/integration/test-setup.ts(92,17): error TS2339: Property 'success' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(93,60): error TS2339: Property 'error' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(97,26): error TS2339: Property 'market' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(98,29): error TS2339: Property 'market' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(99,28): error TS2339: Property 'market' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(100,30): error TS2339: Property 'outcomes' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(101,29): error TS2339: Property 'outcomes' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(102,28): error TS2339: Property 'outcomes' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(103,27): error TS2339: Property 'outcomes' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(128,17): error TS2339: Property 'success' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(129,60): error TS2339: Property 'error' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(133,25): error TS2339: Property 'data' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(134,24): error TS2339: Property 'data' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(156,25): error TS2339: Property 'success' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(157,33): error TS2339: Property 'transactionHash' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(183,17): error TS2339: Property 'success' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(184,62): error TS2339: Property 'error' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(188,27): error TS2339: Property 'claimable' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(189,33): error TS2339: Property 'estimatedPayout' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(190,26): error TS2339: Property 'balances' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(213,25): error TS2339: Property 'success' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(214,29): error TS2339: Property 'totalShares' does not exist on type 'unknown'.
[api]: src/__tests__/integration/test-setup.ts(215,32): error TS2339: Property 'expectedPayout' does not exist on type 'unknown'.
[api]: Process exited (exit code 1), completed in 1s 150ms
```

---

