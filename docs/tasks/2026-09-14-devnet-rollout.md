# Task — Devnet rollout: build `jayverse-devnet`, move every Jayverse service onto it, redeploy

*Brief for an agent session (Claude Code or Codex) working on jay's machine. Written 2026-09-14.
Status: **steps 0–3 DONE — the devnet is live at https://devnet.jaylabs.xyz** (Seoul, e2-small,
~$21/mo). Step 4 core done (Registry + delegation framework seeded, idempotent); its six
per-service deploys are blocked on step 5 work in each repo. Step 5 **in progress** — wallet, defi and token now target the devnet and their contracts are deployed on it (Registry: 47 entries); verex, rabbit, game, personas remain. Step 6 (redeploy) not started. Bridge ruled
**out of scope** (jay). Everything uncommitted, awaiting review. Last updated
2026-09-14 (KST). Owner: jay. Plan doc for this work = this file; keep the Status line and the
per-step checkboxes current as you go.
Full detail:
[`../history/2026-09-14-jayverse-devnet-history.md`](../history/2026-09-14-jayverse-devnet-history.md).*

## Goal

Stand up the Jayverse devnet designed in [`../features/jayverse-devnet.md`](../features/jayverse-devnet.md)
— a hosted Anvil chain in the Rabbit GCP project — then make **every Jayverse service use it instead
of Sepolia** in the cloud, and redeploy each service to its existing instance with that
configuration. Done means: the devnet answers at `https://devnet.jaylabs.xyz`, every Jayverse
contract is deployed on it by the seed, and each service performs one real end-to-end action
against it from its cloud deployment.

## Read first (in this order)

1. [`../features/jayverse-devnet.md`](../features/jayverse-devnet.md) — the design. §2 (architecture) and
   §7 (implementation sketch) are the spec; §1 has the reasons behind every fixed decision below.
2. [`../features/README.md`](../features/README.md) — the service table (what runs where, which GCP project),
   the cloud split, and "Ownership changes (2026-09-14)".
3. [`../features/jayverse-wallet.md`](../features/jayverse-wallet.md) — the distinct-chainId decision and
   the 7702 / own-dev-wallet path.
4. [`../history/2026-09-14-jayverse-history.md`](../history/2026-09-14-jayverse-history.md) — today's
   decisions and the live-node verification evidence (what already works, what is broken).

## Fixed decisions — do not reopen

| Decision | Value |
|---|---|
| Chain id | **313370** for the hosted devnet. `31337` stays the *local* fork id. Never `11155111`. Confirm 313370 is unregistered on chainlist.org before first deploy; if taken, next free `3133xx`. |
| Where | **Rabbit cloud** = GCP project `doubletree-498007`. One **GCE VM**, static IP. Not Cloud Run, not GKE. **Amended 2026-09-14 (jay):** region is **`asia-northeast3` (Seoul)**, not `asia-northeast1` — the whole estate standardises on Seoul, and building the devnet in Tokyo would mean redoing the IP, DNS record and certificate later. Machine is **`e2-small`, 10 GB `pd-balanced`** (~$20/mo), not `e2-medium`/20 GB — the design doc's original sizing, and enough for a demo chain. Both departures recorded in [`../features/cloud-ops.md`](../features/cloud-ops.md) decisions 6–7. |
| Node mode | **Mode A first**: `anvil --fork-url $SEPOLIA_RPC --fork-block-number $PIN --chain-id 313370 --block-time 1 --state /data/anvil.json --state-interval 60`. Mode B (own genesis) is later; build the seed so both modes work. |
| Contracts | **The seed deploys every Jayverse contract + the delegation framework + `Registry`** on the devnet. Nothing Jayverse-owned is used from what the fork inherits. The fork supplies only the base rails (ERC-4337 EntryPoint, Chainlink contracts). |
| Edge | Public RPC only through the **method-allowlist proxy** (`eth_*`, `net_*`, `web3_*`, `ots_*` public; `anvil_*`, `evm_*`, `hardhat_*`, `/admin/*` need `ADMIN_TOKEN`); budgeted faucet; audit log; Caddy TLS; Otterscan at `/explorer`; status page at `/`. |
| Sepolia | Stays as the **secondary** target only for oracle-dependent tests and MetaMask 7715 popup demos. Do not delete Sepolia deployments or configs. |
| USD token | **jUSD**, the Jayverse dollar, deployed by the seed in both node modes. Superseded the original "use Circle's Sepolia USDC from the fork" plan (jay, 2026-09-15): forking Circle's token meant two unrelated ERC-20s answered to a dollar name, and services could not say which one they meant. An external stablecoin returns only when there is a reason for it. |

