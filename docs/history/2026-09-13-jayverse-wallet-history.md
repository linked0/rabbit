# 2026-09-13

### Sepolia wallet: add a safe public signing surface

Added a browser-wallet-only Sepolia page with switch, balance, preview, send, and explorer flows. Restricted the production simulator to approved RPC targets so the public endpoint cannot proxy arbitrary internal requests.

### Cloud Run: publish wallet.jaylabs.xyz

Added a minimal standalone Next.js container build and deployed it as the independent `jayverse-wallet` service in Rabbit cloud. Mapped `wallet.jaylabs.xyz` while preserving the local Anvil wallet and extension workflows.
