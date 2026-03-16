# Improper Wallet Disconnection and Missing Network Enforcement

**Issue #63** | **State:** OPEN | **Created:** 2026-01-18T10:02:40Z

**Assignees:** Abdulkarim4u

**Updated:** 2026-01-22T00:41:28Z | **Closed:** N/A

---

### Description
The current wallet connection implementation ([useWallet](cci:1://file:///Users/jaylee/work/nostra-server/web/src/hooks/useWallet.ts:26:0-186:1) hook) does not support a true "reconnection" flow or network enforcement. Currently, if a user is connected to an unintended network (e.g., BSC Mainnet) and attempts to fix it by disconnecting and reconnecting, the application fails to resolve the state correctly.

### Current Behavior
1. **Shallow Disconnect**: The [disconnect](cci:1://file:///Users/jaylee/work/nostra-server/web/src/hooks/useWallet.ts:149:2-157:4) function only resets the local React state (`isConnected: false`, `address: null`). It does not terminate the session with the EIP-1193 provider (MetaMask). 
2. **Automatic Re-login**: Clicking "Connect" again immediately pulls the previous (wrong) configuration because the provider's internal session is still active.
3. **No Network Validation**: The application does not check if the current `chainId` matches the required network (BSC Testnet / ID: 97) and doesn't prompt the user to switch chains.

### Steps to Reproduce
1. Connect MetaMask to **BSC Mainnet**.
2. Click "Connect Wallet" on the Nostra app.
3. App shows "BSC" instead of "BSC Testnet" in the wallet dropdown.
4. Click "Disconnect".
5. Click "Connect Wallet" again.
6. The app instantly connects back to **BSC Mainnet** without prompting for a change.

### Expected Behavior
- **Network Enforcement**: Upon connecting, the app should verify if the `chainId` is `97` (BSC Testnet). 
- **Switch Chain Prompt**: If the `chainId` is incorrect, the app should trigger a request to the provider to switch to the correct network.
- **Deep Connection Reset**: The UI should indicate that the user is on an "Unsupported Network" and provide a "Switch to BSC Testnet" button.

### Technical Context
- **Root Cause**: In [web/src/hooks/useWallet.ts](cci:7://file:///Users/jaylee/work/nostra-server/web/src/hooks/useWallet.ts:0:0-0:0), the [disconnect](cci:1://file:///Users/jaylee/work/nostra-server/web/src/hooks/useWallet.ts:149:2-157:4) function purely manages local state. 
- **Required Fix**: Implement logic in [useWallet](cci:1://file:///Users/jaylee/work/nostra-server/web/src/hooks/useWallet.ts:26:0-186:1) or a wrapper component to detect a mismatch between `chainId` and the expected environment configuration, then use `window.ethereum.request({ method: 'wallet_switchEthereumChain', ... })` to resolve it.

---

## Comments

### @Abdulkarim4u — 2026-01-22T00:41:28Z

Oh Great i will take a look and start working on it

---

