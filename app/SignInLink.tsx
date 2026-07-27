"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 상단바 로그인 링크. 지금 보고 있는 경로를 `callbackUrl` 로 달고 간다 — 로그인 후
// /summary 로 끌려가지 않고 보던 페이지로 돌아오도록 (2026-07-27, jay).
// 클라이언트 컴포넌트인 이유: 현재 경로는 서버 컴포넌트인 Nav 에서 알 수 없다.
// 쿼리스트링은 일부러 빼고 경로만 쓴다 — useSearchParams() 는 Suspense 경계를 요구해서
// 이 링크가 얹혀 있는 레이아웃 전체를 CSR 로 떨어뜨린다. 메뉴 복귀엔 경로면 충분하다.
export default function SignInLink({ label }: { label: string }) {
  const pathname = usePathname();
  return (
    <Link className="ghost" href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>
      {label}
    </Link>
  );
}
