#!/usr/bin/env bash
# rabbit → GCP Cloud Run 배포 (plan §6 / README §9). 재실행 안전(idempotent).
# 사용법:
#   1) scripts/deploy.env.example → scripts/deploy.env 복사 후 PROJECT_ID 등 입력
#   2) ./scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f scripts/deploy.env ] || {
  echo "❌ scripts/deploy.env 가 없습니다. scripts/deploy.env.example 을 복사해 작성하세요."
  exit 1
}
source scripts/deploy.env # PROJECT_ID / REGION / SERVICE
source .env.local         # AUTH_SECRET, AUTH_GOOGLE_*, AI_*, MARKET_API_KEY, ALLOWED_EMAILS …

: "${PROJECT_ID:?deploy.env에 PROJECT_ID가 필요합니다}"
REGION=${REGION:-asia-northeast3}
SERVICE=${SERVICE:-rabbit}

echo "▶ gcloud 프로젝트/API 설정 ($PROJECT_ID)"
gcloud config set project "$PROJECT_ID" >/dev/null
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com

# 시크릿 upsert — 있으면 새 버전 추가, 없으면 생성
upsert_secret() {
  local name=$1 value=$2
  if [ -z "$value" ]; then
    echo "  - $name: 값 없음 → 건너뜀"
    return
  fi
  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- >/dev/null
  else
    printf '%s' "$value" | gcloud secrets create "$name" --replication-policy=automatic --data-file=- >/dev/null
  fi
  echo "  - $name: OK"
}

echo "▶ Secret Manager 갱신"
upsert_secret rabbit-auth-secret   "${AUTH_SECRET:-}"
upsert_secret rabbit-google-id     "${AUTH_GOOGLE_ID:-}"
upsert_secret rabbit-google-secret "${AUTH_GOOGLE_SECRET:-}"
upsert_secret rabbit-ai-key        "${AI_API_KEY:-}"
upsert_secret rabbit-market-key    "${MARKET_API_KEY:-}"

echo "▶ Cloud Run 배포"
# 앱이 자체 Google 로그인 + 이메일 allowlist로 접근을 제어하므로 공개로 배포한다.
# (README §9의 IAP 방식을 쓰려면 --no-allow-unauthenticated + IAP 활성화로 변경)
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "APP_MODE=cloud,SESSION_MAX_AGE=${SESSION_MAX_AGE:-3600},ALLOWED_EMAILS=${ALLOWED_EMAILS:-},AI_PROVIDER=${AI_PROVIDER:-openai}" \
  --set-secrets "AUTH_SECRET=rabbit-auth-secret:latest,AUTH_GOOGLE_ID=rabbit-google-id:latest,AUTH_GOOGLE_SECRET=rabbit-google-secret:latest,AI_API_KEY=rabbit-ai-key:latest,MARKET_API_KEY=rabbit-market-key:latest"

URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')
echo "▶ AUTH_URL=$URL 적용"
gcloud run services update "$SERVICE" --region "$REGION" --update-env-vars "AUTH_URL=$URL" >/dev/null

echo
echo "✅ 배포 완료: $URL"
echo "⚠️  Google Cloud Console > OAuth 클라이언트의 Authorized redirect URI에 추가하세요:"
echo "    $URL/api/auth/callback/google"
