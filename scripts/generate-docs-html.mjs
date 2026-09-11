#!/usr/bin/env node
// Renders every .md file in the repo to a self-contained HTML page under docs/html/,
// mirroring the source path 1:1 (docs/foo.md -> docs/html/docs/foo.html) so relative
// links between docs resolve correctly. Source .md files are left untouched.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { marked } from 'marked';

// GitHub-style heading anchors (jay, 2026-09-11) — marked 18 emits bare <h2>…</h2> with no id,
// so in-page TOC links (README's Contents list) had nothing to jump to in the rendered HTML.
// Inject a slug id on every heading, matching github-slugger's rule so the same anchors also work
// when the .md is viewed on GitHub. Slugs are deduped per document with a -1/-2 suffix.
function slugifyHeading(text) {
  return text.toLowerCase().trim()
    .replace(/[^\p{L}\p{N} \-]+/gu, '') // drop punctuation / emoji, keep letters, digits, space, hyphen
    .replace(/ /g, '-');                    // each space -> hyphen (no collapse — matches GitHub)
}
function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#x27;/gi, "'");
}
function addHeadingIds(html) {
  const seen = new Map();
  return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (m, lvl, inner) => {
    const text = decodeEntities(inner.replace(/<[^>]+>/g, ''));
    let slug = slugifyHeading(text);
    if (!slug) return m;
    const n = seen.get(slug) || 0;
    seen.set(slug, n + 1);
    if (n > 0) slug = `${slug}-${n}`;
    return `<h${lvl} id="${slug}">${inner}</h${lvl}>`;
  });
}

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const OUT_ROOT = path.join(REPO_ROOT, 'docs', 'html');
const INDEX_HTML = path.join(REPO_ROOT, 'docs', 'index.html');

// docs/algorithms/*.md 는 Algorithms·Math 커리큘럼의 노트 폴더다 — 이 노트들의 "← Index"는
// 저장소 전체 Workspace Index 가 아니라 그 노트가 실제로 속한 목록 페이지(algorithms.html
// 또는 math.html)로 가야 한다 (jay, 2026-08-13). 어느 쪽인지는 두 커리큘럼 md 원본 중
// 어느 쪽이 이 노트를 링크하는지로 판별한다 — 항목이 없는 커리큘럼 쪽이면 스킵.
const NOTES_DIR = path.join(REPO_ROOT, 'docs', 'algorithms');
const CURRICULA_INDEX = [
  { md: path.join(REPO_ROOT, 'docs', 'knowledge', 'dev-100-curriculum.md'), list: path.join(REPO_ROOT, 'docs', 'algorithms.html') },
  { md: path.join(REPO_ROOT, 'docs', 'knowledge', 'math-50-curriculum.md'), list: path.join(REPO_ROOT, 'docs', 'math.html') },
];
function curriculumListFor(mdAbs) {
  if (path.dirname(mdAbs) !== NOTES_DIR) return null;
  const slug = path.basename(mdAbs, '.md');
  for (const { md, list } of CURRICULA_INDEX) {
    let text;
    try {
      text = fs.readFileSync(md, 'utf8');
    } catch {
      continue;
    }
    if (text.includes(`/${slug}.html`)) return list;
  }
  return null;
}

const EXCLUDE_DIRS = new Set(['node_modules', '.venv', '.git', 'dist', 'build', '.next', '.turbo', 'coverage']);

// 마크다운이 아닌 설정 파일도 그대로 페이지로 (jay, 2026-08-31) — 인덱스의 Knowledge Base 에서
// 링크하려는 dotfile 들. <pre><code> 한 덩어리로 렌더하고, 출력 이름은 확장자를 뗀
// <basename>.html (docs/zsub/karabiner.json -> docs/html/docs/zsub/karabiner.html).
const VERBATIM = [
  { src: 'docs/zsub/karabiner.json', lang: 'json' },
  { src: 'docs/zsub/gitconfig', lang: 'ini' },
];
function verbatimOutputPath(srcAbs) {
  const relFromRoot = path.relative(REPO_ROOT, srcAbs);
  const base = path.basename(relFromRoot).replace(/\.[^.]+$/, '');
  return path.join(OUT_ROOT, path.dirname(relFromRoot), base + '.html');
}

function findMdFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.')) continue;
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      if (full === OUT_ROOT) continue;
      findMdFiles(full, results);
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function toOutputPath(mdAbsPath) {
  const relFromRoot = path.relative(REPO_ROOT, mdAbsPath);
  return path.join(OUT_ROOT, relFromRoot.replace(/\.md$/i, '.html'));
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// GitHub Pages 는 docs/ 만 서빙한다. 그래서 문서가 소스 코드를 가리키면(../../lib/foo.ts)
// 로컬에선 열리지만 배포된 사이트에선 전부 404 였다 — 2026-08-11 기준 125건.
// 저장소 blob URL 로 바꾼다: 깨지지 않을 뿐 아니라 실제로 더 쓸모 있다(줄 번호·이력·blame).
const GITHUB_BLOB = 'https://github.com/linked0/rabbit/blob/main';

function rewriteLinks(html, mdAbsPath, outAbsPath) {
  const mdDir = path.dirname(mdAbsPath);
  const outDir = path.dirname(outAbsPath);
  return html.replace(/(href|src)="([^"]*)"/g, (match, attr, url) => {
    if (url === '' || /^([a-z][a-z0-9+.-]*:)/i.test(url) || url.startsWith('#') || url.startsWith('/')) {
      return match;
    }
    // Jekyll 템플릿 변수가 그대로 남은 경로 — 이 생성기는 Jekyll 이 아니라 치환되지 않는다.
    // content/profile/*.md 가 다른 사이트에서 옮겨오며 딸려온 것들(2026-08-11).
    url = url.replace(/\{\{\s*site\.baseurl\s*\}\}\/?/g, '');

    const [urlPath, hash] = url.split('#');
    if (!urlPath) return match;
    const suffix = hash ? '#' + hash : '';

    // 저장소 밖을 가리키는 링크는 링크로 만들지 않는다. 형제 저장소(~/work/verex)의
    // 마크다운을 함께 렌더하면서 그쪽 상대경로가 그대로 남아 생긴 것들 — 배포된 사이트에는
    // 그 파일이 존재할 수 없다 (2026-08-11, 52건).
    {
      const abs = path.resolve(mdDir, urlPath);
      if (!abs.startsWith(REPO_ROOT + path.sep)) {
        return `${attr}="" data-missing="${escapeHtml(urlPath)}"`;
      }
    }

    if (/\.md$/i.test(urlPath)) {
      const targetAbs = path.resolve(mdDir, urlPath);
      // 가리키는 문서가 없으면 링크를 만들지 않는다 — 지워지거나 이름이 바뀐 설계 문서를
      // 가리키는 링크가 133건 있었다. 죽은 링크보다 "링크가 아님"이 정직하다.
      if (!fs.existsSync(targetAbs)) return `${attr}="" data-missing="${escapeHtml(urlPath)}"`;
      const rel = path.relative(outDir, toOutputPath(targetAbs));
      return `${attr}="${rel}${suffix}"`;
    }

    const targetAbs = path.resolve(mdDir, urlPath);
    // docs/ 밖(소스 코드 등)이면 저장소 링크로.
    const docsRoot = path.join(REPO_ROOT, 'docs');
    if (targetAbs.startsWith(REPO_ROOT + path.sep) && !targetAbs.startsWith(docsRoot + path.sep)) {
      const relFromRoot = path.relative(REPO_ROOT, targetAbs).split(path.sep).join('/');
      return `${attr}="${GITHUB_BLOB}/${relFromRoot}${suffix}"`;
    }
    if (!fs.existsSync(targetAbs)) return `${attr}="" data-missing="${escapeHtml(urlPath)}"`;
    const rel = path.relative(outDir, targetAbs);
    return `${attr}="${rel}${suffix}"`;
  });
}

