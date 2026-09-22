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
[2026-07-25 history](../history/2026-07-25-rabbit-history.md).)

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

**Deploy note.** `content/` **is** copied into the Cloud Run image (`Dockerfile` runner stage has
`COPY --from=builder /app/content ./content`, added 2026-08-01 for Jay Chat) — the `.md` depth
works in production, not just local dev.

**Upgrade path.** Swap the lexical `retrieve()` for an embedding search (e.g. OpenAI embeddings +
a small vector index) without touching the route or the UI — same `Chunk` interface.

**✅ Access/gating — resolved via Jay Chat (2026-08-01).** The original gap: this mode is meant
for **keyless, logged-out visitors** (employers/clients), but `/chat` + `/api/chat` require login
and use the owner's server-stored key. Resolved by building a **separate public surface** instead
of opening up `/chat` itself — see "Jay Chat" below.

## Jay Chat — public surface (✅ implemented, 2026-08-01)

**What:** the nav item (formerly "AI Chat") is renamed **"Jay Chat"**, points at a new public page
`/jay-chat`, and is `pub: true` — visible and usable by logged-out visitors. `/chat` itself was
unchanged at the time (owner-only, general-purpose + the `👤 About Hyunjae` toggle) — Jay Chat was
an isolated build, not a retrofit, so there was zero risk to the existing private chat.

> **2026-08-12 — private chat deleted.** jay stopped using `/chat`, so the owner-only general chat
> (`app/chat/`, `app/api/chat/`, `lib/ai.ts` incl. the Ollama local path) was removed. Jay Chat is
> now the site's only chat, and the "dedicated key" isolation below collapsed into a single
> `AI_API_KEY` (DashScope/Qwen) — with no second consumer, a separate key no longer isolated
> anything. `ChatMessage` moved into `lib/jay-chat.ts`.

**Model:** **Qwen Flash** via DashScope's OpenAI-compatible endpoint (switched from `gpt-4o-mini`
2026-08-12 — same wire format, ~45% cheaper per typical turn, which funded a 3× budget raise).

**How it stays safe as a public, keyless endpoint:**
- **API key** — historically a dedicated key (`JAY_CHAT_OPENAI_API_KEY`), separate from the
  private chat's `AI_API_KEY` so abuse could be revoked without killing the owner's chat. Since
  the private chat's deletion (2026-08-12) there is no second consumer to protect, so Jay Chat
  simply reads `AI_API_KEY` — still revocable freely, since nothing else uses it.
- **Always-on persona, never general chat** — `/api/jay-chat` (`app/api/jay-chat/route.ts`) always
  injects `buildAboutMeSystemMessage()` itself; there's no client-supplied toggle to turn it off,
  so the endpoint can't be repurposed as a free general-purpose proxy.
- **Hourly global token budget** (`lib/jay-chat.ts`, in-memory, default 450k tokens/hr — was 30k,
  then 150k after the quadratic-history measurement of 2026-08-02, then 3× on the cheaper Qwen
  switch 2026-08-12; env `JAY_CHAT_HOURLY_TOKEN_BUDGET`) — shared across all visitors, not
  per-visitor. A deliberate v1
  simplification (jay's call, 2026-08-01): real traffic is rare right now, so the downside (one
  active conversation could exhaust the shared hour) is low-probability, and splitting per-visitor
  later is a small, contained change if traffic ever picks up. Checked before every request, so
  even a fast burst gets cut off at the cap — bounds cost regardless of request speed.
- **Per-IP burst guard** (15 req/min) — not a cost control (the token budget already bounds cost),
  just protects server stability from one script hammering it with simultaneous requests.
- **Request caps** — max 20 messages/conversation, max 2000 chars/message, max 500 output tokens —
  bound worst-case cost per request.
- **Provider-level hard spending cap** — set on the dedicated key in the provider console (Alibaba
  Cloud Model Studio since the Qwen switch; formerly the OpenAI dashboard), as the final backstop
  regardless of any bug in the app's own limiting logic.

