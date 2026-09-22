# 2026-09-10 — jayverse-number 작업 이력

> 소스 문서: [docs/features/jayverse-number.md](../features/jayverse-number.md) ·
> 허브 [README.md](../features/README.md) (#9)
> 저장소: `~/work/jayverse-number` (신규 · 비공개 GitHub `linked0/jayverse-number`)

### 저장소 탄생 — Portfolio 를 rabbit 에서 독립 프로젝트로 분리

**Cause:** jay: "Portfolio 를 rabbit 에서 빼 독립 프로젝트로. 투자 정보 + 수학·경제·알고리즘
연구. URL 은 number.jaylabs.xyz(처음엔 cash 였으나 두 번의 후속 요청으로 number 로 변경),
관리자 전용, rabbit GCP 에서 돌리고 배포해도 된다. UI 는 rabbit 과 비슷하게."

**Reasoning:** rabbit 은 공개 포털(포트폴리오+PoC, 익명 방문자), 투자 화면은 비공개·개인용이라
한 앱이 공개-읽기와 관리자-전용을 동시에 떠안는 모순이 있었다. 분리가 그걸 해소한다. 새 chain
이나 토큰 없이 rabbit 셸(Next.js App Router·테마 토큰)만 맞춰 "한 가족" 느낌을 유지.

**Change:** 최소 실행 셸 스캐폴딩 — `package.json`(dev :3090), `tsconfig`, `next.config.mjs`
(output: standalone), rabbit 테마 토큰 이식한 `app/globals.css`·`layout.tsx`·`page.tsx`
(세 갈래: 투자정보·수학/경제·알고리즘 연구 + "scaffold" 안내). `git init` → 비공개 GitHub
저장소 생성·푸시. rabbit 쪽엔 설계 문서 `jayverse-number.md` 로 결정·호스팅·다음 단계 기록.

**Result:** `pnpm build` 통과(정적 4라우트), tsc 클린. 다음 단계: ①관리자 인증 게이트(구글 +
ALLOWED_EMAILS, rabbit auth/middleware 미러) ②Portfolio 코드 이전 ③deploy.sh.

### Cloud Run 배포 + number.jaylabs.xyz 도메인 매핑

**Cause:** jay: "number 프로젝트의 URL 만들고 배포해라."

**Reasoning:** rabbit 과 같은 GCP 프로젝트(`doubletree-498007`)·리전(asia-northeast1, 도쿄 —
서울은 Cloud Run 도메인 매핑 미지원)에 자기만의 Cloud Run 서비스로 올린다. jaylabs.xyz 는 같은
프로젝트의 Cloud DNS 존이 관리하므로 DNS 레코드도 직접 추가 가능. 아직 앱 레벨 인증이 없어
플랫폼에선 `--allow-unauthenticated` 로 공개(스캐폴드라 민감 정보 없음).

**Change:** `Dockerfile`(멀티스테이지 Next standalone, rabbit 미러에서 Prisma 제거)·
`.dockerignore` 추가. `gcloud run deploy jayverse-number --source .` (Cloud Build).
`gcloud beta run domain-mappings create` 로 number.jaylabs.xyz 매핑, Cloud DNS 존 `jaylabs-xyz`
에 `number CNAME ghs.googlehosted.com.` 추가.

**Result:** 서비스 라이브 — `https://jayverse-number-...run.app` 200. 도메인 매핑 생성,
CNAME 등록 완료. TLS 인증서는 DNS 전파 후 자동 발급(수분~1시간). ⚠️ 미완: 앱 레벨 관리자
인증 게이트 — 그 전까지 number.jaylabs.xyz 는 사실상 공개(현재는 스캐폴드 랜딩뿐).
