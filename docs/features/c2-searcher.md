# C2 Searcher — what the bundle-submit sample does

A walkthrough of the **C2 searcher** sample on `/xyz` (the "번들 제출" form above the C4 observer).
It takes a transaction, wraps it in a **bundle**, and submits it to the **Flashbots Sepolia relay** —
the same path a real MEV searcher uses, minus the profit logic. This is the "actually *use* a relay"
step of the PBS-consumer track. Design source: **New First / C2** in
[../tasks/jul-01-rabbit-design.md](../tasks/jul-01-rabbit-design.md).

## The three pieces
| Layer | File | Role |
|-------|------|------|
| UI (client) | `app/xyz/BundleSubmit.tsx` | Form (`to` / `value` / `maxFee` / `priority`) → POST `/api/bundle`. Holds **no secrets**. |
| API (server) | `app/api/bundle/route.ts` | Login-gated (Node runtime). Reads `SEPOLIA_RPC` + `ADMIN_KEY` from env, calls `submitBundle`. |
| Core (server) | `lib/flashbots.ts` | Signs the tx, simulates, submits to the relay over JSON-RPC. |

## What a "bundle" is
A **bundle** is an *ordered* list of transactions that a builder must include **atomically** —
all of them, in that exact order, in the same block, or none at all. That atomicity is what makes
searcher strategies (arbitrage, backrun, "approve → swap") safe. Our sample sends the simplest
possible bundle: **one** EIP-1559 transfer (`21000` gas).

## End-to-end flow
1. **You submit the form.** `BundleSubmit.tsx` POSTs `{ to, valueEth, maxFeeGwei, maxPriorityGwei }`
   to `/api/bundle`. If you're not logged in, middleware redirects to `/login` and the form shows a
   "login required" message.
2. **The server builds and signs the tx** (`submitBundle` in `lib/flashbots.ts`):
   - `provider = JsonRpcProvider(SEPOLIA_RPC, 11155111)` (chainId = Sepolia).
   - `wallet = new Wallet(ADMIN_KEY, provider)` — the funded testnet account that pays gas.
   - `authWallet = Wallet.createRandom()` — an **ephemeral "reputation" key**. It signs the relay
     request (not the tx) and needs no funds; Flashbots uses it to track a searcher's reputation.
   - Reads `nonce` (pending) and the current block; `targetBlock = current + 1`.
   - Signs an EIP-1559 tx (`to`, `value`, `nonce`, `21000` gas, `maxFeePerGas`, `maxPriorityFeePerGas`)
     → a raw signed tx (`rawTx`).
3. **Simulate first — `eth_callBundle`.** The relay dry-runs the bundle against a recent state and
   returns gas used, value, and any revert. If the sim reports an error (e.g. insufficient funds,
   revert), the sample **stops here and does not submit** — you get the error back.
4. **Submit — `eth_sendBundle`.** The signed bundle is sent targeting `targetBlock`. The relay
   returns a `bundleHash` (a receipt/identifier for the submission).
5. **The UI shows the result:** `bundleHash`, target block, nonce, sender/recipient, and the raw
   simulation JSON.

## The Flashbots auth header
Every relay call carries `X-Flashbots-Signature: <address>:<signature>`, where the signature is
`authWallet.signMessage(ethers.id(body))` — i.e. sign the keccak256 of the JSON body with the
ephemeral reputation key. This authenticates *who* submitted the bundle without spending anything.

## Why direct JSON-RPC (no Flashbots SDK)
`@flashbots/ethers-provider-bundle` is pinned to **ethers v5** and conflicts with the app's ethers
v6. So the sample talks to the relay's JSON-RPC (`eth_callBundle` / `eth_sendBundle`) directly with
ethers v6 + the auth header above — fewer deps, no version conflict, identical behavior.

## Security model
- **`ADMIN_KEY` (a private key) never reaches the browser.** All signing happens server-side in
  `lib/flashbots.ts`; the client only posts form fields.
- The route is **login-gated**, and since `ALLOWED_EMAILS` is just `linked0@gmail.com`, it's
  effectively jay-only.
- **Testnet only.** Use a throwaway key funded with a little Sepolia ETH — never a key with real funds.

## How to run
1. In `.env.local`:
   ```
   SEPOLIA_RPC=https://…your-sepolia-rpc…
   ADMIN_KEY=0x…throwaway-testnet-key…
   ```
2. Fund `ADMIN_KEY` with a bit of Sepolia ETH (a faucet is enough — it only pays gas).
3. Log in, open `/xyz`, fill `to` (e.g. your own address), submit.

## Caveat — inclusion isn't guaranteed on Sepolia
Submitting to the relay ≠ landing on-chain. The bundle is only included when a **Flashbots-connected
builder wins that slot**, and on Sepolia that participation is sparse — so it may not land every
block. Resubmit for later blocks as needed. Simulation passing just means the tx is *valid*, not that
it *will* be included.
