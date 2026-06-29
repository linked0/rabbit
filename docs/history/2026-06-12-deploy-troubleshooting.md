# 2026-06-12 — Cloud Run 첫 배포 트러블슈팅 기록

배포 명령: `./scripts/deploy.sh` (프로젝트 `doubletree-498007`, 리전 `asia-northeast3`, 서비스 `rabbit`)
최종 서비스 URL: **https://rabbit-fimfrbyasa-du.a.run.app**

순서대로 만난 오류 3개와 수정 내역. 모두 `claude/rabbit-deploy-script` 브랜치에 커밋됨.

## 1. 빌드 실패 — `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`

- **증상**: Cloud Build의 `pnpm install --frozen-lockfile` 단계에서 크래시.
- **원인**: Dockerfile 베이스가 `node:20-slim`인데 `corepack enable`이 버전 고정 없이 최신 pnpm(11.6.0)을 다운로드. pnpm 11.6은 Node ≥22.13 필수(`node:sqlite` 내장 모듈 사용 — Node 20에 없음). 로컬은 pnpm 11.5.1 직접 설치라 재현 안 됐음.
- **수정** (`b175edb`): 베이스 이미지를 `node:22-slim`(LTS)으로 올리고, `package.json`에 `"packageManager": "pnpm@11.5.1"` 고정 — Docker와 로컬이 같은 pnpm을 쓰도록.

## 2. 리비전 생성 실패 — Secret Manager `Permission denied`

- **증상**: 빌드는 성공, `Setting IAM Policy...` 직전 리비전 생성에서 시크릿 5개 전부 `Permission denied on secret`.
- **원인**: Cloud Run 리비전이 사용하는 기본 컴퓨트 서비스 계정(`<PROJECT_NUMBER>-compute@developer.gserviceaccount.com`)에 `roles/secretmanager.secretAccessor`가 없음.
- **수정** (`773dfb0`): `deploy.sh`의 `upsert_secret`이 시크릿별로 `gcloud secrets add-iam-policy-binding`을 수행하도록 변경(멱등, 최소 권한). Console 수동 작업 불필요 — 재실행만으로 해결.

## 3. 운영 Google 로그인 차단 — `Error 400: redirect_uri_mismatch`

- **증상**: 배포된 페이지에서 "Sign in with Google" 클릭 시 Google이 "Access blocked: This app's request is invalid" 표시.
- **원인**: 코드 문제 아님. NextAuth가 보내는 운영 redirect URI가 OAuth 클라이언트에 미등록 (README 트러블슈팅 섹션의 운영판 — 배포마다가 아니라 **최초 1회만** 필요한 수동 단계).
- **수정** (Console 수동): [Credentials](https://console.cloud.google.com/apis/credentials) → `AUTH_GOOGLE_ID`와 일치하는 OAuth 2.0 클라이언트 → **Authorized redirect URIs**에 추가:
  ```
  https://rabbit-fimfrbyasa-du.a.run.app/api/auth/callback/google
  ```
  (권장: **Authorized JavaScript origins**에 `https://rabbit-fimfrbyasa-du.a.run.app`도 추가. 저장 후 반영까지 1~2분.)

## 예방 조치

- `.gcloudignore` 추가 (`a6904ca`): rabbit 자체 `.gitignore`는 `.env*.local`만 제외해서 `gcloud run deploy --source`가 실제 시크릿이 든 `.env`를 Cloud Build에 업로드할 수 있었음 — `.env*` 전체를 업로드에서 차단. 시크릿은 Secret Manager로만 전달.
