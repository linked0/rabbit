# Jayverse — Wallet & simulate-before-sign

*One embedded-wallet + transaction-preview widget every Jayverse app drops in, so a user
connects once and always sees the decoded effect of a transaction — token deltas, approvals,
warnings — **before** they sign it.*

*Source: umbrella plan [`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md) §6 "Wallet &
Simulation-before-sign as a service" and jay's comment there ("Show me the user scenario and what
web app shows and the flow… describe what you will do in a new md file"). Design draft for review —
not built. Sibling docs indexed in [README.md](README.md).*

---

## Phases (build order)

| Phase | Focus | What we implement |
|---|---|---|
| **1 (MVP)** | simulate-before-sign | `simulate()` API (fork-backed node + `stateOverride`, viem `simulateContract`); `<JayverseSign>` connect→preview→sign component; decode effects / approvals / warnings; shared wallet client + address book. |
| **2** | Session keys & templates | scoped ERC-7715/7710 session-key templates so agent and one-click flows are popup-free. |
| **3** | 4337 & breadth | simulate full UserOperations through the EntryPoint (incl. paymaster); richer decoders; more warning classifiers. |
| **4** | Our own dev wallet | a dev-only wallet + MV3 extension that drives 7702/7710/7715 on a Sepolia fork at a **distinct chainId 31337** — replaces MetaMask *for testing only*. Detail in [Next phase](#next-phase--our-own-dev-wallet-for-testing-jay-2026-09-10) below. |

> **Status (jay asked, 2026-09-10): two of four phases done.**
> - **Phase 1 ✅ done** — `simulate()` API, `<JayverseSign>` connect→preview→sign, effect/approval/
>   warning decoding, shared wallet client + address book; all click-verified. The embedded
>   (email/passkey) connect path was deliberately deferred — connect today = injected / dev /
>   local accounts.
> - **Phase 2 ❌ not built** — only the 7702 sign/verify primitive exists; the scoped 7710/7715
>   session-key **grant** and the **type-4 submit** are the "Deferred" items below. This phase is
>   what makes agent flows popup-free.
> - **Phase 3 ❌ not started** — no UserOperation simulation through the EntryPoint, no paymaster
>   leg, no ERC-721/1155 decoders, no price feeds.
> - **Phase 4 🟨 built beyond spec, unverified at the edges** — slices 1–5 plus the four-page UI,
>   account-in-use selection, network lists (web + extension v0.2.0, `chainChanged` broadcast),
>   extension icons. Still open: **confirm anvil's EIP-7702 on our fork** and **run the 7710/7715
>   grant → type-4 submit end-to-end**.
> - Next, in order of leverage: the two Phase-4 verifications → Phase 2's grant flow (what the
>   agent console's mandate work needs from this wallet) → Phase 3's UserOp simulation (plugs into
>   the AA markets build). Day detail:
>   [2026-09-10 history](../history/2026-09-10-jayverse-wallet-history.md).

---

## 1. What we build (the basic feature)

A drop-in React component — `<JayverseSign>` — with three states: **connect → preview → sign**.
It is the *only* signing surface in Jayverse; no app calls `walletClient.writeContract` directly.

- **Connect** — embedded wallet (email / passkey login, no seed phrase) or an existing browser
  wallet. One account across every Jayverse app.
- **Preview** — before the wallet prompt appears, the component calls a `simulate()` API that runs
  the exact transaction against a chain fork and returns its **decoded effects**: which tokens the
  account gains/loses, which approvals it sets, and any **warnings**. This is the whole point:
  the user reads plain-language consequences, not raw calldata.
- **Sign** — only after the user sees the preview do we hand the transaction to the wallet to sign
  and submit.

Scope is deliberately small and buildable: `simulate()` + one component + the shared wallet
provider. No new chain, no new token, settles on the shared rails (jUSD on Base).

---

## 2. User scenario

**Mina** wants to bet on a Verex market from the Jayverse portal. She logged into the portal weeks
ago with her email, so her embedded wallet is already connected — no popup, no seed phrase.

She types "10 jUSD on YES" and clicks **Place bet**. Instead of a raw wallet prompt full of hex,
a preview slides up:

> **You will spend** 10.00 jUSD
> **You will receive** ~12 YES shares
> **Approval** jUSD spending set to *Verex Exchange* (exact amount, 10 jUSD)
> *No warnings.*

She recognizes exactly what happens, clicks **Sign**, and the bet is placed. The signature was the
last step, not the first — she decided *with* the facts.

**Off-happy-path.** The next day a market UI she doesn't fully trust asks her to sign. The preview
shows a red banner:

> ⚠ **Approval widening** — this sets *unlimited* jUSD spending for an unknown contract.
> ⚠ **Value drain** — simulated net balance change: **−48 jUSD**, receive nothing.

She clicks **Cancel**. The widget refused nothing on her behalf — it *showed* her, and she stopped.
That is the product: the simulation turns "sign this opaque thing" into "here is what it does".

---

## 3. What the web app shows

**Connect flow.** A single **Connect** button. First-time users pick email or passkey; the embedded
provider creates a smart account behind the scenes. Returning users are already connected (session
restored). A small account chip shows address + jUSD balance. No network-switching friction — the
app targets the home chain.

**Pre-sign preview modal** (the core screen). Rendered from `simulate()` output:

- **Effects list** — one row per asset change: `−10.00 jUSD`, `+12 YES shares`, each with token
  logo, human amount, and USD value where known.
- **Approvals** — spender name (resolved from the address book), amount, and whether it is exact
  or unlimited.
- **Warnings** — a color-coded taxonomy, worst-first:
  | Warning | Meaning | Signal |
  |---|---|---|
  | **Revert** | the tx would fail on-chain (decoded custom error, e.g. `InsufficientAllowance()`) | block — disable Sign, show the decoded reason |
  | **Approval widening** | sets an unlimited/large allowance, or a new spender | red banner, require a second confirm |
  | **Value drain** | net balance change is strongly negative vs. what the user expects to receive | red banner |
- **Gas / fee** line, and where relevant a "sponsored" tag (paymaster).
- **Sign** button — primary; disabled on a `revert` warning. **Cancel** always available.

If `simulate()` itself fails (RPC down, fork unavailable), the modal says so and offers "sign
anyway" only as an explicit, clearly-labeled fallback — never a silent skip.

---

## 4. The flow

```
 app builds tx (to, data, value)
        │
        ▼
 simulate(tx, account)  ──► fork/state-override RPC
        │                    · viem simulateContract
        │                    · eth_call w/ stateOverride (balances, allowances)
        │                    · trace token transfers + approvals
        ▼
 decode effects & errors
   · ERC-20/721/1155 Transfer & Approval logs → deltas
   · revert data → custom-error ABI decode
   · classify warnings (revert / approval-widening / value-drain)
        │
        ▼
 render <JayverseSign> preview  ──► user reads effects + warnings
        │
        ▼ (user clicks Sign)
 walletClient.sendTransaction / sendUserOperation → chain
```

- **Build** — the calling app produces a plain transaction request (or a 4337 UserOperation) and
  hands it to the widget; it never signs on its own.
- **Simulate** — `simulate()` runs the tx server-side against a **fork-backed** node with
  **state overrides** (viem `simulateContract` + `eth_call` `stateOverride`), so we can preview even
  when a needed approval isn't set yet (override the allowance, then simulate the real call).
- **Decode** — parse emitted `Transfer`/`Approval` events into per-asset deltas for the account;
  decode any revert into its custom error via the target ABI; run the warning classifiers.
- **Render → sign** — the widget shows the preview; only on the user's click does it submit.

---

## 5. Cooperate with existing services (it is the shared dependency)

Everything else in the plan depends on *this* (§6: "everything else depends on it, so build early").
Every signing path routes through `<JayverseSign>`:

- **Verex bets** (§2) — placing/redeeming a bet previews `−jUSD / +shares / approval to exchange`.
  Pairs with Verex's own AA (4337 smart accounts, paymaster) — the wallet provides the account and
  the preview, Verex provides the market.
- **Personas** (§4) — mint/rent previews `−jUSD / +NFT` and the ERC-4907 user-role grant, so a
  renter sees exactly what a "rent for a day" transaction does.
- **DeFi** (§3) — its plan literally says "simulate deposits via the Wallet's simulate-before-sign";
  a deposit previews the vault-share received and the token spent before any custody risk.
- **Game** (§5) — the in-street trade panel previews an item trade (`simulate-before-sign` is one of
  its PoC links) so an in-game purchase is as legible as a web one.
- **Token bridge** (§7) — the lock/mint bridge is the *scariest* signature (funds leave a chain), so
  `<JayverseSign>` previews *lock N JYVE on source → receive N on dest* before signing.
  **The Wallet owns the bridge screen** at `/bridge` (jay, 2026-09-14; it was a placeholder before):
  source/dest picker, amount, the simulated effect, and the `Locked → Relaying → Minted` status.
  The `BridgeLock` / `BridgeMint` contracts, the relayer, and the supply invariant stay in
  `jayverse-token` — the wallet calls them, it does not run them, so no mint key lives here.
  simulate-before-sign is the connective tissue that makes verex-winnings → bridge → wallet one safe
  flow ([jayverse-token-bridge.md](jayverse-token-bridge.md)).
- **Agent / Agentic AA** (§1) — complements, not replaces, the agent's on-chain mandate: the agent's
  scoped session key (ERC-7715/7710) enforces *what it may do*; `simulate()` shows *what a given tx
  would do*, so a human (or the Authority Auditor, §8) can preview an agent action before granting or
  while reviewing it. Same decode pipeline feeds the agent action log.

Shared address book (spender-name resolution, token metadata) comes from the **`jayverse-rails`**
config package, so every app's preview labels contracts identically.

---

## 6. Implementation sketch

**Two artifacts, one repo (`jayverse-wallet`):**

1. **SDK package** (`@jayverse/wallet`, published) — the `<JayverseSign>` component, a
   `useJayverseWallet()` hook (connect/account/balance), and a typed `simulate()` client. This is
   what rabbit/verex/personas/game import.
2. **Simulate API service** (Cloud Run, rabbit cloud) — stateless HTTP `POST /simulate` that owns
   the fork RPC connection, decode logic, and warning classifiers. Kept server-side so we control
   the fork node and can cache token/ABI metadata.

**Provider decision — embedded vs. self-managed keys.** Lead candidate is an embedded-wallet
provider (Privy, from the PoC learnings) for the email/passkey UX, but the choice is gated on the
**four-path test** (write it down as an authority matrix before committing):

| Path | Question to answer for each candidate |
|---|---|
| **New device** | can a user re-access the same account on a fresh device, and with what factor? |
| **Lost factor** | recovery when one factor (email/passkey/device) is gone — who can, who cannot |
| **Export** | can the user export their key and leave? (custody honesty) |
| **Scoped signer** | can we issue a session key with a spend cap + allowed-contracts scope (7715)? |

The answers become the "authority matrix of our own config" (§6 step 4) that the Authority Auditor
dogfoods against — our config choices *are* every user's custody reality.

**Session-key policy templates** — per-app presets issued at connect time: e.g. *verex-bet* = "≤ N
jUSD/day, only the Verex exchange + jUSD contracts, 24h"; *personas-rent* = "single mint/rent call,
exact amount". Templates live in `jayverse-rails` so policy is reviewable, not ad-hoc per app.

**New vs. reused:**
- *Reused* — viem clients, chain configs, and the address book from `jayverse-rails`; existing
  fork/anvil infra (we already run Sepolia forks daily); the embedded-wallet PoC.
- *New* — the `simulate()` decode+classify pipeline, `<JayverseSign>`, the session-key template set,
  and the fork-backed simulate service deployment.

**Open questions:**
- Fork freshness vs. cost — a persistent warm fork per chain, or spin per request? Latency budget for
  the preview to feel instant (< ~1s).
- 4337 UserOperations: simulate the full op through the EntryPoint (including paymaster) vs. simulate
  the inner calls only — the former is more accurate, more work.
- Value-drain threshold — what net-negative delta trips the warning without false alarms on
  legitimate one-sided txs (e.g. a donation)?
- MEV/slippage on quoted "receive" amounts — the preview is a simulation, not a guarantee; how loudly
  to say so.
- Provider lock-in — how hard is migrating accounts if we later switch providers (feeds the export
  path answer).

---

## Next phase — our own dev wallet (for testing) (jay, 2026-09-10)

> **DEV / TESTNET ONLY.** Everything here is a *testing* wallet. It uses dedicated dev keys
> (anvil's default mnemonic), never a real or high-value key, and the extension auto-approves
> in the background for convenience — which is exactly why it must never touch anything holding
> real value. This is additive: the embedded-wallet / simulate work above stays; the extension
> becomes the **default dev wallet**, the embedded one stays for testing. jay: "use both."

**Why build our own.** MetaMask is cumbersome for this project — constant network switching, and
its delegation stack is pinned to Sepolia's real chainId `11155111`. For day-to-day local testing
that friction is a tax on every iteration. Our own wallet removes it.

**The key decision — fork Sepolia, report a *distinct* chainId `31337`.** We run `anvil
--fork-url $SEPOLIA_RPC --chain-id 31337`: the fork gives us Sepolia's already-deployed contracts,
but the node reports chainId **31337**, not 11155111. That distinct id is doing real work:

- **It removes the MetaMask lock.** MetaMask's delegation (7702/7715) engine only engages against
  chains it recognizes; without a fork surfaced at a chosen id, "the delegation stack simply
  doesn't engage." Our own wallet just targets 31337 and drives the flow directly.
- **It removes cross-chain replay risk.** EIP-712 domain separators and the EIP-7702 authorization
  both embed chainId, so a signature made on 31337 **cannot** be replayed onto real Sepolia. We get
  Sepolia's contract state to test against without any signature being valid on the real network.

Net: forking Sepolia at a distinct chainId + our own wallet driving the delegation solves both the
network-switching friction *and* the replay concern in one move — a problem MetaMask can't cleanly
solve for us here.

**What's implemented (Slices 1–4, in `jayverse-wallet`, on `claude/phase-1`):**

1. **Local accounts** — anvil's default mnemonic → 10 dev accounts (`mnemonicToAccount`, viem).
2. **Distinct dev chain** — `localTestChain` (chainId **31337**) defined alongside the existing
   Sepolia-fork chain (11155111); `sendTransaction` targets the active chain.
3. **Encrypted vault** — import a private key, encrypt with PBKDF2 (310k) → AES-256-GCM, persist in
   `localStorage`; unlock to sign. Works in browser and Node.
4. **MV3 browser extension** (now with a proper icon set — indigo J tile + preview-check badge, 16/48/128 px, copied into `dist/` by the build) — a universal **EIP-1193 dApp connector** for the whole web: inpage
   provider (world MAIN) ↔ content bridge ↔ background service worker that holds the signer and
   proxies JSON-RPC, **auto-approving** (dev). esbuild IIFE bundle. This is what lets any dApp use
   our wallet the way it would use MetaMask — without the network-switching dance.
5. **EIP-7702 delegation** — `signDelegation` / `verifyDelegation`, **scoped to chainId 31337**, and
   a local-account picker in `<JayverseSign>`.

**Deferred — needs a live anvil to finish (not yet verified):**

- **Confirm anvil's EIP-7702 support** (Pectra) on the fork we run — the 7702 path assumes it.
  ✅ **Verified 2026-09-14** (anvil 1.6.0): on a Sepolia fork reporting chainId `313370` — the
  [devnet](jayverse-devnet.md) id — and on a plain `--hardfork prague` node, a type-4 transaction
  carrying a `cast wallet sign-auth` authorization mined with status 1 and left the EOA's code as
  `0xef0100‖EntryPoint`. No MetaMask involved; the signature is scoped to the distinct id.
- **ERC-7710 / 7715 framework grant + type-4 tx submit** — issue the scoped session-key grant
  through the delegation framework and submit the type-4 transaction end-to-end.

This phase is where the wallet stops being "a component inside apps" and becomes a **standalone dev
tool** — which is also why it pairs with the Authority Auditor: the extension's auto-approve +
session-key scope choices *are* an authority-matrix that the Auditor should be pointed at.

### Four-page UI — implemented (jay, 2026-09-10)

The reason this wallet exists is that **MetaMask is complex**; the UI encodes that thesis
directly. Four pages, every one reachable from a single always-visible top menu — no drawers,
no nested settings, nothing a first-time user cannot scan:

| Page | Route | What it shows |
|---|---|---|
| **Account list** | `/accounts` (also `/`) | anvil #0–#9, address + live ETH balance; **“Use” selects the account the wallet acts as** (persisted, shown as an “In use” chip in the top menu on every page); click a row for detail |
| **Account detail** | `/accounts/[address]` | balance, nonce, and **Send ETH** — every send runs `POST /api/simulate` first and shows decoded effects/warnings/gas *before* Sign & send; a would-revert preview blocks signing. Non-wallet addresses render watch-only |
| **Traded** | `/traded` | the accounts' transactions read straight from recent blocks (window printed — the page never pretends to be complete); no indexer in Phase 1 |
| **Network setup** | `/network` | a user-maintained network list (jay, 2026-09-10): two built-ins (Sepolia fork 8545/11155111 · own-wallet node 8546/31337) + add-your-own (name/RPC/chainId with a Detect button), select exactly one — Accounts, sending and Traded all read through the selection; every row live-probes its node (connected / mismatch / unreachable); custom entries removable, built-ins not |

The original **simulate-before-sign demo stays as a feature** — it moved from `/` to `/demo`
(top-menu tab "Simulate demo"), and its `simulate()` preview is also the heart of the new
Send flow, so the widget is exercised on every transfer.

**Setup / install / run**

```bash
cd ~/work/jayverse-wallet
pnpm install
anvil --chain-id 11155111        # terminal 1 (or the Sepolia-fork anvil already running)
pnpm dev                         # terminal 2 → http://localhost:3060
```

**Concrete test case (verified end-to-end with Playwright, 2026-09-10):**

1. Open `http://localhost:3060` → redirects to **Accounts**; ten rows with live balances.
2. Click account **#2** → detail shows balance + nonce.
3. Recipient = account #3's address, amount `0.25`, click **Preview** →
   the simulate box shows `-0.25 ETH`, a *value-drain* warning, `gas ≈ 21000`.
4. Click **Sign & send** → `Sent ✓` with the tx hash; balance and nonce refresh.
5. Open **Traded** → the `#2 → #3` row appears with value `0.25 ETH` and status ✓.
6. Open **Network** → `Connected ✓ — live chainId 11155111`, current block.
7. On Accounts, click **Use** on #2 → the row shows “In use ✓” and the top menu shows the
   `In use: #2 0x3C44…` chip on every page; the selection survives a reload.
8. Negative case: preview an amount larger than the balance → the preview reports the
   revert and **Sign & send never appears**.

### Install the dev extension (Chrome) — summary

> DEV/TESTNET ONLY: the extension auto-approves and signs with public anvil dev keys on
> chainId 31337. Load it in a browser profile that never touches real funds.

1. **Build it** — from `~/work/jayverse-wallet`:
   ```bash
   pnpm build:ext        # bundles to extension/dist (manifest, scripts, icons)
   ```
2. **Load it** — Chrome → `chrome://extensions` → toggle **Developer mode** (top right) →
   **Load unpacked** → select the `extension/dist` folder. The indigo **J** icon (preview-check
   badge) appears in the toolbar — pin it for the popup.
3. **Point it at the right chain** — by default the extension targets its OWN node on port 8546; since v0.2.0 the popup has a **network selector** (switch between the built-ins, add your own by RPC URL — chainId auto-detected from the node, remove custom ones); dapps get the standard `chainChanged` event on switch, and `wallet_switchEthereumChain` works onto any network in the list
   (distinct chainId, so it runs beside the 11155111 fork on 8545 without a mismatch):
   ```bash
   anvil --fork-url $SEPOLIA_RPC --port 8546 --chain-id 31337
   ```
   The popup and the wallet's Network page both probe the node live and say
   matched / mismatched / unreachable — with this command in the error text.
4. **Verify** — open any dapp page (e.g. the wallet's own `/demo`): the page's
   `window.ethereum` is now the Jayverse provider; `eth_requestAccounts` returns an anvil dev
   account with no prompt (auto-approve is the dev convenience *and* the reason this must never
   hold value).
5. **After code changes** — rebuild (`pnpm build:ext`, or keep `pnpm watch:ext` running) and hit
   the ↻ **reload** button on the extension's card in `chrome://extensions`; a plain browser
   refresh is not enough, the service worker must restart.

## Chainlink — infra we use, not build

Chainlink's oracle stack is settlement-rail infrastructure the Wallet *consumes*, not reimplements — see the umbrella map in [README.md](README.md).

- **Data Feeds** — USD valuation for external assets (ETH, jUSD) in the balance and simulate-before-sign views. **If wrong or late:** the USD figures the user checks *before signing* are misleading — worst at exactly the moment trust matters most.

**Deliberate non-use — JYVE's USD.** JYVE's USD value is read from the mini-AMM (`getPrice()`), not a feed — a self-made token has no external price. (See [jayverse-token-bridge.md](jayverse-token-bridge.md).)

> Every feed is a dependency with a failure mode — keep the "if wrong / late" guard (staleness check / fallback) in code, not only here.
