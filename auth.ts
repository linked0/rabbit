import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// 허용 이메일 allowlist. ALLOWED_EMAILS="a@x.com,b@y.com" (콤마 구분)
// 비어 있으면(미설정) 누구나 로그인 허용 — 운영 시 반드시 설정할 것.
const ALLOWED = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// 세션 유지 시간(초) — 기본 1시간 (plan §2)
const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE) || 3600;

// 이 세션이 사이트 오너(= ALLOWED_EMAILS 에 든 구글 계정)인가.
// 오너 판정은 모드와 무관하게 allowlist 하나로만 한다 (2026-07-27, jay).
// 예전엔 로컬을 "로그인했으면 오너"로 봐줬는데(LOCAL_PASSWORD 로 이미 통제되니까),
// 그러면 로컬과 운영의 메뉴가 서로 달라져서 로컬에서 본 화면을 믿을 수가 없었다.
export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  if (ALLOWED.length === 0) return true; // allowlist 미설정 → 전체 허용 (signIn 콜백과 동일)
  return ALLOWED.includes(email.toLowerCase());
}

// Google 로그인 가능 여부 — OAuth 자격증명이 있으면 로컬에서도 쓴다 (2026-07-25, jay).
// 예전엔 cloud 모드에서만 Google 을 켰는데, 그러면 로컬에서 실제 구글 로그인 흐름
// (allowlist·오너 판정 포함)을 그대로 재현할 수가 없었다. 로컬에서 쓰려면 OAuth 클라이언트에
// http://localhost:3100/api/auth/callback/google 리디렉션 URI 가 등록돼 있어야 한다.
export function googleEnabled(): boolean {
  return !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;
}

// 프로바이더는 Google 하나뿐이다 (2026-07-27, jay — LOCAL_PASSWORD 프로바이더 삭제).
// 오너 판정이 allowlist 전용이 되면서 비밀번호 로그인(local@rabbit)은 어차피 오너가 될 수
// 없었다 — 남겨두면 아무 권한도 없는 로그인 상태만 만들어내는 죽은 경로였다.
const providers = [
  ...(googleEnabled() ? [Google] : []), // AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET 자동 사용
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // 로컬 임의 포트 + Cloud Run 프록시 뒤에서 Host 헤더 신뢰
  providers,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: { signIn: "/login" },
  callbacks: {
    // Google 로그인 성공 후, 허용된 이메일만 통과
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      const email = profile?.email?.toLowerCase();
      if (ALLOWED.length === 0) return true; // allowlist 미설정 → 전체 허용
      return !!email && ALLOWED.includes(email);
    },
  },
});
