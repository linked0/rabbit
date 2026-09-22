# 2026-07-25 — rabbit history

> Source docs for today's work:
> - Feature design → [docs/features/ai-chat.md](../features/ai-chat.md) (§ "Ask about me (RAG)")
> - Task design → [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) (§5b)
> - Main design → [docs/rabbit-design.md](../rabbit-design.md)

### AI Chat: "Ask about me" RAG mode

Added a feature so a visitor (potential employer/client) can ask the AI Chat about **Hyunjae Lee**
and get factual, grounded answers. Source: [docs/features/ai-chat.md](../features/ai-chat.md#ask-about-me-rag--implemented).

- New `lib/about-me.ts` — RAG core: corpus from `lib/home-content.ts` (`PROFILE` + `PROJECTS`, EN/KO)
  plus best-effort `content/profile/*.md`; lexical keyword retrieval; a persona system message that
  answers only from context.
- `app/api/chat/route.ts` — new `aboutMe` flag (parallel to `mcp`); prepends the grounded system
  message; the two modes now compose (fixed the `mcp` branch that had replaced `outgoing`).
- `app/chat/ChatClient.tsx` — `👤 About Hyunjae` toggle beside the 🍝 Spaghetti MCP toggle, with
  example prompts.

### Decision: RAG over fine-tuning (why)

Chose **RAG**, not a fine-tuned LLM, for the "ask about me" feature. Fine-tuning would be costly,
slow to update (retrain on every résumé edit), risk hallucinating facts, and there is no training
pipeline in the repo. RAG grounds answers in the real profile/project text and updates by simply
editing content. Retrieval is lexical for now (zero new deps); embedding search is a drop-in upgrade
behind the same `Chunk` interface.

### Design coupling: About-me RAG (§5b) ↔ Auth + LLM gating (§2)

jay flagged that §5b couples with §2. The About-me mode is meant for **keyless, logged-out visitors**
(employers/clients), but §2's current model blocks exactly that: general chat is **BYO-API-key**, the
server-stored key is **gated to jay's email**, and `/chat` + `/api/chat` are **login-gated** in
`middleware.ts` — so a visitor can't even open the chat. Reconciliation (recorded in jun-30 design
§2 "Public About me path" + §5b): add a **server-keyed, rate-/budget-capped** path **scoped to the
About-me prompt**, exposed **without login** (`PUBLIC_PATHS`); general chat stays BYO-key. Until jay
decides how to power it (his server key + abuse caps · a cheap hosted small model · or keep it
login-only), the shipped feature serves only a logged-in user with a key configured. **Not yet
implemented — design decision pending.**

### Doc: GCP instance sizing & cost added to ai-chat.md

