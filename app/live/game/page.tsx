import Nav from "../../Nav";
import BackLink from "../../BackLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Game View (jay, 2026-11-03: "one more view like Game View which is using Unity engine … this one is
// Unity version of Bird View"). rabbit-hole(Unity)의 BirdGame 모드를 WebGL 로 띄운다 — 같은 빌드가
// `?view=bird` 일 때만 거리 대신 이 판을 짓는다. 빌드는 scripts/sync-game-view.sh 가 public/game-view/ 로 복사한다.
// Unity 화면 안의 글자는 영어다: WebGL 에는 OS 글꼴이 없어 내장 글꼴에 한글 글리프가 없다.
export default function GamePage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  return (
    <>
      <Nav />
      <main className="stack-main">
        <BackLink lang={lang} href="/live" ko="Jayverse" en="Jayverse" />
        <h1>{t("Game View — Bird View 를 Unity 로", "Game View — Bird View in Unity")}</h1>
        <p className="sub">
          {t(
            "Bird View 와 같은 세 시나리오(에이전트 결제 · Canton · AiTM 중계 피싱)를 Unity 엔진으로 그린 판입니다. 시나리오 타일을 누르면 판으로 부풀고, 사용자가 걸어 들어가고, 부품이 솟아오릅니다. Unity 화면 안의 글자는 영어입니다.",
            "The same three scenarios as Bird View (agentic payment, Canton, AiTM relay phishing), drawn with the Unity engine. Press a scenario tile and it swells into a board, the user walks onto it, and its parts pop up.",
          )}
        </p>
        <div className="mv-stage" style={{ marginTop: 16 }}>
          <iframe src="/game-view/index.html" title="Game View (Unity)" className="gv-frame" allow="fullscreen" />
        </div>
      </main>
    </>
  );
}
