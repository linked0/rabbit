# 2026-07-22 — rabbit history

**Source:** ad-hoc request from jay (no formal design doc) — "per-menu config for which top-menu
items show on cloud; local always shows all." Branch: `claude/work-2026-07-22` (today's shared
branch, based on yesterday's unmerged `claude/work-2026-07-21` / PR #21).

### Feature: per-menu cloud visibility flags (`ALLOW_<CODE>`)

First cut used a single comma-list (`CLOUD_HIDDEN_MENUS`); jay found that error-prone, so switched to
**one boolean env flag per menu**.

- [app/NavLinks.tsx](../../app/NavLinks.tsx): `NavItem` gains `code?: string`.
- [app/Nav.tsx](../../app/Nav.tsx): each MENU item has a `code` (HOME/CHAT/GAME/MARKET/AP2/XYZ/
  JAYVERSE/VEREX/PORTFOLIO). New `menuAllowed(item)`: **local** mode always shows; **cloud** mode
  shows only when `process.env["ALLOW_"+code] === "true"`. `authOnly` (Portfolio) preserved.
- **Semantics = default-HIDE (allow-list)** — per jay's follow-up: an unconfigured or **later-added**
  menu is hidden on cloud by default, so new menus never leak to production; only `ALLOW_<CODE>=true`
  opts a menu in. (First pass defaulted to show; flipped.)
- Documented all flags in [.env.example](../../.env.example) + [.env.local](../../.env.local); existing
  menus set to `=true` so current cloud visibility is preserved.
- **Verified:** `tsc` exit 0; `/market` + `/` render all menus in local mode, no console errors;
  predicate unit-checked (cloud: `=true`→shown, unset/later-added→hidden, no-code→hidden; local→always shown).
- Not committed — left in the working tree on `claude/work-2026-07-22` for jay's review.

### Fix: forward ALLOW_* menu flags to Cloud Run on deploy

Caught during a deploy question: `.env.local` is gitignored (not in the image), and
[scripts/deploy.sh](../../scripts/deploy.sh)'s `gcloud run deploy --set-env-vars` did **not** include
any `ALLOW_*`. With default-HIDE semantics that means **every menu would be hidden on cloud**.
`deploy.sh` already `source .env.local`, so the flags are in the shell env — added a loop that
collects all `ALLOW_*` vars and appends them to `--set-env-vars`, so a menu's flag (including any
added later) auto-forwards to Cloud Run. Accumulator renamed `ALLOW_ENV`→`MENU_ENV` so it doesn't
match `^ALLOW_` and self-reference. Verified: forwarding string is clean (all 9 flags), `bash -n`
passes. Nav reads `process.env.ALLOW_*` at request time (dynamic render via `auth()`), so Cloud Run
runtime env applies. Same branch `claude/work-2026-07-22`.

### Feature: two-target deploy (test = all menus, prod = filtered)

jay maintains two Cloud Run deployments — **test** (the `run.app` URL, e.g.
`rabbit-179807446244.asia-northeast3.run.app`) showing **all** menus, and **production**
(`rabbit.jaylabs.xyz`) showing the ALLOW_*-filtered subset. Since one Cloud Run service can't serve
two menu configs, they must be **separate services**.

- [app/Nav.tsx](../../app/Nav.tsx): `menuAllowed` now short-circuits to "show all" when
  `MENU_SHOW_ALL === "true"` (in addition to local mode); otherwise the prod ALLOW_* filter applies.
- [scripts/deploy.sh](../../scripts/deploy.sh): takes a target arg — `./scripts/deploy.sh test`
  (default) deploys `$SERVICE` (rabbit) with `MENU_SHOW_ALL=true`; `./scripts/deploy.sh prod` deploys
  `$PROD_SERVICE` (rabbit-prod) with `MENU_SHOW_ALL=false` (ALLOW_* filter). All `$SERVICE` refs →
  `$DEPLOY_SERVICE`; `MENU_SHOW_ALL` added to `--set-env-vars`; AUTH_URL uses `$PROD_URL` (custom
  domain) for prod when set, else the run.app URL.
- [scripts/deploy.env.example](../../scripts/deploy.env.example): added `PROD_SERVICE`, `PROD_URL`.
- **Verified:** `bash -n` OK; target logic (test→all/rabbit, prod→filtered/rabbit-prod, bad-arg→usage
  error); `tsc` exit 0; predicate (test/cloud+MENU_SHOW_ALL→all shown, prod/cloud→ALLOW_* filter,
  local→all). Local `/market` unaffected, no console errors. Same branch.

### Deploy: test server to Cloud Run

Ran `./scripts/deploy.sh test` — deployed the working tree (today's menu work + yesterday's trading
panel) to Cloud Run service **rabbit**, revision `rabbit-00012-sdd`, 100% traffic. URL:
**https://rabbit-179807446244.asia-northeast3.run.app** (`MENU_SHOW_ALL=true`, `APP_MODE=cloud`).
Secrets refreshed (v8), AUTH_URL set to the run.app domain. **Verified live:** home renders and the
nav shows **all 8 menus**, confirming the test-server show-all path works on real Cloud Run. (Not a
git commit — `--source .` deploys the working tree directly.)

### UI: remove home "jaylabs" section + vivid Verex nav CTA

