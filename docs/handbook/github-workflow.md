# GitHub Workflow

How we branch, commit, review, and merge. (Mirrors the conventions in the repos'
`CLAUDE.md` files.)

## Branching
- **One feature branch per request:** `git switch -c <name>/<short-topic>`
  (e.g. `claude/fix-login-redirect`). Reuse that branch for follow-ups on the same
  request — don't spin up a new branch per comment.
- **Never commit to `main` directly.** (Exception: the `task` sandbox repo allows working
  on the current branch when explicitly chosen.)

## Issues & branches
After planning, break the work into features and file each as an **issue** in your tracker
(GitHub Issues or Jira) — this is the project-management view of the plan.

- **One issue → one branch → one PR.** Each unit of work stays isolated and reviewable.
- A **coding agent** can take a single issue and implement it on its own branch, then open a
  PR — so issue, branch, and PR map one-to-one.
- **Link them:** reference the issue in the branch/PR and close it from the PR body
  (e.g. `Closes #123`) so tracking updates automatically.

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
