import Link from "next/link";
import { headers } from "next/headers";
import Nav from "../Nav";
import VerexBallLazy from "./VerexBallLazy";
import ProfileLinks from "./ProfileLinks";
import JayChatClient from "../JayChatClient";
import { PROFILE } from "@/lib/home-content";
import { JAYVERSE, projectUrl, isLocalHost } from "@/lib/jayverse";
import { verexUrl } from "@/lib/verex";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Task 5 — www.jaylabs.xyz 홈 (공개). linked0.github.io 미러 + verex 링크.
export const metadata = {
  title: `${PROFILE.name} — jaylabs.xyz`,
  description: PROFILE.tagline,
};

export default function HomePage() {
  const lang = getLang();
  // The Host the browser actually used. On a phone over Tailscale that is
  // 100.x.y.z:3100, and every ecosystem link has to carry the same address —
  // "localhost" there would mean the phone (jay, 2026-09-15).
  const host = headers().get("host");
  // Home no longer pings Telegram — everyone lands here, so it was the least informative signal.
  // Page-view pings now fire on the *other* top-menu pages via <NotifyPageView/> (jay, 2026-09-10).
  return (
    <>
      <Nav />
      <main>
      <header className="profile-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="avatar" src={PROFILE.photo} alt={PROFILE.name} width={96} height={96} />
        <div>
          <h1 style={{ fontSize: 30 }}>{pick(lang, PROFILE.headingKo, PROFILE.heading)}</h1>
          <p className="sub" style={{ fontSize: 16, maxWidth: 620, marginBottom: 12 }}>
            {pick(lang, PROFILE.taglineKo, PROFILE.tagline)}
          </p>
          <ProfileLinks lang={lang} />
        </div>
      </header>

      {/* 대표 작업 — 두 갈래에서 한 장씩 (2026-08-06, jay): 수행 프로젝트에서 Verex,
          PoCs에서 AA. 이전엔 프로젝트 3건의 제목 목록이 오른쪽에 있었는데, 섹션 이름이
          "대표 작업"이 된 이상 그 안에 대표가 아닌 것이 섞여 있으면 이름이 거짓말이 된다 —
          목록은 /projects로 완전히 넘겼다. */}
      <section className="panel">
        <div className="home-sec-head">
          <h2 style={{ margin: 0 }}>{pick(lang, "제이버스 생태계", "Jayverse Ecosystem")}</h2>
        </div>
        {/* 전체 보기로 나가는 문(섹션 머리 링크 → 카드 아래 서브카드)은 둘 다 어색해서
            뺐다 — 섹션 구성은 jay가 나중에 직접 다듬는다 (2026-08-06). */}
        <div className="eco-split">
          {/* 좌: 수행 프로젝트 쪽 대표 — 라이브 앱으로 외부 링크. */}
          <a href={verexUrl(host)} target="_blank" rel="noreferrer" className="kpi featured-card">
            <div className="featured-mark-wrap">
              <VerexBallLazy />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="label">
                {pick(lang, "프로젝트 · 라이브", "Project · Live")}
              </div>
              <div className="value" style={{ fontSize: 18 }}>
                Verex ↗
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                {pick(
                  lang,
                  "탈중앙화 예측 시장 — 단독 설계·개발·운영(풀스택).",
                  "A decentralized prediction market — sole developer, end-to-end."
                )}
              </div>
            </div>
          </a>

          {/* 우: 나머지 생태계 프로젝트 — 제목과 링크만. 설명을 넣으면 섹션이 길어져
              Jay Chat 이 한 화면에서 밀려난다 (jay, 2026-09-15). 목록은
              lib/jayverse.ts 한 곳에서 오고 /devnet 도 같은 파일을 읽는다. */}
          <div className="eco-grid">
            {/* verex 는 왼쪽 큰 카드로 이미 있고, rabbit 은 이 페이지 자신이다 —
                자기 자신으로 가는 링크를 카드로 두지 않는다 (jay, 2026-09-15). */}
            {JAYVERSE.filter((p) => p.key !== "verex" && p.key !== "rabbit").map((p) => {
              const href = projectUrl(p, host);
              if (!href) return null;
              const label = (
                <span className="eco-name">
                  {p.name}
                  {href.startsWith("http") && <span className="eco-ext"> ↗</span>}
                </span>
              );
              return href.startsWith("http") ? (
                <a key={p.key} href={href} target="_blank" rel="noreferrer" className="eco-card">
                  {label}
                </a>
              ) : (
                <Link key={p.key} href={href} className="eco-card">
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Jay Chat — 별도 페이지에서 홈으로 통합 (2026-08-01, jay). */}
      <section className="panel">
        <h2>{pick(lang, "제이 챗", "Jay Chat")}</h2>
        <JayChatClient />
      </section>

      <p className="muted" style={{ fontSize: 13 }}>
        © {new Date().getFullYear()} {PROFILE.name}
      </p>
    </main>
    </>
  );
}
