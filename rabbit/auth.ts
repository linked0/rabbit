import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { appMode } from "@/lib/mode";

// 허용 이메일 allowlist. ALLOWED_EMAILS="a@x.com,b@y.com" (콤마 구분)
// 비어 있으면(미설정) 누구나 로그인 허용 — 운영 시 반드시 설정할 것.
const ALLOWED = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// 세션 유지 시간(초) — 기본 1시간 (plan §2)
const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE) || 3600;

// 모드별 프로바이더 (plan §2)
// cloud → Google OAuth + 이메일 allowlist / local → LOCAL_PASSWORD 단일 비밀번호
const providers =
  appMode() === "cloud"
    ? [Google] // AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET 환경변수 자동 사용
    : [
        Credentials({
          credentials: { password: { label: "비밀번호", type: "password" } },
          authorize(credentials) {
            const expected = process.env.LOCAL_PASSWORD;
            if (!expected) return null; // 미설정 → 로그인 불가
            if (credentials?.password !== expected) return null;
            return { id: "local", name: "local user", email: "local@rabbit" };
          },
        }),
      ];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // 로컬 임의 포트 + Cloud Run 프록시 뒤에서 Host 헤더 신뢰
  providers,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: { signIn: "/login" },
  callbacks: {
    // Google 로그인 성공 후, 허용된 이메일만 통과 (local credentials는 통과)
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      const email = profile?.email?.toLowerCase();
      if (ALLOWED.length === 0) return true; // allowlist 미설정 → 전체 허용
      return !!email && ALLOWED.includes(email);
    },
  },
});
