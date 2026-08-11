import { auth, isOwnerEmail } from "@/auth";

// 라우트 가드. 공개 표면은 딱 여기 적힌 것뿐이고, 나머지는 전부 오너
// (= ALLOWED_EMAILS 의 구글 계정) 로그인 필요 → 아니면 /login (2026-07-25, jay).
// app/Nav.tsx 의 `pub` 플래그와 짝을 이룬다 — 메뉴에서 숨긴 페이지는 URL 직접 입력도 막힌다.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/live", // 라이브 허브 — 돌아가는 카드만 (Nav pub, 2026-08-11)
  "/algorithms", // 알고리즘 허브 — 수학·알고리즘 노트 (Nav pub, 2026-08-11)
  "/poc", // PoCs 허브 — 만들고 있는 것 + TIL 섹션 (Nav pub, 2026-08-03)
  "/til", // → /poc 리다이렉트 (2026-08-11). 공유된 링크가 /login 으로 튀지 않도록 공개 유지.
  "/market", // 공개 시세만 — 메뉴에선 PoCs 허브 카드로만 노출 (라우트는 그대로 공개)
  "/xyz", // C4 관찰자 대시보드 — 공개 데이터만 (메뉴에선 PoCs 허브 카드로만 노출)
  "/api/relay", // /xyz 용 공개 relay 프록시 (키 불필요)
  "/api/indices", // /market 의 지수 카드용 — 공개 시세, 업스트림 60초 캐시
  "/api/orderbook", // /market 의 Hyperliquid L2 북용 — 공개 info API
  "/projects", // 수행 프로젝트 — 홈에 있던 피처드/프로젝트 전체 (Nav pub, 로그인 불필요)
  "/api/jay-chat", // 홈에 통합된 Jay Chat 의 API — 전용 키 + 시간당 토큰 예산 + 버스트 가드로 보호됨
  "/poc/ap2", // AP2 — Stripe 정산 데모 (test mode) — 메뉴에선 PoCs 허브 카드로만 노출 (라우트는 공개)
  "/api/ap2/checkout", // /poc/ap2 용 Stripe Checkout 세션 생성 — 공개(로그인 불필요, 테스트 결제만)
  "/poc/toss", // Toss Payments — KRW 정산 데모 (test mode) — /poc/ap2와 동일하게 PoCs 허브 카드로만 노출
  "/poc/aa", // AA — ERC-7702/7715 세션 키 + Agentic AA 4대 요소 데모 (Sepolia) — PoCs 허브 카드로만 노출
  "/poc/7702", // EIP-7702 계정 인스펙터 — 읽기 전용(eth_getCode), PoCs 허브 카드로만 노출
  "/poc/dvt", // DVT 프로토콜 흡수 제안 정독 노트 — 정적 설명 페이지
  // 자율 결제 에이전트 — 아직 구현 전이라 각본만 도는 목업. 카드가 "준비 중"이라 허브에서
  // 링크되지 않고 URL로만 들어온다. 논의 중 공유하려면 로그인 없이 열려야 해서 공개로 둔다.
  "/poc/agent",
  // OpenZeppelin Relayer·Monitor — 역시 각본만 도는 목업. 카드에서 링크되므로 공개가 아니면
  // 허브에서 눌렀을 때 /login 으로 튄다 (2026-08-11에 실제로 그랬다).
  "/poc/oz-relayer",
  // TIL 상세 — LMSR/하이브리드 AMM 정독 노트. 읽기 전용 정적 페이지라 /til 과 함께 공개.
  "/til/lmsr-hybrid-amm",
]);

// /poc 아래는 전부 공개다 (2026-08-11).
//
// 원래 이 파일의 규칙은 "명시적 허용 목록, prefix 매칭 금지"였고, 그래서 /poc/aa/scenarios/*
// 4개까지 손으로 적어 두었다. 그 규칙을 여기서만 푼다 — 이유는 두 번 데였기 때문이다:
// /poc/oz-relayer 를 추가하며 빠뜨려 /login 으로 튀었고, 카드 상세 동적 라우트(/poc/[key])는
// 애초에 손으로 적을 수가 없다(카드가 늘면 경로도 는다). 목록과 라우트가 갈라지는 실패는
// 빌드에도 tsc 에도 안 잡히고 배포 후에야 보인다.
//
// 안전한 이유: /poc 서브트리는 **설계상 전부 공개**다. 데모 허브이고, 오너 전용 데이터를
// 다루는 페이지가 여기 들어올 일이 없다. 비공개가 필요한 페이지가 생기면 /poc 밖에 두거나
// 아래에 예외를 명시할 것 — 그 순간 이 주석이 그 결정을 다시 꺼내 준다.
const isPublicPocPath = (p: string) => p === "/poc" || p.startsWith("/poc/");

export default auth((req) => {
  const { pathname } = req.nextUrl;
  // /home(= www.jaylabs.xyz 홈, Task 5)은 공개 — 정확히 /home 과 /home/* 만 (느슨한 prefix 방지)
  const isHome = pathname === "/home" || pathname.startsWith("/home/");
  if (PUBLIC_PATHS.has(pathname) || isHome || isPublicPocPath(pathname) || pathname.startsWith("/api/auth/")) return;
  if (!isOwnerEmail(req.auth?.user?.email)) {
    // 원래 가려던 곳을 들려보낸다 — 로그인 성공 후 여기로 돌려보내기 위해 (2026-07-27, jay).
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return Response.redirect(login);
  }
});

export const config = {
  // Next 정적 리소스/아이콘(파비콘·App Router icon) 제외, 나머지 전부 미들웨어 통과
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|profile/|whitepaper/).*)",
  ],
};
