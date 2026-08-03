import { auth, isOwnerEmail } from "@/auth";

// 라우트 가드. 공개 표면은 딱 여기 적힌 것뿐이고, 나머지는 전부 오너
// (= ALLOWED_EMAILS 의 구글 계정) 로그인 필요 → 아니면 /login (2026-07-25, jay).
// app/Nav.tsx 의 `pub` 플래그와 짝을 이룬다 — 메뉴에서 숨긴 페이지는 URL 직접 입력도 막힌다.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/etc", // PoCs 허브 — Market/XYZ 를 여기로 통합 (Nav pub, 2026-08-03)
  "/til", // TIL 허브 — Today I Learned, PoCs와 같은 카드 포맷 (Nav pub, 2026-08-03)
  "/market", // 공개 시세만 — 메뉴에선 PoCs 허브 카드로만 노출 (라우트는 그대로 공개)
  "/xyz", // C4 관찰자 대시보드 — 공개 데이터만 (메뉴에선 PoCs 허브 카드로만 노출)
  "/api/relay", // /xyz 용 공개 relay 프록시 (키 불필요)
  "/api/indices", // /market 의 지수 카드용 — 공개 시세, 업스트림 60초 캐시
  "/api/orderbook", // /market 의 Hyperliquid L2 북용 — 공개 info API
  "/projects", // 수행 프로젝트 — 홈에 있던 피처드/프로젝트 전체 (Nav pub, 로그인 불필요)
  "/api/jay-chat", // 홈에 통합된 Jay Chat 의 API — 전용 키 + 시간당 토큰 예산 + 버스트 가드로 보호됨
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  // /home(= www.jaylabs.xyz 홈, Task 5)은 공개 — 정확히 /home 과 /home/* 만 (느슨한 prefix 방지)
  const isHome = pathname === "/home" || pathname.startsWith("/home/");
  if (PUBLIC_PATHS.has(pathname) || isHome || pathname.startsWith("/api/auth/")) return;
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
