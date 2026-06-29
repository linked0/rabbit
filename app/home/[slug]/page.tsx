import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS, findProject } from "@/lib/home-content";
import { getPostHtml } from "@/lib/posts";

// 프로젝트 상세 — content/profile/<slug>.md 전체 내용을 렌더 (linked0.github.io에서 복사).
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = findProject(params.slug);
  if (!project) notFound();
  const html = getPostHtml(project.slug);

  return (
    <main>
      <p style={{ marginBottom: 12 }}>
        <Link href="/">← Home</Link>
      </p>
      <h1>{project.title}</h1>
      <p className="sub">
        {project.date} · {project.readTime}
      </p>
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
  );
}
