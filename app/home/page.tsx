import Link from "next/link";
import Nav from "../Nav";
import { PROFILE, PROJECTS } from "@/lib/home-content";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Task 5 — www.jaylabs.xyz 홈 (공개). linked0.github.io 미러 + verex 링크.
export const metadata = {
  title: `${PROFILE.name} — jaylabs.xyz`,
  description: PROFILE.tagline,
};

export default function HomePage() {
  const lang = getLang();
  // 최신순(날짜 내림차순) 정렬 — 날짜는 "YYYY-MM-DD" 문자열이라 문자열 비교로 충분.
  const projects = [...PROJECTS].sort((a, b) => b.date.localeCompare(a.date));
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

      <p className="muted" style={{ fontSize: 13 }}>
        © {new Date().getFullYear()} {PROFILE.name}
      </p>
    </main>
    </>
  );
}
