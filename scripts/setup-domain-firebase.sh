#!/usr/bin/env bash
# www.jaylabs.xyz → Firebase Hosting rewrite → Cloud Run (rabbit). Idempotent.
#
# ⛔ DO NOT register the apex (jaylabs.xyz) on this site. Learned the hard way 2026-07-25:
# this Hosting site lives in doubletree-498007, the SAME project as the jaylabs-xyz Cloud DNS
# zone, so Firebase has write access to the zone. Registering the apex made Firebase treat the
# whole zone as its own and it DELETED `verex.jaylabs.xyz CNAME verex-499205.web.app` (a
# sibling subdomain pointing at a DIFFERENT Hosting site) ~6 min later, taking verex offline.
# verex's own setup avoided this only because its hosting is in another project. Subdomains
# only. If the bare domain is ever wanted, do it somewhere that can't write this zone.
#
# WHY Firebase Hosting (not Cloud Run domain mapping): built-in domain mapping does NOT
# support asia-northeast3 (Seoul) — the blocker recorded in docs/tasks/jun-30-rabbit-design.md
# §11 (2026-07-07) and re-verified when verex.jaylabs.xyz shipped (2026-07-25). Firebase
# Hosting proxies any region, TLS is Google-managed, and it's ~free at our volume.
# This script is the rabbit twin of verex's scripts/setup-domain-firebase.sh.
#
# What this does (all REST — no firebase CLI needed):
#   1) Enable firebase + firebasehosting APIs; add Firebase to the project (creates the
#      default Hosting site, id == PROJECT_ID).
#   2) Release a Hosting version whose ONLY content is the rewrite ** → Cloud Run `rabbit`
#      (asia-northeast3). firebase.json mirrors this for anyone using the CLI later.
#   3) Register each custom domain and read back the DNS records it requires
#      (subdomain → CNAME; apex → A/AAAA; both → an ACME TXT for the cert).
#   4) Upsert those records into the jaylabs.xyz Cloud DNS zone.
#   5) Poll until ownership is ACTIVE and the certs are issued.
#
# Prereqs: gcloud auth login (owner on the project). Re-run safe.
#
# AFTER this succeeds, two manual steps remain:
#   - Add https://www.jaylabs.xyz/api/auth/callback/google to the OAuth client's
#     Authorized redirect URIs (Cloud Console > APIs & Services > Credentials).
#   - Redeploy so AUTH_URL picks up PROD_URL: ./scripts/deploy.sh
#
# Usage: ./scripts/setup-domain-firebase.sh [DOMAIN ...]
#   e.g. ./scripts/setup-domain-firebase.sh                     # www.jaylabs.xyz (default)
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_ID=${PROJECT_ID:-doubletree-498007}    # app + hosting project
DNS_PROJECT=${DNS_PROJECT:-$PROJECT_ID}        # jaylabs.xyz zone happens to live here too
DNS_ZONE=${DNS_ZONE:-jaylabs-xyz}
SERVICE=${SERVICE:-rabbit}
REGION=${REGION:-asia-northeast3}
SITE=${SITE:-$PROJECT_ID}                      # default Hosting site id == project id
DOMAINS=("$@")
[ ${#DOMAINS[@]} -eq 0 ] && DOMAINS=(www.jaylabs.xyz)

# Guard: refuse a bare apex — see the ⛔ note at the top. Only reachable if someone passes it.
for d in "${DOMAINS[@]}"; do
  case "$d" in
    *.*.*) ;; # has a subdomain label — fine
    *) echo "❌ '$d' looks like an apex. Registering it here deletes sibling subdomains from"
       echo "   the zone (it took verex.jaylabs.xyz down on 2026-07-25). Use a subdomain."
       exit 1 ;;
  esac
done

