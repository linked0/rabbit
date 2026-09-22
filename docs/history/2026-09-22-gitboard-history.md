# 2026-09-22 · gitboard

Source: no task or design doc — a one-line request from jay while working on alice's local sign-in
(see [2026-09-22-dev-notes-history.md](2026-09-22-dev-notes-history.md), "Sign-in failed locally").

### Alice's preview server joins the Services row, pinned to localhost

- **Cause:** jay, after alice gained `scripts/serve.sh` on port 4173: "add 4173 to the gitboard also".
- **Reasoning:** adding the row is trivial, but copying the existing pattern would have shipped the
  very bug the morning was spent fixing. Every other service's **open** link uses the Tailscale
  address, deliberately, so the dashboard works from jay's phone. Alice cannot: the page signs in to
  Firebase, Firebase refuses any origin not on its authorized list, and a 100.x address is not on it
  — clicking **open** would land on `auth/unauthorized-domain` again. Nothing is lost by pinning it,
  because this server only ever runs on the Mac, and from the phone jay has alice.jaylabs.xyz, which
  is authorized. So rather than special-casing alice in `services()`, a service may now declare
  `openHost`; the rule stays general and alice is simply the first to need it.
- **Change:** `openHost` honoured when building the **open** link in `services()`, an `alice` entry
  at 4173 that sets it to `localhost`, and a README note under `GITBOARD_HOST` saying why. Probing is
  untouched — it always goes to 127.0.0.1, which is where the server actually is.
- **Result:** verified against a scratch instance on 4399 rather than by restarting jay's launchd
  one: `alice port=4173 state=up open=http://localhost:4173` while `defi` and `gitboard` keep
  `http://100.111.162.0:…`. "down" on this row means the preview is not being served, which is its
  normal state.

### Service cards sort by name, and the chain is renamed to sort with them

- **Cause:** jay, looking at the row with alice newly added: "It should sort alphabetically", and "Not Local Anvil — Anvil - Local".
- **Reasoning:** the two are one request. Sorting by name only helps if the names are the ones you would look under, and "Local Anvil" files the chain under L, away from everything. Renaming it puts it where the eye goes. The sort belongs in `services()`, not in a reordered `SERVICES` array: that array is grouped editorially and its comments explain why each entry sits where it does — the anvil entry carries a paragraph about being probed as a chain rather than a web page. Sorting the output keeps both the comments and a scannable list. `localeCompare` rather than `<`, so neither capitalisation nor the em dash decides the order: `gitboard` lands between Game and Number, where you would look for it, instead of after every capitalised name.
- **Change:** `byName` comparator applied to both the local and remote lists in `services()`; `Local Anvil` → `Anvil — Local`, with the repo's existing em dash rather than the hyphen jay typed, to match `DeFi — jeETH`.
- **Result:** Alice notes, Anvil — Local, DeFi — jeETH, Game, gitboard, Number, Rabbit, Token/Exchange, Verex API, Verex web, Wallet. Verified on a scratch instance on 4399 before touching the launchd one.
