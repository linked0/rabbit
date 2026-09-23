# Rabbit portal — "Chains" menu: one page for the three Jayverse networks (task brief)

## Current status <a id="status"></a>

*Last updated 2026-09-22 (KST). Read this first — it is the state of every thread currently
open, across repos. The sections below are the Chains brief, which is only one of them.*

| Thread | State | Next move, and whose |
|---|---|---|
| **Docs move** — `features/`, `tasks/`, `history/` back from alice | **Done.** Pushed both repos; alice's cards verified live | [§8](#docsmove) — jay: the `CLAUDE.md` path, below |
| **Chains menu** (this brief) | **Shipped.** `www.jaylabs.xyz/chains` returns 200; the work is on `main` (`3150f9c`, `e558625`) | §0's "nothing committed" is stale — see the note under it |
| **Verex tradable** ← *the actual goal* | **Blocked.** Devnet is healthy, but Verex's DB has no markets | **[D1](#decide)** |
| **Jayverse devnet** | **Stable.** `e2-standard-2`, 6000 MiB cap, healthy, block 11,710,497 on fork 11,701,069 | **[D3](#decide)** |
| **JYVE exchange** | **Fixed and deployed** — `swapJusdForJyve` → `swapUsdcForJyve`, revision `00003-98l` | none |
| **Rabbit Hole** (Unity WebGL) | **Built, not deployed.** `hole.jaylabs.xyz` has no DNS record yet. The three.js game shipped separately and holds `game.jaylabs.xyz` | **[D2](#decide)** |

### Decisions waiting on jay <a id="decide"></a>

Each of these is a fork in the road that an agent should not pick for jay. Recommendation given,
because "your call" with no opinion is not help.

| # | Decision | Options | Recommended | If left undecided |
|---|---|---|---|---|
| **D1** | **How to seed Verex** — the goal, *"make the verex tradable"* | **(a)** jay runs the ready command himself, holding the secrets · **(b)** a Cloud Run job from the verex-api image with the same `secretKeyRef` entries — GCP injects the secrets, this session never sees them | **(b)** — repeatable, auditable, and nothing is pasted into a terminal. Cost is one job execution, cents | Verex stays untradable. Nothing else unblocks it |
| **D2** | **Where the Unity build is hosted.** Rewritten 2026-09-23: the old framing ("how the bundle reaches the rabbit image") died when another session shipped the three.js game to **Firebase Hosting** and made that the house pattern — `game.jaylabs.xyz` → `jayverse-game.web.app`, beside `defi.` and `verex.` | **(a)** Firebase Hosting at `hole.jaylabs.xyz`, following the pattern · **(b)** commit `Build/WebGL/` into rabbit and serve from the existing Cloud Run service | **(a)** — it is a static export, which is exactly what the other three do. Needs a DNS record jay must add; `burrow.jaylabs.xyz` never had one, which is why that chip was dead for a week | Nothing serves the Unity build. Note it is **not** blocking a chip any more — the Game chip moved to `game.jaylabs.xyz` and works |
| **D3** | **Whether to move anvil onto the durable disk** (`DEVNET_DATA=/data`, via **instance metadata**, not a file edit) | **(a)** do it in a maintenance window · **(b)** leave it | **(b) for now.** The next boot would load the 829 MB `/data/anvil.json` — a *different* chain — and may OOM. The devnet is stable today; do not trade that for durability without a window | Anvil keeps running off a Docker named volume. Survives restarts, would not survive the VM being recreated |

**D2a, still open:** does the Unity build **sit beside** the three.js game or eventually **replace
it** at `game.jaylabs.xyz`? If it replaces it, `hole.jaylabs.xyz` is a waypoint, not a home.

**Naming, settled 2026-09-23:** jay chose `hole.jaylabs.xyz` over `burrow.jaylabs.xyz`, so the
repo and the site finally share a word. The concerns raised against `hole` — it carries none of
the "rabbit hole" idiom on its own — jay has parked rather than rejected. **"Burrow" as a product
name now has nothing pointing at it**; the docs still say Burrow in prose and this file is still
called `jayverse-burrow.md`. Renaming those to Rabbit Hole is a one-word go from jay.

**Not decisions, just jay's to do** — in order:

1. **`~/.claude/CLAUDE.md` still names `~/work/alice/docs/history/`** as the central history
   folder. It is `~/work/rabbit/docs/history/` now. Every fresh session will misfile the day's
   log until that line changes — the only item here that quietly corrupts *future* work, so it
   goes first. Same fix in `feedback_per_project_history_files.md` and
   `feedback_rabbit_work_folder.md`.
2. **Install `node` on the devnet VM**, then re-enable `jayverse-devnet-reseed.timer`. It is
   `systemctl disable`d today because the VM has no node runtime, so the reseed check cannot run.

**Minor, whenever** — an "Alice — Docs" card to replace the entry point alice lost; a custom
domain for rabbit's docs (they are only on `linked0.github.io/rabbit`); the four dangling
`../topics/…` links inside the moved folders; and the **Rabbit — Current Plan** card, below.

**Cost note** (standing instruction): the devnet VM is the one line that moved. `e2-small` →
`e2-standard-2` takes it from roughly $20 to **$50–70/mo**, against a ~$120 estate. Nothing else
in this list changes the bill; D1 and D2 are cents.

### Known-stale elsewhere

- `../features/jayverse-devnet.md` and `../features/cloud-ops.md` still describe the devnet as
  "planned, not deployed" / "no VMs — Compute Engine API not enabled". Both stopped being true
  on 2026-09-14. The cost column in `../features/README.md` says `$0 / not deployed` for that
  row; it is an `e2-standard-2` now, roughly $50–70/mo against a ~$120 estate.
- The **Rabbit — Current Plan** card points at the `tasks/` folder index, not at this file. That
  was deliberate on 2026-09-03 (pinning one filename goes stale when the next task starts
  elsewhere); jay raised reversing it on 2026-09-22 and then set it aside.


> **Written for:** the agent that will implement this in `~/work/rabbit`. jay decided on
> 2026-09-16 that Jayverse runs on **three networks** — the local Anvil fork, the hosted Jayverse
> devnet, and public Sepolia — and that the portal's **Devnet** top menu becomes **Chains**, one
> page that shows all three. This file is the brief and the resumable state for that work.
>
> **What was here before:** the J2 cross-repo plan (Rabbit ⇄ Verex mandated trader). It is
> preserved verbatim in [09-16-plan.md](09-16-plan.md)
> and is not superseded by this brief — only displaced from this filename.

## 0. Summary <a id="s0"></a>

- **Status:** *(stale — this shipped; see [Current status](#status) above)* §3.1–§3.5 built
  and verified locally; **nothing committed** (jay reviews first).
  All of §5's acceptance criteria pass except the deploy-time ones, which need jay's go-ahead.
  [§6](#open) now carries ten open questions — the brief's four plus six found while
  building — each with the default I took and what is still yours to decide.
- **Repo / branch:** `~/work/rabbit`, branch `claude/chains-menu` off `main` (e4ca135). Do not
  commit to `main`; commit only when jay asks.
- **Docs move, 2026-09-22:** this file, and the `features/`·`history/` folders it links to,
  moved from alice back to rabbit. [§8](#docsmove) records what changed and
  [what is still jay's to do](#docsmove-next) — item 1 there (the stale history path in
  `~/.claude/CLAUDE.md`) affects every future session, not just this task.
- **Next step:** jay reviews the working tree. Then: commit, deploy (the deploy carries
  `ALLOW_CHAINS=true` automatically — `deploy.sh` forwards every `ALLOW_*`), confirm the menu in
  the cloud, and only then drop `ALLOW_DEVNET` from `.env`.
- **What was built** — blow-by-blow in
  [`../history/2026-09-16-rabbit-history.md`](../history/2026-09-16-rabbit-history.md):
  new `lib/chains.ts` (three chain definitions, parameterised `readChain()`, capability matrix,
  Sepolia rails); `lib/devnet.ts` reduced to the devnet-only half plus a per-service
  `chains: ChainKey[]`; `app/devnet/` → `app/chains/` rebuilt around `CHAINS`; menu item,
  `ALLOW_CHAINS`, `PUBLIC_PATHS`, permanent `/devnet` → `/chains` redirect, home card renamed.
- **Deviation from §3.3 worth knowing:** tabs were built and dropped. jay compared both and chose
  the stacked layout — a tab shortens the page but hides two thirds of the comparison.
- **Deviation from §2 worth knowing:** the rails chain definitions are **copied, not imported**.
  rabbit deploys with `--source .`, so a `file:../jayverse-rails` dependency would resolve locally
  and fail in Cloud Build. `lib/chains.ts` says so in its header and names rails as canonical.
- **Design sources:** [`../features/jayverse-devnet.md`](../features/jayverse-devnet.md) §2.4
  ("how services attach") and §4 ("what the web app shows");
  [`2026-09-14-devnet-rollout.md`](2026-09-14-devnet-rollout.md) for the devnet's URLs and
  policies; the rails chain definitions in `~/work/jayverse-rails/src/chains.ts`.
- **History:** decisions behind this brief are in
  [`../history/2026-09-16.md`](../history/2026-09-16.md) (alice); the build itself is logged in
  [`../history/2026-09-16-rabbit-history.md`](../history/2026-09-16-rabbit-history.md).

## 1. The decision and why <a id="why"></a>

jay's words: *"We use three networks — Anvil, devnet, Sepolia. Change the name of the Devnet top
menu to Chains and make it show all the information for the three chains."*

Each network has a distinct job, and the page should say so rather than pretend they are
interchangeable:

| Chain | Job | Chain id | Who points at it |
|---|---|---|---|
| **Local Anvil** | the inner loop — instant reset, snapshots, offline, break it freely | `31337` by design (see §6 — the running instance currently reports `11155111`) | the developer's own machine, and any device on jay's Tailscale tailnet |
| **Jayverse devnet** | shared state the cloud services and demos target; always on; seeded with every Jayverse contract | `313370` | Rabbit, Verex, Wallet, Exchange, DeFi, Game, Number, Auditor in the cloud |
| **Sepolia** | secondary: oracle-dependent tests (live Chainlink), MetaMask ERC-7715 popup demos, anything that needs a public chain | `11155111` | Verex resolution tests, `/live/agent/console` in the cloud, wallet demos |

Two consequences the page must reflect:

- **Alchemy only sees Sepolia.** Its data APIs, webhooks, bundler, and gas manager index chains
  Alchemy runs. They cannot see `31337` or `313370`. On those two chains the same capability is
  self-hosted (Anvil RPC + `/ws`, Otterscan `ots_*`, the seed's Registry). The Chains page shows,
  per capability, which implementation each chain uses — never an Alchemy example labelled as
  the devnet. Background: Tech Notes #55 ("An app key is a budget") and #56 (capability matrix).
- **Two Alchemy keys stay.** Local fork upstream and devnet fork upstream use separate Alchemy
  apps (jay, 2026-09-16: keep as is). The page may name the app *role*, never the key.

## 2. What exists today (read before building) <a id="exists"></a>

All paths relative to `~/work/rabbit`.

- **Menu:** `app/Nav.tsx` — `{ href: "/devnet", ko: "데브넷", en: "Devnet", code: "DEVNET", pub: true }`,
  gated by `ALLOW_DEVNET=true` (present in `.env`; `deploy.sh` forwards every `ALLOW_*` to Cloud
  Run). Menu visibility rule: `menuVisible()` in the same file — env flag first, then `pub`.
- **Route:** `app/devnet/page.tsx` (server component, `force-dynamic`, Grafana-style stat row +
  panels: recent blocks, endpoints, services on this chain, ecosystem contracts from the on-chain
  Registry) and `app/devnet/AutoRefresh.tsx` (5 s `router.refresh()`, pauses when tab hidden).
- **Data layer:** `lib/devnet.ts` — `DEVNET_URL`/`DEVNET_RPC`/`DEVNET_EXPLORER`/`DEVNET_CHAIN_ID`,
  `fetchStatus()` (devnet `/status` JSON: `chainId, healthy, mode, forkBlock, blockNumber,
  latestBlockTime, proxyUptimeSeconds, faucet{…}, registry{…}`), `fetchRegistry()` (reads the
  Registry **contract**, not the JSON copy — keep that principle), `fetchRecentBlocks()`,
  `probe()`, `CONTRACT_GROUPS`, `SERVICES`.
- **Middleware:** `middleware.ts` `PUBLIC_PATHS` contains `"/devnet"` (read-only page, no keys).
- **Home card:** `lib/jayverse.ts` has a `key: "devnet"` ecosystem card linking to `/devnet`.
- **Env:** `.env.example` §"Jayverse 데브넷" — `NEXT_PUBLIC_DEVNET_RPC`, `NEXT_PUBLIC_DEVNET_EXPLORER`,
  `NEXT_PUBLIC_DEVNET_JUSD` (defaults are the production values); `ANVIL_RPC_URL`
  (default `http://127.0.0.1:8545`); `SEPOLIA_RPC` (server-side, currently used by the C2
  bundle demo); `CLOUD_AGENT_RPC_URL` for the cloud console.
- **Rails:** `~/work/jayverse-rails/src/chains.ts` already exports all three — `jayverseDevnet`
  (313370, `https://devnet.jaylabs.xyz/rpc`, `wss://…/ws`, Otterscan), `localFork` (31337), and
  viem's `sepolia` — plus `chains = { jayverseDevnet, sepolia, localFork }`. Import these; do not
  redefine chains in rabbit.
- **Devnet edge:** `~/work/jayverse-devnet/proxy/src/server.js` serves `/status` (shape above),
  `/rpc` with the method allowlist, `/ws`, `/faucet`, `/admin/*`. Otterscan is its own host,
  `https://explorer.devnet.jaylabs.xyz`.
- **Local Anvil right now** (do **not** kill it; it holds jay's working state):
  `anvil --chain-id 11155111 --state ./anvil-sepolia-state.json --state-interval 60`, listening on
  `127.0.0.1:8545` only. See §4 and §6.

## 3. What to build <a id="build"></a>

Order matters; each step is shippable on its own.

### 3.1 Rename the menu and route, keep the old URL
- `app/Nav.tsx`: the item becomes `{ href: "/chains", ko: "체인", en: "Chains", code: "CHAINS", pub: true }`.
  Because the menu is env-gated, **`ALLOW_CHAINS=true` must be added to `.env` in the same
  change**, and the Cloud Run env must receive it on deploy (`deploy.sh` forwards `ALLOW_*`).
  Leave `ALLOW_DEVNET` in place until the deploy is confirmed, then it can go. Write the reason
  in the comment block the way the existing entries do — the file's comments are its changelog.
- Move `app/devnet/` → `app/chains/`. Add `/devnet` → `/chains` to the existing `redirects()` in
  `next.config.*` (it already has a redirects block) so bookmarked links keep working. Add `"/chains"` to
  `PUBLIC_PATHS`; keep `"/devnet"` there too while the redirect exists.
- `lib/jayverse.ts`: the ecosystem card's `url` → `/chains`; retitle to "Jayverse Chains" or keep
  "Jayverse Devnet" as the *devnet's* card and add nothing — jay's call; default to renaming the
  card since the page now covers three chains.
- Page `metadata.title` → "Chains — Jayverse".

### 3.2 A chain model instead of devnet constants
- New `lib/chains.ts` (or extend `lib/devnet.ts` and rename) exporting a `CHAINS` array with one
  entry per network: `key` (`local` | `devnet` | `sepolia`), display names ko/en, `chainId`,
  `rpc` (server-side URL), `ws?`, `explorer?` (Otterscan / Etherscan Sepolia), `role` (one-line
  purpose from §1), `blockTime` (1 s / 1 s / 12 s), `statusUrl?` (devnet only),
  `faucet?` (devnet: `/faucet`; Sepolia: link to a public faucet; local: "anvil accounts are
  prefunded"), and a `capabilities` map (see 3.4).
- RPC URLs come from env with the existing defaults: `ANVIL_RPC_URL`, `DEVNET_URL`/`…_RPC`,
  `SEPOLIA_RPC`. The local RPC is read **server-side only** and will normally be unreachable from
  Cloud Run — that is expected, not an error (3.3).
- Reuse `fetchRecentBlocks`/`probe` by parameterizing them on a viem client per chain. Registry
  reads apply to the devnet only, unless the local fork has been seeded (detect: Registry address
  known and has code).

### 3.3 The page: three columns of the same facts
- **Stat row per chain** (one card each, same layout so the eye can compare): status
  (healthy / unreachable), chain id, latest block, block time, and one chain-specific line:
  devnet → fork block + edge uptime + faucet left (from `/status`); Sepolia → finalized block or
  "public testnet"; local → "not reachable from here" when the probe fails from the cloud.
- **Recent blocks**: keep the devnet panel as is. For Sepolia, last 8 blocks via the RPC. For
  local, only when reachable. Ages measured against each chain's own head, as the devnet page
  already does (Anvil's clock runs behind real time; the comment in `page.tsx` explains).
- **Endpoints** table, one row per chain: RPC, WS, explorer, status page, faucet. For the local
  chain print **both** `http://127.0.0.1:8545` and the Tailscale form `http://100.111.162.0:8545`
  (jay's machine's tailnet IP) with the note from §4.
- **Services on this chain**: the existing devnet table, plus a column or badge per service
  saying which chain(s) it targets today (devnet primary; Sepolia for the cloud console and
  oracle tests; local for development). Source of truth for that mapping is the rollout task
  and each repo's env; do not guess — read the deployed env or ask.
- **Ecosystem contracts**: Registry-backed for the devnet (unchanged). For Sepolia, a short static
  list of the base rails the fork inherits (EntryPoint, Chainlink feeds used by `feeds.ts`, the
  MetaMask delegation framework) with Etherscan links. For local: "same as devnet after seed".
- Keep `AutoRefresh` at 5 s; probing three chains is still cheap, but **skip the local RPC on the
  server when `process.env.K_SERVICE` is set** (Cloud Run) to avoid a 2 s timeout per refresh.

### 3.4 Capability matrix panel (the Alchemy point, made visible)
One table, capabilities as rows, chains as columns — this is what makes "Chains" more than three
copies of the devnet page:

| Capability | Local Anvil | Devnet | Sepolia |
|---|---|---|---|
| RPC | Anvil direct | Anvil via rpc-proxy | Alchemy Node API |
| New heads / logs | `eth_subscribe` on Anvil ws | `/ws` | Alchemy Websockets |
| History / transfers | `ots_*` if Otterscan is run locally, else none | Otterscan `ots_*` | Alchemy Transfers / Receipts |
| Token balances | direct reads | direct reads + Registry | Alchemy Token API or direct |
| Push on activity | — | poll `/ws` / watchtower | Alchemy Webhooks |
| 4337 bundler | — (not yet) | — (self-hosted Rundler/Alto: planned) | Alchemy Bundler |
| Sponsored gas | — | own paymaster (planned) | Alchemy Gas Manager |
| Simulation | `eth_call`, `debug_traceCall` | same | userOp Simulation / Trace |
| Oracles | frozen at fork block | frozen at fork block | live Chainlink |
| MetaMask 7715 popup | no (chain not in MetaMask's list) | no | yes |

Render the "—" and "planned" cells honestly; a planned row is a link to the devnet doc's phase
table, not a green dot.

### 3.5 Docs and history
- Update `docs/features/README.md` in alice only if the service table mentions the `/devnet` URL.
- Append a Cause → Reasoning → Change → Result block to
  `~/work/alice/docs/history/2026-09-16-rabbit-history.md` (create the file if absent; cite this
  brief at the top).
- Keep this file's §0 current as steps land (branch, what is merged, what is next).

## 4. Reaching the local Anvil from other devices (Tailscale) <a id="tailscale"></a>

Yes — with one change. jay's machine is on the tailnet at `100.111.162.0` (gitboard is already
served that way on :4321). Anvil, however, **binds to `127.0.0.1` by default**, so today
`http://100.111.162.0:8545` refuses connections from the phone or the home desktop.

- Restart Anvil with `--host 0.0.0.0` (the state file keeps everything; only the listener changes):
  ```bash
  anvil --host 0.0.0.0 --chain-id 31337 --state ./anvil-sepolia-state.json --state-interval 60
  ```
  Do this **only when jay asks** — the current instance is his working chain. Chain id: see §6.
- Tailscale is the only exposure. Do **not** open 8545 on the LAN router or use a public tunnel;
  Anvil has no auth, and `anvil_setBalance` etc. are open to anyone who can reach the port. On
  the tailnet that is jay's own devices, which is acceptable for a throwaway chain.
- For MetaMask on the phone: add a custom network with RPC `http://100.111.162.0:8545`, chain id
  matching the node. `http` (not `https`) is accepted by MetaMask mobile for custom RPCs.
- Alternative without changing Anvil's bind: `tailscale serve --bg 8545` on the Mac proxies the
  tailnet to localhost with TLS (`https://<machine>.<tailnet>.ts.net`). Mention both on the page;
  recommend `--host 0.0.0.0` for simplicity.

## 5. Acceptance <a id="accept"></a>

- Menu reads **Chains** (ko: 체인) at the same position; `/devnet` redirects to `/chains`; both
  public without login.
- `/chains` shows three chain cards with live status for devnet and Sepolia, and "not reachable
  from here" for local when rendered in the cloud; locally with Anvil up, all three are live.
- Endpoints table lists the Tailscale RPC form for local.
- Capability matrix rendered with honest "—/planned" cells.
- `pnpm build` passes (rabbit has no test script); no new `.env` value is required for the page
  to render other than `ALLOW_CHAINS=true`.
- History entry written; this file's §0 updated; nothing committed to `main`.

## 6. Open questions for jay <a id="open"></a>

> **How to read this (2026-09-16):** every item has a working default in the code, so the page
> ships either way. None of them is *decided* — a default is what I did so the work could
> finish, not an answer. 1–4 were in the brief; 5–10 came out of building it.

### Answered with a default, still yours to decide

1. **Local chain id — displayed, not fixed.** Confirmed live: the node reports `11155111`
   (Sepolia's id) because it was started as a Sepolia fork with the default id. The design
   (rails `chains.ts`, wallet, delegation code) expects the local fork at `31337`. Keeping
   `11155111` means MetaMask treats the local fork as Sepolia, and EIP-155 scopes replay
   protection to the chain id — so a tx signed on the fork is valid on real Sepolia.
   **Default taken:** the card shows the *reported* id in the error colour and prints the
   `--chain-id 31337` fix; the node was **not** restarted (§7 forbids it without your say-so).
   **Recommendation:** restart with `--chain-id 31337` when convenient. The state file is
   unaffected.

2. **Ecosystem card title — renamed.** **Default taken:** "Jayverse Devnet" → "Jayverse Chains"
   in `lib/jayverse.ts`, per §3.1's stated default, since the card now leads to a page covering
   three networks. Say so if you would rather keep a devnet-only card.

3. **Sepolia RPC in the cloud — public fallback.** `SEPOLIA_RPC` is a server-side secret that
   `deploy.sh` binds to `ANVIL_RPC_URL` only when `CHAIN=sepolia`, so in production it is unset
   and the Sepolia column would have rendered blank (which reads as "Sepolia is down").
   **Default taken:** fall back to `https://ethereum-sepolia-rpc.publicnode.com` — the same
   public node `app/live/7702` already uses. These are head-block reads with no key.
   **Still open:** forward the real `SEPOLIA_RPC` to Cloud Run instead? It would be one more
   secret binding in `deploy.sh` for a marginally more reliable read.

4. **The local column in the cloud build — kept.** **Default taken:** the card stays and reads
   "not reachable from here", and `readChain()` skips the RPC entirely when `K_SERVICE` is set,
   so it costs nothing. The three-column layout is the point of the page; dropping a column in
   production would make the cloud page a different page. Say so if you would rather hide it.

### New — found while building

5. **rails is copied, not imported, and nothing enforces the copy.** §2 said "import these; do
   not redefine chains in rabbit". rabbit cannot: `scripts/deploy.sh` uses
   `gcloud run deploy --source .`, which uploads only the rabbit directory, so a
   `file:../jayverse-rails` dependency resolves on your laptop and **fails in Cloud Build** — at
   deploy time, the worst place to find out. **Default taken:** ids and URLs copied verbatim
   into `lib/chains.ts`, under a header naming rails as canonical and saying the two must be
   kept in step by hand. **Decision needed:** publish `jayverse-rails` to a registry (npm, or a
   private Artifact Registry) so every repo imports one definition — worth doing the moment a
   third repo needs the chain list, and not obviously worth it before then.

6. **`ANVIL_RPC_URL` means different things locally and in the cloud.** Found and fixed here,
   but the trap is still live for the next reader. `deploy.sh` binds it to the
   `rabbit-devnet-rpc` secret (`CHAIN=devnet`), so in the deployed service it holds the
   **devnet's** URL — "the chain this deployment talks to", as deploy.sh's own comment says.
   Reading it unguarded printed the devnet's URL in the *Local Anvil* endpoints row in
   production, labelled as the local node. **Fixed:** `lib/chains.ts` ignores the env entirely
   when `K_SERVICE` is set. **Decision needed:** rename the variable to something that means
   what it holds (`CHAIN_RPC_URL`?) across rabbit, `deploy.sh` and the secret bindings — a small
   change that touches the deploy path, so it wants your go-ahead rather than mine.

7. **Tabs are the lever if the page ever feels slow.** A tabbed version was built and dropped
   (you compared both and chose the stacked layout). Worth recording *why* it might come back:
   in that version the tab was the **fetch boundary**, not just a view — only the selected chain
   was read, so the 5 s refresh cost roughly a third as much. The stacked page reads all three
   every refresh. Today that is cheap (two 1 s chains on our own infrastructure, Sepolia cached
   for 12 s). If it stops being cheap, the tab version is the fix, and it is a known-good design
   rather than a new idea.

8. **When does `ALLOW_DEVNET` go?** It controls no menu now. §3.1 says to leave it until the
   deploy is confirmed. **Sequence:** deploy → see "체인 / Chains" in the cloud menu → then
   remove `ALLOW_DEVNET` from `.env` (and, optionally, the stale `ALLOW_AA` /
   `ALLOW_AGENTCONSOLE` / `ALLOW_AUDITOR` beside it, dead since 2026-09-15). Removing it before
   that confirmation leaves no way to roll back the menu with one line.

9. **§1's service→chain table disagrees with the deployed env, and the page follows the env.**
   §1 lists `/live/agent/console` under Sepolia. In the deployed service `ANVIL_RPC_URL` is
   bound to `rabbit-devnet-rpc` (`CHAIN=devnet` in `scripts/deploy.env`), so the cloud console
   targets the **devnet**. The badges on the page are read from the env and `deployments.json`,
   not from §1, so they say devnet. **Decision needed:** is the env right and §1 stale, or has
   the console drifted off the chain it was meant to be on?

10. **`features/README.md`'s Devnet row is stale.** §3.5 said to touch it only if the service
    table mentions rabbit's `/devnet` URL — it does not (it names `devnet.jaylabs.xyz`), so I
    left it alone. But its status column still reads "planned, not deployed", which stopped
    being true on 2026-09-14. Out of this brief's scope; worth a one-line fix in whichever
    change next touches that file.

11. **The devnet needs re-seeding, and nothing watches for that.** Confirmed 2026-09-16:
    `eth_getCode` at the devnet's Registry address returns `0x`, so all 21 Registry-backed
    addresses render as missing. The chain has been reset since `seededAt 2026-09-14`.
    **Default taken:** the page says so plainly and collapses the misses; it does not pretend.
    **Decision needed:** re-run `scripts/seed.ts` (deploys ~21 contracts to the shared devnet —
    not mine to trigger), and separately, whether anything should *notice* this without a human
    looking at the page. The devnet's `/status` reports the address the seed last wrote, so a
    check comparing it against `eth_getCode` would catch the next reset automatically.

12. **A third hand-copied address book.** Verex's CTF backbone (jUSD, ConditionalTokens,
    CTFExchange, on both the devnet and Sepolia) is now copied into `lib/devnet.ts` from verex's
    `packages/contracts/deployments.json`, for the same reason as the rails definitions in
    [§6.5](#open): rabbit deploys with `--source .` and cannot read a sibling repo.
    `NEXT_PUBLIC_DEVNET_JUSD` in `.env.example` already carried one of these, which is how the
    duplication started. Same fix as 5 — publish, or accept the hand-sync and say so in the
    comments (done).

## 7. Policies (jay's, non-negotiable) <a id="policy"></a>

- Never `git reset --hard`; never commit before jay's review; never commit to `main`; one branch
  for this whole request (`claude/chains-menu`).
- Never touch `~/work/rabbit/docs/memo-no-up.txt` and never copy a private key into any file.
- Do not kill or restart jay's running Anvil (pid on :8545) unless jay says so in the same
  conversation.
- Reply format per `~/.claude/CLAUDE.md` (English check, Answer, Today's phrases, Korean).

## 8. Docs move: alice → rabbit (2026-09-22) <a id="docsmove"></a>

**This file's own address changed.** `docs/features/`, `docs/tasks/` and `docs/history/` moved
back from `~/work/alice` to `~/work/rabbit` on 2026-09-22 (jay). They moved as one unit because
they are wired to each other by 280 relative links — 139 into `../tasks/`, 126 into
`../features/`, 15 into `../history/` — and any subset left behind would have snapped all of
them. Moving all three kept every one intact.

Round trip: these folders lived here until 2026-09-14, spent eight days in alice, and are home
again. Both repos publish GitHub Pages, so nothing went dark:

| | Pages source | Docs URL shape |
|---|---|---|
| **rabbit** | `main` → `/docs` | `https://linked0.github.io/rabbit/html/docs/…` |
| **alice** | `main` → `/` (root), custom domain | `https://alice.jaylabs.xyz/docs/html/docs/…` |

### What jay should do next <a id="docsmove-next"></a>

1. **Update `~/.claude/CLAUDE.md`.** The "Daily action log" rule still names
   `~/work/alice/docs/history/` as the central history folder. It is now
   `~/work/rabbit/docs/history/`. Until that line changes, every fresh session will write the
   day's log into the wrong repo — this is the one item that silently corrupts future work, so
   do it first.
2. **Update the two memory files that name alice** —
   `feedback_per_project_history_files.md` and `feedback_rabbit_work_folder.md` in
   `~/.claude/projects/-Users-jay-work/memory/`. Same reason as 1.
3. **Confirm the three alice cards resolve** once both pushes land. Pages rebuilds take a minute
   or two: `https://linked0.github.io/rabbit/html/docs/features/README.html`, and the `tasks/`
   and `history/` indexes beside it.
4. **Decide whether rabbit's docs deserve a custom domain.** alice has `alice.jaylabs.xyz`;
   rabbit's docs are only on `linked0.github.io/rabbit`. Not required — just now visible, since
   alice's landing page links out to it three times.
5. **Four links inside the moved docs now dangle** (they point at alice-only content):
   `../topics/README.md`, `../topics/pocs-dvt.html`, `../topics/raw/README.md`,
   `../topics/raw/2026-09-22-gemini-youtube.md`. Everything else the folders reached — images,
   knowledge, `runbooks/cloud-sql-setup.md` — exists in rabbit too. Worth a rewrite to absolute
   `alice.jaylabs.xyz` URLs, or leaving until someone follows one.
6. **`docs/rabbit-design.md` exists in both repos** and its two links to `features/ai-chat.md`
   resolve here and dangle in alice's copy. The duplicate pair is older than this move; flagging
   it, not fixing it.

### What was changed to make the move work

- **Both docs generators gained absent-folder guards.** alice's `generate-docs-html.mjs` would
  have crashed on the missing folders (rabbit's already had the guards from the 2026-09-14 move
  in the other direction — they are kept, since a guard that has proven itself once is worth a
  `stat`).
- **alice's `docs/logs.html` was deleted, and its generator now exits early.** That page is built
  from `docs/history/*.md` and nothing else, so with the folder gone it was 93 dead links.
  `generate-logs-html.mjs` says so and stops. The logs render here instead — 109 entries.
- **A pre-existing 404 was fixed on the way past.** Since 2026-09-14 rabbit's index linked to
  `linked0.github.io/alice/html/docs/…`, which never resolved: alice serves from its repo root,
  so the working prefix is `/docs/html/docs/…`. Those cards are local again, so the bad URL is
  simply gone.
- **The card *labels* were wrong too, not just the hrefs** (jay spotted it from the rendered
  page). Three cards still read `docs/features/README.md`, `docs/tasks/`, `docs/history/` — paths
  that no longer exist in alice. They now read `rabbit · docs/…`, with the full URL on hover,
  following the `·` separator the Eng card already uses. The **"Rabbit — Docs"** card went the
  same way: it was titled Rabbit but pointed at alice's own docs index. One consequence to
  note — alice's own 1516-page docs index now has no card pointing at it; Knowledge Notes, Eng
  and Memo cover the parts jay actually opens, but a dedicated "Alice — Docs" card would close
  the gap if he wants one.
- **alice has two index pages that must be hand-synced.** `alice/index.html` is what Pages
  actually serves (it carries `<base href="docs/">`); `alice/docs/index.html` is a near-copy.
  Both were updated. A change to one that misses the other goes unnoticed.
