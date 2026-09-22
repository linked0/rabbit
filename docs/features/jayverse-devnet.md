# Jayverse — Devnet (`jayverse-devnet`) — our own chain, starting as a hosted Anvil

*One always-on Anvil node in the Rabbit cloud that every Jayverse service targets **instead of
Sepolia**: instant blocks, unlimited test ETH, resettable state, the same contract addresses as
Sepolia because it is a fork of it. This is service **#4** — the "own L1/L2" track promoted from
Dark Horse (a) — and the devnet is its first, deliberately small step.*

*Source: jay, 2026-09-14 — "I want the L1/L2 project named `jayverse-devnet`. Initially we will
create a devnet based on Anvil on the Rabbit instance, so we will use that instead of Sepolia in
the cloud." Background: [jayverse-darkhorse.md §(a)](jayverse-darkhorse.md#a-l1--l2--our-own-chain-start-at-last)
(the start-at-last argument) and the Wallet's
[fork-Sepolia-with-chainId-31337 decision](jayverse-wallet.md#next-phase--our-own-dev-wallet-for-testing-jay-2026-09-10).
Design draft for review — not built. Sibling docs indexed in [README.md](README.md).*

---

## Phases (build order)

| Phase | Focus | What we implement |
|---|---|---|
| **1 (MVP)** | Hosted devnet | `anvil` forked from Sepolia at a pinned block, chainId **313370** (its own id — `31337` stays local), on one small GCE VM in the Rabbit cloud; **`seed.ts` deploys every Jayverse contract and the delegation framework on it** (nothing Jayverse-owned is inherited from the fork); state persisted to disk; HTTPS RPC + WebSocket at `devnet.jaylabs.xyz` behind a **method-allowlist proxy**; faucet; Otterscan explorer; status page. |
| **2** | Services move over | every service's chain config gains a `devnet` entry and its deploy scripts target it; the dev wallet lists it; the token bridge becomes a real two-chain bridge (devnet 313370 ⇄ Sepolia 11155111). Sepolia stays as the "public testnet" leg only. |
| **3** | Ops: reset, snapshot, seed | one-command `reset` (re-fork + re-seed) with an admin token; scheduled snapshots to GCS; a seed script that redeploys the Jayverse address book; uptime check + alert. |
| **4** | Toward our own L2 | `supersim` locally (L1 devnet + OP-Stack L2s), then an OP-Stack L2 whose settlement layer *is* this devnet — the Dark Horse ambition, still start-at-last. |

---

## 1. What we build (the basic feature)

**A hosted Anvil, not a new chain.** Phase 1 is exactly `anvil --fork-url $SEPOLIA_RPC
--fork-block-number <pinned> --chain-id 313370 --block-time 1 --state /data/anvil.json`, running
24/7 on a VM. Three things make it a *service* rather than a laptop process:

1. **It is reachable and safe.** JSON-RPC is public at `https://devnet.jaylabs.xyz`, but only
   through a small proxy that **allowlists methods**: `eth_*`, `net_*`, `web3_*`, `ots_*` (explorer)
   pass; `anvil_*`, `evm_*`, `hardhat_*` (mint ETH, warp time, impersonate, reset) require the admin
   token. Without this, anyone could `anvil_setBalance` themselves and `evm_mine` past every
   Verex market close. The allowlist *is* the devnet's authority matrix — see #✅ Auditor below.
2. **It survives restarts.** `--state` + `--state-interval 60` dumps the local overlay every
   minute; on boot the node re-forks at the same pinned block and loads the overlay, so balances,
   deployments, and history come back. A nightly copy of the state file goes to a GCS bucket.
3. **It gives ETH away on purpose.** `POST /faucet {address}` sends 10 test ETH, rate-limited per
   address and per IP — the "a faucet is a payout" lesson applied: a faucet is the one place we
   *want* to hand out value, so it gets an explicit budget (per day) instead of an implicit one.

**Why fork Sepolia rather than start from an empty genesis.** The fork gives us, for free, the
*base rails* — the ERC-4337 `EntryPoint`, the test jUSD the services already use, and the Chainlink
feed contracts — so those keep the addresses every tool already knows. An empty genesis would mean
re-creating all of that first. Phase 4 is where a from-scratch chain becomes worth it.

**But every Jayverse contract is deployed on the devnet, by us** (jay, 2026-09-14: "all the
contracts should be deployed on the devnet if we decided to use the chain"). The fork also carries
the Sepolia deployments of JYVE, the Exchange, Verex, DeFi and the rest — **we do not use them**.
`seed.ts` deploys the whole Jayverse set fresh on the devnet, plus the delegation framework, and
writes the addresses to the `Registry`. Reasons: the devnet is the *primary* deployment target from
now on, so it must hold the contracts at the versions we are actually building, not whatever last
shipped to Sepolia; a deploy that works only because a contract happened to be on the fork is a
deploy nobody can reproduce; and one seed for both node modes (fork / own genesis) means switching
modes later changes nothing above the node. Sepolia keeps its own deployments as the *secondary*
target for the oracle and MetaMask tests.

**Why a dedicated chainId (`313370`), not `31337`** (jay, 2026-09-14: "shouldn't the devnet be another
chain id?"). The Wallet's local fork reports `31337`, and it should keep doing so — but the hosted
devnet is a *different chain* and must say so:

- **`31337` means "localhost" to every tool.** MetaMask labels it *Localhost 8545*, Hardhat and Foundry
  default to it, and wallets key their network list by chain id — a local fork and the hosted devnet
  under one id would be one network with two RPCs, and users would sign against the wrong one.
- **Replay protection is per chain id (EIP-155).** With the same id, same forked addresses, and the same
  nonces, a transaction signed for the local fork is valid on the hosted devnet and vice versa. A
  distinct id makes a devnet signature worthless anywhere else, including real Sepolia.
- **The cost is one config entry.** Services already carry `sepolia` and `31337` (local); `devnet =
  313370` is a third entry in the rails chain list, nothing more. Local and hosted stay interchangeable
  *by URL*, not by pretending to be one chain.
- **MetaMask does not need Sepolia's id** (jay, 2026-09-14: "for cooperating with MetaMask, should we
  use Sepolia's chain id?"). MetaMask takes any custom network through `wallet_addEthereumChain` —
  the status page's *Add to wallet* button registers "Jayverse Devnet" (`313370`, RPC, explorer) in
  one click, and MetaMask then shows the right name and balance for it. Claiming `11155111` would make
  MetaMask *think* the devnet is Sepolia: the user could not have both networks at once, could not
  tell which one a popup is for, and — worse — a devnet signature would be valid on real Sepolia,
  which is exactly what the Wallet's local-fork decision exists to prevent. The known casualty is
  **MetaMask delegation (7702/7715)**: its engine only engages on chain ids it recognizes, so on any
  fork that is not `11155111` "the delegation stack simply doesn't engage" — the problem jay hit,
  recorded in [jayverse-wallet.md](jayverse-wallet.md#next-phase--our-own-dev-wallet-for-testing-jay-2026-09-10)
  ("It removes the MetaMask lock"). The devnet inherits that decision rather than reopening it:
  MetaMask-driven delegation is demoed on **real Sepolia**, which stays for that purpose next to the
  oracle tests; delegation *on the devnet* is driven by **our own dev wallet**, which targets any
  chain id and was built precisely so MetaMask's Sepolia pinning stops taxing everything else. The
  one way to get MetaMask delegation on the devnet itself is to report `11155111`, and that buys
  back the replay risk and the which-network confusion above — not worth it for a demo path that
  real Sepolia already serves.

`313370` is `31337` with a trailing zero — memorable, and unlikely to be registered; verify on
chainlist.org before the first deploy and take the next free `3133xx` if it is taken.

## 2. Architecture — the Jayverse L1 devnet

The devnet is **our own chain for our own ecosystem**: one Anvil-based L1, deployed in the Rabbit
GCP project, that carries the whole Jayverse contract set and that every service, wallet, and agent
treats as *the* chain. Five layers, from the metal up:

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  5. CONSUMERS          Rabbit AA · Verex · DeFi · Wallet · Token/Exchange/Personas   │
│                        OFA · Game · Number · Auditor · agents · dev wallet extension  │
│                        ── all use one chain definition: `jayverseDevnet` (rails pkg) │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  4. ECOSYSTEM          the Jayverse contract set, seeded at genesis/reset:            │
│     (on-chain)         EntryPoint 4337 · jUSD · JYVE · Exchange · BridgeLock          │
│                        Verex markets · DeFi (jeETH) · Personas · OFA IntentAuction    │
│                        + `Registry` (name → address, the on-chain address book)       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  3. EDGE               Caddy (TLS, devnet.jaylabs.xyz)                                │
│     (public boundary)  rpc-proxy: method allowlist · admin token · rate limit         │
│                        faucet (budgeted) · audit log · status page · Otterscan        │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  2. NODE               anvil — chainId 313370 · 1s blocks · EVM (Cancun)              │
│                        mode A: fork of Sepolia @ pinned block   (phase 1 default)     │
│                        mode B: own genesis (no upstream)         (phase 3+)           │
│                        state overlay → /data/anvil.json every 60 s                    │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  1. HOST               Rabbit cloud (GCP project doubletree-498007, asia-northeast1)  │
│     (Rabbit instance)  GCE VM `jayverse-devnet` (e2-small) · persistent disk /data    │
│                        docker compose · systemd · static IP · Cloud DNS               │
│                        Secret Manager (fork RPC, faucet key, admin token)             │
│                        GCS snapshots · Cloud Monitoring uptime + block-height alert   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 The chain itself (layer 2)

| Property | Value | Why |
|---|---|---|
| Engine | `anvil` (Foundry) | the fastest EVM we can run; `ots_*` explorer API built in; every tool we use already speaks to it |
| Chain id | **313370** — dedicated; `31337` stays the *local* fork id | never collides with the localhost/Hardhat/Foundry default; EIP-155 keeps local and hosted signatures from replaying on each other (§1) |
| Block time | 1 s (`--block-time 1`) | real blocks on a clock, not instamine — so timing bugs (queues, closes, session expiry) show up here, not on Sepolia |
| Native currency | test ETH, faucet-issued | no value; the faucet is the only "issuer" |
| **Mode A — fork** | `--fork-url $SEPOLIA_RPC --fork-block-number $PIN` | inherits the *base rails* only (EntryPoint, jUSD, Chainlink contracts) at their known addresses; every Jayverse contract is still deployed fresh by `seed.ts`; default for phase 1 |
| **Mode B — own genesis** | no fork; `seed.ts` deploys everything incl. a mock jUSD and the 4337 EntryPoint | no upstream RPC dependency, fully reproducible; the form the chain takes once it is "ours" (phase 3+) and the one an OP-Stack L2 would settle on |
| Persistence | `--state /data/anvil.json --state-interval 60` + `--load-state` on boot | restarts and VM reboots keep balances, deployments, history |
| Reset | `anvil_reset` (mode A) / restart with empty state (mode B) → `seed.ts` | a devnet must be cheap to wipe; a reset is a logged admin action, not an accident |

Both modes run behind the same edge and expose the same ecosystem (layer 4); a service cannot tell
which mode is active, and that is the point — mode B is how the devnet stops depending on Sepolia
without anything above it noticing.

### 2.2 The ecosystem layer (layer 4) — what makes it *our* chain

An empty EVM is not an ecosystem. The devnet is defined by the contract set that `seed.ts` puts on
it and by the **`Registry`** contract that names them:

- **Base rails:** ERC-4337 `EntryPoint` (v0.7), `jUSD` (Circle's Sepolia test token in mode A, a
  mock in mode B), and the Chainlink feed/automation addresses (frozen in mode A, mocked in mode B).
- **Jayverse contracts — all deployed on the devnet by `seed.ts`, never inherited from the fork**
  (jay, 2026-09-14): `JYVE`, `Exchange` (JYVE/jUSD pool, seeded with liquidity), `BridgeLock`
  (devnet side of the bridge), Verex market factory + a few demo markets, DeFi `jeETH` vault,
  `Personas` NFT + rental, OFA `IntentAuction` + mock solvers. Each service's repo owns its deploy
  script; `seed.ts` calls them in dependency order (token → exchange → bridge → verex/defi/personas/ofa).
- **Delegation framework:** `DelegationManager`, `SimpleFactory`, the DeleGator implementations and
  the caveat enforcers, deployed by the seed via `deploySmartAccountsEnvironment` — verified to
  deploy on a 313370 fork on 2026-09-14. The 7710 session-key path needs these on *our* chain; the
  kit hardcodes no addresses, so the Registry is how services find them.
- **`Registry.sol`** — a one-function on-chain address book (`get("Exchange") → address`) written
  once by `seed.ts`. Because every Jayverse contract is seed-deployed, its address is whatever the
  seed produced — in both node modes — so services read the Registry rather than pinning addresses
  in config; after a reset the seed redeploys and rewrites the Registry, and nothing above it holds
  a stale address.
- **Demo accounts:** ten Anvil dev keys funded at seed, plus named demo users (Mina, Tae, the
  Verex operator, the bridge relayer) so scenarios are replayable by name.

### 2.3 Trust boundaries and paths (layers 3 → 2)

Three callers, three paths through the same edge:

| Caller | Path | Allowed | Enforced by |
|---|---|---|---|
| **Public** (any service, wallet, agent) | `POST /rpc`, `WS /ws` | `eth_*`, `net_*`, `web3_*`, `ots_*`; `/faucet` within budget | rpc-proxy allowlist + per-IP/per-address rate limit |
| **Admin** (jay, CI with the token) | `/admin/*` and `anvil_*` / `evm_*` / `hardhat_*` over `/rpc` | reset, mine, warp time, set balance, impersonate, snapshot | admin token from Secret Manager; every call → audit log line |
| **Operator scripts** (seed, feeds, keeper) | run *on the VM* against `anvil:8545` on the Docker network | everything | never reachable from outside; the VM is the boundary |

**Read path:** consumer → Caddy → proxy (allowlist) → anvil. **Write path:** same, for
`eth_sendRawTransaction`; the chain is permissionless for *transactions* — anyone can deploy or
call — but not for *cheats*. **Snapshot path:** anvil → `/data/anvil.json` → nightly `gsutil cp` to
`gs://jayverse-devnet-snapshots/`. **Reset path:** admin → proxy pauses public writes →
`anvil_reset` / restart → `seed.ts` → Registry rewritten → proxy resumes → status page *ready*.

The Auditor's row for this service is exactly the middle column above: *who can move the chain's
own state* = holders of the admin token, and the proxy is the code that enforces it.

### 2.4 How services attach (layer 5)

One chain definition, published from the rails package and imported everywhere:

```ts
// @jayverse/rails — chains.ts
export const jayverseDevnet = defineChain({
  id: 313370,
  name: 'Jayverse Devnet',
  nativeCurrency: { name: 'Test Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://devnet.jaylabs.xyz/rpc'], webSocket: ['wss://devnet.jaylabs.xyz/ws'] } },
  blockExplorers: { default: { name: 'Otterscan', url: 'https://devnet.jaylabs.xyz/explorer' } },
  contracts: { registry: { address: REGISTRY } },   // everything else via Registry.get(name)
});
```

- Every service's env has `CHAIN=devnet` as the cloud default and `CHAIN=sepolia` only for the
  oracle-dependent integration tests (Chainlink section below).
- The **Wallet** lists "Jayverse Devnet" as a network; its simulate API forks *from the devnet* for
  previews, so the preview and the real chain agree.
- The **bridge** treats the devnet as chain 313370 and Sepolia as 11155111 — two real chains.
- **Local parity:** `docker compose up` in `jayverse-devnet/infra` runs the identical stack on
  `localhost:8545` (mode A or B by env); the only difference from the cloud is the URL in the
  chain definition, so "works locally, breaks in the cloud" has one fewer cause.

### 2.5 Deployment in the Rabbit instance (layer 1)

```
GCP project doubletree-498007 (Rabbit cloud), region asia-northeast1
├─ Compute Engine  VM jayverse-devnet (e2-small, Container-Optimized OS or Debian + Docker)
│    ├─ /data (20 GB pd-balanced)   anvil state, proxy audit log
│    └─ docker compose: anvil · rpc-proxy · otterscan · status · caddy
├─ VPC firewall     443 in from 0.0.0.0/0; 22 via IAP only; nothing else
├─ Cloud DNS        devnet.jaylabs.xyz A → static IP
├─ Secret Manager   SEPOLIA_RPC_URL (mode A) · FAUCET_KEY · ADMIN_TOKEN
├─ Cloud Storage    gs://jayverse-devnet-snapshots (nightly state, 30-day retention)
├─ Cloud Monitoring uptime check POST /rpc eth_blockNumber; alert if height stalls 5 min
└─ Cloud Build      (optional) rebuilds the proxy/status images on push to jayverse-devnet main
```

Why a VM and not Cloud Run, restated as architecture: the node is **stateful and always-on**; the
edge is stateless. The VM is the smallest thing that hosts both without a state gap. If the edge
ever needs to scale (it won't for a devnet), the proxy can move to Cloud Run and point at the VM's
internal IP — the layers are separable by design.

### 2.6 Where this goes (phase 4 — the own L2)

Nothing above is throwaway. In phase 4 the devnet becomes the **settlement layer**: an OP-Stack L2
(`supersim` locally first) posts its batches and roots to this chain, the Registry gains the L2's
bridge and portal addresses, and the edge grows a second RPC (`/l2/rpc`). Services that only need
speed move to the L2; anything that must stay on "L1" — the token's supply root, the bridge lock —
stays here. The layer diagram stays the same; layer 2 just gets a second box.

## 3. Imaginary scenario

**jay's morning.** He pushes a change to `Exchange.sol`. The deploy script targets `devnet`; the
transaction is mined in one second, not twelve, and costs nothing he had to beg a faucet for. He
opens `devnet.jaylabs.xyz/explorer`, sees the deployment, and pastes the address into the shared
address book. Nothing else in Jayverse needed to change: the Wallet, the Game, and Verex already
point at `devnet`.

**Mina's first evening, again.** The onboarding flow from the hub's Scenario A runs on the devnet.
Her embedded wallet is funded by the faucet the moment it is created — no "waiting for Sepolia
ETH" screen. Her first bet is a 4337 UserOp through the *same* `EntryPoint` address it would use
on Sepolia, because the devnet is a fork of it. When she bridges 30 JYVE to "Sepolia" it is now a
**real** two-chain move — devnet 313370 → Sepolia 11155111 — not the fork-of-itself the bridge doc
had to apologize for.

**The reset.** A Verex test market got wedged by a bad resolution during a demo. jay hits *Reset*
on the status page (admin token), the node re-forks at the pinned block, the seed script redeploys
the Jayverse address book, and the faucet refunds the demo accounts. Two minutes, no Sepolia
cleanup, no stale state anyone else can hit.

## 4. What the web app shows

A one-page **status site** at `devnet.jaylabs.xyz` (the RPC lives at `/rpc`, WebSocket at `/ws`):

- **Chain card:** chain id, latest block, block time, fork source + pinned block, node uptime,
  last state dump, last GCS snapshot.
- **Connect:** the RPC URL with a copy button, and an *Add to wallet* button
  (`wallet_addEthereumChain` with name "Jayverse Devnet", currency ETH, explorer URL).
- **Faucet:** address input → 10 ETH; shows the remaining daily budget and the per-address cooldown.
- **Address book:** the deployed Jayverse contracts on this chain (EntryPoint, jUSD, JYVE, Exchange,
  Bridge, Verex, DeFi, Personas) with explorer links — read from the shared rails config, not typed.
- **Explorer:** [Otterscan](https://otterscan.io) served at `/explorer` — Anvil implements the
  `ots_*` API it needs, so blocks, txs, and traces are browsable with no indexer.
- **Admin (token-gated):** *Reset*, *Snapshot now*, *Mine N blocks*, *Warp time* — the `anvil_*` /
  `evm_*` methods the proxy otherwise refuses, exposed as buttons with an audit line each.

## 5. The flow

```
service / wallet ──HTTPS──▶ Caddy (TLS, devnet.jaylabs.xyz)
                              ├─ /rpc, /ws ──▶ rpc-proxy ──▶ anvil :8545
                              │                 │  allowlist: eth_* net_* web3_* ots_*
                              │                 │  admin token: anvil_* evm_* hardhat_*
                              │                 └─ /faucet: rate limit → eth_sendTransaction (funded key)
                              ├─ /explorer ──▶ otterscan (static)
                              └─ /          ──▶ status page (static + reads /rpc)

anvil ──every 60s──▶ /data/anvil.json ──nightly──▶ gs://jayverse-devnet-snapshots/
boot: anvil --fork-url $SEPOLIA_RPC --fork-block-number $PIN --chain-id 313370 --load-state /data/anvil.json
```

**Reset flow:** admin `POST /admin/reset` → proxy stops accepting writes → `anvil_reset` to the
pinned fork block → `scripts/seed.ts` redeploys the address book and funds the demo accounts →
status page flips back to *ready*. Every reset is a dated line in the admin audit log.

## 6. Cooperate with existing services

- **#1 Rabbit AA** — bundler + paymaster point at `devnet`; the forked `EntryPoint` is the same
  address, so UserOps and session keys need no code change.
- **#2 Verex** — test markets resolve in seconds; the operator's Chainlink Data Feed reads are the
  **frozen** fork values (see Chainlink below), so resolution tests use the operator's own feed
  updater script.
- **#3 DeFi** — the rebasing/withdraw-queue clocks can be *warped* (`evm_increaseTime`, admin
  only), which turns "wait a week for the queue" into a one-line test.
- **#6 Wallet** — the dev extension already targets the local `31337` fork; the hosted devnet is a
  second network entry beside it ("Jayverse Devnet", `313370`). The simulate API forks *from the
  devnet* for previews.
- **#7 Token + Exchange + Bridge + Personas** — the intra bridge finally has two genuinely
  different chains (313370 ⇄ 11155111); the "same chain id" honesty note in the bridge doc retires.
- **#8 OFA**, **#5 Game**, **#9 Number** — read/write the devnet like any chain; the Game's boards
  show devnet markets by default.
- **✅ Auditor** — the devnet gets its own authority matrix: *who can mint ETH / warp time / reset*
  = holders of the admin token, and nobody else. The proxy's allowlist is the enforced form of
  that row.
- **Scenario B's `jayverse-watchtower`** (imaginary) — the devnet is where an invariant monitor is
  first pointed, because a violation here costs nothing.

## 7. Implementation sketch

**One repo, `jayverse-devnet`:**

```
jayverse-devnet/
  infra/            docker-compose.yml (anvil, rpc-proxy, otterscan, caddy), Caddyfile, systemd unit
  proxy/            small Node service: method allowlist, admin token, faucet + rate limit, audit log
  scripts/          seed.ts (redeploy address book, fund demo accounts), reset.sh, snapshot.sh
  status/           static status page (reads /rpc), "add to wallet" button
  docs/             runbook: create VM, DNS, secrets, restore from snapshot
```

- **Where it runs:** Rabbit cloud (`doubletree-498007`), **one GCE VM** (`e2-small`,
  asia-northeast1, static IP, 20 GB persistent disk at `/data`), not Cloud Run — a chain needs a
  process that never scales to zero and a disk that outlives the container. Cloud Run with
  `min-instances=1` and GCS-backed state is the fallback if the VM is unwanted, at the cost of
  state gaps between dumps.
- **DNS / TLS:** `devnet.jaylabs.xyz` A record → VM; Caddy issues the certificate. Firewall: 443
  only. Anvil itself listens on the Docker network, never on the public interface.
- **Secrets (Secret Manager):** the upstream Sepolia RPC URL (fork source), the faucet key, the
  admin token. The faucet key is an Anvil dev account on this chain — worthless anywhere else.
- **Persistence:** `--state /data/anvil.json --state-interval 60`; `snapshot.sh` copies it to
  `gs://jayverse-devnet-snapshots/YYYY-MM-DD.json` nightly via cron; `restore` = stop, copy back,
  start. The pinned fork block is a config value; changing it is a deliberate *reset*, logged.
- **Monitoring:** a Cloud Monitoring uptime check on `POST /rpc eth_blockNumber`; alert if the
  block number stops advancing for 5 minutes.
- **Cost:** roughly the price of one small VM per month — the cheapest "chain" Jayverse will ever
  run, and the point of starting here.
- **Local parity:** `docker compose up` in the repo gives the same devnet on `localhost:8545`, so
  "local" and "hosted" differ only by URL.

## Open questions

- **Chain id — decided: dedicated `313370`** (jay, 2026-09-14; reasons in §1). `31337` stays the local
  fork. Still to do: confirm `313370` is unregistered on chainlist.org before the first deploy.
- **How often to re-pin the fork block?** Never automatically. Re-pinning is a reset; do it when a
  Sepolia change we depend on (a new EntryPoint, a jUSD redeploy) must be picked up.
- **Faucet budget** — 10 ETH per address per day, 500 ETH per day total, as a starting point.

## Chainlink — infra we use, not build

The fork carries Sepolia's Chainlink **Data Feed** and **Automation** contracts at their real
addresses, but they are **frozen at the fork block**: no oracle node updates a fork. So on the
devnet, feeds are updated by the operator's own script (`scripts/feeds.ts` writes the aggregator's
answer via an impersonated transmitter, admin only), and Automation upkeeps are triggered by the
Verex keeper script rather than the Chainlink network. That is the correct behavior for a devnet —
deterministic, scriptable prices — and it is also why the devnet can never replace Sepolia as the
*integration* test for anything oracle-dependent. Sepolia stays for that; the devnet is for
everything else.
