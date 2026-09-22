# 2026-06-30 — rabbit

_Implements: task [docs/tasks/jun-30-rabbit.md](../tasks/jun-30-rabbit.md) · design [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md)._

## Summary

- Split "Portfolio & Market" into separate Portfolio + Market menu items and reordered the nav (design §1).
- Made the 포트폴리오 menu item login-only (`authOnly`), not just access-gated (design §2).
- Knowledge page first served `know.html` via iframe, then the whole Knowledge category was removed and its content moved out of `public/` into `docs/` (design §4).
- Moved leftover root study files into `docs/archive/` for later reference.
- Fixed know.html's local `file://` links to resolve from `docs/`: 47/47 links resolve, 0 broken.

### Task 1 — split "Portfolio & Market" into Portfolio + Market; reorder menu
- Implemented design §1: `app/Nav.tsx` splits the menu and reorders to `홈 · 지식 · 포트폴리오 · AI 챗 · 게임 · 마켓 · AP2 · XYZ · ETC · Verex↗`; added `app/market/page.tsx` (stub — indices/orderbook is §3/task 3); `middleware.ts` makes `/market` public while `/portfolio` stays login-only; tidied the `/portfolio` stub heading.
- Verified: `pnpm build` ✓, `/market` 200, `/portfolio` 302→/login.
- Source: [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) §1.

### Task 4 — Knowledge page serves `know.html`
- Implemented design §4: moved `know.html` + `management.md` from repo root into `public/knowledge/`; rewrote `app/knowledge/page.tsx` to embed `/knowledge/know.html` in an iframe; `middleware.ts` matcher now excludes `knowledge/` so the static file serves without auth.
- Verified: `/knowledge/know.html` 200 with the "Workspace Index" content.
- **Not done / flagged:** know.html's links to `ai/`/`eng/`/`nostra/`/`images/`/`docs/` are stale (those moved to `archive/`/`docs/` in the restructure); other loose root study files left in place pending jay's call.
- Source: [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) §4.

### Fix — Portfolio menu item hidden until login
- Per jay's clarification, the **포트폴리오 menu item** should show only when logged in (not just access-gated): `app/Nav.tsx` makes Portfolio `authOnly` → filtered out of the menu when logged out (AI Chat stays visible, access-gated); updated design §2.
- Verified on a clean server: logged-out `/market` menu has no 포트폴리오 / `/portfolio` link; `/portfolio` still 302→/login.
- Source: [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) §2.

### Knowledge cleanup — move leftover root files to docs/archive/
- Per jay: moved the leftover loose root study files (`index.html`, `baseline_*.html`, `management.html`, `sarah_chen_index.html`, `luminary_index.html`, `zksnark_math.html`, `assumptions.md`, `clarifying_questions.md`) into **`docs/archive/`** for later reference (`README.md` stays at root).
- On know.html's stale links I **recommend prune** (fixing paths still 404s since only `public/` is web-served) — awaiting jay's go-ahead.
- Source: [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) §4.

### Knowledge category removed; content → docs/ for local file:// browsing
- Per jay: **removed the Knowledge category** from the app (Nav item + `/knowledge` route + middleware public-path/matcher entries — restore when needed) and relocated its content out of `public/` into **`docs/`** so it's **not web-served** (no public exposure): `docs/know.html` (index, opened via `file:///Users/jay/work/task/docs/know.html`) + `docs/knowledge/management.md`.
- Verified: build ✓, menu has no 지식, `docs/know.html` present.
- **Not moved:** the folders know.html links to — `archive/{ai(881MB),eng,nostra,images}` + `docs/*` — left for the restore step.
- Source: [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) §4.

### Fix — know.html links resolve from docs/ (local file:// browsing)
- jay reported broken `file://` links (e.g. `…/docs/docs/dev.md`) because know.html's links were root-relative but it now lives at `docs/know.html`.
- Rewrote its **47 unique local links** to resolve from `docs/`: `docs/X`→`X`; `ai|eng|nostra|images|sections|unity/`→`../archive/<same>`; `zksnark_math.html`→`archive/zksnark_math.html`; `management.md`→`knowledge/management.md`. No content moved — links just re-pointed to where files already are (`docs/`, `archive/`, `docs/archive/`, `docs/knowledge/`).
- **Full link check: 47/47 resolve, 0 broken.** Source: jay's report (no task file).
