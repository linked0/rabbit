import { auth, signIn, signOut } from "@/auth";
import Dashboard from "./Dashboard";

// auth()가 요청 단위로 쿠키를 읽으므로 정적 프리렌더 제외
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();

  // 로그인 안 됨 → Google 로그인 화면
  if (!session?.user) {
    return (
      <main>
        <h1>🐇 year-hare</h1>
        <p className="sub">내 암호화폐 포트폴리오 요약 (PoC)</p>
        <section className="panel" style={{ maxWidth: 440 }}>
          <h2>로그인</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            Google 계정으로 로그인하세요. 허용된 계정만 접근할 수 있습니다.
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button type="submit">Google 계정으로 로그인</button>
          </form>
        </section>
      </main>
    );
  }

  // 로그인 됨 → 상단바(이메일 + 로그아웃) + 대시보드
  return (
    <>
      <div className="topbar">
        <span className="muted">👤 {session.user.email}</span>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button className="ghost" type="submit">
            로그아웃
          </button>
        </form>
      </div>
      <Dashboard />
    </>
  );
}
