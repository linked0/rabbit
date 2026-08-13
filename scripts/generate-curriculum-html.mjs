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
const CODE_DIR = path.join(REPO_ROOT, 'docs', 'code'); // 항목별 관련 코드 (jay, 2026-08-13)

// docs/code/<cfg.id>/<cfg.id>-<no>.py 가 있으면 그 내용을 그대로 읽어 온다.
// 파일이 없으면 null — 스텁 페이지는 기존 "10~25줄 채워 넣기" 안내로 남는다.
function readCodeSnippet(id, no) {
  try {
    return fs.readFileSync(path.join(CODE_DIR, id, `${id}-${no}.py`), 'utf8');
  } catch {
    return null;
  }
}
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

// 섹션 구간 라벨의 영어판 (jay, 2026-08-13 — 영어 블록에 한국어가 섞이지 않게).
const GROUP_LABEL_EN = {
  'A. 고급 알고리즘·자료구조 (Day 1–19)': 'A. Advanced Algorithms & Data Structures (Day 1-19)',
  'B. 컴파일러·런타임·VM (Day 20–35)': 'B. Compilers, Runtimes & VMs (Day 20-35)',
  'C. 동시성·성능 엔지니어링 (Day 36–51)': 'C. Concurrency & Performance Engineering (Day 36-51)',
  'D. 분산시스템·합의 (Day 52–68)': 'D. Distributed Systems & Consensus (Day 52-68)',
  'E. 데이터·스토리지 엔진 (Day 69–81)': 'E. Data & Storage Engines (Day 69-81)',
  'F. 암호학·ZK (Day 82–96)': 'F. Cryptography & ZK (Day 82-96)',
  'G. AI 엔지니어링 (Day 97–100)': 'G. AI Engineering (Day 97-100)',
  '시작 — 값의 시간가치와 시장 (Day 1–2)': 'Opening — The Time Value of Money and Markets (Day 1-2)',
  '7월 — 이산수학·논리 (Day 3–10)': 'July — Discrete Math & Logic (Day 3-10)',
  '8월 — 게임이론·프로토콜 경제학 (Day 11–17)': 'August — Game Theory & Protocol Economics (Day 11-17)',
  '9월 — 선형대수 (Day 18–26)': 'September — Linear Algebra (Day 18-26)',
  '10월 — 미적분·최적화 (Day 27–34)': 'October — Calculus & Optimization (Day 27-34)',
  '11월 — 확률·통계·금융수학 (Day 35–43)': 'November — Probability, Statistics & Financial Math (Day 35-43)',
  '12월 — 암호학·정보이론 (Day 44–52)': 'December — Cryptography & Information Theory (Day 44-52)',
};

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

// 목록 페이지의 "제대로 된 설명" (jay, 2026-08-13) — 커리큘럼 한 줄 요약 대신, 있으면
// EXPLAINERS 의 개념 설명 앞부분을 쓴다. "내용이 너무 단순하다"는 jay 피드백(2026-08-13)에
// 맞춰 한 문장이 아니라 n 문장(기본 2개)까지 가져온다 — 전체 문단은 여전히 상세 페이지 몫.
function firstSentences(text, n = 2) {
  const parts = text.match(/[^.]*\.(\s|$)/g);
  if (!parts) return text;
  return parts.slice(0, n).join('').trim();
}

