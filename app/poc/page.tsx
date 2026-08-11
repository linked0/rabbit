import Nav from "../Nav";
import Card from "../DemoCard";
import { POC_CARDS } from "@/lib/poc-cards";
import { TIL_CARDS } from "@/lib/til-cards";
import { sortDemoCards } from "@/lib/demo-cards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Target IA: PoCs (/poc) — 만들고 있는 것과 계획. 설계: docs/tasks/current-plan.md §7.
//
// 2026-08-11 (jay) 두 가지가 바뀌었다:
//   ① 라이브 카드는 /live 로 나갔다 — 한 그리드에 라이브·목업·준비 중이 섞여 있으면
//      "돌아가는 게 뭐냐"에 답하려고 배지를 하나씩 읽어야 했다. 이제 여기는 그 질문에
//      답하지 않는다. status === "live" 하나로 갈리므로 카드 데이터는 여전히 한 곳이다.
//   ② TIL 을 별도 허브(/til)에서 여기로 흡수했다 — 카드 포맷도 컴포넌트도 같았고,
//      메뉴가 둘로 나뉘어 있을 만큼 다른 물건이 아니었다. /til 은 여기로 리다이렉트하고,
//      상세 라우트(/til/lmsr-hybrid-amm)는 그대로 산다.
export default function PocPage() {
  const lang = getLang();
  const building = sortDemoCards(POC_CARDS.filter((c) => c.status !== "live"));
  const til = sortDemoCards(TIL_CARDS);

  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "PoCs", "PoCs")}</h1>
        <p className="sub">
          {pick(
            lang,
            "만들고 있는 것과 계획 — 목업은 눌러서 열어볼 수 있고, 준비 중 카드는 아직 페이지가 없습니다. 실제로 돌아가는 것들은 라이브에 있습니다.",
            "Work in progress and plans — mock cards open a page you can step through; “coming soon” cards have no page yet. Anything that actually runs is under Live."
          )}
        </p>

        {/* 하나의 그리드 — TIL 을 별도 섹션으로 나누지 않는다 (jay, 2026-08-11).
            제목만 다른 두 그리드는 "다른 물건"이라는 신호를 주는데, 실제로는 카드 포맷도
            컴포넌트도 정렬 규칙도 같았다. 다른 건 howTo 칸이 실행 방법이냐 출처냐 뿐이라,
            그건 카드별 라벨로 처리한다. */}
        <div className="poc-grid">
          {building.map((card) => (
            <Card key={card.key} card={card} lang={lang} />
          ))}
          {til.map((card) => (
            <Card key={card.key} card={card} lang={lang} noteLabel={{ en: "Source", ko: "출처" }} />
          ))}
        </div>
      </main>
    </>
  );
}
