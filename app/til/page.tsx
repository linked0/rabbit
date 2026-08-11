import { redirect } from "next/navigation";

// TIL 허브는 /poc 로 흡수됐다 (jay, 2026-08-11) — 카드 포맷도 컴포넌트도 같았고, 상단 메뉴를
// 둘로 나눠 둘 만큼 다른 물건이 아니었다. 라우트를 지우지 않고 리다이렉트로 남기는 이유는
// 공유된 /til 링크(문서·히스토리·외부)가 404 가 되지 않게 하기 위함이다.
// 상세 라우트(/til/lmsr-hybrid-amm)는 그대로 살아 있다 — 여기서 걸리는 건 정확히 /til 뿐이다.
export default function TilPage() {
  redirect("/poc");
}
