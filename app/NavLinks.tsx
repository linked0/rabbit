"use client";

import Link from "next/link";
import { useLang } from "./LangContext";

// 메뉴 링크 — 현재 언어(ko/en)에 맞는 라벨을 고른다. 필터링(authOnly)은 서버 Nav에서 끝냄.
export type NavItem = {
  href: string;
  ko: string;
  en: string;
  external?: boolean;
  authOnly?: boolean;
};

export default function NavLinks({ items }: { items: NavItem[] }) {
  const { lang } = useLang();
  return (
    <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {items.map((m) => {
        const label = lang === "en" ? m.en : m.ko;
        return m.external ? (
          <a key={m.href} href={m.href} target="_blank" rel="noreferrer">
            {label}
          </a>
        ) : (
          <Link key={m.href} href={m.href}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
