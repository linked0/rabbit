# task

A workspace under `~/work/task/` used for tracking work traces, ad-hoc notes, and exercising Claude Code / Cowork features.

## Layout

- `docs/trace/YYYY-MM-DD/` — dated notes capturing what was tested or learned that day.
- `examples/` — sample artifacts referenced from notes.
- `.claude/` — Claude Code configuration for this repo. Live worktrees under `.claude/worktrees/` are gitignored.

## Conventions

- New trace notes go under `docs/trace/<today>/notes.md`. Keep entries short — one or two sentences per topic is enough.
- Commits should explain the *why* of the entry (what was being tested or verified), not just restate the filename.
