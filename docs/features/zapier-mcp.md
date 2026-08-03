# Zapier MCP — Sample Page (agent triggers real app actions)

**Goal:** a sample page where rabbit's agent, connected to **Zapier MCP**, executes real
SaaS actions (send Gmail, create a Notion page, post a Slack message) from a natural-language
instruction — no custom per-app integration code.

*Source: jay's Zapier MCP one-liner summary, pasted in session 2026-07-17 (no URL provided —
this doc is the canonical copy). Positioning: the consumer counterpart of LLM Day 39 (building
an MCP server yourself) — start by consuming someone else's MCP.*

## 1. What Zapier MCP is
- Zapier exposes its 8,000+ app integrations as **MCP tools**. An LLM connected to the server
  can trigger those actions as ordinary tool calls.
- Setup is config, not code: create a Zapier MCP endpoint (per-account URL + auth), pick which
  actions are allowed, connect the client.
- **For jay concretely:** a post-processing pipeline like *morning report done → summary to
  Notion → Gmail notification to self* becomes assembly, not integration work.

## 2. Sample page design (`/etc/zapier` or a new ETC subpage)
- **UI:** a minimal panel — connection status → allowed-tools list (fetched from the MCP
  server) → a prompt box ("send me an email saying hi") → execution log showing the tool
  call + arguments + result.
- **Wiring (server-side, key never in the browser):**
  - `lib/ai.ts` already abstracts providers; add an MCP client path. Two options:
    1. **Anthropic API MCP connector** — pass the Zapier MCP URL in the API request
       (`mcp_servers`), let Claude call tools remotely. Least code; ties the demo to the
       Anthropic provider.
    2. **Generic MCP client in the route** (`@modelcontextprotocol/sdk`) — `/api/zapier`
       connects, lists tools, forwards the model's tool calls. Provider-agnostic, more code;
       reuses thinking from §5 (KB-over-MCP), where rabbit is the MCP *server* — here it's
       the *client*.
- **Env:** `ZAPIER_MCP_URL` (+ auth token) as server secrets, same handling as the AI-chat
  keys in design §2 (encrypted/env, never client-side).
- **Safety rail:** allowlist only harmless actions in the Zapier console for the demo
  (e.g. "Gmail: send email to self", "Notion: create page in a sandbox DB") — an
  agent-triggerable Gmail is a footgun if left broad.

## 3. Concrete demo scenarios (pick 1–2)
1. **Email-to-self:** prompt → agent calls Zapier's Gmail send tool → mail arrives at
   linked0@gmail.com. Smallest end-to-end proof.
2. **Notion note:** "summarize this market snapshot to Notion" → agent pulls `/api/indices`
   data → creates a Notion page. Shows chaining a rabbit-internal source with an external action.
3. **(stretch) Morning-report pipeline:** wire the summary+notify flow from the source note —
   report text → Notion page → Gmail notification, both via one agent turn.

**Suggested first cut:** scenario 1 with wiring option 1 (Anthropic MCP connector) — smallest
possible loop, ~0.5–1d including the Zapier-side setup.

## Status
Backlog / to do — not yet scheduled. Natural sequencing: after the AI Chat KB-via-MCP+RAG work
(see [ai-chat.md](ai-chat.md#kb-via-mcp--rag)) so the MCP client/server concepts land together,
but it's independent enough to pull forward as a quick win.
