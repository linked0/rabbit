import { pick } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// 데모 페이지 상단의 되돌아가기 링크 — 카드 그리드에서 들어온 사람이 브라우저 뒤로가기를 찾지
// 않아도 되게 (jay, 2026-08-05). 기본 목적지는 PoCs 허브이고, 하위 페이지(시나리오 등)는
// 자기 부모를 직접 지정한다.
export default function BackLink({
  lang,
  href = "/poc",
  ko = "PoCs",
  en = "PoCs",
}: {
  lang: Lang;
  href?: string;
  ko?: string;
  en?: string;
}) {
  return (
    <p className="sub" style={{ fontSize: 13, marginBottom: 8 }}>
      <a href={href}>← {pick(lang, ko, en)}</a>
    </p>
  );
}
