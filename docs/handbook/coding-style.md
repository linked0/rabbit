# Coding Style

Consistency over personal preference. Where possible, **let tooling enforce style** so
code review focuses on logic, not formatting.

## General
- **Match the surrounding code** — naming, structure, comment density.
- **Small, focused changes.** No drive-by refactors mixed into a feature PR.
- **Name for intent.** Avoid abbreviations that aren't obvious.

## Tooling (enforce, don't argue)
| Language | Format | Lint |
|---|---|---|
| TypeScript / JS | Prettier | ESLint |
| Solidity | `forge fmt` | solhint |

- Add an `.editorconfig` so editors agree on indentation and newlines.
- Run format + lint **in CI** so style is checked automatically on every PR.

## Comments
- Explain **why**, not **what** (the code already shows what).
- Keep comments current — delete stale ones.
