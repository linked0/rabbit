#!/usr/bin/env node
// PoCs → docs. 두 가지를 만든다 (jay 요청, 2026-08-11):
//   1) docs/index.html 의 POCS:BEGIN/END 마커 사이 — 앱의 PoCs 상단 메뉴(/poc)와 같은
//      카드 목록을 컴팩트 카드로.
//   2) docs/pocs.html — "View All PoCs" 대상. 카드마다 전체 내용(설명·purpose·howItWorks)을
//      docs/html/* 와 같은 read-the-docs 포맷으로.
//
// 소스는 lib/poc-cards.ts / lib/algorithm-cards.ts 하나뿐이다 — 앱과 문서가 같은 데이터를
// 읽으므로 카드가 바뀌어도 두 표면이 갈라지지 않는다(TIL 라벨 표류의 재발 방지).
// lib/*.ts 는 확장자 없는 ESM import 라 Node 가 직접 못 읽는다. tsc 로 CommonJS 로 임시
// 컴파일한 뒤 require 한다 — 새 의존성 없이 기존 devDep(tsc)만 쓴다.
//
// ── 2026-08-26: 비활성화 (jay) ────────────────────────────────────────────────
// "rabbit 사이트에 PoCs 는 필요 없다" — 상단 메뉴에서 PoCs 를 뺐고, 이 생성기가 만들던
// 정적 산출물(docs/pocs.html, docs/topics/pocs-*.html, docs/index.html 의 POCS 구간)도
// 더는 만들지 않는다.
//
// 파일을 지우지 않고 가드만 둔 이유:
//   1) 이 생성기는 `docs/topics/pocs-*.html` 중 자기가 쓰지 않은 파일을 **삭제한다**
//      (아래 written/claimed 정리 루프). 무심코 한 번 실행되면 66개 파일이 사라진다.
//      가드가 없으면 그 사고는 `pnpm docs:pocs` 를 습관적으로 친 순간 일어난다.
//   2) `lib/poc-cards.ts` 는 여전히 앱의 정본이다 — `/live` 허브와 `/poc/[key]` 상세가
//      그걸 읽는다. 데이터가 살아 있으므로 생성기도 언젠가 되살릴 수 있어야 한다.
//
// 되살리려면: POCS_HTML=1 node scripts/generate-pocs-html.mjs
// (혹은 이 블록을 지우고 package.json 에 "docs:pocs" 를 복원)
if (!process.env.POCS_HTML) {
  console.log(
    'generate-pocs-html: disabled (2026-08-26 — PoCs removed from the rabbit site).\n' +
      '  lib/poc-cards.ts still drives the app (/live, /poc/[key]); only the static\n' +
      '  HTML under docs/ is frozen. To run anyway: POCS_HTML=1 node scripts/generate-pocs-html.mjs',
  );
  process.exit(0);
}
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
// 페이지 껍데기(레일+본문 레이아웃, 항목 상세 페이지)는 algorithms.html·math.html 과
// 공유한다 — scripts/rtd-shell.mjs.
import { renderRtdPage, renderTopicPage, escapeHtml, wrapTables } from './rtd-shell.mjs';
import { marked as mdEngine } from 'marked'; // 아래쪽 지역 변수 marked 와 이름이 겹쳐 별칭을 쓴다
// 카드 본문은 마크다운이다 — 제목·표·목록·**강조**·`코드`·빈 줄 문단이 데이터에 들어간다.
// 예전에는 escapeHtml 만 거쳐 <p> 하나에 통째로 들어가서 별표가 화면에 그대로 찍히고
// 문단이 전부 뭉개졌다 (jay, 2026-08-21 스크린샷: "이런 구조 없는 형식은 읽을 수가 없다").
// 기준으로 삼은 것은 손으로 쓴 topics/pocs-dvt.html — 제목 40개, 표 16개, 목록 12개로
// 실제로 읽히는 페이지다. 생성 페이지도 그만큼의 구조를 가질 수 있어야 카드가 docsHref 로
// 도망칠 이유가 없어진다.
//
// 강조를 marked 에 맡기지 않고 먼저 빼내는 이유 — 돌려보고 정한 것이다. CommonMark 의
// delimiter flanking 규칙 때문에 **"따옴표로 감싼 구절"**뒤에 조사가 바로 붙으면 strong 으로
// 닫히지 않는다: 닫는 ** 가 punctuation 뒤 + 글자 앞이라 left/right 양쪽 flanking 이 되어
// 닫을 자격을 잃는다. 이스케이프 여부와 무관하게 같은 결과이고, 이 저장소의 한국어 본문에
// 흔한 문형이라 카드 7장에서 별표가 그대로 남았다. 그래서 **...** 를 먼저 자리표시자로 빼고,
// 블록 구조(표·목록·제목·코드펜스)만 marked 에 맡긴 뒤 마지막에 <strong> 으로 복원한다.
//
// 순서: 이스케이프 -> 강조 토큰화 -> marked(블록) -> 강조 복원.
// 이스케이프가 먼저여야 카드에 <tag> 같은 문자열이 있어도 태그로 해석되지 않는다.
function mdRender(v, { inline = false } = {}) {
  if (!v) return '';
  const bold = [];
  const tokenised = escapeHtml(String(v)).replace(
    /\*\*([^*]+?)\*\*/g,
    (_, inner) => `@@B${bold.push(inner) - 1}@@`
  );
  const html = inline
    ? mdEngine.parseInline(tokenised, { async: false })
    : mdEngine.parse(tokenised, { async: false });
  const restored = html
    .replace(/@@B(\d+)@@/g, (_, i) => `<strong>${mdEngine.parseInline(bold[Number(i)], { async: false })}</strong>`)
    .trim();
  // 표는 가로 스크롤 상자로 감싼다 (jay, 2026-08-26) — 좁은 화면에서 열이 짜부라지거나
  // 페이지 전체가 옆으로 밀리는 것을 막는 유일한 방법이다. inline 렌더에는 표가 없다.
  return inline ? restored : wrapTables(restored);
}
const md = (v) => mdRender(v);
const mdInline = (v) => mdRender(v, { inline: true });

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const INDEX_HTML = path.join(REPO_ROOT, 'docs', 'index.html');
const OUT_HTML = path.join(REPO_ROOT, 'docs', 'pocs.html');
const TOPICS_DIR = path.join(REPO_ROOT, 'docs', 'topics'); // 항목별 상세 페이지 (Algorithms·Math 와 같은 디렉터리)
const TMP_DIR = path.join(REPO_ROOT, '.pocs-cards-tmp');
const SITE = 'https://www.jaylabs.xyz';