- [app/home/page.tsx](../../app/home/page.tsx): removed the "jaylabs" panel (the `→ Verex` card) —
  home now goes profile → Projects directly.
- [app/NavLinks.tsx](../../app/NavLinks.tsx) + [app/globals.css](../../app/globals.css): external nav
  links get a `nav-cta` class → **Verex ↗** is now a vivid indigo→violet gradient pill (white text,
  soft glow) so it stands out from the neutral nav. `tsc` exit 0; verified local render (section gone,
  Verex vivid), no console errors. Then redeployed to the test server (`deploy.sh test`).

### UI: restyle top-right nav cluster (avatar dropdown + segmented toggles + wrap fix)

The 로그인/사용자 cluster looked bad (esp. 로그아웃 wrapping vertically). Reworked it:
- **Wrap bug fix:** `white-space: nowrap` on `button` in [app/globals.css](../../app/globals.css) — 버튼
  글자가 세로로 쪼개지던 문제 해결.
- **Segmented toggles:** EN + theme toggles wrapped in a single `.seg` pill (shared border + divider)
  in [app/Nav.tsx](../../app/Nav.tsx).
- **Avatar dropdown** ([app/UserMenu.tsx](../../app/UserMenu.tsx), new client component): the 👤 emoji +
  email + sign-out are replaced by one **gradient-avatar button** (user initial, indigo→violet to
  match Verex) that opens a dropdown with the email + 로그아웃. Outside-click / ESC to close. Sign-out
  runs via a new server action [app/auth-actions.ts](../../app/auth-actions.ts) (`signOutAction`).
- **Verified:** `tsc` exit 0; segmented toggle pill renders, no console errors. The avatar dropdown
  needs a logged-in view to see (not verified in-browser — I don't enter the login password). Not
  committed; not deployed. Same branch `claude/work-2026-07-22`.

### Feature: language toggle + language-aware content on project pages

Project detail pages ([app/home/[slug]/page.tsx](../../app/home/[slug]/page.tsx)) had **no Nav** (so
no language toggle) and rendered a single markdown body. Fixed both:
- Added `<Nav />` → the full language/theme toggle + menu now appear on every project page; localized
  the "← Home" label via `pick(getLang(), …)`.
- [lib/posts.ts](../../lib/posts.ts): each post file actually contains **both** languages — English
  on top, a `## Korean Version` heading, then Korean. `getPostHtml(slug, lang)` now **splits at that
  marker** and renders only the selected language: `en` = text before the marker (with the
  "Read the Korean version here" `<div>` link and trailing `---` stripped), `ko` = text after it.
  Falls back to the whole file if the marker is missing.
- **Verified:** `tsc` exit 0; on `/home/bosagora-mainnet`, English view shows only English (no Korean,
  no cross-link), toggling to 한국어 shows only the Korean body ("2019년에 Bosagora Foundation…"), and the
  nav + "← Home"/"← 홈" switch too. No console errors. Not committed; not deployed. Same branch.

### Feature: home (main) page content language-aware

The home page chrome switched with the toggle but its **content** (heading, tagline, project
titles/descriptions, "Projects", read time) stayed English. Made it bilingual:
- [lib/home-content.ts](../../lib/home-content.ts): added `headingKo`/`taglineKo` to `PROFILE` and
  optional `titleKo`/`descriptionKo` to each project (Korean translations for all 7).
- [app/home/page.tsx](../../app/home/page.tsx): `getLang()` + `pick()` for heading, tagline,
  "프로젝트"/"Projects", per-project title & description (fallback to English via `?? title`), and read
  time (`2 min`→`2분`).
- **Verified:** `tsc` exit 0; Korean shows 안녕하세요…/프로젝트/Bosagora 메인넷/2분, English shows Hello…/Projects/
  Bosagora Mainnet/2 min. Not committed; not deployed. Same branch `claude/work-2026-07-22`.

### Content: remove Uniswap project, sort newest-first, add Prediction Market (Nostra)

- Removed `uniswap-v2-hardhat` from the project list ([lib/home-content.ts](../../lib/home-content.ts));
  its `.md` left in place (route now 404s, unlinked).
- Home page now sorts projects **newest-first** (`b.date.localeCompare(a.date)`) in
  [app/home/page.tsx](../../app/home/page.tsx).
- Added **Prediction Market (Nostra)** as the newest project (jay's request): solo full-stack build,
  **2025.08 ~ 2026.02**, source https://nostra-web-...run.app (a Polymarket-style prediction market —
  wallet trading on Yes/No outcomes across Politics/Finance/Sports/Crypto/etc.). New
  [content/profile/prediction-market.md](../../content/profile/prediction-market.md) (EN + `## Korean
  Version`), a branded SVG thumbnail
  [public/profile/prediction-market.svg](../../public/profile/prediction-market.svg), and the list
  entry (titleKo "Prediction Market 개발"). Content is a rough draft (jay to review/adjust).
- **Verified:** `tsc` exit 0; home lists it first with the NOSTRA thumbnail, detail page renders the
  EN body (KO splits on toggle). Not committed; not deployed. Same branch.

_(Note: an earlier recurring `TradePanel.tsx` "Unexpected token div" console error was confirmed
**stale** — leftover in a long-lived browser tab from yesterday's mid-edit saves; a fresh tab shows
none, and `/market` renders fine.)_
