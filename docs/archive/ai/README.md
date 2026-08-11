# AI Development Playground

A collection of small, self-contained experiments for learning the building blocks of LLM applications — agentic retrieval, tokenization, embeddings, and local model inference. Most examples use **Verex / Nostra** (a prediction-market platform) as the running domain example.

## What's Here

| Path | Topic | Stack |
|------|-------|-------|
| `agentic_rag.ipynb` | Agentic RAG: an agent that *decides* when to retrieve, refines queries, and self-reflects | LangChain, LangGraph, Chroma, OpenAI |
| `tokenizer-embedding/` | How an LLM "reads" text — BPE tokenization, embeddings, cosine similarity | tiktoken, Ollama (`nomic-embed-text`) |
| `mlx-study/` | Running a 70B model fully locally on Apple Silicon | MLX (`mlx-lm`) |
| `quantization/` | Quantization: Q4/Q8/FP16 trade-offs, GGUF vs MLX, tok/s benchmarking | Ollama, MLX |
| `prompt-engineering/` | Prompt structure for a local auditor — system prompt, few-shot, CoT, XML tags | Ollama (`llama3.1:70b`) |
| `main.py` | Placeholder entry point | — |

Each sub-project is independent. The root project (`pyproject.toml` / `uv.lock`) drives the notebook.

---

## 1. Agentic RAG (`agentic_rag.ipynb`)

Demonstrates an **Agentic RAG** system. Unlike classic RAG (retrieve → generate), the agent can decide whether to retrieve, refine its search query, and synthesize across steps.

What the notebook builds, step by step:
1. **Vector store** — an in-memory Chroma store seeded with dummy "Nostra" documents, embedded via `OpenAIEmbeddings`.
2. **Search tool** — wraps the retriever as a LangChain `Tool` the agent can call.
3. **ReAct agent** — built with LangGraph's `create_agent` over `gpt-4o-mini`.
4. **Queries & trace** — streams the agent's reasoning so you can see it decide to search, read context, and answer.
5. **Reflection pass** — a second model reviews the answer for factual accuracy before it is surfaced.

It also contrasts **Reflection** vs **Reflexion** vs **Agentic RAG** in the opening markdown, with guidance on when to use each.

### Setup

```bash
cd /Users/jay/work/task/ai
uv sync                      # installs langchain, langgraph, chromadb, etc.

export OPENAI_API_KEY=sk-... # required — the notebook calls OpenAI for embeddings + chat

uv run jupyter lab           # then open agentic_rag.ipynb
```

> Requires Python ≥ 3.12. The notebook reads `OPENAI_API_KEY` from the environment or a `.env` file (`python-dotenv`).

---

## 2. Tokenizer & Embedding Explorer (`tokenizer-embedding/`)

A near-stdlib script (plus `tiktoken`) that probes how text becomes tokens and vectors:
- **Tokenization** with `tiktoken` (`cl100k_base`) — shows why Korean and Ethereum addresses cost more tokens than English.
- **Embeddings** via Ollama's `nomic-embed-text` (768-dim, local).
- **Cosine similarity** to measure semantic closeness between phrases.

### Setup

```bash
# Prerequisites: uv + Ollama installed and running
ollama pull nomic-embed-text
curl http://localhost:11434          # should say "Ollama is running"

cd /Users/jay/work/task/ai/tokenizer-embedding
uv sync
uv run python main.py
```

See `tokenizer-embedding/README.md` for the full theory write-up (BPE, vector space, similarity thresholds) and the Verex RAG connection.

---

## 3. MLX Local Inference (`mlx-study/`)

`audit_reentrancy.py` loads a 4-bit quantized **Llama-3.3-70B-Instruct** with `mlx-lm` and runs it as a DeFi smart-contract security auditor — entirely on-device (Apple Silicon), no API key, no network.

### Setup

```bash
cd /Users/jay/work/task/ai/mlx-study
uv add mlx-lm                 # or: pip install mlx-lm
uv run python audit_reentrancy.py
```

> First run downloads the model (large — the 4-bit 70B needs significant disk and RAM). Later runs use the local cache. `verbose=True` prints tokens/sec.

---

## Setting Up AI Development From Scratch

Common toolchain across all three projects:

1. **Python & uv** — every project pins Python via `.python-version` and manages deps with [`uv`](https://docs.astral.sh/uv/). `uv sync` creates the venv and installs locked dependencies; `uv add <pkg>` adds a new one.
2. **Cloud path (OpenAI)** — for the agentic RAG notebook, set `OPENAI_API_KEY`. Strongest capability; costs tokens.
3. **Local path (Ollama / MLX)** — for tokenizer-embedding and mlx-study, run models on-device. Free and private; needs disk + RAM.
4. **Pick per task** — cloud models for the strongest reasoning (agent + reflection); local models for embeddings and offline experiments.

### Quick start

```bash
# 1. Install uv (if needed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Cloud experiments (notebook)
cd /Users/jay/work/task/ai && uv sync && export OPENAI_API_KEY=sk-...

# 3. Local experiments
brew install ollama && ollama serve            # separate terminal
ollama pull nomic-embed-text
```
