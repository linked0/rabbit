# 2026-07-27 — rabbit history

> Source docs for today's work:
> - No task/design doc — direct request from jay ("show all top menu items when I sign in with
>   Google as linked0@gmail.com, on both local and server").
> - Related prior decision → [2026-07-25 history](2026-07-25-rabbit-history.md) (owner-gated menu,
>   `ALLOW_*` flags).

### Menu: open every top-menu item to the owner on local and cloud

Flipped `ALLOW_CHAT`, `ALLOW_GAME`, `ALLOW_AP2`, `ALLOW_JAYVERSE` from `false` to `true` in
`.env.local` (gitignored). `scripts/deploy.sh` sources that file and forwards every `ALLOW_*` to
Cloud Run, so the same edit covers the deployed service — the flags were what hid those four items,
not the owner check. Non-`pub` items still require owner login, so they appear only for
`linked0@gmail.com` (`ALLOWED_EMAILS`).

Local needed no change: `menuVisible()` in [app/Nav.tsx](../../app/Nav.tsx) short-circuits to `true`
when `appMode() !== "cloud"`, so local already shows the full menu. Left `ALLOW_VEREX=false` — Verex
was deliberately removed from `MENU` on 2026-07-25 in favour of the featured card on the home page,
so the flag is inert.

### Owner gate: one rule for local and cloud, no local free pass

jay clarified the ask — the full menu should appear **only** for `linked0@gmail.com`, on local as
well as the server. Two blanket local exemptions were doing the opposite:

- [auth.ts](../../auth.ts) `isOwnerEmail()` returned `true` for any logged-in user outside cloud
  mode. Now it checks `ALLOWED_EMAILS` alone, in every mode.
- [app/Nav.tsx](../../app/Nav.tsx) `menuVisible()` short-circuited to `true` outside cloud mode.
  Removed, so local runs the same `ALLOW_*` + `pub`/owner gate as production.

Deliberate consequence: the `LOCAL_PASSWORD` credentials login (`local@rabbit`) is no longer an
owner — locally you sign in with Google too. jay chose this over keeping the dev escape hatch,
because two different rules meant the local menu never matched what production would show.
`pub` items (Home / Market / XYZ) still render for signed-out visitors, per jay's call.

Verified with `curl localhost:3100`: a signed-out visitor now gets 홈 / 마켓 / XYZ 데모 + 로그인,
nothing else.

### Nav: "Sign in" wrapped to two lines in the top bar

With every menu item visible the top bar ran out of room and the button rendered as "Sign / in"
(jay's screenshot). Added `white-space: nowrap` to `button.ghost, a.ghost` in
[app/globals.css](../../app/globals.css) — min-content then equals the text width, so flex can't
squeeze it further.

### Root cause hunt: production Google login fails with `error=Configuration`

jay hit `Server error / There is a problem with the server configuration` at
`/api/auth/error?error=Configuration`. Cloud Run stderr gives the real error:

```
[auth][error] InvalidCheck: pkceCodeVerifier value could not be parsed
```

**Not caused by today's changes.** The same error appears on revision `rabbit-00022-jb6` on
2026-07-25 — eight times. Google login on production has never worked; the `AUTH_URL` pinning in
`scripts/deploy.sh` was an earlier attempt at this same bug and did not fix it.

What was ruled out by direct measurement:

- **Env/config** — the live revision has `AUTH_URL=https://www.jaylabs.xyz`, `ALLOWED_EMAILS`, and
  all secrets bound. `AUTH_SECRET` is byte-identical across Secret Manager versions 16–19 and
  `.env.local`, so it is not a rotation problem.
- **Firebase Hosting stripping cookies** — plausible (www.jaylabs.xyz is a Firebase Hosting rewrite
  to Cloud Run) but false. Driving the flow with curl through `www.jaylabs.xyz` sets
  `__Secure-authjs.pkce.code_verifier` (a well-formed 5-part JWE, 435 bytes) and reads it back
  fine; the CSRF check also passes, which proves inbound cookies reach the backend.
- **The Auth.js route itself** — a synthetic callback gets *past* the PKCE check and fails later at
  `CallbackRouteError: response parameter "iss" missing`, which is the expected failure for a fake
  code. So PKCE encode/decode works in production.

What is left: the request log shows the browser flow goes `POST /login` (the **Server Action** that
calls `signIn("google")`, 303) → Google → callback 0.66 s later. The PKCE cookie set by that Server
Action response is the one that isn't readable at the callback. The Auth.js `/api/auth/signin/google`
route works; the Server Action path does not.

jay confirmed it fails in incognito too, which rules out stale cookies and pins the blame on the
Server Action.

### Fix: call signIn() from the client, not from a Server Action

Replaced the `"use server"` form on the login page with
[app/login/GoogleSignInButton.tsx](../../app/login/GoogleSignInButton.tsx) — a client component
calling `signIn("google", { callbackUrl })` from `next-auth/react`. That helper walks the stock
Auth.js path (`GET /api/auth/csrf` → `POST /api/auth/signin/google`), which is the path already
measured as working in production: a curl run through it sets and reads the PKCE cookie and gets
past the check. The Server Action loses its `Set-Cookie` when redirecting to an external URL, so
the verifier never survives the trip to Google.

`/login`'s bundle grows 175 B → 3.03 kB, the cost of shipping the auth client. Worth it for a
login that works.

### Login: return to the page you came from, drop the password login, add a way out

Three asks from jay in one pass.

- **Return-to-previous-page.** [middleware.ts](../../middleware.ts) now attaches
  `?callbackUrl=<original path>` when it bounces you to `/login`, and
  [app/SignInLink.tsx](../../app/SignInLink.tsx) (new client component — the server-rendered `Nav`
  can't read the current path) does the same for the top-bar link. The login page feeds that into
  `signIn("google", { redirectTo })`, falling back to `/summary`. New
  [lib/callback-url.ts](../../lib/callback-url.ts) sanitises the value: the query string is
  attacker-controlled, so anything not a same-site absolute path — `//evil.com`, `/\evil.com`,
  absolute URLs — is dropped rather than turned into an open redirect.
  `SignInLink` deliberately uses only `usePathname()`, not `useSearchParams()`, because the latter
  demands a Suspense boundary and would push the whole layout to client-side rendering.
- **Password login removed.** Deleted the `Credentials` provider from [auth.ts](../../auth.ts) and
  the password form from [app/login/page.tsx](../../app/login/page.tsx). Once owner status became
  allowlist-only, `local@rabbit` could never be an owner — the form only produced a signed-in
  session with no permissions. Updated [README.md](../../README.md) and `.env.example` so they stop
  telling you to set `LOCAL_PASSWORD`. If Google credentials are missing the page now says so
  instead of rendering an empty panel.
- **Back button.** A `← 홈으로 / Back to home` link at the top of the login page. It points at `/`,
  not at `callbackUrl`: when you arrived via a middleware bounce, going "back" to the protected page
  would just bounce you to `/login` again.

Verified on localhost:3100 — `/portfolio` → `302 /login?callbackUrl=%2Fportfolio`; the nav link on
`/market` reads `href="/login?callbackUrl=%2Fmarket"`; the login page has the home link and no
password input. `npx next build` passes.

### Nav: stop hiding the "Sign in" link in cloud mode

Reverted the 2026-07-25 decision that rendered the sign-in link only when `appMode() !== "cloud"`.
It meant the owner had to type `/login` by hand on the server before any owner-only menu appeared —
real friction for the one person the site is built for. Access control is `ALLOWED_EMAILS` plus the
middleware guard; hiding the button was never the thing enforcing it.
[app/Nav.tsx](../../app/Nav.tsx)
