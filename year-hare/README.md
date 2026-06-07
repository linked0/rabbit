# year-hare

> **PoC** — 내 투자를 요약해주는 도구. 새 아이디어 검증용 레포.
> 상태: 🛠️ **v0 구현됨** — Google 로그인 → 수동 입력 → 현재 손익 → 1년 전망. Next.js + TypeScript. (2026-06-04)

---

## ▶ 실행 방법 (How to run)

```bash
cd /Users/jay/work/task/year-hare
pnpm install        # 최초 1회 (의존성 설치)
cp .env.example .env.local   # 최초 1회 — 아래 "로그인 설정" 채우기
pnpm dev            # 개발 서버 → http://localhost:3000
```

### 🔑 로그인 설정 (Google) — 최초 1회
`.env.local`에 3가지를 채운다 (`.env.example` 참고):
1. **`AUTH_SECRET`** — 생성: `npx auth secret` (또는 `openssl rand -base64 32`)
2. **`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`** — [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 클라이언트 ID 생성
   - **Authorized redirect URI**에 `http://localhost:3000/api/auth/callback/google` 등록 (배포 시 운영 도메인도 추가)
3. **`ALLOWED_EMAILS`** — 접근 허용 이메일(콤마 구분). 본인만 쓰면 한 개. *비우면 누구나 로그인되니 운영에선 꼭 설정.*
> 미설정 상태로도 앱은 뜨지만, 로그인 버튼을 누르면 Google이 클라이언트 ID 오류를 낸다.

브라우저에서 **http://localhost:3000** 접속 →
1. **보유 코인 입력** (심볼·수량·평균 매수가·매수일) → `+ 추가`
2. **현재가 불러오기 (CoinGecko)** 클릭 → 현재 평가액·손익·수익률 표시
3. **1년 후 전망** — 보수/기본/낙관 시나리오별 추정액

프로덕션 빌드 확인:
```bash
pnpm build          # 타입체크 + 빌드 (✅ 통과 확인됨)
```

> 시작 시드로 BTC·ETH 예시가 들어 있다. ✕ 로 지우고 직접 입력하면 된다.
> 현재는 **수동 입력만** 지원 (Excel 업로드는 다음 단계).
> 배포(GCP Cloud Run + IAP)는 아래 **9번** 참고.

### 🚀 서버 배포 (Deploy to server) — 빠른 순서

이 앱은 **GCP Cloud Run**(컨테이너 1개, HTTPS 자동, 트래픽 0이면 비용 0)에 올린다. 아래는 순서대로 실행하는 최소 런북이고, Dockerfile·IAP·CI 등 자세한 설명은 **9번 섹션**에 있다.

**사전 준비 (최초 1회)**
```bash
gcloud auth login
gcloud config set project <GCP_PROJECT_ID>
# 필요한 API 활성화 (run = Cloud Run, cloudbuild = 소스 빌드)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

**1) 비밀값을 Secret Manager에 등록** (코드/명령줄에 시크릿을 노출하지 않기 위해)
```bash
printf '%s' "$AUTH_SECRET"        | gcloud secrets create auth-secret   --data-file=-
printf '%s' "$AUTH_GOOGLE_ID"     | gcloud secrets create google-id     --data-file=-
printf '%s' "$AUTH_GOOGLE_SECRET" | gcloud secrets create google-secret --data-file=-
```
> `AUTH_SECRET`은 `npx auth secret`(또는 `openssl rand -base64 32`)로 생성, `AUTH_GOOGLE_ID/SECRET`은 Google Cloud Console의 OAuth 클라이언트 값. **실제 값은 README에 적지 않는다 — 변수명만.**

**2) 배포** — `--source .`는 레포의 Dockerfile(있으면, 9번 참고) 또는 Cloud Buildpacks로 자동 빌드·푸시·배포한다. `next.config.js`에는 이미 `output: "standalone"`이 설정돼 있다.
```bash
gcloud run deploy year-hare \
  --source . \
  --region asia-northeast3 \
  --no-allow-unauthenticated \
  --set-env-vars ALLOWED_EMAILS=linked0@gmail.com \
  --set-secrets AUTH_SECRET=auth-secret:latest,AUTH_GOOGLE_ID=google-id:latest,AUTH_GOOGLE_SECRET=google-secret:latest
```
배포가 끝나면 `https://year-hare-...run.app` 형태의 **서비스 URL**이 출력된다.

**3) `AUTH_URL`을 방금 받은 도메인으로 설정** (NextAuth가 콜백 URL을 올바르게 만들도록 — 닭·달걀이라 배포 후 한 번 더 갱신)
```bash
gcloud run services update year-hare --region asia-northeast3 \
  --set-env-vars AUTH_URL=https://<배포도메인>
```

