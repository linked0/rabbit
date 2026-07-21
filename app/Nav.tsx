import Link from "next/link";
import { auth, signOut } from "@/auth";
import ThemeToggle from "./ThemeToggle";
import LangToggle from "./LangToggle";
import NavLinks, { type NavItem } from "./NavLinks";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Target IA 최상단 메뉴 (docs/features/README.md).
// 대부분 로그인 없이 보인다. authOnly 항목(포트폴리오)은 로그인 시에만 메뉴에 노출.
// 진입 가드(미들웨어): /portfolio, /chat 은 로그인 필요. 라벨은 ko/en 둘 다 — 언어 토글로 전환.

const MENU: NavItem[] = [
  { href: "/", ko: "홈", en: "Home" },
  // 지식(Knowledge) 카테고리는 일시 제거 — 콘텐츠는 docs/know.html (로컬 file:// 열람). 필요 시 복원.
  { href: "/portfolio", ko: "포트폴리오", en: "Portfolio", authOnly: true },
  { href: "/chat", ko: "AI 챗", en: "AI Chat" },
  { href: "/game", ko: "게임", en: "Game" },
  { href: "/market", ko: "마켓", en: "Market" },
  { href: "/ap2", ko: "AP2 테스트", en: "AP2 Test" },
  { href: "/xyz", ko: "XYZ 데모", en: "XYZ Demo" },
  { href: "/jayverse", ko: "JayVerse", en: "JayVerse" },
  { href: "https://verex.jaylabs.xyz", ko: "Verex ↗", en: "Verex ↗", external: true },
];

// 공통 상단바: Target IA 메뉴 + 언어/테마 토글 + 로그인/로그아웃
export default async function Nav() {
  const session = await auth();
  const loggedIn = !!session?.user;
  const items = MENU.filter((m) => !m.authOnly || loggedIn);
  const lang = getLang();

  return (
    <header className="site-header">
      <div className="topbar" style={{ justifyContent: "space-between" }}>
        <NavLinks items={items} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LangToggle />
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
                  {pick(lang, "로그아웃", "Sign out")}
                </button>
              </form>
            </>
          ) : (
            <Link className="ghost" href="/login">
              {pick(lang, "로그인", "Sign in")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
