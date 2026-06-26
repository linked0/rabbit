import Link from "next/link";
import { PROFILE, PROJECTS } from "@/lib/home-content";

// Task 5 — www.jaylabs.xyz 홈 (공개). linked0.github.io 미러 + verex 링크.
export const metadata = {
  title: `${PROFILE.name} — jaylabs.xyz`,
  description: PROFILE.tagline,
};

export default function HomePage() {
  return (
    <main>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30 }}>{PROFILE.name}</h1>
        <p className="sub" style={{ fontSize: 16, maxWidth: 620 }}>
          {PROFILE.tagline}
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
          {PROFILE.links.map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
          <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
        </div>
      </header>

      {/* jaylabs 앱 링크 */}
      <section className="panel">
        <h2>jaylabs</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a className="card-link" href="https://verex.jaylabs.xyz">
            → Verex
          </a>
          <Link className="card-link" href="/summary">
            → Rabbit (투자 요약)
          </Link>
        </div>
      </section>

      {/* 프로젝트 (linked0.github.io 미러) */}
      <section className="panel">
        <h2>Projects</h2>
        <div className="scenario-grid">
          {PROJECTS.map((p) => (
            <Link key={p.slug} href={`/home/${p.slug}`} className="kpi" style={{ textDecoration: "none" }}>
              <div className="label">
                {p.date} · {p.readTime}
              </div>
              <div className="value" style={{ fontSize: 16 }}>
                {p.title}
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {p.description}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <p className="muted" style={{ fontSize: 13 }}>
        © 2025 {PROFILE.name} · mirrored from{" "}
        <a href="https://linked0.github.io/">linked0.github.io</a>
      </p>
    </main>
  );
}
