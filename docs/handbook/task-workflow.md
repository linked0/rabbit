# Task-Driven Workflow (tasks/ → plan → build → history/)

How a piece of work flows from a written task to a recorded result, using two folders in
each repo's `docs/`:

- **`docs/tasks/`** — the **intent**: task descriptions you write, plus the plans the AI
  produces from them.
- **`docs/history/`** — the **record**: dated summaries of what was actually done.

## The flow
- **Task** — you create `docs/tasks/<topic>.md` describing the goal and any constraints
  (rough is fine — it's the starting point).
- **Plan** — ask the AI to design a plan from that task file: approach, files to touch, and
  open questions to confirm before building (e.g. `docs/tasks/<topic>-plan.md`).
- **Build** — approve or adjust the plan, then ask the AI to implement it.
- **History** — the AI summarizes what changed into a dated file in `docs/history/`
  (`YYYY-MM-DD.md`, or `YYYY-MM-DD-<topic>.md`) — one titled block per action, appended.

## Why two folders
- **tasks/** answers *what we want and how we'll do it* (intent + plan).
- **history/** answers *what we actually did* (the record, for future reference).

## The wider `docs/` layout
`tasks/` and `history/` are the core of the cycle; add the rest **only as you need them**
(keep it light):

- **`docs/tasks/`** — per-work-item task descriptions + the plans produced from them *(transient)*.
- **`docs/history/`** — dated records of what was done, `YYYY-MM-DD.md` *(transient log)*.
- **`docs/features/`** (or a single `features.md`) — the feature catalog: what the service
  provides *(durable, product-level)*.
- **`docs/plan/`** — roadmap / phase sequencing — the big-picture "what's next".
- **`docs/architecture/`** — system-design overviews + ADRs (decision records).
- **`docs/analysis/`** — research / investigation notes (evaluating a library, protocol, etc.).
- **`docs/handbook/`** — team conventions and guides (this folder).

**Rule of thumb:** *transient* (per work item) → `tasks/` + `history/`; *durable*
(product/design) → `features/`, `plan/`, `architecture/`.

## Worked example (this repo)
- Task: `docs/tasks/Jun-16-tasks.md`
- Plan: `docs/tasks/Jun-16-plan.md`
- Result: `docs/history/2026-06-17-icon-game-and-google-login-fix.md`
