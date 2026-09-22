# 2026-09-14 — Jayverse devnet rollout

> Source docs: [`../tasks/2026-09-14-devnet-rollout.md`](../tasks/2026-09-14-devnet-rollout.md) —
> the task this work implements; design in
> [`../features/jayverse-devnet.md`](../features/jayverse-devnet.md) (§2 architecture, §7
> implementation sketch). Prior decisions and the live-node evidence are in
> [`2026-09-14-jayverse-history.md`](2026-09-14-jayverse-history.md).

### Step 0–1: `jayverse-devnet` built and verified locally

- **Cause:** task step 1 — build the repo from the design's §7 layout and prove the stack before
  any cloud resource exists.
- **Reasoning:** local parity first, so "works locally, breaks in the cloud" has one fewer cause,
  and so the billable VM is only created against a stack already known to work. One compose file
  serves both node modes (an entrypoint script builds anvil's arguments from `NODE_MODE`), because
  the design requires switching fork → own genesis to change nothing above the node. Host ports are
  8645/8643: jay's own Sepolia-fork anvil owns 8545 and must not be disturbed.
- **Change:** new repo `~/work/jayverse-devnet` on `claude/devnet-rollout` — `infra/` (compose with
  the Foundry image pinned by digest, Caddyfile, VM startup script, systemd unit, GCS lifecycle),
  `proxy/` (allowlist, admin token, budgeted faucet, audit log, WS filtering), `scripts/`
  (`seed.ts`, `feeds.ts`, `reset.sh`, `snapshot.sh`, `restore.sh`), `status/`, `contracts/`
  (`Registry.sol`, `MockV3Aggregator.sol`), `docs/runbook.md`.
- **Result:** all four acceptance checks pass locally — `eth_chainId` = `0x4c81a`; a type-4 EIP-7702
  transaction mines and installs the delegation; the delegation framework deploys (2 m 45 s, matching
  the documented ~2 m 28 s fork lazy-loading); `anvil_setBalance` is refused without the admin token
  and succeeds with it. Faucet pays out, enforces the 10 ETH per-address cap, and writes an audit
  line. Seed is idempotent. Uncommitted, awaiting review.

### Chain id 313370 confirmed unregistered — but 313313 is taken

- **Cause:** a fixed decision required confirming 313370 on chainlist before the first deploy.
- **Reasoning:** checking the single id was not enough, because the fallback rule is "next free
  `3133xx`" — so the whole range needed checking, not just the one value.
- **Change:** fetched the full `chainid.network/chains.json` (2759 chains) and checked the range
  rather than trusting a summarised page read.
- **Result:** 313370 is free. 313313 is **Sahara AI Testnet** — so the "next free 3133xx" fallback
  is not free-for-the-taking and needs the same check if it is ever used. 313370 stands.

### EIP-7702: a self-sponsored authorization must be signed at tx nonce + 1

- **Cause:** verifying check 2, a type-4 transaction on the devnet.
- **Reasoning:** the first attempt looked like a pass — status 1, type 4 — but `cast code` on the
  authority was still `0x`. The authorization had been signed at the account's *current* nonce while
  the same account also paid for the transaction, so the tx's own nonce bump was applied first and
  the authorization was stale by the time the list was processed. An invalid authorization is
  **skipped silently**: the transaction still succeeds and installs nothing.
- **Change:** verified both working paths — self-sponsored with the authorization signed at
  `nonce + 1`, and sponsored by a different payer at the current nonce. Recorded in the runbook's
  failure table and the repo README.
- **Result:** 7702 confirmed working at 313370. Also found that anvil dev account #0 already carried
  a `0xef0100…` delegation **inherited from real Sepolia** — a reminder that on a fork the well-known
  dev addresses are real addresses with real history, so "the code changed" is not by itself
  evidence that our transaction changed it.

### The proxy's allowlist: prefix rules leak anvil's `eth_`-prefixed cheats

- **Cause:** implementing the design's allowlist (`eth_*` public, `anvil_*`/`evm_*`/`hardhat_*` admin).
- **Reasoning:** taken literally, the prefix rule is unsafe. Anvil ships cheat methods under the
  `eth_` prefix: `eth_sendUnsignedTransaction` sends from any address with no signature, which is
  impersonation by another name, and the `eth_*impersonate*` pair is the same authority. A public
  `eth_*` rule hands all three to anyone. Batches need the same care — one refused call refuses the
  whole batch, so a cheat cannot ride along with reads.
- **Change:** `proxy/src/allowlist.js` keeps the prefix rule but adds an explicit admin exception
  set, and classifies per-call across batches. The WebSocket path parses and applies the same rule
  per frame rather than piping raw, so a subscription transport is not a way around the HTTP rules.
- **Result:** refusals verified for both the unauthenticated and the batch case. This is the
  enforced form of the devnet's Auditor row, so the gap mattered.

### Registry: the seed now fails loudly on a name collision instead of overwriting

- **Cause:** the first seed reported 41 entries written but the Registry held 40.
- **Reasoning:** the delegation kit deploys **its own** ERC-4337 EntryPoint, which collided with the
  canonical forked EntryPoint under the name `EntryPoint`; whichever group was written last silently
  won. Every service reads this book to find contracts, so a wrong answer here is a wrong answer
  everywhere — a failed seed is much cheaper than a book that quietly lies.
- **Change:** `resolveNames()` in `scripts/seed.ts` throws on any two different addresses under one
  name, with a known-collisions map resolving this one: the kit's copy is registered as
  `DelegationEntryPoint`, and the canonical `EntryPoint` stays the forked 4337 address every tool
  already knows.
- **Result:** 41 distinct entries, both EntryPoints addressable, no silent overwrite. Any future
  collision stops the seed rather than corrupting the book.

### Audit log was failing silently on a permissions error

- **Cause:** reviewing proxy logs during the framework deploy.
- **Reasoning:** the proxy runs as `node` but shared anvil's root-owned `/data` volume, so every
  audit write failed with `EACCES`. The write is wrapped so logging can never break the request
  path — which meant the devnet was refusing cheats correctly and recording none of it. The audit
  log is the evidence half of the authority matrix; losing it quietly is the failure mode that
  matters.
- **Change:** the proxy gets its own volume at `/var/lib/devnet`, created with `node` ownership in
  the Dockerfile so a fresh named volume inherits it; anvil's state is mounted read-only alongside.
- **Result:** admin calls and faucet payouts now appear in `/admin/audit`. Verified.

### `feeds.ts`: taking over a frozen Chainlink feed at its real address

- **Cause:** Chainlink feeds are frozen at the fork block, and Verex resolution tests need to move a
  price on the devnet.
- **Reasoning:** writing the aggregator's storage directly would be brittle across feed versions.
  Instead the feed **proxy** — at its real Sepolia address, which is what services already read — is
  repointed at a `MockV3Aggregator` we control, by impersonating the proxy owner (a Chainlink
  multisig we do not hold). That keeps every consumer's address unchanged. Impersonation is a cheat,
  which is why the whole path is admin-only.
- **Change:** `contracts/MockV3Aggregator.sol` and `scripts/feeds.ts` (`list` / `takeover` / `set`).
  The mock is seeded with the frozen answer so a takeover does not move the price by itself.
- **Result:** `ETH/USD` moved 2511.11 → 2500 → 3333.50, read back through the real proxy
  `0x694AA1…5306`. One implementation note worth keeping: an impersonated account has no key locally,
  so those calls must go out as `eth_sendTransaction` from a JSON-RPC account — a wallet client built
  from a private key signs as the deployer and the proxy rejects it as not-the-owner.

### Step 3: `@jayverse/rails` created as a real package, not a copied file

- **Cause:** task step 3 — one shared chain definition, with the fallback of copying a file per repo.
- **Reasoning:** the copy-per-repo fallback would have put the devnet's address in seven places on
  the day before the address exists, and the task asks which option was taken. A package is barely
  more work and has one source of truth.
- **Change:** new repo `~/work/jayverse-rails` on `claude/devnet-rollout` — `chains.ts`
  (`jayverseDevnet` 313370, `sepolia`, `localFork` 31337, and `chainFor(CHAIN)`), `registry.ts`
  (ABI plus a `lookup` that throws on an unset name rather than returning the zero address).
- **Result:** typechecks clean. Addresses are deliberately not exported as constants — services read
  the Registry at run time so a reset cannot strand a stale address.
  `jayverseDevnet.contracts.registry.address` stays zero until the cloud devnet is seeded.

### Steps 4–7 blocked: the per-service deploy paths do not exist yet

- **Cause:** running the seed against the local devnet to see what step 4 actually requires.
- **Reasoning:** the seed calls each repo's own deploy script rather than re-implementing it, so the
  blockers are exactly the gaps in those repos. Running it early turned step 4 from an estimate into
  a list.
- **Change:** none — this is a finding. The seed reports each blocked service with its reason and
  exits non-zero.
- **Result:** all six service steps are blocked. **Token** — `Deploy.s.sol` deploys `MockUSDC`, but
  the fixed decision is to use the forked Circle test USDC in mode A, so it needs a USDC override.
  **Bridge** — `jayverse-token/contracts/src` holds only `JYVE.sol`, `MockUSDC.sol` and
  `Exchange.sol`: there are no `BridgeLock`/`BridgeMint` contracts at all, so the devnet ⇄ Sepolia
  bridge in step 7 has nothing to deploy and is not a configuration change. **DeFi** —
  `scripts/deploy-defi.mjs` hard-refuses any non-local RPC that is not chain 11155111. **Verex** —
  forge scripts exist but there is no devnet target and the operator path still assumes live
  Chainlink. **Personas** — still its own repo; the ownership decision moves it into
  `jayverse-token`, and it should be deployed from one place, not two. **OFA** — no repo, correctly
  skipped per the task. The core of the seed (Registry, delegation framework, base-rails check, demo
  funding, `deployments/devnet.json`) works and is idempotent.

### Bridge ruled out of scope for the rollout (jay, 2026-09-14)

- **Cause:** the seed run showed the devnet ⇄ Sepolia bridge has no contracts to deploy —
  `jayverse-token/contracts/src` holds only `JYVE.sol`, `MockUSDC.sol` and `Exchange.sol`.
- **Reasoning:** jay's call, asked and answered: writing `BridgeLock`/`BridgeMint` plus a relayer is
  a feature build, not the configuration change the rollout is made of. Folding it in would let one
  unwritten feature hold up moving eight services onto the devnet.
- **Change:** step 5's bridge line and step 7's "one bridge lock (devnet) → mint (Sepolia)" check are
  dropped from this task; the seed keeps its `bridge` step, reporting it as blocked so it is not
  quietly forgotten.
- **Result:** the bridge needs its own task. Until it exists, the token doc's "two genuinely
  different chains" claim stays aspirational — worth noting, because the devnet was the thing that
  was supposed to make it true.

### Jayverse reframed as a demo estate; cross-cutting decisions written down

- **Cause:** the devnet's VM cost prompted a wider look at spend. jay: current bill is ~$4/day, and
  "our Jayverse is only for demo" — which turned a sizing question into a posture question.
- **Reasoning:** several things being treated as requirements were only requirements for a system
  with real users. Once nothing has to be reachable without warning, the expensive parts stop being
  load-bearing. Two findings drove the rest: `verex-api-prod` runs always-on with CPU throttling
  disabled (~$50/mo, ~40% of the bill) — not a preference but the fix for the 2026-07-29 drained-MM-books
  incident — and there are three Cloud SQL instances, two of them running, including a `rabbit-db`
  nobody had mentioned. Against those, every consolidation idea discussed (merging databases,
  collapsing eight Cloud Run services into two, deleting staging) saves ~$0–2 each. One line
  dominates, so the others are tidiness, not economy.
- **Change:** new `docs/features/cloud-ops.md` — an estate table (what runs in which project
  and region) plus seven decisions with reasoning and reopen-conditions (demo estate; cost posture;
  Verex prod parked between demos, all-or-nothing to avoid reproducing 2026-07-29; staging retired;
  production databases kept separate; no api/web consolidation; the devnet needs a VM, `e2-small`),
  and an Open list. Linked from the hub README's **History** section (jay: no new section needed).
  Named twice over, both times by jay's correction. First `jayverse-important-decisions.md`: too
  broad, and a catch-all name invites unrelated decisions to accumulate — the bridge-scope and
  chain-id entries were already doing exactly that, and moved out to the task doc and
  `jayverse-devnet.md` where they belong. Then `jayverse-cloud.md`: the `jayverse-` prefix is
  reserved for the per-service design docs (README: "Per-service design docs are named
  `jayverse-<service>.md` so they group under one prefix and are obvious as a set"), and the cloud
  is not a service. Settled on `cloud-ops.md`, alongside the folder's other non-service topic docs
  (`common.md`, `ui-ux.md`, `staging-domain.md`) and distinct from the unrelated `cre-cloud.md`.
- **Result:** decided. Not yet executed — no cloud resource has been created, parked or deleted.
  Open and deliberately unsettled: whether to consolidate into the Seoul region, which region the
  devnet VM goes in (it should be settled *before* provisioning, since moving later means redoing
  the static IP, DNS record and certificate), and a ~$30/month gap between the resource-derived
  estimate (~$85–95) and the actual ~$120 — nobody has read the billing line items, because there
  is no BigQuery export and the CLI exposes no cost data.

### One region: the estate standardises on Seoul, and the two projects stay separate

- **Cause:** jay asked whether there is any reason to keep two regions for demo projects. There
  isn't — and the question exposed that "one project" and "one region" had been discussed as a
  single move when they are separate decisions with different answers.
- **Reasoning:** every ordinary justification for two regions fails under the demo framing — one
  audience, no data-residency constraint, no meaningful price difference between Tokyo and Seoul,
  and regional failure isolation is worthless for a system nobody is using between demos. The split
  is history: Verex was built in Seoul, Rabbit grew in Tokyo, nothing forced a choice. Seoul wins
  because Verex is already there and jay and the audience are in Korea. The **project** split is a
  different matter and stays: per-product billing visibility, separate IAM, blast-radius isolation,
  and Verex genuinely is its own product. Keeping two projects also dissolves the database question
  — once both projects are in Seoul, each app sits beside its own database with no cross-project
  wiring, so there is nothing left to merge.
- **Change:** `cloud-ops.md` gains decision 7 (one region, two projects) with a target-shape table;
  decision 4 rewritten — the Seoul move settles the merge question rather than triggering it, and
  `rabbit-db` is recreated in Seoul rather than merged; decision 6 gains the region. The task doc's
  "do not reopen" **Where** row amended: `asia-northeast3` and `e2-small`/10 GB, both flagged as
  deliberate departures rather than made quietly. `jayverse-devnet/docs/runbook.md` §2 retargeted —
  region, zone, machine type, disk sizes, the SSH command, and the cost table (~$43 → ~$20/month).
- **Result:** the devnet's region question is closed, which was the last thing blocking step 2.
  Still unexecuted: nothing moved, nothing provisioned. Open: the ~$30/month of the bill that no
  estimate accounts for, and the order to do decisions 2, 3 and 7 in.

### Step 2 executed: the devnet is live at https://devnet.jaylabs.xyz

- **Cause:** jay approved creating the VM and proceeding with the cloud-ops plan.
- **Reasoning:** built to the amended fixed decisions — Seoul (`asia-northeast3`) rather than Tokyo,
  `e2-small` rather than `e2-medium` — so the devnet is created where the estate is heading instead
  of being migrated later. The fork pin lives in **instance metadata** rather than a file, so a
  rebuilt VM forks at the same block without anyone having to remember it.
- **Change:** Compute Engine API enabled in `doubletree-498007` for the first time; secrets
  `devnet-sepolia-rpc` / `devnet-admin-token` / `devnet-faucet-key`; service account `devnet-vm`
  with access to exactly those three plus log/metric write; static IP `34.158.215.69`; VM
  `jayverse-devnet` (e2-small, `asia-northeast3-a`); firewall 443+80 public and 22 via IAP only;
  DNS `devnet.jaylabs.xyz`; GCS `jayverse-devnet-snapshots` with 30-day lifecycle; Cloud Monitoring
  uptime check on `POST /rpc eth_blockNumber` matching a hex result; repo at `/opt/jayverse-devnet`
  with the systemd unit installed; fork pinned at Sepolia block **11701069**.
- **Result:** live with a valid certificate. Verified against the public endpoint: `eth_chainId` =
  `0x4c81a`; height advancing 1/s; `anvil_setBalance` refused with HTTP 403 without the admin token;
  faucet paid 10 ETH and decremented the budget to 490; a type-4 EIP-7702 transaction installed
  `0xef0100‖EntryPoint`; Otterscan serving at `/explorer` with `ots_getApiLevel` = 8 through the
  proxy. Seed in progress at the time of writing.

### Two provisioning bugs found by doing it, both fixed

- **Cause:** running the runbook for real rather than reading it.
- **Reasoning / findings:**
  1. **A 10 GB boot disk is too small.** Trimming boot from 20 GB to 10 GB to save ~$1/month ran
     `docker compose build` out of space — the Foundry image alone is 786 MB, and the four images
     plus the build come to over 5 GB. `/data` at 10 GB was never the constraint; the boot disk
     was. Also learned that `growpart` is **not** preinstalled on debian-12, so the live resize
     needs `cloud-guest-utils` first.
  2. **Chain state was landing on the wrong disk.** The compose used a Docker *named volume* for
     `devnet-data`, which resolves to `/var/lib/docker/volumes/...` on the **boot** disk — while
     the 10 GB persistent disk mounted at `/data` sat empty. The VM could have been rebuilt at any
     point and silently taken the chain with it, which is the exact failure the separate disk
     exists to prevent. It would not have shown up in any smoke test: the devnet works perfectly
     either way until the instance is replaced.
- **Change:** boot disk resized to 20 GB and the runbook now creates it at that size, with the
  symptom and fix in the failure table. Compose takes `${DEVNET_DATA:-devnet-data}` for both anvil
  and the proxy — a host path in the cloud, a named volume locally, so local parity is kept — and
  `startup.sh` writes `DEVNET_DATA=/data` into the VM's env. Runbook gained a row for it.
- **Result:** cost revised ~$20 → **~$21/month**. Also corrected the runbook's
  `gcloud monitoring uptime create` command: `--content-type` only accepts
  `unspecified|url-encoded|user-provided`, so a JSON body needs
  `--content-type=user-provided --custom-content-type=application/json`, and `--resource-labels`
  needs `project_id` alongside `host`.

### Verex parking scripts written (decision 2), not run

- **Cause:** cloud-ops decision 2 — park Verex production between demos.
- **Reasoning:** mirroring the `staging-down.sh` / `staging-up.sh` pair jay already trusts, rather
  than inventing a new mechanism. `prod-down.sh` takes the API **and** the database down in one
  run because the half-alive state is the 2026-07-29 incident; `prod-up.sh` starts the database
  **first** and waits for `RUNNABLE` before letting the API take traffic, for the same reason in
  reverse.
- **Change:** `verex/scripts/prod-down.sh` and `prod-up.sh` on branch `claude/devnet-rollout`.
  `prod-down.sh` prompts for confirmation — it takes a public site offline.
- **Result:** written and syntax-checked, **not executed**. Running them is jay's call around a
  demo; parking saves ~$60/month while parked.

### The devnet was persisting nothing — a root-owned data dir against a uid-1000 container

- **Cause:** moving the chain's state onto the persistent disk, the Docker volume turned out to be
  empty. Anvil had run for over an hour, locally and in the cloud, with
  `--state /data/anvil.json --state-interval 60`, and had written no file at all.
- **Reasoning:** a controlled test showed anvil 1.8.1 persists correctly with those flags, forked
  or not, so the flags were not the problem. `docker exec … touch /data` gave it away: the Foundry
  image runs as **uid 1000 (`foundry`)** while a fresh named volume — and a bind-mounted disk — is
  owned by **root**. Anvil could not write and reported nothing. This is the same failure as the
  audit-log `EACCES` found earlier the same day; fixing that one in the proxy alone was too narrow.
  The dangerous part is how healthy it looked: blocks advancing, RPC serving, the seed succeeding,
  the explorer working, and `snapshot.sh` faithfully copying a file that never existed. It would
  have surfaced only at the first restart, as a silently reset chain.
- **Change:** an `init-perms` service in the compose file chowns the data directory to uid 1000
  before anvil starts — it works for bind mounts and named volumes alike, so local parity holds —
  and `anvil-entrypoint.sh` now probes the directory and **refuses to boot** if it cannot write,
  because a devnet that cannot persist must not pretend to be fine. Separately, compose now takes
  `${DEVNET_DATA:-devnet-data}` so the cloud binds the real disk instead of a volume on the boot
  disk. `snapshot.sh`'s flush URL corrected: the proxy is not published on the host, so it goes
  through the public URL, not `localhost:8080`.
- **Result:** verified end to end. `/data/anvil.json` now exists on `/dev/sda` (the persistent
  disk), a snapshot of it is in `gs://jayverse-devnet-snapshots/2026-09-14.json` (2.01 MiB), and
  **an anvil restart preserved the chain** — Registry `0xe8a1…674b` still holds its 41 entries and
  the DelegationManager is unchanged. Before the fix the same restart would have wiped it.

### Leaked the upstream RPC key into the session transcript

- **Cause:** debugging the above, `cat /proc/1/cmdline` printed anvil's full argument list, which
  includes `--fork-url` and therefore the Alchemy API key.
- **Reasoning:** every other secret in this work was handled without printing — piped between
  `gcloud secrets` and a file, or checked by length and host only. This one leaked because the
  secret was an *argument to a command I was inspecting for another reason*, which is a blind spot
  worth naming: it is not enough to avoid printing secrets, one also has to know which commands
  carry them.
- **Change:** none to the code yet. Runbook §6b records that the fork URL is visible in `ps` and
  `docker inspect` on the VM, and that moving it out of argv would be better.
- **Result:** jay told to rotate the Alchemy key and add new versions to both
  `rabbit-sepolia-rpc` and `devnet-sepolia-rpc`. Testnet key, so the exposure is quota rather than
  funds — but it is still a live credential in a transcript.
