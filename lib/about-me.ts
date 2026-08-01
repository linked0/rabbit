// "Ask about me" RAG core (docs/features/ai-chat.md).
// A visitor — possibly an employer or client — asks the AI Chat about Hyunjae Lee.
// We RETRIEVE the most relevant pieces of his profile/project material and AUGMENT
// the chat with them as grounded context, so answers stay factual (no hallucinated
// résumé). Retrieval here is lexical (keyword overlap) — zero new deps, works in both
// local (Ollama) and cloud (OpenAI/Anthropic) modes. Upgrade path: swap `retrieve()`
// for an embedding search without touching the route/UI.

import { PROFILE, PROJECTS } from "@/lib/home-content";
import type { ChatMessage } from "@/lib/ai";

// A labeled unit of knowledge about Hyunjae. `source` shows up in the grounded
// context so the model (and a curious reader) can see where a fact came from.
export type Chunk = { source: string; text: string };

// --- Corpus: structured profile + projects (always bundled — no filesystem) ---
// PROFILE/PROJECTS come from lib/home-content.ts, which is imported (so it is always
// present in the Next standalone bundle). This is the reliable backbone of the corpus.
function structuredChunks(): Chunk[] {
  const chunks: Chunk[] = [];

  chunks.push({
    source: "profile",
    text: [
      `Name: ${PROFILE.name}.`,
      `${PROFILE.heading} (KO: ${PROFILE.headingKo}).`,
      `${PROFILE.tagline}`,
      `(KO: ${PROFILE.taglineKo})`,
      `Contact — email: ${PROFILE.email}.`,
      `Links: ${PROFILE.links.map((l) => `${l.label} ${l.url}`).join(", ")}.`,
    ].join(" "),
  });

  for (const p of PROJECTS) {
    chunks.push({
      source: `project:${p.slug}`,
      text: [
        `Project: ${p.title}${p.titleKo ? ` (${p.titleKo})` : ""}.`,
        `Date: ${p.date}.`,
        `${p.description}`,
        p.descriptionKo ? `(KO: ${p.descriptionKo})` : "",
        p.liveUrl ? `Live: ${p.liveUrl}.` : "",
        `Source: ${p.sourceUrl}.`,
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  return chunks;
}

// --- Optional depth: content/profile/*.md bodies (local dev only) ---
// The Dockerfile ships only .next/standalone + .next/static + public, NOT content/,
// so these files are absent at runtime on Cloud Run. We read them best-effort and
// degrade silently to the structured chunks above when they are missing. To get this
// extra depth in the cloud too, add one line to the Dockerfile:
//   COPY --from=builder /app/content ./content
function markdownChunks(): Chunk[] {
  try {
    // Required lazily so a bundler/edge context that lacks node:fs never breaks import.
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const dir = path.join(process.cwd(), "content", "profile");
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => {
        const raw = fs.readFileSync(path.join(dir, f), "utf8");
        const text = stripMarkdown(raw);
        // Cap each doc so one long write-up can't crowd out the rest of the context.
        return { source: `doc:${f}`, text: text.slice(0, 1200) };
      })
      .filter((c) => c.text.length > 0);
  } catch {
    return [];
  }
}

// Strip Jekyll front matter, HTML, and Markdown syntax down to plain prose.
function stripMarkdown(raw: string): string {
  let s = raw;
  if (s.startsWith("---")) s = s.replace(/^---[\s\S]*?---/, ""); // front matter (top only)
  return s
    .replace(/<[^>]+>/g, " ") // HTML tags
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // md links/images → their text
    .replace(/[#*_>`|-]/g, " ") // residual md punctuation
    .replace(/\s+/g, " ")
    .trim();
}

// Build the corpus once and cache it (module lifetime).
let CORPUS: Chunk[] | null = null;
function corpus(): Chunk[] {
  if (!CORPUS) CORPUS = [...structuredChunks(), ...markdownChunks()];
  return CORPUS;
}

// Tokenize into lowercase words — ASCII alphanumerics and Korean syllables.
function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+|[가-힣]+/g) ?? [];
}

// Common words that shouldn't drive retrieval (so "what does he do?" doesn't match on
// "what"/"does"/"do"). Kept deliberately small — just the high-frequency glue words.
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "do", "does", "did", "of", "to",
  "in", "on", "for", "and", "or", "his", "he", "him", "her", "she", "you", "your", "me",
  "my", "i", "it", "this", "that", "what", "who", "how", "about", "tell", "with", "know",
  "은", "는", "이", "가", "을", "를", "에", "의", "도", "고", "무슨", "어떤", "그", "및",
]);

// Lexical retrieval: score each chunk by how many query terms it contains, weighted
// mildly by frequency, and return the top matches. `profile` is always included so the
// model never loses the person's name and contact info even on an off-topic query.
export function retrieve(query: string, k = 4): Chunk[] {
  const all = corpus();
  const terms = new Set(tokenize(query).filter((t) => !STOPWORDS.has(t)));
  if (terms.size === 0) return all.filter((c) => c.source === "profile");

  const scored = all.map((c) => {
    const toks = tokenize(c.text);
    const counts = new Map<string, number>();
    for (const t of toks) counts.set(t, (counts.get(t) ?? 0) + 1);
    let distinct = 0;
    let total = 0;
    for (const term of terms) {
      const n = counts.get(term) ?? 0;
      if (n > 0) distinct++;
      total += n;
    }
    return { chunk: c, score: distinct + 0.1 * total };
  });

  const top = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.chunk);

  const profile = all.find((c) => c.source === "profile")!;

  // Broad/subjective questions ("what's his strength?") share no keywords with any
  // chunk (project text doesn't literally say "strength"), so `top` comes back empty.
  // Fall back to the full corpus instead of just `profile` — the model needs real
  // project material to characterize strengths/weaknesses from, not just a name and
  // contact info.
  if (top.length === 0) return all;

  return top.some((c) => c.source === "profile") ? top : [profile, ...top].slice(0, k + 1);
}

