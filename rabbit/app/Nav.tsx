import Link from "next/link";
import { auth, signOut } from "@/auth";

// 로그인 후 공통 상단바: 탭(요약/AI 챗/포트폴리오) + 사용자 + 로그아웃
export default async function Nav() {
  const session = await auth();

  return (
    <div className="topbar" style={{ justifyContent: "space-between" }}>
      <nav style={{ display: "flex", gap: 16 }}>
        <Link href="/summary">요약</Link>
        <Link href="/chat">AI 챗</Link>
        <Link href="/dashboard">포트폴리오</Link>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="muted">👤 {session?.user?.email}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="ghost" type="submit">
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}
