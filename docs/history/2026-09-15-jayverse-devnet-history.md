# 2026-09-15 — Jayverse devnet rollout (step 5)

> Source doc: [`../tasks/2026-09-14-devnet-rollout.md`](../tasks/2026-09-14-devnet-rollout.md).
> Yesterday's build and provisioning: [`2026-09-14-jayverse-devnet-history.md`](2026-09-14-jayverse-devnet-history.md).
> Cross-cutting cloud decisions: [`../features/cloud-ops.md`](../features/cloud-ops.md).

### The devnet VM lost its network entirely; the chain did not survive the recovery

- **Cause:** noticed when a contract deploy against `devnet.jaylabs.xyz` timed out. HTTPS and SSH
  were both gone while the instance still reported `RUNNING`.
- **Reasoning / evidence:** the serial console showed the VM could not reach GCP's own metadata
  server at `169.254.169.254` — a link-local address that is always available — so the guest's
  network stack was broken, not the application. No OOM, no kernel panic in the retained buffer,
  and the onset had already scrolled out of it. Checked afterwards and ruled out the obvious
  suspects: memory was not tight (573 MB of 1976 MB used, anvil itself only 64 MB), and there is no
  recorded host-maintenance or live-migration event. **The cause is still unknown.**
- **Change:** recovered with a stop/start rather than a hard reset. Static IP and the persistent
  disk survived; the repo, secrets and stack came back on their own via the startup script and the
  systemd unit.
