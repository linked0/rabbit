import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { googleEnabled, signIn } from "@/auth";
import { appMode } from "@/lib/mode";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// 로그인 페이지 (plan §2). 성공 시 /summary.
// Google 버튼은 OAuth 자격증명이 있으면 로컬에서도 뜬다 — 로컬에서 실제 구글 로그인
// 흐름을 그대로 확인하려고 (2026-07-25, jay). 비밀번호 폼은 로컬에서만.
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const local = appMode() !== "cloud";
  const google = googleEnabled();
  const lang = getLang();

  return (
    <main>
      <h1>🐇 rabbit</h1>
      <p className="sub">{pick(lang, "로그인하면 투자 요약 페이지로 이동합니다.", "Signing in takes you to the Investment Summary page.")}</p>
      <section className="panel" style={{ maxWidth: 440 }}>
        <h2>{pick(lang, "로그인", "Sign in")}</h2>
        {google && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/summary" });
            }}
          >
            <p className="muted" style={{ marginBottom: 16 }}>
              {pick(lang, "Google 계정으로 로그인하세요. 허용된 계정만 접근할 수 있습니다.", "Sign in with Google. Only allowed accounts can access.")}
            </p>
            <button type="submit">{pick(lang, "Google 계정으로 로그인", "Sign in with Google")}</button>
          </form>
        )}
        {local && (
          <form action={loginLocal} style={google ? { marginTop: 20 } : undefined}>
            {google && (
              <p className="muted" style={{ marginBottom: 12 }}>
                {pick(lang, "또는 로컬 비밀번호로 로그인", "Or sign in with the local password")}
              </p>
            )}
            <div className="field">
              <label htmlFor="password">{pick(lang, "비밀번호", "Password")}</label>
              <input id="password" name="password" type="password" />
            </div>
            <button type="submit" style={{ marginTop: 12 }}>
              {pick(lang, "로그인", "Sign in")}
            </button>
          </form>
        )}
        {searchParams.error && (
          <p className="err">{pick(lang, "로그인 실패 — 다시 시도하세요.", "Sign-in failed — please try again.")}</p>
        )}
      </section>
    </main>
  );
}

async function loginLocal(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      password: formData.get("password"),
      redirectTo: "/summary",
    });
  } catch (e) {
    if (e instanceof AuthError) redirect("/login?error=CredentialsSignin");
    throw e; // 성공 시 NEXT_REDIRECT — 그대로 전파해야 리다이렉트됨
  }
}
