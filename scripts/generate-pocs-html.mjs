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
// Algorithms·Math 를 같은 페이지의 섹션으로 그린다 (jay, 2026-08-27) — 파서는
// curriculum-shared.mjs 한 곳에만 있고, docs/algorithms.html·math.html 도 같은 것을 쓴다.
import {
  CURRICULA, DONE_COLOR, EXPLAINERS, parseCurriculum,
  inline as curInline, shortLabel, subtitle,
  firstSentences as curFirstSentences, sentenceRange, itemUrl,
} from './curriculum-shared.mjs';
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
// 두 구획으로 가른다 (jay, 2026-08-27): 이더리움 프로토콜·코어 기술이 앞, 그 밖의 전부가
// 뒤. 예전의 "Later" 묶음은 없앴고 그 항목들은 뒤 구획으로 합쳐졌다 — 지금 중요하지 않다는
// 표시가 목록을 셋으로 가를 만큼의 값을 하지 못했다. 번호는 두 구획을 가로질러 이어진다.
// 카드 구획 (jay, 2026-08-27 에 Economics·Future 추가). 순서가 곧 번호 순서다 —
// 기계 → 그 위에 지은 것 → 돈의 논리 → 아직 오지 않은 것.
const CARD_GROUPS = [
  {
    id: 'protocol',
    title: 'Protocol',
    lead: 'Ethereum protocol and core technologies &mdash; consensus, EIPs, cryptography, and the mechanisms everything else is standing on.',
  },
  {
    id: 'applied',
    title: 'Applied',
    lead: 'Everything built on top: services, APIs, chains, payments, and the market and regulatory reading that decides what any of it is allowed to be.',
  },
  {
    id: 'economics',
    title: 'Economics',
    lead: 'The money logic underneath all of it &mdash; where a yield actually comes from, what a headline number is really counting, and the handful of macro facts that move every price on this list.',
  },
  {
    id: 'future',
    title: 'Future',
    lead: 'Robotics, embodied AI, and the constraints that decide which of it arrives &mdash; the adjacent track, kept honest about what is a demo and what is a cost curve.',
  },
];
const cardsInGroup = (id) =>
  id === 'applied'
    ? cards.filter((c) => !CARD_GROUPS.some((g) => g.id !== 'applied' && c.group === g.id))
    : cards.filter((c) => c.group === id);
const grouped = CARD_GROUPS.map((g) => ({ ...g, cards: cardsInGroup(g.id) })).filter(
  (g) => g.cards.length
);
const numbered = grouped.flatMap((g) => g.cards).map((c, i) => ({ ...c, no: i + 1 }));
{
  let at = 0;
  for (const g of grouped) {
    g.numbered = numbered.slice(at, at + g.cards.length);
    at += g.cards.length;
  }
}

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


// ── 1) index.html 의 PoCs 섹션 ──────────────────────────────────────────────
// 인덱스에는 "마지막으로 검토한" 두 장만 (jay, 2026-08-28) — 전체 목록은 pocs.html
// ("View All PoCs")이 맡는다. 이전에는 정렬 상위 6장이었는데, 정렬이 live→done→soon 이라
// 몇 달 된 라이브 데모가 늘 자리를 차지했다 — 인덱스는 "무엇이 가장 완성됐나"가 아니라
// "내가 방금 무엇을 봤나"를 보여줘야 한다. reviewed 가 없는 카드는 후보에서 빠지고,
// 아무 카드에도 없으면 예전 규칙(정렬 상위)으로 되돌아간다.
const INDEX_CARD_LIMIT = 2;
const reviewedCards = cards
  .filter((c) => c.reviewed)
  .sort((a, b) => b.reviewed.localeCompare(a.reviewed)); // 같은 날이면 배열 순서 유지
