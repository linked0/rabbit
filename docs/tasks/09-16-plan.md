# Rabbit ⇄ Verex — Cross-repo Plan (rolling)

> **Active track: J2 — the mandated trader.** An agent that runs unattended in **rabbit**, forms
> its own view of a **verex** prediction market, trades on it, and settles — where the worst it
> can ever cost is a number the owner set in advance and the chain enforces, not a number the
> agent's own code promises.
>
> **What this file owns:** only what crosses the two repos — the scenario, the seam, the build
> order, and the dependencies between them. **What it does not own:** per-repo detail. Rabbit's
> feature status lives in [../features/README.md](../features/README.md); verex's lives in its own
> [current-plan.md](../../projects/verex/docs/tasks/current-plan.md) and
> [features README](../../projects/verex/docs/features/README.md). One fact, one home — this doc
> links, it does not copy.
>
> **Iterating (jay, 2026-08-21).** This plan is written and rewritten in conversation. The four
> architectural forks below are **answered**; the [open questions](#open) are not. How this plan
> was arrived at — including the two findings that reordered it — is in
> [2026-08-21](../history/2026-08-21-rabbit-history.md).

## Table of contents <a id="toc"></a>
- [§0 — Summary](#s0)
- [The scenario](#scenario)
- [A second scenario — nested-market arbitrage *(not built)*](#scenario2)
- [Architecture — where each bound actually lives](#arch)
- [Repo status](#status)
- [Implementation matrix — who builds what](#matrix)
- [Build order](#order)
- [Built so far — and how to check it](#built)
- [Open questions](#open)
- [What this will not prove](#not)
- [Ownership rules](#relations)

## 0. Summary <a id="s0"></a>
<sub>[↑ TOC](#toc)</sub>

Rabbit has the agent-payments machinery (ERC-7715/7710 session keys, a mandate grant/revoke demo,
LLM plumbing) and no autonomous loop. Verex has a working Sepolia CLOB prediction market and no
way for a stranger to trade on it — every order today is signed by a **server-held demo wallet**
(`accountIndex 1..9`, keys in Secret Manager). J2 is the one project that needs both, and it is
worth doing precisely because it forces each repo past the thing it has been avoiding: rabbit has
to let an agent act unattended, and verex has to accept a counterparty it does not custody.

**Four forks, answered (jay, 2026-08-21):**

| Fork | Answer |
|---|---|
| What does the mandate enforce? | **Funding, not trading.** The agent can only lose what was released to it |
| How does the agent reach verex? | **REST first, MCP wrapper later** — the wrapper closes verex's never-built S3 gap |
| Who decides the trade? | **LLM estimates the probability, a deterministic rule executes** |
| How deep does the loop go? | **All the way** — trade, wait for resolution, self-redeem |

**Consequence of the fourth answer:** the full loop needs a market resolved on live Sepolia, which
is verex's **W1**. W1's fresh seed **deletes staging's `Trade`/`PricePoint`/`Outcome`/`Market`
rows**, so re-seeding after the agent has traded on staging would leave its journal citing deleted
rows.

**Where W1 sits, revised (jay, 2026-08-25).** That constraint says **W1 before the first staging
run** — not W1 before everything. Locally it never applies: `./scripts/reset.sh` wipes and re-seeds
on demand, and the **mock** oracle resolves instantly, so Phases 1–4 including redemption are fully
testable on anvil. W1 therefore moved to [Phase 6](#order), immediately before the first staging
use. One piece is pulled forward: a [smoke probe](#probe) against the live adapter, because W1 is
the only thing in this plan that has never worked and it should not be discovered at the end.

**Where it stands (2026-09-04): the milestone happened.** On 2026-09-02 the loop produced its
first **fully scheduled, wallet-granted, on-chain-drawn trade** — a server tick nobody triggered
drew JUSD through a mandate granted by **MetaMask's own ERC-7715 popup** and bought `4.81 Yes`
(draw tx `0x5e765a3b…`; the mandate read `7.50/10` after). Phases 1–2 (V-A…V-D, R-A…R-E, R-I)
remain done with on-chain cap/expiry ([details](#onchain)); **R-F is built** ([Phase 3](#order)).
Two changes made the milestone possible, both bigger than they look:

- **The local chain is now an anvil fork of Sepolia** (chain id 11155111, pinned block, state
  file, default port 8545 — startup line in [docs/memo.md](../memo.md)). MetaMask therefore
  grants **real** 7715 permissions against its own canonical DelegationManager, which the fork
  inherits — answering [O9](#open) early: no local framework deployment, no raw typed-data blob.
- **A bearish view is expressed as BUY of the opposite outcome** on binary markets (SELL survives
  only on non-binary ones). Two holes close by construction: `insufficient Yes balance` is
  unreachable, and **every** trade now passes through the mandate draw — the cap bounds all of it.

**What remains for the closed loop:** R-G/R-H ([Phase 4](#order)), the MCP wrapper (Phase 5), W1
and the first staging run (Phase 6). R-F's own bar — a full unattended day — has not been soaked
yet; the scheduler has only run attended sessions so far. History note: this stretch is recorded
in the merge commits (rabbit `aa193cf` and after, verex `934be01`), not in docs/history — the
daily file is written on request only.

**A second scenario is written down but not built** — [nested-market arbitrage](#scenario2), added
2026-08-27 so the design is not read as "an LLM that trades on news". The mandate, the tick and the
journal are indifferent to where the signal comes from, and that section shows one that needs no
LLM at all. It carries a hand-test procedure; nothing in it is in the build order.

## The scenario <a id="scenario"></a>
<sub>[↑ TOC](#toc)</sub>

One tick, running on a schedule with no browser open:

| Step | What happens | Made visible as |
|---|---|---|
| **Observe** | Read a verex market: question, current book (best bid/ask on YES), the agent's own position, remaining budget, mandate expiry | the observed row in the journal |
| **Estimate** | An **LLM** reads the market question **plus the stored news for that market** and returns `{ p, rationale, cited }` — its probability, one line of prose, and which news items it used | the estimate column, with the rationale expandable and the cited headlines linked |
| **Decide** | A **deterministic rule** compares `p` to the book: act only if the edge exceeds a threshold **and** the cooldown has passed **and** the notional fits the remaining budget | the rule evaluated + verdict — **skips logged too** |
| **Act** | Sign a CTF order with the agent's own key and post it to verex | order hash → the trade on verex |
| **Watch** | Poll for resolution; when the market settles, redeem the winning position | realised P&L in the journal |
| **Record** | Append the row: time, market, book, `p`, cited evidence, verdict, order/skip reason, cumulative spend, budget left, expiry countdown | the journal table |

**Skips are the point.** A demo that only shows trades shows capability. A journal where most rows
read *"book 0.31, model 0.29, edge 0.02 < 0.05 → no action"* is what makes a decision visible as a
decision. **Expiry is the money shot** — leave the agent running past the deadline: it keeps
ticking, keeps wanting to top up, and the chain keeps refusing. Nobody revoked anything; the
window simply closed.

## A second scenario — nested-market arbitrage <a id="scenario2"></a>
<sub>[↑ TOC](#toc)</sub>

> **Not built, and not scheduled.** This section is an illustration of a *second* shape the same
> machinery could take, written at jay's request (2026-08-27) so the agent's design is not read as
> "an LLM that trades on news" when the mandate, the tick and the journal are indifferent to where
> the signal comes from. Nothing below is in the build order. It is here to be argued with.

**The signal is arithmetic, not a forecast.** Verex already seeds two markets that are logically
nested:

| Market | Question | YES |
|---|---|---|
| `eth-above-10k-2026` | Will ETH close above **$10,000** in 2026? | 0.44 |
| `uma-eth-above-6k-2026` | Will ETH close above **$6,000** in 2026? *(UMA-resolved)* | 0.62 |

Closing above $10,000 **implies** closing above $6,000. So `P(≥10k) ≤ P(≥6k)` must hold at all
times, and the tradeable form of a violation is:

```
best BID on eth-above-10k  >  best ASK on uma-eth-above-6k
```

When that happens the agent sells the 10k YES at the bid and buys the 6k YES at the ask, taking a
net credit for a position that can never lose: the leg it bought pays out in every world where the
leg it sold does.

**Why this scenario is worth writing down.** It removes the LLM entirely. The news scenario's
journal rows say *"the model thought 0.58"* — a claim a reader has to take on trust. These rows
would say *"0.64 > 0.63, and the first implies the second"* — a claim a reader can check. Same
mandate, same tick, same journal; a different `estimate` step and a two-leg `act` step.

**The honest caveat, which belongs in the demo rather than under it.** The two markets resolve
through **different oracles** — `eth-above-10k-2026` is operator-resolved, `uma-eth-above-6k-2026`
goes through the UMA adapter. They can disagree about the same underlying fact, so the position is
not *actually* riskless; it carries **basis risk** between two settlement processes. A demo that
claims "risk-free" without saying this is selling something.

### Testing it by hand <a id="scenario2-test"></a>

The agent side is not built, so this procedure only creates and observes the **condition**. It is
worth running anyway: it answers "could this ever fire?" before anyone writes the code.

**First, the finding that makes the naive version fail.** The seeded LMSR ladders are five levels
deep, ±5¢ around each mid — so the *reachable* price ranges do not overlap:

```
eth-above-10k-2026      0.39 ─── 0.44 ─── 0.49      (bids 0.43..0.39, asks 0.45..0.49)
uma-eth-above-6k-2026            0.57 ─── 0.62 ─── 0.67
```

Buying the 10k market until its ask is exhausted stops at **0.49**; selling the 6k market to its
floor stops at **0.57**. **Eating the ladders can never make them cross.** The violation has to be
*posted*, not walked to — a resting limit order priced past the whole ladder.

**Steps.** Verex API on `:4000`, anvil up, demo wallets seeded (wallet 1 holds 7,000 jUSD).

| # | Do this | Why / expect |
|---|---|---|
| 1 | `curl -s localhost:4000/markets/eth-above-10k-2026/book?outcome=Yes` and the same for `uma-eth-above-6k-2026` | Record both books. Expect `0.44` and `0.62` — the constraint **holds**, so there is nothing to arb |
| 2 | Post a limit BUY that outruns the ladder — from **wallet 1**, the only one with enough: <br>`curl -s -X POST localhost:4000/orders -H 'content-type: application/json' -d '{"slug":"eth-above-10k-2026","outcome":"Yes","side":"BUY","accountIndex":1,"type":"limit","amount":2100,"price":0.64}'` | `amount` is **tokens**. The first 2,000 fill against the whole ask ladder (≈ **927 jUSD**); the remaining 100 **rest as a bid at 0.64** (≈ 64 jUSD escrowed). Total ≈ **991 jUSD** |
| 3 | Re-read both books | `eth-above-10k` best bid **0.64**, `uma-eth-above-6k` best ask **0.63**. `0.64 > 0.63` — **the constraint is violated and the violation is tradeable** |
| 4 | Compute what an agent would take | Sell 10k YES at 0.64, buy 6k YES at 0.63 → **+0.01 per share, credit**, for a position that pays in every world where the sold leg pays |
| 5 | Execute the two legs by hand from **wallet 2** — a market SELL on `eth-above-10k` and a market BUY on `uma-eth-above-6k`, same token size | Wallet 2 must already hold 10k-YES tokens to sell; if it does not, buy some first and note that the round trip costs the spread. **This is the step that shows why the agent would need a two-leg `act`** — one leg filling without the other is an open position, not an arbitrage |
| 6 | Re-read the books | The bid at 0.64 is consumed and the constraint is restored. **A violation that no one takes is not evidence; a violation that closes when taken is** |
| 7 | Cancel whatever is left resting: <br>`curl -s -X DELETE localhost:4000/orders/<orderId> -H 'content-type: application/json' -d '{"accountIndex":1}'` | Returns `{"status":"CANCELLED"}` and the bid leaves the book immediately — **verified 2026-08-27** with a 10-token probe at 0.30, posted and cancelled with the book restored byte-for-byte |
| 8 | Restore the seeded state | `cd ~/work/verex && ./scripts/reset.sh`. ⚠️ **This deploys a fresh backbone** — the Exchange address changes, so re-read `/config` and grant a new mandate. A cached `verifyingContract` produces a valid signature of the wrong message |

**On the ≈991 jUSD.** That is not a fee. Roughly 927 of it *buys 2,000 YES tokens* at an average
0.46 — a position, not a loss — and the remaining ~64 is escrow behind the resting bid, released by
step 7. The only real cost of the round trip is the spread on selling those tokens back. Wallet 1
holds 7,000 jUSD and is the only demo wallet with room; the others hold 1,000.

**Two things this procedure does not prove.** It does not show the agent *finding* the violation —
step 2 is a human posting it. And step 5 is two separate orders that can partially fill
independently; a real implementation needs the legs to be atomic or the position bounded, which is
work this plan has not scoped.

### The other candidates, and why this one

| Shape | Why not chosen |
|---|---|
| **Market making** — quote both sides, earn the spread, manage inventory | Closest to what the industry actually runs, and to verex's own LMSR operator. But it needs continuous quoting and inventory limits, which is a much larger build — and it demonstrates a trading strategy rather than the mandate |
| **Price-change mean reversion** — buy after an X% move not explained by stored news | Simple, and needs no LLM. Weak locally: the operator's LMSR book only moves when someone trades, so the signal has to be manufactured by hand every time |
| **Time-decay convergence** — push toward 0/1 as resolution nears | Needs short-dated markets, which is [Phase 6](#order)'s W1 requirement. Blocked until then |

## Architecture — where each bound actually lives <a id="arch"></a>
<sub>[↑ TOC](#toc)</sub>

> **This section is the design.** Two parts of it changed while building: the mandate is **not**
> granted through ERC-7715, and the delegator is **not** the owner's EOA. For the system as it
> actually runs, see [autonomous-trading-agent.md](../features/autonomous-trading-agent.md); the reasons are in
> [The mandate is enforced on chain](#onchain).

```
  Owner wallet (MetaMask)
      │  ERC-7715 delegation — cap: N JUSD, expiry: T
      │  ◀── the ONLY on-chain enforcement point
      ▼  redeem ≤ cap
  Agent EOA            key on RABBIT's server (testnet-grade, labelled on the page)
      │                holds ONLY what was released — that is the whole safety claim
      │  signs CTF EIP-712 orders
      ▼
  Verex API  ──▶ CTF Exchange (Sepolia)   ◀── operator sends matchOrders
```

**Why "funding, not trading".** ERC-7710 enforcers inspect a **call**; a CTF order is a
**signature**. So a session key signing an order does not pass through any enforcer. Bounding the
*funding* instead gives a claim that is weaker in scope but completely honest, and it is true
arithmetic rather than trust: **the agent cannot lose what it never had.** The stronger version —
per-market and per-price limits enforced by contract — needs an EIP-1271 smart account with a
custom validator, and is recorded as a later milestone rather than built ([O4](#open)).

**Two gas facts, verified in verex's code on 2026-08-21, and they are not symmetric:**

- **Trading costs the agent nothing.** `book.ts:694` settles via `chain.exchangeAs(0).matchOrders(...)`
  — the **operator** sends the match transaction. An external maker only ever signs. So the agent
  needs no Sepolia ETH to trade, which is a genuinely nice property for an unattended process.
- **Redeeming does.** CTF `redeemPositions` must come from the position holder, so the agent EOA
  needs a little Sepolia ETH — **only** for the redemption leg. Budget it once, at Phase 4.

**Verex is closer to this than it looks.** `model Order` already stores `maker` (a real address),
`signedOrder` (Json) and a unique `orderHash`. `buildSignedOrder` then *signs on the client's
behalf* with `account(index)`. Accepting an external order is mostly **deleting that step**, not
adding one. What genuinely has to change is `makerIndex`, funding, and the index-scoped read
endpoints — Phase 1.

## Repo status <a id="status"></a>
<sub>[↑ TOC](#toc)</sub>

Summary only — each repo's own plan is authoritative.

| | Rabbit | Verex |
|---|---|---|
| Plan | this file + [features README](../features/README.md) | [current-plan.md](../../projects/verex/docs/tasks/current-plan.md) |
| Relevant, built | ERC-7715/7710 mandate grant + revoke (`app/live/aa/SessionKeyDemo.tsx`, **Sepolia-only**), LLM plumbing (`app/api/jay-chat/`), Prisma/Postgres, `/live/agent` mock + `/live/agent/console` | CLOB + CTF backbone on Sepolia, LMSR operator maker, UMA adapter deployed against the **live** oracle, `packages/sdk` with `signOrder` |
| Relevant, missing | **R-G/R-H only** — the scheduler landed 2026-09-02 (`lib/agent-scheduler.ts` + console panel), so ticks run with nobody in the room; resolution watch / self-redeem and the expiry run are what's left ([B1](../features/README.md#b1)) | any external-account path; `packages/mcp-server` ([V4](../../projects/verex/docs/features/README.md#v4)) |
| Blocking decision | **none open.** D2 answered by J2 (agent key on rabbit's server); [O1](#open) answered 2026-08-25 (`file:` link now, publish before deploy) | **W1** — no market has ever been resolved through the live adapter. Moved to [Phase 6](#order); does **not** gate Phases 1–4 |

## Implementation matrix — who builds what <a id="matrix"></a>
<sub>[↑ TOC](#toc)</sub>

The [build order](#order) below has the reasoning and the done-when gates. This is the same work as
a table, so you can see at a glance which repo owes what and where the two actually touch.

### At a glance

| | Rabbit | Verex |
|---|---|---|
| **Items** | 9 (R-A … R-I) | 7 (W0, W1, V-A … V-E) |
| **Rough total** | ~4–6d | ~5–8d |
| **What it is being asked to change** | build the loop it never had — mandate, tick, LLM estimate, journal, scheduler, redeem | **stop being a custodian** — accept, fund-check, read and redeem for an address it holds no key for |
| **Nothing changes in** | the existing `/live/aa` mandate demo (reused, not modified) | the CLOB matching engine, LMSR quoting, the CTF contracts — all untouched |
| **Where the seam is** | R-B signs a CTF order | V-A accepts one |

### Full matrix

The `#` prefix names the repo — **V**, **W0** and **W1** are verex, **R** is rabbit. Rows marked **⇄**
come in pairs and are the only genuinely two-sided work: **V-A ⇄ R-B** (one signs an order, the
other accepts it) and **V-D ⇄ R-G** (one exposes redeem, the other calls it). They are placed
adjacent so the seam is visible in the table rather than inferred from the dependency column —
which means **this table is not a work queue**; the [build order](#order) below is.

| # | Task | What to implement | Depends on |
|---|---|---|---|
| **⇄ V-A** | External signed orders | `POST /orders` + `POST /trade` accept a client-supplied `SignedOrder` with an arbitrary `maker`; verify EIP-712 server-side; migration making `Order.makerIndex` nullable. **Also: `/config` must return the CTF Exchange address** — rabbit builds the EIP-712 domain from `chainId` + `verifyingContract`, and `./scripts/reset.sh` changes that address on every local reset, so it has to be read, not hardcoded | — |
| **⇄ R-B** | Verex client | Typed client over V-A…V-D that signs CTF EIP-712 orders with the agent key. If [O1](#open) says publish `@verex/sdk`, part of this becomes a verex row | V-A…V-D, **O1** |
| **V-B** | Funding stops being the API's job | `ensureFunds` **reads and rejects** for external makers instead of faucet+approving on their behalf; address-scoped faucet for testnet convenience | V-A |
| **V-C** | Address-scoped reads | `/wallet/:address` — balance, positions, open orders, redeems, history (today all `/wallet/:index`) | V-A |
| **⇄ V-D** | External redeem | `POST /redeem` by address; the redeem tx is signed by the **holder**, not the operator | V-C |
| **⇄ R-G** | Resolution watch + self-redeem | Poll verex for resolution; redeem a winning position; record realised P&L. **Needs a little Sepolia ETH — this leg only** | V-D, R-F |
| **R-A** | Mandate: grant · fund · revoke | ERC-7715 delegation scoped to **amount + expiry**; redeeming it moves ≤ cap of JUSD to the agent EOA; key generated server-side, address-only to the browser, **labelled testnet-grade on the page** | — |
| **R-C** | The tick, callable by hand | `POST /api/agent/tick` — observe → estimate → decide → act → record; **calling it twice must be safe** | R-A, R-B |
| **R-I** | **News store — input, list, persistence** | Prisma model `NewsItem` — market scope, headline, body or URL, source, published-at, entered-at, `origin: operator \| feed`. An **input form** and a **list of stored items** for the selected market, with edit and delete. **The estimate reads this store, never a prompt textarea** — so a journal row's cited evidence still resolves to a row that exists tomorrow | — |
| **R-D** | LLM estimate | LLM returns `{ p, rationale, cited }` for a market — reads the question **plus that market's items from R-I**. `cited` records which `NewsItem` ids the estimate actually used. The **deterministic rule** still owns the decision. Reuses `app/api/jay-chat/` plumbing | R-C, **R-I**, **O5** |
| **R-E** | Journal + persistence | Prisma model, read API, and the `/live/agent` page showing the three states. Must record **skips**, and each row must carry **the evidence it cited** (R-I ids, resolvable to headline + source) — chain-only reconstruction can record neither | R-C |
| **R-F** | Actually unattended | Scheduler wired; the loop runs with no browser and no terminal | R-C…R-E, **O2** |
| **R-H** | The expiry run *(evidence)* | Let a mandate lapse with the scheduler live; capture the journal filling with harmless refusals | R-F |
| **V-E** | MCP server | **`packages/mcp-server`**: `list_markets`, `get_book`, `place_order`, `get_position`, `redeem`, wrapping V-A…V-D's REST. Closes the S3 gap. The agent swaps transport — no logic change | V-A…V-D |
| **W0** | Live-oracle smoke probe | One `initialize` on the **staging** adapter with **Sepolia WETH** as reward token. Minutes, not a day. Answers the only question that can genuinely surprise W1: does the live oracle accept a request from this adapter at all? **Run early, in parallel with anything** | — |
| **W1** | Prove UMA on live Sepolia | Fresh staging seed **including ≥1 short-dated UMA market**, resolve one market end-to-end through the live adapter, winner redeems, close **A5**. Sits at [Phase 6](#order) — before the first staging run, not before everything | W0 (advisory) |

**Reading the dependency column:** the only hard cross-repo blocks are the two **⇄** pairs —
**V-A…V-D → R-B** and **V-D → R-G**. Everything in R-A, and all of P0/V-A/V-B/V-C, can proceed in
parallel, so the two repos are not serialised on each other except at those two points.

## Build order <a id="order"></a>
<sub>[↑ TOC](#toc)</sub>

> Ordered as jay described it: verex opens up, rabbit's agent arrives, the loop closes, and only
> then does any of it touch a real testnet. **Phases 1–4 run entirely on the local Foundry chain**
> — `anvil` + the mock oracle, which resolves instantly — so nothing here waits on Sepolia.
> `[V]` = verex repo, `[R]` = rabbit repo. Estimates are focused-work days.

### Run early, in parallel — W0, the live-oracle smoke probe `[V]` <a id="probe"></a> · minutes

Not a phase and not on anyone's critical path. **W1 is the only thing in this plan that has never
worked**, and everything it depends on belongs to a contract verex did not write — UMA's collateral
whitelist, its final fee, a real liveness window. Deferring the single riskiest unknown to the very
end is how you find out too late.

The probe is one call: **`initialize` on the staging adapter with Sepolia WETH as the reward
token.** If the live oracle accepts the request, the rest of W1 is waiting and configuration and
can safely sit at the end. If it reverts, you learn it now.

**Do not use JUSD.** [`UmaCtfAdapter`](../../projects/verex/packages/contracts/src/UmaCtfAdapter.sol)'s
own docblock says it: the reward token must be on UMA's `AddressWhitelist`, JUSD is not, and
Sepolia WETH `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` is — self-service via `deposit()`. This
is the trap that passes locally and reverts on Sepolia.

### Phase 1 — verex accepts a counterparty it does not custody `[V]` · ~2–3d

The interesting half of this phase is that verex stops being a custodian, which is a product claim
for verex on its own — not a favour to rabbit.

| | Item | Detail |
|---|---|---|
| **V-A** | **External signed orders** | `POST /orders` and `POST /trade` accept a client-supplied `SignedOrder` with an arbitrary `maker`. Verify the EIP-712 signature server-side (fail fast; the Exchange re-verifies at match anyway). Migration: `Order.makerIndex` becomes nullable — `maker`, `signedOrder` and `orderHash` already exist |
| **V-B** | **Funding stops being the API's job** | `ensureFunds` currently faucets and approves *on behalf of* the maker, which it cannot do for a key it does not hold. For external makers it **reads and rejects** instead: insufficient balance or allowance is a 400, not something the server silently fixes. Add an address-scoped faucet for testnet convenience |
| **V-C** | **Address-scoped reads** | `/wallet/:address` for balance, positions, open orders, redeems, history — today all `/wallet/:index` |
| **V-D** | **External redeem** | `POST /redeem` takes an address; the redeem transaction is signed by the holder, not the operator (see the gas note in [Architecture](#arch)) |

**Done when:** a wallet verex has never heard of funds itself, signs an order, gets filled against
the operator's LMSR ladder, and reads its own position back — with **no `accountIndex` required in
the external-maker path**.

> **Not** "no `accountIndex` anywhere" (jay, 2026-08-25). Index 0 **is** the operator's LMSR maker —
> the counterparty an external order fills against — so it cannot leave. And `Order.makerIndex`
> becomes *nullable*, not removed: the demo wallets on the web page keep trading exactly as today.
> **Phase 1 is additive.** Retiring the user-facing index path later is [O8](#open).
>
> **Milestone before Phase 2 — the MetaMask-signed order.** After V-A…V-C, place an order from
> rabbit's `/live/agent` page signed by **MetaMask**, not by an agent key. Same wire format, same
> endpoints; the only thing that changes later is who holds the key. It proves this whole gate from
> a browser and needs neither R-B nor the [O1](#open) decision.

### Phase 2 — the agent exists, driven by hand `[R]` · ~3–4d

| | Item | Detail |
|---|---|---|
| **R-A** | **Mandate: grant · fund · revoke** | ERC-7715 delegation scoped to amount + expiry; redeeming it transfers ≤ cap of JUSD to the agent EOA. Key generated server-side, address-only to the browser, **labelled testnet-grade on the page** — this is D2, answered |
| **R-B** | **Verex client** | Typed client over V-A..V-D that signs CTF orders with the agent key. Blocked on [O1](#open) — how rabbit obtains verex's order-signing code |
| **R-C** | **The tick, callable by hand** | `POST /api/agent/tick` — observe → estimate → decide → act → record. **Calling it twice in a row must be safe**, verified by `curl` before any scheduler exists |
| **R-I** | **News store — input, list, persistence** | `NewsItem` in Postgres (market scope, headline, body/URL, source, published-at, entered-at, `origin`), an input form, and a list of the selected market's items with edit/delete. The estimate reads **the store**, not a prompt textarea, so a journal row's cited evidence outlives the input box. Scope and staleness are [O7](#open) |
| **R-D** | **LLM estimate** | The LLM returns `{ p, rationale, cited }` for a market question, reading the question **plus R-I's items for that market**; the **rule** owns the decision. Reuses rabbit's existing LLM plumbing. Rate/cost per tick is [O5](#open) |
| **R-E** | **Journal + persistence** | Postgres via the existing Prisma setup. Chain-only reconstruction is not an option — it cannot record **skips**, and skips are the point. Each row also carries the **evidence it cited** (R-I ids, resolvable to headline + source) |

**Done when:** `curl`-ing the tick twice produces exactly one trade, one journal row per call
including the skip, and a budget figure that matches the chain — and an estimate's row names the
`NewsItem` rows it cited, which still resolve after the input box is cleared.

### Phase 3 — actually unattended `[R]` · ~0.5d

**R-F.** Wire the scheduler ([O2](#open)). **This is the milestone that earns the word "agentic"** —
Phases 1–2 without it are still a button.
**Done when:** the loop runs for a day with no browser and no terminal, and the journal shows ticks
nobody triggered.

> ✅ **Built 2026-09-02.** An in-process server timer — `lib/agent-scheduler.ts`, a `globalThis`
> singleton so dev HMR keeps it; minimum interval 5s; a tick in flight is never overlapped —
> driven by `POST /api/agent/scheduler` and a console panel. Settings are **captured at Start**;
> changing a dial mid-run does nothing until Stop → Start. The tick body moved verbatim to
> `lib/agent-tick.ts` so the route and the scheduler run the same function, and the manual
> "Run one tick" button is gone — the scheduler is the only trigger. The journal already shows
> ticks nobody triggered; **the full unattended day has not been soaked**, so the bar above
> still stands.

### Phase 4 — the loop closes `[R]` · ~1–2d

| | Item | Detail |
|---|---|---|
| **R-G** | **Resolution watch + self-redeem** | **Poll** verex for resolution; when a held position wins, redeem it and record realised P&L. The agent needs a little Sepolia ETH for this leg only. **Poll, never `await` inline** — the mock oracle settles instantly, live UMA has a liveness window, so an inline wait passes on anvil and hangs on Sepolia |
| **R-H** | **The expiry run** *(evidence, not code)* | Let a mandate lapse with the scheduler live. Capture the journal filling with harmless refusals. Add it to the PoC card's tech notes |

**Done when:** one round trip — estimate, trade, resolution, redeem — appears as a connected set of
journal rows, and a second mandate is allowed to expire on camera.

### Phase 5 — MCP wrapper `[V]` · ~1–2d

**V-E.** `packages/mcp-server` — a **thin** wrapper over Phase 1's REST endpoints
(`list_markets`, `get_book`, `place_order`, `get_position`, `redeem`). Not a rewrite: MCP calls the
same API the agent already uses, so this is a second front door, not a second implementation.
Closes verex's S3 gap and makes any MCP client — not just rabbit's agent — able to trade.
**Done when:** rabbit's agent runs unchanged against the MCP transport, and a generic MCP client
can place one order without reading verex's source.

### Phase 6 — go to Sepolia: W1 and the first staging run `[V]` · ~1–2d

**Why last (jay, 2026-08-25).** The re-seed rule says *W1 before the first staging run*, and this
is that moment. Everything before it ran on anvil against the mock, so there was never staging
history to protect. Testing on a testnet gets redone at the end regardless, so doing it early would
be doing it twice. What makes this safe rather than reckless is [W0](#probe), run early.

**The steps live in verex's plan**, not here — W1 is verex's item and this file only owns the
seam. Seven steps with the trap next to each:
[verex current-plan.md → W1](../../projects/verex/docs/tasks/current-plan.md#w1). The short version
is: fund Sepolia WETH (**not JUSD** — it is not on UMA's whitelist), fresh seed with a
short-dated market, propose, wait out real liveness, settle, redeem, close A5.

**Take the undisputed path.** The dispute branch is **not walkable on Sepolia**: a real dispute
escalates to UMA's DVM — a ~2-day staked commit/reveal round that testnet does not reliably
provide. The mock's jury exists precisely because that half is only demonstrable locally. Do not
design the demo around a dispute resolving.

**Done when:** one market resolved end-to-end through the live adapter, a winner redeemed, **A5**
closed, and the seed left at least one short-dated market the agent can plausibly see resolve
inside a demo. *(That last clause is J2's requirement on W1, not W1's own.)*

## Built so far — and how to check it <a id="built"></a>
<sub>[↑ TOC](#toc)</sub>

> Written 2026-08-25, extended 2026-08-26 with R-A · R-E · R-I and the on-chain mandate.
> **Merged and pushed 2026-08-26** — `claude/j2-phase-1-2` is on `main` in both repos
> (rabbit `306811b`, verex `5154c4f`). Nothing is deployed: rabbit has no workflow and verex's is
> `workflow_dispatch` only. Both repos have moved on since, so read `git log`, not this line.
> Full narrative: [2026-08-26-rabbit-history.md](../history/2026-08-26-rabbit-history.md).
>
> **2026-08-27 — V-B did not actually run.** The row below was true about the code and false about
> whether it worked: verex's API signed as an operator with no gas on the local chain, so every
> faucet call died as `Insufficient funds for gas * price + value`. Because
> `app/api/agent/mandate/prepare/route.ts` funds the owner smart account **through that faucet**,
> and swallows its failure with `.catch(() => null)`, **steps 5–13 of the walkthrough below could
> not have passed** — the mandate would grant with an unfunded smart account and every tick would
> fail to draw, with nothing on screen saying why. Root cause: `scripts/dev-local.sh` exports a
> default `VEREX_OPERATOR_KEY` that the seed inherits, while a separate terminal running the API
> picks a *different* key out of `packages/api/.env` — dotenv never overrides a shell variable.
> Fixed on verex branch `claude/faucet-operator-and-target`.

### What landed

| # | Status | Where |
|---|---|---|
| **V-A** | ✅ | `packages/api/src/book.ts` — `verifyExternalOrder`, `limitAmountsE6`, the external branch in `placeOrder`, and the settle handler using the **stored** signature with a partial `takerFillAmount`. Migration `20260825000000_maker_index_nullable` |
| **V-B** | ✅ | `checkExternalFunds` (reads and rejects), `faucetTo` + `POST /faucet {address}`. **Written 2026-08-26, working 2026-08-27** — see the note above; the UI for it (an address field on the faucet, showing the JUSD address) landed with the fix |
| **V-C** | ✅ | `walletSummaryByAddress` / `walletHistoryByAddress`; `/wallet/:x` branches on `isAddress` |
| **V-D** | ✅ | `recordExternalRedeem` — verifies the receipt's `PayoutRedemption` before recording. `/config` gained `ctf` + `jusd` |
| **SDK** | ✅ | `recoverOrderSigner` + 3 tests |
| **R-A** | ✅ | `lib/agent-wallet.ts`, `lib/delegation.ts`, `app/api/agent/mandate` + `/prepare`, `MandatePanel.tsx`. **The cap and the expiry are enforced by contracts on-chain** — see [the mandate is real now](#onchain) |
| **R-B** | ✅ | `lib/verex-client.ts`. `@verex/sdk` via `file:` link ([O1](#open)) |
| **R-C** | ✅ | `app/api/agent/tick` — observe → estimate → decide → act → record |
| **R-D** | ✅ | `lib/agent-estimate.ts` — Qwen via the existing DashScope key, strict-JSON `{p, rationale}` |
| **R-E** | ✅ | `AgentTick` model, `GET /api/agent/tick` (resolves cited ids to headline + source), `JournalPanel.tsx` — six verdicts, six distinct chips |
| **R-I** | ✅ | `NewsItem` model, `app/api/agent/news`, `NewsPanel.tsx` — with a badge for how many items are **inside the window the estimate actually reads** |
| **console** | ✅ | `app/live/agent/console/` — preflight + the three panels. **Local only**; the mock at `/live/agent` is untouched and now links to it |

**Not started:** R-G (resolution watch), R-H (expiry run), V-E (MCP), W1.
**R-F landed 2026-09-02** — see [Phase 3](#order).

### Since 2026-09-01 — the fork, the scheduler, the first unattended trade

| What | Where |
|---|---|
| The local chain became an **anvil fork of Sepolia** — chain id 11155111, pinned block, state file, default port 8545 | startup + daily steps in [docs/memo.md](../memo.md); operator key consolidated into verex's root `.env` |
| Real MetaMask ERC-7715 grant, drawn on-chain through the **canonical** DelegationManager the fork inherits | `MandatePanel.tsx` — `startTime` is read from the chain's own block clock, not `Date.now()`: a fork's clock trails wall time, and a restart restores the old time from the state file (`ERC20PeriodTransferEnforcer:transfer-not-started` was this) |
| **R-F**: scheduler + start/stop panel; tick body extracted to `lib/agent-tick.ts`; manual tick button removed | `lib/agent-scheduler.ts`, `app/api/agent/scheduler/`, `SchedulerPanel.tsx` |
| Bearish → **BUY the opposite outcome** on binary markets; TRADED rows say "(bearish on X, expressed as Y)" | `lib/agent-tick.ts` |
| Participants panel — operator/user/agent ETH+jUSD balances, +1 ETH / +1000 jUSD buttons; user row from `USER_PRIVATE_KEY`, ETH funded as a real transfer from anvil #0 | `ParticipantsPanel.tsx`, `app/api/agent/{participants,fund}` |
| In-console approvals (jUSD allowance + CTF `setApprovalForAll`), idempotent, button survives failure | `Preflight.tsx`, `app/api/agent/approve/` |
| Live hub renamed **Demo**; the console got its own card; verex `/config` serves the operator address | `app/Nav.tsx`, `lib/poc-cards.ts`; verex `packages/api` |

Commits: rabbit `aa193cf` (the 2026-09-02 console day; fork work merged just before it),
verex `934be01`. The **first scheduled on-chain-drawn trade** is quoted in [§0](#s0).

### The mandate is enforced on chain, not by the server <a id="onchain"></a>

jay chose **option (c)** on 2026-08-26: deploy MetaMask's delegation framework to the local anvil
rather than let the server play at holding the boundary. It worked, and it is cheaper than the
plan assumed — `@metamask/smart-accounts-kit` (already a dependency) ships
`deploySmartAccountsEnvironment()`, which puts DelegationManager, SimpleFactory, the
implementations and ~35 caveat enforcers on any chain. **240 ms on anvil.**

Two of those enforcers are exactly R-A's two boundaries:

| Boundary | Contract | What it says when it refuses |
|---|---|---|
| Amount | `ERC20TransferAmountEnforcer` | `allowance-exceeded` |
| Deadline | `TimestampEnforcer` | `expired-delegation` |

**Not** via `wallet_requestExecutionPermissions` (ERC-7715). That call is answered by the MetaMask
extension, which supplies the DelegationManager address in its response — the SDK hardcodes none,
which is the proof. Our deployment is not CREATE2, so its addresses could not match what the wallet
expects even if chainId 31337 were on its list. Instead the mandate is a plain EIP-712 `Delegation`
whose `verifyingContract` and `chainId` **we** pass, so `eth_signTypedData_v4` works on any chain.
The console has a button that asks the wallet for its real supported-chain list, so the day 31337
appears there, this decision can be revisited from evidence rather than memory.

Consequence to know: the delegator is a **Hybrid smart account** owned by the MetaMask EOA, because
`redeemDelegations` executes in the delegator's context and therefore needs contract code there.
The jUSD lives at the smart-account address, not at the EOA. It is funded by **V-B's address-scoped
faucet** — a Phase 1 piece that slotted in unchanged. Upside: no EIP-7702, so anvil never needs the
Prague hardfork.

**The tick now draws through the delegation before it places an order.** Order-first would leave a
book entry that cannot settle if the draw is refused — the same failure shape as verex's W6.5.

### Three decisions taken while building, not asked

1. **External orders are limit-only.** A market order needs the client to sign worst-case terms —
   that is its slippage policy, not verex's. Index-based market orders are untouched.
2. **V-D records instead of executing.** Verex holds no key for an external holder, so it cannot
   send `redeemPositions`. The holder redeems and reports the tx; verex verifies the receipt.
3. **The estimate is skipped when there is no news.** A pure prior is frozen at the model's
   training cutoff and competes with a live book — the market wins by construction. Recorded as
   `SKIP_NO_ESTIMATE` with a reason rather than silently guessing.

### One gap this created, deliberately left open

Funds are checked **at placement**. An external maker can place a resting order and then withdraw,
leaving a book entry that cannot settle — a demo wallet cannot, because verex holds its key.
Recorded as **W6.5** in verex's plan. Cheap fix: re-check at match time. Thorough fix: W5.

### How to check it <a id="check"></a>

**Setup** — four terminals, and `AGENT_PRIVATE_KEY` must be set or the agent's address changes on
every restart and orphans the mandate.

```bash
# 1 — chain
anvil

# 2 — verex: postgres + schema + seed, then the API
cd ~/work/verex && ./scripts/dev-local.sh
pnpm --filter @verex/sdk build          # rabbit's file: link resolves to dist/
pnpm --filter @verex/api dev

# 3 — rabbit
cd ~/work/rabbit
export AGENT_PRIVATE_KEY=0x…            # any test key; must be stable
export VEREX_API_URL=http://127.0.0.1:4000
export AI_API_KEY=…                     # the DashScope key jay-chat already uses
npx prisma db push                      # NewsItem, Mandate, AgentTick
pnpm delegation:deploy                  # DelegationManager + ~35 enforcers → anvil (~0.2s)
pnpm agent:seed-news                    # the demo's evidence — see below
pnpm dev                                # rabbit → :3100  (verex's web already has :3000)
```

> Console: **http://localhost:3100/live/agent/console**. The system as it actually runs — processes,
> ports, keys, seams — is [autonomous-trading-agent.md](../features/autonomous-trading-agent.md).

**Prove the boundaries are real before touching the UI.** This needs nothing but anvil and the
deploy above — no verex, no postgres, no MetaMask:

```bash
pnpm delegation:verify
```

It draws inside the mandate, then over the cap, then past the expiry, and prints what the contracts
say. Expect exactly this, and treat any other outcome as the demo being broken:

```
1. draw 4 of 10 …………………  agent jUSD: 4
2. cap exceeded …………………  ERC20TransferAmountEnforcer:allowance-exceeded   (still 4)
3. after expiry ………………… TimestampEnforcer:expired-delegation             (still 4)
```

Step 3 is the whole argument: **nobody revoked anything.** The window closed, and the same code with
the same key keeps running and keeps being refused.

### The demo case, seeded <a id="democase"></a>

The news store starts empty, so until 2026-08-27 the only way to see the scenario was to type a
headline and hope. `pnpm agent:seed-news` (rabbit, `scripts/seed-agent-news.mjs`) fills it with
**two cases on purpose** — jay's decision, because the demo has to show both halves:

| Market | Evidence | Expected |
|---|---|---|
| `us-federal-stablecoin-law-2026` — *Will the US enact a federal stablecoin law in 2026?* (YES 0.58, ask 0.59) | three headlines pointing one way: committee advances the bill 18–6, floor vote scheduled, Treasury calls it a 2026 priority | **TRADED** — `p` should clear 0.59 + 0.05 |
| `eth-above-10k-2026` — *Will ETH close above $10,000 in 2026?* (YES 0.44, ask 0.45) | jay's own example: *"The CLARITY Act has not been approved by the Senate before recess"* | **SKIP_EDGE** — a real signal whose link to a price market is indirect |

**The second row is the more important one.** This plan's claim is not "the agent trades", it is
"a decision is legible as a decision" — and a skip carrying its reasoning and its cited headline is
what proves that. A demo where everything trades has quietly dropped the argument.

**Expected is not guaranteed.** The verdict depends on where the LLM puts `p`, which can differ run
to run. **Do not tune `edgeThreshold` until it says what you want** — the moment the threshold is
chosen to produce a verdict, the journal stops being evidence and becomes staging. Read what comes
out.

The public page at `/live/agent` tells this same story as a hand-written script
(`AgentJournalMock.tsx`, rewritten 2026-08-27) — same columns, same verdict names and colours as
the console's `JournalPanel`, so a visitor with no local chain and an operator with one are looking
at the same agent. It walks all seven verdicts and ends on two consecutive `SKIP_EXPIRED` rows.

**The checks, in order.** Each one either passes or names what broke.

| # | Do this | Expect |
|---|---|---|
| 1 | `curl localhost:4000/config` | `exchange`, `ctf`, `jusd` all present and non-null. **This is what makes the EIP-712 domain buildable** — hardcoding it breaks on every `reset.sh` |
| 2 | Open **`/live/agent/console`** | the preflight strip: verex chain, exchange, DelegationManager, agent address and balance. **Everything below depends on this row being green** |
| 3 | Read the preflight's chain row | verex's chainId and the framework's must **match**. If they differ the page says so in red — a cap governing one chain's token while the trade happens on another makes the demo's claim false |
| 4 | Check `agentKeyIsPersistent` | `true`. If false, `AGENT_PRIVATE_KEY` is unset and every mandate you grant will be orphaned by the next restart |
| 5 | **Connect MetaMask**, cap `10`, expiry `60` min → *Grant mandate* | one signature popup showing a `Delegation` struct. Then the panel shows the owner **smart account** address, its funded balance, and an **ON-CHAIN** badge |
| 6 | Expand *"Why not MetaMask's own permission popup"* → *Ask the wallet* | the wallet's real ERC-7715 chain list. **If 31337 is absent, that is the evidence for option (c)**; if it ever appears, this decision is worth revisiting |
| 7 | Run a tick with the news store empty | `SKIP_NO_ESTIMATE`. **With no news the LLM is not called at all** — a pure prior loses to a live book by construction |
| 8 | Add a headline in panel 2 | the badge counts items **inside the window**, not everything stored. Set the window to `1`h and watch a stale item grey out — that is what the estimate will ignore |
| 9 | *Run one tick* | a row. `TRADED` if the edge cleared, otherwise a **named** skip — both are correct outcomes. A traded row carries the on-chain draw's tx hash |
| 10 | **Press it again immediately** | `SKIP_COOLDOWN` with seconds remaining. **This is the "calling it twice must be safe" gate** |
| 11 | Set edge threshold to `0.9`, wait out cooldown, tick | `SKIP_EDGE` quoting book, model, and the shortfall |
| 12 | Keep ticking until the cap is gone | `SKIP_BUDGET`, then `SKIP_EXHAUSTED` — **these must not look alike**, and they don't: different chips, different sentences |
| 13 | Grant a mandate expiring in ~2 min, let it lapse, tick | `SKIP_EXPIRED`, and the reason carries **`TimestampEnforcer:expired-delegation`** — the contract's own words, because the tick simulates the draw rather than reading the DB and asserting. Nobody revoked anything |
| 14 | Delete a news item that a journal row cited | the row keeps the citation and shows **"deleted item"**. Evidence that vanished is itself a fact worth recording |
| 15 | Read the journal header | *"N of M ticks did nothing."* If only trades were there, the demo's whole claim would be missing |
| 16 | `curl localhost:4000/wallet/<agent>` | **V-C** — position and balance for an address verex holds no key for |
| 17 | `curl localhost:4000/wallet/1` | still works. **Phase 1 is additive** — demo wallets were not removed |
| 18 | `POST /api/agent/tick` **after revoking** | 400 *"no active mandate"*. Revocation and expiry are different events and read differently |

**Automated checks that already pass:**

```bash
cd ~/work/verex && pnpm --filter @verex/api exec tsc --noEmit   # clean
pnpm --filter @verex/sdk test                                    # 6/6, incl. tampered-amount
cd ~/work/rabbit && npx tsc --noEmit                             # clean
npx next build                                                   # clean
pnpm delegation:verify                                           # 3/3 on a live chain
```

**What a failure most likely means.** A valid signature that the exchange rejects is almost always
a **stale exchange address** — `reset.sh` deploys a fresh backbone, and a cached `verifyingContract`
produces a perfectly valid signature of the wrong message. Re-read `/config` — the preflight strip
puts that address on screen for exactly this reason.

A *mandate* failure reads differently: if the signature is refused, the delegator is usually the
**EOA rather than the smart account**, and if `redeemDelegations` reverts with no enforcer name, the
smart account is probably not deployed yet.

## Open questions <a id="open"></a>
<sub>[↑ TOC](#toc)</sub>

| | Question | Blocks | State |
|---|---|---|---|
| **O1** | **Where does rabbit's copy of the order-signing code come from?** The signed thing is an EIP-712 hash over 12 fields plus the domain; two copies that drift produce a *valid signature of the wrong message*, and the error never mentions the struct — the same one-source rule the docs pipeline enforces | deploying R-B — **not** building it | ✅ **answered 2026-08-25.** Local: `"@verex/sdk": "file:../verex/packages/sdk"` — pnpm symlinks, so verex stays the single definition. Publish `@verex/sdk` (flip its `"private": true`) **before rabbit deploys**, since `file:` paths do not exist on Cloud Run. Import line is identical either way. Build the SDK first (`pnpm --filter @verex/sdk build`) — it resolves to `dist/`, and a symlink does not rebuild itself. viem is compatible: rabbit `^2.55.10` satisfies the SDK's `^2.21.0` |
| **O2** | **Scheduler host** — Cloud Run job + Cloud Scheduler · GitHub Actions cron (note: rabbit has **no** `.github/workflows/` at all) · hosted cron pinging the tick | R-F | ◐ **answered for the local PoC 2026-09-02** — an in-process Next server timer ([Phase 3](#order)): nothing to pay for or deploy, and the cheapest thing that survives a day unattended *on localhost*. Reopens the moment this deploys — an in-process timer dies with its Cloud Run instance |
| **O3** | **Which markets may the agent touch?** A funding bound says nothing about *what* it trades. A whitelist is policy in rabbit's code today; making it a contract-level bound is O4 | R-C's rule | ⬜ open |
| **O4** | **Per-trade policy via EIP-1271** — the stronger enforcement recorded but not built. Worth it only if the funding bound proves too coarse in practice | — | ⬜ deferred by design |
| **O5** | **LLM cost and cadence** — one estimate per market per tick gets expensive on a short interval. Cache per market until the book moves? | R-D | ⬜ open |
| **O6** | **Does the demo run against staging or a dedicated environment?** The agent trading on staging means its rows sit in the same DB as everything else, and any future re-seed wipes them again | Phase 1 | ⬜ open — surfaced by Phase 0's re-seed problem |
| **O10** | **The console ships the delegation SDK to the browser** — `/live/agent/console` is 165 kB of first-load JS, and the only thing that needs the SDK client-side is the ERC-7715 probe button. Everything else is signed server-side and posted. Dropping the probe (or lazy-loading it) would take the page back to ~10 kB. Left as-is because the page is local-only and the probe is the evidence for option (c) | — | ⬜ open — cosmetic until the page is ever public |
| **O8** | **Does the user-facing `accountIndex` path get retired once the external path is proven?** Removing it would give one funding behaviour instead of two, and a cleaner claim (*verex holds no user keys*). It would also cost seven web components and turn verex's demo from "open the page and trade" into "install MetaMask first". **Index 0 stays regardless** — it is the operator's LMSR maker. Trigger: external orders working **and** a MetaMask flow in the web. Until then both paths coexist, and **one test on the index path** is what stops it rotting | — | ⬜ deferred — not before its trigger |
| **O7** | **News scope and staleness** — is a `NewsItem` scoped to one market or global with market tags? Does an item age out? A headline from three weeks ago should not keep moving `p` | R-I, R-D | ◐ **half-answered 2026-08-26.** Scope is per market, and the estimate only reads items published inside a window (default 48h) that the console exposes as a dial — the news panel shows how many items are *inside* it, so an ignored item is visible rather than mysterious. **Still open:** whether the window is the right ageing model at all, or whether relevance should decay rather than cut off |
| **O9** | **Does the mandate's chain enforcement survive the move to Sepolia?** Locally the framework is deployed by `pnpm delegation:deploy` at addresses we chose. On Sepolia MetaMask's own deployment already exists, so [Phase 6](#order) can either reuse it (and possibly switch to the native ERC-7715 popup) or deploy a second copy. Reusing it is better — the popup is a real wallet UI rather than a raw typed-data blob — but it depends on the wallet's supported-chain list, which the console's probe button reads | Phase 6 | ✅ **answered 2026-09-01 by the fork** — the local chain *is* Sepolia now, so the console already uses MetaMask's own deployment and its native ERC-7715 popup; the canonical DelegationManager is inherited. Phase 6 reuses it by construction |

## What this will not prove <a id="not"></a>
<sub>[↑ TOC](#toc)</sub>

Written up front so it does not get quietly dropped, and it belongs on the page itself.

- **Not autonomous goal-setting.** A human writes the rule and grants the mandate. The agent
  chooses *when* and *whether*, not *what for*.
- **Not production custody.** A server-held key is a demo compromise, labelled as one.
- **Not a trading strategy.** An LLM's probability estimate is a plausible trigger, not an edge.
  The demo is about the **bound**, not the trade — and it should be honest about losing money.
- **Not a full mandate.** The bound is on funding, not on each trade ([O4](#open)). Inside its
  budget the agent may do something stupid; it simply cannot do something *large*.
- **Not an agent that discovers news.** R-I's store is filled by hand, so the agent reads a
  world curated by whoever runs the demo. Entering a *headline* supplies evidence and is fair;
  entering a *stance* would steer the conclusion and is not. This version tests the mechanism.
  A real feed (`origin: feed`) is what would remove this line.
- **Expiry is block time, not wall clock**, and nothing notifies the owner when a mandate lapses —
  the agent has to notice its own refusal.

## Ownership rules <a id="relations"></a>
<sub>[↑ TOC](#toc)</sub>

| Doc | What it is | When to write to it |
|---|---|---|
| **this file** | the cross-repo seam — scenario, build order, dependencies | when the seam changes |
| [../features/README.md](../features/README.md) | rabbit's per-feature status + backlog | when a rabbit feature's status changes |
| [verex current-plan.md](../../projects/verex/docs/tasks/current-plan.md) | verex's own queue, incl. J2's V-items | when verex's work changes |
| `../history/YYYY-MM-DD-rabbit-history.md` | append-only audit trail | as work happens |
| [archive/](archive/) | superseded plans, verbatim | when a plan is retired |

Rule of thumb: **if it can be finished inside one repo, it belongs to that repo's plan.** Only what
needs both ends moving belongs here.
