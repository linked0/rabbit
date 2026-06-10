import { auth } from "@/auth";

// 라우트 가드 (plan §2): 공개 랜딩/로그인 외 전부 인증 필요 → 미인증 시 /login
const PUBLIC_PATHS = new Set(["/", "/know.html", "/login"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api/auth/")) return;
  if (!req.auth?.user) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  // Next 정적 리소스/파비콘 제외, 나머지 전부 미들웨어 통과
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