// ── 카드 데이터 로드 (tsc → CJS → require) ──────────────────────────────────
fs.rmSync(TMP_DIR, { recursive: true, force: true });
execFileSync(
  path.join(REPO_ROOT, 'node_modules', '.bin', 'tsc'),
  [
    'lib/poc-cards.ts', 'lib/algorithm-cards.ts',
    '--module', 'commonjs', '--target', 'es2020', '--moduleResolution', 'node',
    '--esModuleInterop', '--skipLibCheck', '--outDir', TMP_DIR,
  ],
  { cwd: REPO_ROOT, stdio: 'inherit' },
);
const require_ = createRequire(import.meta.url);
const { POC_CARDS } = require_(path.join(TMP_DIR, 'poc-cards.js'));
const { TIL_REMAINING } = require_(path.join(TMP_DIR, 'algorithm-cards.js'));
const { sortDemoCards } = require_(path.join(TMP_DIR, 'demo-cards.js'));
fs.rmSync(TMP_DIR, { recursive: true, force: true });

// 앱의 /poc 페이지와 같은 목록·순서 (app/poc/page.tsx): 라이브는 /live 허브 소관이라 뺀다.
// 한 목록으로 합친다 (jay, 2026-08-12) — 앱은 이미 두 소스를 그리드 하나에 그리는데
// (2026-08-11: "제목만 다른 두 그리드는 다른 물건이라는 신호를 준다") 문서에만 PoCs ·
// Algorithms & Notes 구분이 남아 있었다. 순서는 앱과 같게: PoC 카드 먼저, 그다음 알고리즘.
const cards = [
  ...sortDemoCards(POC_CARDS.filter((c) => c.status !== 'live')),
  ...sortDemoCards(TIL_REMAINING.filter((c) => c.status !== 'live')),
];

