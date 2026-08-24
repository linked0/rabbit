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
- [Architecture — where each bound actually lives](#arch)
- [Repo status](#status)
- [Implementation matrix — who builds what](#matrix)
- [Build order](#order)
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

**Consequence of the fourth answer, and it reorders everything:** the full loop needs a market
resolved on live Sepolia, which is verex's **W1**. And W1's fresh seed **deletes staging's
`Trade`/`PricePoint`/`Outcome`/`Market` rows** — so if the agent starts trading on staging first,
its journal ends up pointing at rows that no longer exist. **W1 goes first**, not because
redemption needs it later, but because re-seeding after the agent has traded destroys the demo.

**Next step:** the [open questions](#open) — O1 (how rabbit gets verex's order-signing code) is the
one that blocks Phase 2.

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

## Architecture — where each bound actually lives <a id="arch"></a>
<sub>[↑ TOC](#toc)</sub>

```
  Owner wallet (MetaMask)
      │  ERC-7715 delegation — cap: N MockUSDC, expiry: T
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
| Relevant, built | ERC-7715/7710 mandate grant + revoke (`app/poc/aa/SessionKeyDemo.tsx`), LLM plumbing (`app/api/jay-chat/`), Prisma/Postgres, `/poc/agent` route | CLOB + CTF backbone on Sepolia, LMSR operator maker, UMA adapter deployed against the **live** oracle, `packages/sdk` with `signOrder` |
| Relevant, missing | the loop itself — no `app/api/agent`, no store, no scheduler ([B1](../features/README.md#b1)) | any external-account path; `packages/mcp-server` ([V4](../../projects/verex/docs/features/README.md#v4)) |
| Blocking decision | **D2 — answered by J2**: the agent key lives on rabbit's server, not verex's | **W1** — no market has ever been resolved through the live adapter |

## Implementation matrix — who builds what <a id="matrix"></a>
<sub>[↑ TOC](#toc)</sub>

The [build order](#order) below has the reasoning and the done-when gates. This is the same work as
a table, so you can see at a glance which repo owes what and where the two actually touch.

### At a glance

| | Rabbit | Verex |
|---|---|---|
| **Items** | 9 (R-A … R-I) | 6 (W1, V-A … V-E) |
| **Rough total** | ~4–6d | ~5–8d |
| **What it is being asked to change** | build the loop it never had — mandate, tick, LLM estimate, journal, scheduler, redeem | **stop being a custodian** — accept, fund-check, read and redeem for an address it holds no key for |
| **Nothing changes in** | the existing `/poc/aa` mandate demo (reused, not modified) | the CLOB matching engine, LMSR quoting, the CTF contracts — all untouched |
| **Where the seam is** | R-B signs a CTF order | V-A accepts one |

### Full matrix

The `#` prefix names the repo — **V** and **P0** are verex, **R** is rabbit. Rows marked **⇄**
come in pairs and are the only genuinely two-sided work: **V-A ⇄ R-B** (one signs an order, the
other accepts it) and **V-D ⇄ R-G** (one exposes redeem, the other calls it). They are placed
adjacent so the seam is visible in the table rather than inferred from the dependency column —
which means **this table is not a work queue**; the [build order](#order) below is.

| # | Task | What to implement | Depends on |
|---|---|---|---|
| **P0** | Prove UMA on live Sepolia | **W1**: fresh staging seed **including ≥1 short-dated UMA market**, resolve one market through the live adapter, winner redeems, close **A5** | — |
| **⇄ V-A** | External signed orders | `POST /orders` + `POST /trade` accept a client-supplied `SignedOrder` with an arbitrary `maker`; verify EIP-712 server-side; migration making `Order.makerIndex` nullable | P0 |
| **⇄ R-B** | Verex client | Typed client over V-A…V-D that signs CTF EIP-712 orders with the agent key. If [O1](#open) says publish `@verex/sdk`, part of this becomes a verex row | V-A…V-D, **O1** |
| **V-B** | Funding stops being the API's job | `ensureFunds` **reads and rejects** for external makers instead of faucet+approving on their behalf; address-scoped faucet for testnet convenience | V-A |
| **V-C** | Address-scoped reads | `/wallet/:address` — balance, positions, open orders, redeems, history (today all `/wallet/:index`) | V-A |
| **⇄ V-D** | External redeem | `POST /redeem` by address; the redeem tx is signed by the **holder**, not the operator | V-C |
| **⇄ R-G** | Resolution watch + self-redeem | Poll verex for resolution; redeem a winning position; record realised P&L. **Needs a little Sepolia ETH — this leg only** | V-D, R-F |
| **R-A** | Mandate: grant · fund · revoke | ERC-7715 delegation scoped to **amount + expiry**; redeeming it moves ≤ cap of MockUSDC to the agent EOA; key generated server-side, address-only to the browser, **labelled testnet-grade on the page** | — |
| **R-C** | The tick, callable by hand | `POST /api/agent/tick` — observe → estimate → decide → act → record; **calling it twice must be safe** | R-A, R-B |
| **R-I** | **News store — input, list, persistence** | Prisma model `NewsItem` — market scope, headline, body or URL, source, published-at, entered-at, `origin: operator \| feed`. An **input form** and a **list of stored items** for the selected market, with edit and delete. **The estimate reads this store, never a prompt textarea** — so a journal row's cited evidence still resolves to a row that exists tomorrow | — |
| **R-D** | LLM estimate | LLM returns `{ p, rationale, cited }` for a market — reads the question **plus that market's items from R-I**. `cited` records which `NewsItem` ids the estimate actually used. The **deterministic rule** still owns the decision. Reuses `app/api/jay-chat/` plumbing | R-C, **R-I**, **O5** |
| **R-E** | Journal + persistence | Prisma model, read API, and the `/poc/agent` page showing the three states. Must record **skips**, and each row must carry **the evidence it cited** (R-I ids, resolvable to headline + source) — chain-only reconstruction can record neither | R-C |
| **R-F** | Actually unattended | Scheduler wired; the loop runs with no browser and no terminal | R-C…R-E, **O2** |
| **R-H** | The expiry run *(evidence)* | Let a mandate lapse with the scheduler live; capture the journal filling with harmless refusals | R-F |
| **V-E** | MCP server | **`packages/mcp-server`**: `list_markets`, `get_book`, `place_order`, `get_position`, `redeem`, wrapping V-A…V-D's REST. Closes the S3 gap. The agent swaps transport — no logic change | V-A…V-D |

**Reading the dependency column:** the only hard cross-repo blocks are the two **⇄** pairs —
**V-A…V-D → R-B** and **V-D → R-G**. Everything in R-A, and all of P0/V-A/V-B/V-C, can proceed in
parallel, so the two repos are not serialised on each other except at those two points.

## Build order <a id="order"></a>
<sub>[↑ TOC](#toc)</sub>

> Ordered as jay described it: verex opens up, rabbit's agent arrives, then the loop closes.
> `[V]` = verex repo, `[R]` = rabbit repo. Estimates are focused-work days.

### Phase 0 — verex W1, first and for a non-obvious reason `[V]` · ~1–2d

Finish verex's wave 3: fresh staging seed, one market resolved end-to-end through the live Sepolia
UMA adapter, a winner redeeming, **A5** closed. Detail lives in
[verex's plan → W1](../../projects/verex/docs/tasks/current-plan.md#w1); it is repeated here only
because of the sequencing consequence.

**Why first:** the obvious reason is that Phase 4 cannot redeem from a market that never resolves.
The real reason is the re-seed — it **wipes staging's trade history**, so doing it after the agent
has been trading leaves the journal citing deleted rows.
**Done when:** W1's own gate passes, and the staging seed includes **at least one short-dated
UMA market** the agent can plausibly see resolve inside a demo. *(That last clause is new and is
J2's requirement on W1, not W1's own.)*

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
the operator's LMSR ladder, and reads its own position back — with **no `accountIndex` anywhere in
the exchange**.

### Phase 2 — the agent exists, driven by hand `[R]` · ~3–4d

| | Item | Detail |
|---|---|---|
| **R-A** | **Mandate: grant · fund · revoke** | ERC-7715 delegation scoped to amount + expiry; redeeming it transfers ≤ cap of MockUSDC to the agent EOA. Key generated server-side, address-only to the browser, **labelled testnet-grade on the page** — this is D2, answered |
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

### Phase 4 — the loop closes `[R]` · ~1–2d

| | Item | Detail |
|---|---|---|
| **R-G** | **Resolution watch + self-redeem** | Poll verex for resolution; when a held position wins, redeem it and record realised P&L. The agent needs a little Sepolia ETH for this leg only |
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

## Open questions <a id="open"></a>
<sub>[↑ TOC](#toc)</sub>

| | Question | Blocks | State |
|---|---|---|---|
| **O1** | **How does rabbit get verex's order-signing code?** `packages/sdk` has `signOrder`, `SignedOrder` and the order domain. Options: publish it (`@verex/sdk` to npm or a GitHub package), vendor a copy into rabbit, or re-implement the EIP-712 struct thinly. Copying means two definitions of one wire format — the exact drift the docs pipeline exists to prevent | **R-B**, so Phase 2 | ⛔ open — **the one to answer next** |
| **O2** | **Scheduler host** — Cloud Run job + Cloud Scheduler · GitHub Actions cron (note: rabbit has **no** `.github/workflows/` at all) · hosted cron pinging the tick | R-F | ⬜ open. Cheapest thing that survives a day unattended wins |
| **O3** | **Which markets may the agent touch?** A funding bound says nothing about *what* it trades. A whitelist is policy in rabbit's code today; making it a contract-level bound is O4 | R-C's rule | ⬜ open |
| **O4** | **Per-trade policy via EIP-1271** — the stronger enforcement recorded but not built. Worth it only if the funding bound proves too coarse in practice | — | ⬜ deferred by design |
| **O5** | **LLM cost and cadence** — one estimate per market per tick gets expensive on a short interval. Cache per market until the book moves? | R-D | ⬜ open |
| **O6** | **Does the demo run against staging or a dedicated environment?** The agent trading on staging means its rows sit in the same DB as everything else, and any future re-seed wipes them again | Phase 1 | ⬜ open — surfaced by Phase 0's re-seed problem |
| **O7** | **News scope and staleness** — is a `NewsItem` scoped to one market or global with market tags? Does an item age out? A headline from three weeks ago should not keep moving `p`, and "store it in Postgres" does not answer that. Default proposal: scoped per market, and the estimate only sees items published inside a configurable window | R-I, R-D | ⬜ open — surfaced by R-I |

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
