import fs from "node:fs";
import path from "node:path";
import Nav from "../Nav";
import Game from "./Game";
import NotifyPageView from "@/app/NotifyPageView";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// 게임 페이지 — 내용은 별도 저장소 jayverse-game (games/ 아래 git 서브모듈).
// 자율 결제 에이전트의 저널을 3D 마켓 거리로 재생하는 읽기 전용 뷰어다: 틱마다
// 에이전트가 보드로 걸어가 매수 / 거절(이유 라벨) / 아무것도 안 함을 연기한다.
// 서명도 송금도 없고, 게임이 에이전트를 움직이지도 않는다.
//
// 왜 iframe 인가: 게임은 Next 16 / React 19 + r3f 9, 이 앱은 Next 14 / React 18 이라
// 컴포넌트를 직접 가져올 수 없다. 게임을 자기 툴체인으로 정적 빌드(`pnpm game:build`)해
// public/jayverse-game/ 에 두고 iframe 으로 띄운다. 두 런타임은 서로를 모른다.
//
// 폴백: 정적 번들이 없으면(서브모듈 미초기화, 또는 game:build 미실행) 예전부터 있던
// 2D 캔버스 "코인 받기"를 대신 보여준다 — 빈 iframe 대신 뭐라도 돌아가고, 무엇을
// 실행해야 하는지도 화면에서 알려준다. 인증은 middleware 가 보장.
// 설계: ../../docs/features/game.md, ../../docs/features/jayverse-game.md.
export const dynamic = "force-dynamic";

const GAME_BASE = "/jayverse-game";
// 랜딩(/)이 아니라 재생 화면으로 바로 들어간다 — 임베드에서 한 번 더 클릭시킬 이유가 없다.
const GAME_ENTRY = `${GAME_BASE}/street`;

function bundleExists(): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", "jayverse-game", "index.html"));
}

export default function GamePage() {
  const lang = getLang();
  const embedded = bundleExists();

  return (
    <>
      <Nav />
      <NotifyPageView path="/game" />
      <main>
        <h1>{pick(lang, "게임", "Game")}</h1>
        {embedded ? (
          <>
            <p className="sub">
              {pick(
                lang,
                "JayVerse — 자율 결제 에이전트의 저널을 3D 거리로 재생합니다. 매수·거절·무행동이 그대로 보이고, 관전 전용이라 아무것도 서명하지 않습니다. ",
                "JayVerse — the autonomous payment agent's journal, replayed as a 3D street. Buys, refusals, and doing nothing all show up; spectator-only, nothing is signed. ",
              )}
              <a href={GAME_ENTRY} target="_blank" rel="noreferrer">
                {pick(lang, "새 탭에서 열기 ↗", "Open in a new tab ↗")}
              </a>
            </p>
            <div className="game-embed">
              <iframe
                src={GAME_ENTRY}
                title="JayVerse — agent journal replay"
                allow="fullscreen"
              />
            </div>
          </>
        ) : (
          <>
            <p className="sub">
              {pick(
                lang,
                "잠깐 쉬어가기 — 떨어지는 코인을 받아보세요.",
                "Take a break — catch the falling coins.",
              )}
            </p>
            <p className="sub">
              {pick(
                lang,
                "JayVerse 3D 재생은 아직 빌드되지 않았습니다 — ",
                "The JayVerse 3D replay isn't built yet — run ",
              )}
              <code>git submodule update --init --recursive &amp;&amp; pnpm game:build</code>
              {pick(lang, " 를 실행하면 이 자리에 뜹니다.", " and it takes this spot.")}
            </p>
            <Game />
          </>
        )}
      </main>
    </>
  );
}
