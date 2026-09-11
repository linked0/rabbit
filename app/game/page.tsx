import Nav from "../Nav";
import NotifyPageView from "@/app/NotifyPageView";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// 게임 페이지 — jayverse-game(3D 에이전트 거리 + 정산 게이트)을 임베드한다.
// 소스는 git 서브모듈 vendor/jayverse-game, 정적 export 본이 public/jayverse-game/ 에
// 들어 있고(빌드: `pnpm game:build`), 여기서 <iframe> 로 띄운다. 서브모듈은 Next 16 /
// React 19 라 Rabbit(Next 14 / React 18) 런타임과 iframe 으로 격리된다.
// 설계: ../../docs/features/jayverse-game.md.
export const dynamic = "force-dynamic";

export default function GamePage() {
  const lang = getLang();
  return (
    <>
      <Nav />
      <NotifyPageView path="/game" />
      <main>
        <h1>{pick(lang, "게임", "Game")}</h1>
        <p className="sub">
          {pick(
            lang,
            "3D 에이전트 거리 — 자율 결제 에이전트를 지켜보고, 정산 게이트로 점프해 결제가 어떻게 정산되는지 보세요.",
            "A 3D agent street — watch the autonomous payment agent, then jump through the settlement gate to see how a payment settles.",
          )}
        </p>
        <div className="game-embed">
          <iframe
            src="/jayverse-game/street.html"
            title={pick(lang, "Jayverse 게임", "Jayverse game")}
            allow="fullscreen"
          />
        </div>
      </main>
    </>
  );
}
