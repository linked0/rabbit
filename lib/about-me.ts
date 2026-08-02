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
    // Split each doc on its top-level "## " headings so a long file contributes SEVERAL
    // retrievable chunks. Previously each file was one chunk truncated to 1200 chars, which
    // silently discarded everything past that point — e.g. resume-career.md is ~8.6k chars,
    // so its later sections (career-summary guidance) could never be retrieved at all.
    const out: Chunk[] = [];
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".md"))) {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      // Split on "##" AND "###" — the per-employer "###" sections of a long career doc each
      // become their own chunk, instead of everything after the first 1500 chars being lost.
      for (const part of raw.split(/\n(?=###?\s)/)) {
        const heading = (part.match(/^###?\s+(.+)$/m)?.[1] ?? "").trim();
        // Still cap per chunk, so one very long section can't crowd out the rest.
        const text = stripMarkdown(part).slice(0, 1500);
        if (text.length > 0) {
          out.push({ source: heading ? `doc:${f} — ${heading}` : `doc:${f}`, text });
        }
      }
    }
    return out;
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
const KO_PARTICLE = /(은|는|이|가|을|를|에|의|도|와|과|로|으로|에서|에게|부터|까지|만|이나|나)$/;

function tokenize(s: string): string[] {
  const raw = s.toLowerCase().match(/[a-z0-9]+|[가-힣]+/g) ?? [];
  // Korean glues particles onto nouns ("지금은", "회사에서"), so a bare token never matches
  // the corpus form. Emit the particle-stripped stem alongside the raw token.
  const out: string[] = [];
  for (const t of raw) {
    out.push(t);
    if (/[가-힣]/.test(t) && t.length > 2) {
      const stem = t.replace(KO_PARTICLE, "");
      if (stem.length >= 2 && stem !== t) out.push(stem);
    } else if (/^[a-z]+$/.test(t) && t.length >= 4) {
      // Crude English stemming so a query and the corpus meet in the middle: asking
      // "what did he study?" scored zero against a corpus that says "Studies"
      // (2026-08-02). Applied to BOTH sides, so studies/study, worked/work, building/build
      // all collapse to the same key.
      const stem = t
        .replace(/ies$/, "y")
        .replace(/(ing|ed|es|s)$/, "");
      if (stem.length >= 3 && stem !== t) out.push(stem);
    }
  }
  return out;
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
      if (n > 0) {
        distinct++;
        total += n;
        continue;
      }
      // Korean compounds words without spaces: "학교" (school) is a substring of
      // "한국외국어대학교", never its own token, so exact matching alone can never find it —
      // asking 학교는 어디 나왔나요? scored ZERO against the education section (2026-08-02).
      // Fall back to substring containment for Korean terms, weighted below an exact hit.
      if (term.length >= 2 && /[가-힣]/.test(term)) {
        const hits = toks.filter((t) => t.length > term.length && t.includes(term)).length;
        if (hits > 0) {
          distinct += 0.7;
          total += hits;
        }
      }
    }
    return { chunk: c, score: distinct + 0.1 * total };
  });

  const top = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.chunk);

  const profile = all.find((c) => c.source === "profile")!;

  // Broad/subjective questions ("what's his strength?") and Korean phrasings that share no
  // literal keyword with the corpus ("지금은 어디서 일해요?" vs a corpus that says "현재")
  // score zero everywhere. Fall back to a CORE set — profile, current role, the career
  // summary and its guidance — rather than dumping all ~83 chunks: a huge unfocused context
  // costs far more tokens and measurably answers worse (2026-08-02, "지금은 어디서 일해요?"
  // returned "no information" while the same question with an explicit subject worked).
  if (top.length === 0) {
    const core = all.filter(
      (c) =>
        c.source === "profile" ||
        /Current role|Education|Experience summary|How to answer|Skills|Certifications/i.test(c.source)
    );
    return core.length > 0 ? core : all.slice(0, 8);
  }

  return top.some((c) => c.source === "profile") ? top : [profile, ...top].slice(0, k + 1);
}

// Assemble the grounded system message injected when the "About me" mode is on.
export function buildAboutMeSystemMessage(query: string): ChatMessage {
  // Any Hangul in the question ⇒ treat it as a Korean question.
  const asksInKorean = /[가-힣]/.test(query);
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
      "Age: never state, estimate, or CALCULATE his age or birth year — not even by inferring " +
      "it from his university entrance year or career start. Those dates are public, his age " +
      "is not. If asked how old he is, say he shares his 학번 (university entrance cohort) " +
      "rather than his age, and give that: 91학번 — entered university in 1991, graduated " +
      "1997, developer since 1997.\n\n" +
      "Voice: you are an assistant speaking ABOUT him, never AS him. Always use the third " +
      "person (he / 이현재는), never the first person (I, my / 저는, 제), even when the " +
      "visitor phrases the question as if speaking to him directly. This applies in " +
      "whichever language you are answering in.\n\n" +
      "LANGUAGE — match the visitor's question, independently of the language used in these " +
      "instructions or in the context below: a Korean question gets a Korean answer, an " +
      "English question gets an English answer.\n\n" +
      `[Context about ${PROFILE.name}]\n${context}\n\n` +
      // The corpus is deliberately bilingual, so "answer in the same language as the question"
      // proved unreliable — the mixed-language context kept dragging English questions into
      // Korean answers, and which way it fell flipped between runs as the corpus changed
      // (2026-08-02). Detecting the language in code and stating it flatly removes the
      // ambiguity instead of trying to out-phrase it.
      `MANDATORY — the visitor asked in ${asksInKorean ? "KOREAN" : "ENGLISH"}. Write your ` +
      `entire answer in ${asksInKorean ? "KOREAN" : "ENGLISH"}, regardless of the language ` +
      "of the context above. Always third person.",
  };
}
