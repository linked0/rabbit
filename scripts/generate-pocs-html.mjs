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
const cards = [
  ...sortDemoCards(POC_CARDS.filter((c) => c.status !== 'live')),
  ...sortDemoCards(TIL_REMAINING.filter((c) => c.status !== 'live')),
];

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// DemoCard.tsx 와 같은 3분법: 라이브 / 목업(전용 페이지 있음) / 준비 중.
// 여기는 라이브가 이미 걸러졌으니 목업·준비 중 둘만 나온다.
function badge(card) {
  return card.href
    ? { label: 'MOCK', color: '#6366f1' }
    : { label: 'PLANNED', color: '#64748b' };
}

// 전용 페이지가 없어도 /poc/[key] 상세가 항상 있다 (2026-08-11) — 죽은 링크가 안 생긴다.
const cardUrl = (card) => SITE + (card.href ?? `/poc/${card.key}`);

// ── 1) index.html 의 PoCs 섹션 ──────────────────────────────────────────────
const sectionCards = cards
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

// ── 2) docs/pocs.html — read-the-docs 포맷 전체 목록 ───────────────────────
// 페이지 틀·스타일은 generate-docs-html.mjs 의 renderPage 와 같은 모양을 유지한다.
const articles = cards
  .map((c) => {
    const b = badge(c);
    const diagramNote = c.diagrams?.length
      ? `<p class="meta">${c.diagrams.length} diagram(s) on the live page.</p>`
      : '';
    return `  <article id="${c.key}">
    <h1>${escapeHtml(c.title)} <span class="badge" style="background:${b.color}22; color:${b.color};">${b.label}</span></h1>
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

const toc = cards
  .map((c) => `    <li><a href="#${c.key}">${escapeHtml(c.title)}</a></li>`)
  .join('\n');

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PoCs — All Contents</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root { --bg:#f8fafc; --card:#fff; --text:#0f172a; --text2:#475569; --accent:#0ea5e9; --border:#e2e8f0; }
  * { box-sizing: border-box; }
  body { font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); line-height:1.7; margin:0; padding:0; }
  .wrap { max-width: 820px; margin:0 auto; padding: 28px 18px 80px; }
  .back { display:inline-block; margin-bottom:18px; color:var(--accent); text-decoration:none; font-size:0.92rem; font-weight:500; }
  .src { font-family: ui-monospace, monospace; font-size:0.78rem; color:var(--text2); margin-bottom:20px; word-break:break-all; }
  article { background: var(--card); border:1px solid var(--border); border-radius:14px; padding: 24px 22px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.06); margin-bottom: 22px; }
  article h1 { margin-top: 0; font-size:1.35rem; line-height:1.3; }
  h2 { font-size:1.05rem; line-height:1.3; margin: 18px 0 6px; }
  a { color: var(--accent); word-break: break-word; }
  p { margin: 8px 0; word-wrap: break-word; }
  .lead { color: var(--text2); font-style: italic; }
  .meta { font-size: 0.85rem; color: var(--text2); }
  .badge { font-size: 0.62em; font-weight: 700; padding: 2px 8px; border-radius: 999px; vertical-align: middle; letter-spacing: 0.04em; }
  .toc { background: var(--card); border:1px solid var(--border); border-radius:14px; padding: 18px 22px; margin-bottom: 22px; }
  .toc ul { margin: 8px 0 0; padding-left: 20px; }
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="index.html">&larr; Index</a>
  <div class="src">Source: lib/poc-cards.ts, lib/algorithm-cards.ts (auto-generated by scripts/generate-pocs-html.mjs &mdash; edit the card data, not this file)</div>
  <div class="toc">
    <strong>PoCs — everything on the <a href="${SITE}/poc">PoCs menu</a>, full contents (${cards.length})</strong>
    <ul>
${toc}
    </ul>
  </div>
${articles}
</div>
</body>
</html>
`;
fs.writeFileSync(OUT_HTML, page, 'utf8');
console.log(`PoCs: index section (${cards.length} cards) + docs/pocs.html updated`);
