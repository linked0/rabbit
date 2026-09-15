import Nav from "../Nav";
import NotifyPageView from "@/app/NotifyPageView";
import Card from "../DemoCard";
import { POC_CARDS } from "@/lib/poc-cards";
import { TIL_CARDS } from "@/lib/til-cards";
import { sortDemoCards } from "@/lib/demo-cards";
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
  const live = sortDemoCards([...POC_CARDS, ...TIL_CARDS].filter((c) => c.status === "live"));

  // 오디터만 자리를 지정한다 (jay, 2026-09-15: "여섯 번째"). 날짜를 조작해 순서를 만들지
  // 않는 이유: `date` 는 "그 데모가 동작하게 된 날"이라는 뜻이 정해져 있고(lib/demo-cards.ts),
  // 그 뜻을 순서 조절에 쓰기 시작하면 /poc·docs 등 같은 필드를 읽는 다른 화면이 조용히
  // 틀어진다. 자리만 원하는 것이므로 자리만 옮긴다.
  const AUDITOR_SLOT = 5; // 0-based → 여섯 번째
  const cards = (() => {
    const i = live.findIndex((c) => c.key === "authority-auditor");
    if (i < 0) return live; // 카드가 없거나 live 가 아니면 그대로 — 자리 지정은 보너스지 요구사항이 아니다
    const out = [...live];
    const [auditor] = out.splice(i, 1);
    out.splice(Math.min(AUDITOR_SLOT, out.length), 0, auditor);
    return out;
  })();

  return (
    <>
      <Nav />
      <NotifyPageView path="/live" />
      <main>
        <h1>{pick(lang, "데모", "Demo")}</h1>
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
