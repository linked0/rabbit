# 2026-09-20 — jayverse history

Source doc: `docs/features/README.md` (the feature-design hub). No task file; the change is jay's direct instruction in chat.

### features/README.md: renumber services 4–7

- **Cause:** jay: "set number like this: 5. Wallet & simulate-before-sign, 4. Token + Exchange + Bridge + Personas, 6. Devnet — own L1 / L2, 7. Unity — 3D browser game".
- **Reasoning:** the order now follows the money path (Token → Wallet → Devnet → Game) instead of the order rows happened to be added. Only the README was asked for; the per-service docs (5 files still say `#4`–`#7` in the old sense) are left for a follow-up so the hub and the details do not silently disagree without a note.
- **Change:** old 4 Devnet → 6, 5 Unity → 7, 6 Wallet → 5, 7 Token → 4. Rows reordered in the per-service table, the phase overview and the repo table; 24 inline `#N` references remapped (scenarios A–C, ownership notes, Dark Horse row); a dated renumbering note added under Ownership changes.
- **Result:** the README is self-consistent on the new numbers; `docs/html` regenerated.

### features/README.md: swap 3 and 4

- **Cause:** jay: "Set 4. Token + Exchange + Bridge + Personas and 4. DeFi — EtherFi" — read as a swap, since two rows cannot share a number: Token up to 3, DeFi down to 4.
- **Change:** rows swapped in the three tables; `#3`/`#4` references remapped (scenario steps for DeFi and Token/Personas); the renumbering note extended.
- **Result:** order is now 1 Rabbit · 2 Verex · 3 Token · 4 DeFi · 5 Wallet · 6 Devnet · 7 Game · 8 OFA · 9 Number · 10 Dark Horse.
