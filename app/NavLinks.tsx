"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./LangContext";

// 메뉴 링크 — 현재 언어(ko/en)에 맞는 라벨을 고른다. 필터링(authOnly)은 서버 Nav에서 끝냄.
export type NavItem = {
  href: string;
  ko: string;
  en: string;
  external?: boolean;
  authOnly?: boolean;
  code?: string; // 클라우드 표시 제어 키 → env ALLOW_<code>
  always?: boolean; // true면 필터 무시하고 항상 표시 (예: Verex)
};

export default function NavLinks({ items }: { items: NavItem[] }) {
  const { lang } = useLang();
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
      {items.map((m) => {
        const label = lang === "en" ? m.en : m.ko;
        const active =
          !m.external && (m.href === "/" ? pathname === "/" : pathname.startsWith(m.href));
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
