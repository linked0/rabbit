import Link from "next/link";
import { auth } from "@/auth";
import ThemeToggle from "./ThemeToggle";
import LangToggle from "./LangToggle";
import UserMenu from "./UserMenu";
import NavLinks, { type NavItem } from "./NavLinks";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { appMode } from "@/lib/mode";

// Target IA 최상단 메뉴 (docs/features/README.md).
// 대부분 로그인 없이 보인다. authOnly 항목(포트폴리오)은 로그인 시에만 메뉴에 노출.
// 진입 가드(미들웨어): /portfolio, /chat 은 로그인 필요. 라벨은 ko/en 둘 다 — 언어 토글로 전환.

const MENU: NavItem[] = [
  { href: "/", ko: "홈", en: "Home", code: "HOME" },
  // 지식(Knowledge) 카테고리는 일시 제거 — 콘텐츠는 docs/know.html (로컬 file:// 열람). 필요 시 복원.
  { href: "/portfolio", ko: "포트폴리오", en: "Portfolio", authOnly: true, code: "PORTFOLIO" },
  { href: "/chat", ko: "AI 챗", en: "AI Chat", code: "CHAT" },
  { href: "/game", ko: "게임", en: "Game", code: "GAME" },
  { href: "/market", ko: "마켓", en: "Market", code: "MARKET" },
  { href: "/ap2", ko: "AP2 테스트", en: "AP2 Test", code: "AP2" },
  { href: "/xyz", ko: "XYZ 데모", en: "XYZ Demo", code: "XYZ" },
  { href: "/jayverse", ko: "JayVerse", en: "JayVerse", code: "JAYVERSE" },
  { href: "https://verex.jaylabs.xyz", ko: "Verex ↗", en: "Verex ↗", external: true, code: "VEREX", always: true },
];

// 메뉴 표시 제어.
// - 로컬 모드 또는 테스트 서버(MENU_SHOW_ALL=true): 전체 메뉴 표시.
// - 운영(클라우드): 기본 "숨김" — env `ALLOW_<code>` 가 "true" 인 메뉴만 표시.
//   설정이 없거나 나중에 추가된 메뉴는 운영에서 자동으로 숨겨진다.
function menuAllowed(item: NavItem): boolean {
  if (item.always) return true; // 필터 무시하고 항상 표시 (예: Verex)
  if (appMode() !== "cloud" || process.env.MENU_SHOW_ALL === "true") return true;
  return !!item.code && process.env[`ALLOW_${item.code}`] === "true";
}

// Verex 메뉴 링크 — 환경별로 분기.
//  - 로컬(appMode local): http://localhost:3000/
//  - 테스트 서버(cloud + MENU_SHOW_ALL=true): verex-web run.app
//  - 운영 서버(cloud + 필터): https://verex.jaylabs.xyz
function verexUrl(): string {
  if (appMode() !== "cloud") return "http://localhost:3000/";
  if (process.env.MENU_SHOW_ALL === "true") {
    return "https://verex-web-496608424746.asia-northeast3.run.app/";
  }
  return "https://verex.jaylabs.xyz";
}

// 공통 상단바: Target IA 메뉴 + 언어/테마 토글 + 로그인/로그아웃
export default async function Nav() {
  const session = await auth();
  const loggedIn = !!session?.user;
  // 로컬: 전체 표시. 클라우드: ALLOW_<code>=false 인 메뉴만 숨김.
  const items = MENU.filter((m) => (!m.authOnly || loggedIn) && menuAllowed(m)).map((m) =>
    m.code === "VEREX" ? { ...m, href: verexUrl() } : m
  );
  const lang = getLang();

  return (
    <header className="site-header">
      <div className="topbar" style={{ justifyContent: "space-between" }}>
        <NavLinks items={items} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="seg">
            <LangToggle />
            <ThemeToggle />
          </div>
          {loggedIn ? (
            <UserMenu email={session?.user?.email ?? ""} />
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
