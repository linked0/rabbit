import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// 허용 이메일 allowlist. ALLOWED_EMAILS="a@x.com,b@y.com" (콤마 구분)
// 비어 있으면(미설정) 누구나 로그인 허용 — 운영 시 반드시 설정할 것.
const ALLOWED = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google], // AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET 환경변수 자동 사용
  callbacks: {
    // Google 로그인 성공 후, 허용된 이메일만 통과
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      if (ALLOWED.length === 0) return true; // allowlist 미설정 → 전체 허용
      return !!email && ALLOWED.includes(email);
    },
  },
});
