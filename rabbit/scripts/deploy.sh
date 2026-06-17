#!/usr/bin/env bash
# rabbit → GCP Cloud Run 배포 (docs/tasks §6 / README §9). 재실행 안전(idempotent).
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

# Cloud Run 리비전이 사용하는 기본 컴퓨트 서비스 계정 — 시크릿 읽기 권한 부여 대상
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

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
  # Cloud Run 서비스 계정에 이 시크릿의 읽기 권한 부여 (재실행 안전)
  gcloud secrets add-iam-policy-binding "$name" \
    --member="serviceAccount:$RUN_SA" \
    --role=roles/secretmanager.secretAccessor >/dev/null
  echo "  - $name: OK (+accessor)"
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

# AUTH_URL은 projectNumber 기반 고정 도메인으로 못 박는다.
# status.url(=…-<hash>-<region>.a.run.app)을 쓰면 로그인 시작 호스트와 콜백 호스트가
# 달라져 Auth.js PKCE 쿠키가 유실된다(InvalidCheck → Configuration 500).
# OAuth 클라이언트의 redirect URI도 반드시 이 도메인으로 등록할 것.
URL="https://${SERVICE}-${PROJECT_NUMBER}.${REGION}.run.app"
echo "▶ AUTH_URL=$URL 적용 (고정 도메인)"
gcloud run services update "$SERVICE" --region "$REGION" --update-env-vars "AUTH_URL=$URL" >/dev/null

echo
echo "✅ 배포 완료: $URL"
echo "⚠️  Google Cloud Console > OAuth 클라이언트의 Authorized redirect URI에 추가하세요:"
echo "    $URL/api/auth/callback/google"