## The repos and where each runs today

| # | Service | Repo (local path) | Runs today | Notes for this task |
|---|---|---|---|---|
| 1 | Rabbit portal + Agentic AA | `~/work/rabbit` | Cloud Run `rabbit` (doubletree), `https://www.jaylabs.xyz`; deploy via `scripts/deploy.sh` | bundler/paymaster → devnet; delegation env from the seed |
| 2 | Verex | `~/work/verex` | Cloud Run `verex-web-prod` + `verex-api-prod`, project `verex-499205`, `asia-northeast3`; `scripts/deploy-prod.sh` | operator feed updates must go through `feeds.ts` on the devnet (fork feeds are frozen) |
| 3 | DeFi | `~/work/jayverse-defi` | Firebase Hosting `jayverse-defi` (verex project), `https://defi.jaylabs.xyz`; contracts on Sepolia; `scripts/deploy-defi.mjs`, `deploy-firebase.sh` | redeploy contracts on devnet via seed; hosting env → devnet |
| 4 | **Devnet** | `~/work/jayverse-devnet` (**create**) | — | this task builds it |
| 5 | Game | `~/work/jayverse-game` | inside Cloud Run `rabbit`, `/game` | boards read devnet markets |
| 6 | Wallet | `~/work/jayverse-wallet` | Cloud Run `jayverse-wallet`, `https://wallet.jaylabs.xyz` | add network "Jayverse Devnet" (web + extension); simulate API forks from devnet; `/bridge` screen |
| 7 | Token + Exchange + Bridge + Personas | `~/work/jayverse-token` (+ `~/work/jayverse-personas`, moving in) | Cloud Run `jayverse-exchange`, `https://exchange.jaylabs.xyz`; contracts on Sepolia | bridge = devnet `313370` ⇄ Sepolia `11155111`; personas contracts join the seed |
| 8 | OFA | (no repo yet) | — | skip unless a repo exists |
| 9 | Number | `~/work/jayverse-number` | Cloud Run `jayverse-number` | read-only against devnet |
| ✅ | Auditor | `~/work/jayverse-auditor` + `/live/auditor` in rabbit | — | add a devnet row: admin-token holders = who can move chain state |

**There is no `@jayverse/rails` package yet** even though the docs refer to one. Create it in step 3
(small repo `~/work/jayverse-rails`, one `chains.ts` exporting `jayverseDevnet`, `sepolia`,
`localFork`, plus the Registry ABI + address). If that is too much for the first pass, a single
`chains/jayverse-devnet.ts` copied into each repo with a `// TODO: move to @jayverse/rails` note is
acceptable — say which you did.

## Work plan (do in this order; tick as you go)

- [x] **0. Branches and logging.** In every repo you touch: `git switch -c claude/devnet-rollout`
  (reuse it for follow-ups). Log the day's work as you go in
  `~/work/alice/docs/history/YYYY-MM-DD-jayverse-devnet-history.md` (KST date, Cause → Reasoning →
  Change → Result per titled entry), and keep the Status line at the top of this file current.
