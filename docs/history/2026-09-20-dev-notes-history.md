# 2026-09-20 — dev-notes (Knowledge Notes) history

Source docs: `docs/topics/README.md` (item rules), `docs/topics/english/README.md` (Eng format). The item came from a URL jay pasted in chat (source `chat`); no task/design file is the origin of the content.

### Daily checks

- **alice-tech:** no `alice-tech-2026-09-19.md` or `-20.md` in the iCloud folder (weekend; latest is 09-18). Its two unused candidates (Four Pillars 순유동성; npm 공급망 위생) still stand.
- **Gemini folder:** not due (Sunday; Mon/Thu rule).
- **Eng:** one conversation for the day → #36 (below).

### Tech #125 "Galaxy brain resistance" — Vitalik's essay, read in full

- **Cause:** jay: "https://vitalik.eth.limo/general/2025/11/07/galaxybrain.html : can you read this?" The fetch tool returned a truncated summary, so the page was downloaded with curl, stripped to text (about 4,800 words) and read whole.
- **Reasoning:** an essay about which arguments carry information is the philosophical floor under the Auditor ("by which rule") and the discipline for reading the pitch-shaped briefings this site is built from, so it is Tech, not Life. Written by hand, not by a subagent. New kicker type `Essay` (first use; the others are PoC, Talk, Basics, Lecture, Vlog).
- **Change:** `add-tech-item.py --status new --type Essay --date 2026-09-20` → Tech #125 `galaxy-brain-resistance-principles-with-teeth`: definition and the falsifiability analogy; six low-resistance patterns (inevitabilism, longtermism, aesthetic bans in disguise, apologia for bad finance, power maximisation, doing-more-from-within) with the essay's cases; the two defences (hard rules / deontology and rule utilitarianism; hold the right bags, including where you live); a four-row test to run on any briefing. Landing: Auditor encodes only rules with teeth; Verex names risk tiers, never virtues ("low-risk DeFi" over "good DeFi"); a galaxy-brain line in Verified and unverified when the source is a pitch; the other half of #62; Eng #36. 26 vocab rows.
- **Result:** Tech 61/272, overall 68/548; rail = card = kicker = nav verified.

### Eng #36 "That argument works for any conclusion"

- **Cause:** the one-conversation-per-day rule; the essay gave the subject.
- **Change:** `docs/topics/english/english-36.md` (Design review, `status: important` to sit with the job-abroad set): a London fintech design review where Jay splits a PM's proposal into "it is inevitable" and "we can shape it from inside", shows the first argues equally for waiting, and turns the second into a contractual condition ("Make it falsifiable and I am in"); three techniques, twelve expressions. Built with `english-notes.py` (Eng 1/36, 11 Important).