**4) Google Cloud Console에 운영 redirect URI 등록** ⚠️ *이걸 빠뜨리면 로그인에서 `redirect_uri_mismatch`로 차단된다 (위 트러블슈팅 참고).*
OAuth 클라이언트 → **Authorized redirect URIs**에 추가:
```
https://<배포도메인>/api/auth/callback/google
```

**5) 확인** — 브라우저로 서비스 URL 접속 → "Google 계정으로 로그인" → 허용된 이메일로 통과되는지 확인.

> 🔒 브라우저 접근을 Google 계정으로 한 번 더 보호하려면 Cloud Run 앞에 **IAP**를 켠다 → **9번-3)** 참고.
> 🔁 코드 수정 후 재배포는 **2)** 명령만 다시 실행하면 된다 (시크릿·env는 유지됨).

### 🚧 트러블슈팅: Google 로그인 시 "액세스 차단됨" (`redirect_uri_mismatch`)

**증상** — "Google 계정으로 로그인" 버튼을 누르면 앱이 아니라 Google의 빨간 **"액세스 차단됨 / Error 400: redirect_uri_mismatch"** 페이지가 뜬다.

**원인** — 코드 문제가 아니다. 앱(NextAuth)은 표준 redirect URI `http://localhost:3000/api/auth/callback/google` 를 정확히 보내지만, 이 URI가 Google Cloud Console의 OAuth 클라이언트에 **등록되어 있지 않아서** Google이 차단한다.

