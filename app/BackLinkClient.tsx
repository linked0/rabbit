"use client";

import { useSearchParams } from "next/navigation";
import { pick } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// 라이브는 카테고리가 아니라 필터라(2026-08-11) 같은 상세 페이지가 여러 허브에서 열린다.
// 허브가 카드 링크에 ?from=live 를 실어 보내면, 뒤로가기는 온 곳(라이브)으로 돌려보낸다 —
// 라이브에서 들어왔는데 "← PoCs"로 나가던 문제(jay 지적)의 수정. 파라미터가 없으면
// 페이지가 지정한 부모 허브 그대로다.
export default function BackLinkClient({
  lang,
  href,
  ko,
  en,
}: {
  lang: Lang;
  href: string;
  ko: string;
  en: string;
}) {
  const params = useSearchParams();
  const fromLive = params.get("from") === "live";
  const target = fromLive ? "/live" : href;
  const label = fromLive ? pick(lang, "데모", "Demo") : pick(lang, ko, en);
  return <a href={target}>← {label}</a>;
}
