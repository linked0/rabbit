# Architecture & Decisions

How we capture system design and the reasoning behind big choices.

## Per-project architecture
Each repo keeps an architecture overview in its `README.md` or `docs/architecture.md`:
the main components, how they talk to each other, and the data flow. A diagram plus a
few paragraphs beats an exhaustive doc nobody reads.

## Architecture Decision Records (ADRs)
For significant, hard-to-reverse choices (a framework, a protocol, a data model), write a
short ADR in `docs/architecture/NNNN-<title>.md`:
- **Context** — the problem and constraints
- **Decision** — what we chose
- **Consequences** — trade-offs; what it enables or blocks

Number them sequentially. **Don't edit old ADRs** — supersede them with a new one so the
history of reasoning stays intact.
