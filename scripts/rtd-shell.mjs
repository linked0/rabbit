// 읽기 문서(read-the-docs) 페이지 껍데기 — 좌측 고정 레일 + 본문 (2026-08-12).
//
// 왜 모듈로 뽑았나: docs/pocs.html 과 docs/algorithms.html 이 같은 레이아웃을 쓴다. 두
// 생성기에 CSS 를 복사해 두면 한쪽만 고쳐지는 날이 오고, 그건 이 저장소가 카드 데이터로
// 이미 한 번 겪은 표류다(TIL 라벨). 껍데기는 여기 하나, 생성기는 데이터만 만든다.

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {object} o
 * @param {string} o.title        <title> 텍스트
 * @param {string} o.railTitle    레일 상단 굵은 글씨 (링크)
 * @param {string} o.railTitleHref
 * @param {string} o.railSub      그 아래 한 줄
 * @param {string} o.filterPlaceholder
 * @param {Array<{label:string, items:Array<{anchor:string,text:string,color:string,statusLabel:string,spy?:boolean}>}>} o.navGroups
 * @param {string} o.railFoot     레일 하단 HTML
 * @param {string} o.srcLine      본문 최상단 출처 한 줄 (평문)
 * @param {string} o.contentHtml  본문 HTML
 */
const PAGE_CSS = `
  :root {
    --bg:#f8fafc; --card:#fff; --rail:#f1f5f9; --text:#0f172a; --text2:#475569;
    --accent:#0ea5e9; --accent-soft:#0ea5e91a; --border:#e2e8f0;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg:#0b1220; --card:#111a2b; --rail:#0f1728; --text:#e2e8f0; --text2:#94a3b8;
      --accent:#38bdf8; --accent-soft:#38bdf826; --border:#1e293b;
    }
  }
  * { box-sizing: border-box; }
  /* 본문을 키운다 (jay, 2026-08-12) — 이 페이지는 훑는 목록이 아니라 읽는 문서다.
     17px/1.75 는 긴 문단을 오래 읽을 때의 기준값이고, 본문 폭도 그에 맞춰 넓혔다. */
  body { font-family:'Inter',sans-serif; font-size:17px; background:var(--bg); color:var(--text); line-height:1.75; margin:0; }
  a { color: var(--accent); word-break: break-word; }

  .layout { display:flex; align-items:flex-start; }

  /* ── 좌측 레일: 전체 목록 ── */
  .rail {
    flex: 0 0 288px; width:288px; position:sticky; top:0; height:100vh;
    background:var(--rail); border-right:1px solid var(--border);
    display:flex; flex-direction:column;
  }
  .rail-head { padding:18px 20px 14px; border-bottom:1px solid var(--border); }
  .rail-title { display:block; font-size:1.1rem; font-weight:700; color:var(--text); text-decoration:none; line-height:1.2; }
  .rail-sub { display:block; margin-top:3px; font-size:0.76rem; color:var(--text2); }
  .rail-search { padding:14px 16px 8px; }
  .rail-search input {
    width:100%; padding:8px 12px; font:inherit; font-size:0.85rem;
    color:var(--text); background:var(--card); border:1px solid var(--border); border-radius:9px;
  }
  .rail-search input:focus { outline:2px solid var(--accent-soft); border-color:var(--accent); }
  .rail-nav { flex:1 1 auto; min-height:0; overflow-y:auto; padding:6px 10px 20px; }
  .nav-group + .nav-group { margin-top:14px; }
  .nav-group-label {
    margin:10px 8px 6px; font-size:0.7rem; font-weight:700; letter-spacing:0.08em;
    text-transform:uppercase; color:var(--text2);
  }
  .rail-nav ul { list-style:none; margin:0; padding:0; }
  .nav-link {
    display:flex; align-items:flex-start; gap:8px; padding:7px 10px; border-radius:8px;
    font-size:0.9rem; line-height:1.4; color:var(--text2); text-decoration:none;
  }
  .nav-link:hover { background:var(--card); color:var(--text); }
  .nav-link.active { background:var(--accent-soft); color:var(--accent); font-weight:600; }
  /* 점이 상태를 말하는 유일한 표지라 크게 (jay, 2026-08-12) — 6px 은 색 구분이 어려웠다. */
  .nav-dot { flex:0 0 auto; width:10px; height:10px; margin-top:6px; border-radius:999px; }
  .nav-text { min-width:0; flex:1 1 auto; }
  .rail-foot { padding:12px 16px; border-top:1px solid var(--border); font-size:0.72rem; color:var(--text2); }
  .no-results { display:none; padding:10px; font-size:0.82rem; color:var(--text2); }

  /* ── 본문 ── */
  .content { flex:1 1 auto; min-width:0; max-width:960px; margin:0 auto; padding:34px 30px 100px; }
  .src { font-family: ui-monospace, monospace; font-size:0.8rem; color:var(--text2); margin-bottom:24px; word-break:break-all; }
  .group-heading { font-size:0.84rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text2); margin:38px 0 16px; scroll-margin-top:20px; }
  .group-heading:first-child { margin-top:0; }
  .group-count { font-weight:600; opacity:0.7; }
  article {
    background:var(--card); border:1px solid var(--border); border-radius:14px;
    padding:28px 26px; box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.06); margin-bottom:24px;
    scroll-margin-top:20px;
  }
  article h1 { margin-top:0; font-size:1.55rem; line-height:1.3; }
  article h2 { font-size:1.15rem; line-height:1.3; margin:22px 0 8px; }
  p { margin:10px 0; word-wrap:break-word; }
  .lead { font-size:1.05rem; color:var(--text2); font-style:italic; }
  .meta { font-size:0.92rem; color:var(--text2); }
  .badge { font-size:0.62em; font-weight:700; padding:2px 8px; border-radius:999px; vertical-align:middle; letter-spacing:0.04em; }

  /* 커리큘럼 항목 목록 (algorithms.html) — 한 줄에 번호·제목·상태. */
  .topics { list-style:none; margin:0; padding:0; }
  .topics li { display:flex; gap:12px; align-items:baseline; padding:9px 0; border-top:1px solid var(--border); scroll-margin-top:20px; }
  .topics li:first-child { border-top:0; }
  .topic-no { flex:0 0 auto; min-width:2.4em; font-variant-numeric:tabular-nums; font-size:0.86rem; color:var(--text2); }
  /* 레일·제목 안에 인라인으로 들어가는 번호 (pocs.html) — flex 자식이 아니라 글 흐름 위에 놓인다. */
  .nav-text .topic-no, article h1 .topic-no { display:inline-block; min-width:1.9em; }
  article h1 .topic-no { font-size:0.72em; }
  .topic-text { flex:1 1 auto; min-width:0; }
  .topic-done { flex:0 0 auto; }

  /* 항목 상세 페이지 (docs/topics/*.html) — 레일 없이 읽는 한 편. */
  .solo { max-width:760px; margin:0 auto; padding:34px 24px 90px; }
  .crumb { font-size:0.85rem; color:var(--text2); margin-bottom:18px; }
  .pager { display:flex; justify-content:space-between; gap:14px; margin-top:26px; font-size:0.9rem; }
  .pager span { color:var(--text2); }
  .stub { border-left:4px solid var(--accent); background:var(--card); border-radius:0 12px 12px 0; padding:14px 18px; }

  /* 좁은 화면: 레일이 위로 접히고 자기 높이만큼만 차지한다 (100vh 레일이 화면을 다 먹지 않게) */
  @media (max-width: 900px) {
    .layout { flex-direction:column; }
    .rail { position:static; width:100%; flex:none; height:auto; max-height:none; border-right:0; border-bottom:1px solid var(--border); }
    .rail-nav { max-height:320px; }
    .content { padding:24px 18px 70px; }
  }
`;

