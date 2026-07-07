# 2026-07-07 — rabbit history

> Source: no task/design/draft file — this was a direct git-maintenance request from jay.

### Git: commit staged docs to main and push (+ stale lock cleanup)

Committed the staged changes (`docs/history/2026-07-06-verex-history.md` + its card in
`docs/know.html`) directly to `main` at jay's explicit request, then pushed 3 commits
(2 previously unpushed + this one) to origin.

Gotcha: three stale git lock files (`index.lock`, `HEAD.lock`, `objects/maintenance.lock`,
dated Jul 2–7 00:02–00:03) blocked the commit — all created around midnight, likely by a
crashed scheduled git maintenance job. Verified no git process was running before removing them.
