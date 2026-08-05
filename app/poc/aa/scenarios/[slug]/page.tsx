import { notFound } from "next/navigation";
import Nav from "../../../../Nav";
import BackLink from "../../../../BackLink";
import MermaidDiagram from "../../../../MermaidDiagram";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { AGENT_SCENARIOS, findScenario } from "@/lib/agent-scenarios";

// 시나리오 상세 — /poc/aa 의 "이 구성요소로 만드는 에이전트" 각 항목이 여기로 들어온다.
// 그림 두 장을 나란히 두는 이유: 관계도는 "권한과 돈이 어느 방향으로 흐르나", 순서도는 "언제
// 무슨 일이 일어나나"를 답한다 — 한 장에 합치면 둘 다 흐려진다 (jay, 2026-08-05).
export function generateStaticParams() {
  return AGENT_SCENARIOS.map((s) => ({ slug: s.slug }));
}

export default function ScenarioPage({ params }: { params: { slug: string } }) {
  const scenario = findScenario(params.slug);
  if (!scenario) notFound();

  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} href="/poc/aa" ko="에이전트를 위한 AA" en="AA for agents" />
        <h1>{t(scenario.titleKo, scenario.title)}</h1>
        <p className="sub">
          {t("쓰이는 구성요소: ", "Blocks used: ")}
          {scenario.blocks}
          {" · "}
          {scenario.live
            ? t("오늘 동작하는 구성", "works today")
            : t("아직 시연 불가 — 설명만", "not demonstrable yet — explainer only")}
        </p>

        <p style={{ marginTop: 16, maxWidth: 640 }}>{t(scenario.thesisKo, scenario.thesis)}</p>

        <h2 style={{ marginTop: 32 }}>{t("등장 주체", "Who is involved")}</h2>
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {scenario.entities.map((e) => (
            <div key={e.name} className="panel" style={{ maxWidth: 640 }}>
              <strong>{t(e.nameKo, e.name)}</strong>
              <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
                {t(e.roleKo, e.role)}
              </p>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: 32 }}>{t("관계 — 무엇이 어느 방향으로 흐르나", "Relations — what flows which way")}</h2>
        <MermaidDiagram definition={scenario.relation} />

        <h2 style={{ marginTop: 32 }}>{t("순서 — 언제 무슨 일이", "Sequence — what happens when")}</h2>
        <MermaidDiagram definition={scenario.sequence} />

        <h2 style={{ marginTop: 32 }}>{t("이 구성이 보장하는 것", "What this actually guarantees")}</h2>
        <p style={{ marginTop: 8, maxWidth: 640 }}>{t(scenario.guaranteeKo, scenario.guarantee)}</p>

        <h2 style={{ marginTop: 32 }}>{t("보장하지 않는 것", "What it does not")}</h2>
        <p style={{ marginTop: 8, maxWidth: 640 }}>{t(scenario.limitationKo, scenario.limitation)}</p>

        <p className="sub" style={{ marginTop: 40, fontSize: 13 }}>
          <a href="/poc/aa">← {t("다른 시나리오 보기", "Back to the other scenarios")}</a>
        </p>
      </main>
    </>
  );
}
