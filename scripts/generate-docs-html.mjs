#!/usr/bin/env node
// Renders every .md file in the repo to a self-contained HTML page under docs/html/,
// mirroring the source path 1:1 (docs/foo.md -> docs/html/docs/foo.html) so relative
// links between docs resolve correctly. Source .md files are left untouched.
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

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
    bodyHtml = rewriteLinks(bodyHtml, mdAbs, outAbs);

    const sourceRel = path.relative(REPO_ROOT, mdAbs);
    const curriculumList = curriculumListFor(mdAbs);
    const backHref = path.relative(path.dirname(outAbs), curriculumList ?? INDEX_HTML);
    const backLabel = curriculumList ? path.basename(curriculumList, '.html').replace(/^./, (c) => c.toUpperCase()) : 'Index';

    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, renderPage({ title, sourceRel, bodyHtml, backHref, backLabel }), 'utf8');
    converted++;
  }

  console.log(`Converted ${converted} markdown files to ${path.relative(REPO_ROOT, OUT_ROOT)}/`);
  if (conflicts.length) {
    console.log(`WARNING: ${conflicts.length} output path conflicts (later file skipped):`);
    for (const [a, b] of conflicts) console.log(`  ${a}  <->  ${b}`);
  }
}

main();