// 묶음 없이 한 목록 (jay, 2026-08-12) — PoCs/Done 으로 갈랐다가 다시 합쳤다. 18장짜리
// 목록에서 소제목 두 개는 구조라기보다 방해였고, 상태는 색 점이 이미 말한다.
// 대신 항목마다 번호를 매긴다: "몇 개 중 몇 번째"가 보이면 목록의 길이가 가늠된다.
// "Later" 묶음 (jay, 2026-08-14) — 지금 중요하지 않은 항목을 목록 아래로 내린다. status
// 로는 표현이 안 되는 구분이라 카드의 later 플래그로 가른다: 이것들도 여전히 계획이지만,
// 목록 위쪽을 차지할 이유가 없다. 번호는 본 목록 다음으로 이어져 전체 개수는 그대로다.
const mainCards = cards.filter((c) => !c.later);
const laterCards = cards.filter((c) => c.later);
const numbered = [...mainCards, ...laterCards].map((c, i) => ({ ...c, no: i + 1 }));
const numberedMain = numbered.slice(0, mainCards.length);
const numberedLater = numbered.slice(mainCards.length);

// DemoCard.tsx 와 같은 구분 — 오직 status 로만 정한다 (2026-08-12). "href 가 있으면 목업"
// 이라는 추론은 지웠다: DVT 는 읽을 페이지가 있어도 계획이고, 게임·에이전트는 완료다.
// 여기는 라이브가 이미 걸러졌으니 완료·준비 중 둘만 나온다.
function badge(card) {
  return card.status === 'done'
    ? { label: 'DONE', color: '#0284c7' }
    : { label: 'PLANNED', color: '#64748b' };
}

// 전용 페이지가 없어도 /poc/[key] 상세가 항상 있다 (2026-08-11) — 죽은 링크가 안 생긴다.
const cardUrl = (card) => SITE + (card.href ?? `/poc/${card.key}`);

// 로컬 상세 페이지 — docsHref(손으로 쓴 노트)가 있으면 그쪽이 정본, 없으면 아래에서
// 자동 생성하는 docs/topics/pocs-<key>.html (jay, 2026-08-13: "detail page link 추가하고
// detail page 자체도 만들어야 한다" — Algorithms·Math 와 같은 2단 구조: 목록 + 상세).
const detailHref = (card) => card.docsHref ?? `topics/pocs-${card.key}.html`;

function readCodeSnippet(key) {
  try {
    return fs.readFileSync(path.join(REPO_ROOT, 'docs', 'code', 'pocs', `${key}.py`), 'utf8');
  } catch {
    return null;
  }
}

// ── 0) 항목별 상세 페이지 (docs/topics/pocs-<key>.html) ─────────────────────
// docsHref 가 있는 카드(예: isaac-groot)는 손으로 쓴 노트가 정본이라 건너뛴다.
// 나머지는 카드 데이터(purpose·howItWorks·diagrams·관련 코드)로 상세 페이지를 만든다 —
// Algorithms·Math 의 docs/topics/*.html 스텁 생성과 같은 패턴.
// topics/ 안에서 이웃 항목으로 가는 링크 — docsHref 카드는 그 경로를(../ 접두, 절대
// URL 이면 그대로), 아니면 이번에 만드는 형제 파일명을 쓴다 (Algorithms·Math 의
// itemUrl 과 같은 규칙).
function topicPagerHref(card) {
  if (card.docsHref) return /^https?:\/\//.test(card.docsHref) ? card.docsHref : `../${card.docsHref}`;
  return `pocs-${card.key}.html`;
}

