"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./LangContext";

// 메뉴 링크 — 현재 언어(ko/en)에 맞는 라벨을 고른다. 필터링(pub/오너)은 서버 Nav에서 끝냄.
export type NavItem = {
  href: string;
  ko: string;
  en: string;
  external?: boolean;
  pub?: boolean; // 비로그인 방문자에게도 노출. 없으면 오너 로그인 시에만 보인다.
  code?: string; // 클라우드 표시 제어 키 → env ALLOW_<code>
};

// 라이브는 카테고리가 아니라 **필터**다 (2026-08-11) — 같은 상세 페이지가 PoCs 에서도
// 라이브에서도 열린다. 그래서 경로만 보면 라이브에서 들어온 방문자에게도 "PoCs" 가 켜져
// 보인다. BackLink 는 이미 ?from=live 를 읽어 "← 라이브"로 나가는데(같은 날 수정) 상단
// 메뉴만 안 고쳐져 있었다 — 한 화면에서 두 위젯이 서로 다른 곳을 가리키던 셈이다
// (jay 지적, 2026-08-26).
//
// 이 컴포넌트는 훅을 쓰지 않는다: `?from=live` 는 NavLinksLive 가 읽어 prop 으로 넘긴다.
// useSearchParams 를 여기서 부르면 Suspense fallback 으로 자기 자신을 쓸 수 없어진다 —
// fallback 도 같이 suspend 하기 때문이다. BackLink/BackLinkClient 와 같은 구조.
export default function NavLinks({ items, fromLive = false }: { items: NavItem[]; fromLive?: boolean }) {
  const { lang } = useLang();
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
      {items.map((m) => {
        const label = lang === "en" ? m.en : m.ko;
        const active =
          !m.external &&
          (fromLive
            ? // 라이브에서 들어왔으면 켜지는 건 라이브 하나뿐이다. 경로가 /poc/... 여도
              // 방문자가 온 곳은 라이브이고, 되돌아갈 곳도 라이브다.
              m.href === "/live"
            : m.href === "/"
              ? pathname === "/"
              : pathname.startsWith(m.href));
        return m.external ? (
          <a key={m.href} href={m.href} target="_blank" rel="noreferrer" className="nav-cta">
            {label}
          </a>
        ) : (
          <Link key={m.href} href={m.href} aria-current={active ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