Folded the "run an LLM on GCP — which instance, what cost" analysis into
[docs/features/ai-chat.md](../features/ai-chat.md) cost section (new "Self-hosting on GCP" subsection):
model→instance→cost table (CPU / T4 / L4 / A100 / H100 + monthly ballparks), scale-to-zero vs
always-on billing, the Cloud Run GPU scale-to-zero sweet spot, and the MoE total-vs-active RAM note
(why Kimi K2's 1T total → server-only, not a 128 GB MacBook Pro). Captured with the feature per jay.

### Home: Verex featured card replaces the top-menu item

Per jay: added a **Featured** panel above the Projects section on `/home` — a wide card
(new `public/profile/verex.svg`, teal, distinct from Nostra's purple) linking to the live
Verex app, with EN/KO description ("decentralized prediction market — truth through
exchange", CTF Yes/No markets, sole-developer full-stack). Removed the `Verex ↗` top-menu
entry; its env-branching URL logic moved from `Nav.tsx` to `lib/verex.ts` (`verexUrl()`),
and the now-dead `always` flag was removed from `NavItem`/`menuAllowed`. Verified in the
browser: menu shows no Verex, card renders above Projects. No source doc — direct chat
request.

### Fix: project-post tables missing the last row's bottom border

jay reported project pages' tables looked incomplete. Root cause (verified via computed
styles in the browser): the global `tbody tr:last-child td { border-bottom: none }` rule
(meant for the app's own dashboard tables) has higher specificity (0,1,3) than
`.post-body td` (0,1,1), so it stripped the last row's bottom border in markdown posts.
Fix: `.post-body tbody tr:last-child td { border-bottom: 1px solid var(--border) }` in
`globals.css`. Verified on `/home/zksync`: computed style now `1px solid`, full border
visible in the screenshot.

### Gotcha: `content/` is not in the Cloud Run image

The Dockerfile ships only `.next/standalone` + `.next/static` + `public`, so `content/profile/*.md`
is absent at runtime in the cloud. The RAG therefore degrades to the structured `home-content.ts`
corpus in cloud mode (still works). Full `.md` depth in cloud needs one line in the Dockerfile
runner stage: `COPY --from=builder /app/content ./content`.

### Decision: one production server — `rabbit-test` deleted, `MENU_SHOW_ALL` removed

jay decided to maintain a **single** production Cloud Run service. Deleted `rabbit-test`
(the "all menus" twin) and collapsed the `prod|test` split out of `scripts/deploy.sh` —
the `MENU_SHOW_ALL` env flag went with it, since menu visibility is now decided by
`ALLOW_*` **plus owner login** rather than by which service you hit. `lib/verex.ts` lost
its test-server branch too (cloud → always `https://verex.jaylabs.xyz`). Passing a stale
`prod`/`test` argument now prints a notice instead of being silently ignored.
No source doc — direct chat request.

### Top menu + routes are owner-only, except Market and XYZ

Per jay: the allowed top menu should appear only when **his** Google account is signed in.
Added `isOwnerEmail()` to [auth.ts](../../auth.ts) (reuses the existing `ALLOWED_EMAILS`
allowlist; empty list = local dev, any login counts as owner) and used it in two places so
menu and routing can't drift apart:

- `app/Nav.tsx` — `NavItem.authOnly` replaced by `pub`. An item shows when
  `ALLOW_<code>=true` **and** (`pub` or owner). `pub` = Home, Market, XYZ Demo.
- `middleware.ts` — `PUBLIC_PATHS` trimmed to the same three surfaces (plus `/login` and
  the three public data APIs `/api/relay`, `/api/indices`, `/api/orderbook` that Market and
  XYZ fetch), and the guard now checks `isOwnerEmail(...)` instead of merely "logged in".

**Why the pairing matters:** previously `/game`, `/ap2`, `/jayverse` were in `PUBLIC_PATHS`,
so hiding a menu item was cosmetic — the URL still worked. Now hidden means unreachable.
Verified signed-out on `:3100`: nav renders only 홈 / 마켓 / XYZ 데모.

### www.jaylabs.xyz → Cloud Run `rabbit` (Firebase Hosting rewrite)

Implemented the custom domain the [jun-19 design](../tasks/jun-19-rabbit-design.md) Phase 2
planned, using the workaround that [jun-30 design §11](../tasks/jun-30-rabbit-design.md)
recommended: Cloud Run's built-in domain mapping still doesn't support `asia-northeast3`, so
traffic goes through a Firebase Hosting rewrite (`** → rabbit`, asia-northeast3) — the same
route [verex.jaylabs.xyz](../../../verex/docs/history/2026-07-25-verex-history.md) took today.

New `scripts/setup-domain-firebase.sh` (idempotent, REST-only — no firebase CLI), ported from
verex's, plus `firebase.json` / `.firebaserc` as the CLI-readable mirror. Hosting site is the
default `doubletree-498007`; the `jaylabs-xyz` zone lives in **that same project** this time
(verex's was cross-project) — a difference that turned out to matter enormously, see the
incident entry below.

It originally accepted several domains at once so it could do www + apex, and grouped DNS
records by (name, type) into a single record-set to support an apex's multiple A records.
After the incident both of those are moot: it now defaults to www only and **hard-refuses any
apex argument**.

Records created: `www` CNAME → `doubletree-498007.web.app` + its ACME TXT.
`PROD_URL=https://www.jaylabs.xyz` added to `scripts/deploy.env(.example)` so `deploy.sh`
pins `AUTH_URL` to the domain. **The apex was also registered at first and then rolled back —
see the incident entry below; www is the only custom domain.**

### Featured card: real Verex brand mark instead of the flat banner

jay called the card dull, then the boxed version weird. Replaced the generated teal
"VEREX / Yes 63¢ / No 37¢" banner with Verex's **actual** logo — the probability-coin mark
copied from `verex/packages/web/src/app/icon.svg` (indigo ring `#3F36E2`, emerald/fuchsia
quadrants; these match verex's `--primary` / `--yes` / `--no` tokens). First attempt sat the
round mark inside a bordered square tile, which read as an awkward box — dropped the tile so
the mark stands on its own at 64px, and moved the brand color into a soft corner wash on the
card itself (`.featured-card` / `.featured-mark` in `globals.css`). Verified by screenshot.

### Google login now works in local mode too (and a lockout bug it exposed)

jay asked whether Google login is possible locally. It wasn't — `auth.ts` hard-branched the
provider list on `appMode()`: cloud got Google, local got only the `LOCAL_PASSWORD`
credentials form. Nothing else was in the way (`.env.local` already has `AUTH_GOOGLE_ID`/
`AUTH_GOOGLE_SECRET` and `AUTH_URL=http://localhost:3100`), so the branch was the whole
blocker. Replaced it with a capability check, `googleEnabled()`: Google is registered
whenever OAuth credentials exist, and the password provider stays local-only (a single
shared password has no business in production). `/login` renders both when both apply.
Requires `http://localhost:3100/api/auth/callback/google` on the OAuth client.

**Bug this surfaced:** the first cut of `isOwnerEmail()` checked `ALLOWED_EMAILS`
unconditionally. The local credentials provider issues `local@rabbit`, which will never be
in that allowlist — so the new owner-gated middleware would have redirected local devs to
`/login` forever, in a loop. `isOwnerEmail()` now returns true for any logged-in session in
local mode (login there is already gated by `LOCAL_PASSWORD`), and enforces the allowlist
only in cloud. Same reasoning kept `Nav.tsx` showing **all** menus in local mode — jay's
point that local should stay unfiltered for development.

### Root cause: `InvalidCheck` on Google login — logging in via the run.app URL, not the domain

After the domain went live, Google login returned Auth.js's "Server error / problem with the
server configuration". Cloud Run logs showed
`InvalidCheck: pkceCodeVerifier value could not be parsed`.

Reproduced by starting the OAuth flow from each host and inspecting what Auth.js emits:

| Login started at | PKCE cookie set on | `redirect_uri` sent to Google | Result |
|---|---|---|---|
| `www.jaylabs.xyz` | `www.jaylabs.xyz` | `https://www.jaylabs.xyz/...` | ✅ match |
| `rabbit-fimfrbyasa-du.a.run.app` | that run.app host | `https://www.jaylabs.xyz/...` | ❌ cookie lost |
| `rabbit-179807446244.…run.app` | that run.app host | `https://www.jaylabs.xyz/...` | ❌ cookie lost |

`AUTH_URL` is pinned to the domain, so the callback always returns the browser to **www** —
but a login *started* on a run.app host set its PKCE cookie on that host, and the browser
won't send it to www. Not a config error: **the run.app URLs can no longer complete login by
design.** `https://www.jaylabs.xyz` is the only entry point. (Distinct from the June 17
two-hostname bug, which was hash-host vs projectNumber-host; this one is run.app vs domain.)

### Gotcha: Firebase Hosting rewrites the Host header to the run.app hostname

Probed with a unique query string — a request to `https://www.jaylabs.xyz/api/auth/csrf?probe=…`
is logged by Cloud Run as `https://rabbit-fimfrbyasa-du.a.run.app/api/auth/csrf?probe=…`.
**The container never sees `www.jaylabs.xyz` in `Host`.** Two consequences:

1. **`AUTH_URL` pinning is mandatory, not a nicety.** With `trustHost: true` and no `AUTH_URL`,
   Auth.js would derive `run.app` from the Host header even for visitors on the domain, and
   every callback would break.
2. Any future host-based logic (canonical redirect, apex → www) must read **`X-Forwarded-Host`**,
   not `Host` — keying off `Host` would match domain traffic too and cause a redirect loop.

### Incident: registering the apex deleted verex.jaylabs.xyz from DNS (~13 min outage)

**What happened.** jay reported `https://verex.jaylabs.xyz/` was down. It was returning
NXDOMAIN — its DNS records were gone. The Cloud DNS change log:

```
07:18:28–07:18:45  ADD  www CNAME, www ACME TXT, apex A, apex TXT, apex ACME TXT  ← setup script
07:24:39           DEL  verex.jaylabs.xyz. CNAME  verex-499205.web.app.
07:24:40           DEL  _acme-challenge.verex.jaylabs.xyz. TXT
```

**Root cause.** The script never deletes, and its writes ended at 07:18:45 — the deletions came
six minutes later, from Firebase. Registering the **apex** `jaylabs.xyz` on the Hosting site in
`doubletree-498007` — the *same project* that owns the `jaylabs-xyz` Cloud DNS zone — gave
Firebase write access to the zone and authority over the whole domain. It then pruned
`verex.jaylabs.xyz`, a sibling subdomain pointing at a **different** Hosting site
(`verex-499205.web.app`), as a conflicting record.

**Why verex's own setup never hit this:** its hosting lives in `verex-499205` while the zone is
in `doubletree-498007` — cross-project, so Firebase had no write access. The 2026-07-25 verex
entry called cross-project DNS a mere inconvenience; it was actually the thing protecting it.
Same-project is the dangerous configuration.

**Recovery.** Restored `verex.jaylabs.xyz CNAME verex-499205.web.app` plus the ACME TXT (the
token had rotated — used the current one from the customDomains API). verex's Hosting site was
never touched (`OWNERSHIP_ACTIVE / HOST_ACTIVE / CERT_ACTIVE`); only DNS was missing. Back to
200 immediately.

**Resolution — apex dropped, www only** (jay's call). Deleted the apex customDomain from the
site, then removed the apex `A` / `TXT` / `_acme-challenge` records, leaving `NS` and `SOA`
untouched. Final zone: `www` + `verex` (each CNAME + ACME TXT), nothing else at the apex.
`jaylabs.xyz` deliberately does not resolve. `setup-domain-firebase.sh` now defaults to www
only, carries a ⛔ warning, and **hard-refuses any apex argument** so this can't be repeated.

**Lesson.** Registering an apex on a Firebase Hosting site that can write the zone is not
additive — it makes Firebase the zone's authority and it will remove sibling records it doesn't
recognise. Never point an apex at a Hosting site living in the DNS zone's own project while
other subdomains are served from elsewhere.

---

## Session wrap-up — one prod server, owner-gated menu, www.jaylabs.xyz

The entries above are in the order things were discovered. This section is the version worth
remembering. No source doc — direct chat requests from jay.

### The three decisions

| # | Decision | Consequence |
|---|---|---|
| 1 | **One production Cloud Run service.** `rabbit-test` deleted. | `MENU_SHOW_ALL` gone; `deploy.sh` takes no target argument; `lib/verex.ts` lost its test branch. |
| 2 | **Top menu + routes are owner-only**, except Home / Market / XYZ Demo. | `isOwnerEmail()` drives both `Nav.tsx` and `middleware.ts`, so hidden now means unreachable. |
| 3 | **www.jaylabs.xyz is the canonical domain.** Apex deliberately dropped. | `AUTH_URL` pinned to it → it is the *only* URL where login works. |

### Final state

| Hostname | Serves | Notes |
|---|---|---|
| `www.jaylabs.xyz` | Cloud Run `rabbit` | Firebase Hosting rewrite; the only login entry point |
| `verex.jaylabs.xyz` | Cloud Run `verex-web` (project `verex-499205`) | restored after the apex incident above |
| `jaylabs.xyz` | — | intentionally does not resolve |
| `rabbit-*.run.app` | Cloud Run `rabbit` | pages load, **login cannot complete** — by design |

DNS zone `jaylabs-xyz` (project `doubletree-498007`): `NS`, `SOA`, and one `CNAME` + one
`_acme-challenge` `TXT` per subdomain. Nothing else at the apex.

### Five traps to keep in your head

1. **A Firebase Hosting apex takes over the whole DNS zone — if the zone is in the same
   project.** Registering `jaylabs.xyz` on the site in `doubletree-498007` (which owns the zone)
   made Firebase the zone's authority, and it deleted `verex.jaylabs.xyz` as a "conflicting"
   record. Subdomains only. Cross-project hosting is *protection*, not an inconvenience.
2. **Firebase Hosting rewrites `Host` to the run.app hostname.** The container never sees
   `www.jaylabs.xyz`. So `AUTH_URL` pinning is **mandatory** (without it `trustHost` derives
   run.app for everyone), and any host-based logic must read `X-Forwarded-Host`, never `Host`.
3. **A pinned `AUTH_URL` creates exactly one valid login entry point.** Start login on a
   run.app host and the PKCE cookie lands there while the callback returns to the domain →
   `InvalidCheck: pkceCodeVerifier value could not be parsed`. Always start at www.
4. **An owner check must not apply the email allowlist in local mode.** Local login issues
   `local@rabbit`, which can never be in `ALLOWED_EMAILS` — enforcing it there locks the
   developer out in a redirect loop. Local mode: logged in ⇒ owner.
5. **Never run `pnpm build` while `next dev` is live.** Both write `.next`; the dev server then
   throws `Cannot find module './NNN.js'` until restarted.

### Deploying does not require a commit

`deploy.sh` runs `gcloud run deploy --source .`, which uploads the **working tree**. Untracked
files ship; `.gcloudignore` (not git status) decides what is excluded, and `.env*` never leaves
the machine. Convenient — but it means the running revision can silently diverge from the repo,
so commit *because* you deployed, not in order to deploy.

### Manual steps this work required (not automatable from here)

- OAuth client → Authorized **redirect URIs** (not JavaScript origins, which reject paths):
  `https://www.jaylabs.xyz/api/auth/callback/google` and
  `http://localhost:3100/api/auth/callback/google`.
- Restart the dev server after any concurrent build.

### Login button hidden in production (cloud only)

Per jay ("일단" — provisional): the top bar no longer shows a **Sign in** link in cloud mode.
It's an owner-only entrance with no reason to advertise itself on a public portfolio site;
jay reaches it by typing `/login`. Local mode still renders the button (development
convenience), so the branch is `appMode() !== "cloud"` in `app/Nav.tsx`, not a removal.
Sign-out is untouched — it lives inside `UserMenu`, which only renders when logged in.

Note this is presentation only: `/login` stays public in `middleware.ts`, so the route works
for anyone who knows it. The actual gate remains Google OAuth + `ALLOWED_EMAILS`.

### Incident: concurrent verex deploy clobbered gcloud's active project → prod shipped without `AUTH_URL`

`deploy.sh` reported success, but its last step had failed:

```
Service [rabbit] revision [rabbit-00023-m5b] ... serving 100 percent of traffic
▶ AUTH_URL=https://www.jaylabs.xyz 적용
ERROR: (gcloud.run.services.update) Service [rabbit] could not be found.
```

**Root cause — two bugs stacked.**

1. `deploy.sh` began with `gcloud config set project "$PROJECT_ID"` and then omitted `--project`
   on every later call, relying on that **global, mutable** state. A verex deploy was running
   concurrently on the same machine and its own `gcloud config set project` switched the active
   project to `verex-499205`. rabbit's final `gcloud run services update` then looked for service
   `rabbit` in verex's project and failed. Revision 23 went live with **no `AUTH_URL` at all** —
   the app looked fine and only Google login was broken.
2. The failure was invisible because the script was invoked as `./scripts/deploy.sh | tail -12`.
   A pipeline's exit status is the **last** command's, so `tail`'s 0 masked the script's non-zero
   exit despite `set -euo pipefail` inside it. Never pipe a deploy through `tail`.

**Fixes.** Removed `gcloud config set project` entirely — the script no longer mutates global
gcloud state — and passed `--project "$PROJECT_ID"` explicitly on all six remaining calls
(`services enable`, three `secrets` calls, `run deploy`, both `run services update`). Added a
**readback guard**: after setting `AUTH_URL`, re-describe the service and `exit 1` with recovery
instructions if the live value doesn't match. Verified the guard doesn't false-alarm on a good
deploy (the `--format` output is single-quoted, so it strips `[]` *and* `'`).

**Lesson.** `gcloud config set project` is process-global and shared across every shell on the
machine. Any script that sets it is unsafe to run alongside another project's script. Always
pass `--project` explicitly.
