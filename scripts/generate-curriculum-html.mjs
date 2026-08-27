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

// 파서·헬퍼·EXPLAINERS 는 curriculum-shared.mjs 로 옮겼다 (jay, 2026-08-27) — PoCs
// 페이지도 같은 항목을 섹션으로 그리게 되면서 두 생성기가 같은 코드를 필요로 한다.
import {
  DONE_COLOR, TODO_COLOR, CURRICULA, GROUP_LABEL_EN,
  parseCurriculum, inline, shortLabel, subtitle, firstSentences, sentenceRange,
  STUDY_SECTIONS, STUDY_SECTIONS_EN, EXPLAINERS, EXPLAINERS_EN, itemUrl,
} from './curriculum-shared.mjs';

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
            ? `\n          <p class="topic-how"><strong>How it works</strong>${inline(how)}</p>`
            : '';
          const whyHtml = ex?.why
            ? `\n          <p class="topic-why"><strong>Why</strong>${inline(ex.why)}</p>`
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

  // index.html 에는 더 이상 섹션을 만들지 않는다 (jay, 2026-08-28). 인덱스에서
  // Algorithms·Math 섹션을 없애고, 두 목록으로 가는 길은 PoCs 섹션 아래의
  // "All Algorithms" · "All Math" 링크가 맡는다 — 커리큘럼 152개가 인덱스에서
  // 카드 12장을 차지하고 있었는데, 그 12장이 답하는 질문("지금 어디까지 왔나")은
  // algorithms.html · math.html 이 훨씬 잘 답한다.
  console.log(
    `${cfg.sectionTitle}: ${cfg.out} (${all.length} topics, ${doneItems.length} done)`
  );
}

for (const cfg of CURRICULA) build(cfg);
