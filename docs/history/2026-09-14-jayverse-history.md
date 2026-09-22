# 2026-09-14 — Jayverse (hub)

> Source doc: [`../features/README.md`](../features/README.md) — the Jayverse feature-design hub
> (service table, phase overview, cloud split).

### Hub README: three end-to-end scenarios + one imaginary service each

- **Cause:** jay asked for "three great scenarios using all the Jayverse services, plus imaginary
  services I could create", written into the README.
- **Reasoning:** the per-service docs already carry single-service scenarios (Nari/LST, Jun/OFA);
  the missing view was cross-service — one story per *lens* (UX, invariants, time) so the same
  eleven services read differently each time, and so each story ends at a gap that motivates a
  candidate service rather than a twelfth product. Imaginary services are glue that holds no
  funds and reads what the existing services produce; each is placed on the existing cloud split.
- **Change:** new section "Three end-to-end scenarios" in `docs/features/README.md` (before Open
  Questions) + TOC entry: A "Mina's first evening" → `jayverse-passport` (attestations, rabbit
  cloud); B "The Saturday the market resolved" → `jayverse-watchtower` (invariant monitor with
  halt, verex cloud); C "Coach Han runs a tournament" → `jayverse-clock` (one Chainlink-Automation
  keeper for every time edge, verex trigger · rabbit UI). Closing comparison table.
- **Result:** working tree only, branch `claude/jayverse-scenarios` — uncommitted, awaiting jay's
  review. Open: whether any of the three candidates should move into the Dark Horse doc as a
  tracked track.

### Hub: Market umbrella (#4 + #7) and the bridge split (screen in #6, plumbing in #7)

