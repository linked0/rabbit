import Nav from "../Nav";
import Card from "../DemoCard";
import { liveCards } from "@/lib/live-cards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Live (/live) — 실제로 돌아가는 것만 (jay, 2026-08-11).
//
// 왜 나눴나: /poc 한 곳에 라이브·목업·준비 중이 섞여 있으면, 방문자가 "돌아가는 게 뭐냐"에
// 답하려면 배지를 하나씩 읽어야 한다. 카탈로그가 12장을 넘어가면서 그게 실제로 부담이 됐다.
// 이제 이 페이지가 그 질문 하나만 답하고, /poc 는 "무엇을 만들고 있나"를 답한다.
//
// 라이브는 **카테고리가 아니라 필터**다 (jay, 2026-08-11 — LMSR 카드가 live 인데 여기
// 안 뜬다는 지적). 그래서 특정 파일이 아니라 모든 카드 소스에서 status === "live" 를 모은다.
// PoCs 든 알고리즘이든 어느 허브가 그 카드를 "소유"하든, 돌아가면 여기 뜬다 — 같은 카드가
// 두 곳에 보이는 건 중복이 아니라 필터의 정의다.
export default function LivePage() {
  const lang = getLang();
  // 피처드 섹션 제거 (jay, 2026-09-15) — 한 장만 위로 빼두면 "돌아가는 것들"이라는
  // 이 페이지의 한 가지 질문에 답이 두 군데로 갈린다. 이제 전부 같은 격자에 들어간다.
  // 순서(오디터 자리 포함)는 왼쪽 레일과 같아야 하므로 lib/live-cards.ts 에 있다.
  const cards = liveCards();

  return (
    <>
      <Nav />
      <main>
        <h1>{"Jayverse"}</h1>
        <p className="sub">
          {pick(
            lang,
            "지금 실제로 돌아가는 것들 — 전부 열어서 직접 해볼 수 있습니다. 만들고 있는 것과 계획은 PoCs 에 있습니다.",
            "What actually runs right now — every card here opens something you can use. Work in progress and plans live under PoCs."
          )}
        </p>

        <div className="poc-grid">
          {cards.map((card) => (
            <Card key={card.key} card={card} lang={lang} from="live" />
          ))}
        </div>
      </main>
    </>
  );
}
