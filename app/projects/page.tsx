import Link from "next/link";
import Nav from "../Nav";
import VerexBallLazy from "../home/VerexBallLazy";
import { PROFILE, PROJECTS } from "@/lib/home-content";
import { verexUrl } from "@/lib/verex";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// 수행 프로젝트 (/projects) — 홈에 있던 피처드 + 프로젝트 전체를 그대로 옮겨온 페이지.
// 홈은 이제 요약본만 두고, 전체 목록은 여기서 본다 (2026-08-01, jay).
export const dynamic = "force-dynamic";

export const metadata = {
  title: `Projects — ${PROFILE.name}`,
  description: PROFILE.tagline,
};

export default function ProjectsPage() {
  const lang = getLang();
  // 최신순(날짜 내림차순) 정렬 — 날짜는 "YYYY-MM-DD" 문자열이라 문자열 비교로 충분.
  const projects = [...PROJECTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "프로젝트", "Projects")}</h1>

        {/* 피처드: Verex — 라이브 앱으로 외부 링크. */}
        <section className="panel">
          <h2>{pick(lang, "피처드", "Featured")}</h2>
          <a href={verexUrl()} target="_blank" rel="noreferrer" className="kpi featured-card">
            <div className="featured-mark-wrap">
              <VerexBallLazy />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="label">{pick(lang, "라이브 · 예측 시장", "Live · Prediction market")}</div>
              <div className="value" style={{ fontSize: 18 }}>
                Verex ↗
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {pick(
                  lang,
                  "탈중앙화 예측 시장 — truth through exchange. CTF(조건부 토큰) 기반 Yes/No 마켓, 온체인 정산, 단독 설계·개발·운영(풀스택). 지금 라이브 앱에서 바로 사용해 볼 수 있습니다.",
                  "A decentralized prediction market — truth through exchange. CTF (conditional-token) Yes/No markets with on-chain settlement; sole developer, end-to-end (full-stack). Try the live app now."
                )}
              </div>
            </div>
          </a>
        </section>

        {/* 프로젝트 (linked0.github.io 미러) */}
        <section className="panel">
          <h2>{pick(lang, "프로젝트", "Projects")}</h2>
          <div className="scenario-grid">
            {projects.map((p) => (
              <Link key={p.slug} href={`/home/${p.slug}`} className="kpi proj-card" style={{ textDecoration: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="proj-thumb" src={p.img} alt={p.title} />
                <div className="label" style={{ marginTop: 8 }}>
                  {p.date} · {pick(lang, p.readTime.replace(" min", "분"), p.readTime)}
                </div>
                <div className="value" style={{ fontSize: 16 }}>
                  {pick(lang, p.titleKo ?? p.title, p.title)}
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {pick(lang, p.descriptionKo ?? p.description, p.description)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
