# Documenting an Idea (brainstorm → formal doc)

Match the tool to the **stage**, and let the idea get **more formal as it gets more
certain**. Don't write a polished repo doc for a half-formed thought, and don't leave a
finalized spec trapped in a notebook where nobody finds it.

```
1. CAPTURE        2. EXPLORE          3. DRAFT             4. FORMALIZE
(seconds)         (messy, visual)     (prose, feedback)    (durable, versioned)
notebook /    →   FigJam /        →   Notion /         →   markdown in repo
quick note        whiteboard          Google Docs          (docs/, ADRs)
```

| Stage | Goal | Tool | Why |
|---|---|---|---|
| **1. Capture** | don't lose the thought | notebook / Notes / scratch `.md` | fastest, zero friction |
| **2. Explore** | brainstorm, connect, diagram | FigJam (or Miro) | visual/spatial thinking, flows |
| **3. Draft** | structure into prose, get feedback | Notion / Google Docs | comments, sharing, revision |
| **4. Formalize** | the agreed spec, versioned | markdown in the repo | next to code, PR-reviewed, discoverable |

## Principles
- **Capture first, choose tools later** — friction is the enemy at the start.
- **Friction low → structure high** as the idea matures.
- **Rule of thumb:** visual/spatial → FigJam; prose you want comments on → Notion/Docs;
  final and tied to code → repo markdown.
- The **source of truth** ends in the repo (`docs/tasks/`, `docs/architecture/` ADRs).