// 목록 페이지에 "동작 방식"도 함께 싣는다 (jay, 2026-08-13: "add why and how it works to
// the list page, not move — just copy it"). EXPLAINERS 에 별도 howItWorks 필드가 없으니,
// concept 문단의 두 번째 조각(보통 메커니즘을 설명하는 문장들)을 그대로 복사해 온다 —
// 상세 페이지의 개념 문단은 그대로 두고, 목록에는 같은 원문에서 다른 구간을 보여준다.
function sentenceRange(text, startIdx, n) {
  const parts = text.match(/[^.]*\.(\s|$)/g);
  if (!parts) return '';
  return parts.slice(startIdx, startIdx + n).join('').trim();
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

// 영어판 — 상세 페이지에 영어 버전을 먼저, 한국어를 뒤에 둔다 (jay, 2026-08-13).
const STUDY_SECTIONS_EN = [
  ['Concept', 'One paragraph. "Know it exists, reach for it when needed" is the bar.'],
  ['Code & Formula', '10-25 lines. One working minimal example or one derivation step.'],
  ['Exercise', 'One problem to solve by hand — a question that moves your hands, not the answer.'],
  ['Practical Connection', 'One line — where this topic actually comes up.'],
];

// "코드·수식"은 docs/code/<id>/<id>-<no>.py 가 있으면 그 내용을 그대로 boxed 코드로 붙인다
// (jay, 2026-08-13 요청 — 이전에는 "손으로 짜 보는 자리"라 항상 빈 칸이었지만, 지금은 항목마다
// 실행 가능한 최소 예제를 미리 채워 두기로 했다). 파일이 없으면 기존 안내 문구만 남는다.

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

// 영어판 설명 — 같은 구조, 영어 title/concept/why/exercise/link (jay, 2026-08-13 요청).
const EXPLAINERS_EN = (() => {
  const p = path.join(REPO_ROOT, 'docs', 'knowledge', 'explainers.en.json');
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
    const ex = EXPLAINERS[cfg.id]?.[String(item.no)];
    const exEn = EXPLAINERS_EN[cfg.id]?.[String(item.no)];
    const code = readCodeSnippet(cfg.id, item.no);

    // 코드 섹션은 언어와 무관하다 — 헤더 라벨만 h 에 맞춰 바뀐다.
    const codeSectionHtml = (h, hint) =>
      code
        ? `      <h2>${escapeHtml(h)}</h2>\n      <pre><code>${escapeHtml(code)}</code></pre>\n      <p class="code-link"><a href="../code/${cfg.id}/${cfg.id}-${item.no}.py">docs/code/${cfg.id}/${cfg.id}-${item.no}.py</a></p>`
        : `      <h2>${escapeHtml(h)}</h2>\n      <p class="meta">${escapeHtml(hint)}</p>`;

    const koBody = STUDY_SECTIONS.map(([h, hint]) => {
      if (h === '코드 · 수식') return codeSectionHtml(h, hint);
      const fill = {
        개념: ex ? `${inline(ex.concept)}${ex.why ? `</p>\n      <p>${inline(ex.why)}` : ''}` : null,
        연습: ex?.exercise ? inline(ex.exercise) : null,
        '실무 · Verex 연결': ex?.link ? inline(ex.link) : null,
      }[h];
      return fill
        ? `      <h2>${escapeHtml(h)}</h2>\n      <p>${fill}</p>`
        : `      <h2>${escapeHtml(h)}</h2>\n      <p class="meta">${escapeHtml(hint)}</p>`;
    }).join('\n');

    const enBody = STUDY_SECTIONS_EN.map(([h, hint]) => {
      if (h === 'Code & Formula') return codeSectionHtml(h, hint);
      const fill = {
        Concept: exEn ? `${inline(exEn.concept)}${exEn.why ? `</p>\n      <p>${inline(exEn.why)}` : ''}` : null,
        Exercise: exEn?.exercise ? inline(exEn.exercise) : null,
        'Practical Connection': exEn?.link ? inline(exEn.link) : null,
      }[h];
      return fill
        ? `      <h2>${escapeHtml(h)}</h2>\n      <p>${fill}</p>`
        : `      <h2>${escapeHtml(h)}</h2>\n      <p class="meta">${escapeHtml(hint)}</p>`;
    }).join('\n');

    fs.writeFileSync(
      path.join(TOPICS_DIR, `${cfg.id}-${item.no}.html`),
      renderTopicPage({
        title: `Day ${item.no} — ${exEn?.title ?? shortLabel(item.text)}`,
        crumbHtml: `<a href="../index.html">Workspace Index</a> &rsaquo; <a href="../${cfg.viewAllHref}">${escapeHtml(cfg.sectionTitle)}</a> &rsaquo; Day ${item.no}`,
        // 영어가 먼저, 한국어가 뒤 (jay, 2026-08-13). 빈 "노트 없음" 안내 대신
        // **공부할 자리**를 깔아 둔다(jay, 2026-08-12: "we need detail page that I can
        // learn later") — 커리큘럼이 항목마다 달아 둔 한 줄 요약을 리드로 올리고,
        // 그 아래 하루치 노트의 네 칸을 미리 만들어 둔다.
        bodyHtml: `  <article>
      <h1>${exEn?.title ? escapeHtml(exEn.title) : inline(shortLabel(item.text))} <span class="badge" style="background:${TODO_COLOR}22; color:${TODO_COLOR};">TODO</span></h1>
      <p class="meta">${escapeHtml(cfg.sectionTitle)} &middot; Day ${item.no} / ${all.length} &middot; ${escapeHtml(GROUP_LABEL_EN[group?.label] ?? group?.label ?? '')}</p>
${enBody}
      <p class="stub">If you study this on a given day, add a note link and a ✅ to this line in the source curriculum (<code>${escapeHtml(cfg.source)}</code>) and this spot will lead straight to the note body. You can also write directly on this page &mdash; but regenerating overwrites it, so it's safer to keep anything you want to save as markdown under <code>docs/algorithms/</code>.</p>
    </article>
    <hr class="lang-divider">
    <article lang="ko">
      <p class="lang-label">한국어</p>
      <h1>${inline(shortLabel(item.text))} <span class="badge" style="background:${TODO_COLOR}22; color:${TODO_COLOR};">TODO</span></h1>
      <p class="meta">${escapeHtml(cfg.sectionTitle)} &middot; Day ${item.no} / ${all.length} &middot; ${escapeHtml(group?.label ?? '')}</p>
${subtitle(item.text) ? `      <p class="lead">${inline(subtitle(item.text))}</p>` : ''}
${koBody}
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

  // 예외: 항목의 href 가 이 디렉터리의 파일을 직접 가리키면 그건 손으로 쓴 노트가 곧 상세
  // 페이지인 경우다 — 스텁을 만들지도 않지만 지우지도 않는다 (jay, 2026-08-13: math-3 처럼
  // 생성된 학습 섹션 아래에 세션 노트를 덧붙여 정본으로 삼는 경우).
  const claimed = new Set(
    all
      .filter((i) => i.href && !/^https?:\/\//.test(i.href) && path.dirname(i.href) === 'topics')
      .map((i) => path.basename(i.href)),
  );
  for (const f of fs.readdirSync(TOPICS_DIR)) {
    if (f.startsWith(`${cfg.id}-`) && !written.has(f) && !claimed.has(f)) fs.rmSync(path.join(TOPICS_DIR, f));
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

  // 항목마다 요약 + 상세 페이지 링크 (jay, 2026-08-13: "PoCs 랑 같은 포맷 — summary 랑
  // link to the detail page"). PoCs 의 각 카드 article(제목+배지, lead, 링크)과 같은 모양을
  // 커리큘럼 항목에도 적용한다 — 제목만 있는 한 줄 목록 대신, 항목마다 한 눈에 무엇인지
  // 보이고 상세 페이지로 가는 링크가 따로 있다.
  const sections = groups
    .map((g) => {
      const rows = g.items
        .map((i) => {
          const href = escapeHtml(itemUrl(cfg, i));
          const mark = i.done
            ? ` <span class="badge topic-done" style="background:${DONE_COLOR}22; color:${DONE_COLOR};">DONE</span>`
            : '';
          // 설명이 있으면(EXPLAINERS) 개념 첫 문장 + 왜 중요한지를, 없으면(주로 done 항목)
          // 커리큘럼의 "— 요약" 조각만 — "무엇을·왜"가 목록만 보고도 보이게 한다
          // (jay, 2026-08-13: "brief description ... what to do and why it's important").
          const ex = EXPLAINERS[cfg.id]?.[String(i.no)];
          const sub = ex?.concept ? firstSentences(ex.concept, 2) : subtitle(i.text);
          const summaryHtml = sub ? `\n          <p class="topic-summary">${inline(sub)}</p>` : '';
          // "동작 방식"은 concept 의 다음 구간을 그대로 복사한다 — 개념(무엇)과 겹치지 않게
          // 뒤쪽 문장을 쓴다. 상세 페이지의 개념 문단은 손대지 않는다(2026-08-13, "not move
          // the part just copy it").
          const how = ex?.concept ? sentenceRange(ex.concept, 2, 2) : '';
          const howHtml = how
            ? `\n          <p class="topic-how"><strong>How it works:</strong> ${inline(how)}</p>`
            : '';
          const whyHtml = ex?.why
            ? `\n          <p class="topic-why"><strong>Why:</strong> ${inline(ex.why)}</p>`
            : '';
          return `        <li id="${cfg.id}-${i.no}">
          <div class="topic-head"><span class="topic-no">${i.no}</span><span class="topic-title">${inline(shortLabel(i.text))}</span>${mark}</div>${summaryHtml}${howHtml}${whyHtml}
          <p class="topic-link"><a href="${href}">Detail &rarr;</a></p>
        </li>`;
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
