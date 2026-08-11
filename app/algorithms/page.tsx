import { redirect } from "next/navigation";

// 알고리즘 상단 메뉴는 제거됐다 (jay, 2026-08-11) — 수학·알고리즘 노트는 데모가 아니라
// 문서라, docs/index.html 의 Algorithms 섹션이 정본이 됐다. 라우트를 지우지 않고
// 리다이렉트로 남기는 이유는 /til 과 같다: 공유된 링크가 404 가 되지 않게 하려는 것.
export default function AlgorithmsPage() {
  redirect("/poc");
}
