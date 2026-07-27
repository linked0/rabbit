import Link from "next/link";
import { googleEnabled } from "@/auth";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { safeCallbackUrl } from "@/lib/callback-url";
import GoogleSignInButton from "./GoogleSignInButton";

export const dynamic = "force-dynamic";

// 로그인 페이지 (plan §2). Google 하나뿐 — LOCAL_PASSWORD 비밀번호 폼은 삭제했다
// (2026-07-27, jay). 오너 판정이 allowlist 전용이라 비밀번호 로그인은 아무것도 열어주지
// 못하는 죽은 경로였다. Google 버튼은 OAuth 자격증명이 있으면 로컬에서도 뜬다.
// 실제 로그인 호출은 클라이언트(GoogleSignInButton)에서 한다 — 이유는 그 파일 주석 참고.
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string };
}) {
  const google = googleEnabled();
  const lang = getLang();
  // 로그인 후 돌아갈 곳 — 미들웨어가 붙여준 원래 경로, 없으면 /summary.
  const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);

  return (
    <main>
      {/* 나가는 문 — 로그인하지 않고 빠져나올 수 있어야 한다 (2026-07-27, jay).
          callbackUrl 로 되돌리지 않고 홈으로 보낸다: 미들웨어가 보호 라우트에서 튕겨낸
          경우라면 callbackUrl 이 다시 /login 으로 리다이렉트돼 제자리걸음이 되기 때문. */}
      <p style={{ marginBottom: 8 }}>
        <Link href="/" className="ghost">
          ← {pick(lang, "홈으로", "Back to home")}
        </Link>
      </p>
      <h1>🐇 rabbit</h1>
      <p className="sub">
        {pick(lang, "로그인하면 보던 페이지로 돌아갑니다.", "Signing in takes you back to the page you came from.")}
      </p>
      <section className="panel" style={{ maxWidth: 440 }}>
        <h2>{pick(lang, "로그인", "Sign in")}</h2>
        {google ? (
          <div>
            <p className="muted" style={{ marginBottom: 16 }}>
              {pick(lang, "Google 계정으로 로그인하세요. 허용된 계정만 접근할 수 있습니다.", "Sign in with Google. Only allowed accounts can access.")}
            </p>
            <GoogleSignInButton
              callbackUrl={callbackUrl}
              label={pick(lang, "Google 계정으로 로그인", "Sign in with Google")}
            />
          </div>
        ) : (
          // AUTH_GOOGLE_ID/SECRET 미설정 — 예전엔 비밀번호 폼이 대신 떴지만 이제 없다.
          // 빈 패널을 내놓느니 왜 로그인할 수 없는지 알려준다.
          <p className="err">
            {pick(
              lang,
              "Google 로그인이 설정되지 않았습니다 — AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET 를 넣어주세요.",
              "Google sign-in is not configured — set AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET.",
            )}
          </p>
        )}
        {searchParams.error && (
          <p className="err">{pick(lang, "로그인 실패 — 다시 시도하세요.", "Sign-in failed — please try again.")}</p>
        )}
      </section>
    </main>
  );
}
