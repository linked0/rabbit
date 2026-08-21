# Rabbit — Current Plan: AP2 + Toss Payments + Account Abstraction (AA)

- **Originally:** [jun-30-rabbit.md](../jun-30-rabbit.md) design doc, covering the full Jun-30 task
  list. **Narrowed (2026-08-03, jay):** this file holds only **AP2 + AA** — everything else
  (Portfolio/Market, Auth+LLM gating, Knowledge page, KB-RAG, staging domain, the full backlog,
  all reference/knowledge pages, **and the PoCs hub reorg**) has been moved to
  **[../features/README.md](../../features/README.md)** and its linked docs — nothing was deleted,
  just relocated. The PoCs hub specifically is supporting infrastructure AP2/AA plug into, not
  itself an AP2/AA task, so it now lives at
  **[../features/pocs-hub.md](../../features/pocs-hub.md)**.
- **IA:** [../features/README.md](../../features/README.md)
- **Status:** active — AP2 (§2), Toss Payments (§7), and AA (§3 + §6) are the only tracked tasks in
  this file.
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
- [§7 — Toss Payments — KRW settlement example (educational)](#s7)

## 0. Summary <a id="s0"></a>
<sub>[↑ TOC](#toc)</sub>
Three build tasks, jay's own framing: **AP2 = Agentic Payment Protocol** (§2, a Stripe settlement
example, USD rail), **Toss Payments** (§7, the KRW-native counterpart to §2 — added 2026-08-04
after hitting Stripe's country-signup limitation), and **AA = Account Abstraction** (§3's
ERC-7702/7715 foundation + §6's Agentic AA pillars). All three wire into the **PoCs hub** (`/etc`,
in progress — [../features/pocs-hub.md](../../features/pocs-hub.md)) as cards once built, but the hub
itself isn't tracked here.

**History:** this doc stays short on purpose — for the full blow-by-blow of what was actually
built/tested/decided on a given day, follow the `docs/history/YYYY-MM-DD-rabbit-history.md` link
next to whichever task you're resuming (e.g. [2026-08-03](../../history/2026-08-03-rabbit-history.md),
[2026-08-04](../../history/2026-08-04-rabbit-history.md) for everything below).

**Resume point (2026-08-04 EOD):** all four tasks are built on branch
**`claude/ap2-toss-aa-demos`** — ⚠️ **uncommitted** (working tree only, does not travel across
machines until committed/pushed). Next steps, in order: ① jay's browser click-throughs — AA
wallet flows on `/etc/aa` (MetaMask ERC-7715 grant + thirdweb Connect), Stripe test card on
`/ap2`, Toss test card on `/etc/toss` (client key was fixed late on 08-04 — O→0 typo — restart
the dev server first); ② jay reviews the diff → commit/PR; ③ deploy via `scripts/deploy.sh`
after merge. Full build details: [2026-08-04 history](../../history/2026-08-04-rabbit-history.md).

### Task status