fs.mkdirSync(TOPICS_DIR, { recursive: true });
const written = new Set();
for (const [idx, c] of numbered.entries()) {
  if (c.docsHref) continue;
  const fname = `pocs-${c.key}.html`;
  written.add(fname);
  const b = badge(c);
  const prev = numbered[idx - 1];
  const next = numbered[idx + 1];
  const diagramNote = c.diagrams?.length
    ? `      <p class="meta">${c.diagrams.length} diagram(s) on the live page.</p>\n`
    : '';
  const code = readCodeSnippet(c.key);
  const codeHtml = code
    ? `      <h2>Related code</h2>\n      <pre><code>${escapeHtml(code)}</code></pre>\n      <p class="code-link"><a href="../code/pocs/${c.key}.py">docs/code/pocs/${c.key}.py</a></p>\n`
    : '';
  const codeHtmlKo = code
    ? `      <h2>관련 코드</h2>\n      <pre><code>${escapeHtml(code)}</code></pre>\n      <p class="code-link"><a href="../code/pocs/${c.key}.py">docs/code/pocs/${c.key}.py</a></p>\n`
    : '';
  const openLink = `<a href="${cardUrl(c)}">Open on jaylabs.xyz &rarr;</a>`;
  // 이중언어 — 영어 먼저, 한국어 나중 (jay, 2026-08-13). 카드 데이터에 이미 있는 *Ko
  // 필드를 그대로 쓴다 — 번역을 새로 짓지 않는다.
  fs.writeFileSync(
    path.join(TOPICS_DIR, fname),
    renderTopicPage({
      title: `${c.title} — PoCs`,
      crumbHtml: `<a href="../index.html">Workspace Index</a> &rsaquo; <a href="../pocs.html">PoCs</a> &rsaquo; ${escapeHtml(c.title)}`,
      // 표제부를 본문에서 분리한다 (jay, 2026-08-26). 예전에는 h1·요약·howTo 가 본문
      // 문단들과 같은 상자 안에 그냥 얹혀 있어서 글이 어디서 시작하는지 보이지 않았다.
      // 번호·상태·제목·요약·언어 전환을 hero 한 곳에 모으고, 본문 두 덩어리(영/한)는
      // 각자 상자를 갖는다 — 이중언어 페이지에서 위아래로 훑지 않고 건너뛸 수 있다.
      bodyHtml: `  <header class="topic-hero">
      <p class="topic-kicker"><span class="topic-no">#${c.no}</span><span>PoC</span><span class="badge" style="background:${b.color}22; color:${b.color};">${b.label}</span></p>
      <h1>${escapeHtml(c.title)}</h1>
      <p class="lead">${mdInline(c.description)}</p>
      <p class="meta">${mdInline(c.howTo)}</p>
      <nav class="lang-switch" aria-label="Language"><a href="#en">English</a><a href="#ko">한국어</a></nav>
    </header>
    <article id="en">
      <nav class="lang-switch" aria-label="Language"><a href="#en" class="on">English</a><a href="#ko">한국어</a></nav>
      <h2>Why</h2>
      ${md(c.purpose)}
      <h2>How it works</h2>
      ${md(c.howItWorks)}
${diagramNote}${codeHtml}      <p>${openLink}</p>
    </article>
    <article id="ko" lang="ko">
      <nav class="lang-switch" aria-label="Language"><a href="#en">English</a><a href="#ko" class="on">한국어</a></nav>
      <h1>${escapeHtml(c.titleKo)}</h1>
      <p class="lead">${mdInline(c.descriptionKo)}</p>
      <p class="meta">${mdInline(c.howToKo)}</p>
      <h2>왜</h2>
      ${md(c.purposeKo)}
      <h2>동작 방식</h2>
      ${md(c.howItWorksKo)}
${diagramNote}${codeHtmlKo}      <p>${openLink}</p>
    </article>`,
      pagerHtml: `${
        prev ? `<a href="${escapeHtml(topicPagerHref(prev))}">&larr; ${prev.no}. ${escapeHtml(prev.title)}</a>` : '<span></span>'
      }${
        next ? `<a href="${escapeHtml(topicPagerHref(next))}">${next.no}. ${escapeHtml(next.title)} &rarr;</a>` : '<span></span>'
      }`,
    }),
    'utf8'
  );
}
// 이번에 쓴 파일만 남긴다 — 카드에 docsHref 를 나중에 붙이거나 순서가 바뀌면 예전 스텁이
// "지워진 항목의 페이지"로 남는 걸 막는다 (Algorithms·Math 스텁 생성과 같은 이유).
// 예외: 카드가 docsHref 로 이 디렉터리의 파일을 직접 가리키면 그건 손으로 쓴 정본이므로
// 지우지 않는다 (jay, 2026-08-13 — DVT 노트처럼 생성 템플릿보다 긴 글이 필요한 경우).
const claimed = new Set(
  numbered
    .filter((c) => c.docsHref && !/^https?:\/\//.test(c.docsHref) && path.dirname(c.docsHref) === 'topics')
    .map((c) => path.basename(c.docsHref)),
);
for (const f of fs.readdirSync(TOPICS_DIR)) {
  if (f.startsWith('pocs-') && !written.has(f) && !claimed.has(f)) fs.rmSync(path.join(TOPICS_DIR, f));
}

// ── 1) index.html 의 PoCs 섹션 ──────────────────────────────────────────────
// 인덱스에는 상위 6장만 (jay, 2026-08-12) — 전체 목록은 pocs.html("View All PoCs")이 맡는다.
// 정렬이 live→done→soon + 날짜순이라, 6장은 "가장 완성됐고 가장 최근인" 카드들이 된다.
const INDEX_CARD_LIMIT = 6;
const sectionCards = cards
  .slice(0, INDEX_CARD_LIMIT)
  .map((c) => {
    const b = badge(c);
    return `                    <a href="${cardUrl(c)}" class="card" style="border-left: 4px solid ${b.color};">
                        <span class="card-title">${escapeHtml(c.title)} <span class="badge" style="background: ${b.color}22; color: ${b.color};">${b.label}</span></span>
                        <span class="card-path">${escapeHtml(c.description)}</span>
                    </a>`;
  })
  .join('\n');

const section = `            <div class="section">
                <h2 class="section-title">PoCs</h2>
                <div class="grid">
${sectionCards}
                </div>
                <div style="text-align: right; margin-top: 12px;">
                    <a href="pocs.html"
                        style="color: var(--accent); font-weight: 600; text-decoration: none; font-size: 0.95rem;">View
                        All PoCs &rarr;</a>
                </div>
            </div>`;

const index = fs.readFileSync(INDEX_HTML, 'utf8');
const marked = index.replace(
  /(<!-- POCS:BEGIN -->)[\s\S]*?(<!-- POCS:END -->)/,
  `$1\n${section}\n            $2`,
);
if (marked === index && !index.includes('<!-- POCS:BEGIN -->')) {
  throw new Error('docs/index.html 에 POCS:BEGIN/END 마커가 없습니다.');
}
fs.writeFileSync(INDEX_HTML, marked, 'utf8');

// ── 2) docs/pocs.html — 읽기 문서(read-the-docs) 레이아웃 ───────────────────
// 좌측 고정 레일에 **전체 항목**을 싣고 본문은 오른쪽 (jay, 2026-08-12, verex /docs 레퍼런스).
// 인덱스가 6장만 보여주게 된 뒤로 이 페이지가 "전부 있는 곳"이 됐고, 상단 TOC 하나로는
// 18개를 훑기 어렵다 — 레일은 어디까지 왔든 목록이 눈앞에 남는다.
function navItems(list) {
  return list.map((c) => {
      const b = badge(c);
      // 상태는 큰 색 점 하나로만 말한다 (jay, 2026-08-12) — 글자 배지는 뺐다. 목록이 조용해지고
      // 완료(하늘)는 점 색만으로 충분히 눈에 띈다. 라벨은 hover 툴팁(title)으로 남겨 둔다.
      return {
        anchor: c.key,
        text: `<span class="topic-no">${c.no}</span>${escapeHtml(c.title)}`,
        color: b.color,
        statusLabel: b.label,
      };
  });
}
// 레일도 같은 두 묶음으로 나눈다 — 아래로 내린 것을 위에서 다시 만나면 내린 의미가 없다.
const navGroups = [
  { label: `All PoCs (${numberedMain.length})`, items: navItems(numberedMain) },
  ...(numberedLater.length
    ? [{ label: `Later (${numberedLater.length})`, items: navItems(numberedLater) }]
    : []),
];

// 원래 있던 lead(description) + Why(purpose)가 좋았다 (jay, 2026-08-13) — 코드·How it
// works만 상세로 옮기고, "무엇을·왜 중요한지"는 목록에 그대로 남긴다. Algorithms·Math
// 목록도 같은 두 줄(요약+Why) 포맷을 쓴다. "내용이 너무 단순하다"는 후속 피드백에 맞춰
// Why 는 한 문장이 아니라 n 문장(기본 2개)까지 가져온다.
const firstSentences = (s, n = 2) => {
  const parts = (s ?? '').match(/[^.]*\.(\s|$)/g);
  if (!parts) return s ?? '';
  return parts.slice(0, n).join('').trim();
};

function rowsFor(list) {
  return list
  .map((c) => {
    const b = badge(c);
    const mark = ` <span class="badge" style="background:${b.color}22; color:${b.color};">${b.label}</span>`;
    const links = `<a href="${detailHref(c)}">Detail &rarr;</a> &middot; <a href="${cardUrl(c)}">Open on jaylabs.xyz &rarr;</a>`;
    // How it works — 상세 페이지의 howItWorks 필드를 그대로 복사한다 (jay, 2026-08-13:
    // "add why and how it works to the list page, not move — just copy it"). 상세
    // 페이지는 전체 문단을 그대로 유지한다.
    const how = firstSentences(c.howItWorks, 2);
    const howHtml = how ? `\n          <p class="topic-how"><strong>How it works:</strong> ${mdInline(how)}</p>` : '';
    const why = firstSentences(c.purpose, 2);
    const whyHtml = why ? `\n          <p class="topic-why"><strong>Why:</strong> ${mdInline(why)}</p>` : '';
    return `        <li id="${c.key}">
          <div class="topic-head"><span class="topic-no">${c.no}</span><span class="topic-title">${escapeHtml(c.title)}</span>${mark}</div>
          <p class="topic-summary">${mdInline(c.description)}</p>${howHtml}${whyHtml}
          <p class="topic-link">${links}</p>
        </li>`;
  })
  .join('\n');
}

// 두 절로 나눠 그린다 (jay, 2026-08-14). Later 는 접지 않고 그냥 아래에 둔다 — 숨기면
// 있다는 것 자체를 잊고, 접으면 클릭이 하나 는다. 소제목과 한 줄 설명이면 충분하다.
const laterHtml = numberedLater.length
  ? `
    <article>
      <h1>Later</h1>
      <p class="lead">Not important right now. Kept because the idea is still worth having, not because it is queued.</p>
      <ul class="topics">
${rowsFor(numberedLater)}
      </ul>
    </article>`
  : '';

const contentHtml = `    <article>
      <h1>All PoCs</h1>
      <ul class="topics">
${rowsFor(numberedMain)}
      </ul>
    </article>${laterHtml}`;

fs.writeFileSync(
  OUT_HTML,
  renderRtdPage({
    title: 'PoCs — All Contents',
    railTitle: 'Rabbit',
    railTitleHref: 'index.html',
    railSub: `PoCs &mdash; all contents (${cards.length})`,
    filterPlaceholder: 'Filter PoCs',
    navGroups,
    railFoot: `<a href="index.html">&larr; Workspace Index</a> &middot; <a href="${SITE}/poc">Live PoCs menu</a>`,
    srcLine:
      'Source: lib/poc-cards.ts, lib/algorithm-cards.ts (auto-generated by scripts/generate-pocs-html.mjs — edit the card data, not this file)',
    contentHtml,
  }),
  'utf8'
);
console.log(
  `PoCs: index section (${Math.min(cards.length, INDEX_CARD_LIMIT)}/${cards.length} cards) + docs/pocs.html (${cards.length} in sidebar) updated`
);
