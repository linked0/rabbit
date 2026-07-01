import Nav from "../Nav";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Target IA: JayVerse (/jayverse) — 쩌는 쇼케이스 스텁. 설계: docs/features/jayverse.md
export default function JayVersePage() {
  const lang = getLang();
  return (
    <>
      <Nav />
      <main>
        <h1>JayVerse <span className="sub">SIMULATED / DEMO</span></h1>
        <p className="sub">
          {pick(
            lang,
            "준비 중 — Gravia 스타일 라이브 트레이딩 대시보드(목업 피드, 100% 시뮬레이션). 설계: ",
            "Coming soon — a Gravia-style live-trading dashboard (mock feed, 100% simulated). Design: "
          )}
          <code>docs/features/jayverse.md</code>
        </p>
      </main>
    </>
  );
}