- [x] **1. Build `jayverse-devnet` locally.** Layout from the design's §7:
  `infra/` (docker-compose: anvil from a pinned Foundry image ≥ 1.6.0, `rpc-proxy`, `otterscan`,
  `status`, `caddy`; Caddyfile; systemd unit), `proxy/` (Node: allowlist, admin token, faucet with
  10 ETH/address/day and 500 ETH/day budget, per-IP rate limit, audit log), `scripts/` (`seed.ts`,
  `reset.sh`, `snapshot.sh`, `feeds.ts`), `status/` (chain card, "Add to wallet" via
  `wallet_addEthereumChain`, faucet form, Registry table, explorer link), `contracts/Registry.sol`,
  `docs/runbook.md`. `docker compose up` must give the same devnet on `localhost:8545` at chain
  313370. **Verify locally before touching the cloud:** `eth_chainId` = `0x4c81a`; a type-4 EIP-7702
  tx mines (`cast wallet sign-auth` + `cast send --auth`, proven on 2026-09-14); the delegation
  framework deploys (`deploySmartAccountsEnvironment`, see `~/work/rabbit/scripts/deploy-delegation.mjs`);
  `anvil_setBalance` through the proxy is refused without the admin token.
- [x] **2. Provision the VM** *(DONE 2026-09-14 — Seoul `asia-northeast3-a`, e2-small, static IP 34.158.215.69, DNS + TLS live, IAP-only SSH, GCS snapshots, uptime check. All four checks pass against the public endpoint.)* in `doubletree-498007` with `gcloud`: `e2-medium`, `asia-northeast1`,
  20 GB `pd-balanced` mounted at `/data`, static external IP, firewall 443 from anywhere and 22 via
  IAP only, Cloud DNS `devnet.jaylabs.xyz` A record, Secret Manager `SEPOLIA_RPC_URL`,
  `FAUCET_KEY`, `ADMIN_TOKEN`, GCS bucket `jayverse-devnet-snapshots` (30-day retention), a Cloud
  Monitoring uptime check on `POST /rpc eth_blockNumber` alerting if height stalls 5 min. Every
  command goes into `docs/runbook.md` and must be re-runnable. Bring the compose stack up; confirm
  the four local checks above pass against `https://devnet.jaylabs.xyz`.
- [x] **3. Shared chain definition.** *(done: real `@jayverse/rails` package, not the per-repo copy.)* `jayverseDevnet` = id 313370, name "Jayverse Devnet", RPC
  `https://devnet.jaylabs.xyz/rpc`, WS `wss://devnet.jaylabs.xyz/ws`, explorer
  `https://devnet.jaylabs.xyz/explorer`, `contracts.registry`. See the package note above.
- [~] **4. Seed.** *(core DONE on the live chain: Registry `0xe8a1…674b` with 41 entries, delegation framework, base rails verified, demo accounts funded, `deployments/devnet.json` written, idempotent. All six per-service deploys blocked — see step 5.)* `seed.ts` runs each repo's own deploy script against the devnet in dependency
  order — token → exchange → bridge → verex → defi → personas → (ofa) — then the delegation
  framework, then `Registry.set(name, address)` for each, then funds the demo accounts (Anvil dev
  keys + named users: Mina, Tae, Verex operator, bridge relayer). Output both on-chain (Registry)
  and as `deployments/devnet.json`. Must be idempotent per reset.
- [ ] **5. Point every service at the devnet.** *(blockers identified per repo. **Bridge is OUT OF
  SCOPE** — jay, 2026-09-14: `BridgeLock`/`BridgeMint` do not exist in `jayverse-token` at all, so
  writing them is its own task, not part of this rollout. Step 7's bridge check is dropped with it.)* Add the chain entry; cloud env `CHAIN=devnet` (Sepolia
  only for the oracle/MetaMask tests); read addresses from the Registry or `deployments/devnet.json`
  — no hardcoded Sepolia addresses on the devnet path. Service specifics: Wallet gets the network
  entry in web + MV3 extension and its simulate API forks *from the devnet*; Token's bridge config
  becomes 313370 ⇄ 11155111; Verex's operator uses `feeds.ts`; Rabbit's bundler/paymaster and
  delegation env come from the seed. **While in rabbit, fix `scripts/verify-delegation.mjs`**: on
  2026-09-14 it failed on every chain id (the predicted smart-account address has no code after the
  `@metamask/smart-accounts-kit` 1.7.0 upgrade, so `redeemDelegations` silently succeeds); it must
  pass its three checks on the devnet.
