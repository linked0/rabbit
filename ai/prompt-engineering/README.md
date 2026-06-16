# Prompt Engineering for a Local-LLM Auditor (Day 7/50)

On a local LLM (Ollama 70B on the M5), **half of output quality comes from prompt
structure**, not the model weights. This sub-project shows the four core techniques
on one task: a first-pass Solidity security screen.

| # | Technique | What it does here |
|---|-----------|-------------------|
| 1 | **System prompt** | Fixes the role (precise auditor) and hard rules (cite the line, strict XML, don't invent findings). |
| 2 | **Few-shot** | One *safe* function → `severity=none`. Teaches the output **format**, including the "no vulnerability" case. |
| 3 | **Chain-of-thought** | Ask for a reasoning step before the verdict so the model thinks, then commits. |
| 4 | **XML tags** | `<contract>` delimits input, `<finding>` defines the output schema — Claude-family and Llama both parse this cleanly. |

## The exercise

> Add one few-shot example (a safe function → "no finding") so the model answers
> "no vulnerability" in the **same XML format**.

This is implemented in [`audit_prompt.py`](audit_prompt.py): the `deposit()` exemplar
is primed as a `user`/`assistant` message pair before the real question. Without it,
a 70B local model tends to **hallucinate a finding for clean code** just to fill the
`<finding>` schema. The exemplar shows that `severity=none` with an empty `<line/>` is
a legal answer, which cuts false positives.

The script runs the auditor twice:
- vulnerable `withdraw()` → expects a **reentrancy** finding (state updated *after*
  the external `call`),
- safe `balanceOf()` view → expects **`severity=none`**.

## Run

This folder is its **own** uv project (it has its own `pyproject.toml`), so `uv run`
installs `ollama` into a local `.venv` here — not the parent `ai/` project.

```bash
# Prerequisites: Ollama running + the model pulled
ollama pull llama3.1:70b
curl http://localhost:11434          # should say "Ollama is running"

cd /Users/jay/work/task/ai/prompt-engineering
uv sync                              # creates .venv with the `ollama` package
uv run python audit_prompt.py
```

## Troubleshooting

**`ModuleNotFoundError: No module named 'ollama'`**

Cause: `uv run` uses the *nearest* `pyproject.toml` walking up the tree. If this
folder has no `pyproject.toml`, `uv` falls back to the parent `ai/` project (which
doesn't list `ollama`) and creates `ai/.venv` instead — so the import fails.

Fix: this folder now ships its own `pyproject.toml` with `ollama` as a dependency.
Run `uv sync` *inside* `prompt-engineering/`, then `uv run python audit_prompt.py`.
(You can delete the stray `ai/.venv` that the first failed run created — it isn't used.)

**`ConnectionError` / connection refused** — the Ollama server isn't running.
Start it (`ollama serve`) and confirm with `curl http://localhost:11434`.

**Model pull is slow / runs out of memory** — `llama3.1:70b` is large. Swap `MODEL`
in `audit_prompt.py` for a smaller local model (e.g. `llama3.1:8b`) to test the
prompt structure; the four techniques work the same, just with weaker reasoning.

## Verex / Nostra connection

This is the exact structure for a **first-pass** screen of Verex contract
self-audits on a local model: fix the audit rules in the system prompt, delimit the
input contract and output schema with XML, and use few-shot to keep false positives
down. High-risk final confirmation still goes to **Opus 4.8** — the local pass is
triage, not the verdict.
