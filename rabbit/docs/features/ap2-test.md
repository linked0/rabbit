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
- A minimal **escrow / paymaster**: user deposits mock USDC; agent calls `pay(provider, amount)`
  bounded by a per-agent cap. Reuse session-key/paymaster ideas from Verex.
- Stack: a small Foundry contract + a tiny TS client; deploy to a testnet or local anvil.

## Open questions
- Centerpiece: **x402** (pay-per-call) or **AP2 mandate** (delegated budget)?
- On-chain (testnet) or fully mocked for the first cut?

## Features
- [ ] **Decide the approach** (you)
  - [ ] x402 vs AP2 mandate; on-chain vs mocked
- [ ] **Build the demo**
  - [ ] Mock "data provider" endpoint: 402 → pay → data
  - [ ] Agent pay→retry loop in the chat flow
  - [ ] (if on-chain) minimal escrow/paymaster contract + TS client