**해결** — [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **API 및 서비스 → 사용자 인증 정보** → `AUTH_GOOGLE_ID`와 일치하는 **OAuth 2.0 클라이언트 ID** 열기:

1. **승인된 리디렉션 URI(Authorized redirect URIs)** 에 아래를 **정확히** 추가 (끝 슬래시 없음):
   ```
   http://localhost:3000/api/auth/callback/google
   ```
2. (권장) **승인된 JavaScript 원본**에 `http://localhost:3000` 추가
3. **저장** 후 1~2분 기다렸다가 다시 로그인
4. 배포 시에는 운영 도메인용도 추가: `https://<배포도메인>/api/auth/callback/google`

> 💡 앱이 실제로 보내는 redirect URI는 다음으로 확인할 수 있다:
> `curl -s -c /tmp/c -b /tmp/c http://localhost:3000/api/auth/csrf` 로 토큰을 받은 뒤
> `/api/auth/signin/google` 에 POST 하면 `Location` 헤더의 `redirect_uri=` 값이 보인다.

### 현재 구현된 것 (v0)
- **Google 로그인** (NextAuth/Auth.js v5) — 허용 이메일만 통과
  - `auth.ts` — Google provider + 이메일 allowlist
  - `app/api/auth/[...nextauth]/route.ts` — 인증 라우트
  - `app/page.tsx` — 서버 컴포넌트 로그인 게이트(미로그인 시 로그인 화면, 로그인 시 상단바+대시보드)
- `app/Dashboard.tsx` — 입력 폼 + 현재 수익성 표 + 시나리오 전망 (클라이언트, 인메모리)
- `app/api/prices/route.ts` — CoinGecko 현재가 프록시 (`/api/prices?ids=bitcoin,ethereum&vs=usd`)
- `lib/coins.ts` — 심볼→CoinGecko id 매핑 + 손익/전망 계산 헬퍼

### 아직 안 된 것
- Excel 업로드 (R5) · 데이터 영속화(새로고침 시 초기화) · GCP 배포 · Verex 연동(R8)

---

## 1. 한 줄 소개 (Elevator pitch)

내 포트폴리오 데이터를 넣으면, **지금 얼마나 수익이 났는지**를 요약하고
**앞으로의 수익 전망**까지 보여주는 개인 투자 요약 도구. (PoC)

---

## 2. 목표 & 비목표 (Goals / Non-goals)

**목표 (Goals)**
- 내 **암호화폐** 포트폴리오 데이터를 입력 → 현재 수익성(profitability) 요약
- 미래 수익 전망(prospect/forecast) 제시
- 일단 동작하는 것을 보여주는 **PoC** 수준 (완성 제품 아님)

**비목표 (Non-goals)** — 이번엔 안 함
- 실거래/주문 실행 (조회·요약만, 매매 X)
- 다중 사용자/계정 시스템
- (확정 예정)

---

## 3. 요구사항 (Requirements)

| # | 요구사항 | 분류 | 상태 | 메모 |
|---|----------|------|------|------|
| R1 | 내 투자를 요약해주는 PoC 레포 | feat | 🔨 | 핵심 아이디어 |
| R2 | 현재 포트폴리오 데이터를 입력받는 **입력 창(input window)** | UX | ✅ | v0 구현 (수동 입력) |
| R3 | 현재 **수익성** 표시 (얼마나 벌었는지) | feat | ✅ | v0 구현 (손익/수익률) |
| R4 | 미래 **수익 전망** 표시 (prospect/forecast) | feat | ✅ | v0 구현 (시나리오 3종) |
| R5 | 초기 데이터 입력 = **Excel 업로드 또는 입력 창에서 직접 입력** | data | 🔨 | 수동 입력 ✅ / Excel 후속 → Q1 |
| R6 | 대상 자산 = **암호화폐(crypto) 전용** | constraint | ✅ | 주식·ETF 등 제외 |
| R7 | 형태 = **웹사이트(web app)** | UX | ✅ | Q4 해결 |
| R8 | **Verex 프로젝트와 연동** | infra | 🆕 | 연동 방식 미정 → Q7 |
| R9 | **GCP에 배포** | infra | 🆕 | 서비스 선택 → Q8 |
| R10 | **보호된 접근** — jay 본인만 | constraint | ✅ | v0: **앱 내 Google 로그인**(NextAuth)+이메일 allowlist. IAP는 배포 시 선택적 2차 방어 |

**분류**: `기능(feat)` · `제약(constraint)` · `UX` · `데이터(data)` · `인프라(infra)` · `비기능(NFR)`
**상태**: 🆕 신규 · 🔨 진행 · ✅ 완료 · ❄️ 보류 · ❌ 폐기

---

## 4. 결정 로그 (Decision log)

| 날짜 | 결정 | 이유 | 대안(버린 것) |
|------|------|------|---------------|
| 2026-06-04 | 폴더명 `hare` → `year-hare` | jay 요청 | `hare` |
| 2026-06-04 | PoC로 시작 (완성 제품 아님) | 아이디어 빠른 검증 | 처음부터 풀스택 |
| 2026-06-04 | 대상 자산 = 암호화폐 전용 | jay 요청 (범위 축소) | 주식·ETF 등 멀티자산 |
| 2026-06-04 | 초기 데이터 = Excel + 직접 입력 둘 다 | jay 요청 | 한쪽만 지원 |
| 2026-06-04 | 형태 = 웹사이트, GCP 배포, Verex 연동 | jay 요청 | 데스크톱/CLI |
| 2026-06-04 | 배포 = GCP Cloud Run (추천) | 컨테이너 1개·비용 0·HTTPS 자동 | App Engine, GKE |
| 2026-06-04 | 스택 = TypeScript/Next.js (경로 B) | Verex가 TS 모노레포라 정렬 | Python/Streamlit(경로 A) |
| 2026-06-04 | 인증 = GCP IAM/IAP (앱 세션 없음), jay 본인만 | "세션 없음, 본인 모니터링" 요구 충족·코드 최소 | NextAuth 세션, 비밀번호 |
| 2026-06-04 | **인증 변경** = 앱 내 **Google 로그인**(NextAuth)+이메일 allowlist | jay 요청 "Google 로그인 기능 추가". 로컬에서도 동작·로그인 UI 제공. IAP는 배포 시 선택적 2차 | IAP만(세션 없음) |

---

## 5. 미해결 질문 (Open questions)

> 다음에 정하면 좋은 것들. 답이 정해지면 요구사항/결정 로그로 옮긴다.

> 각 질문에 👉 **추천안**을 달았다. 별다른 의견 없으면 이 추천대로 진행.

- **Q1. Excel 컬럼 구조**
  👉 **추천**: `symbol`(BTC), `quantity`(0.5), `avg_buy_price`(USD), `buy_date`(YYYY-MM-DD) 4개 필수 + `exchange` 선택.
  이 4개면 평가손익 계산에 충분. 샘플 `.xlsx` 템플릿은 PoC에 동봉.
- ~~Q2. 자산 종류~~ → ✅ **암호화폐 전용** (R6)
- **Q3. "미래 수익 전망" 방식**
  👉 **추천**: **시나리오 3종(보수/기본/낙관)** = 사용자가 연 성장률 가정(예: -20% / +30% / +100%)을 넣으면 1년 후 평가액을 단순 계산.
  + 선택적으로 과거 데이터 기반 CAGR 자동 제안. (LLM 코멘트는 후순위) — *예측은 가정일 뿐, 투자 조언 아님 명시.*
- ~~Q4. 형태~~ → ✅ **웹사이트(web app)** (R7)
- **Q7. Verex 연동 방식** — "connected to Verex"가 구체적으로 무엇인가요?
  ① 같은 도메인/모노레포에 메뉴로 합치기 ② Verex API에서 데이터 가져오기 ③ 로그인/계정 공유(SSO) ④ 단순 링크 연결.
  👉 **추천**: 우선 PoC는 **독립 서비스**로 만들고, Verex와 **같은 스택·같은 GCP 프로젝트**에 두어 나중에 합치기 쉽게. (→ Q9: Verex 기술 스택 확인 필요)
- **Q8. GCP 배포 방식**
  👉 **추천**: **Cloud Run** (컨테이너 1개, 트래픽 0이면 비용 0, HTTPS 자동). Streamlit·FastAPI·Next 무엇이든 Docker로 올리면 됨. *(대안: App Engine, GKE — PoC엔 과함)*
- ~~Q9. Verex 기술 스택~~ → ✅ **확인됨** (`/Users/jay/work/verex`):
  pnpm + Turborepo (TS) 모노레포. `web`=Next.js+React+wagmi+viem, `api`=Fastify, `sdk`=`@verex/sdk`(viem), `contracts`, `cli`.
  → **결론: 경로 B (Next.js/TypeScript) 채택.** Python/Streamlit은 통합 불리.
- **Q10. year-hare를 어디에 둘까** — ① **Verex 모노레포에 새 패키지** `packages/year-hare`(또는 `packages/web` 내 라우트)로 추가 ② **별도 레포**로 만들되 `@verex/sdk` 의존.
  👉 **추천**: 통합·시세/체인 데이터 재사용을 생각하면 **① Verex 모노레포 내 새 패키지**. 단, PoC 독립성을 원하면 ②.
- **Q5. 실시간 시세**
  👉 **추천**: **CoinGecko 무료 API** (API 키 불필요)로 현재가 조회 → 평가손익 자동 계산. 오프라인 대비 수동 입력도 폴백으로 허용.
- **Q6. 기준 통화**
  👉 **추천**: **USD 기준** 계산 (크립토 표준), 화면에 **KRW 환산** 병기 옵션.

---

## 6. 용어 (Glossary)

| 용어 | 뜻 |
|------|----|
| year-hare | 프로젝트 코드명 (토끼해 = 2023? 네이밍 의도 확정 예정) |
| PoC | Proof of Concept — 아이디어가 되는지 보여주는 최소 검증판 |
| profitability | 현재까지의 수익성 (손익·수익률) |
| prospect | 미래 수익 전망 |

---

## 8. 추천 기술 스택 (Recommended stack) — ✅ 확정 (Verex 정렬)

Verex가 TypeScript 모노레포(Next.js+Fastify+viem)이므로 거기에 **맞춰** 정한다.

| 영역 | 선택 | 이유 |
|------|------|------|
| 언어 | **TypeScript** | Verex와 동일, `@verex/sdk` 재사용 |
| UI | **Next.js + React** | Verex `packages/web`와 동일 스택 |
| Excel 읽기 | **SheetJS (`xlsx`)** | 브라우저/Node에서 `.xlsx` 파싱 |
| 시세 | **CoinGecko 무료 API** | 키 불필요, 크립토 현재가 |
| 차트 | **Recharts** (또는 Tremor) | React 친화 |
| 배포 | **GCP Cloud Run** (Docker, Next standalone) | 컨테이너 1개·비용 0·HTTPS 자동 |
| 위치 | **Verex 모노레포 새 패키지** `packages/year-hare` (추천) | 통합·코드 재사용 (→ Q10) |

> 화면 흐름(초안): **① Excel 업로드 또는 직접 입력 → ② 현재 평가손익 요약 → ③ 시나리오별 미래 전망**

---

## 9. GCP 배포 방법 (Deploy)

**확정**: 언어 **TypeScript**, 프레임워크 **Next.js (App Router)**, 배포 **GCP Cloud Run**.
Cloud Run = 컨테이너 1개를 올리면 끝. 트래픽 없으면 0으로 축소(비용 0), HTTPS 자동.

### 1) Next.js를 standalone으로 빌드
`next.config.js`에 한 줄:
```js
// next.config.js
module.exports = { output: 'standalone' }
```

### 2) Dockerfile (멀티스테이지, 가벼운 런타임)
```dockerfile
# build
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# run
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
```
> Cloud Run은 `$PORT`(기본 8080)로 요청을 보낸다 → Next standalone 서버가 이 포트를 듣게 함.

### 3) 배포 — 보호된 접근 (앱 세션 없음, jay 본인만)
```bash
gcloud run deploy year-hare \
  --source . \
  --region asia-northeast3 \         # 서울 리전
  --no-allow-unauthenticated         # 🔒 공개 X — IAM/IAP로만 접근
```
> `--source .`는 Cloud Build가 Dockerfile로 자동 빌드→Artifact Registry 푸시→Cloud Run 배포까지 한 번에. 끝나면 `https://...run.app` URL이 나온다.

**브라우저에서 Google 로그인으로 접근 (IAP, 앱 세션 코드 0)**
브라우저로 접속하려면 Cloud Run 앞에 **IAP(Identity-Aware Proxy)** 를 켠다. 그러면 Google 로그인 페이지가 뜨고, 허용된 계정(jay)만 통과한다. 앱은 인증을 전혀 신경 쓰지 않는다.
```bash
# IAP 켜고, 내 계정만 접근 허용
gcloud run services update year-hare --region asia-northeast3 --iap
gcloud run services add-iam-policy-binding year-hare \
  --region asia-northeast3 \
  --member="user:linked0@gmail.com" \
  --role="roles/iap.httpsResourceAccessor"
```
> 헤더 `X-Goog-Authenticated-User-Email`로 누가 접속했는지 앱이 읽을 수도 있다(원하면). 기본은 그냥 jay만 통과 = 세션 불필요.

### 3-대안) 명시적 빌드/푸시 (CI에 적합)
```bash
gcloud builds submit --tag asia-northeast3-docker.pkg.dev/PROJECT/REPO/year-hare
gcloud run deploy year-hare --image asia-northeast3-docker.pkg.dev/PROJECT/REPO/year-hare --region asia-northeast3
```

### 4) 환경변수 / 비밀값 (배포 시 필수)
앱 내 Google 로그인을 쓰므로 Cloud Run에도 인증 env를 넣어야 한다:
```bash
gcloud run deploy year-hare \
  --set-env-vars ALLOWED_EMAILS=linked0@gmail.com,AUTH_URL=https://<배포도메인> \
  --set-secrets AUTH_SECRET=auth-secret:latest,AUTH_GOOGLE_ID=google-id:latest,AUTH_GOOGLE_SECRET=google-secret:latest
```
> ⚠️ 배포 후 Google Cloud Console의 OAuth 클라이언트 **Authorized redirect URI**에
> `https://<배포도메인>/api/auth/callback/google` 를 추가해야 로그인 콜백이 동작한다.

> **사전 준비(1회)**: `gcloud auth login`, 프로젝트 지정(`gcloud config set project PROJECT`),
> `run.googleapis.com`·`cloudbuild.googleapis.com`·`artifactregistry.googleapis.com` API 활성화.

> 모노레포(`packages/year-hare`)에 둘 경우: 빌드 컨텍스트를 레포 루트로 잡고
> Dockerfile에서 해당 패키지만 빌드(turbo `--filter=year-hare`)하도록 조정.

---

## 10. 다음 할 일 (Next steps)

- [ ] 남은 추천안 확인 → 특히 **Q10**(모노레포 새 패키지 vs 별도 레포) 결정
- [ ] 샘플 Excel 템플릿 만들기 (symbol·quantity·avg_buy_price·buy_date)
- [ ] Next.js 스켈레톤: 입력 → 현재 수익 요약 → 미래 전망 화면
- [ ] CoinGecko 현재가 조회 연동
- [ ] Dockerfile + Cloud Run 배포 설정

---

_이 문서는 jay의 요구사항이 들어올 때마다 갱신된다._
