# Workflow

How work flows from an idea to a shipped, recorded result — two linked processes:
**designing features** (breaking a project into categories and features), then the
**task cycle** (building each one and recording what was done).

## 1. Designing features (Category → Feature → To-do)
Start from a features list (e.g. `docs/tasks/<date>-features.md` describing what to build),
then turn it into design drafts under `docs/features/`:

- **Decide the categories.** Each major area of the project becomes a **category** — one md
  file in `docs/features/` (e.g. Game, AI Chat, Portfolio & Market). A `README.md` indexes them.
- **Brainstorm features per category.** In each category file: capture the design (current →
  proposed), open questions, then a **Features** list — each feature a bold item with its own
  nested **to-do** items, tagged `(you)` where a human decision or action is needed.
- **Review, then build.** These are drafts — refine them, then implement via the task cycle below.

Hierarchy: **Category** (file) → **Feature** (bold item) → **to-do** (checkbox).

## 2. The task cycle (tasks/ → plan → build → history)
How a single piece of work flows from a written task to a recorded result, using two folders:

- **`docs/tasks/`** — the **intent**: task descriptions you write, plus the plans produced from them.
- **`docs/history/`** — the **record**: dated summaries of what was actually done.

The cycle:
- **Task** — create `docs/tasks/<topic>.md` describing the goal and any constraints (rough is fine).
- **Plan** — ask the AI to design a plan from it: approach, files to touch, open questions.
- **Build** — approve or adjust the plan, then ask the AI to implement it.
- **History** — the AI summarizes what changed into a dated file in `docs/history/`
  (`YYYY-MM-DD.md`), one titled block per action, appended.

## Why two folders
- **tasks/** answers *what we want and how we'll do it* (intent + plan).
- **history/** answers *what we actually did* (the record).

## The `docs/` layout (keep it simple — features-first)
Lead with **`features/`** and add the rest **only as you need them**. Don't keep a separate
`plan/` folder — fold the roadmap into `features/README.md` (a status table), so there's one
home for "what we're building."

- **`docs/features/`** — what we're building: Category → Feature → to-do. Its `README.md` also
  holds the **roadmap / status** (no separate `plan/` folder).
- **`docs/history/`** — what we did: dated records *(transient log)*.
- **`docs/tasks/`** *(optional)* — per-work-item task + plan *(transient)*.
- **`docs/architecture/`** *(optional)* — ADRs, only for big, hard-to-reverse decisions.

**Rule of thumb:** **one folder per distinct purpose** — if two folders overlap, merge them
(e.g. `plan/` overlaps `features/`, so fold it in). Keep the structure flat and small.

## Worked example (this repo)
- **Design:** `docs/features/` — categories (Game, AI Chat, Portfolio & Market, …), each with features + to-dos.
- **Cycle:** `docs/tasks/Jun-16-tasks.md` (task) → `docs/tasks/Jun-16-plan.md` (plan) →
  `docs/history/2026-06-17-icon-game-and-google-login-fix.md` (result).