export function renderRtdPage(o) {
  const navGroups = o.navGroups
    .map((g) => {
      const items = g.items
        .map((it) => {
          // spy: false 인 항목은 스크롤 하이라이트 대상에서 뺀다 — 같은 앵커를 가리키는
          // 바로가기(예: 하단 Done 묶음)가 본문 항목과 함께 켜지면 두 곳이 활성으로 보인다.
          const key = it.spy === false ? '' : ` data-key="${escapeHtml(it.anchor)}"`;
          return `        <li><a class="nav-link" href="#${escapeHtml(it.anchor)}"${key}><span class="nav-dot" style="background:${it.color};" title="${escapeHtml(it.statusLabel)}"></span><span class="nav-text">${it.text}</span></a></li>`;
        })
        .join('\n');
      return `      <div class="nav-group" data-group>
        <p class="nav-group-label">${escapeHtml(g.label)}</p>
        <ul>
${items}
        </ul>
      </div>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(o.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${PAGE_CSS}</style>
</head>
<body>
<div class="layout">
  <aside class="rail">
    <div class="rail-head">
      <a class="rail-title" href="${escapeHtml(o.railTitleHref)}">${escapeHtml(o.railTitle)}</a>
      <span class="rail-sub">${o.railSub}</span>
    </div>
    <div class="rail-search">
      <input id="filter" type="search" placeholder="${escapeHtml(o.filterPlaceholder)}" aria-label="${escapeHtml(o.filterPlaceholder)}" autocomplete="off">
    </div>
    <nav class="rail-nav" id="nav">
${navGroups}
      <p class="no-results" id="no-results">No match.</p>
    </nav>
    <div class="rail-foot">${o.railFoot}</div>
  </aside>

  <main class="content">
    <div class="src">${escapeHtml(o.srcLine)}</div>
${o.contentHtml}
  </main>
</div>
<script>
  // 필터: 사이드바 항목만 걸러낸다 — 본문은 그대로 두어 링크(#anchor)가 항상 살아 있게.
  const input = document.getElementById('filter');
  const links = [...document.querySelectorAll('.nav-link')];
  const groups = [...document.querySelectorAll('[data-group]')];
  const noResults = document.getElementById('no-results');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const a of links) {
      const hit = !q || a.textContent.toLowerCase().includes(q);
      a.parentElement.style.display = hit ? '' : 'none';
      if (hit) shown++;
    }
    for (const g of groups) {
      const any = [...g.querySelectorAll('.nav-link')].some((a) => a.parentElement.style.display !== 'none');
      g.style.display = any ? '' : 'none';
    }
    noResults.style.display = shown ? 'none' : 'block';
  });

  // 스크롤 위치에 따라 현재 항목을 표시 (읽던 자리를 목록에서 잃지 않게).
  const spied = links.filter((a) => a.dataset.key);
  const order = spied.map((a) => a.dataset.key);
  const seen = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) seen.add(e.target.id);
      else seen.delete(e.target.id);
    }
    const first = order.find((k) => seen.has(k));
    for (const a of spied) a.classList.toggle('active', a.dataset.key === first);
  }, { rootMargin: '-10% 0px -70% 0px' });
  for (const key of order) {
    const el = document.getElementById(key);
    if (el) io.observe(el);
  }
</script>
</body>
</html>
`;
}

/**
 * 항목 하나짜리 상세 페이지 — 레일 없이, 앞뒤 이동만 (jay, 2026-08-12).
 * 왜 레일을 안 싣나: 커리큘럼 150개 각각에 100줄짜리 목록을 복사하면 파일이 수 MB 로
 * 불어나고, 상세 페이지에서 필요한 건 "이 항목 하나 + 돌아갈 길"뿐이다.
 *
 * @param {object} o
 * @param {string} o.title      <title>
 * @param {string} o.crumbHtml  상단 이동 경로 HTML
 * @param {string} o.bodyHtml   본문 article HTML
 * @param {string} o.pagerHtml  하단 이전/다음 HTML
 */
export function renderTopicPage(o) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(o.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${PAGE_CSS}</style>
</head>
<body>
<div class="solo">
  <p class="crumb">${o.crumbHtml}</p>
${o.bodyHtml}
  <div class="pager">${o.pagerHtml}</div>
</div>
</body>
</html>
`;
}
