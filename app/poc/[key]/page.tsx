import { notFound } from "next/navigation";
import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import { POC_CARDS } from "@/lib/poc-cards";
import { TIL_CARDS } from "@/lib/til-cards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// 카드 상세 — 전용 페이지가 없는 모든 카드의 공통 라우트 (jay 요청, 2026-08-11).
//
// 손으로 12장을 쓰지 않은 이유: 카드는 이미 purpose / howItWorks / diagrams 를 들고 있고,
// TechNotes 가 그걸 그대로 렌더한다. 따로 쓰면 같은 내용이 두 곳에 살면서 갈라지고,
// 카드를 추가할 때마다 페이지도 만들어야 하는 규칙이 하나 더 생긴다. 여기서는 카드를
// 추가하면 상세가 저절로 생긴다.
//
// 전용 페이지가 있는 카드(/poc/aa, /poc/agent, /poc/dvt, /poc/oz-relayer …)는 정적 세그먼트가
// 동적 세그먼트보다 우선하므로 이 파일이 가로채지 않는다.

const ALL = [...POC_CARDS, ...TIL_CARDS];

export function generateStaticParams() {
  return ALL.map((c) => ({ key: c.key }));
}

export default function CardDetailPage({ params }: { params: { key: string } }) {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const card = ALL.find((c) => c.key === params.key);
  if (!card) notFound();

  // 전용 페이지가 있는 카드가 여기로 오면(직접 URL 입력 등) 그쪽이 정본이다.
  const hasOwnPage = !!card.href && card.href !== `/poc/${card.key}`;

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} />
        <h1>{pick(lang, card.titleKo, card.title)}</h1>
        <p className="sub">{pick(lang, card.descriptionKo, card.description)}</p>

        {card.status !== "live" && (
          <div
            className="panel"
            style={{ marginTop: 16, borderColor: "#f59e0b", borderWidth: 2, borderStyle: "solid" }}
          >
            <strong style={{ color: "#b45309" }}>
              {t("아직 만들지 않았습니다", "Not built yet")}
            </strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "이 페이지는 카드에 적힌 내용을 펼쳐 보여줄 뿐입니다 — 돌아가는 코드도, 열어볼 데모도 아직 없습니다. 무엇을 왜 만들려는지가 아래에 있습니다.",
                "This page only unfolds what the card already says — there is no running code and no demo to open yet. What it would be, and why, is below."
              )}
            </p>
          </div>
        )}

        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("어떻게 보나", "How to read this")}</strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13.5 }}>
            {pick(lang, card.howToKo, card.howTo)}
          </p>
          {hasOwnPage && (
            <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
              {t("이 카드에는 전용 페이지가 있습니다: ", "This card has its own page: ")}
              <a href={card.href}>{card.href}</a>
            </p>
          )}
        </div>

        <TechNotes cards={[card]} lang={lang} />
      </main>
    </>
  );
}
