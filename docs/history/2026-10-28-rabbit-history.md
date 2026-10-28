# 2026-10-28 — rabbit history

Source doc: [`../tasks/current-plan.md`](../tasks/current-plan.md) — rewritten today around four new tasks (jay's Wonderland todo list).

## Added

- `current-plan.md` rewritten: four tasks with full plans (T1 LLM → Claude, T2 EIP-7702 done by us, T3 x402 via the x402.org facilitator, T4 Discord then X bot), three decisions for jay; the previous content kept below as "Earlier plan (archived)"

## Done

- (planning only; nothing built)
- current-plan T1: recorded jay's Console credit ($200 promo, expires 2026-11-05 UTC, no card) and added step 0, a provider switch for rollback

### current-plan.md: four new tasks on top, the old plan archived below

**Cause:** jay sent a screenshot of four unchecked todos (Change the API of Rabbit to Claude · 7702 한번 구현해보자 · x402.org facilitator 활용해보기 · X나 Discord 봇계정 연동해보기) and asked for a detailed plan of what to do in `current-plan.md`, with the old content moved later in the document.
**Reasoning:** Every plan starts from what the repo and the live services actually have, checked today, not from memory:
- **T1:** three LLM call sites go through `lib/ai-provider.ts`, and production runs OpenAI gpt-4o-mini. `agent-estimate.ts` sends `temperature: 0`, which Claude Opus 5.5 rejects. The Claude API reference says to use the native `@anthropic-ai/sdk`, with model prices Opus 5.5 $4/$20 and Haiku 5.5 $0.10/$0.50 per 1M tokens. The model is left to jay (D1) because Opus at the current 450k tokens/hour budget has a ~$2,100/month worst case.
- **T2:** `eth_getCode` on the devnet shows MetaMask's `EIP7702StatelessDeleGatorImpl` (0x63c0…E32B) and `DelegationManager` (0xdb9B…7dB3) present via the Sepolia fork. Wallets won't sign raw 7702 authorizations for dapps, so the demo uses a burner key.
- **T3:** `x402.org/facilitator/supported` lists Base Sepolia (eip155:84532), Solana devnet and other testnets, but not the Jayverse devnet or jUSD. So the demo is priced in Base Sepolia USDC. `@x402/*` 2.20 is installed but unused.
- **T4:** Discord goes first (free, slash commands over HTTP). The 3-second reply limit plus Cloud Run's CPU throttling after a response means the deferred follow-up needs its own request (Cloud Tasks). X's API pricing must be checked before any X work.
**Change:** `docs/tasks/current-plan.md`: new §0 Summary (status, branch per task, order T1→T4), decisions D1–D3, and §1–§4, each with what exists, facts, steps, acceptance and risks. The old 460 lines follow unchanged under `## Earlier plan (archived 2026-10-28)`: its title became a bold line, other headings moved down one level, and all its `<a id>` anchors are kept. Branch `claude/plan-claude-7702-x402-bots` off `main` (462909f).
**Result:** 667 lines; every in-file anchor and `../` link resolves. Next step: jay answers D1 (model) and D3 (what x402 sells), then T1 starts on `claude/claude-api`.

### T1: the $200 API credit is promotional and expires 2026-11-05

**Cause:** jay shared the Console Billing page ("check this"), after saying the API credit matches his $200 Max subscription.
**Reasoning:** The page settles what I could not verify earlier. It shows a one-off **promotional** grant ($200 of $200, granted 2026-10-19, expires 2026-11-05 UTC) for Agent SDK, API, Batch, Playground and Managed Agents (not Claude Code). The purchased balance is $0, auto-reload is off and there is no payment method, so nothing can be charged and the API stops when the credit is gone. Two consequences: the test is free, and a Claude-only Jay Chat would go down on 11/5 unless credits are bought.
**Change:** `current-plan.md` §0 T1 row (the deadline), §1.2 (a credit table), §1.4 step 0 (build behind `AI_PROVIDER=anthropic|openai` so one env change rolls back).
**Result:** The plan now has a hard date. Build and test T1 before 2026-11-05 09:00 KST.
