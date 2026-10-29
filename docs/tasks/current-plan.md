# Rabbit — current plan: Claude API · EIP-7702 · x402 · bot accounts · Kubernetes · RAG · my own model

> **Written for:** the agent (or jay) who picks this up in `~/work/rabbit`, possibly on another
> machine with no conversation history. This file is the resumable state. The four tasks come
> from jay's Wonderland todo list (2026-10-28):
>
> 1. Change the API of Rabbit to Claude
> 2. 7702 한번 구현해보자 (implement EIP-7702 ourselves)
> 3. x402.org facilitator는 개발·테스트넷 전용이다 — 활용해보기 (use the x402.org facilitator)
> 4. X나 Discord 봇계정 연동해보기 (connect an X or Discord bot account)
>
> Added 2026-10-29 from alice `ai-engineer-builds-the-car` (Deep #82, the Tier 2 and Tier 3 skills), jay: "Add the two
> task into the Current plan":
>
> 5. Containers and Kubernetes PoC (Tier 3)
> 6. RAG: measure Jay Chat's retrieval, then bring it to Wonderland (Tier 2)
>
> Added 2026-10-29, jay: "Add T7: My AI model", then "how can I train or fine tune a existing model with my 128G mac
> book, compare it to RTX Spark or something":
>
> 7. My AI model: fine-tune an open model on the M5 Max, compared with DGX Spark / RTX Spark
>
> **The earlier plan** (Chains menu brief and the 2026-09-23 status board) is kept unchanged at
> the end of this file under [Earlier plan (archived)](#archive).

## 0. Summary <a id="now"></a>

*Last updated 2026-10-29 (KST).*

| # | Task | State | Next step |
|---|---|---|---|
| **T1** | [Rabbit's LLM → Claude](#t1) | **LIVE 2026-10-28** on revision `rabbit-00170-fhk`, model **Sonnet 5.5**. Health check `claude-sonnet-5-5` ok, label correct, chat 2.3 s. **$200 promo credit expires 2026-11-05 UTC** ([§1.2](#t1-cost)) | Hardening from the pre-deploy review ([§1.7](#t1-review)): bump Next.js, reserve budget before the call, fix the XFF key |
| **T2** | [EIP-7702, done by us](#t2) | **Planned.** The delegator contract is on the devnet (checked 2026-10-28) | build §2.4 steps 1–4 |
| **T3** | [x402 with the x402.org facilitator](#t3) | **Planned.** Facilitator networks checked; `@x402/*` 2.20 installed but unused | jay decides the paid resource ([D3](#t-decide)), then §3.4 |
| **T4** | [Discord (then X) bot](#t4) | **Planned.** Nothing exists | jay creates the Discord application (§4.4 step 1) |
| **T5** | [Rabbit's image on Kubernetes (PoC)](#t5) | **Planned (2026-10-29).** The Dockerfile and `.dockerignore` already exist (Cloud Run); no cluster, no manifests | §5.3 step 1: audit the image (`docker history`, size, digest) |
| **T6** | [RAG: measure Jay Chat, then Wonderland](#t6) | **Planned (2026-10-29).** Jay Chat already has lexical RAG (`lib/about-me.ts` `retrieve()`); no eval set, no embeddings | §6.3 step 1: write the eval set, run today's retrieval against it |
| **T7** | [My AI model: fine-tune an open model on the Mac](#t7) | **Planned (2026-10-29).** M5 Max 128 GB and Ollama 0.40.12 are ready; mlx-lm 0.29.1 is too old; no dataset. Hardware compared in [§7.4](#t7-hw): the Mac is enough, so there is no need for a Spark | §7.5 step 1: fresh mlx-lm venv, then the dataset; base model per [D5](#t-decide) |

- **Repo / branch:** `~/work/rabbit`. This plan was written on `claude/plan-claude-7702-x402-bots` (off `main` at `462909f`). Give each task its own branch: `claude/claude-api`, `claude/eip7702-diy`, `claude/x402-facilitator`, `claude/discord-bot`.
- **Suggested order:** T1 → T2 → T3 → T4. T1 changes the one paid dependency every other feature talks through. T2 and T3 are independent demos. T4 reuses T1's chat and the health check, so it goes last. T5 and T6 (added 2026-10-29) are independent of T2–T4 and can run in any gap; T6 before T4 is worth it, because the bot's `/ask` answers through the same retrieval. T7 comes after T6, because it is scored with T6's eval set. Branches: `claude/k8s-poc`, `claude/rag-eval`, `claude/my-model`.
- **History:** the planning session is logged in [`../history/2026-10-28-rabbit-history.md`](../history/2026-10-28-rabbit-history.md). The groundwork it builds on (the Jay Chat health check, Telegram alerts, devnet recovery) is in alice's `docs/history/2026-10-09-rabbit-history.md`.
- **Not touched by this plan:** the parked `claude/markets-pyth` branch (Markets menu on Pyth, last commit 2026-10-20, not merged to `main`).

### Decisions waiting on jay <a id="t-decide"></a>

| # | Decision | Options | Recommended | If left undecided |
|---|---|---|---|---|
| ~~**D1**~~ **DECIDED 2026-10-28** | **Which Claude model Jay Chat uses** | Opus 5.5 · Sonnet 5.5 · Haiku 5.5 (all three smoke-tested live) | jay: **Sonnet 5.5** (final, after Opus → Haiku → Sonnet → Haiku → Sonnet the same day). ~$0.014/question, ~2–7 s, budget default 120k/h | — |
| **D2** | **Where the bot lives first** | **(a)** Discord · **(b)** X | **(a)** Discord: free API, slash commands over HTTP, fits Cloud Run. X's API pricing must be checked first ([§4.2](#t4-x)) | Discord |
| **D3** | **What the x402 demo sells** | **(a)** a signed price quote ("the agent pays for its price feed") · **(b)** an aphorism for $0.01 (ap2-test's old idea) | **(a)**: it is the story already written in `../features/README-history.md` (item 2) and reuses Markets/Pyth data | (a) |
| **D4** | **Embeddings for T6 option B** | **(a)** an embedding API (Voyage, the provider Anthropic's docs point to; one new key, cents for this corpus) · **(b)** a local multilingual model run at build time (no key, no data leaves the Mac, one new dependency) | decide after §6.3 step 2: if the eval shows option C (whole corpus in a cached prompt) wins, no embeddings are needed at all | skip B, compare A (today) with C only |
| **D5** | **T7's base model** | **(a)** Qwen3.5-4B · **(b)** Qwen3.5-9B · **(c)** Gemma 4 E4B · **(d)** Kanana-2-3B ([§7.3](#t7)) | **(a)**: Apache-2.0, multilingual, supported end to end (mlx-lm → Ollama), fast to iterate; then (c) as an A/B | (a) |
| **D6** | **Does T7's model face visitors?** | **(a)** local only · **(b)** Cloud Run L4 (~$1.05/h while up, scales to zero) · **(c)** a tunnel to the Mac behind a secret ([§7.6](#t7)) | **(a)** until §7.5 step 5 shows the fine-tune beats base + RAG | (a) |

## 1. T1 — Rabbit's LLM → Claude <a id="t1"></a>

### 1.1 What exists today

Every LLM call goes through **one provider definition**, `lib/ai-provider.ts`: an OpenAI-compatible `chat/completions` endpoint plus key plus model, read from `AI_API_ENDPOINT` / `AI_API_KEY` / `AI_API_MODEL`. Production is currently **OpenAI `gpt-4o-mini`**; DashScope `qwen-flash` is the code default. Three call sites:

| Call site | File | How it calls | What changes |
|---|---|---|---|
| Jay Chat (public, streaming) | `lib/jay-chat.ts` → `streamJayChat()` | raw `fetch`, SSE, `stream_options.include_usage`; the route returns a plain-text stream to `JayChatClient` | SDK stream; keep the route's plain-text contract |
| Hourly health probe | `lib/jay-chat.ts` → `probeJayChat()`, called by `app/api/jay-chat/health/route.ts` | 1-token `fetch` | SDK call; quota/rate classification moves to typed errors |
| Agent estimate (R-D) | `lib/agent-estimate.ts`, used by `lib/agent-tick.ts` | `fetch`, `temperature: 0`, regex-extracts JSON from the text | **`temperature` must go** (see 1.3); use structured outputs instead of regex |

Supporting pieces: `classifyLimit()` / `reportIfLimited()` in `lib/ai-provider.ts` (OpenAI and DashScope error words) and the Telegram alerts in `lib/visitor-notify.ts`. `scripts/deploy.sh` uploads the key as the secret `rabbit-ai-key` and passes the endpoint and model as plain env. The hourly in-memory token budget is `JAY_CHAT_HOURLY_TOKEN_BUDGET` (450k).

### 1.2 Cost — the reason D1 is jay's <a id="t1-cost"></a>

Prices from the Claude API reference, cached 2026-10-06. A Jay Chat question is about 2,000 input + 300 output tokens after the route's history trimming; thinking tokens bill as output.

| Model | Per question (≈) | Worst case at the current 450k tokens/hour budget, 24/7 |
|---|---|---|
| `gpt-4o-mini` (today) | ~$0.0005 | ~$70 / month |
| `claude-haiku-5-5` | ~$0.0004 (estimate) → ~$0.001 at the measured token counts | ~$50 / month |
| `claude-opus-5-5` | ~$0.014 (plan estimate) → **~$0.03 measured** (4,300-token RAG context + 900 cached) | ~$2,100 / month → **lower the budget to ~60k/hour** (~$280 worst case) |

The worst case only happens if someone hammers the endpoint for a month. The budget is the cap, and the provider-side spend limit in the Anthropic Console is the real backstop: set one either way.

**jay's API credit, read from the Console Billing page on 2026-10-28:**

| Item | Value | What it means for T1 |
|---|---|---|
| Purchased balance | **$0.00**, auto-reload **off**, **no payment method** | Nothing can be charged to a card. When the credit runs out, API calls stop with a billing error → the hourly check sends 🚨 quota |
| Promotional credit | **$200.00 of $200.00**, granted 2026-10-19 | Free money for the test, so D1 costs nothing during it |
| Promo applies to | Agent SDK, API, Batch API, Playground, Managed Agents (**not Claude Code**) | Covers Jay Chat, the probe and the agent estimate |
| **Promo expires** | **2026-11-05 (UTC)** = 11/5 09:00 KST | **Deadline:** after this, a Claude-backed Jay Chat goes down unless credits are bought. Hence §1.4 step 0 |

Whether a new grant appears each month is not shown on that page. Treat it as one-time until a second grant shows up.

### 1.3 Facts that shape the build

- **Use the native Messages API with `@anthropic-ai/sdk`**, not Anthropic's OpenAI-compatible shim. That retires the "endpoint + key + model always move together" trio in `ai-provider.ts`.
- **Opus 5.5 rejects sampling parameters** (`temperature`/`top_p`/`top_k` → 400) and **thinking cannot be turned off** (`{type: "disabled"}` → 400). Control depth with `output_config: { effort: "low" }` for chat and the estimate.
- **System prompt:** `buildAboutMeSystemMessage()` returns a `{role: "system"}` message. With Claude it becomes the top-level `system` param. Put the stable persona text first with `cache_control` and the per-question RAG context after it, so the persona is cached. Check that `usage.cache_read_input_tokens` is above 0 on the second question.
- **Streaming:** `client.messages.stream(...)`; `stream.on("text", …)` for deltas; `await stream.finalMessage()` gives `usage` (input + output) for `recordTokenUsage()`.
- **Errors by type, not by words:** `Anthropic.RateLimitError` (429) → "rate"; status **402 `billing_error`** → "quota"; 529 `overloaded_error` and 5xx → provider down; `AuthenticationError` (401) → key. Verify on the first real failure whether credit exhaustion arrives as 402 or as a 400 "credit balance" message, and classify both as quota.
- **Refusals:** check `stop_reason === "refusal"` before reading text. For Opus 5.5 the house default is the server-side fallback (`betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`).

### 1.4 Steps

0. **Keep a way back (because the promo credit expires 2026-11-05).** Build T1 behind `AI_PROVIDER=anthropic|openai`, keeping the current OpenAI path, so one env change reverts Jay Chat without a code deploy if the credit runs out or expires. Remove the OpenAI path only once jay has paid credits or a recurring grant.
1. `pnpm add @anthropic-ai/sdk`. Rewrite `lib/ai-provider.ts`: export one `anthropic()` client factory (key from `ANTHROPIC_API_KEY`), `AI_MODEL` (default per D1), and `classifyLimit(error)` working on SDK error types. Keep `reportIfLimited()`'s contract: never throws, awaited by the probe.
2. `streamJayChat()`: SDK stream → the same `ReadableStream<Uint8Array>` of plain text. Usage comes from `finalMessage()`. Keep `MAX_OUTPUT_TOKENS` (1,500), and at effort `low` check that it still leaves room for thinking plus the answer (raise it if answers truncate).
3. `probeJayChat()`: a minimal `messages.create` (small `max_tokens`, effort `low`). Any 200 is "alive". Confirm that a tiny `max_tokens` is accepted with thinking always on; if not, use 16.
4. `lib/agent-estimate.ts`: drop `temperature`. Replace the regex JSON extraction with `output_config.format` (a JSON schema for the estimate) and keep `max_tokens` modest.
5. `scripts/deploy.sh`: new secret `rabbit-anthropic-key` via `upsert_secret` (it only adds a version when the value changes), filled from **`CLOUD_ANTHROPIC_API_KEY`** (the `rabbit-cloud` key; the house `CLOUD_` prefix, as with `CLOUD_DATABASE_URL`) and **never** from `ANTHROPIC_API_KEY`, which is the laptop's `rabbit-local` key. Mounted in Cloud Run as `ANTHROPIC_API_KEY`. If `CLOUD_ANTHROPIC_API_KEY` is empty, skip the secret and stay on `AI_PROVIDER=openai`. Drop `AI_API_ENDPOINT`/`AI_API_MODEL` from `AI_ENV`, and pass `AI_MODEL` as plain env. Delete the `rabbit-ai-key` binding only after the new revision is verified.
6. If D1 = Opus: set `JAY_CHAT_HOURLY_TOKEN_BUDGET` to ~60000 in `.env` (deploy forwards it). Set a monthly spend limit in the Anthropic Console either way.
8. **Later (T1.1): drop the cloud key for Workload Identity Federation.** The Console offers "identity federation" when you create a key. On Cloud Run, rabbit's service account would get a short-lived Google identity token, and Anthropic would exchange it for API access, so there is no `rabbit-cloud` key in Secret Manager to leak or rotate. The SDK switches to it when `ANTHROPIC_FEDERATION_RULE_ID`, `ANTHROPIC_ORGANIZATION_ID`, `ANTHROPIC_SERVICE_ACCOUNT_ID` and `ANTHROPIC_IDENTITY_TOKEN_FILE` (or `ANTHROPIC_IDENTITY_TOKEN`) are set, and **only if `ANTHROPIC_API_KEY` is unset** (the key outranks federation).
   - **Open question:** Cloud Run does not write that token file by itself. Something must fetch it from the metadata server (`…/service-accounts/default/identity?audience=…`) and keep it fresh, because it expires in about an hour. Check the SDK docs for a token-provider hook before building a refresher.
   - Local dev keeps the `rabbit-local` key: the dialog itself says local scripts still need one.
   - Not before the 2026-11-05 deadline: ship T1 with the key first.
7. Update `docs/features/ai-chat.md` (provider, cost, budget) and the comments in `ai-provider.ts`, which still say the trio must "always move together".

### 1.5 Acceptance

- Local: `pnpm dev`, ask Jay Chat three questions in a row. Text streams, the second answer reads cache (log `cache_read_input_tokens`), and nothing in the UI changed.
- `npx tsc --noEmit` clean. The agent console's estimate returns valid JSON at least 5 times out of 5.
- Deployed: `POST /api/jay-chat/health` with the secret → `{"ok":true, "jayChat":{"ok":true,"model":"claude-…"}, "devnet":{…}}`.
- Break the key on a scratch revision (or call with a bad key locally) and confirm the 🛑 Telegram alert. Quota can't be forced, so check that the code path maps 402 to 🚨.

### 1.6 What was built (2026-10-28) <a id="t1-done"></a>

- **Switch:** `AI_PROVIDER=anthropic|openai` (default `openai`). `AI_MODEL` (default **`claude-sonnet-5-5`**, jay's D1). The hourly budget default follows the model: Haiku 450k, Sonnet 120k, Opus/Fable 60k, each a worst case of about $280/month or less. The key is `ANTHROPIC_API_KEY`, and the OpenAI trio is untouched (the rollback).
- **`lib/ai-provider.ts`:** `claude()` client, `claudeModel()`, `claudeFallbacks()` (server-side refusal fallback on Opus/Fable/Sonnet, off for Haiku), `classifyClaudeError()` (402/"credit balance" → quota, `RateLimitError` → rate), `reportClaudeLimit()`, `aiModelLabel()`, `activeModelInfo()`.
- **`lib/jay-chat.ts`:** `streamClaude()`. It uses `stream: true` so HTTP errors throw before streaming (the route still returns 502), caches the persona prefix up to `[Context about`, drops leading assistant turns (Claude requires a user turn first), records usage, and shows a short notice on refusal. `probeClaude()` uses 16 max tokens. The hourly budget defaults to 60k on Opus/Fable and 450k otherwise; env still wins, and `||` (not `??`) means an empty value doesn't become 0.
- **`lib/agent-estimate.ts`:** Claude path without `temperature`, with a JSON schema in `output_config.format` instead of regex extraction.
- **UI:** the label under Jay Chat comes from `aiModelLabel()` (it used to be a stale hardcoded "Qwen Flash"). Assistant bubbles render `**bold**` as `<strong>` via React nodes, never `innerHTML`.
- **`scripts/deploy.sh`:** `rabbit-anthropic-key` comes only from `CLOUD_ANTHROPIC_API_KEY`. Production uses Claude only if `AI_PROVIDER=anthropic` **and** that key is set; otherwise it stays on `openai` (it prints `▶ LLM 제공자: …`). The budget var is passed through and no longer forced to 450000.
- **Smoke test:** `scripts/smoke-claude.ts` (instructions in its header). Results 2026-10-28: label `Claude Opus 5.5`, probe ok (26 tokens), Korean answer 7.6 s, English 9.3 s, cache read 900 tokens per call, estimate `{"p":0.995,…}`.
- **Browser check (2026-10-28, `AI_PROVIDER=anthropic pnpm dev`):** the label reads "… — Claude Opus 5.5 + 이력 기반 RAG", `/api/jay-chat` answers in 5.3 s, and assistant bubbles show bold as `<strong>` (5 tags, no `**` left). **Still raw:** single-asterisk italics (`*x*`) and markdown links (`[GitHub](https://…)`). Either render them too (links restricted to `http(s)`) or tell the model to write plain text. **Not checked yet:** the deployed path.

### 1.7 Pre-deploy security review (2026-10-28) <a id="t1-review"></a>

A workflow review: 5 lenses, 2 adversarial verifiers per finding, plus a completeness critic. 28 findings, **21 upheld, 7 refuted**. Nothing critical. The ones worth fixing, in order:

1. **Next.js 14.2.18 → 14.2.35** (pre-existing; verifiers: medium).
   - CVE-2025-29927: the `x-middleware-subrequest` header skips `middleware.ts`, confirmed with read-only GETs on the live site (`/dashboard` 302 → 200).
   - Only page **shells** are exposed. Every owner-data API re-checks `auth()` in its handler and still returns 401. `/api/prices` and `/api/markets/quote` rely on middleware alone.
   - The same version also carries the 2025-12-11 App Router DoS advisories, and with `--max-instances 1` one hung instance takes the whole site down.
   - Fix: `pnpm add next@14.2.35`, build, smoke test, deploy. Defense in depth: an owner check in those pages and the two routes.
2. **The hourly budget can be overspent by concurrent requests** (new with T1; medium). Usage is recorded only after a stream ends, so ~80 parallel questions on one instance all pass the check. That is ~5–20× the Sonnet 120k budget per wave, which drains the $200 credit. Fix: reserve an estimate (input + `max_tokens`) **before** the call, settle with the real usage after, and cap in-flight Claude calls (e.g. 4).
3. **The burst guard keys on the first `X-Forwarded-For` entry**, which the client controls (pre-existing; medium). Spoofing it defeats the 15/min cap and lets anyone send jay unlimited Telegram "chat started" pings. Fix: use the **last** entry (appended by Google's front end), and evict old entries from the map.
4. **Lockout:** about 4–5 requests with long forged assistant turns can exhaust the hourly budget and shut Jay Chat for everyone until the hour resets (new; low). Fixes 2–3 plus a smaller cap on total history size reduce it.
5. **Lower priority:**
   - Forged assistant turns can steer the persona or use it as a free Claude proxy (low).
   - No Origin/Content-Type check, so other sites can make their visitors call `/api/jay-chat` (low).
   - All four Cloud Run services share the default compute SA, which has `roles/editor` (low; use a dedicated `rabbit-run` SA).
   - The Telegram bot token is shared with the Claude Code channel (low).
   - The retired secret `rabbit-jay-chat-key` still exists (info).

Refuted, among others: the `.env.example` budget override, the `server-only` guard, the `@anthropic-ai/sdk` supply chain (clean), the next-auth advisories (not reachable in this config). The full results are in this session's workflow transcript (`wf_a2356c3c-17f`).

## 2. T2 — EIP-7702, done by us <a id="t2"></a>

### 2.1 What exists today

- **`/live/aa`** (`app/live/aa/SessionKeyDemo.tsx`): ERC-7715 Advanced Permissions on the devnet. **MetaMask performs the 7702 upgrade inside the wallet**; the page only observes it ("Check my account" reads the code slot).
- **`/live/7702`** (`AccountInspector.tsx`): read-only. Paste an address and it reads `eth_getCode` and reports a delegation designator.
- **`lib/delegation.ts`**: server-side MetaMask delegation framework (caveat enforcers for amount and expiry) for the J2 agent.

What is missing is the thing itself: **we sign a 7702 authorization and send the type-4 transaction ourselves**, then use the upgraded EOA, then undo it.

### 2.2 Facts checked 2026-10-28

- The MetaMask Smart Accounts Kit (installed, `^1.7.0`) gives Sepolia's addresses: **`EIP7702StatelessDeleGatorImpl` `0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B`**, `DelegationManager` `0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3`.
- **Both have code on the Jayverse devnet** (11,185 and 11,503 bytes; the devnet forks Sepolia), so nothing needs deploying.
- **Browser wallets won't sign a raw 7702 authorization for a dapp.** MetaMask keeps upgrades to itself. So the "do it ourselves" demo uses a **burner key** created in the page (viem `generatePrivateKey`), funded by the devnet faucet. That's honest and safe: worthless chain, throwaway key.

### 2.3 The demo in one sentence

An ordinary EOA becomes a smart account for as long as we like: **sign authorization → send type-4 tx → code slot shows `0xef0100‖impl` → batch two calls in one tx → revoke → plain EOA again.**

### 2.4 Steps

1. **Burner + funding.** On a new panel in `/live/7702` ("Do it yourself"), generate a burner, keep it in `sessionStorage` (never `localStorage`), and fund it from the devnet faucet. jUSD's `mint` is open on the devnet.
2. **Authorize and upgrade.** viem: `walletClient.signAuthorization({ contractAddress: EIP7702StatelessDeleGatorImpl, chainId: 313370 })`, then send the type-4 transaction with `authorizationList: [auth]`.
   - **Nonce gotcha:** when the sender *is* the authority, the authorization nonce is the account nonce + 1. viem's `executor: "self"` handles it; use it.
   - Never use `chainId: 0`. That makes the authorization replayable on every chain.
3. **Show it.** Reuse `AccountInspector`'s logic: the code slot now reads `0xef0100` + the implementation address.
4. **Use it: one tx, two calls.** `toMetaMaskSmartAccount({ implementation: Implementation.Stateless7702, address: burner, signer })`, then execute `approve` + `transfer` (jUSD) atomically. Show one tx hash, two effects.
5. **Revoke.** Sign an authorization to `0x0000…0000` and send it. The code slot is empty again; show that.
6. *(Stretch)* **Sponsored upgrade.** The burner signs only the authorization; a funded relayer (the existing agent wallet) sends the type-4 tx. This is the "gasless onboarding" story: the authority and the gas payer are different accounts.
7. Add a `POC_CARDS` entry, or update the 7702 card, in `lib/poc-cards.ts`, then run `pnpm docs:pocs`. A new catalogue item needs EN/KO + copy buttons per `docs/AGENTS.md`.

### 2.5 Acceptance and risks

- On the devnet: steps 2–5 each produce a tx hash, and the inspector shows designator → empty. `npx tsc --noEmit` clean.
- **Risk:** the devnet clock or state can reset on an OOM restart (memory leak still open, see the 2026-10-09 history). The demo must survive a fresh chain: re-fund and re-upgrade, no stored assumptions.
- **Risk:** anvil must run Prague rules for type-4 transactions. The fork inherits Sepolia's hardfork; if a type-4 tx is rejected, that is the first thing to check.

## 3. T3 — x402 with the x402.org facilitator <a id="t3"></a>

### 3.1 What exists today

- `@x402/core`, `@x402/evm`, `@x402/svm` **2.20** are in `package.json` but **imported nowhere**. Useful exports: `@x402/core/server`, `@x402/core/http`, `@x402/core/client`, `@x402/evm/exact/server`, `@x402/evm/exact/client`.
- Design notes exist: `../features/ap2-test.md` (the request → 402 → pay → retry loop; the "rabbit-provider" idea) and `../features/README-history.md` item 2 ("the agent pays for the price feed").

### 3.2 Facts checked 2026-10-28 (`GET https://x402.org/facilitator/supported`)

- **x402 v2:** `exact`, `upto` and `batch-settlement` on **`eip155:84532` (Base Sepolia)**, plus `exact` on Solana devnet, Algorand, Aptos, Stellar and Hedera testnets, and XRPL. **v1:** `exact` on `base-sepolia`, `solana-devnet`.
- **Not supported:** the Jayverse devnet (313370) and jUSD. jay's note is right: this facilitator is for development and testnets only. So **the demo is priced in Base Sepolia USDC**, not jUSD. Mainnet would need a different facilitator (e.g. Coinbase CDP, with API keys); that is out of scope.
- Extensions advertised: `eip2612GasSponsoring`, `erc20ApprovalGasSponsoring`.

### 3.3 The flow

`GET /api/x402/quote` → **402** with payment requirements (scheme `exact`, network `eip155:84532`, asset Base Sepolia USDC, amount $0.01, `payTo` = jay's address) → client signs the EIP-3009 `transferWithAuthorization` → retries with the payment header → server asks the facilitator to **verify**, serves the resource, then **settles** → response carries the settlement tx hash (visible on Base Sepolia's explorer).

### 3.4 Steps

1. **Server route** `app/api/x402/quote/route.ts` using `@x402/core/server` + `@x402/evm/exact/server`, with the facilitator URL `https://x402.org/facilitator`. Look up the Base Sepolia USDC address in x402's network config, don't hard-code from memory. `PAY_TO` comes from env (a public address, not a secret). Add the path to `middleware.ts` `PUBLIC_PATHS`.
2. **Paid resource** (per D3): a signed price quote (symbol, price, timestamp, server signature) from the Markets data.
3. **Client page** `/live/x402`: a burner on Base Sepolia, a link to Circle's test-USDC faucet, and a "Buy one quote" button driven by `@x402/evm/exact/client`. Show the 402 body, the signed payment, the settled tx hash and the quote, step by step. The point is to make the protocol visible.
4. **Agent variant:** the J2 agent wallet pays for its own quote inside `agent-tick` (machine payment, no human). Gate it behind a flag so a tick loop can't drain the wallet; cap at N calls per hour.
5. Telegram: none. A paid call is not a homepage visit or Jay Chat (2026-10-09 notification policy).
6. Card in `lib/poc-cards.ts` + `pnpm docs:pocs`, linked from the AP2 card.

### 3.5 Acceptance and risks

- One full loop on Base Sepolia: 402 → pay → 200 + quote + settlement tx hash, verified on the explorer. A replayed payment header is rejected.
- **Risk:** the facilitator is a shared public testnet service with no SLA. Show a clear "facilitator unavailable" state, not a spinner.
- **Risk:** x402 v2 vs v1 header names differ. Use the 2.20 helpers end to end on both sides, never hand-built headers.

## 4. T4 — Discord (then X) bot account <a id="t4"></a>

### 4.1 Discord — why first, and the one design trap

- Free. **Slash commands can be served over plain HTTP** (an "Interactions Endpoint URL"), so no always-on gateway socket is needed. That fits Cloud Run's scale-to-zero.
- **The trap:** Discord requires an answer within **3 seconds**, and an LLM answer takes longer. The usual move is to reply "deferred" and finish later, but **Cloud Run throttles CPU once the response is sent** (the same reason the health probe awaits its Telegram call). The follow-up must run in its own request: enqueue a **Cloud Tasks** task (or a second internal call) that runs the chat and PATCHes the deferred message. Do not turn on always-on CPU for this; that is the verex-api cost line.

### 4.2 X — check before building <a id="t4-x"></a>

- X's API access and pricing have changed repeatedly. **Check the current tiers and the cost of posting before writing code.** Posting as a bot account needs a developer app with user-context OAuth for the bot account, and the account should carry X's "Automated" label.
- Useful scope once checked: **post-only announcements** (a Verex market resolved, a new Jayverse release). Replying to mentions with Jay Chat is a later, costlier step.

### 4.3 What the Discord bot does (v1)

| Command | Does | Reuses |
|---|---|---|
| `/ask <question>` | Jay Chat answer, as the About-Jay persona | T1's chat code, the hourly token budget, the burst guard (per Discord user id) |
| `/status` | Jay Chat + Devnet health in one embed | `app/api/jay-chat/health` logic |
| *(channel webhook, no bot needed)* | mirror the 🚨/🛑/⛓️ outage alerts into a private channel | `lib/visitor-notify.ts` `send()` gets a second sink |

### 4.4 Steps

1. **jay:** create the application in the Discord Developer Portal and add a bot user. Copy the **application id**, **public key** and **bot token** into `.env` (`DISCORD_APP_ID`, `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`). Invite the bot to a test server with the `applications.commands` scope.
2. `scripts/register-discord-commands.mjs`: PUT the command list to the application (guild-scoped while testing, global later).
3. `app/api/discord/interactions/route.ts`:
   - verify the **Ed25519 signature** (`X-Signature-Ed25519` + `X-Signature-Timestamp` over the raw body; `node:crypto` can verify ed25519) and reject anything unsigned,
   - answer PING (type 1) with PONG,
   - for `/ask`, reply type 5 (deferred) and enqueue the follow-up.
   - Add it to `PUBLIC_PATHS`: the signature is the guard.
4. `app/api/discord/followup/route.ts` (called by Cloud Tasks with a shared secret): run the chat, then PATCH `/webhooks/{app_id}/{token}/messages/@original`.
5. `deploy.sh`: secrets for the token and public key (`upsert_secret`), a Cloud Tasks queue, and the Interactions Endpoint URL set to `https://www.jaylabs.xyz/api/discord/interactions` (Discord sends a test PING when you save it).
6. Telegram: per the 2026-10-09 policy, only Jay Chat events notify. A Discord `/ask` is a Jay Chat conversation, so reuse `notifyChatStart` with a `discord:<user>` key.

### 4.5 Acceptance and risks

- `/ask` in the test server returns a persona answer within ~15 s. A request with a bad signature gets 401. `/status` matches the health endpoint.
- **Risk:** the public bot spends the same LLM budget as the web chat, so it shares the hourly budget (one pool), not a second one.
- **Risk:** a leaked bot token can post as the bot anywhere it's invited. It lives only in Secret Manager and `.env`; rotate it in the portal if it ever appears in a log.

## 5. T5 — Rabbit's image on Kubernetes (PoC) <a id="t5"></a>

### 5.1 Why, and what it proves

alice `ai-engineer-builds-the-car` (Deep #82), Tier 3: *"Containers and Kubernetes. Package the agent and its runtime so it
deploys the same way on hybrid cloud or bare metal."* The claim to prove is that sentence: **one image digest runs unchanged
in three places** (Mac Docker, a local Kubernetes cluster, Cloud Run) and gives the same answers. The item's generic PoC uses a toy
agent; Rabbit already has a real image, so this PoC uses that one. Local only: $0, production untouched.

### 5.2 What exists today

| Piece | Where | Note for the PoC |
|---|---|---|
| Multi-stage `Dockerfile` | repo root | runner copies only `.next/standalone`, `.next/static`, `public`, `content` (matches the Docker rule); `AUTH_SECRET=build-time-dummy-secret` is set in the **builder** stage only. Confirm it is not in the runner's env |
| `.dockerignore` | repo root | check it keeps out `.env*`, `.git`, `node_modules` |
| Agent tick | `app/api/agent/tick/route.ts` + `lib/agent-tick.ts`, driven by `app/api/agent/scheduler` (`lib/agent-scheduler.ts`) | today an HTTP call starts each tick. In the cluster a `CronJob` makes that call |
| Runtime secrets | Cloud Run env + Secret Manager | in the cluster they come from a `Secret` built from `.env` at apply time, never committed |

### 5.3 Steps

1. **Audit the image.** `docker build -t rabbit:poc .`, then `docker history --no-trunc rabbit:poc` and `docker inspect` (env) to check that no layer or env var holds a real secret. Write down the image size and the **digest** (`sha256:…`); every later step uses this digest.
2. **Place 1, Mac:** `docker run -p 3000:3000 --env-file .env.local rabbit:poc`. Check `/`, `/api/jay-chat/health` and one Jay Chat question.
3. **Place 2, local Kubernetes:** use **k3d**, not kind. k3s ships a NetworkPolicy controller, while kind's default CNI ignores NetworkPolicy, so the egress test in step 4 would pass for the wrong reason. Then `k3d image import rabbit:poc`, and in `infra/k8s/` (new, manifests only):
   - `deployment.yaml`: one replica, CPU and memory requests/limits, readiness probe on `/`, liveness on the same, non-root `securityContext`.
   - `service.yaml`: ClusterIP; `kubectl port-forward` to test.
   - The secret is created by command, never as a file in git: `kubectl create secret generic rabbit-env --from-env-file=.env.local`.
4. **Egress allowlist** (`networkpolicy.yaml`): default-deny egress, then allow DNS, the Claude API, the devnet RPC and the DB host. NetworkPolicy matches **IPs/CIDRs, not hostnames**, so the PoC resolves them at apply time and notes that this breaks when the IPs change. The production answer is an egress proxy, which is out of scope here. Test: from the pod, `curl https://example.com` fails and a Jay Chat question still works. This is the containment layer from alice `its-not-just-the-sandbox` (#93).
5. **The agent as a scheduled job:** `cronjob.yaml` with a small curl image that calls the Service's `/api/agent/tick` with the scheduler's shared secret, every 5 minutes, `concurrencyPolicy: Forbid`. `kubectl logs job/…` shows each tick. Stretch goal, not required: a CLI entry for one tick (`node scripts/agent-tick.mjs`) so each run is its own Job with its own limits and logs. That is the unit a per-run trace attaches to later (#82, observability).
6. **Place 3, Cloud Run:** compare the digest of the revision that is live now with the PoC digest. If they differ, the PoC image is the one from step 1 (same Dockerfile, newer commit). Do **not** deploy it; the claim is already shown by step 2 running the image Cloud Run would run.
7. **Write up** in §5.4: image size, cold start (k3d pod ready time, Cloud Run's from its logs), and what broke.

### 5.4 Acceptance and risks

- The same digest serves `/` and a Jay Chat answer on Docker and on k3d. No secret in `docker history` or `docker inspect`. A pod cannot reach `example.com`. The CronJob's ticks appear in the logs.
- **Risk:** the CronJob and Cloud Scheduler both tick the same devnet agent → double ticks. Point the cluster's `.env` at a local Anvil fork, or keep the CronJob `suspend: true` except during the test.
- **Risk:** `.env.local` holds real keys and the cluster is local, so delete the cluster when done (`k3d cluster delete`).
- **Out of scope:** Helm, autoscaling, service mesh, a multi-node or cloud cluster (GKE). Next only if this works.

## 6. T6 — RAG: measure Jay Chat, then Wonderland <a id="t6"></a>

### 6.1 What exists today

- Jay Chat's "About me" mode **is already RAG**: `lib/about-me.ts` builds ~83 chunks (profile and projects from `lib/home-content.ts`, PoC and TIL cards, the 11 files in `content/profile/*.md`, ~72 KB), `retrieve(query, k=4)` scores them by **keyword overlap** (with a Korean substring fallback), and `buildAboutMeSystemMessage()` injects the top chunks. The header says the upgrade path: swap `retrieve()` for an embedding search without touching the route or UI.
- Known misses: 2026-08-02 "지금은 어디서 일해요?" matched nothing, because the corpus says "현재", so a core-set fallback was added. Keyword overlap cannot see a paraphrase. That is the gap embeddings close.
- Measured: a question carries a ~4,300-token RAG context (§1.2).
- **Nothing measures retrieval quality.** That is the first thing to build, and the evaluation gap #82 itself names.

### 6.2 The judgment call first

#82's point is that judgment matters more than code: *retrieval rather than … or no model at all.* For Jay Chat the corpus is small (~72 KB of markdown plus cards, roughly 20–30k tokens; measure it in step 1). So compare three options, not one:

| Option | What it is | Cost/latency shape |
|---|---|---|
| **A** (today) | keyword `retrieve()`, top 4 | ~4.3k tokens per question |
| **B** | hybrid: embeddings plus today's keywords, merged by rank (reciprocal rank fusion) | same tokens as A; vectors built once at build time into a JSON (83 vectors, brute-force cosine, no vector DB) |
| **C** | **no retrieval**: the whole corpus in the system prompt with prompt caching (T1 made the chat Claude) | more input tokens per question, but cached reads are billed at a fraction of the input price (check current pricing in the Claude API docs); nothing can be "not retrieved" |

### 6.3 Steps

1. **Eval set:** `docs/tasks/rag-eval.json`, 25 questions in English and Korean. Each has the chunk `source` that must be retrieved, and for 8 of them a fact the answer must contain. Include the known misses (지금은 어디서 일해요?, 학교는 어디 나왔나요?) and paraphrases with no shared keyword. `scripts/rag-eval.mjs` prints recall@4 per option, plus token counts. Also print the corpus's total tokens (`count_tokens`).
2. **Baseline A:** run it and record the numbers in §6.5.
3. **Option C:** build the full-corpus system prompt behind a flag (`JAY_CHAT_RAG=full`) with a cache breakpoint after the corpus; run the 8 answer checks and record tokens, cache hits, cost per question and latency.
4. **Option B** (only if C loses, or the corpus will grow past what C can carry): D4 picks the embedding source; `scripts/build-embeddings.mjs` writes `lib/about-me.vectors.json` at build time; `retrieve()` becomes hybrid with the same signature.
5. **Pick** A, B or C by the numbers (recall and answer checks first, then cost), switch the default, and keep the eval in CI-less form: rerun `rag-eval.mjs` whenever `content/profile` changes.
6. **Then Wonderland** (alice repo, its own task file there when started): the same recipe over ~1,400 items, which is too big for option C, so B. First user: the daily 09:45 item job's "find the related not-done item to merge into", plus the duplicate check before a new card (on 2026-10-29 an unlink card already existed and was found only by luck). Later an "ask Wonderland" box. Index local and git-ignored; **exclude private items** (Min, the morning report, the Stick/Thought tiles).

### 6.4 Acceptance and risks

- An eval script and a table in §6.5 that say which option wins, with numbers, and the default switched to it.
- **Risk, injection:** retrieved text is data, never instructions. Jay Chat's corpus is our own and public, so the risk is low; Wonderland's holds quoted outside articles. The system prompt says so, and the retriever never feeds tool calls. (alice Grammar item on *"the agent's routine ingest reads it into a plaintext store the attacker can read"* is this risk in one sentence.)
- **Risk, privacy:** never index private Wonderland content into anything that leaves the Mac.

### 6.5 Results

*(empty until §6.3 steps 2–3 run)*

## 7. T7 — My AI model: fine-tune an open model on the Mac <a id="t7"></a>

jay, 2026-10-29: *"Add T7: My AI model"*, then *"how can I train or fine tune a existing model with my 128G mac book, compare it to RTX Spark or something"*. The facts below come from two research passes the same day: each claim was checked by a second, skeptical agent against official docs and the installed packages. Prices carry their date.

### 7.1 What "my model" means here, and what it proves

- **Mine = a weights file on jay's disk:** an open-weights base model, plus a LoRA that jay trained on his own data, running on his Mac with no API key. Training a model from scratch is out of scope: it is a learning exercise, not a usable model.
- **Claude cannot be the base.** The Claude API docs say *"The Claude API does not currently offer fine-tuning"* (glossary, checked 2026-10-29). The only public Claude fine-tune we found was Claude 3 Haiku on Bedrock (preview July 2024, GA November 2024). So Claude Sonnet 5.5 plus RAG (today's Jay Chat) is the **yardstick**, not the base.
- **The judgment call from #82 still applies:** *retrieval rather than fine-tuning*. A LoRA teaches voice, format and behaviour well, and facts poorly. So T7 measures both "fine-tune alone" and "fine-tune + T6's retrieval" against Claude + RAG, and accepts that the honest result may be "the fine-tune only wins on cost and privacy".

### 7.2 What exists today (checked 2026-10-29)

| Piece | State | Note for T7 |
|---|---|---|
| Mac | MacBook Pro **M5 Max, 40-core GPU, 128 GB**, 614 GB/s; macOS 26.6.2 | the M5 GPU Neural Accelerators need macOS ≥ 26.2 with MLX, so this machine is fine. By default the GPU can wire only part of the memory (about 75%, ~96 GB, by secondary sources; `iogpu.wired_limit_mb` is 0 = default). `sudo sysctl iogpu.wired_limit_mb=<MB>` raises the cap until the next reboot. Leave 8–16 GB for macOS: too high a value has caused kernel panics (mlx-lm #883) |
| Ollama | **0.40.12** with `llama3.3:70b`, `llama3.1:70b` (×3 quantizations), `qwen2.5-coder:32b`, `nomic-embed-text` | **LoRA adapters were removed in v0.34.1** (`ADAPTER` in a Modelfile now fails: "LoRA adapters are no longer supported"). A fine-tune must be **fused** first, then imported as safetensors: `ollama create -q int4`. The MLX runner registers `qwen3`, `qwen3_5`, `gemma4` and `llama` (Llama 3.x), but not `qwen2`, `mistral` or `gemma3` |
| mlx-lm | **0.29.1 on Xcode Python 3.9, too old**: it has no `qwen3_5` or `gemma4` model files | the current version is 0.32.2 (2026-10-16), which needs Python ≥ 3.11. `uv` and Homebrew Python 3.14 are installed, so make a fresh venv (§7.5 step 1) |
| Data | `content/profile/*.md` (72 KB), `lib/home-content.ts`, PoC and TIL cards: the Jay Chat corpus | all public. T6's eval set (`docs/tasks/rag-eval.json`, planned) is the shared yardstick |
| Rabbit hook | `lib/ai-provider.ts`, OpenAI-compatible path (`AI_API_ENDPOINT`, `AI_API_MODEL`, `AI_API_KEY`) | both `mlx_lm.server` (`/v1/chat/completions`, `--adapter-path`) and Ollama (`http://localhost:11434/v1/`, key ignored) speak this protocol. A local fine-tune should plug into Jay Chat by env alone, once the server starts with thinking off (§7.5 step 3; not tested yet) |
| Already pulled | Llama 3.1/3.3 70B | **not a good base**: Korean is not one of Llama 3.1's officially supported languages, and the licence requires "Built with Llama" plus a `Llama…` name once the model is served or shared |

### 7.3 Which base model (D5)

| Candidate | Licence | Korean | Tooling (mlx-lm → Ollama) | Verdict |
|---|---|---|---|---|
| **Qwen3.5-4B** (base and instruct, Feb 2026) | Apache-2.0 | 201 languages; MMMLU 81.2 for the 9B | `qwen3_5` in mlx-lm and in Ollama's MLX runner | **recommended first**: small enough for fast LoRA runs. It *thinks by default*, so the chat template must pass `enable_thinking: false` |
| Qwen3.5-9B | Apache-2.0 | same | same | the step up if 4B is too weak |
| Gemma 4 E4B (Apr 2026) | Apache-2.0, though whether Google's Prohibited Use Policy still binds it is unsettled | 140+ pre-training languages; Korean not named | `gemma4` in both | A/B challenger |
| Kanana-2-3B-instruct (Kakao, 2026-07-27) | Kanana licence: running your own service is allowed; sharing the model needs "Powered by Kanana" and a `Kanana…` name | Korean specialist (Kakao's own numbers beat Qwen3.5-2B on KoMT-Bench and KoSimpleQA) | plain `Qwen3ForCausalLM`, so it should load as `qwen3` (not run) | optional third, if Korean is the weak spot |
| ~~EXAONE 4.x~~ | **non-commercial, research and education only** | strong | — | ruled out: a chat on jay's site is neither |
| ~~Llama 3.x~~ | custom (Built with Llama, name prefix) | not officially supported | — | ruled out |

### 7.4 The MacBook vs DGX Spark (and "RTX Spark") <a id="t7-hw"></a>

There are **two NVIDIA products** with that name. **DGX Spark** is the Linux box with the GB10 chip and 128 GB; ASUS GX10, Acer GN100 and others use the same chip. **RTX Spark** is a separate Windows-on-Arm PC platform (the N1X chip, up to 128 GB) that went on sale on 2026-10-16.

| | **jay's M5 Max 128 GB** | **DGX Spark** (GB10) | **RTX Spark** (Windows) | RTX 5090 desktop | Rented H100 80 GB |
|---|---|---|---|---|---|
| Memory | 128 GB unified (GPU cap ~75% by default) | 128 GB unified (64 GB model since 2026-10-23) | up to 128 GB; one unit showed 110 GB usable by the GPU | 32 GB | 80 GB |
| Bandwidth: drives **inference** speed | **614 GB/s** | 273 GB/s | ~300 GB/s | 1,792 GB/s | HBM |
| Compute: drives **training** speed | no TFLOPS published; Apple claims >4× M4 Max AI compute | measured BF16 ~60–100 TFLOPS, dense FP4 ~500 | "1 PFLOP AI" (precision not stated) | very high | datacenter |
| Training software | **mlx-lm** (LoRA, auto-QLoRA, DoRA, full); Unsloth Core on Mac is "in the works" | CUDA + PyTorch, **official Unsloth**, TRL/PEFT, NeMo | CUDA 13.4 for Windows on Arm (2026-09-09), unproven; no Linux | full CUDA | full CUDA |
| Measured LoRA, 7–8B | **none for M4/M5 yet**; old: ~250 tok/s on an M1 Max (Mistral 7B), ~475 on an M2 Ultra; community: Qwen3.5-4B QLoRA ~115 tok/s on an M1 64 GB | **6,970 tok/s**, Llama 3.1 8B LoRA (NVIDIA's table; the same article's prose gives other numbers) | none published | no reliable number | fastest |
| Big jobs | 70B QLoRA fits in memory; unmeasured, slow | 70B QLoRA 760 tok/s; gpt-oss-120b QLoRA in ~68 GB | in theory like Spark | NVIDIA: its Spark runs do not fit in 32 GB | rent bigger |
| Single-user decode afterwards | **fast** (bandwidth) | slow: 20.5 tok/s for an 8B at FP8, batch 1 (LMSYS) | likely like Spark | very fast | very fast |
| Price (date) | **already owned** | $3,999 (2025-10) → $4,699 (2026-02) → **$6,950** (2026-10-02) | Surface Dev Box 128 GB $5,999 (2026-10-07) | $1,999 MSRP; ~$3.7–4.3k street (2026-08) | $3.29–4.29/GPU-h (Lambda, 2026-10-29) |

**For T7, the Mac is enough.** The dataset is ~1,000 Q&A pairs from a 72 KB corpus, about 0.3M tokens per epoch. At an assumed 300–1,000 tok/s, a 4B LoRA takes about 5–20 minutes per epoch, and an 8B about twice that. These are *derived estimates*, because nobody has published an M5 Max LoRA number; step 4 measures the real one. A Spark would do the same job in minutes, which saves little on a job this size. Spark's real advantage is CUDA (Unsloth and NVIDIA's playbooks) and big compute-bound jobs (70B QLoRA, full fine-tunes, RL). It decodes more slowly than the Mac. **If T7 ever outgrows the Mac, rent an H100 for an hour (under $5) before buying a $7k box.** RTX Spark is too new for training: CUDA on Windows-on-Arm is weeks old and has no benchmarks. Laptop caveat: LMSYS saw thermal drop-off on Macs under sustained load, so train plugged in with the lid open, and watch `Peak mem` and tok/s in the log.

### 7.5 Steps (branch `claude/my-model`)

1. **Toolchain:** `uv venv ~/.venvs/mlx --python 3.12 && uv pip install -p ~/.venvs/mlx "mlx-lm[train]"`, then **`source ~/.venvs/mlx/bin/activate`**. Every later `mlx_lm.*` command runs in that shell. Without it, the bare commands resolve to the old 0.29.1 in `~/Library/Python/3.9/bin`, which is on `PATH`: `--help` would pass while running the wrong version. Python 3.12 is chosen because uv already has a managed 3.12 installed; mlx also ships 3.14 wheels. Check that `which mlx_lm.lora` points under `~/.venvs/mlx`, that `python -c 'import mlx_lm; print(mlx_lm.__version__)'` prints 0.32.x, and that `mlx_lm.generate --model Qwen/Qwen3.5-4B` answers. Use the dotted commands: `python -m mlx_lm.lora` is deprecated.
2. **Dataset** (`ml/t7/`; the scripts are committed, the generated data is git-ignored):
   - `scripts/t7-build-dataset.mjs` asks Claude to write Korean and English Q&A pairs grounded in each corpus chunk, about 1,000 in total. Each pair cites its chunk's `source`.
   - jay reviews a sample of 30.
   - The script writes `train/valid/test.jsonl` in mlx-lm's **chat format** (`{"messages": [...]}`), with plain answers and no thinking block, so training and serving use the same no-thinking template.
   - **T6's eval questions are never in train**: the script checks for overlap.
   - Only the public corpus goes in: nothing from Wonderland, no private items, no `.env`.
3. **Baseline:** `mlx_lm.server --model Qwen/Qwen3.5-4B --chat-template-args '{"enable_thinking": false}'` (check the flag in `mlx_lm.server --help`). Without it, Qwen3.5 thinks and spends Jay Chat's 1,500-token `max_tokens` on thinking: `lib/jay-chat.ts` sends no `chat_template_kwargs`. Then run Jay Chat locally with `AI_PROVIDER=openai AI_API_ENDPOINT=http://localhost:8080/v1/chat/completions AI_API_MODEL=…` and run T6's eval script. That gives the base model's numbers with and without retrieval.
4. **Train:** `mlx_lm.lora --model Qwen/Qwen3.5-4B --train --data ml/t7/data --mask-prompt --batch-size 4 --iters 600 --adapter-path ml/t7/adapters`. `--mask-prompt` computes the loss on answers only. If memory is short, use a 4-bit base (which turns this into QLoRA), `--grad-checkpoint` or a smaller `--num-layers`. Record tok/s, peak memory, wall time and the validation-loss curve in §7.7: **this is the first real M5 Max LoRA number**.
5. **Evaluate:** restart the server with `--adapter-path ml/t7/adapters` (keeping `--chat-template-args`) and rerun the eval. The four rows are **Claude + RAG**, **base + RAG**, **fine-tune**, and **fine-tune + RAG**. For each, record recall, the 8 answer checks, latency, and cost per question.
6. **Package:**
   - `mlx_lm.fuse --model Qwen/Qwen3.5-4B --adapter-path ml/t7/adapters --save-path ml/t7/fused --dequantize`.
   - Then a Modelfile `FROM ./ml/t7/fused` + `SYSTEM …` → `ollama create jay-model -q int4` → `ollama run --think=false jay-model`. Through `/v1`, check that the answer carries no thinking; if it does, set thinking off in the Modelfile's template.
   - Do not use `--export-gguf`: it supports only Llama and Mistral models at fp16. If a GGUF is ever needed, use llama.cpp's `convert_hf_to_gguf.py` + `llama-quantize`.
7. **Model card** `ml/t7/MODEL_CARD.md`: base and its licence, the data and how it was made, the training settings, the eval table, and the known failure modes.
8. **(Only if D6 says so) put it in front of visitors.** See §7.6.

### 7.6 Serving it publicly (D6), only after step 5 shows it is worth it

| Option | Cost shape | Catch |
|---|---|---|
| **Stay local** (recommended) | $0 | visitors cannot use it. Show the eval table and a recorded demo instead |
| Cloud Run with an L4 GPU (24 GB) | ~$0.67/h for the GPU, **~$1.05/h** for 4 vCPU/16 GiB + L4 (us-central1, non-zonal, 2026-10-29); scales to zero; billed from container start to stop in 100 ms steps, at least 1 minute per start. Zonal redundancy is on by default (~$1.42/h), so deploy with it off | no GPU region in Seoul or Tokyo; the nearest is Singapore. Cold start = instance (~5 s) + model load; needs a startup probe |
| A tunnel to the Mac (Cloudflare Tunnel or Tailscale Funnel) | $0 | the chat goes down when the Mac sleeps. **Never expose port 11434 raw**: tens of thousands of unauthenticated Ollama servers have been found exposed (LeakIX, 2026-02: 12,269), and attackers have sold access to hijacked LLM endpoints (Pillar Security, "Operation Bizarre Bazaar"). Put a secret in front (a Next.js proxy, or Cloudflare Access service tokens). `cloudflared` is not installed yet |
| Together or Fireworks | fine-tune ~$0.34–0.50 per 1M training tokens (≤16B) | **serverless LoRA is gone at both**; a LoRA runs only on a dedicated endpoint billed per GPU-hour (H100 ~$5.49–8/h) |

### 7.7 Acceptance, risks, results

- **Done when:** `ollama run jay-model` answers offline; §7.7 has the four-row eval table, plus the measured M5 Max training numbers; there is a model card; and the T7 decision is written down (keep it local, serve it, or drop it).
- **Risk: confident wrong facts.** A fine-tune makes up résumé details more fluently than a base model. Keep retrieval in the loop, and make the 8 answer checks include facts the model must *not* invent.
- **Risk: eval leakage.** If eval questions end up in train, the scores are inflated. Step 2's overlap check is the guard.
- **Risk: licence on distribution.** Apache-2.0 for Qwen3.5 asks only for the notice. Kanana, Llama and Gemma add naming or policy duties once the model is shared or served. Keep the base's licence file next to the fused weights.
- **Risk: the toolchain moves fast.** Ollama dropped adapters six weeks ago, mlx-lm shipped 0.32.0–0.32.2 within two weeks (2026-10-01 to 10-16), and the installed 0.29.1 is already three minor versions behind. Pin the versions in the model card.
- **Out of scope:** pre-training, RL/DPO (a stretch after SFT), the 70B models, buying hardware.

**Results:** *(empty until §7.5 steps 3–5 run)*

---

## Earlier plan (archived 2026-10-28) <a id="archive"></a>

*Everything below is the previous content of this file, unchanged except that its title became
the bold line below and every other heading moved down one level. It covers the Chains menu brief (shipped) and the 2026-09-23 status board. Some
of its "decisions waiting on jay" were settled later; read it as history, not as current state.*

**Rabbit portal — "Chains" menu: one page for the three Jayverse networks (task brief)** — the file's title until 2026-10-28.

### Current status <a id="status"></a>

*Last updated 2026-09-23 (KST). Read this first — it is the state of every thread currently
open, across repos. The sections below are the Chains brief, which is only one of them.*

**Today, in one line:** the Unity street went live at
[hole.jaylabs.xyz](https://hole.jaylabs.xyz), and every repo but alice is committed and pushed.

| Thread | State | Next move, and whose |
|---|---|---|
| **Docs move** — `features/`, `tasks/`, `history/` back from alice | **Done.** Pushed both repos; alice's cards verified live | [§8](#docsmove) — jay: the `CLAUDE.md` path, below |
| **Chains menu** (this brief) | **Shipped.** `www.jaylabs.xyz/chains` returns 200; the work is on `main` (`3150f9c`, `e558625`) | §0's "nothing committed" is stale — see the note under it |
| **Verex tradable** ← *the actual goal* | **Blocked.** Devnet is healthy, but Verex's DB has no markets | **[D1](#decide)** |
| **Jayverse devnet** | **Stable.** `e2-standard-2`, 6000 MiB cap, healthy, block 11,710,497 on fork 11,701,069 | **[D3](#decide)** |
| **JYVE exchange** | **Fixed and deployed** — `swapJusdForJyve` → `swapUsdcForJyve`, revision `00003-98l` | none |
| **Rabbit Hole** (Unity WebGL) | **Live.** [hole.jaylabs.xyz](https://hole.jaylabs.xyz) 200, cert issued in ~1 min. Verified in headless Chrome: playback to tick 22/22, **0 console errors**. Repo `linked0/rabbit-hole` has its first real commit; portal card is the ninth | **D2 closed** |
| **Repo hygiene** | **Done 2026-09-23.** `jayverse-defi`, `jayverse-game`, `jayverse-token`, `jayverse-devnet` committed, merged to `main`, pushed. alice untouched per jay | `nostra-server` — see below |

#### Decisions waiting on jay <a id="decide"></a>

Each of these is a fork in the road that an agent should not pick for jay. Recommendation given,
because "your call" with no opinion is not help.

| # | Decision | Options | Recommended | If left undecided |
|---|---|---|---|---|
| **D1** | **How to seed Verex** — the goal, *"make the verex tradable"* | **(a)** jay runs the ready command himself, holding the secrets · **(b)** a Cloud Run job from the verex-api image with the same `secretKeyRef` entries — GCP injects the secrets, this session never sees them | **(b)** — repeatable, auditable, and nothing is pasted into a terminal. Cost is one job execution, cents | Verex stays untradable. Nothing else unblocks it |
| ~~**D2**~~ **CLOSED 2026-09-23** | **Where the Unity build is hosted.** Chosen: (a), Firebase Hosting, and it is live. Rewritten 2026-09-23: the old framing ("how the bundle reaches the rabbit image") died when another session shipped the three.js game to **Firebase Hosting** and made that the house pattern — `game.jaylabs.xyz` → `jayverse-game.web.app`, beside `defi.` and `verex.` | **(a)** Firebase Hosting at `hole.jaylabs.xyz`, following the pattern · **(b)** commit `Build/WebGL/` into rabbit and serve from the existing Cloud Run service | **(a)** — it is a static export, which is exactly what the other three do. It also means the 5.8 MB bundle never enters a repo: `/Build/` stays gitignored and the deploy reads the local build. Needs a DNS record jay must add; `burrow.jaylabs.xyz` never had one, which is why that chip was dead for a week | Nothing serves the Unity build. Note it is **not** blocking a chip any more — the Game chip moved to `game.jaylabs.xyz` and works |
| **D3** | **Whether to move anvil onto the durable disk** (`DEVNET_DATA=/data`, via **instance metadata**, not a file edit) | **(a)** do it in a maintenance window · **(b)** leave it | **(b) for now.** The next boot would load the 829 MB `/data/anvil.json` — a *different* chain — and may OOM. The devnet is stable today; do not trade that for durability without a window | Anvil keeps running off a Docker named volume. Survives restarts, would not survive the VM being recreated |

**D2a, settled 2026-09-23:** jay — *"game and hole are for different purposes."* The two coexist;
the Unity build does **not** replace the three.js game. So `hole.jaylabs.xyz` is a home, not a
waypoint, and the portal needs a **ninth** ecosystem card rather than a repointed `game` one.

**Naming, settled 2026-09-23:** jay chose `hole.jaylabs.xyz` over `burrow.jaylabs.xyz`, so the
repo and the site finally share a word. The concerns raised against `hole` — it carries none of
the "rabbit hole" idiom on its own — jay has parked rather than rejected. **"Burrow" as a product
name now has nothing pointing at it**; the docs still say Burrow in prose and this file is still
called `jayverse-burrow.md`. Renaming those to Rabbit Hole is a one-word go from jay.

**Not decisions, just jay's to do** — in order:

1. **`~/.claude/CLAUDE.md` still names `~/work/alice/docs/history/`** as the central history
   folder. It is `~/work/rabbit/docs/history/` now. Every fresh session will misfile the day's
   log until that line changes — the only item here that quietly corrupts *future* work, so it
   goes first. Same fix in `feedback_per_project_history_files.md` and
   `feedback_rabbit_work_folder.md`.
2. **`nostra-server` cannot be pushed** — its remote `AimondLabs/nostra-server` returns
   "Repository not found". Two commits (a docs/images consolidation) sit unpushed on `main`.
   Either the repo moved, was deleted, or this account lost access; nothing local is lost.
3. **Install `node` on the devnet VM**, then re-enable `jayverse-devnet-reseed.timer`. It is
   `systemctl disable`d today because the VM has no node runtime, so the reseed check cannot run.

**Minor, whenever** — an "Alice — Docs" card to replace the entry point alice lost; a custom
domain for rabbit's docs (they are only on `linked0.github.io/rabbit`); the four dangling
`../topics/…` links inside the moved folders; and the **Rabbit — Current Plan** card, below.

**Cost note** (standing instruction): the devnet VM is the one line that moved. `e2-small` →
`e2-standard-2` takes it from roughly $20 to **$50–70/mo**, against a ~$120 estate. Nothing else
in this list changes the bill; D1 and D2 are cents.

#### Known-stale elsewhere

- `../features/jayverse-devnet.md` and `../features/cloud-ops.md` still describe the devnet as
  "planned, not deployed" / "no VMs — Compute Engine API not enabled". Both stopped being true
  on 2026-09-14. The cost column in `../features/README.md` says `$0 / not deployed` for that
  row; it is an `e2-standard-2` now, roughly $50–70/mo against a ~$120 estate.
- The **Rabbit — Current Plan** card points at the `tasks/` folder index, not at this file. That
  was deliberate on 2026-09-03 (pinning one filename goes stale when the next task starts
  elsewhere); jay raised reversing it on 2026-09-22 and then set it aside.


> **Written for:** the agent that will implement this in `~/work/rabbit`. jay decided on
> 2026-09-16 that Jayverse runs on **three networks** — the local Anvil fork, the hosted Jayverse
> devnet, and public Sepolia — and that the portal's **Devnet** top menu becomes **Chains**, one
> page that shows all three. This file is the brief and the resumable state for that work.
>
> **What was here before:** the J2 cross-repo plan (Rabbit ⇄ Verex mandated trader). It is
> preserved verbatim in [09-16-plan.md](09-16-plan.md)
> and is not superseded by this brief — only displaced from this filename.

### 0. Summary <a id="s0"></a>

- **Status:** *(stale — this shipped; see [Current status](#status) above)* §3.1–§3.5 built
  and verified locally; **nothing committed** (jay reviews first).
  All of §5's acceptance criteria pass except the deploy-time ones, which need jay's go-ahead.
  [§6](#open) now carries ten open questions — the brief's four plus six found while
  building — each with the default I took and what is still yours to decide.
- **Repo / branch:** `~/work/rabbit`, branch `claude/chains-menu` off `main` (e4ca135). Do not
  commit to `main`; commit only when jay asks.
- **Docs move, 2026-09-22:** this file, and the `features/`·`history/` folders it links to,
  moved from alice back to rabbit. [§8](#docsmove) records what changed and
  [what is still jay's to do](#docsmove-next) — item 1 there (the stale history path in
  `~/.claude/CLAUDE.md`) affects every future session, not just this task.
- **Next step:** jay reviews the working tree. Then: commit, deploy (the deploy carries
  `ALLOW_CHAINS=true` automatically — `deploy.sh` forwards every `ALLOW_*`), confirm the menu in
  the cloud, and only then drop `ALLOW_DEVNET` from `.env`.
- **What was built** — blow-by-blow in
  [`../history/2026-09-16-rabbit-history.md`](../history/2026-09-16-rabbit-history.md):
  new `lib/chains.ts` (three chain definitions, parameterised `readChain()`, capability matrix,
  Sepolia rails); `lib/devnet.ts` reduced to the devnet-only half plus a per-service
  `chains: ChainKey[]`; `app/devnet/` → `app/chains/` rebuilt around `CHAINS`; menu item,
  `ALLOW_CHAINS`, `PUBLIC_PATHS`, permanent `/devnet` → `/chains` redirect, home card renamed.
- **Deviation from §3.3 worth knowing:** tabs were built and dropped. jay compared both and chose
  the stacked layout — a tab shortens the page but hides two thirds of the comparison.
- **Deviation from §2 worth knowing:** the rails chain definitions are **copied, not imported**.
  rabbit deploys with `--source .`, so a `file:../jayverse-rails` dependency would resolve locally
  and fail in Cloud Build. `lib/chains.ts` says so in its header and names rails as canonical.
- **Design sources:** [`../features/jayverse-devnet.md`](../features/jayverse-devnet.md) §2.4
  ("how services attach") and §4 ("what the web app shows");
  [`2026-09-14-devnet-rollout.md`](2026-09-14-devnet-rollout.md) for the devnet's URLs and
  policies; the rails chain definitions in `~/work/jayverse-rails/src/chains.ts`.
- **History:** decisions behind this brief are in
  [`../history/2026-09-16.md`](../history/2026-09-16.md) (alice); the build itself is logged in
  [`../history/2026-09-16-rabbit-history.md`](../history/2026-09-16-rabbit-history.md).

### 1. The decision and why <a id="why"></a>

jay's words: *"We use three networks — Anvil, devnet, Sepolia. Change the name of the Devnet top
menu to Chains and make it show all the information for the three chains."*

Each network has a distinct job, and the page should say so rather than pretend they are
interchangeable:

| Chain | Job | Chain id | Who points at it |
|---|---|---|---|
| **Local Anvil** | the inner loop — instant reset, snapshots, offline, break it freely | `31337` by design (see §6 — the running instance currently reports `11155111`) | the developer's own machine, and any device on jay's Tailscale tailnet |
| **Jayverse devnet** | shared state the cloud services and demos target; always on; seeded with every Jayverse contract | `313370` | Rabbit, Verex, Wallet, Exchange, DeFi, Game, Number, Auditor in the cloud |
| **Sepolia** | secondary: oracle-dependent tests (live Chainlink), MetaMask ERC-7715 popup demos, anything that needs a public chain | `11155111` | Verex resolution tests, `/live/agent/console` in the cloud, wallet demos |

Two consequences the page must reflect:

- **Alchemy only sees Sepolia.** Its data APIs, webhooks, bundler, and gas manager index chains
  Alchemy runs. They cannot see `31337` or `313370`. On those two chains the same capability is
  self-hosted (Anvil RPC + `/ws`, Otterscan `ots_*`, the seed's Registry). The Chains page shows,
  per capability, which implementation each chain uses — never an Alchemy example labelled as
  the devnet. Background: Tech Notes #55 ("An app key is a budget") and #56 (capability matrix).
- **Two Alchemy keys stay.** Local fork upstream and devnet fork upstream use separate Alchemy
  apps (jay, 2026-09-16: keep as is). The page may name the app *role*, never the key.

### 2. What exists today (read before building) <a id="exists"></a>

All paths relative to `~/work/rabbit`.

- **Menu:** `app/Nav.tsx` — `{ href: "/devnet", ko: "데브넷", en: "Devnet", code: "DEVNET", pub: true }`,
  gated by `ALLOW_DEVNET=true` (present in `.env`; `deploy.sh` forwards every `ALLOW_*` to Cloud
  Run). Menu visibility rule: `menuVisible()` in the same file — env flag first, then `pub`.
- **Route:** `app/devnet/page.tsx` (server component, `force-dynamic`, Grafana-style stat row +
  panels: recent blocks, endpoints, services on this chain, ecosystem contracts from the on-chain
  Registry) and `app/devnet/AutoRefresh.tsx` (5 s `router.refresh()`, pauses when tab hidden).
- **Data layer:** `lib/devnet.ts` — `DEVNET_URL`/`DEVNET_RPC`/`DEVNET_EXPLORER`/`DEVNET_CHAIN_ID`,
  `fetchStatus()` (devnet `/status` JSON: `chainId, healthy, mode, forkBlock, blockNumber,
  latestBlockTime, proxyUptimeSeconds, faucet{…}, registry{…}`), `fetchRegistry()` (reads the
  Registry **contract**, not the JSON copy — keep that principle), `fetchRecentBlocks()`,
  `probe()`, `CONTRACT_GROUPS`, `SERVICES`.
- **Middleware:** `middleware.ts` `PUBLIC_PATHS` contains `"/devnet"` (read-only page, no keys).
- **Home card:** `lib/jayverse.ts` has a `key: "devnet"` ecosystem card linking to `/devnet`.
- **Env:** `.env.example` §"Jayverse 데브넷" — `NEXT_PUBLIC_DEVNET_RPC`, `NEXT_PUBLIC_DEVNET_EXPLORER`,
  `NEXT_PUBLIC_DEVNET_JUSD` (defaults are the production values); `ANVIL_RPC_URL`
  (default `http://127.0.0.1:8545`); `SEPOLIA_RPC` (server-side, currently used by the C2
  bundle demo); `CLOUD_AGENT_RPC_URL` for the cloud console.
- **Rails:** `~/work/jayverse-rails/src/chains.ts` already exports all three — `jayverseDevnet`
  (313370, `https://devnet.jaylabs.xyz/rpc`, `wss://…/ws`, Otterscan), `localFork` (31337), and
  viem's `sepolia` — plus `chains = { jayverseDevnet, sepolia, localFork }`. Import these; do not
  redefine chains in rabbit.
- **Devnet edge:** `~/work/jayverse-devnet/proxy/src/server.js` serves `/status` (shape above),
  `/rpc` with the method allowlist, `/ws`, `/faucet`, `/admin/*`. Otterscan is its own host,
  `https://explorer.devnet.jaylabs.xyz`.
- **Local Anvil right now** (do **not** kill it; it holds jay's working state):
  `anvil --chain-id 11155111 --state ./anvil-sepolia-state.json --state-interval 60`, listening on
  `127.0.0.1:8545` only. See §4 and §6.

### 3. What to build <a id="build"></a>

Order matters; each step is shippable on its own.

#### 3.1 Rename the menu and route, keep the old URL
- `app/Nav.tsx`: the item becomes `{ href: "/chains", ko: "체인", en: "Chains", code: "CHAINS", pub: true }`.
  Because the menu is env-gated, **`ALLOW_CHAINS=true` must be added to `.env` in the same
  change**, and the Cloud Run env must receive it on deploy (`deploy.sh` forwards `ALLOW_*`).
  Leave `ALLOW_DEVNET` in place until the deploy is confirmed, then it can go. Write the reason
  in the comment block the way the existing entries do — the file's comments are its changelog.
- Move `app/devnet/` → `app/chains/`. Add `/devnet` → `/chains` to the existing `redirects()` in
  `next.config.*` (it already has a redirects block) so bookmarked links keep working. Add `"/chains"` to
  `PUBLIC_PATHS`; keep `"/devnet"` there too while the redirect exists.
- `lib/jayverse.ts`: the ecosystem card's `url` → `/chains`; retitle to "Jayverse Chains" or keep
  "Jayverse Devnet" as the *devnet's* card and add nothing — jay's call; default to renaming the
  card since the page now covers three chains.
- Page `metadata.title` → "Chains — Jayverse".

#### 3.2 A chain model instead of devnet constants
- New `lib/chains.ts` (or extend `lib/devnet.ts` and rename) exporting a `CHAINS` array with one
  entry per network: `key` (`local` | `devnet` | `sepolia`), display names ko/en, `chainId`,
  `rpc` (server-side URL), `ws?`, `explorer?` (Otterscan / Etherscan Sepolia), `role` (one-line
  purpose from §1), `blockTime` (1 s / 1 s / 12 s), `statusUrl?` (devnet only),
  `faucet?` (devnet: `/faucet`; Sepolia: link to a public faucet; local: "anvil accounts are
  prefunded"), and a `capabilities` map (see 3.4).
- RPC URLs come from env with the existing defaults: `ANVIL_RPC_URL`, `DEVNET_URL`/`…_RPC`,
  `SEPOLIA_RPC`. The local RPC is read **server-side only** and will normally be unreachable from
  Cloud Run — that is expected, not an error (3.3).
- Reuse `fetchRecentBlocks`/`probe` by parameterizing them on a viem client per chain. Registry
  reads apply to the devnet only, unless the local fork has been seeded (detect: Registry address
  known and has code).

#### 3.3 The page: three columns of the same facts
- **Stat row per chain** (one card each, same layout so the eye can compare): status
  (healthy / unreachable), chain id, latest block, block time, and one chain-specific line:
  devnet → fork block + edge uptime + faucet left (from `/status`); Sepolia → finalized block or
  "public testnet"; local → "not reachable from here" when the probe fails from the cloud.
- **Recent blocks**: keep the devnet panel as is. For Sepolia, last 8 blocks via the RPC. For
  local, only when reachable. Ages measured against each chain's own head, as the devnet page
  already does (Anvil's clock runs behind real time; the comment in `page.tsx` explains).
- **Endpoints** table, one row per chain: RPC, WS, explorer, status page, faucet. For the local
  chain print **both** `http://127.0.0.1:8545` and the Tailscale form `http://100.111.162.0:8545`
  (jay's machine's tailnet IP) with the note from §4.
- **Services on this chain**: the existing devnet table, plus a column or badge per service
  saying which chain(s) it targets today (devnet primary; Sepolia for the cloud console and
  oracle tests; local for development). Source of truth for that mapping is the rollout task
  and each repo's env; do not guess — read the deployed env or ask.
- **Ecosystem contracts**: Registry-backed for the devnet (unchanged). For Sepolia, a short static
  list of the base rails the fork inherits (EntryPoint, Chainlink feeds used by `feeds.ts`, the
  MetaMask delegation framework) with Etherscan links. For local: "same as devnet after seed".
- Keep `AutoRefresh` at 5 s; probing three chains is still cheap, but **skip the local RPC on the
  server when `process.env.K_SERVICE` is set** (Cloud Run) to avoid a 2 s timeout per refresh.

#### 3.4 Capability matrix panel (the Alchemy point, made visible)
One table, capabilities as rows, chains as columns — this is what makes "Chains" more than three
copies of the devnet page:

| Capability | Local Anvil | Devnet | Sepolia |
|---|---|---|---|
| RPC | Anvil direct | Anvil via rpc-proxy | Alchemy Node API |
| New heads / logs | `eth_subscribe` on Anvil ws | `/ws` | Alchemy Websockets |
| History / transfers | `ots_*` if Otterscan is run locally, else none | Otterscan `ots_*` | Alchemy Transfers / Receipts |
| Token balances | direct reads | direct reads + Registry | Alchemy Token API or direct |
| Push on activity | — | poll `/ws` / watchtower | Alchemy Webhooks |
| 4337 bundler | — (not yet) | — (self-hosted Rundler/Alto: planned) | Alchemy Bundler |
| Sponsored gas | — | own paymaster (planned) | Alchemy Gas Manager |
| Simulation | `eth_call`, `debug_traceCall` | same | userOp Simulation / Trace |
| Oracles | frozen at fork block | frozen at fork block | live Chainlink |
| MetaMask 7715 popup | no (chain not in MetaMask's list) | no | yes |

Render the "—" and "planned" cells honestly; a planned row is a link to the devnet doc's phase
table, not a green dot.

#### 3.5 Docs and history
- Update `docs/features/README.md` in alice only if the service table mentions the `/devnet` URL.
- Append a Cause → Reasoning → Change → Result block to
  `~/work/alice/docs/history/2026-09-16-rabbit-history.md` (create the file if absent; cite this
  brief at the top).
- Keep this file's §0 current as steps land (branch, what is merged, what is next).

### 4. Reaching the local Anvil from other devices (Tailscale) <a id="tailscale"></a>

Yes — with one change. jay's machine is on the tailnet at `100.111.162.0` (gitboard is already
served that way on :4321). Anvil, however, **binds to `127.0.0.1` by default**, so today
`http://100.111.162.0:8545` refuses connections from the phone or the home desktop.

- Restart Anvil with `--host 0.0.0.0` (the state file keeps everything; only the listener changes):
  ```bash
  anvil --host 0.0.0.0 --chain-id 31337 --state ./anvil-sepolia-state.json --state-interval 60
  ```
  Do this **only when jay asks** — the current instance is his working chain. Chain id: see §6.
- Tailscale is the only exposure. Do **not** open 8545 on the LAN router or use a public tunnel;
  Anvil has no auth, and `anvil_setBalance` etc. are open to anyone who can reach the port. On
  the tailnet that is jay's own devices, which is acceptable for a throwaway chain.
- For MetaMask on the phone: add a custom network with RPC `http://100.111.162.0:8545`, chain id
  matching the node. `http` (not `https`) is accepted by MetaMask mobile for custom RPCs.
- Alternative without changing Anvil's bind: `tailscale serve --bg 8545` on the Mac proxies the
  tailnet to localhost with TLS (`https://<machine>.<tailnet>.ts.net`). Mention both on the page;
  recommend `--host 0.0.0.0` for simplicity.

### 5. Acceptance <a id="accept"></a>

- Menu reads **Chains** (ko: 체인) at the same position; `/devnet` redirects to `/chains`; both
  public without login.
- `/chains` shows three chain cards with live status for devnet and Sepolia, and "not reachable
  from here" for local when rendered in the cloud; locally with Anvil up, all three are live.
- Endpoints table lists the Tailscale RPC form for local.
- Capability matrix rendered with honest "—/planned" cells.
- `pnpm build` passes (rabbit has no test script); no new `.env` value is required for the page
  to render other than `ALLOW_CHAINS=true`.
- History entry written; this file's §0 updated; nothing committed to `main`.

### 6. Open questions for jay <a id="open"></a>

> **How to read this (2026-09-16):** every item has a working default in the code, so the page
> ships either way. None of them is *decided* — a default is what I did so the work could
> finish, not an answer. 1–4 were in the brief; 5–10 came out of building it.

#### Answered with a default, still yours to decide

1. **Local chain id — displayed, not fixed.** Confirmed live: the node reports `11155111`
   (Sepolia's id) because it was started as a Sepolia fork with the default id. The design
   (rails `chains.ts`, wallet, delegation code) expects the local fork at `31337`. Keeping
   `11155111` means MetaMask treats the local fork as Sepolia, and EIP-155 scopes replay
   protection to the chain id — so a tx signed on the fork is valid on real Sepolia.
   **Default taken:** the card shows the *reported* id in the error colour and prints the
   `--chain-id 31337` fix; the node was **not** restarted (§7 forbids it without your say-so).
   **Recommendation:** restart with `--chain-id 31337` when convenient. The state file is
   unaffected.

2. **Ecosystem card title — renamed.** **Default taken:** "Jayverse Devnet" → "Jayverse Chains"
   in `lib/jayverse.ts`, per §3.1's stated default, since the card now leads to a page covering
   three networks. Say so if you would rather keep a devnet-only card.

3. **Sepolia RPC in the cloud — public fallback.** `SEPOLIA_RPC` is a server-side secret that
   `deploy.sh` binds to `ANVIL_RPC_URL` only when `CHAIN=sepolia`, so in production it is unset
   and the Sepolia column would have rendered blank (which reads as "Sepolia is down").
   **Default taken:** fall back to `https://ethereum-sepolia-rpc.publicnode.com` — the same
   public node `app/live/7702` already uses. These are head-block reads with no key.
   **Still open:** forward the real `SEPOLIA_RPC` to Cloud Run instead? It would be one more
   secret binding in `deploy.sh` for a marginally more reliable read.

4. **The local column in the cloud build — kept.** **Default taken:** the card stays and reads
   "not reachable from here", and `readChain()` skips the RPC entirely when `K_SERVICE` is set,
   so it costs nothing. The three-column layout is the point of the page; dropping a column in
   production would make the cloud page a different page. Say so if you would rather hide it.

#### New — found while building

5. **rails is copied, not imported, and nothing enforces the copy.** §2 said "import these; do
   not redefine chains in rabbit". rabbit cannot: `scripts/deploy.sh` uses
   `gcloud run deploy --source .`, which uploads only the rabbit directory, so a
   `file:../jayverse-rails` dependency resolves on your laptop and **fails in Cloud Build** — at
   deploy time, the worst place to find out. **Default taken:** ids and URLs copied verbatim
   into `lib/chains.ts`, under a header naming rails as canonical and saying the two must be
   kept in step by hand. **Decision needed:** publish `jayverse-rails` to a registry (npm, or a
   private Artifact Registry) so every repo imports one definition — worth doing the moment a
   third repo needs the chain list, and not obviously worth it before then.

6. **`ANVIL_RPC_URL` means different things locally and in the cloud.** Found and fixed here,
   but the trap is still live for the next reader. `deploy.sh` binds it to the
   `rabbit-devnet-rpc` secret (`CHAIN=devnet`), so in the deployed service it holds the
   **devnet's** URL — "the chain this deployment talks to", as deploy.sh's own comment says.
   Reading it unguarded printed the devnet's URL in the *Local Anvil* endpoints row in
   production, labelled as the local node. **Fixed:** `lib/chains.ts` ignores the env entirely
   when `K_SERVICE` is set. **Decision needed:** rename the variable to something that means
   what it holds (`CHAIN_RPC_URL`?) across rabbit, `deploy.sh` and the secret bindings — a small
   change that touches the deploy path, so it wants your go-ahead rather than mine.

7. **Tabs are the lever if the page ever feels slow.** A tabbed version was built and dropped
   (you compared both and chose the stacked layout). Worth recording *why* it might come back:
   in that version the tab was the **fetch boundary**, not just a view — only the selected chain
   was read, so the 5 s refresh cost roughly a third as much. The stacked page reads all three
   every refresh. Today that is cheap (two 1 s chains on our own infrastructure, Sepolia cached
   for 12 s). If it stops being cheap, the tab version is the fix, and it is a known-good design
   rather than a new idea.

8. **When does `ALLOW_DEVNET` go?** It controls no menu now. §3.1 says to leave it until the
   deploy is confirmed. **Sequence:** deploy → see "체인 / Chains" in the cloud menu → then
   remove `ALLOW_DEVNET` from `.env` (and, optionally, the stale `ALLOW_AA` /
   `ALLOW_AGENTCONSOLE` / `ALLOW_AUDITOR` beside it, dead since 2026-09-15). Removing it before
   that confirmation leaves no way to roll back the menu with one line.

9. **§1's service→chain table disagrees with the deployed env, and the page follows the env.**
   §1 lists `/live/agent/console` under Sepolia. In the deployed service `ANVIL_RPC_URL` is
   bound to `rabbit-devnet-rpc` (`CHAIN=devnet` in `scripts/deploy.env`), so the cloud console
   targets the **devnet**. The badges on the page are read from the env and `deployments.json`,
   not from §1, so they say devnet. **Decision needed:** is the env right and §1 stale, or has
   the console drifted off the chain it was meant to be on?

10. **`features/README.md`'s Devnet row is stale.** §3.5 said to touch it only if the service
    table mentions rabbit's `/devnet` URL — it does not (it names `devnet.jaylabs.xyz`), so I
    left it alone. But its status column still reads "planned, not deployed", which stopped
    being true on 2026-09-14. Out of this brief's scope; worth a one-line fix in whichever
    change next touches that file.

11. **The devnet needs re-seeding, and nothing watches for that.** Confirmed 2026-09-16:
    `eth_getCode` at the devnet's Registry address returns `0x`, so all 21 Registry-backed
    addresses render as missing. The chain has been reset since `seededAt 2026-09-14`.
    **Default taken:** the page says so plainly and collapses the misses; it does not pretend.
    **Decision needed:** re-run `scripts/seed.ts` (deploys ~21 contracts to the shared devnet —
    not mine to trigger), and separately, whether anything should *notice* this without a human
    looking at the page. The devnet's `/status` reports the address the seed last wrote, so a
    check comparing it against `eth_getCode` would catch the next reset automatically.

12. **A third hand-copied address book.** Verex's CTF backbone (jUSD, ConditionalTokens,
    CTFExchange, on both the devnet and Sepolia) is now copied into `lib/devnet.ts` from verex's
    `packages/contracts/deployments.json`, for the same reason as the rails definitions in
    [§6.5](#open): rabbit deploys with `--source .` and cannot read a sibling repo.
    `NEXT_PUBLIC_DEVNET_JUSD` in `.env.example` already carried one of these, which is how the
    duplication started. Same fix as 5 — publish, or accept the hand-sync and say so in the
    comments (done).

### 7. Policies (jay's, non-negotiable) <a id="policy"></a>

- Never `git reset --hard`; never commit before jay's review; never commit to `main`; one branch
  for this whole request (`claude/chains-menu`).
- Never touch `~/work/rabbit/docs/memo-no-up.txt` and never copy a private key into any file.
- Do not kill or restart jay's running Anvil (pid on :8545) unless jay says so in the same
  conversation.
- Reply format per `~/.claude/CLAUDE.md` (English check, Answer, Today's phrases, Korean).

### 8. Docs move: alice → rabbit (2026-09-22) <a id="docsmove"></a>

**This file's own address changed.** `docs/features/`, `docs/tasks/` and `docs/history/` moved
back from `~/work/alice` to `~/work/rabbit` on 2026-09-22 (jay). They moved as one unit because
they are wired to each other by 280 relative links — 139 into `../tasks/`, 126 into
`../features/`, 15 into `../history/` — and any subset left behind would have snapped all of
them. Moving all three kept every one intact.

Round trip: these folders lived here until 2026-09-14, spent eight days in alice, and are home
again. Both repos publish GitHub Pages, so nothing went dark:

| | Pages source | Docs URL shape |
|---|---|---|
| **rabbit** | `main` → `/docs` | `https://linked0.github.io/rabbit/html/docs/…` |
| **alice** | `main` → `/` (root), custom domain | `https://alice.jaylabs.xyz/docs/html/docs/…` |

#### What jay should do next <a id="docsmove-next"></a>

1. **Update `~/.claude/CLAUDE.md`.** The "Daily action log" rule still names
   `~/work/alice/docs/history/` as the central history folder. It is now
   `~/work/rabbit/docs/history/`. Until that line changes, every fresh session will write the
   day's log into the wrong repo — this is the one item that silently corrupts future work, so
   do it first.
2. **Update the two memory files that name alice** —
   `feedback_per_project_history_files.md` and `feedback_rabbit_work_folder.md` in
   `~/.claude/projects/-Users-jay-work/memory/`. Same reason as 1.
3. **Confirm the three alice cards resolve** once both pushes land. Pages rebuilds take a minute
   or two: `https://linked0.github.io/rabbit/html/docs/features/README.html`, and the `tasks/`
   and `history/` indexes beside it.
4. **Decide whether rabbit's docs deserve a custom domain.** alice has `alice.jaylabs.xyz`;
   rabbit's docs are only on `linked0.github.io/rabbit`. Not required — just now visible, since
   alice's landing page links out to it three times.
5. **Four links inside the moved docs now dangle** (they point at alice-only content):
   `../topics/README.md`, `../topics/pocs-dvt.html`, `../topics/raw/README.md`,
   `../topics/raw/2026-09-22-gemini-youtube.md`. Everything else the folders reached — images,
   knowledge, `runbooks/cloud-sql-setup.md` — exists in rabbit too. Worth a rewrite to absolute
   `alice.jaylabs.xyz` URLs, or leaving until someone follows one.
6. **`docs/rabbit-design.md` exists in both repos** and its two links to `features/ai-chat.md`
   resolve here and dangle in alice's copy. The duplicate pair is older than this move; flagging
   it, not fixing it.

#### What was changed to make the move work

- **Both docs generators gained absent-folder guards.** alice's `generate-docs-html.mjs` would
  have crashed on the missing folders (rabbit's already had the guards from the 2026-09-14 move
  in the other direction — they are kept, since a guard that has proven itself once is worth a
  `stat`).
- **alice's `docs/logs.html` was deleted, and its generator now exits early.** That page is built
  from `docs/history/*.md` and nothing else, so with the folder gone it was 93 dead links.
  `generate-logs-html.mjs` says so and stops. The logs render here instead — 109 entries.
- **A pre-existing 404 was fixed on the way past.** Since 2026-09-14 rabbit's index linked to
  `linked0.github.io/alice/html/docs/…`, which never resolved: alice serves from its repo root,
  so the working prefix is `/docs/html/docs/…`. Those cards are local again, so the bad URL is
  simply gone.
- **The card *labels* were wrong too, not just the hrefs** (jay spotted it from the rendered
  page). Three cards still read `docs/features/README.md`, `docs/tasks/`, `docs/history/` — paths
  that no longer exist in alice. They now read `rabbit · docs/…`, with the full URL on hover,
  following the `·` separator the Eng card already uses. The **"Rabbit — Docs"** card went the
  same way: it was titled Rabbit but pointed at alice's own docs index. One consequence to
  note — alice's own 1516-page docs index now has no card pointing at it; Knowledge Notes, Eng
  and Memo cover the parts jay actually opens, but a dedicated "Alice — Docs" card would close
  the gap if he wants one.
- **alice has two index pages that must be hand-synced.** `alice/index.html` is what Pages
  actually serves (it carries `<base href="docs/">`); `alice/docs/index.html` is a near-copy.
  Both were updated. A change to one that misses the other goes unnoticed.
