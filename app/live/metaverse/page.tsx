import Nav from "../../Nav";
import BackLink from "../../BackLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import MetaverseLazy from "./MetaverseLazy";

// Metaverse View (jay, 2026-11-03: "the Metaverse View is a game version of Bird View").
// Bird View(/live/stack)와 같은 두 시나리오를 3D 섬으로 — 설명은 같은 std.ts 를 읽는다.
export default function MetaversePage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  return (
    <>
      <Nav />
      <main className="stack-main">
        <BackLink lang={lang} href="/live" ko="Jayverse" en="Jayverse" />
        <h1>{t("Metaverse View — 두 시나리오를 걸어 다니기", "Metaverse View — walk the two scenarios")}</h1>
        <p className="sub">
          {t(
            "Bird View 의 게임판입니다. 섬을 누르면 부풀면서 그 시나리오의 부품이 솟아오르고, 부품을 누르면 설명이 뜹니다. 각본이고, 실제로 도는 것은 말풍선이 링크하는 데모들입니다.",
            "The game version of Bird View. Press an island and it swells as that scenario's parts rise; press a part to read it. Scripted — the things that run are the demos the bubbles link to.",
          )}
        </p>
        <MetaverseLazy lang={lang} />
      </main>
    </>
  );
}
