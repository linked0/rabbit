import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../Nav";
import { PROJECTS, findProject } from "@/lib/home-content";
import { getPostHtml } from "@/lib/posts";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// 프로젝트 상세 — content/profile/<slug>.md 전체 내용을 렌더 (linked0.github.io에서 복사).
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = findProject(params.slug);
  if (!project) notFound();
  const lang = getLang();
  const html = getPostHtml(project.slug, lang);

  return (
    <>
      <Nav />
      <main>
        <p style={{ marginBottom: 12 }}>
          <Link href="/">← {pick(lang, "홈", "Home")}</Link>
        </p>
      <h1>{project.title}</h1>
      <p className="sub">
        {project.date} · {project.readTime}
      </p>
      {(project.liveUrl || project.whitepaper) && (
        <p style={{ margin: "0 0 20px", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {project.liveUrl && (
            <a className="live-link" href={project.liveUrl} target="_blank" rel="noreferrer">
              ↗ {pick(lang, "실제 운영 사이트 (MVP)", "Live site (MVP)")}
            </a>
          )}
          {project.whitepaper && (
            <a
              className="live-link live-link-alt"
              href={pick(lang, project.whitepaper.ko, project.whitepaper.en)}
              target="_blank"
              rel="noreferrer"
            >
              📄 {pick(lang, "백서", "Whitepaper")}
            </a>
          )}
        </p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="post-hero" src={project.img} alt={project.title} />
      {html ? (
        <article className="post-body" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <section className="panel">
          <p>{project.description}</p>
        </section>
      )}
      </main>
    </>
  );
}
