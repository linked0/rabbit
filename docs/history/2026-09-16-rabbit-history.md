# 2026-09-16 — rabbit

Source: [docs/tasks/current-plan.md](../tasks/current-plan.md) — "Rabbit portal — 'Chains' menu:
one page for the three Jayverse networks". Design sources it cites:
[features/jayverse-devnet.md](../features/jayverse-devnet.md) §2.4 and §4,
[tasks/2026-09-14-devnet-rollout.md](../tasks/2026-09-14-devnet-rollout.md), and the chain
definitions in `~/work/jayverse-rails/src/chains.ts`.

Branch: `claude/chains-menu` in `~/work/rabbit`, off `main` at `e4ca135`. Nothing committed.

### Devnet menu → Chains: one page for three networks

**Cause:** jay, 2026-09-16 — "We use three networks — Anvil, devnet, Sepolia. Change the name of
the Devnet top menu to Chains and make it show all the information for the three chains." The
portal's only chain page described the devnet as if it were the whole story, which is how an
Alchemy capability ends up written next to a chain Alchemy cannot see.
Brief: [current-plan.md §3](../tasks/current-plan.md#build).

**Reasoning:** the three are not interchangeable and the page's job is to say so, so the shared
facts are laid out in columns — one card row, one block grid, one capability matrix — rather than
as three stacked copies of a status page. Tabs were built and then dropped (jay compared both and
chose the stacked layout): a tab makes each screen shorter but hides two thirds of the comparison,
which is the only thing this page does that three status pages would not.

**Change:** new `lib/chains.ts` holds the three chain definitions, a parameterised `readChain()`,
the capability matrix and Sepolia's base rails; `lib/devnet.ts` keeps only what has no counterpart
on the other two (the `/status` endpoint, the seeded Registry) and gained a `chains: ChainKey[]`
per service. `app/devnet/` → `app/chains/`, rebuilt around `CHAINS`. Menu item, `ALLOW_CHAINS`,
`PUBLIC_PATHS`, a permanent `/devnet` → `/chains` redirect, and the home ecosystem card
("Jayverse Devnet" → "Jayverse Chains").

**Result:** all three read live — local Anvil at block 11,609,678, devnet at 11,773,295, Sepolia at
11,714,418. `npx tsc --noEmit` clean, `pnpm build` passes, `/devnet` returns 308 to `/chains`, both
languages render. Open questions in [§6](../tasks/current-plan.md#open) still need jay: the local
chain id (below), the Sepolia RPC in the cloud (resolved by fallback, below), and whether the local
column earns its place in the cloud build (kept, with an honest "not reachable from here").

### The local fork reports Sepolia's chain id, and the page now says so out loud

**Cause:** [§6.1](../tasks/current-plan.md#open) flagged that the running Anvil reports `11155111`
because it was started as a Sepolia fork with the default id, while the design (rails `chains.ts`,
wallet, delegation code) expects `31337`. Confirmed live: the node reports `11155111`.

**Reasoning:** printing the *expected* id would have hidden exactly the mismatch worth knowing
about, and the consequence is not cosmetic — MetaMask keys its network list by chain id, so it
treats the local fork as Sepolia, and EIP-155 replay protection then makes a transaction signed on
the fork valid on real Sepolia. Showing the reported id and explaining the gap is more useful than
either silently correcting it or restarting jay's working chain, which the brief forbids.

**Change:** `ChainDef.chainId` is the id a chain is *supposed* to have; `ChainReading.chainId` is
what the node answers. When they disagree the card shows the reported value in the error colour and
prints why, including the `--chain-id 31337` fix and the fact that the state file survives it.

**Result:** rendering now, in both languages. Not fixed — restarting the node is jay's call.

### Chain definitions are copied from rails, not imported, and the file says why

**Cause:** the brief says "Import these; do not redefine chains in rabbit". rabbit has no dependency
on `jayverse-rails`, and adding one would have to be `file:../jayverse-rails`.

**Reasoning:** `scripts/deploy.sh` deploys with `gcloud run deploy --source .`, which uploads only
the rabbit directory. A `file:` dependency on a sibling repo resolves locally and then fails in
Cloud Build — a failure that would appear only at deploy time, which is the worst place for it.

**Change:** `lib/chains.ts` carries the ids and URLs copied verbatim from rails, under a header
comment naming rails as canonical, stating why the import is not possible, and saying the two must
be kept in step by hand until rails is published to a registry.

**Result:** a deliberate, documented duplication rather than a silent one. It would go away if rails
were published — worth doing if a third repo ever needs it.

### Sepolia in the cloud: a public RPC fallback, and a per-chain cache

**Cause:** [§6.3](../tasks/current-plan.md#open) — `SEPOLIA_RPC` is a server-side secret that
`deploy.sh` binds to `ANVIL_RPC_URL` only when `CHAIN=sepolia`, so in production it is unset and the
Sepolia column would have been blank.

**Reasoning:** these are head-block reads with no key and nothing to leak, and the repo already uses
`https://ethereum-sepolia-rpc.publicnode.com` in `app/live/7702`. A blank column would have read as
"Sepolia is down". Separately, `AutoRefresh` re-renders every 5 s while Sepolia produces a block
every 12 s — nine RPC calls per viewer per refresh to a public node for an answer that cannot have
changed.

**Change:** the fallback RPC, plus an in-process cache in `lib/chains.ts` whose TTL is each chain's
own block time — invisible on the two 1 s chains, meaningful on Sepolia. Every client is built with
`timeout: 3500, retryCount: 0`, so one dead node degrades to "unreachable" in seconds instead of
stalling a refresh for half a minute on viem's defaults. The local chain is not probed at all when
`K_SERVICE` is set: from Cloud Run it is unreachable by construction, and "run Anvil locally" is a
more useful thing to say than "unreachable".

**Result:** Sepolia renders in both environments; the refresh cost of the Sepolia column is one read
per 12 s rather than one per 5 s per viewer.

### ANVIL_RPC_URL means the devnet in the cloud, and the Local Anvil row believed it

**Cause:** found while checking §1's service→chain table against the deployed service. `lib/chains.ts`
read `process.env.ANVIL_RPC_URL` for the *local* chain's RPC. In the deployed rabbit that variable is
bound to the `rabbit-devnet-rpc` secret (`CHAIN=devnet` in `scripts/deploy.env`), so it holds
`https://devnet.jaylabs.xyz/rpc`.

**Reasoning:** the variable's name is a leftover — `deploy.sh`'s own comment already says it means
"the chain this deployment talks to", which since 2026-09-14 is not the local Anvil. Locally it does
mean the local node, so it cannot simply be dropped. The honest split is by environment: on Cloud Run
the local chain is `127.0.0.1:8545` by definition and there is nothing an env var could usefully say
about it.

**Change:** `LOCAL_RPC` in `lib/chains.ts` ignores the env entirely when `K_SERVICE` is set, under a
comment naming the trap. The `readChain()` skip for the local chain in the cloud was already in place
and unaffected — this was purely about what the Endpoints table *printed*.

**Result:** locally the row still shows `http://127.0.0.1:8545` and the Tailscale form beside it. In
production it will no longer print the devnet's URL labelled as the local node. Renaming the variable
across rabbit, `deploy.sh` and the secret bindings is [§6.6](../tasks/current-plan.md#open) — it
touches the deploy path, so it waits for jay.

### Contracts moved out of their own panel and into the service that owns them

**Cause:** jay, 2026-09-16 — "we need contracts deployed for our ecosystem in each chain so can you
add the addresses and related information in the Services section not in the separated section like
Ecosystem contracts."

**Reasoning:** "which contracts does Verex have, and where" is the question people arrive with, and
the old layout answered it badly: read a service row, scroll to a panel grouped by *kind* of
contract, match names by eye. Grouping by owner and then by chain also carries information the old
grouping could not — that the same three CTF contracts exist twice, at different addresses, on two
chains. It forced a gap closed too: the old `CONTRACT_GROUPS` left eleven contracts (the delegation
implementations and all six caveat enforcers) belonging to no service at all.

**Change:** `Service.contracts` is now `ContractSet[]` — `{chain, title?, names?, fixed?, note?}` —
instead of a flat `string[]`. `names` resolve live from the devnet Registry contract; `fixed` are
addresses nothing on chain indexes, and each says where it was copied from. Verex gained its CTF
backbone on both chains (from verex's `deployments.json`) plus the Chainlink ETH/USD feed. A service
renders as a block rather than a table row. The separate panel and `SEPOLIA_RAILS` are gone.

**Result:** 8 hand-copied addresses render; the 21 Registry-backed names collapse into 5 honest
"not in the Registry" lines (below). `pnpm build` passes; pushed as `e558625`.

### The devnet's Registry has no code — the chain was reset after the last seed

**Cause:** with every Registry name now shown per service, all 21 rendered as missing. Probed
directly rather than assuming a bug: `eth_getCode` at `0xe8a133…674b` returns `0x`, and `count()`
reverts. The status endpoint still reports that address with `seededAt: 2026-09-14T07:01:25Z`.

**Reasoning:** the status endpoint reports the address the seed last *wrote*; the contract is the
authority, and after a chain reset there is nothing there. This is exactly the failure the
read-from-the-Registry rule exists to expose — a JSON address book would have shown 21 confident,
dead addresses instead. Not a page bug: the page is right and the chain is empty.

**Change:** the page states the cause once, at the top of the panel, and collapses per-set misses
into one line. Without the collapse a single fact ("the chain was reset") rendered as twenty-one
alarms.

**Result:** reported to jay; **not fixed**. Re-seeding deploys ~21 contracts to the shared devnet,
so it waits for him — `scripts/seed.ts` in `~/work/jayverse-devnet`.
