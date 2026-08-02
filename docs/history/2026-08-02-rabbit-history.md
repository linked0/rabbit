# 2026-08-02 — rabbit history

> Source docs: none — direct chat requests from jay (no task/design file).

### feat(notify): project emoji prefix on Telegram messages

jay couldn't tell rabbit and verex notifications apart — both used 👀 for a page visit. Every
message now leads with a project marker plus the project name: 🐰 rabbit (portfolio), 🔮 verex
(prediction market), with the event emoji second. Previewed all six formats straight to Telegram
before deploying so jay could judge the look first.

### feat(notify): ping when a conversation passes 10 questions

New `notifyChatMilestone` — counts the visitor's own turns and fires only on the threshold turn,
so it's one ping per conversation rather than one for every question past ten.

### fix(jay-chat): three separate walls all landed at ~question 11

jay hit the limit after a few test questions. Measured with tiktoken rather than guessing, and
found three independent causes that happened to converge:

1. **Token budget.** The client resends the ENTIRE conversation each turn, so cumulative cost
   grows quadratically — question 20 costs 8× question 1. The 30k/hour budget died at ~Q11.
   Fixed by forwarding only the last 6 messages upstream (cost now flat per question) and
   raising the default to 150k. Result: ~11 → ~67 questions.
2. **`MAX_MESSAGES=20` returned a 400 on the 11th question** — each question adds two array
   entries, so N questions = 2N-1 messages. A hard wall dressed as a validation error. Now 150.
3. **`JAY_CHAT_HOURLY_TOKEN_BUDGET` was never passed by `deploy.sh`**, so the `.env.example`
   entry did nothing and production silently ran the hardcoded default.

Any one fix alone would still have left the wall in place.

### fix(rag): Korean compound words never matched — and a regression I caused

jay reported the bot claiming it had no education information. Korean writes compounds without
spaces, so 학교 exists only *inside* 한국외국어대학교 — never as its own token — and exact
matching scored zero for every education phrasing.

Compounding it, the fallback was **my own regression from earlier the same day**: I had replaced
the previous "return all chunks" fallback with a focused core set, and that set omitted
Education. The old fallback had covered it by accident, so this only broke after my change.

Fixed with substring containment for Korean terms (weighted below exact matches), a widened core
fallback, crude English stemming (studies/study), and university/college/school synonyms.

### fix: third-person voice + language matching moved into code

jay asked for consistent third person — the persona sometimes answered as Hyunjae ("저는 91학번
입니다") when a visitor addressed it directly.

Language matching then proved unreliable: the corpus is deliberately bilingual, so mixed-language
context kept dragging English questions into Korean answers, and **which way it fell flipped
between runs** as the corpus changed. Prompt phrasing was chasing a moving target, so the query
language is now DETECTED in code (any Hangul ⇒ Korean) and stated as a mandatory trailing
instruction. 9/9 mixed-language probes then answered in the correct language.

### content: publish 학번/entrance year, keep age private — and a hallucination I had to revert

jay's call after discussing it: share the university cohort and entrance year (already derivable
from public LinkedIn dates, and normal to share professionally), but not age or birth year —
Jay Chat is read by potential employers, and volunteering an age invites bias for no benefit. If
asked his age, the bot answers with 학번 instead. Enforced in two layers, because the corpus
alone let the model *calculate* an age from the entrance year: the system prompt now forbids
stating, estimating **or calculating** it.

**Reverted:** while restructuring the corpus for this, I split the age rule into its own section
and reorganised Education — and the bot then invented **"한국외국어대학교(상명대학교)"**, a
university appearing nowhere in the corpus. A fabricated fact is the one failure mode this
feature must never have. Rolled back to the last known-good corpus and re-applied only the safe
additions; verified across repeated runs that the invented university is gone.

Deployed and verified on production (`rabbit-00046-d8z`) in both languages.

### note: model choice

jay asked whether to move off gpt-4o-mini. Recommended staying: today's quality problems were all
retrieval bugs, not model limitations — a stronger model would not have fixed truncated chunks or
Korean tokenisation, and would cut the question budget several-fold at 3–15× the token price for
a task that is mostly "restate facts from provided context". jay agreed to keep gpt-4o-mini.

### note: git commit messages must go through a file

Two commits silently failed today because Korean text with `?` and quotes in a `-m` argument hit
zsh globbing (`no matches found`). Worse, `deploy.sh` builds from the working tree (`--source .`),
so **production received changes that were never committed** — git and prod diverged without any
error surfacing. Commit messages now go via `git commit -F <file>`.
