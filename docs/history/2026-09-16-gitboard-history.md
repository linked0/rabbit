# 2026-09-16 — gitboard

Source: jay's requests in chat (no task/design doc). Repo: `~/work/gitboard`, served by launchd `com.jay.gitboard` on :4321.

### Services: add the Game dev server (:3050)

- **Cause:** jay: "I want also game service run and show it on gitboard". The Services section (added earlier today by another session) listed seven dev servers plus Anvil, but not jayverse-game.
- **Reasoning:** the game's dev server is `next dev -p 3050` (`package.json`), so the port is the identity, same as the other entries. Rabbit's `lib/jayverse.ts` keeps the game as a same-origin `/game` iframe with no `localPort`, so no change there — the gitboard entry says "also embedded at Rabbit /game" to make that relationship visible.
- **Change:** one line in `server.mjs` `SERVICES`: `{ key: 'game', name: 'Game', port: 3050, repo: 'jayverse-game', blurb: '3D street — Three.js, also embedded at Rabbit /game' }`, placed between Wallet and Number. Branch `claude/game-service`, merged to main as 7ecb6ca.
- **Result:** gitboard restarted with `launchctl kickstart -k`; `/api/services` reports game :3050 UP (HTTP 200). The game server itself was already running as `pnpm dev` (pid 14105, started 16:39 KST from `~/work/jayverse-game`); it is a hand-started dev server, not a launchd service, so it will not survive a reboot.

### Services: "open" links use the Tailscale address, not 127.0.0.1

- **Cause:** jay (screenshot of the Services grid): "for this links, don't use 127.0.0.1. instead tailscale ip like 100.111.162.0". gitboard is read from the phone and the home desktop, where a 127.0.0.1 link points at the wrong machine.
- **Reasoning:** probing must stay on 127.0.0.1 (that is where the servers are); only the link host changes. Rather than hard-code the address, `linkHost()` picks the IPv4 on the interface in Tailscale's CGNAT block 100.64.0.0/10 (utun8 → 100.111.162.0 here), with `GITBOARD_HOST` as override and 127.0.0.1 as fallback when Tailscale is off. Considered using the browser's own hostname client-side, but jay wants the Tailscale links even when reading from the Mac.
- **Change:** `server.mjs`: import `networkInterfaces`, add `linkHost()`, `open: http://${host}:${port}`, `host` in the JSON; README env table gains `GITBOARD_HOST`. Same commit as the Game card (7ecb6ca on main, pushed); gitboard restarted with `launchctl kickstart -k`.
- **Result:** `/api/services` reports `host: 100.111.162.0`; every card links there. Verified `http://100.111.162.0:3050/` answers 200. Caveat: Anvil (pid 36293) is bound to 127.0.0.1, so its Tailscale link is refused until anvil is restarted with `--host 0.0.0.0` (jay's call, per the Chains brief); any other dev server bound to loopback only will behave the same.

### Start the five stopped dev servers

- **Cause:** jay: "run the unrun services" after the Services grid showed 5/10 up.
- **Reasoning:** each is a plain `pnpm dev` (rabbit :3100, verex web :3000, token app :3070, wallet :3060, number :3090). Verex's root `turbo run dev` (pid 61497, since 13:27) was already running api/sdk/cli but not web, so web was started on its own from `packages/web` rather than restarting turbo. Started with `nohup … &`, logs in `~/Library/Logs/jayverse/<name>.log`, so nothing lands in the repos.
- **Change:** no code. Five background processes; not launchd, so they end with a reboot.
- **Result:** gitboard reports 10/10 up; all five answer on the Tailscale address (wallet's 307 is its normal redirect). Anvil remains the only card whose Tailscale link is refused (bound to 127.0.0.1).