- [x] **6. Redeploy each service to its existing instance** *(DONE 2026-09-15 — rabbit, verex api+web, jayverse-wallet, jayverse-exchange, jayverse-defi (Firebase). No new instances created beyond the devnet VM.)* with the devnet config, using each repo's
  existing deploy script (rabbit `scripts/deploy.sh`, verex `scripts/deploy-prod.sh`, defi
  `scripts/deploy-firebase.sh`, the others' Cloud Run flow). **Create no new instances** other than
  the devnet VM. Any new Dockerfile gets a `.dockerignore`; multi-stage builds copy only artifacts.
- [ ] **7. Verify end to end and report.** Devnet: chain id, block height advancing, allowlist
  refusal, faucet within budget, one snapshot in the bucket, explorer showing the seed
  transactions. Per service, one real action from its cloud deployment: Rabbit — a gasless bet
  UserOp through the forked EntryPoint; Verex — create a market, resolve it via `feeds.ts`; DeFi —
  deposit, observe a rebase; Wallet — simulate + sign on the devnet and one type-4 7702 tx; Token —
  a JYVE/jUSD swap and one bridge lock (devnet) → mint (Sepolia); Game — boards list devnet
  markets; Number and Auditor — read the devnet. Put the commands and their outputs in the report.

## Policies (jay's, non-negotiable)

- **Never `git reset --hard`**; no destructive git. One branch per repo for this whole request.
- **Never commit or push without jay's review.** When a repo is ready, stop with a per-repo diff
  summary and wait. Do not commit "to save progress".
- Secrets only in Secret Manager or gitignored `.env.local`; never in a commit, never in a log.
- Docs/plans/history live in `~/work/alice` (this file, `docs/history/`). Do not recreate
  `docs/tasks` or `docs/history` in rabbit.
- jay's own local Anvil (chain `11155111`, port 8545, `--state ./anvil-sepolia-state.json`) is
  usually running — do not kill it; use other ports locally.

## Known gotchas (already found — don't rediscover them)

- **Chainlink feeds on a fork are frozen** at the fork block; no oracle updates them. `feeds.ts`
  writes aggregator answers (admin only). Oracle-dependent integration tests stay on Sepolia.
- **MetaMask's 7715 popup (`wallet_requestExecutionPermissions`) does not engage on 313370** — it only
  works on chains MetaMask lists. Use the plain EIP-712 `Delegation` path (rabbit already does) and
  the own dev wallet on the devnet; keep the popup demo on Sepolia.
- **Fork lazy loading is slow on first touch**: the framework deploy took 2 m 28 s on a fresh fork
  vs 0.24 s on a plain node. Pin the block, keep the node warm, don't rerun the seed casually.
- **`--block-time 1` means transactions are not instamined**; every script must wait for receipts.
- The kit hardcodes no chain list and no addresses; the Registry is how services find the framework.

## Deliverables

1. `~/work/jayverse-devnet` on `claude/devnet-rollout`, with `docs/runbook.md` (VM, DNS, secrets,
   restore-from-snapshot) — uncommitted, awaiting review.
2. The VM live at `https://devnet.jaylabs.xyz` with the four checks passing.
3. `jayverseDevnet` chain definition (package or per-repo file — say which).
4. Each touched service repo on `claude/devnet-rollout` with the devnet config and a passing
   end-to-end action from its cloud deployment; `verify-delegation.mjs` fixed in rabbit.
5. The history file in alice with one entry per step, and this file's Status line updated.
6. A final report: per repo — branch, files changed, commands run with outputs, what is verified,
   what is blocked and why; billable resources created (VM, disk, IP, bucket) with the monthly
   estimate.
