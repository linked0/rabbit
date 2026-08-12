#!/usr/bin/env node
// 커리큘럼 → 문서 (jay, 2026-08-12). 두 트랙을 같은 방식으로 만든다:
//   · 개발자 지식 100 → docs/algorithms.html + index.html 의 Algorithms 섹션
//   · 매일의 수학 50  → docs/math.html      + index.html 의 Math 섹션
//
// 원본은 docs/knowledge/*-curriculum.md 하나뿐이다. 매일 공부한 항목에 ✅ 를 붙이고
// 노트가 생기면 제목을 [텍스트](경로) 로 감싸면 되며, 색인과 전체 페이지는 여기서 다시
// 만들어진다 — 두 표면에 같은 목록을 손으로 적지 않는다(카드 데이터와 같은 원칙).
import fs from 'node:fs';
import path from 'node:path';
import { renderRtdPage, renderTopicPage, escapeHtml } from './rtd-shell.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const INDEX_HTML = path.join(REPO_ROOT, 'docs', 'index.html');
const TOPICS_DIR = path.join(REPO_ROOT, 'docs', 'topics'); // 항목별 상세 페이지
const INDEX_CARD_LIMIT = 6; // 색인은 6장 — 전체는 "View All" 이 맡는다 (jay, 2026-08-12)

const DONE_COLOR = '#0284c7'; // poc 카드의 DONE 과 같은 하늘색
const TODO_COLOR = '#64748b';

const CURRICULA = [
  {
    id: 'algorithms',
    marker: 'ALGOS',
    sectionTitle: 'Algorithms',
    source: 'docs/knowledge/dev-100-curriculum.md',
    out: 'docs/algorithms.html',
    viewAllHref: 'algorithms.html',
    viewAllLabel: 'View All Algorithms',
    pageTitle: 'Algorithms — 개발자 지식 100',
  },
  {
    id: 'math',
    marker: 'MATH',
    sectionTitle: 'Math',
    source: 'docs/knowledge/math-50-curriculum.md',
    out: 'docs/math.html',
    viewAllHref: 'math.html',
    viewAllLabel: 'View All Math',
    pageTitle: 'Math — 매일의 수학 50',
  },
];

// ── 파싱 ────────────────────────────────────────────────────────────────────
// 필요한 것만 읽는다: 제목(#), 인용 블록(>), 구간(##), 번호 항목(N.).
// 완료는 줄 끝의 ✅, 노트는 [텍스트](경로) 링크로 표현된다.
function parseCurriculum(md) {
  const lines = md.split('\n');
  const title = (lines.find((l) => l.startsWith('# ')) ?? '# ').slice(2).trim();
  const intro = lines
    .filter((l) => l.startsWith('> ') && !l.includes('확장 큐'))
    .map((l) => l.slice(2).trim());

  const groups = [];
  let current = null;
  for (const line of lines) {
    const head = /^##\s+(.+)$/.exec(line);
    if (head) {
      current = { label: head[1].trim(), items: [] };
      groups.push(current);
      continue;
    }
    const item = /^(\d+)\.\s+(.+)$/.exec(line);
    if (item && current) {
      let text = item[2].trim();
      const done = text.endsWith('✅');
      if (done) text = text.slice(0, -1).trim();
      // [제목](경로) 이면 링크를 분리한다 — 항목 본문은 제목만 남는다.
      let href = null;
      const link = /^\[([^\]]+)\]\(([^)]+)\)\s*$/.exec(text);
      if (link) {
        text = link[1];
        href = link[2];
      }
      current.items.push({ no: Number(item[1]), text, done, href });
    }
  }
  return { title, intro, groups: groups.filter((g) => g.items.length > 0) };
}