- **Result:** back up in a few minutes — but the chain restarted empty at the fork pin, which
  exposed the next finding. Open: an unexplained total network loss hours after provisioning is a
  reason not to trust this for a live demo yet. Watch for recurrence; if it repeats, `e2-medium`
  (the task doc's original sizing) is the next move.

### anvil's periodic state write is not atomic — an unclean stop loses the chain

- **Cause:** after the forced stop, the Registry had no code and the chain was back at the fork pin,
  even though `/data/anvil.json` existed on the persistent disk.
- **Reasoning:** the graceful shutdown timed out and the VM was force-stopped, so anvil was killed
  mid-write. `--state-interval` does not write atomically, so the file was truncated; anvil could
  not load it, started fresh — and then **overwrote it with new state**, destroying the evidence.
  The distinction matters: a *clean* stop (`docker compose stop`, or the systemd unit's `ExecStop`)
  flushes properly and does preserve the chain, which was verified on 2026-09-14. Only an unclean
  stop loses it.
- **Change:** GCS snapshots moved from nightly to **hourly**, so the worst case is an hour rather
  than a day; the runbook's failure table gained the symptom, the cause, and the restore path.
- **Result:** persistence is bounded rather than fixed — the snapshot is the real backup, not the
  state file. One useful accident: the Registry redeploys to **the same address** every time
  (deterministic from the seed's nonce), so a reset does not invalidate anything pinning it.

### Step 5 begun: wallet, defi and token now target the devnet

- **Cause:** jay: apply it to all the services — the Jayverse estate is a portfolio demo, so there
  is nothing to protect by going slowly.
- **Reasoning:** `@jayverse/rails` cannot be a dependency yet — it has no git remote, and Cloud Run
  builds only from each repo's own source, so a `file:../jayverse-rails` path would resolve locally
  and break in the cloud. Took the fallback the task doc allows: **vendor the chain definition per
  repo**, each marked `TODO: move to @jayverse/rails`, with an API identical to the package so the
  later swap is mechanical.
- **Change:**
  - **wallet** — `lib/jayverse-devnet.ts` (chain + Registry lookup that throws on an unset name
    rather than returning the zero address); devnet added as the **first** built-in network in the
    MV3 extension; `CHAIN=devnet` selector in `lib/chain.ts` with devnet as the cloud default; the
    simulate route allows the devnet explicitly, so previews fork from the chain the transaction
    will actually land on. Typechecks clean.
  - **defi** — `deploy-defi.mjs` refused any non-local RPC that was not chain 11155111. It now
    allows the devnet too and writes a separate `addresses.devnet.json`.
  - **token** — `Deploy.s.sol` takes a `USDC_ADDRESS` override so mode A uses Circle's forked test
    USDC instead of deploying a second stablecoin, and no longer reverts when it cannot seed
    liquidity: it deploys and reports, because a pool can be funded afterwards.
  - **seed** — deals the deployer a USDC float first. Rather than writing the balance storage slot
    (which depends on the token's layout and breaks silently when the implementation changes), it
    **impersonates Circle's `masterMinter`**, authorises the deployer as a minter, and mints.
- **Result:** both deploy on the live devnet. Registry now holds **47 entries** including `JYVE`
  `0xF12F…B410`, `Exchange` `0x3411…aAB2`, `LiquidityPool`, `jeETH`, `jweETH`, `MockAVS`. The
  Exchange pool is seeded with **real forked Circle USDC** — 1,000,000 JYVE against 250,000 USDC,
  and `exchange.usdc()` reads `0x1c7D…7238`, Circle's address. Two bugs of mine on the way: the
  deploy key was passed via a shorthand naming a variable that did not exist, and the forge steps
  ran from each repo root when the foundry project is in `contracts/`.
- **Still blocked:** verex (no devnet target, operator path assumes live Chainlink), personas
  (pending its move into `jayverse-token`), bridge (out of scope), ofa (no repo).
- **Known limitation:** the per-service seed steps are **not** idempotent — unlike the Registry and
  the delegation framework, they redeploy on every run rather than skipping what is already on
  chain. The task asks for idempotency per reset, so this is unfinished.

### Root-caused the VM outage: the chain's DNS traffic took down the metadata server

- **Cause:** jay asked why the devnet VM crashed. The first pass had ruled out memory and host
  maintenance but found no cause; `journalctl -b -1` turned out to be persistent and had it.
- **Reasoning / evidence:** `dockerd: [resolver] more than 1024 concurrent queries`, then
  `dial udp 169.254.169.254:53: i/o timeout`, then `systemd-networkd: ens4: Failed`, then journald's
  watchdog firing, and only later `network is unreachable`. A forking anvil makes an upstream call
  per cache miss — thousands in a burst on a cold fork — and each needs a DNS lookup. Those went
  through Docker's embedded resolver, which forwards to the host resolver; on GCE that is the
  **metadata server**, which is also what the VM depends on to stay healthy. The chain's own
  traffic and the VM's life support shared one path, and the chain out-ran it. Self-inflicted, not
  a GCP fault — and it explains the delay between cause and symptom: the damage accumulated over
  hours of heavy seeding before the network finally gave up.
- **Change:** the anvil service sets `dns: [8.8.8.8, 1.1.1.1]`, so chain traffic never resolves
  through the metadata server. Earlier hardening stands as a backstop: `devnet-netwatch.timer`
  reboots if metadata is unreachable for 5 minutes, 2 GB of swap, and — a gap worth naming — an
  **alert policy and email channel**, because the uptime check created on 2026-09-14 notified
  nobody, which is why the outage was noticed only when a deploy timed out.
- **Result:** verified `HostConfig.Dns = [8.8.8.8 1.1.1.1]` with the fork still working.

### Correction: a truncated state file does not reset the chain — it stops anvil booting

- **Cause:** recreating the anvil container to apply the DNS fix, and watching it restart-loop.
- **Reasoning:** yesterday's entry said a truncated state file makes anvil start fresh and
  overwrite it. That was wrong. Anvil refuses to start:
  `invalid value '/data/anvil.json' for '--state <PATH>': failed to parse json file: EOF while
  parsing a string`. The container then loops forever — the node is bricked, not reset. Worse in
  effect, but louder, and the earlier empty-chain case must have had a different cause.
- **Change:** the entrypoint validates the state file before boot (last non-whitespace byte must be
  `}`, checked without python or jq since the Foundry image has neither) and **quarantines** a bad
  one as `anvil.json.corrupt-<timestamp>`, starting from the fork pin rather than looping. Added
  `stop_grace_period: 90s` — the default 10s was not enough for anvil to finish dumping a
  multi-megabyte overlay, which is what truncated it in the first place.
- **Result:** verified in the wild — the bad file was quarantined and anvil came up healthy on its
  own. Runbook updated for both.

### jUSD replaces MockUSDC as the Jayverse dollar

- **Cause:** jay: rename MockUSDC, and have **all** systems use jUSD; consider external stablecoins
  like USDC later. This reverses the task doc's fixed decision ("plain USDC via the fork").
- **Reasoning:** the old name became actively wrong the day the devnet started forking Circle's
  real USDC — two tokens answered to one name and only one was Circle's. `jUSD` over `USDJ` because
  the codebase already reads JYVE / jeETH / jweETH, where the `j` prefix means "Jayverse's version
  of X". The reversal also **simplifies** things rather than complicating them: both node modes now
  deploy the same stablecoin, so a service genuinely cannot tell which mode it is on — which is
  what the design wanted — and the seed no longer needs to impersonate Circle's `masterMinter` to
  obtain a token it cannot mint.
- **Change:** `MockUSDC.sol` → `JUSD.sol` ("Jayverse USD", symbol `jUSD`, 6 decimals so it stays a
  drop-in); `Deploy.s.sol` deploys it by default with `STABLE_ADDRESS` left as an override for an
  external stablecoin; tests updated; the `dealUsdc` impersonation removed from the seed. Circle's
  USDC stays registered as an available rail, unused by any pool.
- **Result:** 17/17 token tests pass; deployed on the devnet with a live pool — 1,000,000 JYVE /
  250,000 jUSD.

### Verex and Rabbit point at the devnet

- **Cause:** jay: finish the Verex app, then Rabbit.
- **Reasoning:** both repos turned out to be better designed for this than expected. Verex switches
  chains through one `CHAINS` map keyed by `VEREX_CHAIN_ID`, and rabbit deliberately reads the
  chain id **from the RPC** rather than an env var — its comment cites verex's own experience of
  config and reality diverging. The interesting work was not wiring but two guards that were right
  to fire.
- **Change:**
  - **verex** — `packages/sdk/src/jayverse-devnet.ts` (vendored chain) registered in `CHAINS`;
    `deploy.env.prod` set to chain 313370 and the devnet RPC. The demo-mnemonic guard uses
    loopback, not chain id, to decide whether an adversary exists, so the public devnet failed it.
    Rather than bypassing it, `IS_JAYVERSE_DEVNET` was added as an explicit, documented exception:
    the devnet is disposable and faucet-funded so there is nothing to steal, and the seed funds
    exactly those anvil-derived accounts — but the residual risk is **griefing, not theft**, so the
    operator key is deliberately left outside the exception.
  - **rabbit** — `verify-delegation.mjs` takes its RPC from `ANVIL_RPC_URL` and sends
    `ADMIN_TOKEN` as a bearer header, because warping time is an admin method on the hosted devnet
    (a bare anvil ignores the header, so one script serves both). New
    `scripts/sync-devnet-delegation.mjs` writes `.delegation-anvil.json` from the devnet seed's
    nested environment, so rabbit **adopts** the framework the seed deployed instead of deploying a
    second one onto the same chain. `scripts/deploy.env` points at the devnet.
- **Result:** rabbit's three delegation checks **all pass on the devnet** — 4 USDC withdrawn within
  the delegation, `ERC20TransferAmountEnforcer:allowance-exceeded` on the cap, and
  `TimestampEnforcer:expired-delegation` after the warp, with the balance unmoved in both refusals.
  The task doc records these as failing on every chain on 2026-09-14. Stated precisely: they pass
  now against an environment rebuilt from the seed's nested record; whether the original local
  failure had the same cause was not reproduced.
- **Still open:** neither service has been **redeployed** (step 6), so the running Cloud Run
  revisions still target Sepolia. Verex's operator still resolves via live Chainlink rather than
  `feeds.ts`. Game, personas, number and the auditor row are untouched.

### Step 6 done: the estate is deployed against 313370, and everything is on main

- **Cause:** jay: commit, push and deploy. The Jayverse estate is a portfolio demo, so the
  standing "never commit to main" rule was set aside deliberately for this request.
- **Reasoning:** the earlier objection to pushing rabbit — that its three unpushed doc-migration
  commits broke the image build — had been *fixed* rather than waived, so it no longer applied.
  In alice only the two devnet files were committed: the working tree also held another session's
  in-progress work, which is not mine to commit, and that dirty tree is why alice's main was
  advanced with `push HEAD:main` rather than a branch switch.
- **Change:** all seven repos on `main`. `jayverse-devnet` (`d606616`) and `jayverse-rails`
  (`392bfce`) created as new **private** GitHub repos, matching the other `jayverse-*` repos —
  only `rabbit` is public. Deployed: rabbit `rabbit-00142-m56`, verex api `00017-wr7` + web
  `00018-b6l`, `jayverse-wallet-00004-8t9`, jayverse-defi to Firebase Hosting, jayverse-exchange.
- **Result:** all six public endpoints answer — www, verex, wallet, defi, exchange, devnet.
  jayverse-number needed no change (read-only, no devnet config). Out of scope as agreed: bridge
  (contracts do not exist), OFA (no repo), personas (pending its move into jayverse-token).

### A build-time trap in DeFi: the address book was chosen by vite command, not by chain

- **Cause:** preparing the DeFi deploy and checking what the bundle would actually contain.
- **Reasoning:** `vite.config.ts` selected `command === "serve" ? addresses.local : addresses.sepolia`,
  so **every production build baked in Sepolia addresses**. This is a worse class of bug than the
  runtime misconfigurations found earlier today: a runtime mistake can be corrected with an env
  var, but contract addresses compiled into the JavaScript cannot — the app would have called
  contracts that do not exist on the chain it was talking to, with nothing able to fix it short of
  a rebuild. It would also have looked like a contract bug rather than a build bug.
- **Change:** `CHAIN` selects the address book (devnet by default), and the missing-file error
  names the deploy command for that chain instead of assuming Sepolia.
- **Result:** verified on the live site rather than locally — the bundle served from
  defi.jaylabs.xyz contains the devnet LiquidityPool `0x3a75…9078` and not the Sepolia one.

### Two Alchemy API keys leaked into the session transcript

- **Cause:** both were printed by commands run during this work, by two different routes:
  `cat /proc/1/cmdline` on the anvil container (which carries `--fork-url` in argv), and verex's
  `deploy.sh`, which prints its resolved seed env for debugging.
- **Reasoning:** every secret in this work was otherwise handled without printing — piped between
  `gcloud secrets` and a file, or checked by length and host only. The blind spot is worth naming
  precisely: **it is not enough to avoid printing secrets; one has to know which commands print
  them for you.** Process argv and debug env dumps are both routes that look harmless.
- **Change:** command output is now piped through a redactor
  (`sed 's|/v2/[A-Za-z0-9_-]*|/v2/REDACTED|g'`) rather than relying on remembering. Runbook §6b
  records that the fork URL is visible in `ps` and `docker inspect` on the VM.
- **Result:** **open — jay must rotate both keys.** `Jk0zz6…` (rabbit-sepolia-rpc,
  devnet-sepolia-rpc) and `yxP6Uh…` (verex-rpc-url-*). Testnet keys, so the exposure is quota
  rather than funds, and bounded by the $50/month account cap — but per-app limits would stop one
  stolen key consuming another service's budget.

### Alchemy keys rotated; local and cloud keys deliberately split

- **Cause:** two Alchemy keys were printed into the session transcript during this work (see the
  previous entry). jay decided on the split: the old key for local development, a new one for the
  cloud.
- **Reasoning:** a key written somewhere you do not control is no longer a secret, so rotation was
  hygiene rather than an emergency — the keys are testnet, so the exposure is quota theft bounded
  by the account's $50/month cap, not funds. The split is sound on its own terms: separate keys
  give per-app usage visibility and stop one leak reaching the other environment.
  **But it would have silently undone itself.** `rabbit/scripts/deploy.sh` does not only *read*
  secrets, it *uploads* them: `upsert_secret rabbit-sepolia-rpc "${CLOUD_AGENT_RPC_URL:-}"` pushes
  the value from the local `.env` into Secret Manager on every deploy. The variable name says the
  intent — it is the *cloud's* RPC, stored locally — so local and cloud were never separate there:
  the local file is the source of truth for the cloud secret. Leaving the old key in `.env` would
  have written it back over the rotation at the next deploy, with no error. The version history
  showed it plainly: v14, v15 and v16 of `rabbit-sepolia-rpc` are three deploy attempts, each
  uploading the local value; v17 was the rotation.
- **Change:** new key added to `devnet-sepolia-rpc`, `rabbit-sepolia-rpc` and
  `verex-rpc-url-verex`; the VM's `.env` regenerated from Secret Manager and anvil restarted with
  a graceful stop so the state overlay flushed rather than truncating; jay updated
  `CLOUD_AGENT_RPC_URL` in `rabbit/.env` to the new key, confirmed by hash to match the cloud
  secret. Old secret versions left enabled for rollback.
- **Result:** verified by forcing a cache miss rather than trusting the swap — reading Sepolia
  state the devnet had never touched (Chainlink LINK, Uniswap V3 Factory, ENS Registry, and LINK
  storage slot 3 decoding to "ChainLink Token") could only have come from a live upstream call on
  the new key. No redeploys were needed: Rabbit reads `rabbit-devnet-rpc` and Verex reads
  `verex-rpc-url-verex_prod`, and both hold the devnet URL rather than an Alchemy one — a payoff
  from splitting those secrets earlier.
- **Open:** the old key stays in use locally and is still the exposed one, so **per-app spending
  limits are not optional** — without them, someone burning the exposed key eats the same
  $50/month budget the cloud key depends on. IP-allowlisting the cloud app to the devnet VM's
  egress IP (34.158.215.69), now the only Alchemy consumer, would make a future leak harmless.
