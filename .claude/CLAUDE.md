# task

A workspace under `~/work/task/` used for tracking work traces, ad-hoc notes, and exercising Claude Code / Cowork features.

## Layout

- `docs/trace/YYYY-MM-DD/` — dated notes capturing what was tested or learned that day.
- `examples/` — sample artifacts referenced from notes.
- `.claude/` — Claude Code configuration for this repo. Live worktrees under `.claude/worktrees/` are gitignored.

## Conventions

- **Branching (this repo only).** Do not create a new branch for code changes unless jay explicitly asks for one — work on the current branch. This applies only to the task repo; other repos keep the default of creating a `claude/<topic>` feature branch.
- New trace notes go under `docs/trace/<today>/notes.md`. Keep entries short — one or two sentences per topic is enough.
- Commits should explain the *why* of the entry (what was being tested or verified), not just restate the filename.

## Autonomous after-hours workflow (jay)

When jay asks for code changes and may be away (can't answer permission prompts in real time):

1. **Never commit directly to `main`.** First create a feature branch:
   `git switch -c claude/<short-topic>` (e.g. `claude/fix-login-redirect`).
2. Do the work and commit on that branch with clear, *why*-focused messages.
3. Push the branch and open a PR for review:
   `git push -u origin claude/<short-topic>` then `gh pr create --fill --base main`.
4. **Do not merge to `main` yourself** — leave the PR for jay to review and merge later.
5. Destructive commands (force-push, `reset --hard`, `clean`, `branch -D`, `rm`) still
   prompt by design — leave those for jay rather than working around them.

When done, summarize what changed and include the PR link.
