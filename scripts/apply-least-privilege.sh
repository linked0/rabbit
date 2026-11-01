#!/usr/bin/env bash
# Move the four Cloud Run services off the default Compute Engine account (roles/editor on the whole project)
# onto least-privilege runtime accounts (jay, 2026-11-01: "go" — docs/history/2026-11-01-rabbit-history.md).
#
#     bash scripts/apply-least-privilege.sh                 # steps 1–4: accounts, grants, switch, check
#     bash scripts/apply-least-privilege.sh --drop-editor   # step 5, after the site has run fine for a while
#
# Why jay runs it: Claude's IAM grants are blocked by the permission classifier (a grant is a permission change).
# Safe to re-run: every create/grant is idempotent, and a service already on its account is left alone.
#
#   rabbit-run    rabbit's runtime: secretAccessor on exactly the secrets the live service mounts, + cloudsql.client
#   jayverse-run  jayverse-exchange / -number / -wallet: no secrets, no Cloud SQL, no Google SDK → no roles at all
#   the default compute account keeps a job: Cloud Build runs `deploy --source` builds as it, so it gets
#   roles/cloudbuild.builds.builder BEFORE Editor comes off, or the next deploy would fail to build.
set -euo pipefail

P=doubletree-498007
REGION=asia-northeast1
NUM=$(gcloud projects describe "$P" --format='value(projectNumber)')
DEFAULT_SA="${NUM}-compute@developer.gserviceaccount.com"
RABBIT_SA="rabbit-run@${P}.iam.gserviceaccount.com"
JV_SA="jayverse-run@${P}.iam.gserviceaccount.com"

if [ "${1:-}" = "--drop-editor" ]; then
  echo "▶ step 5: remove roles/editor from $DEFAULT_SA"
  for s in rabbit jayverse-exchange jayverse-number jayverse-wallet; do
    sa=$(gcloud run services describe "$s" --region "$REGION" --project "$P" --format='value(spec.template.spec.serviceAccountName)')
    [ "$sa" = "$DEFAULT_SA" ] && { echo "  ✗ $s still runs as the default account — run steps 1–4 first"; exit 1; }
  done
  gcloud projects remove-iam-policy-binding "$P" --member="serviceAccount:$DEFAULT_SA" --role=roles/editor --condition=None >/dev/null
  echo "  ✓ done. If a deploy's build then fails on a permission, the error names the missing role — add just that one."
  exit 0
fi

echo "▶ 1. accounts"
for a in rabbit-run jayverse-run; do
  gcloud iam service-accounts describe "$a@$P.iam.gserviceaccount.com" --project "$P" >/dev/null 2>&1 \
    && echo "  - $a exists" \
    || { gcloud iam service-accounts create "$a" --project "$P" >/dev/null; echo "  - $a created"; }
done

echo "▶ 2. grants"
# the secrets rabbit mounts today, read from the live service (not a hand-kept list)
SECRETS=$(gcloud run services describe rabbit --region "$REGION" --project "$P" --format=json \
  | python3 -c 'import json,sys; c=json.load(sys.stdin)["spec"]["template"]["spec"]["containers"][0]; print(" ".join(sorted({e["valueFrom"]["secretKeyRef"]["name"] for e in c.get("env",[]) if "valueFrom" in e})))')
for s in $SECRETS; do
  gcloud secrets add-iam-policy-binding "$s" --project "$P" --member="serviceAccount:$RABBIT_SA" \
    --role=roles/secretmanager.secretAccessor --condition=None >/dev/null
  echo "  - $s → rabbit-run (secretAccessor)"
done
gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$RABBIT_SA" --role=roles/cloudsql.client --condition=None >/dev/null
echo "  - cloudsql.client → rabbit-run"
gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$DEFAULT_SA" --role=roles/cloudbuild.builds.builder --condition=None >/dev/null
echo "  - cloudbuild.builds.builder → default compute account (builds keep working once Editor is gone)"

echo "▶ 3. switch the services (a new revision, same image — no rebuild)"
switch() {
  local s=$1 sa=$2 cur
  cur=$(gcloud run services describe "$s" --region "$REGION" --project "$P" --format='value(spec.template.spec.serviceAccountName)')
  if [ "$cur" = "$sa" ]; then echo "  - $s already on ${sa%%@*}"; return; fi
  gcloud run services update "$s" --region "$REGION" --project "$P" --service-account "$sa" --quiet >/dev/null
  echo "  - $s → ${sa%%@*}"
}
switch rabbit "$RABBIT_SA"
for s in jayverse-exchange jayverse-number jayverse-wallet; do switch "$s" "$JV_SA"; done

echo "▶ 4. check"
for s in rabbit jayverse-exchange jayverse-number jayverse-wallet; do
  url=$(gcloud run services describe "$s" --region "$REGION" --project "$P" --format='value(status.url)')
  printf '  - %-18s %s\n' "$s" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$url/")"
done
printf '  - %-18s %s\n' "www.jaylabs.xyz" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 https://www.jaylabs.xyz/)"
sleep 20
ERRS=$(gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR AND timestamp>=\"$(date -u -v-5M +%Y-%m-%dT%H:%M:%SZ)\"" \
  --project "$P" --limit 20 --format='value(resource.labels.service_name,textPayload)' 2>/dev/null | grep -i -E "permission|denied|forbidden|403|cloudsql" || true)
if [ -n "$ERRS" ]; then echo "  ✗ permission errors in the last 5 minutes:"; echo "$ERRS" | cut -c1-200; else echo "  ✓ no permission errors in the logs"; fi
echo
echo "Next: use the site for a day (sign in, Jay Chat, a page that reads the DB), then:"
echo "      bash scripts/apply-least-privilege.sh --drop-editor"
