# 2026-09-14 — jayverse-wallet

Source: [`docs/features/jayverse-wallet.md`](../features/jayverse-wallet.md) (Phase 2 cell in the
[features README phase overview](../features/README.md#phase-overview-at-a-glance)). Repo:
`linked0/jayverse-wallet`, in-repo notes `docs/history/2026-09-13.md`, `2026-09-14.md`.

### Bridge route inside the Wallet product (Codex)

- **Cause:** jay asked Codex to make the Sepolia wallet public and decide where the Bridge UI lives.
- **Reasoning:** the user previews and signs in the Wallet, so `/bridge` belongs there; its
  contracts stay with JYVE in `jayverse-token` because they form one economic unit with the token.
- **Change:** `/bridge` page (five entities: user wallet, BridgeLock, relayer, BridgeMint,
  reconciliation), TopNav split into product tabs (Wallet, Bridge, Exchange ↗) and DEV tabs.
- **Result:** route is live but visibly inactive until BridgeLock/BridgeMint/relayer/reconciliation exist.

### Finish the stopped deploy: verify, commit, merge to main (Claude)

- **Cause:** jay stopped Codex mid-deploy and handed the wallet task to Claude.
- **Reasoning:** checked Cloud Run before redeploying — revision `jayverse-wallet-00003` (09:45 KST)
  post-dates the last file change (09:33 KST), root redirects to `/sepolia`, `/bridge` serves the new
  page, `/api/simulate` rejects a non-allowlisted `rpcUrl`. Nothing left to deploy.
- **Change:** committed the uncommitted Sepolia + Bridge + Dockerfile work (`d26e9fe`) on
  `Codex/sepolia-wallet-online`, merged into `main` (`041d1d3`), pushed. Generated `next-env.d.ts`
  left out of the commit.
- **Result:** `main` == live site. wallet.jaylabs.xyz serves revision 00003 in Rabbit cloud
  (`doubletree-498007`, asia-northeast1).
