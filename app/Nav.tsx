import Link from "next/link";
import { auth, isOwnerEmail } from "@/auth";
import ThemeToggle from "./ThemeToggle";
import LangToggle from "./LangToggle";
import UserMenu from "./UserMenu";
import NavLinks, { type NavItem } from "./NavLinks";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { appMode } from "@/lib/mode";

// Target IA 최상단 메뉴 (docs/features/README.md).
// `pub` 항목(홈·마켓·XYZ)만 비로그인 방문자에게 보인다. 나머지는 오너(= ALLOWED_EMAILS
// 의 구글 계정) 로그인 시에만 노출되고, 미들웨어도 같은 기준으로 진입을 막는다
// (2026-07-25, jay — 운영 서버 1대 체제). 라벨은 ko/en 둘 다 — 언어 토글로 전환.

const MENU: NavItem[] = [
  { href: "/", ko: "홈", en: "Home", code: "HOME", pub: true },
  // 지식(Knowledge) 카테고리는 일시 제거 — 콘텐츠는 docs/know.html (로컬 file:// 열람). 필요 시 복원.
  { href: "/portfolio", ko: "포트폴리오", en: "Portfolio", code: "PORTFOLIO" },
  { href: "/chat", ko: "AI 챗", en: "AI Chat", code: "CHAT" },
  { href: "/game", ko: "게임", en: "Game", code: "GAME" },
  { href: "/market", ko: "마켓", en: "Market", code: "MARKET", pub: true },
  { href: "/ap2", ko: "AP2 테스트", en: "AP2 Test", code: "AP2" },
  { href: "/xyz", ko: "XYZ 데모", en: "XYZ Demo", code: "XYZ", pub: true },
  { href: "/jayverse", ko: "JayVerse", en: "JayVerse", code: "JAYVERSE" },
  // Verex 항목은 제거 (2026-07-25, jay) — 홈의 피처드 카드로 대체 (app/home/page.tsx, lib/verex.ts).
];

// 메뉴 표시 제어.
// - 로컬 모드: 로그인 여부와 무관하게 전체 메뉴 표시 (개발 편의 — 게이트를 걸면
//   매번 로그인해야 메뉴가 보인다).
// - 운영(클라우드): 기본 "숨김" — env `ALLOW_<code>` 가 "true" 이고, 그중에서도
//   `pub` 항목만 방문자에게 보인다. 나머지는 오너 로그인 시에만.
//   설정이 없거나 나중에 추가된 메뉴는 운영에서 자동으로 숨겨진다.
function menuVisible(item: NavItem, isOwner: boolean): boolean {
  if (appMode() !== "cloud") return true;
  if (!item.code || process.env[`ALLOW_${item.code}`] !== "true") return false;
  return !!item.pub || isOwner;
}

// 공통 상단바: Target IA 메뉴 + 언어/테마 토글 + 로그인/로그아웃
export default async function Nav() {
  const session = await auth();
  const loggedIn = !!session?.user;
  const isOwner = isOwnerEmail(session?.user?.email);
  const items = MENU.filter((m) => menuVisible(m, isOwner));
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
          {/* 로그인 버튼은 운영(클라우드)에서만 숨긴다 (2026-07-25, jay — 일단).
              방문자에게 보여줄 이유가 없는 오너 전용 입구라서. 오너는 /login 으로 직접
              들어간다. 로컬은 개발 편의상 그대로 노출.
              로그아웃은 로그인 상태의 UserMenu 안에 그대로 있다. */}
          {loggedIn ? (
            <UserMenu email={session?.user?.email ?? ""} />
          ) : (
            appMode() !== "cloud" && (
              <Link className="ghost" href="/login">
                {pick(lang, "로그인", "Sign in")}
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
