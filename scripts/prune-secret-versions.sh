#!/usr/bin/env bash
# Destroy every Secret Manager version except the newest ENABLED one, for rabbit's secrets (jay, 2026-11-01: cost plan #1 → "go").
#
#     bash scripts/prune-secret-versions.sh            # dry run: what would go, and the monthly saving
#     bash scripts/prune-secret-versions.sh --apply    # destroy them (permanent)
#
# Why: Secret Manager bills ~$0.06/month for every version that is not destroyed — enabled AND disabled. October's bill had
# Secret Manager at ₩68,299 for Rabbit: ~960 live versions, up to 101 per secret. deploy.sh's comment says the old versions
# were destroyed on 2026-10-09; they were not (all still enabled on 2026-11-01). deploy.sh itself stopped adding duplicates
# that day — no version is newer than 2026-10-09 — so this is a one-time cleanup.
#
# Safe because every reader asks for `latest` (Cloud Run rabbit: secretKeyRef key "latest", checked 2026-11-01), and the newest
# enabled version is what `latest` resolves to. Only rabbit-* secrets: the devnet's and Verex's few extra versions cost cents.
set -euo pipefail
P=doubletree-498007
APPLY=0; [ "${1:-}" = "--apply" ] && APPLY=1

total=0
for s in $(gcloud secrets list --project "$P" --filter='name~rabbit-' --format='value(name.basename())'); do
  keep=$(gcloud secrets versions list "$s" --project "$P" --filter='state=ENABLED' --sort-by='~createTime' --limit 1 --format='value(name.basename())')
  [ -z "$keep" ] && { echo "  ! $s has no enabled version — skipped"; continue; }
  old=$(gcloud secrets versions list "$s" --project "$P" --filter="state!=DESTROYED AND name!~/versions/${keep}\$" --format='value(name.basename())')
  n=$(printf '%s' "$old" | grep -c . || true)
  [ "$n" -eq 0 ] && continue
  total=$((total + n))
  printf '  %-28s keep v%-4s destroy %3d\n' "$s" "$keep" "$n"
  if [ "$APPLY" = 1 ]; then
    # 8 at a time: one gcloud call per version is ~1-2 s, and 846 of them in series is half an hour
    printf '%s\n' $old | xargs -P 8 -I{} gcloud secrets versions destroy {} --secret "$s" --project "$P" --quiet >/dev/null 2>&1
  fi
done
echo "  → $total versions; ~\$$(python3 -c "print(round($total*0.06,2))")/month"
[ "$APPLY" = 1 ] && echo "  destroyed." || echo "  dry run — add --apply to destroy (permanent)"
