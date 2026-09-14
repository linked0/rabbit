# 2026-09-12

### Pin DeFi Cloud Run deployments to Verex

Added a single cloud deploy command that explicitly targets `verex-499205` so the active
`gcloud` project cannot accidentally place `jayverse-defi` in Rabbit cloud.

### Move the live DeFi service out of Rabbit cloud

Deployed and verified `jayverse-defi` in the Verex project, then began moving
`defi.jaylabs.xyz`. Removed the detached Rabbit-project Cloud Run service after the Verex
service passed direct URL and static-asset health checks. The replacement domain mapping and
certificate became ready, and public Google/Cloudflare DNS edge probes returned HTTP 200.

### Deploy the protocol contracts to Sepolia

Reused the Verex staging operator credential without copying or printing it, deployed the pool,
jeETH, jweETH, and MockAVS on chain `11155111`, and verified bytecode, ownership, token wiring,
and constructor links on-chain.

### Switch the hosted study UI from Anvil to Sepolia

Separated local and Sepolia address books, bounded event reads at the deployment block, and wired
the production build to a public Sepolia RPC plus the visitor's injected wallet. Local Anvil keys
and operator study controls are now development-only. Deployed Cloud Run revision
`jayverse-defi-00002-kpw` and verified the new bundle and Sepolia reads through the custom domain.

### Correct the DeFi host to Firebase Hosting

Replaced the standalone Cloud Run deployment flow with a static Firebase Hosting deployment in
the existing Verex project. Kept Sepolia and browser-wallet behavior unchanged; the obsolete
Cloud Run service is removed only after the Firebase site and custom domain pass live checks.

### Complete the Firebase Hosting cutover

Published the static app to the `jayverse-defi` Hosting site in `verex-499205`, moved
`defi.jaylabs.xyz` to it, and verified HTTPS plus the Sepolia production bundle. Deleted the
obsolete Cloud Run domain mapping and `jayverse-defi` service after the Firebase URL passed.