// Assemble the grounded system message injected when the "About me" mode is on.
export function buildAboutMeSystemMessage(query: string): ChatMessage {
  const context = retrieve(query)
    .map((c) => `- [${c.source}] ${c.text}`)
    .join("\n");

  return {
    role: "system",
    content:
      `You are the personal AI assistant on ${PROFILE.name}'s portfolio site (Rabbit). ` +
      "A visitor — possibly a potential employer or client — is asking about " +
      `${PROFILE.name}. Answer their questions helpfully, professionally, and concisely, ` +
      "using ONLY the context below. If the answer is not in the context, say you don't " +
      "have that detail and point them to the contact email or links. Never invent concrete " +
      "facts — titles, dates, employers, specific achievements not in the context.\n\n" +
      "Exception — strengths and weaknesses: these are inherently interpretive, not hard " +
      `facts, so when asked what ${PROFILE.name}'s strengths or weaknesses are, you may go ` +
      "beyond literal quotation and characterize him — confidently and creatively, in an " +
      "engaging way — inspired by the real project/work history in the context (breadth " +
      "across projects, technical depth, security work, self-directed learning, etc.). This " +
      `is ${PROFILE.name}'s own explicit choice for how his persona presents him; he has ` +
      "reviewed and accepted this. Still never invent concrete facts while doing this " +
      "(no fabricated employers, titles, or specific unverifiable claims).\n\n" +
      "Hard limit, no exception: never discuss or speculate about relationships with other " +
      "people, personal feelings/emotions, or private life/history. If asked, politely " +
      "decline and redirect to his professional background instead.\n\n" +
      "Reply in the same language as the question (Korean or English).\n\n" +
      `[Context about ${PROFILE.name}]\n${context}`,
  };
}