- **Cause:** jay proposed that the Wallet (#6) take the token-bridge feature from Token + Exchange
  (#7), and that Personas (#4) and Exchange (#7) be merged under one umbrella while each keeps its
  own URL and process.
- **Reasoning:** the bridge splits cleanly into a screen and its plumbing. The screen belongs in the
  Wallet — `/bridge` was already a placeholder there, and simulate-before-sign is the wallet's
  core. The contracts, relayer, and supply invariant stay in `jayverse-token`: the bridge mints and
  burns JYVE (one economic unit, jay 2026-09-08), and the relayer's mint key must not move into the
  Wallet on the no-funds Rabbit cloud. The umbrella is a product grouping only — both are markets
  for Jayverse assets and personas are already priced in JYVE through the exchange pool — so
  nothing about deployment changes.
- **Change:** README service-table rows 4/6/7 and phase rows 6/7 annotated; new subsection
  "Umbrellas and ownership splits (jay, 2026-09-14)" under the service table. Personas doc gets an
  umbrella note; the wallet's §5 bridge bullet now states it owns the screen; the token-bridge doc's
  §3 carries a "Revised 2026-09-14" note that its Bridge tab becomes a link to the Wallet.
- **Result:** working tree only on `claude/docs-from-rabbit`, uncommitted. Open: the umbrella's
  name ("Market" is the working label) and whether the portal nav shows one entry or two.

### Hub: Personas moves into #7; own L1/L2 promoted from Dark Horse to #4

- **Cause:** jay followed the umbrella decision with a firmer one — move Personas into the Exchange
  project outright — and asked that the L1/L2 project take row #4.
- **Reasoning:** an umbrella over two services was the halfway form; one repo and one Cloud Run
  service is simpler and matches how personas are already priced (JYVE through the pool). Promoting
  the own chain to a numbered row makes it planned and phased like the others, while the Dark Horse
  "start at last" caveat is carried into the row so the build order does not change.
- **Change:** README row #4 = Own L1 / L2 (links to the Dark Horse §(a) argument; `jayverse-chain.md`
  to write), row #7 = Token + Exchange + Bridge + Personas (one `jayverse-token` repo, personas at
  `/personas`); Dark Horse row drops (a); phase table, scenario references (`#4 Personas` →
  `#7 Personas`, Scenario C's L2 line → `#4`), terminal table, and the cloud-split note updated.
  The "Umbrellas" subsection became "Ownership changes" with three bullets. Personas doc: repo is
  now `jayverse-token`; token-bridge doc: personas is a fourth package; Dark Horse doc: (a) marked
  promoted.
- **Result:** working tree only, uncommitted. Open: whether personas keep `personas.jaylabs.xyz` as
  a second domain mapping onto `jayverse-exchange`.

### New design doc: `jayverse-devnet.md` — #4 starts as a hosted Anvil that replaces Sepolia

- **Cause:** jay named the L1/L2 project `jayverse-devnet` and set its first step: an Anvil-based
  devnet on the Rabbit cloud that the cloud services use instead of Sepolia; asked for the design
  in a separate new file.
- **Reasoning:** fork Sepolia at a pinned block rather than start from an empty genesis, so the
  EntryPoint, test USDC, Chainlink feed contracts, and every deployed Jayverse contract keep their
  addresses — only RPC URL and chain id change. ChainId 31337 reuses the Wallet's existing
  local-fork decision so no service config changes. A GCE VM, not Cloud Run, because a chain must
  never scale to zero and needs a disk. The public RPC goes through a method-allowlist proxy
  (`anvil_*`/`evm_*` admin-only) — otherwise anyone could mint ETH or warp time; that allowlist is
  the devnet's Auditor row. Fork side effect recorded: Chainlink feeds are frozen at the fork
  block, so oracle-dependent integration tests stay on Sepolia.
- **Change:** `docs/features/jayverse-devnet.md` (phases: hosted devnet → services move over →
  reset/snapshot ops → `supersim`/OP-Stack L2); README row #4 renamed "Devnet — own L1 / L2" with
  the planned GCE VM + `devnet.jaylabs.xyz`; phase and terminal rows updated; Dark Horse §(a) note
  points at the doc.
- **Result:** working tree only, uncommitted. Open (in the doc): 31337 vs a dedicated chain id for
  the hosted devnet, fork re-pin policy, faucet budget.

### Devnet doc: architecture section — the Jayverse L1 as our own ecosystem chain

- **Cause:** jay: "for Devnet L1, we create and deploy our own chain which will be used for our
  ecosystem, based on Anvil and deployed in the Rabbit instance — add some architecture."
- **Reasoning:** describe it as five layers (host → node → edge → ecosystem → consumers) so the
  chain reads as a product, not a process. Two node modes under one edge — fork of Sepolia
  (phase 1) and own genesis (phase 3+) — so the chain can stop depending on Sepolia without the
  layers above noticing. An on-chain `Registry` (name → address) makes the ecosystem reset-proof
  in genesis mode. Trust boundaries stated as three callers (public / admin / operator scripts)
  with the proxy allowlist as the enforced Auditor row. Phase 4 keeps the diagram and adds an
  OP-Stack L2 settling on this chain.
- **Change:** new "§2 Architecture" in `jayverse-devnet.md` (layer diagram, chain property table,
  ecosystem contract set + Registry, trust/paths table, `jayverseDevnet` viem chain definition,
  GCP layout in `doubletree-498007`, phase-4 evolution); later sections renumbered 3–7.
- **Result:** working tree only, uncommitted.

### Devnet: dedicated chain id `313370` instead of reusing `31337`

- **Cause:** jay: "shouldn't the devnet be another chain id?" — the draft had reused the Wallet's
  local-fork id `31337` for the hosted devnet.
- **Reasoning:** `31337` means localhost to every tool (MetaMask, Hardhat, Foundry) and wallets key
  networks by chain id, so local fork + hosted devnet would collapse into one network with two
  RPCs. EIP-155 replay protection is per chain id: same id, same forked addresses, same nonces
  means a local signature is valid on the hosted devnet and vice versa. The cost is one more
  entry in the rails chain list. `313370` = `31337` + a trailing zero, memorable and unlikely to be
  registered.
- **Change:** `jayverse-devnet.md` — "Why a dedicated chainId" replaces the 31337 paragraph in §1;
  phases table, architecture table and diagram, chain definition, bridge mentions, Wallet bullet,
  and the Open-questions bullet (now *decided*) all say `313370`; README row #4 and phase row
  updated. `31337` remains the local fork's id everywhere.
- **Result:** working tree only, uncommitted. To do before first deploy: confirm `313370` is
  unregistered on chainlist.org. Follow-up (jay: "for MetaMask, should we use Sepolia's chain
  id?"): no — MetaMask adds any custom network via `wallet_addEthereumChain`; borrowing `11155111`
  would make devnet signatures valid on real Sepolia and hide which network a popup is for.
  MetaMask features that check a supported-chain list (Delegation Toolkit) are tested on real
  Sepolia or via our own dev wallet. Recorded as a bullet in the doc's §1.

### Verified on a live node: 7702 works at chainId 313370; the delegation framework deploys there; rabbit's enforcement script has a chain-independent regression

- **Cause:** jay: "can you verify what you said we should verify" — anvil's EIP-7702 support on the
  fork, the 7710/7715 path end to end, and whether the MetaMask SDK gates on chain id.
- **Reasoning / evidence:** ran three local anvils (1.6.0): a Sepolia fork at `313370`, a plain
  Prague node at `313370`, and a default `31337` control. (1) **7702 ✅** — on both `313370` nodes a
  type-4 tx with a `cast wallet sign-auth` authorization mined (status 1) and the EOA's code became
  `0xef0100‖EntryPoint`. (2) **Framework deploy ✅** — rabbit's `scripts/deploy-delegation.mjs`
  (`deploySmartAccountsEnvironment`, `@metamask/smart-accounts-kit` 1.7.0) deployed DelegationManager,
  SimpleFactory, DeleGator impls and enforcers on the `313370` fork (2 m 28 s, fork lazy-loading)
  and on the plain node (0.24 s); the kit hardcodes no chain list — only MetaMask's own 7715 popup
  is gated. (3) **Enforcement script ❌, but not chain-related** — `scripts/verify-delegation.mjs`
  reports 0 USDC after the allowed withdraw and no revert on the cap/expiry cases on *all three*
  nodes including the `31337` control; `cast code` at the script's predicted smart-account
  address is empty, so `redeemDelegations` executes against an empty delegator and silently
  succeeds. The script last passed on 2026-08-26 (history), so this is a regression in rabbit's
  script or the kit version, not a devnet/chain-id problem.
- **Change:** wallet doc's deferred item "confirm anvil's 7702 support" marked verified; this entry.
  No code changed; `.delegation-anvil.json` in rabbit (gitignored) now holds the last test
  deployment.
- **Result:** the devnet chain-id decision stands on evidence. Open: fix `verify-delegation.mjs`
  (predicted vs. actual smart-account address after the kit upgrade) — a rabbit task.

### Devnet: every Jayverse contract is deployed on it by the seed, nothing inherited from the fork

- **Cause:** jay: "all the contracts should be deployed on the devnet if we decided to use the
  chain." The draft had leaned on the fork carrying Sepolia's Jayverse deployments at the same
  addresses.
- **Reasoning:** the devnet is now the *primary* deployment target, so it must hold the contracts
  at the versions being built, not whatever last shipped to Sepolia; a deploy that only works
  because a contract happened to be on the fork is not reproducible; and one seed for both node
  modes means switching from fork to own genesis changes nothing above the node. The fork still
  supplies the base rails (EntryPoint, USDC, Chainlink contracts). The delegation framework joins
  the seeded set, which today's run showed deploys cleanly at 313370.
- **Change:** `jayverse-devnet.md` — phase 1 row, the "why fork" paragraph (now paired with "but
  every Jayverse contract is deployed by us"), the mode-A row, the ecosystem-layer bullets (seed
  calls each repo's deploy script in dependency order; delegation framework added), and the
  Registry rationale; README row #4 says it.
- **Result:** working tree only, uncommitted. Sepolia keeps its deployments as the secondary
  target for oracle and MetaMask tests.
