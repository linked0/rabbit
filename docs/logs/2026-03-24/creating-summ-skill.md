# Creating the /summ Skill (2026-03-24)

> **Category**: Feature
>
> Built a custom Claude Code skill that automatically generates structured HTML task summaries with daily logs, knowledge cards, and English idioms — committed and pushed to the task repo.

---

## What was done

- Created a new Claude Code skill at `~/.claude/skills/summ/SKILL.md` using the skill framework's frontmatter format (name, description, type metadata)
- Defined the skill trigger patterns: `/summ`, "summarize my work", "log what I did", "save task summary", and casual phrases like "wrap up" or "done for the day"
- Designed a two-file output system: a per-task detail HTML file (`docs/YYYY-MM-DD/task-slug.html`) and a master index page (`docs/know-summary.html`)
- Specified Apple-inspired design guidelines: SF Pro font stack, `#f5f5f7` background, white cards with `border-radius: 16px`, colored badge pills per category
- Defined 7 task categories with color mappings: bug-fix (red), feature (green), learning (blue), technique (purple), refactor (amber), config (gray), research (blue)
- Added an "English Idiom of the Day" section to each summary for language learning purposes
- Built auto-commit and push logic into the skill workflow targeting `/Users/jay/work/task` repo

## Techniques & Learnings

- **Claude Code Skill Structure**: Skills live in `~/.claude/skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`) followed by markdown instructions. The description field controls when the skill triggers.
- **Skill Triggering**: The description acts as the matching criteria — writing comprehensive trigger phrases (slash commands, natural language variations, casual synonyms) improves activation accuracy.
- **Self-contained HTML**: Using inline styles with no external dependencies ensures summary pages render correctly when opened directly in a browser, without needing a web server or build step.
- **Folder Structure**:

```
~/.claude/
  skills/
    summ/
      SKILL.md          # Skill definition with frontmatter + instructions

/Users/jay/work/task/
  docs/
    know-summary.html   # Master index page (all summaries)
    2026-03-24/
      task-slug.html    # Individual task detail page
```

## Idiom of the Day

> *"Build the ship while sailing it"* — to create or improve something while it's already in use, iterating as you go rather than waiting for perfection.

**In context**: We decided to build the ship while sailing it — launching the /summ skill with its core features and refining the design as we use it in real sessions.

---

[← Back to Daily Log Summary](../summary.md)
