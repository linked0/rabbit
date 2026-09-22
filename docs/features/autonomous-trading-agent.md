# Autonomous trading agent — the running architecture

<sub>Formerly `j2-architecture.md`. "J2" is the seam project's internal label and means nothing
outside the plan, so the file is named for what it describes.</sub>

> **What this file is.** A description of the system **as it actually runs today**
> (2026-08-26), for someone sitting in front of the machine. It is not a plan.
>
> - The plan — what is next, what is open, in what order — is
>   [docs/tasks/current-plan.md](../tasks/current-plan.md).
> - The step-by-step walkthrough is that plan's *Built so far* section.
> - The blow-by-blow of how it got here is
>   [docs/history/2026-08-26-rabbit-history.md](../history/2026-08-26-rabbit-history.md).
>
> This file exists because the plan's own architecture diagram describes the *design*, and the
> design changed twice while building — the mandate is not granted through ERC-7715, and the
> delegator is not the owner's EOA. A reader who only had the plan would look for the wrong things.

## 1. The one-sentence version

An LLM-driven agent trades on a prediction market it has no account with, using money it can only
draw through a delegation whose **amount and deadline are enforced by contracts** — and it writes
down every time it decides *not* to.

## 2. Processes and ports

Four long-running things, all on one machine. Nothing here is deployed.

| | Process | Port | Started by | Holds |
|---|---|---|---|---|
| 1 | **anvil** | 8545 | `anvil` | every contract below |
| 2 | **verex API** | 4000 | `pnpm --filter @verex/api dev` | the CLOB, the operator key, Postgres |
| 3 | **verex web** | 3000 | `pnpm --filter @verex/web dev` | optional — for watching the book |
| 4 | **rabbit** | **3100** | `pnpm dev` | the agent key, the mandate, the journal |

Plus Postgres in Docker (`verex-pg`, 5432) — **two databases, one server.** Verex's markets and
orders; rabbit's `NewsItem` / `Mandate` / `AgentTick`. They never join.

Bringing all of it up from a cold machine is §3; driving it once it is up is §4.

## 3. Bringing it up from nothing

Order matters in two places, and both are easy to get wrong silently.

### 3.1 The chain first

```bash
anvil                                    # terminal 1 — leave it running
```

**Everything below is deployed to this process.** Kill anvil and every address in every config
file points at nothing. That is the single most common way this setup breaks after a break.

### 3.2 verex — Postgres, schema, seed, contracts

```bash
cd ~/work/verex
./scripts/dev-local.sh                   # once per session
```

One script, four jobs: starts Postgres in Docker (`verex-pg`), pushes the Prisma schema,
**deploys every verex contract via forge**, and seeds 10 markets. The contract deployment is why
anvil has to be up first — the seed *is* the deploy.

That covers all four of verex's contract sets, not just the trading ones:

| | Contract | Script |
|---|---|---|
| 1–3 | JUSD · ConditionalTokens · CTFExchange | `DeployCTF.s.sol` |
| 4 | MockOptimisticOracleV2 + UmaCtfAdapter | `DeployMockOracle.s.sol`, run by the seed |

`scripts/deploy-uma-adapter.sh` is **not** part of this — it takes `<staging\|prod>` and refuses
anything else. It is the remote path: a real oracle, real WETH bonds, a manifest to update. Locally
the mock is enough, and the adapter cannot tell the two apart — which is why the local path is a
rehearsal for Sepolia rather than a separate implementation.

```bash
pnpm --filter @verex/sdk build           # terminal 2, then:
pnpm --filter @verex/api dev             # API → :4000
pnpm --filter @verex/web dev             # terminal 3 — optional, :3000
```

**Build the SDK or rabbit breaks.** Rabbit reaches `@verex/sdk` through a `file:` link, which
resolves to `dist/` — **a symlink does not rebuild itself.** Re-run the build after any SDK change.

### 3.3 rabbit — env, schema, delegation framework

Put the variables in **`.env`**, not in your shell — `.env.example` §17 lists them with defaults,
and `.env` survives closing the terminal:

```bash
cd ~/work/rabbit
# .env  (gitignored; copy the keys from .env.example §17)
#   AGENT_PRIVATE_KEY=0x…                any test key, but it must be STABLE
#   VEREX_API_URL=http://127.0.0.1:4000  (this is also the default)
#   AI_API_KEY=…                         the DashScope key jay-chat already uses

npx prisma db push                       # NewsItem, Mandate, AgentTick
pnpm delegation:deploy                   # DelegationManager + ~35 enforcers → anvil (~0.2s)
pnpm dev                                 # rabbit → :3100
```

Next.js reads `.env` itself — rabbit has no `dotenv` dependency and needs none. **A shell `export`
overrides the file**, because Next looks in `process.env` first and stops at the first hit. That
makes `export` a good one-off override and a bad place to keep configuration: it dies with the
terminal, and it silently shadows `.env` in a way that is invisible when you later read the file
and believe it.

