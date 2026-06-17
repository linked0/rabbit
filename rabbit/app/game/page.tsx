import Nav from "../Nav";
import Game from "./Game";

// 게임 페이지 (plan §2 #2) — 가벼운 캔버스 미니게임. 인증은 middleware가 보장.
export const dynamic = "force-dynamic";

export default function GamePage() {
  return (
    <>
      <Nav />
      <main>
        <h1>게임</h1>
        <p className="sub">잠깐 쉬어가기 — 떨어지는 코인을 받아보세요.</p>
        <Game />
      </main>
    </>
  );
}
