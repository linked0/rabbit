import { auth, isOwnerEmail } from "@/auth";
import ThemeToggle from "./ThemeToggle";
import LangToggle from "./LangToggle";
import UserMenu from "./UserMenu";
import SignInLink from "./SignInLink";
import NavLinks, { type NavItem } from "./NavLinks";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Target IA 최상단 메뉴 (docs/features/README.md).
// `pub` 항목(홈·프로젝트·PoCs)만 비로그인 방문자에게 보인다. 나머지는 오너(= ALLOWED_EMAILS
// 의 구글 계정) 로그인 시에만 노출되고, 미들웨어도 같은 기준으로 진입을 막는다
// (2026-07-25, jay — 운영 서버 1대 체제). 라벨은 ko/en 둘 다 — 언어 토글로 전환.

const MENU: NavItem[] = [
  { href: "/", ko: "홈", en: "Home", code: "HOME", pub: true },
  // 지식(Knowledge) 카테고리는 일시 제거 — 콘텐츠는 docs/know.html (로컬 file:// 열람). 필요 시 복원.
  { href: "/portfolio", ko: "포트폴리오", en: "Portfolio", code: "PORTFOLIO" },
  // 제이 챗은 홈 페이지에 통합됨 — 별도 메뉴/페이지 제거 (2026-08-01, jay).
  { href: "/projects", ko: "프로젝트", en: "Projects", code: "PROJECTS", pub: true },
  { href: "/game", ko: "게임", en: "Game", code: "GAME" },
  // 마켓·XYZ 는 별도 메뉴에서 PoCs 허브 카드로 통합 (2026-08-03, jay) — 라우트(/market, /xyz)는
  // 그대로 살아있고 진입점만 바뀜. 설계: docs/tasks/current-plan.md §7.
  // 라우트는 /etc → /poc 로 옮겼지만(2026-08-05) `code` 는 URL 이 아니라 env 키(`ALLOW_ETC`)다.
  // 여기서 함께 바꾸면 배포 환경(Cloud Run)의 env 도 같은 시점에 바꿔야 하고, 안 바꾸면 메뉴가
  // 조용히 사라진다 — 실패가 눈에 안 띄는 종류라 URL 이동과 분리했다. 이름을 맞추고 싶으면
  // `ALLOW_POC` 을 배포 env 에 먼저 넣은 뒤 이 값을 "POC" 로 바꿀 것.
  // PoCs 가 라이브보다 앞 (2026-08-11, jay) — 이 사이트의 성격은 "무엇을 만들고 있나"가
  // 먼저고, 라이브는 그중 완성된 것을 모아 보여주는 쪽이다.
  { href: "/poc", ko: "PoCs", en: "PoCs", code: "ETC", pub: true },
  // 라이브 — 실제로 돌아가는 카드만. /poc 는 만들고 있는 것과 계획을 맡는다.
  // ⚠️ 새 메뉴는 `ALLOW_LIVE=true` 가 있어야 뜬다 — .env 에 넣었고, deploy.sh 가
  // ALLOW_* 를 전부 Cloud Run env 로 전달하므로 배포 시 자동으로 따라간다.
  { href: "/live", ko: "라이브", en: "Live", code: "LIVE", pub: true },
  // 알고리즘 상단 메뉴는 제거 (2026-08-11, jay) — 수학·알고리즘 노트는 데모가 아니라 문서라,
  // 문서 색인(docs/index.html)의 Algorithms 섹션이 정본이 됐다. 카드는 /poc 로 돌아온다.
  // TIL 메뉴는 제거 — /poc 안의 섹션으로 흡수했다 (2026-08-11, jay). /til 은 /poc 로
  // 리다이렉트하고, 상세(/til/lmsr-hybrid-amm)는 그대로 살아 있다.
  // AP2(Stripe 정산 데모)도 마켓·XYZ와 같은 이유로 PoCs 허브 카드로 통합 (2026-08-04, jay) —
  // /poc/ap2 라우트는 그대로 공개, 진입점만 /poc 카드로. 설계: docs/tasks/current-plan.md §2.
  // JayVerse 제거 (2026-08-11, jay) — 메뉴와 PoC 카드 둘 다. /jayverse 라우트는 남아 있지만
  // 어디서도 링크하지 않는다. 되살리려면 이 줄과 카드를 함께 복원할 것.
  // Verex 항목은 제거 (2026-07-25, jay) — 홈의 피처드 카드로 대체 (app/home/page.tsx, lib/verex.ts).
];

// 메뉴 표시 제어 — 로컬·운영 동일 규칙 (2026-07-27, jay).
// 기본은 "숨김": env `ALLOW_<code>` 가 "true" 여야 후보에 오르고, 그중 `pub` 항목만
// 방문자에게 보인다. 나머지는 오너(= ALLOWED_EMAILS 의 구글 계정) 로그인 시에만.
// 설정이 없거나 나중에 추가된 메뉴는 자동으로 숨겨진다.
// 예전엔 로컬을 무조건 전체 표시로 두었지만, 그러면 로컬에서 본 메뉴가 운영과 달라
// "배포하고 나서야 빠진 걸 발견"하는 일이 생겼다. 이제 로컬도 똑같이 게이트를 통과해야 한다.
function menuVisible(item: NavItem, isOwner: boolean): boolean {
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
          {/* 로그인 버튼은 로컬·클라우드 모두 노출한다 (2026-07-27, jay).
              2026-07-25 엔 클라우드에서 숨겼는데(오너 전용 입구라 방문자에게 보일 이유가
              없다는 이유), 그러면 오너가 매번 /login 을 직접 쳐야 메뉴가 열린다. 접근 통제는
              allowlist(ALLOWED_EMAILS)+미들웨어가 하지 버튼 숨김이 하는 게 아니다.
              로그아웃은 로그인 상태의 UserMenu 안에 그대로 있다.
              라벨은 "로그인"이 아니라 "관리자" — 이 사이트엔 가입이란 개념이 없고
              ALLOWED_EMAILS 의 오너 한 명만 들어올 수 있는 입구라서, "로그인"은 방문자에게
              계정을 만들 수 있다는 오해를 준다. */}
          {loggedIn ? (
            <UserMenu email={session?.user?.email ?? ""} />
          ) : (
            <SignInLink label={pick(lang, "관리자", "Admin")} />
          )}
        </div>
      </div>
    </header>
  );
}