Either way, **restart `pnpm dev` after changing a variable.** `lib/verex-client.ts` and
`lib/delegation.ts` read `process.env` into module-level constants at import time, so the value is
captured once per server process, not per request.

Every one of those variables is documented in **`.env.example`** (section 17), which is the file
to read rather than this one when you are setting up — `.env` itself is gitignored, and
`.env.example` is the committed contract for what it must contain.

`AGENT_PRIVATE_KEY` is not optional in spirit. Without it the agent generates an ephemeral key,
its address changes on every restart, and **every mandate already granted points at an address
that no longer exists.** The console says so in the preflight; believe it.

`pnpm delegation:deploy` writes `.delegation-anvil.json` (gitignored — the addresses change on
every fresh chain). **Re-run it every time anvil restarts.**

### 3.4 Prove the boundaries before touching the UI

```bash
pnpm delegation:verify
```

Needs nothing but anvil and 3.3 — no verex, no Postgres, no MetaMask, deliberately. It draws
inside the mandate, then over the cap, then past the deadline:

```
1. draw 4 of 10 …………  agent jUSD: 4
2. cap exceeded ………  ERC20TransferAmountEnforcer:allowance-exceeded   (still 4)
3. after expiry ………  TimestampEnforcer:expired-delegation             (still 4)
```

Any other outcome means the demo's central claim is broken, and you want to know that here rather
than three panels deep.

### 3.5 Teardown

```bash
docker stop verex-pg                                  # keep the data
docker rm -f verex-pg && ./scripts/dev-local.sh       # wipe and re-seed
```

Re-seeding **deletes verex's trades and markets**, so the agent's journal will cite market slugs
that no longer exist. Harmless locally; it is the whole reason W1 is sequenced before the first
staging run.

## 4. Using the console

**http://localhost:3100/live/agent/console** — four blocks, top to bottom.

**Preflight.** Read it before anything else. It shows verex's chainId, the **exchange address**,
the DelegationManager, and the agent's balance. A red chain-mismatch line means the cap would
govern a different chain's token than the one being traded — stop and fix that first.

**1 · Mandate.** Connect MetaMask, set a cap and an expiry, press *Grant*. One signature popup
showing a `Delegation` struct. The server deploys your smart account if needed and funds it from
verex's faucet before you sign. **Use one MetaMask account throughout** — the smart account is
derived from the connected address, so switching accounts silently gives you a different account,
a different balance, and a mandate that belongs to the old one.

Inside that panel, *"Why not MetaMask's own permission popup"* → *Ask the wallet* prints the
wallet's real ERC-7715 supported-chain list. That is the evidence for the design choice in §6.

**2 · News.** Headline, source, optional body. The badge counts items **inside the window the
estimate actually reads**, not everything stored — set the window to 1h and watch a stale item
grey out. With an empty store the LLM is not called at all.

**3 · Journal.** *Run one tick*, then read. Useful sequence for seeing the machine work:

| Do | Get |
|---|---|
| tick with no news | `SKIP_NO_ESTIMATE` |
| add a headline, tick | `TRADED` or a named skip |
| tick again immediately | `SKIP_COOLDOWN` — the "twice is safe" gate |
| raise the edge threshold to 0.9, tick | `SKIP_EDGE` with book, model, shortfall |
| keep ticking until the cap is gone | `SKIP_BUDGET`, then `SKIP_EXHAUSTED` — **not alike** |
| grant a 2-minute mandate, let it lapse, tick | `SKIP_EXPIRED` carrying `TimestampEnforcer:expired-delegation` |
| delete a cited news item | the row keeps the citation, marked **deleted** |

The dials matter. The defaults (3600s cooldown, 0.05 edge) will not show you six verdicts in one
sitting — drop the cooldown to 60s and keep the cap small.

**Header check:** *"N of M ticks did nothing."* If only trades are there, the demo's whole claim is
missing.

## 5. Contracts — one chain, two owners

**Everything is deployed on anvil.** Neither repo "has" contracts; each has a script that sends
deploy transactions. This is the single most common misreading of the setup.

```
                         anvil · chainId 31337
  ┌────────────────────────────────────────────────────────────────┐
  │  JUSD          CTF          CTFExchange      UMA adapter   │  ← verex seed
  │      ▲                                                          │
  │      │ the cap is scoped to THIS token ── the only shared object│
  │      │                                                          │
  │  DelegationManager    ERC20TransferAmountEnforcer               │  ← rabbit
  │  SimpleFactory        TimestampEnforcer      (+ ~33 more)       │     delegation:deploy
  └────────────────────────────────────────────────────────────────┘
```

**Why rabbit owns the delegation framework.** The mandate is an agreement between the owner and the
agent. Verex is **not a party to it** — it never calls `DelegationManager`, never reads a
delegation, and does not know one exists. Verex's Phase-1 job was to *stop caring who the trader
is*; handing it the mandate would undo that.

They meet at exactly one address. `mandate/prepare` reads verex's `/config` and scopes the cap to
**verex's own JUSD**. If the two ever sat on different chains the cap would guard a token
nobody trades — so `prepare` returns **409** and the console's preflight turns red.