const sectionCards = (reviewedCards.length ? reviewedCards : cards)
  .slice(0, INDEX_CARD_LIMIT)
  .map((c) => {
    const b = badge(c);
    return `                    <a href="${cardUrl(c)}" class="card" style="border-left: 4px solid ${b.color};">
                        <span class="card-title">${escapeHtml(c.title)} <span class="badge" style="background: ${b.color}22; color: ${b.color};">${b.label}</span></span>
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
                        style="color: var(--accent); font-weight: 600; text-decoration: none; font-size: 0.95rem;">All
                        PoCs &rarr;</a>
                    &nbsp;&middot;&nbsp;
                    <a href="algorithms.html"
                        style="color: var(--accent); font-weight: 600; text-decoration: none; font-size: 0.95rem;">All
                        Algorithms &rarr;</a>
                    &nbsp;&middot;&nbsp;
                    <a href="math.html"
                        style="color: var(--accent); font-weight: 600; text-decoration: none; font-size: 0.95rem;">All
                        Math &rarr;</a>
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
// id 는 레일 바로가기가 이 그룹을 찾아 맨 위로 올릴 때 쓴다 (nav-<섹션 앵커>).
const navGroups = [
  ...grouped.map((g) => ({
    id: `nav-sec-${g.id}`,
    label: `${g.title} (${g.numbered.length})`,
    items: navItems(g.numbered),
  })),
];

// 원래 있던 lead(description) + Why(purpose)가 좋았다 (jay, 2026-08-13) — 코드·How it
// works만 상세로 옮기고, "무엇을·왜 중요한지"는 목록에 그대로 남긴다. Algorithms·Math
// 목록도 같은 두 줄(요약+Why) 포맷을 쓴다. "내용이 너무 단순하다"는 후속 피드백에 맞춰
// Why 는 한 문장이 아니라 n 문장(기본 2개)까지 가져온다.
// 요약 줄이 통째로 깨졌던 이유 (jay, 2026-08-27: "summary part is so complex and hard
// to read"). 옛 firstSentences 는 마침표로만 잘랐는데, 최근 카드들의 howItWorks 는
// `### 제목` + 마크다운 표로 시작한다. 표 안에는 마침표가 없어서 첫 마침표까지의 한 덩어리에
// 표 전체가 딸려 들어왔고, mdInline 은 표를 렌더하지 못하므로 파이프와 ### 이 글자 그대로
// 새어 나왔다. 그래서 두 단계로 나눈다 — 먼저 산문만 남기고(표·제목·코드·목록 제거),
// 그다음 문장을 센다. 잘린 자리에서 **가 홀수로 남으면 그것도 닫아 준다.
const proseOnly = (s) =>
  (s ?? '')
    .replace(/```[\s\S]*?```/g, ' ')   // 코드 펜스 통째로
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      if (t.startsWith('#')) return false;        // ### 소제목
      if (t.startsWith('|')) return false;        // 표 본문과 구분선
      if (t.startsWith('>')) return false;        // 인용
      if (/^[-*+]\s/.test(t)) return false;       // 불릿
      if (/^\d+\.\s/.test(t)) return false;      // 번호 목록
      if (/^([-*_]\s*){3,}$/.test(t)) return false; // 수평선
      return true;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

// 마크다운 강조가 반쪽만 남으면 ** 가 글자로 보인다. 홀수면 마지막 하나를 지운다.
const balanceMarks = (s) => {
  let out = s;
  for (const mark of ['**', '`']) {
    const n = out.split(mark).length - 1;
    if (n % 2 === 1) {
      const i = out.lastIndexOf(mark);
      out = out.slice(0, i) + out.slice(i + mark.length);
    }
  }
  return out.replace(/\s+([,.;:])/g, '$1').trim();
};

// 표로 시작하는 카드는 첫 산문이 문서 한복판이라 "Status as reported: ..." 처럼 중간부터
// 시작하는 것처럼 읽힌다. 그런 카드에서는 표가 곧 본문이므로, 소제목들을 이어 붙인 쪽이
// 정직하고 더 쓸모 있다 — 상세 페이지에 무엇이 있는지 그대로 알려 준다.
const headingTrail = (s, n = 3) => {
  const lines = (s ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length || !lines[0].startsWith('#')) return '';
  const heads = lines
    .filter((l) => /^#{2,}\s/.test(l))
    .map((l) => l.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean);
  return heads.length >= 2 ? heads.slice(0, n).join(' · ') : '';
};

const firstSentences = (s, n = 2) => {
  const trail = headingTrail(s);
  if (trail) return trail;
  const prose = proseOnly(s);
  // 문장 끝이 `... metadata.**` 처럼 마침표 뒤에 닫는 마크다운 기호가 오면, 마침표+공백만
  // 찾는 정규식은 그 경계를 놓치고 굵게 처리가 다음 문장까지 흘러넘친다. 닫는 기호를
  // 문장 끝의 일부로 인정한다.
  const parts = prose.match(/[^.]*\.(?:\*\*|\*|`|\)|"|'|\u2019|\u201d)*(?:\s|$)/g);
  return balanceMarks(parts ? parts.slice(0, n).join('').trim() : prose);
};

// 목록이 길어져서 (85장 + 커리큘럼 152개) 항목을 다 읽고 나면 돌아갈 곳이 없었다
// (jay, 2026-08-28). "Open on jaylabs.xyz"를 페이지 내 이동 두 개로 바꾼다 — 라이브
// 카드의 실제 링크는 상세 페이지에 그대로 남아 있다. `#top`은 그런 id가 없어도
// 문서 맨 위로 가는 것이 HTML 명세에 정의된 동작이라 셸을 건드릴 필요가 없다.
function rowsFor(list, sectionAnchor) {
  return list
  .map((c) => {
    const b = badge(c);
    const mark = ` <span class="badge" style="background:${b.color}22; color:${b.color};">${b.label}</span>`;
    const links = `<a href="${detailHref(c)}">Detail &rarr;</a> &middot; <a href="#top">Top &uarr;</a> &middot; <a href="#${sectionAnchor}">Section top &uarr;</a>`;
    // How it works — 상세 페이지의 howItWorks 필드를 그대로 복사한다 (jay, 2026-08-13:
    // "add why and how it works to the list page, not move — just copy it"). 상세
    // 페이지는 전체 문단을 그대로 유지한다.
    const how = firstSentences(c.howItWorks, 2);
    const howHtml = how ? `\n          <p class="topic-how"><strong>How it works</strong>${mdInline(how)}</p>` : '';
    const why = firstSentences(c.purpose, 2);
    const whyHtml = why ? `\n          <p class="topic-why"><strong>Why</strong>${mdInline(why)}</p>` : '';
    return `        <li id="${c.key}">
          <div class="topic-head"><span class="topic-no">${c.no}</span><span class="topic-title">${escapeHtml(c.title)}</span>${mark}</div>
          <p class="topic-summary">${mdInline(c.description)}</p>${howHtml}${whyHtml}
          <p class="topic-link">${links}</p>
        </li>`;
  })
  .join('\n');
}

// ── 커리큘럼 섹션 ───────────────────────────────────────────────────────────
// 항목 행은 커리큘럼 페이지와 같은 모양(번호·제목·배지 + summary/how/why + Detail)이다.
// 번호는 커리큘럼 자신의 1..N 을 그대로 쓴다 — PoC 번호와 섞으면 둘 다 뜻을 잃는다.
const curricula = CURRICULA.map((cfg) => {
  const md = fs.readFileSync(path.join(REPO_ROOT, cfg.source), 'utf8');
  const { groups } = parseCurriculum(md);
  const items = groups.flatMap((g) => g.items);
  return { cfg, groups, items, done: items.filter((i) => i.done).length };
});

function curriculumRows(cfg, items) {
  return items
    .map((i) => {
      const href = escapeHtml(itemUrl(cfg, i));
      const mark = i.done
        ? ` <span class="badge topic-done" style="background:${DONE_COLOR}22; color:${DONE_COLOR};">DONE</span>`
        : '';
      const ex = EXPLAINERS[cfg.id]?.[String(i.no)];
      const sub = ex?.concept ? curFirstSentences(ex.concept, 2) : subtitle(i.text);
      const summaryHtml = sub ? `\n          <p class="topic-summary">${curInline(sub)}</p>` : '';
      const how = ex?.concept ? sentenceRange(ex.concept, 2, 2) : '';
      const howHtml = how ? `\n          <p class="topic-how"><strong>How it works</strong>${curInline(how)}</p>` : '';
      const whyHtml = ex?.why ? `\n          <p class="topic-why"><strong>Why</strong>${curInline(ex.why)}</p>` : '';
      return `        <li id="${cfg.id}-${i.no}">
          <div class="topic-head"><span class="topic-no">${i.no}</span><span class="topic-title">${curInline(shortLabel(i.text))}</span>${mark}</div>${summaryHtml}${howHtml}${whyHtml}
          <p class="topic-link"><a href="${href}">Detail &rarr;</a> &middot; <a href="#top">Top &uarr;</a> &middot; <a href="#sec-${cfg.id}">Section top &uarr;</a></p>
        </li>`;
    })
    .join('\n');
}

const CURRICULUM_LEAD = {
  algorithms:
    'Advanced algorithms, compilers, concurrency, distributed systems and AI engineering &mdash; one topic a day, and the bar is knowing it exists well enough to reach for it.',
  math: 'The mathematics underneath the rest of this catalogue &mdash; one topic a day, each one carried far enough to read a formula without flinching.',
};

// 전체 합계 한 줄(all / planned)은 지웠다 (jay, 2026-08-27: "this number is irrelevant") —
// 네 섹션이 서로 다른 것을 세는데 하나로 합치면 아무것도 뜻하지 않는다. 대신 같은 형식을
// 섹션마다 붙인다: 알약에는 압축해서(19/13), 섹션 머리에는 풀어서.
const plannedIn = (list) => list.filter((c) => c.status === 'soon').length;
const SECTIONS = [
  ...grouped.map((g) => [`sec-${g.id}`, g.title, g.numbered.length, plannedIn(g.numbered)]),
  ...curricula.map(({ cfg, items }) => [
    `sec-${cfg.id}`,
    cfg.sectionTitle,
    items.length,
    items.filter((i) => !i.done).length,
  ]),
];
// planned 를 앞에, 그리고 파랗게 (jay, 2026-08-27) — 이 페이지에서 먼저 알고 싶은 것은
// 전체 개수가 아니라 남은 일의 크기다. 전체는 그 뒤의 맥락이라 흐리게 둔다.
const sectionMeta = Object.fromEntries(
  SECTIONS.map(([id, , all, planned]) => [
    id,
    `<span class="count-planned">planned (${planned})</span> <span class="count-all">/ all (${all})</span>`,
  ])
);
// 제목 옆 진척률 — 카드와 커리큘럼을 통틀어 done ÷ all (jay, 2026-08-27).
const doneTotals = [
  ...grouped.map((g) => [g.numbered.filter((c) => c.status === 'done').length, g.numbered.length]),
  ...curricula.map(({ items, done }) => [done, items.length]),
].reduce(([a, b], [c, d]) => [a + c, b + d], [0, 0]);
const doneNote = `${Math.round((doneTotals[0] / doneTotals[1]) * 100)}% done`;

const railJump = SECTIONS.map(
  ([id, label, all, planned]) =>
    `<a href="#${id}" title="${label} &mdash; planned (${planned}) / all (${all})">${label}<b><span class="count-planned">${planned}</span><span class="count-all">/${all}</span></b></a>`
).join('');

const curriculumHtml = curricula
  .map(({ cfg, groups, items, done }) => {
    const inner = groups
      .map(
        (g) => `      <h2>${escapeHtml(g.label)}</h2>
      <ul class="topics">
${curriculumRows(cfg, g.items)}
      </ul>`
      )
      .join('\n');
    return `
    <article id="sec-${cfg.id}">
      <h1>${escapeHtml(cfg.sectionTitle)}</h1>
      <p class="lead">${CURRICULUM_LEAD[cfg.id] ?? ''}</p>
      <p class="meta">${sectionMeta[`sec-${cfg.id}`]} &middot; <a href="${escapeHtml(cfg.viewAllHref)}">${escapeHtml(cfg.viewAllLabel)} &rarr;</a></p>
${inner}
    </article>`;
  })
  .join('\n');

for (const { cfg, items } of curricula) {
  navGroups.push({
    id: `nav-sec-${cfg.id}`,
    label: `${cfg.sectionTitle} (${items.length})`,
    items: items.map((i) => ({
      anchor: `${cfg.id}-${i.no}`,
      text: `<span class="topic-no">${i.no}</span>${escapeHtml(shortLabel(i.text))}`,
      color: i.done ? DONE_COLOR : '#64748b',
      statusLabel: i.done ? 'DONE' : 'PLANNED',
    })),
  });
}

// 레일 상단의 섹션 바로가기. 레일은 늘 보이니 이것이 목차이자 돌아오는 길이다 —
// 그래서 본문에 "맨 위로" 링크를 따로 두지 않는다 (jay, 2026-08-27).
// 카드 구획들을 한 번에 그린다 (jay, 2026-08-27) — 구획이 넷이 되면서 손으로 적을 수 없다.
const cardSectionsHtml = grouped
  .map(
    (g) => `    <article id="sec-${g.id}">
      <h1>${g.title}</h1>
      <p class="lead">${g.lead}</p>
      <p class="meta">${sectionMeta[`sec-${g.id}`]}</p>
      <ul class="topics">
${rowsFor(g.numbered, `sec-${g.id}`)}
      </ul>
    </article>`
  )
  .join('\n');

const contentHtml = `${cardSectionsHtml}${curriculumHtml}`;

// 상세 페이지는 구획 정보(grouped·SECTIONS)에 의존하므로 그 뒤에서 만든다
// (jay, 2026-08-27 에 레일이 붙으면서 순서가 중요해졌다).
fs.mkdirSync(TOPICS_DIR, { recursive: true });
const written = new Set();
for (const [idx, c] of numbered.entries()) {
  if (c.docsHref) continue;
  const fname = `pocs-${c.key}.html`;
  written.add(fname);
  const b = badge(c);
  const prev = numbered[idx - 1];
  const next = numbered[idx + 1];
// 상세 페이지 레일 — 구획 알약은 목록 페이지의 앵커를 가리키고, 항목 목록은 같은 구획의
// 형제들을 파일 링크로 잇는다. 지금 보고 있는 항목은 active 로 표시된다.
const detailRailJump = SECTIONS.map(
  ([id, label, all, planned]) =>
    `<a href="../pocs.html#${id}" title="${label} &mdash; planned (${planned}) / all (${all})">${label}<b><span class="count-planned">${planned}</span><span class="count-all">/${all}</span></b></a>`
).join('');

function detailNavGroups(current) {
  const g = grouped.find((x) => x.numbered.some((n) => n.key === current.key));
  if (!g) return null;
  return [
    {
      id: `nav-sec-${g.id}`,
      label: `${g.title} (${g.numbered.length})`,
      items: g.numbered.map((n) => {
        const b = badge(n);
        return {
          anchor: n.key,
          href: detailHref(n).replace(/^topics\//, ''),
          current: n.key === current.key,
          text: `<span class="topic-no">${n.no}</span>${escapeHtml(n.title)}`,
          color: b.color,
          statusLabel: b.label,
        };
      }),
    },
  ];
}

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
  // 본문 끝의 "Open on jaylabs.xyz"는 대부분의 카드에서 아직 없는 페이지를 가리켰다
  // (jay, 2026-08-28). 레일 바닥과 같은 이동 링크로 바꾸고, 라이브 라우트(href)가 실제로
  // 있는 카드에만 원래 링크를 뒤에 붙인다 — 쓸모 있는 경우는 남기고 죽은 링크만 없앤다.
  // 복사 버튼이 넘길 원본 마크다운 (jay, 2026-08-28). 렌더된 DOM 이 아니라 카드 데이터를
  // 그대로 쓴다 — 표·코드블록·굵게가 붙여넣은 쪽에서 그대로 살아 있어야 하기 때문이다.
  // 순서는 화면과 같다: 제목 → 요약 → howTo → Why → How it works.
  const copyDoc = (t, d, h, why, how, L) =>
    `# ${t}\n\n${d}\n\n${h}\n\n## ${L.why}\n\n${why}\n\n## ${L.how}\n\n${how}\n`;
  const jsonBlock = (id, text) =>
    `<script type="application/json" id="${id}">${JSON.stringify(text).replace(/</g, '\\u003c')}</script>`;
  const copyEn = copyDoc(c.title, c.description, c.howTo, c.purpose, c.howItWorks, { why: 'Why', how: 'How it works' });
  const copyKo = copyDoc(c.titleKo, c.descriptionKo, c.howToKo, c.purposeKo, c.howItWorksKo, { why: '왜', how: '동작 방식' });
  const copyRow =
    `<p class="copy-row">` +
    `<button type="button" class="copy-btn" data-copy="copy-en" data-done="Copied &#10003;">Copy English</button>` +
    `<button type="button" class="copy-btn" data-copy="copy-ko" data-done="복사됨 &#10003;">Copy 한국어</button>` +
    `</p>\n    ${jsonBlock('copy-en', copyEn)}\n    ${jsonBlock('copy-ko', copyKo)}`;
  const liveLink = c.href ? ` &middot; <a href="${cardUrl(c)}">Open on jaylabs.xyz &rarr;</a>` : '';
  const openLink = `<a href="../pocs.html">&larr; All PoCs</a> &middot; <a href="../index.html">Workspace Index</a> &middot; <a href="#top">Top &uarr;</a>${liveLink}`;
  const openLinkKo = `<a href="../pocs.html">&larr; 전체 PoC</a> &middot; <a href="../index.html">워크스페이스 인덱스</a> &middot; <a href="#top">맨 위 &uarr;</a>${liveLink}`;
  // 이중언어 — 영어 먼저, 한국어 나중 (jay, 2026-08-13). 카드 데이터에 이미 있는 *Ko
  // 필드를 그대로 쓴다 — 번역을 새로 짓지 않는다.
  fs.writeFileSync(
    path.join(TOPICS_DIR, fname),
    renderTopicPage({
      // 상세 페이지에도 같은 레일 (jay, 2026-08-27). 224개를 전부 실으면 페이지마다
      // 수십 KB 라, 지금 보고 있는 구획의 형제 항목만 싣고 나머지 구획은 알약으로 잇는다.
      railTitle: 'Rabbit',
      railTitleHref: '../index.html',
      railJump: detailRailJump,
      filterPlaceholder: 'Filter section',
      navGroups: detailNavGroups(c),
      railFoot: `<a href="../pocs.html">&larr; All PoCs</a> &middot; <a href="../index.html">Workspace Index</a>`,
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
      ${copyRow}
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
${diagramNote}${codeHtmlKo}      <p>${openLinkKo}</p>
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

fs.writeFileSync(
  OUT_HTML,
  renderRtdPage({
    title: 'PoCs — All Contents',
    railTitle: 'Rabbit',
    railTitleHref: 'index.html',
    filterPlaceholder: 'Filter PoCs',
    navGroups,
    railJump,
    railNote: doneNote,
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
