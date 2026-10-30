#!/bin/zsh
# Jay Chat on Claude: a one-off stability check after the $200 promo credit expires on 2026-11-05 UTC (jay, 2026-10-30:
# "you can check the stableness of the chat at 6th November"). The hourly Cloud Scheduler probe
# (rabbit-jay-chat-health, see deploy.sh) already pings Telegram on each quota / rate / down failure; this looks back over
# the whole day once and sends one summary.
#
#   scripts/claude-stability-check.sh              # run the check, write the report, send it to Telegram
#   scripts/claude-stability-check.sh --no-send    # same, without Telegram (for a test)
#
# launchd: ~/Library/LaunchAgents/com.jay.rabbit-claude-check.plist fires it on 11-06 10:07 KST. StartCalendarInterval
# repeats every year, so after a run on or after 2026-11-06 the job unloads its own plist.
# Read-only on the cloud side: one health POST (one tiny LLM call), log and scheduler reads. Secret values never print.
set -u
SEND=1; [ "${1:-}" = --no-send ] && SEND=0
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$HOME/work/rabbit" || exit 1
. scripts/deploy.env
REPORT="$HOME/Library/Logs/rabbit-claude-check.md"
NOW=$(TZ=Asia/Seoul date '+%F %H:%M')

SECRET=$(gcloud secrets versions access latest --secret rabbit-health-secret --project "$PROJECT_ID" 2>/dev/null)
HEALTH=$(curl -s -m 60 -X POST -H "X-Health-Secret: $SECRET" "$PROD_URL/api/jay-chat/health")
unset SECRET
CHAT=$(echo "$HEALTH" | jq -c '.jayChat // .' 2>/dev/null || echo "$HEALTH" | head -c 300)

# The last 26 hours cover the expiry (2026-11-05 00:00 UTC = 09:00 KST) when this runs at 10:07 KST on 11-06.
FILTER="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE\" AND (severity>=ERROR OR textPayload:(\"credit\" OR \"quota\" OR \"rate\" OR \"402\" OR \"429\" OR \"billing\"))"
LOGS=$(gcloud logging read "$FILTER" --project "$PROJECT_ID" --freshness=26h --limit=200 --format='value(timestamp,severity,textPayload)' 2>&1)
N_ALL=$(printf '%s' "$LOGS" | grep -c . )
N_LIMIT=$(printf '%s' "$LOGS" | grep -c -i -E 'credit|quota|billing|402|429|rate.?limit')
SCHED=$(gcloud scheduler jobs describe rabbit-jay-chat-health --project "$PROJECT_ID" --location "$REGION" \
  --format='value(state,lastAttemptTime,status.code)' 2>&1)
REV=$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" \
  --format='value(status.latestReadyRevisionName)' 2>&1)

if echo "$CHAT" | grep -q '"ok":true' && [ "$N_LIMIT" -eq 0 ]; then VERDICT="OK"; else VERDICT="LOOK"; fi
SUMMARY="Jay Chat check $NOW KST: $VERDICT
health: $CHAT
errors (26h): $N_ALL lines, quota/rate: $N_LIMIT
scheduler: $SCHED · revision: $REV"

{
  echo "## $NOW KST · $VERDICT"
  echo
  echo '```'
  echo "$SUMMARY"
  echo '```'
  echo
  echo "<details><summary>Matching log lines (newest first, max 200)</summary>"
  echo
  echo '```'
  printf '%s\n' "$LOGS" | cut -c1-300
  echo '```'
  echo "</details>"
  echo
} >> "$REPORT"
echo "$SUMMARY"

if [ $SEND = 1 ]; then
  TOKEN=$(grep -m1 '^TELEGRAM_BOT_TOKEN=' .env | cut -d= -f2- | tr -d '"')
  CHAT_ID=$(grep -m1 '^TELEGRAM_CHAT_ID=' .env | cut -d= -f2- | tr -d '"')
  curl -s -m 20 "https://api.telegram.org/bot$TOKEN/sendMessage" --data-urlencode "chat_id=$CHAT_ID" \
    --data-urlencode "text=$SUMMARY
Report: $REPORT" >/dev/null && echo "sent to Telegram"
  unset TOKEN
fi

# One-shot: unload the launchd job once the target day has come.
if [ "$(TZ=Asia/Seoul date +%Y%m%d)" -ge 20261106 ]; then
  launchctl bootout "gui/$(id -u)/com.jay.rabbit-claude-check" 2>/dev/null
  rm -f "$HOME/Library/LaunchAgents/com.jay.rabbit-claude-check.plist"
fi