## 6. Who holds which key

| Key | Lives | Can |
|---|---|---|
| Operator (anvil #0) | verex server | mint JUSD, send `matchOrders`, report payouts |
| Demo wallets 1–9 | verex server | trade as before — **Phase 1 was additive, none were removed** |
| **Agent EOA** | **rabbit server** | sign CTF orders, call `redeemDelegations`. Testnet-grade, and the page says so |
| Owner EOA | **MetaMask, yours** | sign the mandate. Never leaves the browser |

The safety claim rests on **amount, not custody**: stealing the agent key still cannot exceed the
cap. That is why a server-held key is an acceptable demo compromise and gets labelled rather than
hidden.

## 7. The mandate, concretely

```
delegator   owner's Hybrid smart account   ← whose money
delegate    agent EOA                      ← who may draw it
cap         N JUSD                     → ERC20TransferAmountEnforcer
expiry      unix seconds                   → TimestampEnforcer
signature   MetaMask, EIP-712              ← eth_signTypedData_v4
```

Three things about this that the plan does not say, because they were decided while building:

**It is not ERC-7715.** `wallet_requestExecutionPermissions` is answered by the MetaMask extension,
which supplies the `DelegationManager` address in its response — the SDK hardcodes none, which is
the proof. Our deployment is not CREATE2, so its addresses cannot match what the wallet expects even
if chainId 31337 were on its list. A plain EIP-712 `Delegation` works instead because
`verifyingContract` and `chainId` are **ours to pass**. The console has a button that asks the
wallet for its real supported-chain list, so this can be revisited from evidence.

**The delegator is a smart account, not your EOA.** `redeemDelegations` executes in the delegator's
context, so there must be contract code there. The jUSD therefore sits at the smart-account
address. Upside: no EIP-7702, so anvil never needs the Prague hardfork. It is funded by **verex's
address-scoped faucet** — a Phase-1 piece that slotted in unchanged.

**The struct is built server-side; the browser only signs.** Two definitions of one signed struct
produce a valid signature of the wrong message, and the error never mentions the struct. Same rule
as `@verex/sdk` being a `file:` link rather than a copy.

## 8. One tick, end to end

```
POST /api/agent/tick { marketSlug, … }

  expired?      → simulate the draw on-chain (0 gas) → record the ENFORCER'S OWN WORDS
  exhausted?    → SKIP_EXHAUSTED        ─┐ different boundary from expiry,
  cooling down? → SKIP_COOLDOWN          │ and rendered differently on purpose
  observe         verex /markets, /book  │
  estimate        news in window? no → SKIP_NO_ESTIMATE (the LLM is not called)
                  yes → Qwen returns { p, rationale, cited }
  edge            measured against the EXECUTABLE side, not the mid
                  too small → SKIP_EDGE
  size            > budget → SKIP_BUDGET
  act             1. redeemDelegations  ← the enforcement point
                  2. sign a CTF limit order with @verex/sdk
                  3. POST /orders to verex
  record          every branch above writes an AgentTick row
```

**Draw before order, always.** Order-first would leave a book entry that cannot settle if the draw
is refused — the same failure shape as verex's W6.5.

**Expiry asks the chain.** Reading the DB's timestamp and writing *"refused by chain"* would be a
lie; the simulation costs nothing and returns `TimestampEnforcer:expired-delegation` verbatim.

## 9. Where the two repos actually touch

Four seams, and no others:

| Seam | Direction | Carrying |
|---|---|---|
| `@verex/sdk` | verex → rabbit | `signOrder`, the order type, the domain. A `file:` link, so **one definition** |
| `GET /config` | verex → rabbit | chainId, exchange, **jusd**, ctf. Read every time — `reset.sh` changes them |
| `POST /orders` | rabbit → verex | a signed order from an address verex holds no key for |
| `POST /faucet` | rabbit → verex | funds the owner's smart account before the first draw |

## 10. What is not here yet

- **R-F** — the scheduler. A human presses *tick*, so "unattended" is not yet demonstrated.
- **R-G / R-H** — resolution watch, self-redeem, the expiry run as captured evidence.
- **V-E** — the MCP wrapper.
- **W1 / Phase 6** — everything above is anvil. Sepolia is untouched, and the mandate's chain
  enforcement there is [O9](../tasks/current-plan.md#open).
- **W6.5** — verex checks funds at placement only. An external maker can place and then withdraw.

## 11. The two pages, and why there are two

| Route | What it is | Opens |
|---|---|---|
| `/live/agent` | the **mock** — a hand-written script, and the six things this stack is routinely misread as | anywhere |
| `/live/agent/console` | the **console** — preflight, mandate, news, journal, tick | **only in front of a running anvil** |

The mock was not overwritten. It is an argument that survives without infrastructure, and the PoC
card still points at it; publishing a card that links to the console would give visitors a page of
connection errors. The mock now links forward to the console for anyone who has the machine.