TOKEN=$(gcloud auth print-access-token)
H=(-H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: $PROJECT_ID" -H "Content-Type: application/json")
FBH="https://firebasehosting.googleapis.com/v1beta1"

echo "▶ APIs + Firebase on $PROJECT_ID"
gcloud services enable firebase.googleapis.com firebasehosting.googleapis.com --project "$PROJECT_ID" >/dev/null
if ! curl -sf "${H[@]}" "https://firebase.googleapis.com/v1beta1/projects/$PROJECT_ID" >/dev/null; then
  curl -s -X POST "${H[@]}" "https://firebase.googleapis.com/v1beta1/projects/$PROJECT_ID:addFirebase" -d '{}' >/dev/null
  for _ in $(seq 1 12); do
    curl -sf "${H[@]}" "https://firebase.googleapis.com/v1beta1/projects/$PROJECT_ID" >/dev/null && break
    sleep 5
  done
fi
# Default site exists after addFirebase; create explicitly if somehow missing (409 = fine).
curl -s -X POST "${H[@]}" "$FBH/projects/$PROJECT_ID/sites?siteId=$SITE" -d '{}' >/dev/null || true

echo "▶ Release rewrite: ** → $SERVICE ($REGION)"
VNAME=$(curl -s -X POST "${H[@]}" "$FBH/sites/$SITE/versions" \
  -d "{\"config\":{\"rewrites\":[{\"glob\":\"**\",\"run\":{\"serviceId\":\"$SERVICE\",\"region\":\"$REGION\"}}]}}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
curl -s -X POST "${H[@]}" "$FBH/$VNAME:populateFiles" -d '{}' >/dev/null
curl -s -X PATCH "${H[@]}" "$FBH/$VNAME?updateMask=status" -d '{"status":"FINALIZED"}' >/dev/null
curl -s -X POST "${H[@]}" "$FBH/sites/$SITE/releases?versionName=$VNAME" -d '{}' >/dev/null
echo "  ✓ live at https://$SITE.web.app (sanity-check this first)"

# Cloud DNS upsert. rdata may be a comma-separated list — an apex gets several A records,
# and they must go in ONE record-set or the second write clobbers the first.
upsert() { # name type rdata[,rdata...]
  local name=$1 type=$2 rdata=$3
  if gcloud dns record-sets describe "$name." --zone="$DNS_ZONE" --project="$DNS_PROJECT" --type="$type" >/dev/null 2>&1; then
    gcloud dns record-sets update "$name." --zone="$DNS_ZONE" --project="$DNS_PROJECT" --type="$type" --ttl=300 --rrdatas="$rdata"
  else
    gcloud dns record-sets create "$name." --zone="$DNS_ZONE" --project="$DNS_PROJECT" --type="$type" --ttl=300 --rrdatas="$rdata"
  fi
}

for DOMAIN in "${DOMAINS[@]}"; do
  echo "▶ Custom domain: $DOMAIN"
  # 409 on re-run = already registered; fine.
  curl -s -X POST "${H[@]}" "$FBH/projects/$PROJECT_ID/sites/$SITE/customDomains?customDomainId=$DOMAIN" -d '{}' >/dev/null || true
  sleep 5

  echo "  DNS records → zone $DNS_ZONE (project $DNS_PROJECT)"
  curl -s "${H[@]}" "$FBH/projects/$PROJECT_ID/sites/$SITE/customDomains/$DOMAIN" | python3 -c '
import sys, json, collections
d = json.load(sys.stdin)
groups = collections.OrderedDict()   # (name, type) -> [rdata, ...]  — one record-set per key
def add(r):
    if r.get("requiredAction") != "ADD":
        return
    rdata = r["rdata"]
    if r["type"] == "TXT":
        rdata = "\"%s\"" % rdata           # Cloud DNS wants TXT quoted
    elif r["type"] == "CNAME":
        rdata = rdata.rstrip(".") + "."    # ...and CNAME fully qualified
    groups.setdefault((r["domainName"], r["type"]), []).append(rdata)
for grp in (d.get("requiredDnsUpdates") or {}).get("desired", []):
    for r in grp.get("records", []):
        add(r)
for grp in (((d.get("cert") or {}).get("verification") or {}).get("dns") or {}).get("desired", []):
    for r in grp.get("records", []):
        add(r)
for (name, typ), rdatas in groups.items():
    print(name, typ, ",".join(rdatas))
' | while read -r name type rdata; do
    echo "    - $name $type $rdata"
    upsert "$name" "$type" "$rdata"
  done
done

echo "▶ Waiting for ownership + certificates (can take ~15 min)..."
for _ in $(seq 1 60); do
  PENDING=0
  for DOMAIN in "${DOMAINS[@]}"; do
    S=$(curl -s "${H[@]}" "$FBH/projects/$PROJECT_ID/sites/$SITE/customDomains/$DOMAIN" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ownershipState'), d.get('hostState'), (d.get('cert') or {}).get('state'))")
    echo "  $DOMAIN: $S"
    case "$S" in *ACTIVE*CERT_ACTIVE*) ;; *) PENDING=1 ;; esac
  done
  [ "$PENDING" -eq 0 ] && break
  sleep 30
done

echo
for DOMAIN in "${DOMAINS[@]}"; do
  echo "확인:  dig $DOMAIN +short   /   curl -I https://$DOMAIN"
done
echo
echo "⚠️  다음 두 가지는 수동:"
echo "    1) OAuth 클라이언트 redirect URI 추가: https://www.jaylabs.xyz/api/auth/callback/google"
echo "    2) AUTH_URL 반영 재배포: ./scripts/deploy.sh"