function renderPage({ title, sourceRel, bodyHtml, backHref, backLabel }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root { --bg:#f8fafc; --card:#fff; --text:#0f172a; --text2:#475569; --accent:#0ea5e9; --border:#e2e8f0; }
  * { box-sizing: border-box; }
  body { font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); line-height:1.7; margin:0; padding:0; }
  .wrap { max-width: 820px; margin:0 auto; padding: 28px 18px 80px; }
  .back { display:inline-block; margin-bottom:18px; color:var(--accent); text-decoration:none; font-size:0.92rem; font-weight:500; }
  .src { font-family: ui-monospace, monospace; font-size:0.78rem; color:var(--text2); margin-bottom:20px; word-break:break-all; }
  article { background: var(--card); border:1px solid var(--border); border-radius:14px; padding: 24px 22px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.06); }
  article h1:first-child { margin-top: 0; }
  h1,h2,h3,h4,h5 { line-height:1.3; }
  h1 { font-size:1.7rem; } h2 { font-size:1.35rem; } h3 { font-size:1.15rem; }
  a { color: var(--accent); word-break: break-word; }
  p, li { word-wrap: break-word; }
  pre { background:#0f172a; color:#e2e8f0; padding:14px; border-radius:8px; overflow-x:auto; font-size:0.85rem; }
  code { font-family: ui-monospace, monospace; }
  :not(pre) > code { background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:0.88em; }
  table { border-collapse: collapse; width:100%; display:block; overflow-x:auto; }
  th, td { border:1px solid var(--border); padding:8px 12px; text-align:left; }
  blockquote { border-left:3px solid var(--accent); margin:0 0 16px; padding: 2px 16px; color: var(--text2); }
  img { max-width:100%; height:auto; border-radius:6px; }
  hr { border:none; border-top:1px solid var(--border); margin: 24px 0; }
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="${backHref}">&larr; ${escapeHtml(backLabel)}</a>
  <div class="src">Source: ${escapeHtml(sourceRel)} (auto-generated by scripts/generate-docs-html.mjs &mdash; edit the .md, not this file)</div>
  <article>
${bodyHtml}
  </article>
</div>
</body>
</html>
`;
}

// docs/html/docs/tasks/index.html — tasks 폴더의 자동 색인 (jay, 2026-09-03).
// summary.md 는 손으로 쓰는 목록이라 새 파일이 생겨도 스스로 갱신되지 않았다 —
// 09-02-jayverse.md 가 빠진 채로 "All Tasks" 를 자칭한 사례. 색인을 생성 시점의
// 폴더 내용에서 만들면 목록과 폴더가 어긋날 방법 자체가 없다. 파일 인자 유무와
// 무관하게 매 실행마다 다시 만든다 — 파일 하나라 비용이 없다.
// 정렬은 git 마지막 커밋 시각(최신 먼저) — mtime 은 clone/checkout 시점으로
// 초기화되어 머신을 옮기면 뒤섞인다. 커밋된 적 없는 새 파일은 mtime 으로 맨 위에 온다.
function generateTasksIndex() {
  const TASKS_DIR = path.join(REPO_ROOT, 'docs', 'tasks');
  const outAbs = path.join(OUT_ROOT, 'docs', 'tasks', 'index.html');
  const entries = [];
  for (const e of fs.readdirSync(TASKS_DIR, { withFileTypes: true })) {
    if (!e.isFile() || !/\.md$/i.test(e.name)) continue;
    const abs = path.join(TASKS_DIR, e.name);
    const raw = fs.readFileSync(abs, 'utf8');
    const h1 = raw.match(/^#\s+(.+)$/m);
    let ts = 0;
    try {
      const out = execSync('git log -1 --format=%ct -- ' + JSON.stringify(path.relative(REPO_ROOT, abs)), {
        cwd: REPO_ROOT, encoding: 'utf8',
      }).trim();
      ts = out ? Number(out) * 1000 : 0;
    } catch { /* git 없음/실패 → mtime 폴백 */ }
    if (!ts) ts = fs.statSync(abs).mtimeMs;
    entries.push({ name: e.name, title: h1 ? h1[1].trim() : e.name.replace(/\.md$/i, ''), ts });
  }
  entries.sort((a, b) => b.ts - a.ts);
  const items = entries
    .map(({ name, title, ts }) => {
      const href = name.replace(/\.md$/i, '.html');
      const date = new Date(ts).toISOString().slice(0, 10);
      return `<li><a href="${escapeHtml(href)}">${escapeHtml(title)}</a> <code>${escapeHtml(name)}</code> <small>${date}</small></li>`;
    })
    .join('\n');
  const bodyHtml = `<h1>Rabbit — All Tasks</h1>
<blockquote><p>Every <code>docs/tasks/*.md</code>, newest first (by last commit). This page is rebuilt from the folder on every docs generation — it cannot go stale the way a hand-written list can.</p></blockquote>
<ul>
${items}
</ul>
`;
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, renderPage({
    title: 'Rabbit — All Tasks',
    sourceRel: 'docs/tasks/ (folder listing, auto-generated)',
    bodyHtml,
    backHref: path.relative(path.dirname(outAbs), INDEX_HTML),
    backLabel: 'Index',
  }), 'utf8');
  return entries.length;
}

// docs/html/docs/history/index.html — history 폴더의 자동 색인 (jay, 2026-09-11).
// docs/history/index.md 는 verex 에서 복붙된 Jekyll 템플릿({% ... %})이라 rabbit(Jekyll 아님)
// 에선 실행되지 않고 Liquid 코드가 날것으로 렌더됐다 — Rabbit History 카드가 그걸 보여 줬다.
// tasks 와 똑같이 폴더 내용에서 실제 목록을 만들어 그 출력을 덮어쓴다. index.md·README.md 는
// 제외. 정렬은 파일명(날짜) 최신 먼저 — 파일명이 YYYY-MM-DD 로 시작하기 때문.
function generateHistoryIndex() {
  const HIST_DIR = path.join(REPO_ROOT, 'docs', 'history');
  const outAbs = path.join(OUT_ROOT, 'docs', 'history', 'index.html');
  const entries = [];
  for (const e of fs.readdirSync(HIST_DIR, { withFileTypes: true })) {
    if (!e.isFile() || !/\.md$/i.test(e.name)) continue;
    if (e.name === 'index.md' || e.name === 'README.md') continue;
    const abs = path.join(HIST_DIR, e.name);
    const raw = fs.readFileSync(abs, 'utf8');
    const h1 = raw.match(/^#\s+(.+)$/m);
    const date = (e.name.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
    entries.push({ name: e.name, title: h1 ? h1[1].trim() : e.name.replace(/\.md$/i, ''), date });
  }
  // 파일명(날짜) 역순 = 최신 먼저. 날짜 없는 파일(예: 통합 초기 로그)은 이름순으로 맨 아래.
  entries.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.name.localeCompare(b.name));
  const items = entries
    .map(({ name, title, date }) => {
      const href = name.replace(/\.md$/i, '.html');
      return `<li><a href="${escapeHtml(href)}">${escapeHtml(title)}</a> <code>${escapeHtml(name)}</code>${date ? ` <small>${date}</small>` : ''}</li>`;
    })
    .join('\n');
  const bodyHtml = `<h1>Rabbit — All Logs</h1>
<blockquote><p>Every <code>docs/history/*.md</code>, newest first (by date in the filename). This page is rebuilt from the folder on every docs generation — it cannot go stale the way a hand-written list can.</p></blockquote>
<ul>
${items}
</ul>
`;
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, renderPage({
    title: 'Rabbit — All Logs',
    sourceRel: 'docs/history/ (folder listing, auto-generated)',
    bodyHtml,
    backHref: path.relative(path.dirname(outAbs), INDEX_HTML),
    backLabel: 'Index',
  }), 'utf8');
  return entries.length;
}

// docs/html/docs/index.html — docs 폴더 전체의 자동 색인 (jay, 2026-09-09).
// 인덱스의 "Rabbit — Docs" 카드가 여기로 온다. 렌더된 docs 트리(docs/**.md → .html)를
// 최상위 하위폴더별로 묶어 보여 준다. tasks·history 는 날짜별 파일이 수십 개라 전부
// 나열하는 대신 이미 있는 폴더 색인(tasks/index.html·history/index.html) 한 줄로 접는다 —
// 그래야 페이지가 짧게 유지되고, 목록이 폴더와 어긋날 방법도 없다. 매 실행마다 폴더에서
// 다시 만든다.
function generateDocsIndex() {
  const DOCS_DIR = path.join(REPO_ROOT, 'docs');
  const outAbs = path.join(OUT_ROOT, 'docs', 'index.html');
  const FOLDED = new Map([['tasks', 'All Tasks'], ['history', 'All Logs']]); // 폴더 색인으로 접는다
  const groups = new Map(); // topFolder ('' = root) -> [{ title, href, name }]
  const push = (top, entry) => {
    if (!groups.has(top)) groups.set(top, []);
    groups.get(top).push(entry);
  };
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name.startsWith('.')) continue;
        if (abs === OUT_ROOT) continue; // docs/html (렌더 출력) 자신은 제외
        walk(abs);
        continue;
      }
      if (!e.isFile() || !/\.md$/i.test(e.name)) continue;
      const relFromDocs = path.relative(DOCS_DIR, abs); // e.g. knowledge/foo.md
      const top = relFromDocs.includes(path.sep) ? relFromDocs.split(path.sep)[0] : '';
      if (FOLDED.has(top)) continue; // tasks·history 는 아래에서 접어서 따로 추가
      const raw = fs.readFileSync(abs, 'utf8');
      const h1 = raw.match(/^#\s+(.+)$/m);
      push(top, {
        title: h1 ? h1[1].trim() : e.name.replace(/\.md$/i, ''),
        href: relFromDocs.replace(/\.md$/i, '.html'),
        name: relFromDocs,
      });
    }
  };
  walk(DOCS_DIR);
  // VERBATIM 설정 파일(docs/zsub/…)도 렌더되므로 색인에 포함한다.
  for (const { src } of VERBATIM) {
    const relFromDocs = path.relative(DOCS_DIR, path.join(REPO_ROOT, src));
    if (relFromDocs.startsWith('..')) continue;
    const top = relFromDocs.includes(path.sep) ? relFromDocs.split(path.sep)[0] : '';
    push(top, {
      title: path.basename(src),
      href: relFromDocs.replace(/\.[^.]+$/, '.html'),
      name: relFromDocs,
    });
  }
  // 접은 폴더(tasks·history)를 각자 섹션 한 줄로.
  for (const [folder, label] of FOLDED) {
    if (fs.existsSync(path.join(outAbs, '..', folder, 'index.html'))) {
      push(folder, { title: label, href: `${folder}/index.html`, name: `${folder}/`, folded: true });
    }
  }
  const sections = [...groups.entries()].sort((a, b) => {
    if (a[0] === '') return -1; // 루트 먼저
    if (b[0] === '') return 1;
    return a[0].localeCompare(b[0]);
  });
  const bodyHtml = `<h1>Rabbit — Docs</h1>
<blockquote><p>Every rendered page under <code>docs/</code>, grouped by folder. Rebuilt from the folder on each docs generation — it cannot go stale the way a hand-written list can. <code>tasks/</code> and <code>history/</code> are folded into their own indexes.</p></blockquote>
${sections.map(([folder, entries]) => {
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const heading = folder === '' ? 'docs/' : `docs/${folder}/`;
  const items = entries.map((it) =>
    `<li><a href="${escapeHtml(it.href)}">${escapeHtml(it.title)}</a> <code>${escapeHtml(it.name)}</code></li>`
  ).join('\n');
  return `<h2>${escapeHtml(heading)}</h2>\n<ul>\n${items}\n</ul>`;
}).join('\n')}
`;
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, renderPage({
    title: 'Rabbit — Docs',
    sourceRel: 'docs/ (folder listing, auto-generated)',
    bodyHtml,
    backHref: path.relative(path.dirname(outAbs), INDEX_HTML),
    backLabel: 'Index',
  }), 'utf8');
  return [...groups.values()].reduce((n, e) => n + e.length, 0);
}

function main() {
  // With file args, only convert those (used by the pre-commit hook for changed files).
  // With no args, do a full scan (used by `pnpm docs:html`).
  const argFiles = process.argv.slice(2).filter((a) => /\.md$/i.test(a));
  const files = argFiles.length
    ? argFiles.map((f) => path.resolve(REPO_ROOT, f)).filter((f) => fs.existsSync(f))
    : findMdFiles(REPO_ROOT);
  const seenOutputs = new Map();
  const conflicts = [];
  let converted = 0;

  for (const mdAbs of files) {
    const outAbs = toOutputPath(mdAbs);
    if (seenOutputs.has(outAbs)) {
      conflicts.push([path.relative(REPO_ROOT, mdAbs), path.relative(REPO_ROOT, seenOutputs.get(outAbs))]);
      continue;
    }
    seenOutputs.set(outAbs, mdAbs);

    const raw = fs.readFileSync(mdAbs, 'utf8');
    const h1Match = raw.match(/^#\s+(.+)$/m);
    const title = h1Match ? h1Match[1].trim() : path.basename(mdAbs, '.md');

    let bodyHtml = marked.parse(raw);
    bodyHtml = addHeadingIds(bodyHtml);
    bodyHtml = rewriteLinks(bodyHtml, mdAbs, outAbs);

    const sourceRel = path.relative(REPO_ROOT, mdAbs);
    const curriculumList = curriculumListFor(mdAbs);
    const backHref = path.relative(path.dirname(outAbs), curriculumList ?? INDEX_HTML);
    const backLabel = curriculumList ? path.basename(curriculumList, '.html').replace(/^./, (c) => c.toUpperCase()) : 'Index';

    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, renderPage({ title, sourceRel, bodyHtml, backHref, backLabel }), 'utf8');
    converted++;
  }

  // 설정 파일은 파일 인자가 없을 때(전체 스캔)와, 인자로 직접 지목됐을 때 렌더한다.
  const argSet = new Set(process.argv.slice(2).map((a) => path.resolve(REPO_ROOT, a)));
  let verbatim = 0;
  for (const { src, lang } of VERBATIM) {
    const srcAbs = path.join(REPO_ROOT, src);
    if (!fs.existsSync(srcAbs)) continue;
    if (argFiles.length && !argSet.has(srcAbs)) continue;
    const outAbs = verbatimOutputPath(srcAbs);
    const raw = fs.readFileSync(srcAbs, 'utf8');
    const bodyHtml = `<h1>${escapeHtml(path.basename(src))}</h1>\n<pre><code class="language-${lang}">${escapeHtml(raw)}</code></pre>\n`;
    const backHref = path.relative(path.dirname(outAbs), INDEX_HTML);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, renderPage({ title: path.basename(src), sourceRel: src, bodyHtml, backHref, backLabel: 'Index' }), 'utf8');
    verbatim++;
  }

  const taskCount = generateTasksIndex();
  const historyCount = generateHistoryIndex();
  const docsCount = generateDocsIndex();
  console.log(`Converted ${converted} markdown files (+ ${verbatim} verbatim, tasks index: ${taskCount} entries, history index: ${historyCount} entries, docs index: ${docsCount} entries) to ${path.relative(REPO_ROOT, OUT_ROOT)}/`);
  if (conflicts.length) {
    console.log(`WARNING: ${conflicts.length} output path conflicts (later file skipped):`);
    for (const [a, b] of conflicts) console.log(`  ${a}  <->  ${b}`);
  }
}

main();
