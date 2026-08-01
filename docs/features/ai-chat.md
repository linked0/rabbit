# AI Chat

**Goal:** let the user pick the LLM backend (Local vs OpenAI etc.), and ship a tiny
open-source model that runs cheaply on GCP.

## Ask about me (RAG) — ✅ implemented

**Goal:** a visitor — possibly a potential **employer or client** — can open the AI Chat and
ask about **Hyunjae Lee** ("What does he do?", "Tell me about the prediction market project",
"How do I contact him?") and get **factual, grounded** answers instead of a hallucinated résumé.

**Approach — RAG, not fine-tuning.** Fine-tuning a model on the bio would be expensive, slow to
update (retrain on every résumé edit), and prone to inventing facts; there is no training pipeline
in the repo. RAG **retrieves** the relevant profile/project text and **augments** the prompt, so
answers stay current and accurate, and updating the bio is just editing content. (Decision logged in
[2026-07-25 history](../history/2026-07-25-rabbit-history.md); roadmap home:
[jun-30 design §5b](../tasks/current-plan.md#s5b).)

**How it works**
- **Corpus** — built from `lib/home-content.ts` (`PROFILE` + all `PROJECTS`, EN/KO), plus, when
  available, the bodies of `content/profile/*.md`. Backbone comes from the imported module so it is
  always in the Next **standalone** bundle; the markdown adds depth.
- **Retrieval** (`lib/about-me.ts` → `retrieve()`) — lexical keyword-overlap scoring returns the
  top-K chunks for the visitor's question; the `profile` chunk (name + contact) is always included.
  Zero new dependencies; works in both local (Ollama) and cloud (OpenAI/Anthropic) modes.
- **Augment** (`buildAboutMeSystemMessage()`) — injects a persona system message ("answer only from
  the context, don't invent facts, reply in the question's language") + the retrieved context.
- **Wiring** — `POST /api/chat` accepts an `aboutMe: true` flag (parallel to the existing `mcp`
  flag) and prepends the grounded system message. The two modes compose.
- **UI** — a `👤 About Hyunjae` toggle in `app/chat/ChatClient.tsx`, next to the 🍝 Spaghetti MCP
  toggle, with example prompts shown when on.

**Deploy note.** `content/` is **not** copied into the Cloud Run image (the Dockerfile ships only
`.next/standalone` + `.next/static` + `public`), so the `.md` depth is **local-dev only** by
default — in the cloud the feature still works from the structured `home-content.ts` corpus. To get
the full markdown depth in the cloud, add one line to the `Dockerfile` runner stage:
`COPY --from=builder /app/content ./content`.

**Upgrade path.** Swap the lexical `retrieve()` for an embedding search (e.g. OpenAI embeddings +
a small vector index) without touching the route or the UI — same `Chunk` interface.

**⚠️ Access/gating — couples with auth + LLM gating** ([jun-30 design §2](../tasks/current-plan.md#s2)
↔ [§5b](../tasks/current-plan.md#s5b)). This mode is meant
for **keyless, logged-out visitors** (employers/clients), but today general chat is BYO-API-key, the
server-stored key is gated to jay's email, and `/chat` + `/api/chat` require login. So the current
build only serves a **logged-in** user with a key configured. To make it truly public it needs a
**server-keyed, rate-/budget-capped path scoped to the About-me prompt, exposed without login** —
tracked in [jun-30 design §2 "Public About me path"](../tasks/current-plan.md#s2). Decision pending from jay.

**Follow-ups**
- [ ] Optional: embedding-based retrieval for larger corpora.
- [ ] Optional: ship `content/` to the cloud image for full `.md` depth (one-line Dockerfile change).
- [ ] Optional: suggested-question chips in the UI when `About Hyunjae` is on.

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

### Self-hosting on GCP — instance sizing & cost (added 2026-07-25)

**The instance is driven by the model size** — pick the model first, the instance follows. A 1B and a
70B model differ ~100× in cost. Ballpark on-demand pricing (us-central1; verify in the
[GCP Pricing Calculator](https://cloud.google.com/products/calculator), GPU prices shift):

| Model (4-bit) | Needs | GCP option | Rough cost |
|---|---|---|---|
| **0.5–3B** | CPU only | **Cloud Run CPU**, scale-to-zero | **~$0–5/mo** (low volume) |
| **7–8B** | 1× **T4** (16 GB) / **L4** (24 GB) | CE VM / Cloud Run GPU | T4 ≈ $0.35/hr → **~$255/mo** always-on |
| **13B** | 1× **L4** (24 GB) | CE VM / Cloud Run GPU | L4 ≈ $0.71/hr → **~$520/mo** always-on |
| **34B** | 1× **A100 40 GB** (or 2× L4) | CE VM | A100 ≈ $3.7/hr → **~$2,700/mo** |
| **70B** | 2× **A100 80 GB** / 1× **H100** | CE VM | ~$5–11/hr → **~$3,600–8,000/mo** |

**Spot/preemptible** VMs cut GPU cost ~60–70% but can be interrupted.

**Billing model matters more than the instance:**
- **Scale-to-zero (Cloud Run)** — pay *only while serving a request*; idle ≈ $0. Trade-off: a **cold
  start** reloads the model (seconds for small; ~10–30s for a 7B on GPU). Best for **low-volume,
  bursty** use like ours. The "$255/mo"-type numbers above are **always-on** — avoid unless traffic
  is steady.
- **Sweet spot:** **Cloud Run now supports GPU (L4) with scale-to-zero** — a 7–8B model that spins up
  only while an employer actually chats, then idles at ~$0. Cold start is the only cost.

> Reminder — this is about *total* params in RAM, not "active" params. An MoE like Kimi K2 (1T total,
> 32B active) still needs the **full 1T** resident (~500 GB @ 4-bit) → server/hosted only, never a
> laptop. See the 128 GB MacBook Pro limit → up to ~70B locally, not 1T.

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
