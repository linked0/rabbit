# rabbit

> **PoC** — 암호화폐 포트폴리오 요약·전망 도구. Next.js + TypeScript + Prisma, GCP Cloud Run 배포.
> 설계·배포 상세 → [docs/rabbit-design.md](docs/rabbit-design.md) · 기능 설계 → [docs/features/](docs/features/README.md)

> 이 레포 **루트가 곧 앱**이다 (이전엔 `rabbit/` 하위였으나 평탄화됨).

---

## Setup (최초 1회)

```bash
pnpm install                      # 의존성 설치
cp .env.example .env        # 환경변수 — 아래 "로그인" 참고해 채우기
pnpm db:generate                  # Prisma 클라이언트 생성
```

### 로그인
로컬·운영 모두 **Google 로그인 하나뿐**이다 (2026-07-27 — `LOCAL_PASSWORD` 비밀번호 로그인 삭제).
`.env`에 `AUTH_SECRET`(`npx auth secret`), `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`,
`ALLOWED_EMAILS`(접근 허용 이메일, 콤마 구분)를 넣는다. 로컬에서 쓰려면 OAuth 클라이언트에
`http://localhost:3100/api/auth/callback/google` 리디렉션 URI 가 등록돼 있어야 한다.

### DB (투자입력·포트폴리오용 — Postgres)
```bash
docker run -d --name rabbit-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=rabbit -p 5432:5432 postgres:16
# .env → DATABASE_URL=postgresql://postgres:dev@localhost:5432/rabbit
pnpm db:push                      # Trade 테이블 생성 (이력 필요 시 pnpm db:migrate)
```

---

## Run

```bash
pnpm dev      # 개발 서버 → http://localhost:3100
pnpm build    # 프로덕션 빌드 (타입체크 포함)
pnpm start    # 빌드 결과 실행
```

---

## Test this site (수동 점검)

상단 메뉴는 **Target IA**(docs/features/README.md)를 따른다. **메뉴 항목은 로그인 없이도 전부 보이며**,
로그인은 **`/portfolio` · `/chat` 진입 시에만** 필요하다.

1. **홈 (`/`)** — 프로필 페이지(linked0.github.io 미러)가 뜬다: 프로필 사진 + 소개 + 프로젝트 그리드(썸네일 7개). `/home/<slug>` 상세는 **글 전체 본문**(`content/profile/<slug>.md`를 marked로 렌더 — 표·이미지 포함, 외부 링크 없음). `/`는 내부적으로 `/home`을 rewrite (URL은 `/` 유지). 상단 메뉴 전체 노출.
   - **다크/라이트 토글** — 우상단 ☀️/🌙 버튼으로 전환, `localStorage`에 저장(새로고침 유지).
2. **공개 메뉴 (로그아웃)** — `/knowledge`, `/game`, `/ap2`, `/xyz`, `/etc` 모두 로그인 없이 열린다.
3. **가드** — 로그아웃 상태에서 `/portfolio` · `/chat` 접근 시 `/login`으로 리다이렉트(302).
4. **로그인** — 우상단 `로그인` → Google 로그인(`ALLOWED_EMAILS` 계정) → 보던 페이지로 복귀, `/portfolio` · `/chat` 접근 가능.
5. **투자입력** — `/invest`에서 `Buy · BTC · 0.1 · 95000000` 추가 → Current Portfolio가 Upbit 시세로 자동 갱신(평가액·손익).
6. **요약** — `/summary` 카드(BTC·ETH·S&P 500·KOSPI) 60초 갱신 확인.
7. **빌드** — `pnpm build` 가 타입 에러 없이 통과.

> 지식·포트폴리오·AP2·XYZ·ETC 메뉴는 현재 **자리표시(stub) 페이지**다 — 설계는 `docs/features/`.

---

## Layout

| 경로 | 내용 |
|------|------|
| `app/` | Next.js App Router — 라우트·`Nav.tsx`(상단 메뉴)·페이지 |
| `lib/` | 도메인 로직 (Upbit 시세·포트폴리오 계산·DB·인증 모드) |
| `prisma/` | DB 스키마 (`Trade`) |
| `scripts/deploy.sh` | GCP Cloud Run 배포 (상세: docs/rabbit-design.md §9) |
| `ios/` | iPhone WKWebView 래퍼 앱 |
| `docs/` | 설계(`rabbit-design.md`)·기능(`features/`)·런북·히스토리 |
| `archive/` | 이전 학습·실험 자료 |

---

## Deploy

```bash
./scripts/deploy.sh               # GCP Cloud Run (재실행 안전)
```
사전 준비·시크릿·IAP·트러블슈팅(redirect_uri_mismatch 등)은 [docs/rabbit-design.md](docs/rabbit-design.md) 참고.