| § | Task | Status |
| --- | --- | --- |
| [§2](#s2) | AP2 — Stripe settlement example | 🟢 Built — verified live against Stripe's test API |
| [§7](#s7) | Toss Payments — KRW settlement example | 🟢 Built — verified live against Toss's test API |
| [§3](#s3) | ETC — ERC-7702 / 7715 demo (AA foundation) | 🟡 Built — needs jay's own wallet click-through |
| [§6](#s6) | Agentic AA — 4 pillars demo | 🟡 Built — needs jay's own wallet click-through |

Legend: ⬜ To do.

## 1. Prerequisites — what jay needs to provide <a id="s1"></a>
<sub>[↑ TOC](#toc)</sub>
- **All keys below are filled in `.env.local` as of 2026-08-04** — this section is kept for
  reference (where each came from) rather than as an open ask.
- **§2 AP2 Stripe** — a Stripe **test-mode** publishable + secret key pair.
  - Get them at **[dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)**
    (sign in / create a free Stripe account → dashboard defaults to **Test mode**, toggle top-right
    if it doesn't → "Developers" → "API keys"). Copy the **Publishable key** (`pk_test_...`) and
    **Secret key** (`sk_test_...`). No business verification needed for test mode.
- **§3 AA foundation** — nothing expected (reuses the existing `SEPOLIA_RPC`, client-side signing).
- **§6 Agentic AA (thirdweb half)** — a thirdweb **client ID**, and possibly a secret key for
  server-side Engine calls.
  - Get them at **[thirdweb.com/dashboard](https://thirdweb.com/dashboard)** (sign in → create a
    project if none exists → project's "Settings" tab → "API Keys"). Copy the **Client ID**
    (public, safe client-side) and, if server-side Engine calls end up needed, the **Secret key**
    (server-only, never expose client-side).
- **§7 Toss Payments** — a Toss **test-mode** client + secret key pair.
  - Get them at **[developers.tosspayments.com](https://developers.tosspayments.com)** (개발자센터
    → sign in → "API 키" — a sandbox project's test client/secret keys are issued immediately, no
    business registration needed). Toss also publishes generic public test keys directly in its
    integration docs for quick sandbox testing without signing up at all — see
    [docs.tosspayments.com](https://docs.tosspayments.com)'s "연동 키" guide. Copy the **Client key**
    (public) and **Secret key** (server-only).

## 2. AP2 — Stripe settlement example (educational) <a id="s2"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: 🟢 Built (2026-08-04)** — code at [app/ap2/page.tsx](../../../app/ap2/page.tsx) +
  [app/api/ap2/checkout/route.ts](../../../app/api/ap2/checkout/route.ts). Live PoCs-hub card.

- **Goal:** a simple, educational **fiat** settlement example via **Stripe** (counterpart to the
  on-chain x402 / aiaas track in `../features/ap2-test.md`).
- **Design (built as):** mock "agent buys data, settles via Stripe": provider quotes a fixed price
  → plain `<form>` POSTs to `/api/ap2/checkout` → server creates a **Stripe Checkout Session**
  (Checkout, not raw PaymentIntent — simpler, hosted UI) → redirect to Stripe's hosted page →
  success returns to `/ap2?session_id=…`, where the server verifies `payment_status === "paid"`
  via the Stripe API before releasing the mock data (never trusts the redirect alone).
  **Test-mode keys only**, no real charges.
- **Verified:** session creation + Stripe redirect + server-side payment-status verification all
  confirmed live against Stripe's real test API (`curl`-level, no UI). **Not yet done:** an actual
  card entry click-through on Stripe's hosted Checkout page (needs a browser).

## 3. ETC — ERC-7702 / 7715 demo (educational) <a id="s3"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: 🟡 Built (2026-08-04), needs jay's own wallet click-through** — code at
  [app/etc/aa/SessionKeyDemo.tsx](../../../app/etc/aa/SessionKeyDemo.tsx). Live PoCs-hub card
  (`/etc/aa`), but ERC-7715's MetaMask popup can't be clicked through by an agent — see Verified
  below.

**Standards (jay confirmed):** **EIP-7702** (an EOA temporarily runs smart-account code = a
*delegatable smart account*) + **ERC-7715** (`wallet_grantPermissions` — grant a scoped **session
key**) / **ERC-7710** (delegation).
- **Goal:** a test page for **delegatable smart accounts / session keys** — ties directly to the
  aiaas spend-policy idea (session key = agent's bounded wallet).
- **Design (built as):**
  - Connect MetaMask → generate a throwaway **session account** client-side (never leaves the
    browser) → request an **ERC-20 allowance permission** via ERC-7715 ("≤5 test Sepolia USDC,
    valid 1h", the closest built-in permission type to jay's "spend ≤ X to address Y" framing) →
    the session account then signs and sends a bounded transfer **on its own, no MetaMask popup**.
  - Testnet (**Sepolia**); a public read-only RPC is used client-side (not jay's Alchemy key).
- **Decided (jay):** stack = **MetaMask Delegation Toolkit** on **Sepolia**.
  *(Alternative: ZeroDev / permissionless.js for 7702/4337 session keys.)* Scope = short explainer + one demo tx.
- **Package rename found while building (2026-08-04):** `@metamask/delegation-toolkit` is
  deprecated in favor of **`@metamask/smart-accounts-kit`** (same team/framework, same concepts) —
  used the renamed package. Its permission API also evolved from the old `wallet_grantPermissions`
  naming to **`requestExecutionPermissions()`** (`wallet_requestExecutionPermissions` under the
  hood) — current docs at
  [docs.metamask.io/smart-accounts-kit](https://docs.metamask.io/smart-accounts-kit/).
- **Requires MetaMask v13.23.0+** (per MetaMask's own docs) — this is the **standard extension**,
  not Flask-only as originally assumed when this section was written.
- **Verified:** package installed, TypeScript compiles clean against the real SDK types, `pnpm
  build` succeeds, page serves 200. **Not yet done:** the actual ERC-7715 permission grant — that
  opens a real MetaMask popup, which needs jay's own browser/wallet to click through.
- This is **AA pillar 1** — §6 extends it with pillars 2–4 (different stack, see §6's
  "AA implementation stack" note).

## 4. Decisions & remaining open questions <a id="s4"></a>
<sub>[↑ TOC](#toc)</sub>
**Resolved (jay):**
- ETC standards = **7702 + 7715/7710**; stack = **MetaMask Delegation Toolkit on Sepolia** (§3).
- Agentic AA's pillars 2–4 (§6) use **thirdweb** instead of ZeroDev/Pimlico — see
  [§6's stack note](#s6) (2026-08-03).
- Added **Toss Payments (§7)** as the KRW-native settlement counterpart to §2 (2026-08-04) — jay
  hit Stripe's country-signup limitation (no live account available for his country), which
  surfaced Toss as the practical Korea-native alternative already scoped in
  [../features/toss-payments.md](../../features/toss-payments.md).
- AP2 (§2) built with **Stripe Checkout** (not raw PaymentIntent) — simpler, Stripe-hosted UI, no
  card-form UI to build ourselves. No explicit contrast-with-x402 UI added (2026-08-04).
- Toss Payments (§7) built as a **standalone page** (`/etc/toss`), not an `/ap2` extension — kept
  independent rather than a side-by-side USD/KRW comparison table (2026-08-04, default choice, not
  explicitly re-confirmed with jay).

**Still open:**
- None blocking — §2/§7/§3/§6 are all built. Remaining open items are noted inline in each
  section's Status line (mainly: jay's own wallet click-through for §3/§6).

*(All other resolved decisions — Auth/LLM keys, Market defaults, Knowledge serving, MCP scope —
moved to their respective docs in [../features/](../../features/README.md).)*

## 5. Sequence <a id="s5"></a>
<sub>[↑ TOC](#toc)</sub>
1. **Implement §2 AP2 Stripe** — Checkout-based, wired in as a PoCs-hub card. ✅ Built 2026-08-04.
2. **Implement §7 Toss Payments** — KRW counterpart to §2, standalone page, wired in as a
   PoCs-hub card. ✅ Built 2026-08-04.
3. **Implement AA (§3 foundation + §6 pillars)** — MetaMask Delegation Toolkit (now
   `@metamask/smart-accounts-kit`) for the 7702/7715 half, thirdweb for the 4337-pillars half —
   wired in as a PoCs-hub card. ✅ Built 2026-08-04, needs jay's own wallet click-through.

All three depend on the **PoCs hub** (`/etc`), which was built and deployed to production
2026-08-03 — see [../features/pocs-hub.md](../../features/pocs-hub.md) for that design and
[2026-08-03 history](../../history/2026-08-03-rabbit-history.md) for what shipped (`/etc` + `/til`
pages, shared `DemoCard` component, nav/middleware/env changes). §2/§3/§6/§7's own build details
are in [2026-08-04 history](../../history/2026-08-04-rabbit-history.md).

## 6. Agentic AA — 4 pillars demo (added 2026-07-17) <a id="s6"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: 🟡 Built (2026-08-04), needs jay's own wallet click-through** — pillars ②③ live at
  code [app/etc/aa/AgenticPillars.tsx](../../../app/etc/aa/AgenticPillars.tsx) (① is §3's
  SessionKeyDemo on the same page). **Pillar ④ (KYA) stayed an explainer card, not a live
  demo** — per this section's own note below, ERC-8004 Sepolia registry availability was never
  verified, so building a real demo against it would've been guessing at an unconfirmed contract.
  `pnpm build` succeeds, page serves 200; the actual sponsored-tx / batch-tx clicks need jay's own
  browser + thirdweb ConnectButton (can't be done by an agent).

- **Goal (jay):** demo the four things AA gives an autonomously-paying agent that an EOA
  can't: **① scoped delegation** (session key: "≤10 USDC/day, service X only, 48h"),
  **② gas independence** (paymaster — gas paid in earned USDC or sponsored),
  **③ atomic intent** (swap→bridge→pay in one UserOperation; any failure reverts all),
  **④ KYA** (ERC-8004 identity/reputation — counterparties check the agent before dealing).
- **Detail:** pillar table + mapping to existing items + demo shape in
  **[../features/agentic-aa.md](../../features/agentic-aa.md)**.
- **Shape:** extend the §3 ETC page — four cards, one per pillar, each with [Run] + tx link.
  **Stack — updated 2026-08-03: thirdweb** (Connect + Account + Engine) instead of the
  ZeroDev/permissionless.js + Pimlico stack originally noted here — see "AA implementation
  stack" below for the reasoning. Pillars 2–3 are the genuinely new work; pillar 4 is
  exploratory (ERC-8004 is young — verify testnet registry availability).
- **Est.:** pillars 1–3 ≈ 2–3d on top of §3; pillar 4 +1d. Ties the aiaas spend-policy idea
  ([ap2-test.md](../../features/ap2-test.md)) and [dsrv-portal.md](../../features/dsrv-portal.md)
  AA PoC into one coherent demo.
- **ERC-8021 add-on (added 2026-07-17):** on-chain attribution ("builder codes") — a
  calldata **suffix** (`[schema ID 1B] + [builder code] + [ERC marker 16B]`) the EVM ignores
  but the ledger keeps, proving which app/agent produced a tx (revenue share, agent
  rewards). Companion to pillar 4: **8004 = who the agent is, 8021 = what it produced.**
  Demo: tag pillars 1–3's txs with a rabbit builder code and parse the suffix back in the
  execution log (~+0.5d). Detail: [agentic-aa.md §4](../../features/agentic-aa.md).
- **WalletChan case study (added 2026-07-17):** "MetaMask for AI agents" — EIP-1193/6963
  provider injection + **remote signing** in the Bankr backend's TEE (keys never in the
  browser); v3's batch tx = pillar 3, gasless relayer = pillar 2, tx **simulation before
  signing** = a safety rail our demo page should copy. Control-flow inversion vs the aiaas
  track: human drives the UI, agent executes. Detail: [agentic-aa.md §5](../../features/agentic-aa.md).

### AA implementation stack — thirdweb vs. what's already decided
jay asked me to consider **ThirdWeb** (or recommend an alternative) for AA. There's already a
survey of thirdweb in **[../features/thirdweb.md](../../features/thirdweb.md)**, which flags this
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
  different SDKs** — 7702/7715 via MetaMask Delegation Toolkit (now `@metamask/smart-accounts-kit`,
  see §3's build note), 4337 pillars via thirdweb. That's not a compromise, it's the actual point:
  the demo shows both a delegation-based and a bundler-based approach to account abstraction side
  by side.

## 7. Toss Payments — KRW settlement example (educational) <a id="s7"></a>
<sub>[↑ TOC](#toc)</sub>
- **Status: 🟢 Built (2026-08-04)** — code at [app/etc/toss/page.tsx](../../../app/etc/toss/page.tsx)
  + [lib/toss.ts](../../../lib/toss.ts). Live PoCs-hub card, standalone page (not an `/ap2`
  extension — see §4).

- **Goal:** the **KRW-native counterpart** to §2 — same "agent buys data, settles via a payment
  provider" mock, on Toss Payments instead of Stripe. **Added 2026-08-04** after jay found his
  country isn't in Stripe's account-creation list; Toss is the practical Korea-native rail (no
  such signup restriction) and mirrors the same pattern well enough to run side by side with §2.
- **Detail:** full flow, integration pieces (client/secret key handling), surface placement, and
  open questions are already scoped in
  **[../features/toss-payments.md](../../features/toss-payments.md)** — this entry just tracks it as
  an active task alongside §2/§6 rather than backlog.
- **Keys:** see [§1 Prerequisites](#s1) for where to get test-mode client/secret keys.
- History: why this was added — [2026-08-04](../../history/2026-08-04-rabbit-history.md).
