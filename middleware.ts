import { auth } from "@/auth";

// 라우트 가드 (plan §2): 공개 랜딩/로그인 외 전부 인증 필요 → 미인증 시 /login
// Target IA 메뉴는 전부 보인다. 단, 진입 시 로그인 필요: /portfolio, /chat.
const PUBLIC_PATHS = new Set([
  "/",
  "/know.html",
  "/login",
  "/game",
  "/market",
  "/ap2",
  "/xyz",
  "/etc",
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  // /home(= www.jaylabs.xyz 홈, Task 5)은 공개 — 정확히 /home 과 /home/* 만 (느슨한 prefix 방지)
  const isHome = pathname === "/home" || pathname.startsWith("/home/");
  if (PUBLIC_PATHS.has(pathname) || isHome || pathname.startsWith("/api/auth/")) return;
  if (!req.auth?.user) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  // Next 정적 리소스/아이콘(파비콘·App Router icon) 제외, 나머지 전부 미들웨어 통과
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|profile/).*)"],
};
