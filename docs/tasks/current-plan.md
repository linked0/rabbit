# Rabbit — Current Plan: AP2 + Account Abstraction (AA)

- **Originally:** [jun-30-rabbit.md](jun-30-rabbit.md) design doc, covering the full Jun-30 task
  list. **Narrowed (2026-08-03, jay):** this file holds only **AP2 + AA** — everything else
  (Portfolio/Market, Auth+LLM gating, Knowledge page, KB-RAG, staging domain, the full backlog,
  all reference/knowledge pages, **and the PoCs hub reorg**) has been moved to
  **[../features/README.md](../features/README.md)** and its linked docs — nothing was deleted,
  just relocated. The PoCs hub specifically is supporting infrastructure AP2/AA plug into, not
  itself an AP2/AA task, so it now lives at
  **[../features/pocs-hub.md](../features/pocs-hub.md)**.
- **IA:** [../features/README.md](../features/README.md)
- **Status:** active — AP2 (§2) and AA (§3 + §6) are the only tracked tasks in this file.
- **Numbering note:** sections are numbered sequentially in this file, unlike the original doc
  which numbered by when a section was added. If you see a section reference elsewhere in the
  repo using an old number (e.g. "§6" meaning AP2, "§24" meaning the PoCs hub), it predates the
  2026-08-03 renumbering.

