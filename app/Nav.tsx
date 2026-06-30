import Link from "next/link";
import { auth, signOut } from "@/auth";
import ThemeToggle from "./ThemeToggle";

// Target IA 최상단 메뉴 (docs/features/README.md).
// 대부분 로그인 없이 보인다. authOnly 항목(포트폴리오)은 로그인 시에만 메뉴에 노출.
// 진입 가드(미들웨어): /portfolio, /chat 은 로그인 필요.
type Item = { href: string; label: string; external?: boolean; authOnly?: boolean };

const MENU: Item[] = [
  { href: "/", label: "홈" },
  // 지식(Knowledge) 카테고리는 일시 제거 — 콘텐츠는 docs/know.html (로컬 file:// 열람). 필요 시 복원.
  { href: "/portfolio", label: "포트폴리오", authOnly: true },
  { href: "/chat", label: "AI 챗" },
  { href: "/game", label: "게임" },
  { href: "/market", label: "마켓" },
  { href: "/ap2", label: "AP2 테스트" },
  { href: "/xyz", label: "XYZ 데모" },
  { href: "/etc", label: "ETC" },
  { href: "https://verex.jaylabs.xyz", label: "Verex ↗", external: true },
];

// 공통 상단바: Target IA 메뉴 + 로그인/로그아웃
export default async function Nav() {
  const session = await auth();
  const loggedIn = !!session?.user;
  const items = MENU.filter((m) => !m.authOnly || loggedIn);

  return (
    <div className="topbar" style={{ justifyContent: "space-between" }}>
      <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {items.map((m) =>
          m.external ? (
            <a key={m.href} href={m.href} target="_blank" rel="noreferrer">
              {m.label}
            </a>
          ) : (
            <Link key={m.href} href={m.href}>
              {m.label}
            </Link>
          )
        )}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ThemeToggle />
        {loggedIn ? (
          <>
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
          </>
        ) : (
          <Link className="ghost" href="/login">
            로그인
          </Link>
        )}
      </div>
    </div>
  );
}
