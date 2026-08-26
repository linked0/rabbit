"use client";

import { useSearchParams } from "next/navigation";
import NavLinks, { type NavItem } from "./NavLinks";

// `?from=live` 만 읽어 NavLinks 에 넘기는 얇은 래퍼. 분리한 이유는 BackLinkClient 와 같다:
// useSearchParams 는 Suspense 경계를 요구하고, 그 fallback 은 훅을 부르지 않는 컴포넌트여야
// 한다. 그래서 판단(NavLinks)과 조회(여기)를 갈라 둔다.
export default function NavLinksLive({ items }: { items: NavItem[] }) {
  const fromLive = useSearchParams().get("from") === "live";
  return <NavLinks items={items} fromLive={fromLive} />;
}
