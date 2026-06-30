# AI Chat

**Goal:** let the user pick the LLM backend (Local vs OpenAI etc.), and ship a tiny
open-source model that runs cheaply on GCP.

## Current
`lib/ai.ts` already abstracts Ollama (local) vs OpenAI (cloud), but the choice is fixed by
`APP_MODE` — not user-selectable.

## Proposed
- A **provider selector** in the chat UI (dropdown: Local LLM / OpenAI / …), sent to `/api/chat`.
  Keep `lib/ai.ts` as the abstraction; route by the selected provider at request time.

## Smallest OSS model (recommendation)
- Candidates: **Qwen2.5-0.5B-Instruct**, **Llama-3.2-1B**, Gemma-2-2B, TinyLlama-1.1B.
  → Suggest **Qwen2.5-0.5B-Instruct** (very small, capable) or Llama-3.2-1B.

## Running it on GCP (plan)
1. Package **Ollama** (or llama.cpp) + the model into a container.
2. Deploy to **Cloud Run** (CPU is fine for 0.5–1B; raise memory + request timeout), or a small
   GPU VM if latency matters.
3. Point the app's "Local LLM" option at that service URL (env var).
4. Document the steps: `ollama pull qwen2.5:0.5b`, the Dockerfile, and the Cloud Run flags.

## Cost & resource requirements (running the local LLM)

> Numbers are approximate (~Q4 quantized) and hardware-dependent — use as ballpark.

### Resource needs by model size (Ollama)
| Model | Disk (download) | Min RAM / VRAM | CPU-only? | Rough speed |
|-------|-----------------|----------------|-----------|-------------|
| Qwen2.5-0.5B | ~0.4 GB | ~1 GB | ✅ fast | tens of tok/s on CPU |
| Llama-3.2-1B | ~0.8–1.3 GB | ~1.5 GB | ✅ | snappy on CPU |
| Gemma-2-2B / Qwen2.5-3B | ~1.6–2 GB | ~3–4 GB | ✅ slower | ok on CPU |
| Llama-3.1-8B / Qwen2.5-7B | ~4.5–5 GB | ~6–8 GB | ⚠️ slow on CPU → GPU | fast on GPU |
| 14B | ~9 GB | ~12 GB | GPU recommended | |
| 70B | ~40–43 GB | ~48 GB+ unified/VRAM | GPU / big unified mem | |

Rule of thumb: **RAM ≥ model size + ~1–2 GB** overhead (plus context). On Apple Silicon the
GPU shares unified memory, so total RAM is the limit.

### Where it runs — cost
| Option | Cost model | Notes |
|--------|-----------|-------|
| **Local — your machine** (Apple Silicon, unified mem) | **$0 marginal** (hardware owned; electricity negligible) | Private, no rate limits. M-series with enough RAM runs 7–8B snappily; large unified mem runs up to 70B. Best for dev + heavy use. |
| **Small OSS on Cloud Run (CPU)** | pay per request (vCPU + memory time); **~pennies when idle if scale-to-zero** | 0.5–1B works CPU-only: ~2 GB memory, raise request timeout. `min-instances=0` → cheap but **cold start** reloads the model (seconds). `min-instances=1` → always-warm but billed continuously. |
| **Cloud Run + GPU (NVIDIA L4)** | higher hourly cost | Only if you need bigger models / low latency in cloud. |
| **Cloud API (OpenAI `gpt-4o-mini`)** | per token (~$0.15 / $0.60 per 1M in/out) | **Zero infra to run.** For a single low-volume user, the bill is often pennies/month. |

### Recommendation for Rabbit (single user, low volume)
- **Local mode:** Ollama on your machine — free, fast, private. No change needed.
- **Cloud mode:** two honest choices —
  1. **Qwen2.5-0.5B on Cloud Run (CPU, scale-to-zero)** — cheapest infra, matches the
     feature's "tiny OSS model on GCP" goal, but cold-start latency + you maintain it.
  2. **`gpt-4o-mini` API** — no infra to run or patch; for one user the cost is negligible.
- For a **single user**, option 2 is often the simplest/cheapest; pick option 1 if running
  your own OSS model on GCP is itself a goal (it is, per this doc).

## MCP tool-calling (this project's own MCP)
Give the chat agent a tool: **call an MCP server that this project builds**. The integration itself
is the feature; **what the MCP exposes is not decided yet (TBD)** — settle its content/tools in a
later step. (Needs a provider that supports tool/function calling, or route MCP calls through the
app's `/api/chat`.)

## Open questions
- OSS model on Cloud Run (cheap, slower) or a dedicated VM (faster, costlier)?
- Persist the user's provider choice (per session / per account)?
- Cloud mode: ship the OSS model on Cloud Run, or just call `gpt-4o-mini` (no infra)?
- What does our own MCP expose? (tools / content — **undecided**)

## Features
- [ ] **Provider selector**
  - [ ] Add a selector to the chat UI → `/api/chat`
  - [ ] Route by the selected provider in `lib/ai.ts`
- [ ] **OSS model on GCP**
  - [ ] (you) Choose the model (Qwen2.5-0.5B / Llama-3.2-1B)
  - [ ] Containerize Ollama + model; deploy to Cloud Run
  - [ ] Point the "Local LLM" option at the service URL (env var)
  - [ ] Document the install/prepare steps
- [ ] **Call this project's own MCP**
  - [ ] (you) Decide what the MCP exposes (tools / content — TBD)
  - [ ] Build the MCP server
  - [ ] Wire the chat agent's tool-calling loop to it
