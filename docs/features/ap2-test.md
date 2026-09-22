# AP2 / M2M Test

**Goal:** a *simple* sample of agent-to-agent payments — AP2 (Agent Payments Protocol) or M2M —
to learn the flow.

## Suggested simple idea
**"Agent pays for premium market data."** When asked for a deeper quote, the AI chat agent
autonomously pays a tiny fee to a mock "data provider" endpoint, then returns the data.
Smallest viable loop: request → **HTTP 402** → pay → retry → data (this is the x402 pattern).

Even simpler (no chain): an **AP2 mandate** demo — you grant the agent a bounded spend mandate;
the agent "spends" against it on a mock service and the remaining budget ticks down.

## If a smart contract is needed (plan)
- A minimal **escrow / paymaster**: user deposits mock jUSD; agent calls `pay(provider, amount)`
  bounded by a per-agent cap. Reuse session-key/paymaster ideas from Verex.
- Stack: a small Foundry contract + a tiny TS client; deploy to a testnet or local anvil.

## Real payment rail (Korea-usable)
The first cut can be mocked, but a stronger demo uses a **real** payment leg. Candidate:
**Bridge API** ([bridge.xyz](https://www.bridge.xyz) — stablecoin orchestration: virtual
accounts, jUSD transfers, on/off-ramps). **Open risk:** Korea availability — KRW on/off-ramp and
KYC are tightly regulated here, so Bridge's KR coverage must be **verified**, not assumed. Keep a
fallback (another stablecoin/payments API, or stay on testnet jUSD) in case it isn't usable from
Korea.

## rabbit-aiaas — Agent-as-a-Service (waiaas / x402)
*Source: [../tasks/jun-26-rabbit-draft.md](../tasks/jun-26-rabbit-draft.md) — draft, to be refined.*

The bigger frame for this category: an agent holds its **own wallet** and pays/settles small
amounts on-chain **without a human approving each charge** — the human only sets limits and rules
(policy). Lives as a **separate project** at `/Users/jay/work/task/rabbit-aiaas`; it introduces the
**rabbit-provider** service to the **rabbit-agent** app.

**Four things attached to an agent (waiaas-style):**
1. **Identity** — who the agent is.
2. **Wallet** — smart account / MPC.
3. **Spend policy** — limits · allowlist · time-window.
4. **Settlement / audit log.**

**Scenarios**
- *Personal:* a research/purchase agent auto-pays jUSD per paid API call; the user sets only policy
  ("$20/week; flights under ₩50k"); pause on limit breach. Also subscription/billing automation and
  daily delegation of repeated micro-payments.
- *Business (x402):* sell an API **per call** instead of "key + monthly bill":
  ```
  agent        → GET /premium-data
  server       → 402 Payment Required (price $0.01, pay-to 0x…, chain Base)
  agent wallet → sends jUSD 0.01
  server       → verifies payment, returns data
  ```

### Concrete PoC pieces (separate projects)
- **rabbit-agent** — gets its **own category in the Rabbit top menu**; talks to rabbit-provider;
  holds the wallet + policy and runs the pay→retry loop.
- **rabbit-provider** — sells **philosophical aphorisms** for **0.01 jUSD** (or a stablecoin) to AI
  agents like rabbit-agent. Built on a **testnet** first, but **design for real stablecoin rails**
  (see Bridge API above) so it can graduate later.

**Next steps (from the draft)**
- Pick the smallest PoC scope: one personal scenario **or** one x402 402-flow.
- Choose wallet / chain / stablecoin (assume **Base + jUSD**).
- Define a minimal policy engine.

## Open questions
- Centerpiece: **x402** (pay-per-call) or **AP2 mandate** (delegated budget)?
- On-chain (testnet) or fully mocked for the first cut?
- Real payment rail usable **from Korea** — Bridge API vs alternatives (KRW ramp + KYC)?

## Features
- [ ] **Decide the approach** (you)
  - [ ] x402 vs AP2 mandate; on-chain vs mocked
- [ ] **Build the demo**
  - [ ] Mock "data provider" endpoint: 402 → pay → data
  - [ ] Agent pay→retry loop in the chat flow
  - [ ] (if on-chain) minimal escrow/paymaster contract + TS client
- [ ] **Real payment rail (Korea-usable)**
  - [ ] Evaluate **Bridge API** ([bridge.xyz](https://www.bridge.xyz)) — stablecoin transfers / virtual accounts
  - [ ] Verify KRW on/off-ramp + KYC/regulatory constraints in Korea (don't assume coverage)
  - [ ] Pick a fallback if Bridge isn't usable from KR (other stablecoin/payments API, or stay on testnet jUSD)
- [ ] **rabbit-aiaas (Agent-as-a-Service)** — separate project `/Users/jay/work/task/rabbit-aiaas`
  - [ ] **rabbit-provider** — testnet service selling aphorisms for 0.01 jUSD via x402 402-flow; design for real rails
  - [ ] **rabbit-agent** — new top-menu category; wallet + policy + pay→retry against rabbit-provider
  - [ ] Minimal policy engine (limit · allowlist · time-window) + settlement/audit log
  - [ ] Choose wallet / chain / stablecoin (assume Base + jUSD)
