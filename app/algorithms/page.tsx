import Nav from "../Nav";
import Card from "../DemoCard";
import { ALGORITHM_CARDS } from "@/lib/algorithm-cards";
import { sortDemoCards } from "@/lib/demo-cards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Algorithms (/algorithms) — 수학·알고리즘 노트 (jay, 2026-08-11).
//
// PoCs 에서 갈라져 나온 이유: 이 카드들이 답하는 질문이 다르다. PoCs 는 "무엇을 만들고 있나",
// 여기는 "어떤 결과를 이해했고 그게 어디에 쓰이나". 둘을 한 그리드에 두면 데모를 찾는 사람과
// 유도 과정을 찾는 사람이 같은 목록을 훑어야 한다.
//
// 카드 데이터는 lib/til-cards.ts 한 곳이고, lib/algorithm-cards.ts 가 키로 고른다.
export default function AlgorithmsPage() {
  const lang = getLang();
  const cards = sortDemoCards(ALGORITHM_CARDS);

  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "알고리즘", "Algorithms")}</h1>
        <p className="sub">
          {pick(
            lang,
            "수학·알고리즘 노트 — 공식 하나를 유도하고, 그것이 실제로 어디에 쓰이는지까지 따라갑니다.",
            "Math and algorithms notes — derive one result, then follow it to where it actually gets used."
          )}
        </p>
        <div className="poc-grid">
          {cards.map((card) => (
            <Card key={card.key} card={card} lang={lang} noteLabel={{ en: "Source", ko: "출처" }} />
          ))}
        </div>
      </main>
    </>
  );
}
