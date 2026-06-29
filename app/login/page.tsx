import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { appMode } from "@/lib/mode";

export const dynamic = "force-dynamic";

// 로그인 페이지 (plan §2): cloud → Google 버튼 / local → 비밀번호 폼. 성공 시 /summary
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const cloud = appMode() === "cloud";

  return (
    <main>
      <h1>🐇 rabbit</h1>
      <p className="sub">로그인하면 투자 요약 페이지로 이동합니다.</p>
      <section className="panel" style={{ maxWidth: 440 }}>
        <h2>로그인</h2>
        {cloud ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/summary" });
            }}
          >
            <p className="muted" style={{ marginBottom: 16 }}>
              Google 계정으로 로그인하세요. 허용된 계정만 접근할 수 있습니다.
            </p>
            <button type="submit">Google 계정으로 로그인</button>
          </form>
        ) : (
          <form action={loginLocal}>
            <div className="field">
              <label htmlFor="password">비밀번호</label>
              <input id="password" name="password" type="password" autoFocus />
            </div>
            <button type="submit" style={{ marginTop: 12 }}>
              로그인
            </button>
          </form>
        )}
        {searchParams.error && (
          <p className="err">로그인 실패 — 다시 시도하세요.</p>
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
