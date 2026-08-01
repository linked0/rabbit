import Link from "next/link";
import { headers } from "next/headers";
import Nav from "../Nav";
import VerexBallLazy from "./VerexBallLazy";
import JayChatClient from "../JayChatClient";
import { PROFILE, PROJECTS } from "@/lib/home-content";
import { verexUrl } from "@/lib/verex";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { notifyPageView } from "@/lib/visitor-notify";

// Task 5 — www.jaylabs.xyz 홈 (공개). linked0.github.io 미러 + verex 링크.
export const metadata = {
  title: `${PROFILE.name} — jaylabs.xyz`,
  description: PROFILE.tagline,
};

export default function HomePage() {
  const lang = getLang();
  notifyPageView("/ (home)", headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown");
  // 홈에 싣는 대표 프로젝트 — jay가 직접 고른 3건(가장 중요한 것들)이라 날짜순이 아니라
  // 이 순서를 그대로 쓴다. 해당 slug 가 없어지면 조용히 빠지도록 filter (2026-08-01, jay).
  const HOME_SLUGS = ["boaspace", "votera", "evm-bosagora"];
  const featured = HOME_SLUGS.map((s) => PROJECTS.find((p) => p.slug === s)).filter(
    (p): p is (typeof PROJECTS)[number] => !!p
  );
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
          <div
            className="muted"
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {pick(lang, "링크", "Links")}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {PROFILE.links.map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
            <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
          </div>
        </div>
      </header>

      {/* 수행 프로젝트 요약 — 좌: 피처드(Verex + 3D 구), 우: 프로젝트 텍스트 목록.
          전체(이미지 카드 그리드 포함)는 /projects 에서 (2026-08-01, jay). */}
      <section className="panel">
        <div className="home-sec-head">
          <h2 style={{ margin: 0 }}>{pick(lang, "수행 프로젝트", "Projects")}</h2>
          <Link href="/projects" className="home-proj-more">
            {pick(lang, "전체 보기 →", "View all →")}
          </Link>
        </div>
        <div className="home-split">
          {/* 좌: 피처드 — 라이브 앱으로 외부 링크. */}
          <a href={verexUrl()} target="_blank" rel="noreferrer" className="kpi featured-card">
            <div className="featured-mark-wrap">
              <VerexBallLazy />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="label">{pick(lang, "라이브 · 예측 시장", "Live · Prediction market")}</div>
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

          {/* 우: 프로젝트 제목만 (설명 줄 없음 — 섹션이 너무 길어져서, 2026-08-01 jay).
              최신순이 아니라 jay가 꼽은 대표 3건을 고정으로 싣는다 (2026-08-01):
              NFT 마켓플레이스 · DAO 거버넌스 · EVM 기반 Bosagora 메인넷.
              나머지는 "전체 보기 →"(= /projects)로 넘긴다. */}
          <div className="home-proj-list">
            {featured.map((p) => (
              <Link key={p.slug} href={`/home/${p.slug}`} className="home-proj-row">
                <div className="value" style={{ fontSize: 14.5 }}>
                  {pick(lang, p.titleKo ?? p.title, p.title)}
                </div>
              </Link>
            ))}
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
