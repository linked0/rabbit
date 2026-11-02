import Nav from "../../Nav";
import BackLink from "../../BackLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import StackRun from "./StackRun";

// 한 번의 실행 (jay, 2026-11-02 손그림). 여섯 개의 라이브 데모가 각자 한 조각씩만 보여 주던
// 것을 한 화면에 모아, **어느 순서로 맞물리는지**를 보여 주는 페이지.
//
// **페이지에는 판만 있다** (jay, 같은 날 세 번째 손그림: "only display diagram · this page doesn't
// have fixed width · all the detailed description … through a menu item of each popup"). 표준 표와
// 계획 패널은 각 말풍선의 "표준" 버튼 뒤로 들어갔고, main 의 960px 상한은 이 페이지에서 푼다.
export default function StackPage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  return (
    <>
      <Nav />
      <main className="stack-main">
        <BackLink lang={lang} href="/live" ko="Jayverse" en="Jayverse" />
        <h1>{t("한 번의 실행 — 여섯 데모가 어떻게 맞물리나", "One run — how the six demos coordinate")}</h1>
        <p className="sub">
          {t(
            "지출 한 건을 처음부터 끝까지 돌려 보는 판입니다 — 누가 무엇을 쥐고 있고, 누가 막는지. 각본이고, 실제로 도는 것은 말풍선이 링크하는 여섯 데모입니다.",
            "One spend, start to finish, as a board you run — who holds what, and who refuses. Scripted; the things that run are the six demos the bubbles link to.",
          )}
        </p>
        <StackRun lang={lang} />
      </main>
    </>
  );
}
