import Nav from "../Nav";
import NotifyPageView from "@/app/NotifyPageView";
import Game from "./Game";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// 게임 페이지 (plan §2 #2) — 가벼운 캔버스 미니게임. 인증은 middleware가 보장.
export const dynamic = "force-dynamic";

export default function GamePage() {
  const lang = getLang();
  return (
    <>
      <Nav />
      <NotifyPageView path="/game" />
      <main>
        <h1>{pick(lang, "게임", "Game")}</h1>
        <p className="sub">{pick(lang, "잠깐 쉬어가기 — 떨어지는 코인을 받아보세요.", "Take a break — catch the falling coins.")}</p>
        <Game />
      </main>
    </>
  );
}
