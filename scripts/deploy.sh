#!/usr/bin/env bash
# rabbit → GCP Cloud Run 배포 (docs/tasks §6 / README §9). 재실행 안전(idempotent).
# 운영 서비스는 1대뿐이다 (2026-07-25, jay). rabbit-test / MENU_SHOW_ALL 분기는 삭제 —
# 두 서비스를 나란히 유지할 이유가 없고, 메뉴 노출은 이제 ALLOW_* + 오너 로그인으로 정해진다.
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
source .env         # AUTH_SECRET, AUTH_GOOGLE_*, AI_*, MARKET_API_KEY, ALLOWED_EMAILS …

: "${PROJECT_ID:?deploy.env에 PROJECT_ID가 필요합니다}"
REGION=${REGION:-asia-northeast3}
SERVICE=${SERVICE:-rabbit} # 유일한 운영 서비스

# 예전 `deploy.sh prod|test` 습관으로 인자를 넘겨도 조용히 무시하지 않고 알려준다.
if [ $# -gt 0 ]; then
  echo "ℹ️  인자 '$1' 무시 — 운영 서비스 1대 체제라 대상 선택이 없습니다."
fi
echo "▶ 배포 대상: $SERVICE ($REGION)"

# 모든 gcloud 호출에 --project 를 명시한다. `gcloud config set project` 로 전역 상태를
# 바꾸면, 다른 저장소(verex 등)의 배포가 동시에 돌 때 서로의 활성 프로젝트를 덮어쓴다.
# 2026-07-25 실제로 이 사고가 났다: verex 배포가 활성 프로젝트를 verex-499205 로 바꿔서
# 마지막 AUTH_URL 갱신이 "Service [rabbit] could not be found" 로 실패 → 운영에 AUTH_URL
# 없는 리비전이 떴다. 전역 config 는 건드리지 않는다.
echo "▶ gcloud API 설정 ($PROJECT_ID)"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com --project "$PROJECT_ID"

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
  if gcloud secrets describe "$name" --project "$PROJECT_ID" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --project "$PROJECT_ID" --data-file=- >/dev/null
  else
    printf '%s' "$value" | gcloud secrets create "$name" --project "$PROJECT_ID" --replication-policy=automatic --data-file=- >/dev/null
  fi
  # Cloud Run 서비스 계정에 이 시크릿의 읽기 권한 부여 (재실행 안전)
  gcloud secrets add-iam-policy-binding "$name" --project "$PROJECT_ID" \
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
upsert_secret rabbit-database-url  "${DATABASE_URL:-}"
# Jay Chat 전용 키(rabbit-jay-chat-key)는 폐지 (jay, 2026-08-12) — 오너 전용 챗 삭제로
# AI_API_KEY(rabbit-ai-key, 값은 DashScope 키)가 Jay Chat 의 유일한 키가 됐다.
upsert_secret rabbit-telegram-bot-token "${TELEGRAM_BOT_TOKEN:-}"
# 결제 데모용 서버 전용 키 (PoCs /poc/ap2, /poc/toss) — 없으면 결제 버튼만 실패한다.
upsert_secret rabbit-stripe-secret "${STRIPE_SECRET_KEY:-}"
upsert_secret rabbit-toss-secret   "${TOSS_SECRET_KEY:-}"

echo "▶ Cloud Run 배포"
# 시크릿 목록 — DATABASE_URL은 설정됐을 때만 추가 (Task 1 DB)
SECRETS="AUTH_SECRET=rabbit-auth-secret:latest,AUTH_GOOGLE_ID=rabbit-google-id:latest,AUTH_GOOGLE_SECRET=rabbit-google-secret:latest,AI_API_KEY=rabbit-ai-key:latest,MARKET_API_KEY=rabbit-market-key:latest"
[ -n "${DATABASE_URL:-}" ] && SECRETS="$SECRETS,DATABASE_URL=rabbit-database-url:latest"
[ -n "${TELEGRAM_BOT_TOKEN:-}" ] && SECRETS="$SECRETS,TELEGRAM_BOT_TOKEN=rabbit-telegram-bot-token:latest"
[ -n "${STRIPE_SECRET_KEY:-}" ] && SECRETS="$SECRETS,STRIPE_SECRET_KEY=rabbit-stripe-secret:latest"
[ -n "${TOSS_SECRET_KEY:-}" ] && SECRETS="$SECRETS,TOSS_SECRET_KEY=rabbit-toss-secret:latest"

# 공개 클라이언트 키는 시크릿이 아니라 평범한 env 로 넘긴다 — 어차피 브라우저로 전달되는 값이다.
# NEXT_PUBLIC_* 를 쓰지 않는 이유: 그 접두어는 빌드 시점에 코드에 박히는데, Cloud Run 은 소스에서
# 빌드하고 .env 을 이미지에 넣지 않으므로 운영에서 빈 값으로 굳는다. 서버가 런타임에 읽어
# 클라이언트 컴포넌트에 prop 으로 내려보낸다 (2026-08-05).
PUBLIC_ENV=""
[ -n "${NEXT_PUBLIC_TOSS_CLIENT_KEY:-}" ] && PUBLIC_ENV="${PUBLIC_ENV},TOSS_CLIENT_KEY=${NEXT_PUBLIC_TOSS_CLIENT_KEY}"
[ -n "${NEXT_PUBLIC_THIRDWEB_CLIENT_ID:-}" ] && PUBLIC_ENV="${PUBLIC_ENV},THIRDWEB_CLIENT_ID=${NEXT_PUBLIC_THIRDWEB_CLIENT_ID}"

# 메뉴 표시 플래그(ALLOW_*)를 .env 에서 읽어 Cloud Run env 로 전달한다.
# 클라우드는 기본 "숨김"이라 전달하지 않으면 모든 메뉴가 사라진다. 나중에 추가한 ALLOW_* 도 자동 포함.
MENU_ENV=""
for v in $(compgen -v | grep '^ALLOW_' || true); do
  MENU_ENV="${MENU_ENV},${v}=${!v}"
done

# 앱이 자체 Google 로그인 + 이메일 allowlist로 접근을 제어하므로 공개로 배포한다.
# (README §9의 IAP 방식을 쓰려면 --no-allow-unauthenticated + IAP 활성화로 변경)
# HL_ACCOUNT_ADDRESS(공개 주소, 비밀 아님)는 env로 — 퍼프 포지션 표시(Task 3, 선택)
# --max-instances 1: 데모 사이트라 인스턴스 1개(동시 80요청)면 충분하고, Jay Chat 의
# 인메모리 시간당 토큰 예산이 인스턴스 수만큼 배수로 늘어나는 구멍도 막는다 (jay, 2026-08-12).
gcloud run deploy "$SERVICE" \
  --source . \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --allow-unauthenticated \
  --max-instances 1 \
  --set-env-vars "APP_MODE=cloud,SESSION_MAX_AGE=${SESSION_MAX_AGE:-3600},ALLOWED_EMAILS=${ALLOWED_EMAILS:-},HL_ACCOUNT_ADDRESS=${HL_ACCOUNT_ADDRESS:-},TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID:-},JAY_CHAT_HOURLY_TOKEN_BUDGET=${JAY_CHAT_HOURLY_TOKEN_BUDGET:-450000}${MENU_ENV}${PUBLIC_ENV}" \
  --set-secrets "$SECRETS"

# Cloud SQL 연결 — deploy.env에 CLOUDSQL_INSTANCE=프로젝트:리전:인스턴스 설정 시
if [ -n "${CLOUDSQL_INSTANCE:-}" ]; then
  echo "▶ Cloud SQL 소켓 연결: $CLOUDSQL_INSTANCE"
  gcloud run services update "$SERVICE" --project "$PROJECT_ID" --region "$REGION" \
    --add-cloudsql-instances "$CLOUDSQL_INSTANCE" >/dev/null
fi

# AUTH_URL은 projectNumber 기반 고정 도메인으로 못 박는다.
# status.url(=…-<hash>-<region>.a.run.app)을 쓰면 로그인 시작 호스트와 콜백 호스트가
# 달라져 Auth.js PKCE 쿠키가 유실된다(InvalidCheck → Configuration 500).
# OAuth 클라이언트의 redirect URI도 반드시 이 도메인으로 등록할 것.
# AUTH_URL: 커스텀 도메인(PROD_URL, 예: https://www.jaylabs.xyz)이 있으면 그것,
# 없으면 run.app 고정 도메인.
URL="${PROD_URL:-https://${SERVICE}-${PROJECT_NUMBER}.${REGION}.run.app}"
echo "▶ AUTH_URL=$URL 적용 (고정 도메인)"
gcloud run services update "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --update-env-vars "AUTH_URL=$URL" >/dev/null

# 배포됐는데 AUTH_URL 만 빠진 리비전은 겉보기엔 멀쩡하고 로그인만 깨진다 — 조용히 넘어가면
# 안 되므로 실제로 반영됐는지 되읽어 확인한다 (2026-07-25 사고 재발 방지).
LIVE_AUTH_URL=$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" \
  --format="value(spec.template.spec.containers[0].env.filter(\"name:AUTH_URL\").extract(\"value\"))" 2>/dev/null | tr -d "[]'")
if [ "$LIVE_AUTH_URL" != "$URL" ]; then
  echo "❌ AUTH_URL 반영 실패: 기대 '$URL' / 실제 '$LIVE_AUTH_URL'"
  echo "   이 상태로 두면 Google 로그인이 깨집니다. 수동 복구:"
  echo "   gcloud run services update $SERVICE --project $PROJECT_ID --region $REGION --update-env-vars AUTH_URL=$URL"
  exit 1
fi

echo
echo "✅ 배포 완료: $URL"
echo "⚠️  Google Cloud Console > OAuth 클라이언트의 Authorized redirect URI에 추가하세요:"
echo "    $URL/api/auth/callback/google"
