# Harness Engineering Applied to Projects (2026-03-24)

> **Category**: Technique
>
> Studied the concept of Harness Engineering — building enforced environments (linters, rules, CPS docs, domain models) so any AI model produces consistent, high-quality output. Mapped concrete application steps to Verex, Web, and Task repos.

---

## What was done

- Analyzed a Korean YouTube video explaining **Harness Engineering**: the practice of building structural constraints around AI so output quality depends on the harness, not the model
- Identified three pillars: **CPS documentation** (Context-Problem-Solution), **Linter-based enforcement**, and **Agent evaluation (Agent Dog)**
- Mapped each pillar to concrete actions across three projects:

### `verex` Prediction Market Monorepo

- Path-scoped `.claude/rules/` per package: contracts, api, web, sdk
- Solhint for Solidity naming (events, errors, function ordering)
- ESLint rules for API route handlers and page naming conventions
- Pre-commit hooks (husky + lint-staged) blocking non-compliant code
- Custom `.claude/agents/issue-analyzer.md` for automated issue triage with CPS

### `web` Smart Contracts (Hardhat + Foundry)

- Domain modeling rule: AI must output storage layout + inheritance hierarchy before writing contract code
- CEI pattern (Checks-Effects-Interactions) enforced via linter rules
- Foundry test naming conventions: `test_RevertWhen_*`, `test_ShouldSucceed_*`
- No hardcoded keys in config — enforce env var usage

### `task` Issue Management

- Agent that reads issues and generates CPS documents before proposing changes
- Verification step: tests pass + lint clean before closing any issue

## Techniques & Learnings

- **CPS (Context-Problem-Solution)**: Every task starts with a structured doc that anchors the AI's reasoning. Prevents "drift" where the model solves the wrong problem.
- **Linter as Harness**: The most practical technique — define naming, import, and structure rules in linter config. If AI output breaks rules, the commit is blocked. This creates *deterministic output* regardless of which model is used.
- **Domain Modeling (DDD) before code**: Make the AI design the data model hierarchy first, then implement. Especially critical for smart contracts where mistakes are immutable.
- **Agent Dog (Evaluation)**: Build org-specific evaluation metrics beyond generic benchmarks. Monitor AI output quality continuously like you'd monitor server health with Datadog.
- **Key insight**: Invest time in building the harness (linters, rules, pre-commit hooks) rather than perfecting prompts. The harness compounds over time; prompt tuning doesn't.

## Priority Action Items

| # | Action | Project |
|---|--------|---------|
| 1 | Add `.claude/rules/` with per-package path-scoped rules | verex |
| 2 | Set up pre-commit hooks (husky + lint-staged) | verex |
| 3 | Create CPS template for agents to fill before coding | All |
| 4 | Add `.claude/agents/issue-analyzer.md` | verex |
| 5 | Add Solhint rules for Solidity conventions | web, verex |

## Idiom of the Day

> *"A chain is only as strong as its weakest link"* — the overall quality of something is limited by its worst component. One weak part can undermine everything else.

**In context**: Without a proper harness, our AI pipeline is only as strong as its weakest link — one bad prompt or unchecked output can break the entire workflow. That's why we enforce quality at every step with linters and rules.

---

[← Back to Daily Log Summary](../summary.md)
