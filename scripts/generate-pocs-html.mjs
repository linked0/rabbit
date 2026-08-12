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
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
// 페이지 껍데기(레일+본문 레이아웃)는 algorithms.html·math.html 과 공유한다 — scripts/rtd-shell.mjs.
import { renderRtdPage, escapeHtml } from './rtd-shell.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const INDEX_HTML = path.join(REPO_ROOT, 'docs', 'index.html');
const OUT_HTML = path.join(REPO_ROOT, 'docs', 'pocs.html');
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
const numbered = cards.map((c, i) => ({ ...c, no: i + 1 }));

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
const navGroups = [
  {
    label: `All PoCs (${numbered.length})`,
    items: numbered.map((c) => {
      const b = badge(c);
      // 상태는 큰 색 점 하나로만 말한다 (jay, 2026-08-12) — 글자 배지는 뺐다. 목록이 조용해지고
      // 완료(하늘)는 점 색만으로 충분히 눈에 띈다. 라벨은 hover 툴팁(title)으로 남겨 둔다.
      return {
        anchor: c.key,
        text: `<span class="topic-no">${c.no}</span>${escapeHtml(c.title)}`,
        color: b.color,
        statusLabel: b.label,
      };
    }),
  },
];

const articles = numbered
  .map((c) => {
    const b = badge(c);
    const diagramNote = c.diagrams?.length
      ? `      <p class="meta">${c.diagrams.length} diagram(s) on the live page.</p>`
      : '';
    return `    <article id="${c.key}">
      <h1><span class="topic-no">${c.no}</span>${escapeHtml(c.title)} <span class="badge" style="background:${b.color}22; color:${b.color};">${b.label}</span></h1>
      <p class="lead">${escapeHtml(c.description)}</p>
      <p class="meta">${escapeHtml(c.howTo)}</p>
      <h2>Why</h2>
      <p>${escapeHtml(c.purpose ?? '')}</p>
      <h2>How it works</h2>
      <p>${escapeHtml(c.howItWorks ?? '')}</p>
${diagramNote}
      <p><a href="${cardUrl(c)}">Open on jaylabs.xyz &rarr;</a></p>
    </article>`;
  })
  .join('\n');

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
    contentHtml: articles,
  }),
  'utf8'
);
console.log(
  `PoCs: index section (${Math.min(cards.length, INDEX_CARD_LIMIT)}/${cards.length} cards) + docs/pocs.html (${cards.length} in sidebar) updated`
);