## Table of contents <a id="toc"></a>
- [§0 — Summary](#s0)
- [§1 — Prerequisites — what jay needs to provide](#s1)
- [§2 — AP2 — Stripe settlement example (educational)](#s2)
- [§3 — ETC — ERC-7702 / 7715 demo (educational, AA foundation)](#s3)
- [§4 — Decisions & remaining open questions](#s4)
- [§5 — Sequence](#s5)
- [§6 — Agentic AA — 4 pillars demo](#s6)

## 0. Summary <a id="s0"></a>
<sub>[↑ TOC](#toc)</sub>
Two build tasks, jay's own framing: **AP2 = Agentic Payment Protocol** (§2, a Stripe settlement
example) and **AA = Account Abstraction** (§3's ERC-7702/7715 foundation + §6's Agentic AA
pillars). Both wire into the **PoCs hub** (`/etc`, in progress —
[../features/pocs-hub.md](../features/pocs-hub.md)) as cards once built, but the hub itself isn't
tracked here.

**History:** this doc stays short on purpose — for the full blow-by-blow of what was actually
built/tested/decided on a given day, follow the `docs/history/YYYY-MM-DD-rabbit-history.md` link
next to whichever task you're resuming (e.g. [2026-08-03](../history/2026-08-03-rabbit-history.md)
for everything below).

### Task status

| § | Task | Status |
| --- | --- | --- |
| [§2](#s2) | AP2 — Stripe settlement example | ⬜ To do |
| [§3](#s3) | ETC — ERC-7702 / 7715 demo (AA foundation) | ⬜ To do |
| [§6](#s6) | Agentic AA — 4 pillars demo | ⬜ To do (after §3) |

Legend: ⬜ To do.

## 1. Prerequisites — what jay needs to provide <a id="s1"></a>
<sub>[↑ TOC](#toc)</sub>
- **§2 AP2 Stripe** — a Stripe **test-mode** publishable + secret key pair.
- **§3 AA foundation** — nothing expected (reuses the existing `SEPOLIA_RPC`, client-side signing).
- **§6 Agentic AA (thirdweb half)** — a thirdweb **client ID**, and possibly a secret key for
  server-side Engine calls.

## 2. AP2 — Stripe settlement example (educational) <a id="s2"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do**

- **Goal:** a simple, educational **fiat** settlement example via **Stripe** (counterpart to the
  on-chain x402 / aiaas track in `../features/ap2-test.md`).
- **Design:** mock "agent buys data, settles via Stripe":
  provider returns a price → client creates a **Stripe Checkout / PaymentIntent** → on success the
  data is released. **Test-mode keys only**, no real charges.
- **Open:** Checkout vs PaymentIntent; how prominently to contrast it with x402.

## 3. ETC — ERC-7702 / 7715 demo (educational) <a id="s3"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do**

**Standards (jay confirmed):** **EIP-7702** (an EOA temporarily runs smart-account code = a
*delegatable smart account*) + **ERC-7715** (`wallet_grantPermissions` — grant a scoped **session
key**) / **ERC-7710** (delegation).
- **Goal:** a test page for **delegatable smart accounts / session keys** — ties directly to the
  aiaas spend-policy idea (session key = agent's bounded wallet).
- **Design (educational):**
  - Connect a wallet → **grant a session key** with a scoped permission ("spend ≤ X testnet USDC to
    address Y, valid 1h") per **ERC-7715** → show the session key performing that **bounded action
    without re-signing**.
  - Testnet (**Sepolia**) + a 7702-capable account; display the permission grant + one delegated tx.
- **Decided (jay):** stack = **MetaMask Delegation Toolkit** (implements 7715/7710) on **Sepolia**.
  *(Alternative: ZeroDev / permissionless.js for 7702/4337 session keys.)* Scope = short explainer + one demo tx.
- This is **AA pillar 1** — §6 extends it with pillars 2–4 (different stack, see §6's
  "AA implementation stack" note).

## 4. Decisions & remaining open questions <a id="s4"></a>
<sub>[↑ TOC](#toc)</sub>
**Resolved (jay):**
- ETC standards = **7702 + 7715/7710**; stack = **MetaMask Delegation Toolkit on Sepolia** (§3).
- Agentic AA's pillars 2–4 (§6) use **thirdweb** instead of ZeroDev/Pimlico — see
  [§6's stack note](#s6) (2026-08-03).

**Still open:**
- AP2 (§2): Stripe Checkout vs PaymentIntent.

*(All other resolved decisions — Auth/LLM keys, Market defaults, Knowledge serving, MCP scope —
moved to their respective docs in [../features/](../features/README.md).)*

## 5. Sequence <a id="s5"></a>
<sub>[↑ TOC](#toc)</sub>
1. **Implement §2 AP2 Stripe** — Checkout-based, wired in as a PoCs-hub card.
2. **Implement AA (§3 foundation + §6 pillars)** — MetaMask Delegation Toolkit for the
   7702/7715 half, thirdweb for the 4337-pillars half — wired in as a PoCs-hub card.

Both depend on the **PoCs hub** (`/etc`) existing to plug into — that reorg is tracked
separately at [../features/pocs-hub.md](../features/pocs-hub.md), in progress on branch
`claude/pocs-hub`. What's actually been built so far (`/etc` + `/til` pages, shared `DemoCard`
component, nav/middleware/env changes, local build+dev-server verification) is logged in
[2026-08-03 history](../history/2026-08-03-rabbit-history.md) — search for "PoCs hub" and "TIL".

## 6. Agentic AA — 4 pillars demo (added 2026-07-17) <a id="s6"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: ⬜ To do** (sequenced after §3 — §3 *is* pillar 1)

- **Goal (jay):** demo the four things AA gives an autonomously-paying agent that an EOA
  can't: **① scoped delegation** (session key: "≤10 USDC/day, service X only, 48h"),
  **② gas independence** (paymaster — gas paid in earned USDC or sponsored),
  **③ atomic intent** (swap→bridge→pay in one UserOperation; any failure reverts all),
  **④ KYA** (ERC-8004 identity/reputation — counterparties check the agent before dealing).
- **Detail:** pillar table + mapping to existing items + demo shape in
  **[../features/agentic-aa.md](../features/agentic-aa.md)**.
- **Shape:** extend the §3 ETC page — four cards, one per pillar, each with [Run] + tx link.
  **Stack — updated 2026-08-03: thirdweb** (Connect + Account + Engine) instead of the
  ZeroDev/permissionless.js + Pimlico stack originally noted here — see "AA implementation
  stack" below for the reasoning. Pillars 2–3 are the genuinely new work; pillar 4 is
  exploratory (ERC-8004 is young — verify testnet registry availability).
- **Est.:** pillars 1–3 ≈ 2–3d on top of §3; pillar 4 +1d. Ties the aiaas spend-policy idea
  ([ap2-test.md](../features/ap2-test.md)) and [dsrv-portal.md](../features/dsrv-portal.md)
  AA PoC into one coherent demo.
- **ERC-8021 add-on (added 2026-07-17):** on-chain attribution ("builder codes") — a
  calldata **suffix** (`[schema ID 1B] + [builder code] + [ERC marker 16B]`) the EVM ignores
  but the ledger keeps, proving which app/agent produced a tx (revenue share, agent
  rewards). Companion to pillar 4: **8004 = who the agent is, 8021 = what it produced.**
  Demo: tag pillars 1–3's txs with a rabbit builder code and parse the suffix back in the
  execution log (~+0.5d). Detail: [agentic-aa.md §4](../features/agentic-aa.md).
- **WalletChan case study (added 2026-07-17):** "MetaMask for AI agents" — EIP-1193/6963
  provider injection + **remote signing** in the Bankr backend's TEE (keys never in the
  browser); v3's batch tx = pillar 3, gasless relayer = pillar 2, tx **simulation before
  signing** = a safety rail our demo page should copy. Control-flow inversion vs the aiaas
  track: human drives the UI, agent executes. Detail: [agentic-aa.md §5](../features/agentic-aa.md).

### AA implementation stack — thirdweb vs. what's already decided
jay asked me to consider **ThirdWeb** (or recommend an alternative) for AA. There's already a
survey of thirdweb in **[../features/thirdweb.md](../features/thirdweb.md)**, which flags this
*exact* comparison under "Rabbit touchpoints." My recommendation, split by which AA standard is
in play — **"AA" here is actually two different standards**, and that split matters:

- **§3's scope (EIP-7702 delegation + ERC-7715/7710 session keys) — keep MetaMask Delegation
  Toolkit.** Thirdweb's "Account Abstraction" product is **ERC-4337 smart accounts** — a
  different mechanism (bundler + UserOperations) from 7702's "an EOA temporarily runs
  smart-account code." Thirdweb doesn't currently implement 7702/7715 specifically, so it isn't a
  drop-in substitute for what §3 is actually demoing. No change recommended here.
- **§6 Agentic AA's scope (pillars 2–4: paymaster / gas independence, atomic UserOperation
  intent, ERC-8004 KYA) — use thirdweb instead of ZeroDev/permissionless.js + Pimlico.** This half
  of the demo is already ERC-4337-based, which is exactly what thirdweb's Connect + Account +
  Engine stack targets. Thirdweb bundles wallet connect, the smart account, and the paymaster in
  one SDK, so there's less bundler/infra plumbing to hand-roll for what's meant to be an
  educational demo, not production infra. Trade-off (per `thirdweb.md`'s own framing): less
  transparency/control and some vendor lock-in vs. the "raw" ZeroDev/Pimlico stack — an acceptable
  trade for a demo.
- **Net effect:** the AA card ends up genuinely demonstrating **two different AA standards on two
  different SDKs** — 7702/7715 via MetaMask Delegation Toolkit, 4337 pillars via thirdweb. That's
  not a compromise, it's the actual point: the demo shows both a delegation-based and a
  bundler-based approach to account abstraction side by side.
