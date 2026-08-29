#!/usr/bin/env node
// 커리큘럼 파싱과 표현을 담는 공유 모듈 (jay, 2026-08-27).
//
// 원래 이 코드는 generate-curriculum-html.mjs 안에만 있었다. Algorithms·Math 를 PoCs
// 페이지 안의 섹션으로도 그리게 되면서 두 생성기가 같은 파서를 필요로 하게 됐고, 복사하면
// 한쪽만 고쳐지는 날이 온다 — 카드 데이터와 같은 원칙으로 원본을 한 곳에 둔다.
//
// generate-curriculum-html.mjs 를 import 할 수는 없다: 그 파일은 최상단에서 파일을 쓰는
// 부수효과가 있어서, import 하는 순간 docs/ 가 다시 쓰인다.
import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml } from './rtd-shell.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

export const DONE_COLOR = '#0284c7'; // poc 카드의 DONE 과 같은 하늘색
export const TODO_COLOR = '#64748b';

export const CURRICULA = [
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
export const GROUP_LABEL_EN = {
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
export function parseCurriculum(md) {
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
// [^*] 는 홑별표를 못 지나가서 **굵게 안의 *기울임*** 이 통째로 매치되지 않았다
// (jay, 2026-08-29). generate-pocs-html.mjs 쪽과 같은 결함이고, 거기서는 원본 ** 가
// marked 로 흘러가 섹션을 통째로 삼켰다. 여기는 marked 를 안 쓰므로 증상은 더 가볍다 —
// 별표가 글자 그대로 보일 뿐이다. 지금 커리큘럼 본문에는 중첩 강조가 없어 출력은 그대로지만,
// 같은 함수가 두 곳에서 다르게 동작할 이유가 없으므로 같이 고쳐 둔다.
// 홑별표 -> <em> 은 **굵게** 안쪽에서만 적용한다. 바깥까지 열면 "2 * 3" 같은 평문이
// 기울임으로 바뀌므로, "최소만"이라는 이 함수의 원래 방침을 유지한다.
export function inline(s) {
  const em = (t) => t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return escapeHtml(s)
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*((?:[^*]|\*(?!\*))+?)\*\*/g, (_, inner) => `<strong>${em(inner)}</strong>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// 레일 라벨: "제목 — 설명" 이면 제목만 (100개를 288px 레일에서 훑을 수 있게).
export function shortLabel(text) {
  const cut = text.split(/\s+—\s+|\s+→\s+/)[0];
  return cut.length > 46 ? `${cut.slice(0, 45)}…` : cut;
}

// "제목 — 설명" 의 설명 쪽. 커리큘럼이 이미 각 항목에 한 줄 요약을 달아 두었으므로,
// 상세 페이지가 빈 껍데기가 되지 않게 그 줄을 리드로 올린다 (jay, 2026-08-12).
export function subtitle(text) {
  const m = /\s+—\s+(.+)$/.exec(text);
  return m ? m[1] : '';
}

// 목록 페이지의 "제대로 된 설명" (jay, 2026-08-13) — 커리큘럼 한 줄 요약 대신, 있으면
// EXPLAINERS 의 개념 설명 앞부분을 쓴다. "내용이 너무 단순하다"는 jay 피드백(2026-08-13)에
// 맞춰 한 문장이 아니라 n 문장(기본 2개)까지 가져온다 — 전체 문단은 여전히 상세 페이지 몫.
export function firstSentences(text, n = 2) {
  const parts = text.match(/[^.]*\.(\s|$)/g);
  if (!parts) return text;
  return parts.slice(0, n).join('').trim();
}

// 목록 페이지에 "동작 방식"도 함께 싣는다 (jay, 2026-08-13: "add why and how it works to
// the list page, not move — just copy it"). EXPLAINERS 에 별도 howItWorks 필드가 없으니,
// concept 문단의 두 번째 조각(보통 메커니즘을 설명하는 문장들)을 그대로 복사해 온다 —
// 상세 페이지의 개념 문단은 그대로 두고, 목록에는 같은 원문에서 다른 구간을 보여준다.
export function sentenceRange(text, startIdx, n) {
  const parts = text.match(/[^.]*\.(\s|$)/g);
  if (!parts) return '';
  return parts.slice(startIdx, startIdx + n).join('').trim();
}

// 하루치 노트의 뼈대 — 커리큘럼 머리말이 정한 분량 그대로:
// "개념 1개 + 코드/수식 10~25줄 + 연습 1개 + 실무·Verex 연결 1줄".
// 공부하는 날 이 순서대로 채우면 되고, 채운 뒤에는 md 에 노트를 링크해 이 페이지를 대체한다.
export const STUDY_SECTIONS = [
  ['개념', '한 문단으로. "존재를 알고 필요할 때 꺼내 쓰는" 수준이 멈춤선이다.'],
  ['코드 · 수식', '10~25줄. 돌아가는 최소 예제 하나 또는 유도 한 단계.'],
  ['연습', '직접 풀 문제 하나. 답이 아니라 손이 움직이는 질문으로.'],
  ['실무 · Verex 연결', '한 줄. 이 주제가 실제로 어디서 걸리는지.'],
];

// 영어판 — 상세 페이지에 영어 버전을 먼저, 한국어를 뒤에 둔다 (jay, 2026-08-13).
export const STUDY_SECTIONS_EN = [
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
export const EXPLAINERS = (() => {
  const p = path.join(REPO_ROOT, 'docs', 'knowledge', 'explainers.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
})();

// 영어판 설명 — 같은 구조, 영어 title/concept/why/exercise/link (jay, 2026-08-13 요청).
export const EXPLAINERS_EN = (() => {
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
export function itemUrl(cfg, item, base = 'docs') {
  if (item.href) {
    if (/^https?:\/\//.test(item.href)) return item.href;
    return base === 'topics' ? `../${item.href}` : item.href;
  }
  return base === 'topics' ? `${cfg.id}-${item.no}.html` : `topics/${cfg.id}-${item.no}.html`;
}
