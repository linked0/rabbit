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

## Open questions
- OSS model on Cloud Run (cheap, slower) or a dedicated VM (faster, costlier)?
- Persist the user's provider choice (per session / per account)?

## Features
- [ ] **Provider selector**
  - [ ] Add a selector to the chat UI → `/api/chat`
  - [ ] Route by the selected provider in `lib/ai.ts`
- [ ] **OSS model on GCP**
  - [ ] (you) Choose the model (Qwen2.5-0.5B / Llama-3.2-1B)
  - [ ] Containerize Ollama + model; deploy to Cloud Run
  - [ ] Point the "Local LLM" option at the service URL (env var)
  - [ ] Document the install/prepare steps