**Corpus expansion:** `content/profile/github-summary.md` added (real data, GitHub's public API,
no auth needed) — picked up automatically by the existing `markdownChunks()` loader, no code
change needed. **LinkedIn** intentionally not scraped (against LinkedIn's ToS) — needs jay to
manually export/paste his profile text into a `content/profile/*.md` file whenever he's ready;
the loader will pick it up the same way, automatically.

**Deploy note — content/ now ships to Cloud Run.** `Dockerfile` now has
`COPY --from=builder /app/content ./content`, so the markdown corpus depth (including the new
GitHub summary) works in production too, not just local dev — resolves the limitation noted above.

**Follow-ups**
- [ ] Optional: embedding-based retrieval for larger corpora.
- [ ] Optional: ship `content/` to the cloud image for full `.md` depth (one-line Dockerfile change).
- [ ] Optional: suggested-question chips in the UI when `About Hyunjae` is on.

## Auth + LLM gating <a id="auth-llm-gating"></a>
**Status: ⬜ To do** — design only, not yet built. Not part of the current active work
(AP2/AA/PoCs hub); scheduled for later.

**Current:** `lib/ai.ts` already abstracts Ollama (local) vs OpenAI (cloud), but the choice is
fixed by `APP_MODE` — not user-selectable. No provider-selector UI, no BYO-key input, no
per-user key storage exist yet (verified against the code 2026-08-03).

**Access model:**
- **Portfolio** is login-only (menu hidden until login, `authOnly` in `Nav.tsx`, gated in
  `middleware.ts`). AI Chat's menu stays visible; access is gated separately.
- To chat, the user picks a **Proprietary LLM** and supplies **their own API key**.
- **Local LLM** only works when the app runs locally (Ollama reachable at `localhost`); on the
  cloud deployment it's shown but disabled ("not available in cloud yet") — no hosted OSS model
  provisioned.
- **jay** (`linked0@gmail.com`) uses a **server-stored API key** — no paste required.
- **Public "About me" path** — resolved separately via **Jay Chat** (`/jay-chat`, see above)
  rather than opening up general `/chat`; that's why this section's public-access gap doesn't
  block the About-me feature anymore.

**Design:** add a key/source resolver on top of `lib/ai.ts`: `jay → env secret` ·
`other user → own key, persisted per user, encrypted at rest` ·
`Local LLM → enabled in local mode (Ollama at localhost), disabled in cloud`. Gate the
stored-key path on `session.user.email === linked0@gmail.com`; detect mode via `appMode()`
(`lib/mode.ts`).

**Decided (jay):** persist users' keys, **encrypted at rest** (encryption key in env, never
plaintext; a `userApiKey` field keyed by user). Proprietary provider = **current setting
(OpenAI)**; add Anthropic later if wanted. A **provider selector** in the chat UI (dropdown:
Local LLM / OpenAI / …) sends the choice to `/api/chat`; `lib/ai.ts` stays the abstraction,
routes by the selected provider at request time.

## KB via MCP + RAG <a id="kb-via-mcp--rag"></a>
**Status: ⬜ To do** — design only, not yet built. Not part of the current active work
(AP2/AA/PoCs hub); scheduled for later.

**Goal:** chat can query the **Knowledge KB** (`docs/know.html` + `docs/knowledge/*.md`) using
**RAG**, exposed through an **MCP** tool — distinct from "Ask about me" above, which indexes the
profile/projects corpus, not the Knowledge KB.

**Decided (jay):** the MCP exposes **KB search / retrieval** — settles what this project's own
MCP server exposes (previously TBD below).

**Design:**
- Index Knowledge content (`know.html` + md) → embeddings → vector store (local Chroma/Qdrant, or
  a simple file index to start).
- Expose retrieval as this project's MCP server; the chat agent calls it as a tool. (Fallback: do
  RAG directly in `/api/chat` and keep MCP for tool-calling.)
- Flow: question → retrieve top-k chunks → inject into prompt → LLM answers **with citations**.

**Open:** embedding model (local `nomic-embed` vs OpenAI) · vector store · MCP-tool vs in-route
RAG (About-me above already proves the in-route side for a small corpus).

**Note:** the repo's only existing MCP server (`spagetties/`, `@modelcontextprotocol/sdk`)
currently serves hardcoded pasta recipes — unrelated placeholder content, not KB retrieval
(verified 2026-08-03).

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
Give the chat agent a tool: **call an MCP server that this project builds**. **Resolved:** the
MCP exposes **KB search/retrieval** — see "KB via MCP + RAG" above for the full design. (Needs a
provider that supports tool/function calling, or route MCP calls through the app's `/api/chat`.)

## Open questions
- OSS model on Cloud Run (cheap, slower) or a dedicated VM (faster, costlier)?
- Persist the user's provider choice (per session / per account)?
- Cloud mode: ship the OSS model on Cloud Run, or just call `gpt-4o-mini` (no infra)?
- KB-RAG: embedding model + vector store (see "KB via MCP + RAG" above).

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
