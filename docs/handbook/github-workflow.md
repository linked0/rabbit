# GitHub Workflow

How we branch, commit, review, and merge. (Mirrors the conventions in the repos'
`CLAUDE.md` files.)

## Branching
- **One feature branch per request:** `git switch -c <name>/<short-topic>`
  (e.g. `claude/fix-login-redirect`). Reuse that branch for follow-ups on the same
  request — don't spin up a new branch per comment.
- **Never commit to `main` directly.** (Exception: the `task` sandbox repo allows working
  on the current branch when explicitly chosen.)

## Commits
- Explain the **why** of the change, not just the filename. Imperative subject line.
- Keep each commit a coherent, single logical change where practical.

## Pull requests
- Open a PR against `main` with a short **what / why / verified** body.
- Keep PRs small and reviewable.
- Don't merge a PR until it's reviewed (solo: self-review the diff first).

## Reviews
- Review for **correctness, security, and clarity** — not style (tooling handles style).
- Leave specific, actionable comments.

## CI
- A PR should pass **build + tests + lint** before merge.
