# Jayverse — Authority Auditor

**Purpose:** feed it a wallet/dapp config (or pick a preset) and get back a filled
**authority matrix** — who can *sign / recover / export keys / change policy*, alone or only in
cooperation — as a shareable report where every cell is backed by an evidence link or marked
"not verified." Pure read/analyze: **no keys, no custody, no transactions.**

*Source: [../tasks/09-02-jayverse.md](../tasks/09-02-jayverse.md) §8 Authority Auditor and jay's
comment there ("Show me the user scenario and what web app shows and the flow. You can imagine
some basic feature."). Sits under the Jayverse hub — [README.md](README.md).
Repo: `jayverse-auditor` (small Next.js app + rules engine, rabbit cloud). Depends on nothing
on-chain, so it can ship first; richest once the Wallet service (#6) exists to dogfood against.
This is a **design draft for review, not built.***

---

## Why it matters

In web3, **who can actually move funds or control an account is usually undocumented and diffuse.**
A modern wallet/dapp stacks a vendor, a smart account, an upgradeable proxy, guardians, session keys,
and an owner key — each quietly adds an *actor* who can sign, recover, **export keys**, upgrade, or
pause. A large share of hacks and rugs trace to one actor who could act **alone** that nobody had
mapped. The Auditor makes that explicit — a per-action grid of *who can do it, alone or only
together*, every cell backed by evidence — so a team fixes single points of failure **before** they
are exploited, not after. It is the ecosystem's defensive lens, and its audience is **builders**
(developers, founders, reviewers), not end-users.

---

## Phases (build order)

| Phase | Focus | What we implement |
|---|---|---|
| **1 (MVP)** | Dogfood matrix | hand-authored authority matrix for our own wallet config; matrix schema (actions × actors × evidence + severity + verified-tag); report renderer + shareable read-only page; ship as the first public report. |
| **2** | Rules engine | `evaluate(config) → Matrix` pure function; per-provider parsers (**Privy first**, then Dynamic / Web3Auth / Turnkey); config intake tiers 1–2 (guided form/paste + exported JSON). |
| **3** | On-chain + API | viem readers (`owner`/`getOwners`, EIP-1967 admin slot, `paused()` + `PAUSER_ROLE`) → *verified* cells; opt-in provider-API tier (tier 3); broader `AccessControl` role discovery. |

---

## 1. What we build (basic feature)

Three layers, built in this order — each is useful on its own:

1. **Hardcoded matrix for our OWN wallet config (dogfood = launch content).** Before any engine
   exists, hand-author the authority matrix for the Jayverse Wallet service's real config
   (provider, session-key policy, recovery setup) and ship it as the first public report. This
   proves the format, gives the app real launch content, and forces us to look our own custody
   reality in the eye.
2. **A rules engine mapping config → matrix cells.** A pure function
   `evaluate(config) → Matrix`. Each cell for an (action × actor) pair resolves to one of
   **`alone` / `cooperation` / `cannot`** (plus `unknown`), with a rule id and an evidence
   reference. Feed it a provider config (Privy / Dynamic / Web3Auth / Turnkey shapes) and it
   fills the same matrix we hand-authored in step 1 — the dogfood report becomes engine output,
   not prose.
3. **Contract-side checks (on-chain reads).** For a smart-account / upgradeable-contract config,
   read the real permission state via viem: `owner()` / `getOwners()`, proxy **admin** slot
   (EIP-1967), and **pause** authority (`paused()` + who holds `PAUSER_ROLE`). These populate
   the contract half of the matrix with *verified* cells, not documentation claims.

Basic and buildable. Out of scope for v1: writing anything, simulating transactions (that's the
Wallet service's `simulate()`), multi-chain crawling, and auto-discovery of every role in an
arbitrary contract — v1 checks a known, small set of authority surfaces.

---

## 2. User scenario

**Dana, a small-dapp founder** (a *developer/operator*, not an end-user — the Auditor's audience is
builders), runs her app on an embedded-wallet provider and isn't sure who could actually move her
users' funds if a vendor were compromised. (End-user "Mina" appears in the other Jayverse docs; the
Auditor's persona is a builder, so she has her own name.)

1. She opens the Authority Auditor and either **pastes her config** (provider name + the relevant
   settings, or a contract address + chain) or **picks a preset** — e.g. "Privy embedded wallet,
   default recovery" or "Safe 2-of-3 with a Timelock proxy admin."
2. She submits. The app runs the rules engine over the config and, if an address was given, reads
   on-chain permissions.
3. Seconds later she sees a **filled authority matrix**: rows are actions (*Sign a tx*,
   *Recover the account*, *Export the private key*, *Change the policy/upgrade*, *Pause*),
   columns are actors (*User*, *Provider*, *Our backend / owner key*, *Guardians*, *Nobody*).
   Each cell says **alone**, **cooperation**, or **cannot**, colored by severity.
4. She spots the row that matters: *Export private key → Provider: **alone*** flagged **high**,
   with an evidence link to the provider's key-export doc — meaning the vendor is a single point
   of custody failure. A cell she assumed was safe, *Upgrade → Owner key: alone*, is marked
   **"not verified — no test exercised this"** rather than pretending certainty.
5. She clicks **Share** and gets a public report URL she can send to a co-founder or paste in a
   security review. The report is read-only and carries the same evidence links and badges.

No key was touched, nothing was signed, nothing was custodied — the tool only read config and
public chain state.

---

## 3. What the web app shows (screen by screen)

**Screen A — Input**
- Two ways in: a **config form / JSON paste** (provider dropdown + fields) and a **preset picker**
  (dogfood configs + common shapes). Optional: contract **address + chain** for on-chain checks.
- A one-line reassurance: *"Read-only. We never ask for keys, seed phrases, or signatures."*

**Screen B — Authority matrix (the core)**
- A table: **rows = actions**, **columns = actors**, **cells = alone / cooperation / cannot /
  unknown**.
- Each cell carries a **severity label** (see rubric) and, on click, an **evidence drawer**:
  the rule that fired, the config field or on-chain read it came from, and a link
  (provider doc, block explorer, or test).
- **"Verified by test, not docs" badge** on cells whose claim was exercised by an actual read or
  test — versus cells inferred only from documentation, which show a fainter "doc-only" mark, and
  cells we could not determine, which show **"not verified."**

**Screen C — Shareable report page**
- A stable public URL rendering the same matrix read-only, with a summary header (config name,
  worst-severity findings, date, and how many cells are verified vs doc-only vs unknown).
- A short **findings list** above the matrix: the highest-severity cells in plain English.

### How the config gets in — three tiers

The provider-config half of the input can arrive three ways, trading secrecy for accuracy:

| Tier | How | Secrets? | Accuracy |
|---|---|---|---|
| **1. Manual form / paste** (default) | the operator types the settings | none | inferred (doc-only) |
| **2. Exported config JSON** | paste the *non-secret* config from the provider dashboard | none | accurate, credential-free |
| **3. Provider API** (opt-in) | a **read-scoped API key**; the Auditor calls the provider | **yes — a credential** | auto + verified |

Default is tiers 1–2 — they preserve the "we never ask for keys or secrets" promise (tier 2 is the
sweet spot: accurate *and* credential-free). Tier 3 is a clearly-labeled opt-in that upgrades cells to
*verified*; if used, the key is used server-side once, never stored, and read-scoped where the provider
supports it. (The on-chain half never needs an API — public RPC reads, no key.)

---

## 4. The flow

```
                 ┌────────────────────────────────────────────┐
   config in ───▶│  Normalizer  → canonical Config object      │
 (form / preset  └───────────────┬────────────────────────────┘
  / address)                     │
                                 ▼
                     ┌───────────────────────┐        ┌──────────────────────────┐
                     │   Rules engine        │        │  On-chain readers (viem)  │
                     │  evaluate(config)     │◀──────▶│  owner()/getOwners()      │
                     │  provider parsers     │  reads │  EIP-1967 admin slot      │
                     │  → cells + rule ids   │        │  paused() + PAUSER_ROLE   │
                     └───────────┬───────────┘        └──────────────────────────┘
                                 │  Matrix (cells × evidence × severity)
                                 ▼
                     ┌───────────────────────┐
                     │  Report renderer      │ → matrix table + badges + share URL
                     └───────────────────────┘
```

- **Config in** → normalized to one canonical `Config` shape regardless of source.
- **Rules engine** maps config fields to matrix cells (the provider parsers know each vendor's
  authority model). Where the config names a contract, it calls the **on-chain readers**.
- **viem reads** fetch real permission state (owner, proxy admin, pause) — these produce
  *verified* cells.
- **Report renderer** assembles cells + evidence + severity into the matrix and the shareable page.

### From matrix to action — decisions, levers, timing

The matrix is a **decision list**. For every dangerous cell the question is: *"is it acceptable that
this actor can do this **alone**? If not, make it require **cooperation** or a **delay**."* Each
finding resolves to **accept**, **fix**, or **avoid** — but *who can act* depends on who holds the
authority:

- **Authority the operator controls** (their own contract/config, still changeable) → they fix it:
  move ownership to a **multisig**, add a **Timelock** (turns "alone" into "cooperation + a warning
  window"), or flip a provider setting they own.
- **Authority a vendor or third party holds** (e.g. "provider can export keys alone", or a third-party
  contract) → they **cannot** fix it directly. Levers, cheapest first: **reconfigure to a safer mode
  within the same provider → switch provider → drop embedded custody for that surface → accept +
  monitor.** Switching a provider is nearly free **before launch** and a **migration** after — which is
  why the Auditor's highest-value moment is **before you commit**, auditing vendor models so the "fix"
  is just *choose the safer option*.
- **Already-immutable** (deployed, non-upgradeable) → many fixes no longer exist; it collapses to
  *accept* or *rebuild*.

Beyond per-cell fixes the report drives: **prioritize** the HIGH single-points-of-failure first;
**vendor due-diligence** before adopting; **communicate** custody posture (share the report); and
**catch regressions** by re-running after any config change or upgrade (a change can silently *add* an
authority).

---

## 5. Cooperate with existing services

- **Dogfood against the Wallet service (#6).** The Wallet service's step 4 is literally *"publish
  the authority matrix of our own config"* — the Auditor is where that lives. Its config is our
  first preset and our launch report; when Wallet changes its provider or session-key policy, the
  Auditor report is the diff that shows what authority moved.
- **Audit Rabbit first — the highest-authority component.** The portal's Agentic AI holds scoped
  permissions (ERC-7702/7710/7715); the plan flags *"the agent is the highest-authority component
  — the Authority Auditor should audit Rabbit first"* (§1 Risk). Rabbit's session-key / mandate
  config is a headline preset: who can draw against the mandate, up to what cap, and who can
  revoke.
- **Link from the portal.** Rabbit imports the Auditor as a linked/proxied service (per the hub's
  "Rabbit imports, it doesn't contain"), surfacing the latest self-audit report on the portal so
  the umbrella's custody posture is visible in one place.
- **Feeds on the security research (#10 ETC).** The 보안 취약점 research is the offensive half; its
  findings become new rules in this engine — the Auditor is the defensive/product side of the
  same coin.

---

## 6. Implementation sketch

**Matrix schema** (actions × actors × evidence):

```ts
type Verdict  = "alone" | "cooperation" | "cannot" | "unknown";
type Severity = "critical" | "high" | "medium" | "info";
type Verified = "test" | "on-chain" | "doc-only" | "not-verified";

interface Cell {
  action: Action;        // sign | recover | export-key | change-policy | pause | upgrade
  actor:  Actor;         // user | provider | backend-owner | guardians | nobody
  verdict: Verdict;
  severity: Severity;
  verified: Verified;
  ruleId: string;        // which rule produced this cell
  evidence?: string;     // URL: provider doc, explorer link, or test id
  note?: string;
}
interface Matrix { config: string; cells: Cell[]; generatedAt: string; }
```

- **Provider config parsers** — one adapter per vendor (Privy / Dynamic / Web3Auth / Turnkey)
  that maps that vendor's settings to `sign / recover / export-key / change-policy` verdicts.
  Encapsulates each vendor's authority model (e.g. can the provider export keys unilaterally?
  is recovery custodial?).
- **Contract permission readers** — viem `readContract` for `owner()` / `getOwners()`;
  `getStorageAt` on the **EIP-1967 admin slot** for the proxy admin; `paused()` +
  `hasRole(PAUSER_ROLE, …)` for pause authority. Read-only public RPC; no signer ever configured.
- **Severity rubric** — *critical*: a single third party can move funds or export keys alone;
  *high*: a single party can change policy / upgrade / pause alone; *medium*: recovery or policy
  change needs cooperation but the guardian set is weak/opaque; *info*: expected, well-scoped
  authority. Severity is a function of `(action, verdict, actor)`, computed in the engine.

**What's new vs reused**
- *New:* the rules engine, provider parsers, the matrix schema, the report/share UI.
- *Reused:* viem + the `jayverse-rails` chain configs/clients for on-chain reads; the Wallet
  service's own config as dogfood input; Next.js/TS app scaffolding from rabbit; PoC lessons
  (`embedded-wallet-policy`, `safe-module-root-key`, `third-party-blast-radius`) as the seed rule
  set.

**Risk note — wrong cells are worse than no cells.** A confidently-wrong matrix gives false
safety, which is more dangerous than an empty one. Therefore: **every cell must carry an evidence
link or an explicit "not verified" mark**; the engine never emits a bare verdict. Doc-only claims
are visibly weaker than test/on-chain-verified ones, and `unknown` is a first-class verdict, not
a gap we paper over.

**Open questions**
- Config intake format — free JSON paste vs a guided form per provider vs both? (Leaning: presets
  + guided form for v1; raw JSON later.)
- How much of a vendor's authority model can we verify vs only cite from docs — and how do we keep
  parsers current as providers change?
- Should shared report URLs be public-by-default or unlisted/tokenized, given they describe a real
  app's custody surface?
- Role discovery depth for contracts: fixed known roles (owner/admin/pauser) in v1, or attempt to
  enumerate arbitrary `AccessControl` roles later?
- Do we snapshot on-chain reads at a block height so a shared report is reproducible, or always
  re-read live?

---

## Chainlink — infra we audit, not use

The Authority Auditor is pure read / analyze, so it **consumes no Chainlink itself**. Chainlink appears here the other way round: an **oracle / price feed is an actor whose authority the matrix must capture** —

- *Who can change a contract's feed address?* If a single owner key can repoint a price feed alone, that is a single point of failure the matrix should flag (an `alone` cell), exactly like `upgrade` or `pause`.
- A wrong or late feed is therefore a **finding**, not a dependency, in this product — the Auditor's job is to surface who controls the feed and whether one actor can move it unilaterally.

So for the Auditor, "if the feed is wrong" isn't a runtime guard — it's a row worth auditing. (Umbrella map: [README.md](README.md).)

## Config-not-code trust facts — a Phase 3 target (LayerZero DVN)

The Auditor's whole thesis — *the most security-relevant fact is absent from code review because it
lives in configuration, not code* — has a clean external test case: **LayerZero's Decentralized
Verifier Network.** An application picks its verifier set; skip the choice and it accepts a default
(usually "LayerZero Labs' own DVN, 1-of-1"), and **nothing in the repo names who verifies its
cross-chain messages.**

**Concrete Phase 3 target:** read an OApp's verifier config (`lz:oapp:config:get`) and render it as
an authority row — not just *who* verifies, but *how many of whom, after how many block
confirmations* (required DVNs · optional DVNs + threshold · confirmations). "The default" sounds
neutral; "trusting one company's DVN, 1-of-1" does not — naming it is the whole value, the same job
this tool already does for `sign` / `recover` / `upgrade`.

**It generalizes the product beyond wallets:** a pluggable verifier set, an oracle feed address, a
7715 session-key scope, a mandate bound — all the same shape, a load-bearing decision recorded
outside code. The Auditor's reach is *every "who am I trusting right now, written where a change
would break" fact*, on-chain config included. (Rail-side view:
[jayverse-token-bridge.md](jayverse-token-bridge.md); agent-side:
[jayverse-rabbit.md](jayverse-rabbit.md).)
