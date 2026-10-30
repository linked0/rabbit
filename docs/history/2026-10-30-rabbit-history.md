# 2026-10-30 — rabbit history

Source doc: alice `docs/jayv/tasks/task-discord-bot.md` (T4, Discord bot account; the plan moved to alice on 2026-10-29) and the workflow rule in alice #5001 `business-ideas` ("`.env` is local, the cloud uses Secret Manager"). alice is private, so paths are cited, not linked.

## Added

- `scripts/deploy.sh` carries the Discord keys to Cloud Run: `DISCORD_BOT_TOKEN` → Secret Manager `rabbit-discord-bot-token`; `DISCORD_PUBLIC_KEY` and `DISCORD_APPLICATION_ID` → plain env (`PUBLIC_ENV`)

## Done

- (none)

### deploy.sh: Discord keys from .env to Cloud Run

**Cause:** jay ("Check #5001 … tell me the step for the cloud", then "go"): the three Discord keys were only in the local `.env`. #5001's workflow rule says the cloud reads Secret Manager instead.
**Reasoning:** `deploy.sh` already turns `.env` into Secret Manager versions (`upsert_secret`, a new version only when the value changes). Only the bot token is secret. The public key and application id are public values, so they go in `PUBLIC_ENV` like the Toss and thirdweb client keys and cost nothing in Secret Manager. Every line is guarded by `[ -n … ]`, so a deploy without the keys behaves as before.
**Change:** `upsert_secret rabbit-discord-bot-token`, `DISCORD_BOT_TOKEN=rabbit-discord-bot-token:latest` in `SECRETS`, and two `PUBLIC_ENV` lines.
**Result:** `bash -n` is clean, and a dry run with `.env` yields the secret mapping and both env names. Not deployed. No code reads the keys yet, and that comes with T4. Reset the leaked bot token before the next `./scripts/deploy.sh`, or the old token becomes the first secret version.
