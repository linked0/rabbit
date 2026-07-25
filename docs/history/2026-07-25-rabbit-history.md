# 2026-07-25 — rabbit history

> Source docs for today's work:
> - Feature design → [docs/features/ai-chat.md](../features/ai-chat.md) (§ "Ask about me (RAG)")
> - Task design → [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) (§5b)
> - Main design → [docs/rabbit-design.md](../rabbit-design.md)

### AI Chat: "Ask about me" RAG mode

Added a feature so a visitor (potential employer/client) can ask the AI Chat about **Hyunjae Lee**
and get factual, grounded answers. Source: [docs/features/ai-chat.md](../features/ai-chat.md#ask-about-me-rag--implemented).

- New `lib/about-me.ts` — RAG core: corpus from `lib/home-content.ts` (`PROFILE` + `PROJECTS`, EN/KO)
  plus best-effort `content/profile/*.md`; lexical keyword retrieval; a persona system message that
  answers only from context.
- `app/api/chat/route.ts` — new `aboutMe` flag (parallel to `mcp`); prepends the grounded system
  message; the two modes now compose (fixed the `mcp` branch that had replaced `outgoing`).
- `app/chat/ChatClient.tsx` — `👤 About Hyunjae` toggle beside the 🍝 Spaghetti MCP toggle, with
  example prompts.

### Decision: RAG over fine-tuning (why)

Chose **RAG**, not a fine-tuned LLM, for the "ask about me" feature. Fine-tuning would be costly,
slow to update (retrain on every résumé edit), risk hallucinating facts, and there is no training
pipeline in the repo. RAG grounds answers in the real profile/project text and updates by simply
editing content. Retrieval is lexical for now (zero new deps); embedding search is a drop-in upgrade
behind the same `Chunk` interface.

### Design coupling: About-me RAG (§5b) ↔ Auth + LLM gating (§2)

jay flagged that §5b couples with §2. The About-me mode is meant for **keyless, logged-out visitors**
(employers/clients), but §2's current model blocks exactly that: general chat is **BYO-API-key**, the
server-stored key is **gated to jay's email**, and `/chat` + `/api/chat` are **login-gated** in
`middleware.ts` — so a visitor can't even open the chat. Reconciliation (recorded in jun-30 design
§2 "Public About me path" + §5b): add a **server-keyed, rate-/budget-capped** path **scoped to the
About-me prompt**, exposed **without login** (`PUBLIC_PATHS`); general chat stays BYO-key. Until jay
decides how to power it (his server key + abuse caps · a cheap hosted small model · or keep it
login-only), the shipped feature serves only a logged-in user with a key configured. **Not yet
implemented — design decision pending.**

### Doc: GCP instance sizing & cost added to ai-chat.md

Folded the "run an LLM on GCP — which instance, what cost" analysis into
[docs/features/ai-chat.md](../features/ai-chat.md) cost section (new "Self-hosting on GCP" subsection):
model→instance→cost table (CPU / T4 / L4 / A100 / H100 + monthly ballparks), scale-to-zero vs
always-on billing, the Cloud Run GPU scale-to-zero sweet spot, and the MoE total-vs-active RAM note
(why Kimi K2's 1T total → server-only, not a 128 GB MacBook Pro). Captured with the feature per jay.

### Gotcha: `content/` is not in the Cloud Run image

The Dockerfile ships only `.next/standalone` + `.next/static` + `public`, so `content/profile/*.md`
is absent at runtime in the cloud. The RAG therefore degrades to the structured `home-content.ts`
corpus in cloud mode (still works). Full `.md` depth in cloud needs one line in the Dockerfile
runner stage: `COPY --from=builder /app/content ./content`.
