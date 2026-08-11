import Link from "next/link";
import { headers } from "next/headers";
import Nav from "../Nav";
import VerexBallLazy from "./VerexBallLazy";
import SessionKeyMark from "./SessionKeyMark";
import ProfileLinks from "./ProfileLinks";
import JayChatClient from "../JayChatClient";
import { PROFILE } from "@/lib/home-content";
import { POC_CARDS, FEATURED_POC_KEY } from "@/lib/poc-cards";
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
  // 대표 PoC 한 장 — 어느 카드인지는 lib/poc-cards.ts의 FEATURED_POC_KEY가 정한다(/poc 상단과
  // 같은 출처). 없는 key여도 홈이 죽지 않도록, 못 찾으면 이 자리를 통째로 비운다.
  const poc = POC_CARDS.find((c) => c.key === FEATURED_POC_KEY);
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
          <h2 style={{ margin: 0 }}>{pick(lang, "대표 작업", "Featured")}</h2>
        </div>
        {/* 전체 보기로 나가는 문(섹션 머리 링크 → 카드 아래 서브카드)은 둘 다 어색해서
            뺐다 — 섹션 구성은 jay가 나중에 직접 다듬는다 (2026-08-06). */}
        <div className="home-split">
          {/* 좌: 수행 프로젝트 쪽 대표 — 라이브 앱으로 외부 링크. */}
          <a href={verexUrl()} target="_blank" rel="noreferrer" className="kpi featured-card">
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

          {/* 우: PoCs 쪽 대표 — 내부 라우트. 제목·설명은 카드가 원본이라 여기서 복사하지 않는다. */}
          {poc?.href && (
            <Link href={poc.href} className="kpi featured-card featured-card-poc">
              <div className="featured-mark-wrap">
                <SessionKeyMark />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="label">
                  {poc.status === "live"
                    ? pick(lang, "PoC · 라이브", "PoC · Live")
                    : pick(lang, "PoC · 목업", "PoC · Mock")}
                </div>
                <div className="value" style={{ fontSize: 18 }}>
                  {pick(lang, poc.titleKo, poc.title)}
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {pick(lang, poc.descriptionKo, poc.description)}
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Jay Chat — 별도 페이지에서 홈으로 통합 (2026-08-01, jay). */}
      <section className="panel">
        <h2>{pick(lang, "제이 챗", "Jay Chat")}</h2>
        <JayChatClient />
      </section>

      {/* 문서 미러 (jay, 2026-08-11) — docs/ 를 GitHub Pages 로 낸 정적 사이트.
          앱 안에서 다시 렌더하지 않고 링크만 둔다: 원본은 저장소의 마크다운이고,
          여기서 한 벌 더 그리면 두 벌이 갈라진다. 파일 하나가 진실이면 링크가 맞다. */}
      <section className="panel">
        <h2>{pick(lang, "문서", "Docs")}</h2>
        <p className="sub" style={{ fontSize: 13.5 }}>
          {pick(
            lang,
            "설계 문서·기능 노트·작업 히스토리 — 저장소의 마크다운을 그대로 낸 정적 사이트입니다.",
            "Design docs, feature notes, and the build history — the repository's markdown, published as-is."
          )}
        </p>
        <a
          href="https://linked0.github.io/rabbit/"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 14 }}
        >
          linked0.github.io/rabbit ↗
        </a>
      </section>

      <p className="muted" style={{ fontSize: 13 }}>
        © {new Date().getFullYear()} {PROFILE.name}
      </p>
    </main>
    </>
  );
}
