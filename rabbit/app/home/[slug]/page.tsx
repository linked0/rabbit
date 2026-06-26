import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS, findProject } from "@/lib/home-content";

// Task 5 — 프로젝트 서브페이지 (linked0.github.io 미러). 원문 전체는 sourceUrl.
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = findProject(params.slug);
  if (!project) notFound();

  return (
    <main>
      <p style={{ marginBottom: 12 }}>
        <Link href="/home">← Home</Link>
      </p>
      <h1>{project.title}</h1>
      <p className="sub">
        {project.date} · {project.readTime}
      </p>
      <section className="panel">
        <p>{project.description}</p>
        <p className="muted" style={{ marginTop: 12 }}>
          전체 글:{" "}
          <a href={project.sourceUrl} target="_blank" rel="noreferrer">
            {project.sourceUrl}
          </a>
        </p>
      </section>
    </main>
  );
}
