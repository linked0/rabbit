# Rabbit — Current Plan: Agentic AA — the autonomy loop

> **Archived 2026-08-21, unstarted.** This plan was written 2026-08-06 and never got past the
> mock — M1, M2, M4, M5 and §8 were never begun, M3 stopped at a hand-written mock, and the
> blocking decision **D2 (session-key custody)** was never answered. It is kept verbatim because
> the design work and the five open decisions are worth not re-deriving. The live status rows and
> the still-open milestones moved to
> [../../features/README.md → Backlog](../../features/README.md#backlog); the rolling plan
> restarted at [../current-plan.md](../current-plan.md).

- **Scope:** one task — make an agent that **decides and pays without a human present** — plus one
  optional side-quest, a Unity visualization of that agent ([§8](#s8)), explicitly off the critical
  path. Everything else lives in **[../features/README.md](../../features/README.md)** and its linked
  docs.
- **Previous plan (AP2 · Toss · AA building blocks) — all built and shipped**, archived verbatim at
  [archive/2026-08-06-current-plan-ap2-toss-aa.md](2026-08-06-current-plan-ap2-toss-aa.md).
  Nothing was deleted; the finished rows moved to the features table.
- **Design source:** [../features/agentic-aa.md](../../features/agentic-aa.md) (4 pillars, ERC-8021,
  WalletChan) · scenario prose in [`lib/agent-scenarios.ts`](../../../lib/agent-scenarios.ts).
- **Status:** ⬜ Not started — design below, no code yet. Per-milestone marks in
  [Roadmap status](#roadmap); audited against the code on `main`, not the commit log.

## Table of contents <a id="toc"></a>
- [Roadmap status](#roadmap)
- [Next-work queue](#queue)
- [§0 — Summary](#s0)
- [§1 — Why this, and not more pillars](#s1)
- [§2 — The demo: scheduled operator, actually running](#s2)
- [§3 — Build plan (M1–M5)](#s3)
- [§4 — Open decisions](#s4)
- [§5 — Prerequisites — what jay needs to provide](#s5)
- [§6 — What this demo does *not* prove](#s6)
- [§7 — What already exists (the rail this builds on)](#s7)
- [§8 — Side-quest: Unity visualization via the `rabbit-hole` submodule](#s8)

## Roadmap status <a id="roadmap"></a>
<sub>[↑ TOC](#toc)</sub>

> Same shape as [verex's rolling plan](../../../projects/verex/docs/tasks/current-plan.md) (jay,
> 2026-08-18): a dated status table is what lets a cold session see where the work actually
> stands without reading the whole design. Audited **against the code on `main`**, not the
> commit log — the marks below were checked by looking for the files, not by trusting a
> milestone list.

| M | Milestone | Status | Evidence / gap |
|---|-----------|--------|----------------|
| **M1** | Agent identity + mandate | ❌ not started | no server-held session account, no grant/revoke flow; **blocked by D2 key custody** |
| **M2** | The tick, callable by hand | ❌ not started | no `POST /api/agent/tick` — `app/api/` has no `agent` route at all |
| **M3** | Journal + persistence | ◐ mock only | `/poc/agent` renders `app/poc/agent/AgentJournalMock.tsx`, a hand-written 7-tick script walked by a button — no store, no read API, no real ticks |
| **M4** | Actually unattended | ❌ not started | no scheduler wired. **This is the milestone that earns the word "agentic"** — M1–M3 without it is still a button |
| **M5** | Expiry run *(evidence)* | ❌ not started | blocked on M4; nothing to capture until the loop runs unattended |
| **§8** | Unity visualization *(side-quest)* | ❌ not started | explicitly off the critical path; submodule decision **U1** still open |

**What the PoC card says, and why it does not contradict this.** The `agent` card in
[`lib/poc-cards.ts`](../../../lib/poc-cards.ts) is `status: "done", date: "2026-08-12"`. That
follows the `oz-relayer` pattern — a completed thought experiment plus a mock, not a running
demo. The autonomy loop this doc plans is a different claim, and by the table above none of it
is built yet. The card and the plan are consistent; they are just measuring different things.

## Next-work queue — 1 blocking gate + 2 active tasks + 1 deferred <a id="queue"></a>
<sub>[↑ TOC](#toc)</sub>

> Same shape as [verex's queue](../../../projects/verex/docs/tasks/current-plan.md) (jay,
> 2026-08-18): **Why now / Gate / Done when** per item, deferred items struck through and kept
> rather than deleted. "Done when" lines are the verification gates — a task is not done because
> code exists, it is done when the stated check passes. Estimates are focused-work days.

### 0) `(you)` D2 — where the session key lives ⛔ **BLOCKING**

**Why now:** M1 cannot start without it, so everything below is gated on one decision.
**Proposal on the table** ([§4](#s4)): generate server-side, expose only the address to the
browser for the grant, private key in server env — testnet-grade custody, labelled as such on the
page. **Needs jay's explicit OK.**
**Done when:** jay says yes/no in writing and [§4 D2](#s4) records the choice.

### 1) M1 — agent identity + mandate ⬜ not started · ~1d

**Why now:** first buildable step once D2 clears; every later milestone signs with this account.
**Gate:** D2 above. D1 (gas) is **already decided** — keep 7715/7710 and pre-fund the session
account once; "agent ran out of gas" stays an honest journal failure mode.
**Done when:** a mandate can be granted scoped to amount + expiry + recipient, and revoked, with
the session address visible in the browser.

### 2) M2 — the tick, callable by hand ⬜ not started · ~1d

**Why now:** it is the whole loop minus the scheduler, and it is verifiable without one.
**Gate:** M1.
**Done when:** `POST /api/agent/tick` runs observe → decide → act → record, and **calling it twice
in a row is safe** — verified by `curl`, before any scheduler exists.

### 3) ~~§8 Unity visualization~~ — **DEFERRED, not dropped** (jay, 2026-08-18)

> Kept because the design work is done and the reasoning is worth not re-deriving: it is
> explicitly off the critical path ([§8](#s8)), and its own blocking question — **U1**, the
> submodule strategy — is still open. Nothing here is wrong; it is simply behind M1–M5, and
> starting it before M4 would mean visualising a loop that does not yet run unattended.

**M3–M5 are not in the queue on purpose.** M3 depends on D4 (journal storage, ⬜ undecided) and M4
on D3 (scheduler host, ⬜ undecided); both are listed in [§4](#s4) and neither blocks M1 or M2, so
they enter the queue once those two decisions land rather than sitting here as pseudo-active work.

## 0. Summary <a id="s0"></a>
<sub>[↑ TOC](#toc)</sub>

Build **`/poc/agent`** — a server-side agent that wakes on a timer, reads a real signal, decides on
its own whether to act, and when it acts, **pays from a mandate it cannot exceed**. The page is not
a button; it is a **live journal** of the agent's decisions, including the ticks where it decided
*not* to spend, and the ticks after the mandate expires where it fails harmlessly.

This makes live the `scheduled-operator` scenario already written in
[`lib/agent-scenarios.ts`](../../../lib/agent-scenarios.ts) — today it is prose next to a diagram; the
task is to make it a thing that is actually running while nobody is watching.

**History:** this doc stays short on purpose — for the blow-by-blow of what got built on a given
day, follow `docs/history/YYYY-MM-DD-rabbit-history.md` (latest:
[2026-08-18](../../history/2026-08-18-rabbit-history.md); this plan's own design work is
[08-06](../../history/2026-08-06-rabbit-history.md), and the building blocks it sits on were built
[08-04](../../history/2026-08-04-rabbit-history.md) and refined
[08-05](../../history/2026-08-05-rabbit-history.md)).

**Resume point (2026-08-06):** plan + a discussion mockup on branch **`claude/agentic-aa-plan`**
(committed and pushed). What exists: the **`agent` PoC card** in
[`lib/poc-cards.ts`](../../../lib/poc-cards.ts) (status `soon` + `href`, so it renders with a "Mock"
badge and still opens), and **`/poc/agent`** — a hand-written 7-tick script walked by a "next tick"
button, no chain/wallet/scheduler ([app/poc/agent/](../../../app/poc/agent/)). Nothing about the real
agent is built.

Next step: settle [§4's open decisions](#s4) (**D2 key custody blocks M1**; D1 gas, D3 scheduler
host, D4 journal storage), then M1. The mock's own four questions — journal columns, choice of
signal, how much the visitor drives, how to live with expiry — are listed at the bottom of
`/poc/agent` itself and are worth answering before M3 designs the page for real.

## 1. Why this, and not more pillars <a id="s1"></a>
<sub>[↑ TOC](#toc)</sub>

jay's own point, 2026-08-05, recorded in
[`AgenticPillars.tsx`](../../../app/poc/aa/AgenticPillars.tsx)'s header comment:

> everything below is started by a human pressing a button — the capability is right, the autonomy
> isn't. Until there's a decision loop, "AA for agents" is the accurate name.

So the four building blocks (session key · paymaster · atomic batch · KYA) are **done as
capability** and are not the gap. The gap is the loop: *observe → decide → act → record*, running
with nobody in the room. Adding a fifth pillar card would deepen the same demo we already have.
Adding the loop changes what the page proves.

The claim to demonstrate, precisely: **the safety of an unattended agent is arithmetic, not trust** —
the mandate's amount cap and expiry are enforced by contracts the agent has no control over, so a
buggy or compromised agent's worst case is bounded in advance and observable after the fact.

## 2. The demo: scheduled operator, actually running <a id="s2"></a>
<sub>[↑ TOC](#toc)</sub>

**Route:** `/poc/agent` (new PoCs-hub card). Sepolia, test USDC, no real money.

### The loop — one tick
Runs every N minutes on a scheduler, with no browser open:

| Step | What happens | Made visible as |
|---|---|---|
| **Observe** | Read a real on-chain signal — Chainlink Sepolia **ETH/USD** feed (`0x694AA1769357215DE4FAC081bf1f309aDC325306`), plus block time and the mandate's remaining budget | the observed value in the journal row |
| **Decide** | Deterministic policy: *act only if the price moved > X% since the last action **and** the cooldown has passed*; otherwise skip | rule evaluated + verdict, **skips logged too** |
| **Act** | Redeem the delegation — transfer ≤ cap of test USDC to the provider address, signed by the session key alone | tx hash → Etherscan |
| **Record** | Append a journal row: time, observation, verdict, tx or skip reason, cumulative spend, budget left, expiry countdown | the journal table on the page |

**Skips are the point.** A demo that only shows successful payments shows capability again. A
journal where most rows read *"observed 2,412.30, moved 0.4% < 2% threshold → no action"* is what
makes a decision visible as a decision.

### The three states the page must show
1. **Within mandate, no action needed** — the common case; agent watches and declines to spend.
2. **Within mandate, action taken** — bounded payment lands, budget decrements on screen.
3. **Past expiry** — the *money shot*: leave the agent running after the deadline. The same code
   keeps ticking, the chain keeps rejecting, and the journal fills with harmless failures. Nothing
   was revoked; the window simply closed. This is the `scheduled-operator` guarantee, shown rather
   than asserted.

### Page layout
- **Mandate panel** — connect owner wallet → grant (amount cap · expiry · recipient) → live
  readout of budget remaining, expiry countdown, agent address, revoke button (kill switch).
- **Journal** — auto-refreshing table, newest first, each row expandable to the raw observation and
  tx. This is the main surface; it should read like a log, not a dashboard.
- **Honest footer** — [§6](#s6)'s limitations, in the same voice as the scenario pages'
  `limitation` fields.

## 3. Build plan (M1–M5) <a id="s3"></a>
<sub>[↑ TOC](#toc)</sub>

> Status column mirrors [Roadmap status](#roadmap) — that table is the source, this one adds the
> deliverable detail. If the two ever disagree, the Roadmap table was audited against the code and
> wins.

| M | Status | Milestone | Deliverable | Est. |
|---|--------|-----------|-------------|------|
| **M1** | ⬜ not started | **Agent identity + mandate** | Server-held session account (address exposed to the browser); grant flow scoped to amount + expiry + recipient; revoke | 1d |
| **M2** | ⬜ not started | **The tick, callable by hand** | `POST /api/agent/tick` — observe → decide → act → record, idempotent, safe to call twice. Verified by `curl` before any scheduler exists | 1d |
| **M3** | ◐ mock only | **Journal + persistence** | Journal store (see [D4](#s4)), read API, `/poc/agent` page with the three states | 1d |
| **M4** | ⬜ not started | **Actually unattended** | Scheduler wired (see [D3](#s4)) — the loop runs with no browser and no terminal. **This is the milestone that earns the word "agentic"**; M1–M3 without it is still a button | 0.5d |
| **M5** | ⬜ not started | **Expiry run** *(evidence, not code)* | Let a mandate lapse with the scheduler live; capture the journal showing post-expiry rejections; add it to the PoC card's tech notes | 0.5d |

**Optional follow-ons, not in scope until M5 lands:** ERC-8021 attribution suffix on the agent's
txs (agent proves its own output on-chain, ~+0.5d) · an LLM-written rationale line per journal row
(rabbit already has the LLM plumbing; the *decision* stays deterministic — see [D5](#s4)).

## 4. Open decisions <a id="s4"></a>
<sub>[↑ TOC](#toc)</sub>

**D1 — gas: pre-fund the session account, or move to a 4337 account with a paymaster?**
The 08-05 bug (`insufficient funds for transfer`) was structural, not incidental: under ERC-7710
the **session account broadcasts its own transaction**, so it needs Sepolia ETH. thirdweb's
sponsored gas would remove that chore but only for a **4337 smart account** — a different account
type that does not have the amount/expiry *enforcer* story this demo is built on.
→ **Recommendation: keep 7715/7710 and pre-fund the session account once.** The mandate semantics
*are* the demo; sponsored gas is a convenience. Bonus: "agent ran out of gas" becomes an honest
journal failure mode, which is truer to how unattended agents actually die.

**D2 — where does the session key live?**
Today `SessionKeyDemo` generates it in the browser and it never leaves. An unattended loop needs
the key where the loop runs. → **Proposal: generate server-side, expose only the address to the
browser for the grant, private key in server env.** Testnet-grade custody, labelled as such on the
page — production would use a KMS or a TEE (cf. WalletChan in
[agentic-aa.md §5](../../features/agentic-aa.md)). ⚠️ Needs jay's explicit OK before M1.

**D3 — scheduler host.** Options: Cloud Scheduler → the existing deploy target · GitHub Actions
cron (note: `.github/workflows/` does not exist in this repo yet) · a hosted cron pinging
`/api/agent/tick`. Cheapest thing that survives a day unattended wins. ⬜ Undecided.

**D4 — journal storage.** Options: the existing Postgres (Prisma) · a JSON file on the server ·
reconstruct from chain + logs. Chain-only is tempting for purity but cannot record **skips**, and
skips are [§2](#s2)'s whole point → needs real storage. ⬜ Undecided, leaning Postgres.

**D5 — deterministic rule or LLM decision?** → **Deterministic for the demo.** An LLM in the
decision path makes the safety claim harder to state, not easier; the interesting property is that
the *bound* holds regardless of how the agent decides. LLM rationale text as a later cosmetic
layer, if at all.

## 5. Prerequisites — what jay needs to provide <a id="s5"></a>
<sub>[↑ TOC](#toc)</sub>
- **Decision on [D2](#s4)** (server-held session key) — blocks M1.
- **Test USDC** in the owner wallet — [faucet.circle.com](https://faucet.circle.com), Circle's
  official Sepolia USDC (`0x1c7D…7238`, 6 decimals).
- **A little Sepolia ETH** for the session account, if [D1](#s4) goes as recommended.
- **Scheduler access** for [D3](#s4), once chosen.
- Everything else (`SEPOLIA_RPC`, thirdweb client ID, Stripe/Toss test keys) is already in
  `.env` — see the [archived plan §1](2026-08-06-current-plan-ap2-toss-aa.md) for
  where each came from.

## 6. What this demo does *not* prove <a id="s6"></a>
<sub>[↑ TOC](#toc)</sub>
Written up front so it does not get quietly dropped later — and it belongs on the page itself.
- **Not autonomous goal-setting.** A human still writes the policy and grants the mandate. The
  agent chooses *when* and *whether*, not *what for*.
- **Not production custody.** A server-held key is a demo compromise ([D2](#s4)).
- **Not a market strategy.** The price rule is a plausible trigger, not advice — the demo is about
  the payment mandate, not about the trade.
- **Expiry is block time, not wall clock**, and nothing notifies the owner when the mandate lapses
  — the agent has to notice its own rejection (per the scenario's own `limitation` field).

## 7. What already exists (the rail this builds on) <a id="s7"></a>
<sub>[↑ TOC](#toc)</sub>
All built and committed — no work owed here, listed so a cold session knows what it can reuse.

| Piece | Where | State |
|---|---|---|
| Session key grant + bounded spend (ERC-7715/7710, `@metamask/smart-accounts-kit`) | [app/poc/aa/SessionKeyDemo.tsx](../../../app/poc/aa/SessionKeyDemo.tsx) | ✅ the mandate mechanics M1 reuses |
| Sponsored tx + batch tx (ERC-4337, thirdweb) | [app/poc/aa/AgenticPillars.tsx](../../../app/poc/aa/AgenticPillars.tsx) | ✅ relevant to [D1](#s4) only |
| EIP-7702 account inspector | [app/poc/7702/](../../../app/poc/7702/) | ✅ read-only, no wallet needed |
| Four agent scenarios (prose + diagrams) | [lib/agent-scenarios.ts](../../../lib/agent-scenarios.ts) | ✅ `scheduled-operator` is what §2 makes live |
| AP2 — Stripe settlement (USD) | [app/poc/ap2/](../../../app/poc/ap2/) | ✅ shipped |
| Toss Payments — KRW settlement | [app/poc/toss/](../../../app/poc/toss/) | ✅ shipped |
| PoCs hub + card registry | [app/poc/page.tsx](../../../app/poc/page.tsx), [lib/poc-cards.ts](../../../lib/poc-cards.ts) | ✅ `agent` card added 08-06 (`soon`). M3 flips it to `live` with `href`/`date` and adds a `middleware.ts` PUBLIC_PATHS entry |

## 8. Side-quest: Unity visualization via the `rabbit-hole` submodule <a id="s8"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ Design only — jay's idea, 2026-08-06, filed on request. Nothing built, nothing
  decided.** For fun, and explicitly **not on the critical path**: [§3](#s3)'s M1–M5 must ship
  whether or not this ever exists.

**The idea (jay):** a Unity program that *shows* the agent acting — the same tick loop as
[§2](#s2), but watched instead of read. Kept in its own repo (**`rabbit-hole`**, already created
and empty at `github.com/linked0/rabbit-hole`) and pulled into rabbit as a **git submodule**,
since the Unity code is genuinely independent of the Next.js app.

**One concern, stated once:** Unity WebGL brings a multi-MB payload and a build toolchain for what
is a decorative layer over a journal table — a 2D canvas or three.js scene would be a tenth of the
cost. Filed anyway and planned as asked, because there is a second reason that outweighs it: the
**Unity track already exists in this project** ([../features/game.md](../../features/game.md),
[thirdweb.md](../../features/thirdweb.md)'s Unity SDK note), it is a portfolio signal on its own, and
this gives it a subject worth rendering instead of a placeholder game.

### 8.1 What the visualization shows
The value beyond "fun" is that it makes the **enforcer physical**. In the journal, a rejection is
a red word in a table; in a scene, it is a gate that will not open. Mapping to [§2](#s2)'s three
states, one-to-one:

| Journal row | Scene |
|---|---|
| tick fires, nobody watching | the agent wakes on its own, looks at a price board |
| skip — below threshold | it shrugs and goes back to sleep. **Most of the runtime is this** — the boredom is the honesty |
| paid — within mandate | it walks to the vendor, pays, and a visible budget meter drains |
| rejected — past expiry | it walks up as usual and the gate stays shut. It tries again next tick. Nobody closed anything — the clock did |

### 8.2 The one architectural rule: Unity is a dumb renderer
**Unity gets journal rows and animates them. It never touches the chain, a key, or an RPC.**
The page fetches the journal (it already must, for [§2](#s2)) and pushes rows into the build via
`unityInstance.SendMessage()`; Unity's only input is that JSON.

Two reasons this is not negotiable: a second code path to the chain could **disagree with the
journal**, and the whole demo's claim rests on the journal being the record of what happened; and
keys must not enter a WebGL build under any circumstances. Consequence worth stating plainly —
**the visualization can never show anything the journal doesn't say.** That is the intended
constraint, not a limitation.

### 8.3 Submodule strategy — the real decision (**U1**)
The thing rabbit needs at build time is the **WebGL output**, not the Unity source. A submodule of
source alone doesn't feed `next build`. Three ways, and this is **the same open question
[game.md](../../features/game.md) already asks** — whatever we pick should serve both, so the repo
ends up with one Unity story rather than two:

| | How | Cost | Verdict |
|---|---|---|---|
| **A. Source + CI build** | submodule the Unity project; a Unity GitHub Action builds WebGL during rabbit's CI | needs a Unity license in CI, a heavy runner, and **`.github/workflows/` does not exist in rabbit yet** | over-built for a side-quest |
| **B. Source + committed build** ⭐ | `rabbit-hole` holds the Unity project *and* its `Build/` WebGL output; rabbit submodules it and serves that folder | binaries in git (WebGL builds are MBs, and every rebuild is a new blob) | **recommended** — no CI, no license plumbing, works today |
| **C. No submodule** | publish the WebGL build to GitHub Releases or gh-pages; `/poc/agent` iframes the URL | rabbit doesn't vendor the build at all; needs a release step | fine fallback if B's git bloat bites |

**Recommended: B**, with a caveat to check before committing to it — if `Build/` churn makes the
repo unpleasant, C is a one-line change from B (same repo, different delivery). Either way,
**pin the submodule to a commit** and treat updating it as a deliberate act; a floating submodule
is how these silently break on the other machine.

### 8.4 Where it appears
`/poc/agent` gains a **view toggle — journal ⇄ scene**, defaulting to the journal. Same data, two
readings; the journal stays the source of truth and the page still works with the scene disabled
(or on a phone, where a Unity build is unkind). Not a new route: the moment it becomes its own
page, the two can disagree about what happened, which [§8.2](#s8) exists to prevent. `/game`
stays a separate matter — see [game.md](../../features/game.md).

### 8.5 Sequence and open questions
Do this **after M5**, when there is a real journal with real rows to render. Building the scene
against mock data first would mean tuning it twice.

1. `rabbit-hole` — Unity project, a scene with agent / price board / vendor / gate / budget meter.
2. A **JSON contract** for a journal row, written down in `rabbit-hole`'s README and imported by
   both sides — the one thing that must not drift.
3. WebGL build → delivery per [U1](#s8) → submodule wired into rabbit.
4. View toggle on `/poc/agent`.

**Open — needs jay:**
- **U1** — submodule strategy (A/B/C above). Blocks everything else here.
- **U2** — does the scene replay history, or only animate live ticks as they arrive? Replay is more
  fun and demos better; live-only is simpler and more honest about what "unattended" means.
- **U3** — art direction: is this the same visual world as `/game`'s Coin Catcher, or its own?
- **U4** — worth confirming: is `rabbit-hole` meant for **this** Unity program specifically, or is
  it the general home for jay's Unity work (in which case `/game`'s game lives there too, and
  [game.md](../../features/game.md)'s `rabbit-game` plan should be folded into it)?
