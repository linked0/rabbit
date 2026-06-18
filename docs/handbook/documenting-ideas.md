# Documenting an Idea (AI-assisted)

For a solo, AI-assisted workflow the documentation pipeline collapses: the **conversation
with the AI** is the capture + brainstorm + draft stages all at once, and the **repo
markdown** is both the draft and the formal doc. You don't need a separate notebook,
whiteboard, or Notion — you describe the idea, the AI drafts it straight to markdown, you
refine and commit.

```
1. IDEA            2. DESCRIBE             3. DRAFT                4. REVIEW & COMMIT
(in your head)     (a request to the AI)   (AI → markdown in repo) (refine, then commit)
        →                  →                        →                      →
"the raw thought"  "think out loud"        docs/ … .md             formal, versioned
```

## Principles
- **The chat is your brainstorm surface** — think out loud in a request; the AI structures it.
- **Iterate in place** — the repo markdown is the draft *and* the final doc; refine it where
  it lives, then commit.
- **The repo is the source of truth** (`docs/tasks/`, `docs/architecture/` ADRs).

## Optional asides
- **Diagrams** — when an idea is visual (architecture, flows), ask the AI to generate a
  **Mermaid** diagram inside the markdown, or sketch it in FigJam. A picture still beats prose
  sometimes.
- **Capture when away from the AI** — if an idea strikes and you're not at the keyboard, jot it
  anywhere so it survives; describe it to the AI later.
