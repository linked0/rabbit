import Link from "next/link";
import { auth, signOut } from "@/auth";
import ThemeToggle from "./ThemeToggle";

// Target IA 최상단 메뉴 (docs/features/README.md).
// 메뉴 항목은 로그인 없이도 전부 보인다. 단 진입 시 로그인 필요: /portfolio, /chat (미들웨어가 가드).
type Item = { href: string; label: string; external?: boolean };

const MENU: Item[] = [
  { href: "/", label: "홈" },
  { href: "/knowledge", label: "지식" },
  { href: "/portfolio", label: "포트폴리오" },
  { href: "/chat", label: "AI 챗" },
  { href: "/game", label: "게임" },
  { href: "/market", label: "마켓" },
  { href: "/ap2", label: "AP2 테스트" },
  { href: "/xyz", label: "XYZ 데모" },
  { href: "/etc", label: "ETC" },
  { href: "https://verex.jaylabs.xyz", label: "Verex ↗", external: true },
];

// 공통 상단바: Target IA 메뉴(항상 전체 노출) + 로그인/로그아웃
export default async function Nav() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <div className="topbar" style={{ justifyContent: "space-between" }}>
      <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {MENU.map((m) =>
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
