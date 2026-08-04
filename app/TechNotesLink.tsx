import { pick } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// 페이지 상단에 붙이는 "기술 노트로 이동" 앵커 링크 — 본문(데모/카드 그리드)이 길면
// 하단의 TechNotes 섹션을 놓칠 수 있어서, 존재를 위에서부터 알려준다 (jay, 2026-08-04).
export default function TechNotesLink({ lang }: { lang: Lang }) {
  return (
    <p className="sub" style={{ marginTop: 4 }}>
      <a href="#tech-notes">{pick(lang, "↓ 기술 노트 보기 (목적·동작 방식)", "↓ Jump to Technical Notes (purpose & how it works)")}</a>
    </p>
  );
}
