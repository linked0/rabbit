# 2026-10-30 — rabbit history

Source doc: alice `docs/jayv/tasks/task-discord-bot.md` (T4, Discord bot account; the plan moved to alice on 2026-10-29) and the workflow rule in alice #5001 `business-ideas` ("`.env` is local, the cloud uses Secret Manager"). alice is private, so paths are cited, not linked.

## Added

- `scripts/deploy.sh` carries the Discord keys to Cloud Run: `DISCORD_BOT_TOKEN` → Secret Manager `rabbit-discord-bot-token`; `DISCORD_PUBLIC_KEY` and `DISCORD_APPLICATION_ID` → plain env (`PUBLIC_ENV`)
- `scripts/claude-stability-check.sh`: a one-off look at Jay Chat on Claude after the promo credit expires (health probe, 26 h of quota/rate errors, scheduler state, revision → report + Telegram)
- `app/api/discord/interactions/route.ts` (T4 step 3): Discord's Ed25519 signature check, PING → PONG, a "not answering yet" reply to commands; the path is in `PUBLIC_PATHS`

## Done

- (none)

### deploy.sh: Discord keys from .env to Cloud Run

**Cause:** jay ("Check #5001 … tell me the step for the cloud", then "go"): the three Discord keys were only in the local `.env`. #5001's workflow rule says the cloud reads Secret Manager instead.
**Reasoning:** `deploy.sh` already turns `.env` into Secret Manager versions (`upsert_secret`, a new version only when the value changes). Only the bot token is secret. The public key and application id are public values, so they go in `PUBLIC_ENV` like the Toss and thirdweb client keys and cost nothing in Secret Manager. Every line is guarded by `[ -n … ]`, so a deploy without the keys behaves as before.
**Change:** `upsert_secret rabbit-discord-bot-token`, `DISCORD_BOT_TOKEN=rabbit-discord-bot-token:latest` in `SECRETS`, and two `PUBLIC_ENV` lines.
**Result:** `bash -n` is clean, and a dry run with `.env` yields the secret mapping and both env names. Not deployed. No code reads the keys yet, and that comes with T4. jay confirmed the leaked bot token was already reset and the new one is in `.env`, so the next `./scripts/deploy.sh` uploads the new token.

### Jay Chat check for 2026-11-06, after the Claude promo credit expires

**Cause:** jay: T1 has nothing big left except the $200 promo credit expiry (2026-11-05 UTC) and the usage rate limit; "you can check the stableness of the chat at 6th November".
**Reasoning:** a session cron dies with the session, and a cloud routine has no gcloud access, so the check is a local script. The hourly Cloud Scheduler probe `rabbit-jay-chat-health` already sends a Telegram message on every quota, rate or down failure. This script adds one look back over the whole day (26 h, which covers the expiry at 09:00 KST on 11-05) and one summary.
**Change:** `scripts/claude-stability-check.sh` runs the health POST (secret read from Secret Manager, never printed), `gcloud logging read` for errors and credit/quota/rate/402/429 lines, the scheduler state and the live revision. It writes `~/Library/Logs/rabbit-claude-check.md` and sends the summary to Telegram (`--no-send` skips that). The launchd job `com.jay.rabbit-claude-check` (11-06 10:07 KST) unloads itself after it runs. Installing the plist was blocked by the session's permission check, so jay installs it (command in the chat reply).
**Result:** test run 13:47 KST: OK, `claude-sonnet-5-5`, 26 tokens, 0 error lines, scheduler ENABLED. The 13:39 deploy (`rabbit-00175-cfz`) created `rabbit-discord-bot-token`, and Cloud Run has all three Discord env names.

### T4 step 3: the Discord interactions route

**Cause:** jay saved `https://www.jaylabs.xyz/api/discord/interactions` in the Developer Portal and got "인증 오류: interactions_endpoint_url: 지정한 인터랙션 엔드포인트 url을 인증할 수 없습니다", then said "go". There was no route, and middleware answered 401 to Discord's verification PING.
**Reasoning:** Discord saves the URL only if a signed PING gets `200 {"type":1}` and a bad signature gets `401`, so this needs exactly the verification part of step 3. `/ask` needs the deferred reply plus a Cloud Tasks follow-up (step 4), so commands get an ephemeral "not answering yet" reply for now. The signature is checked with `node:crypto` (the 32-byte public key wrapped in its SPKI DER prefix), so there is no new dependency. A 5-minute timestamp window blocks replays.
**Change:** new `app/api/discord/interactions/route.ts`; `/api/discord/interactions` added to `PUBLIC_PATHS` in `middleware.ts` (the signature is the guard).
**Result:** with a generated test key, a signed PING returns 200 `{"type":1}`. A bad signature, no signature, a tampered body and a 10-minute-old timestamp all return 401, and a signed command returns type 4 with flags 64. `tsc` is clean. On `next dev` an unsigned POST reaches the route (its own 401 body), not the login wall. Deployed at jay's request ("go with deployment by your self"): revision `rabbit-00178-pkm`, built from `main` at `834b446` (the build uploaded at 14:06:48 KST, before another session checked out `claude/claude-api` at 14:09 in the same tree, so none of its uncommitted Jay Chat edits went out). Live, an unsigned or bad-signature POST gets the route's own 401 and `/` returns 200. Next: jay saves the URL in the portal.