// 인라인 마크다운은 최소만 — **굵게**, `코드`. 나머지는 평문으로 둔다.
function inline(s) {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// 레일 라벨: "제목 — 설명" 이면 제목만 (100개를 288px 레일에서 훑을 수 있게).
function shortLabel(text) {
  const cut = text.split(/\s+—\s+|\s+→\s+/)[0];
  return cut.length > 46 ? `${cut.slice(0, 45)}…` : cut;
}

// "제목 — 설명" 의 설명 쪽. 커리큘럼이 이미 각 항목에 한 줄 요약을 달아 두었으므로,
// 상세 페이지가 빈 껍데기가 되지 않게 그 줄을 리드로 올린다 (jay, 2026-08-12).
function subtitle(text) {
  const m = /\s+—\s+(.+)$/.exec(text);
  return m ? m[1] : '';
}

// 하루치 노트의 뼈대 — 커리큘럼 머리말이 정한 분량 그대로:
// "개념 1개 + 코드/수식 10~25줄 + 연습 1개 + 실무·Verex 연결 1줄".
// 공부하는 날 이 순서대로 채우면 되고, 채운 뒤에는 md 에 노트를 링크해 이 페이지를 대체한다.
const STUDY_SECTIONS = [
  ['개념', '한 문단으로. "존재를 알고 필요할 때 꺼내 쓰는" 수준이 멈춤선이다.'],
  ['코드 · 수식', '10~25줄. 돌아가는 최소 예제 하나 또는 유도 한 단계.'],
  ['연습', '직접 풀 문제 하나. 답이 아니라 손이 움직이는 질문으로.'],
  ['실무 · Verex 연결', '한 줄. 이 주제가 실제로 어디서 걸리는지.'],
];

// 항목별 개념 설명 (jay, 2026-08-12: "detail page 에 개념 설명을 넣어 두면 나중에 배운다").
// 상세 페이지가 빈 양식이 아니라 **읽고 시작할 수 있는 글**이 되게 하는 부분이다.
// 파일이 없으면 조용히 뼈대만 그린다 — 설명은 있으면 좋은 것이지 생성의 전제가 아니다.
const EXPLAINERS = (() => {
  const p = path.join(REPO_ROOT, 'docs', 'knowledge', 'explainers.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
})();

// 항목이 열려야 할 곳 (jay, 2026-08-12: "노트가 있으면 곧장 그 페이지로 가야 한다").
//   · 노트가 있으면 → 노트 본문. 중간에 링크 하나만 있는 페이지를 한 번 더 거치지 않는다.
//   · 아직 없으면  → docs/topics/ 의 스텁 상세 페이지. 갈 곳 없는 항목을 만들지 않으려는 것.
// base 는 링크를 쓰는 파일의 위치다 — 커리큘럼 md 의 노트 경로가 docs/ 기준이라,
// docs/topics/ 안에서는 ../ 를 붙여야 한다(절대 URL 은 그대로).
function itemUrl(cfg, item, base = 'docs') {
  if (item.href) {
    if (/^https?:\/\//.test(item.href)) return item.href;
    return base === 'topics' ? `../${item.href}` : item.href;
  }
  return base === 'topics' ? `${cfg.id}-${item.no}.html` : `topics/${cfg.id}-${item.no}.html`;
}

// ── 생성 ────────────────────────────────────────────────────────────────────
function build(cfg) {
  const md = fs.readFileSync(path.join(REPO_ROOT, cfg.source), 'utf8');
  const { title, intro, groups } = parseCurriculum(md);
  const all = groups.flatMap((g) => g.items);
  const doneItems = all.filter((i) => i.done);

  // 0) 아직 노트가 없는 항목에만 스텁 상세 페이지를 만든다 (jay, 2026-08-12).
  //    노트가 있는 항목은 그 노트가 곧 상세 페이지다 — 링크 하나만 든 중간 페이지를
  //    끼워 넣으면 클릭이 한 번 더 늘 뿐이다. 앞뒤 이동은 itemUrl 로 풀기 때문에
  //    이웃이 노트든 스텁이든 사슬은 끊기지 않는다.
  fs.mkdirSync(TOPICS_DIR, { recursive: true });
  // 이번에 쓴 파일만 남긴다 — 항목에 노트를 붙이거나 번호를 다시 매기면 예전 스텁이 그대로
  // 남아 "지워진 항목의 페이지"가 살아 있게 된다 (2026-08-12, 수학 재번호에서 실제로 발생).
  const written = new Set();
  for (const [idx, item] of all.entries()) {
    if (item.href) continue;
    written.add(`${cfg.id}-${item.no}.html`);
    const group = groups.find((g) => g.items.includes(item));
    const prev = all[idx - 1];
    const next = all[idx + 1];
    fs.writeFileSync(
      path.join(TOPICS_DIR, `${cfg.id}-${item.no}.html`),
      renderTopicPage({
        title: `Day ${item.no} — ${shortLabel(item.text)}`,
        crumbHtml: `<a href="../index.html">Workspace Index</a> &rsaquo; <a href="../${cfg.viewAllHref}">${escapeHtml(cfg.sectionTitle)}</a> &rsaquo; Day ${item.no}`,
        // 빈 "노트 없음" 안내 대신 **공부할 자리**를 깔아 둔다 (jay, 2026-08-12:
        // "we need detail page that I can learn later"). 커리큘럼이 항목마다 달아 둔
        // 한 줄 요약을 리드로 올리고, 그 아래 하루치 노트의 네 칸을 미리 만들어 둔다.
        bodyHtml: `  <article>
      <h1>${inline(shortLabel(item.text))} <span class="badge" style="background:${TODO_COLOR}22; color:${TODO_COLOR};">TODO</span></h1>
      <p class="meta">${escapeHtml(cfg.sectionTitle)} &middot; Day ${item.no} / ${all.length} &middot; ${escapeHtml(group?.label ?? '')}</p>
${subtitle(item.text) ? `      <p class="lead">${inline(subtitle(item.text))}</p>` : ''}
${(() => {
  const ex = EXPLAINERS[cfg.id]?.[String(item.no)];
  // 설명이 있으면 개념·연습·연결 칸을 그 내용으로 채우고, 없으면 쓰는 요령만 남긴다.
  // "코드·수식"은 늘 빈 칸이다 — 손으로 짜 보는 게 그 칸의 목적이라 대신 채우지 않는다.
  const fill = {
    개념: ex ? `${inline(ex.concept)}${ex.why ? `</p>\n      <p>${inline(ex.why)}` : ''}` : null,
    연습: ex?.exercise ? inline(ex.exercise) : null,
    '실무 · Verex 연결': ex?.link ? inline(ex.link) : null,
  };
  return STUDY_SECTIONS.map(([h, hint]) =>
    fill[h]
      ? `      <h2>${escapeHtml(h)}</h2>\n      <p>${fill[h]}</p>`
      : `      <h2>${escapeHtml(h)}</h2>\n      <p class="meta">${escapeHtml(hint)}</p>`
  ).join('\n');
})()}
      <p class="stub">공부한 날 원본 커리큘럼(<code>${escapeHtml(cfg.source)}</code>)의 이 줄에 노트 링크와 ✅ 를 붙이면, 이 자리는 노트 본문으로 바로 이어집니다. 노트 없이 이 페이지에 바로 적어도 됩니다 &mdash; 다만 다시 생성하면 덮어쓰이므로, 남길 글은 <code>docs/algorithms/</code> 의 마크다운으로 쓰는 편이 안전합니다.</p>
    </article>`,
        pagerHtml: `${
          prev
            ? `<a href="${escapeHtml(itemUrl(cfg, prev, 'topics'))}">&larr; ${prev.no}. ${escapeHtml(shortLabel(prev.text))}</a>`
            : '<span></span>'
        }${
          next
            ? `<a href="${escapeHtml(itemUrl(cfg, next, 'topics'))}">${next.no}. ${escapeHtml(shortLabel(next.text))} &rarr;</a>`
            : '<span></span>'
        }`,
      }),
      'utf8'
    );
  }

  for (const f of fs.readdirSync(TOPICS_DIR)) {
    if (f.startsWith(`${cfg.id}-`) && !written.has(f)) fs.rmSync(path.join(TOPICS_DIR, f));
  }

  // 1) 전체 페이지 (read-the-docs 껍데기 공유)
  const navGroups = groups.map((g) => ({
    label: g.label,
    items: g.items.map((i) => ({
      anchor: `${cfg.id}-${i.no}`,
      text: `<span class="topic-no">${i.no}</span>${inline(shortLabel(i.text))}`,
      color: i.done ? DONE_COLOR : TODO_COLOR,
      statusLabel: i.done ? 'DONE' : 'TODO',
    })),
  }));
  // 완료 묶음(Done 섹션)은 두지 않는다 (jay, 2026-08-12) — 같은 항목을 목록에 두 번
  // 싣는 셈이라 커리큘럼처럼 순서가 곧 내용인 목록에서는 오히려 방해다. 완료 여부는
  // 하늘색 점과 본문의 DONE 배지가 이미 말한다. PoCs 페이지도 같은 이유로 한 목록이다.

  const sections = groups
    .map((g) => {
      const rows = g.items
        .map((i) => {
          // 제목은 항상 상세 페이지로 (2026-08-12) — 노트가 없는 항목도 갈 곳이 있어야
          // 커리큘럼에 구멍이 안 생긴다. 노트 링크는 상세 페이지 안에 있다.
          const body = `<a href="${escapeHtml(itemUrl(cfg, i))}">${inline(i.text)}</a>`;
          const mark = i.done
            ? ` <span class="badge topic-done" style="background:${DONE_COLOR}22; color:${DONE_COLOR};">DONE</span>`
            : '';
          return `        <li id="${cfg.id}-${i.no}"><span class="topic-no">${i.no}</span><span class="topic-text">${body}${mark}</span></li>`;
        })
        .join('\n');
      return `    <article>
      <h1>${escapeHtml(g.label)}</h1>
      <ul class="topics">
${rows}
      </ul>
    </article>`;
    })
    .join('\n');

  const introHtml = intro.map((p) => `      <p>${inline(p)}</p>`).join('\n');
  const contentHtml = `    <article>
      <h1>${escapeHtml(title)}</h1>
${introHtml}
      <p class="meta">${doneItems.length} / ${all.length} done</p>
    </article>
${sections}`;

  fs.writeFileSync(
    path.join(REPO_ROOT, cfg.out),
    renderRtdPage({
      title: cfg.pageTitle,
      railTitle: 'Rabbit',
      railTitleHref: 'index.html',
      railSub: `${escapeHtml(cfg.sectionTitle)} &mdash; ${all.length} topics, ${doneItems.length} done`,
      filterPlaceholder: `Filter ${cfg.sectionTitle.toLowerCase()}`,
      navGroups,
      railFoot: '<a href="index.html">&larr; Workspace Index</a>',
      srcLine: `Source: ${cfg.source} (auto-generated by scripts/generate-curriculum-html.mjs — edit the curriculum, not this file)`,
      contentHtml,
    }),
    'utf8'
  );

  // 2) index.html 섹션 — 완료한 것 먼저, 그다음 아직인 것 순으로 6개.
  //    "지금 어디까지 왔나"가 색인에서 답해야 할 유일한 질문이다.
  const picked = [...doneItems, ...all.filter((i) => !i.done)].slice(0, INDEX_CARD_LIMIT);
  const cards = picked
    .map((i) => {
      const color = i.done ? DONE_COLOR : TODO_COLOR;
      const badge = i.done ? 'DONE' : `DAY ${i.no}/${all.length}`;
      const href = itemUrl(cfg, i);
      const group = groups.find((g) => g.items.includes(i));
      return `                    <a href="${escapeHtml(href)}" class="card" style="border-left: 4px solid ${color};">
                        <span class="card-title">${inline(shortLabel(i.text))} <span class="badge" style="background: ${color}33; color: ${color};">${badge}</span></span>
                        <span class="card-path">${escapeHtml(group?.label ?? '')}</span>
                    </a>`;
    })
    .join('\n');

  const section = `            <div class="section">
                <h2 class="section-title">${escapeHtml(cfg.sectionTitle)}</h2>
                <div class="grid">
${cards}
                </div>
                <div style="text-align: right; margin-top: 12px;">
                    <a href="${escapeHtml(cfg.viewAllHref)}"
                        style="color: var(--accent); font-weight: 600; text-decoration: none; font-size: 0.95rem;">${escapeHtml(cfg.viewAllLabel)} &rarr;</a>
                </div>
            </div>`;

  const index = fs.readFileSync(INDEX_HTML, 'utf8');
  const begin = `<!-- ${cfg.marker}:BEGIN -->`;
  const end = `<!-- ${cfg.marker}:END -->`;
  if (!index.includes(begin)) throw new Error(`docs/index.html 에 ${begin} 마커가 없습니다.`);
  fs.writeFileSync(
    INDEX_HTML,
    index.replace(
      new RegExp(`(${begin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})[\\s\\S]*?(${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`),
      `$1\n${section}\n            $2`
    ),
    'utf8'
  );

  console.log(
    `${cfg.sectionTitle}: ${cfg.out} (${all.length} topics, ${doneItems.length} done) + index section (${picked.length} cards)`
  );
}

for (const cfg of CURRICULA) build(cfg);
