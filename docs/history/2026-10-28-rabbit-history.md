# 2026-10-28 — rabbit history

Source doc: [`../tasks/current-plan.md`](../tasks/current-plan.md) — rewritten today around four new tasks (jay's Wonderland todo list).

## Added

- `current-plan.md` rewritten: four tasks with full plans (T1 LLM → Claude, T2 EIP-7702 done by us, T3 x402 via the x402.org facilitator, T4 Discord then X bot), three decisions for jay; the previous content kept below as "Earlier plan (archived)"

## Done

- T1 deployed by jay: revision rabbit-00170-fhk runs Claude Sonnet 5.5 (health check, label and a live chat verified)
- Pre-deploy security review: 21 upheld findings, none critical; top three are Next.js CVE-2025-29927, budget overspend by concurrency, spoofable XFF burst key
- Jay Chat auto-scrolls to the new question when a suggestion button (or Send) is used; the stream follows only when the reader is at the bottom
- T1 built and smoke-tested locally (Opus, Haiku and Sonnet 5.5; default Sonnet per jay, final) (provider switch, streaming, probe, estimate, dynamic label, bold rendering); not deployed
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

### T1 built: Rabbit's LLM can run on Claude (switch, not replacement)

**Cause:** jay: "go ahead and change this part", then pasted the Jay Chat subtitle that still said "Qwen Flash". The key `rabbit-local` was already in `.env` as `ANTHROPIC_API_KEY`.
**Reasoning:** The model was not chosen, so I used the plan's default (Opus 5.5) and made the model one env line (`AI_MODEL`). The OpenAI path stays as the rollback because the only credit is a promo grant expiring 2026-11-05 with no card. Production must not switch by accident, so `deploy.sh` goes to Claude only with a `CLOUD_ANTHROPIC_API_KEY`, never the laptop key. Two bugs were caught before running anything:
- `deploy.sh` now passes an empty budget var, and `??` would have turned it into a budget of 0, refusing every chat. Fixed with `||`.
- `withBold("")` returns a truthy array and would have hidden the "생각 중…" placeholder.
**Change:** `lib/ai-provider.ts`, `lib/jay-chat.ts`, `lib/agent-estimate.ts`, `app/api/jay-chat/health/route.ts`, `app/home/page.tsx`, `app/JayChatClient.tsx`, `scripts/deploy.sh`, `docs/features/ai-chat.md`, new `scripts/smoke-claude.ts`, `@anthropic-ai/sdk` 1.3.0. Details are in current-plan §1.6.
**Result:**
- The smoke test against the real API passed: probe ok, Korean and English answers in the right language and in the third person, 900 tokens read from the prompt cache, and the estimate returned schema-valid JSON.
- Measured cost corrects the plan: the RAG context is ~4,300 input tokens, so Opus is ~$0.03 per question, not $0.014.
- `tsc` clean. Not deployed. The browser UI has not been checked, because jay's dev server on :3100 was hung and was left alone.

### T1: browser check, then the default model settled on Haiku 5.5

**Cause:** jay asked to run rabbit for testing. While it ran he said "Default should be haiku", then "Sonnet would better", then "sorry haiku".
**Reasoning:** Each model was switched in and tested live, so the decision rests on measurements:

| Model | Latency | Per question |
|---|---|---|
| Haiku 5.5 | 1.4 s on the route, 3.5–4.8 s in the smoke test | ~$0.001 |
| Sonnet 5.5 | 2.2 s on the route, 4.2–6.8 s in the smoke test | ~$0.014 |
| Opus 5.5 | 5–9 s | ~$0.03 |

All three passed the probe, KO/EN answers, the 900-token cache read and the schema JSON estimate. Sonnet at the old 450k/h budget has a ~$1,050/month worst case, so the budget default became per model rather than an Opus-only special case.
**Change:**
- `claudeModel()` default is `claude-haiku-5-5`.
- `defaultHourlyBudget()` in `lib/jay-chat.ts`: Opus/Fable 60k, Sonnet 120k, Haiku/OpenAI 450k.
- `current-plan.md` D1 marked decided, T1 row and §1.6 updated; `ai-chat.md` updated.
- The dev server runs as `AI_PROVIDER=anthropic pnpm dev` on :3100 (jay's `.env` unchanged).
**Result:**
- Browser (Playwright, Chrome): the label reads "… — Claude Haiku 5.5 + 이력 기반 RAG" after the switch.
- Bold renders as `<strong>` (5 tags, no `**` left). Single-asterisk italics and markdown links still show raw.
- Not deployed.

### T1: final default model is Sonnet 5.5

**Cause:** After the Haiku entry above, jay: "sonnet would be better".
**Reasoning:** Sonnet 5.5 had already passed every live check that day (probe, KO/EN answers, cache read, schema JSON). It sits between Haiku and Opus on both price (~$0.014/question) and answer quality, and its 120k/h budget default was already in place.
**Change:** `claudeModel()` default is `claude-sonnet-5-5`; the D1 row, §1.6 and `ai-chat.md` were updated to match.
**Result:** The running dev server (:3100) shows "Claude Sonnet 5.5" in the chat label. Not deployed.

### Jay Chat: scroll to the new question, follow the answer only from the bottom

**Cause:** jay (screenshot): clicking a suggested question did not scroll the chat box down, so the new turn stayed out of sight.
**Reasoning:** The old code scrolled only inside the stream loop, right after `setMessages`, which is before React draws the new text. It always landed one chunk short, and it never scrolled when the question itself was added. Scrolling in a `useEffect` after the render measures the real height. Following the stream unconditionally would yank a reader who has scrolled up, so it sticks only when the reader is within 80 px of the bottom.
**Change:** `app/JayChatClient.tsx`: `useEffect` on `messages`. A new turn always scrolls the log to the bottom and `scrollIntoView({block: "nearest"})` brings the chat box on screen; while streaming, it scrolls only if `stickRef` is set (updated by `onScroll`). The per-chunk `scrollTo` is gone. Branch `claude/chat-autoscroll`.
**Result:** Playwright on :3100 (Sonnet), three suggestion clicks: the log is at the bottom (gap 0 px) right after each click and after each answer, and the newest message is on screen. Scrolling to the top mid-answer stays at the top (`scrollTop` 0 after the answer ends). Not deployed. The fix is provider-independent and ships with the next deploy.

### T1 live, and what the security review found

**Cause:** jay asked "Is there vulnerability to deploy to cloud", set `CLOUD_ANTHROPIC_API_KEY` + `AI_PROVIDER=anthropic`, and ran `./scripts/deploy.sh` while the review was still running.
**Reasoning:** The review covered exactly what ships: `462909f..main` plus the live Cloud Run config. It ran as a workflow: 5 lenses (secrets, abuse/cost, injection, client/routing, dependencies), 2 skeptics per finding (one on reachability, one on impact), then a completeness critic. Only findings that at least half the skeptics failed to refute were kept.
**Change:** none to code yet. `current-plan.md` §1.7 lists the ranked fixes; the T1 row says live.
**Result:**
- Production: revision `rabbit-00170-fhk`. The health check returns `{"jayChat":{"ok":true,"model":"claude-sonnet-5-5"},"devnet":{"ok":true}}`. The homepage label reads "Claude Sonnet 5.5". A Korean question was answered in 2.3 s.
- Review: 62 agents, 28 findings, 21 upheld, 7 refuted, nothing critical.
  - Top issue, pre-existing: Next.js 14.2.18 is open to CVE-2025-29927. A header skips the middleware, verified with read-only GETs (`/dashboard` 302 → 200). Only page shells are exposed, since the data APIs re-check auth.
  - Top new issue: the hourly budget is charged after the stream, so concurrency overshoots it.
  - Also: the burst guard trusts the first XFF entry, which a client can spoof.
- Fixes are proposed, not applied.
