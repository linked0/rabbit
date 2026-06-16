#!/usr/bin/env python3
"""Day 7 — Prompt engineering for a local-LLM Solidity auditor.

Four techniques in one prompt:
  1. system prompt  — fix role + rules (precise auditor, cite the line, strict XML)
  2. few-shot       — one SAFE function -> "no finding" so the model learns the
                      format for BOTH the vulnerable and the clean case
  3. chain-of-thought (CoT) — a <reasoning> step before the verdict
  4. XML tags       — delimit input <contract> and output <finding> schema

The exercise adds technique (2): without the safe example the model tends to
hallucinate a "finding" for clean code just to fill the schema. The few-shot
shows it that severity="none" with an empty <line/> is a valid answer.

Run:  uv run python audit_prompt.py        (needs Ollama + `ollama pull llama3.1:70b`)
"""

import ollama

MODEL = "llama3.1:70b"

# 1) system prompt — role + hard constraints
SYSTEM = """You are a precise Solidity auditor.
Rules:
- Report only issues you can justify; never invent one to fill the schema.
- If the function is safe, return severity=none with an empty <line/>.
- Cite the exact line of the issue.
- Output STRICTLY in the given XML schema, nothing before or after it."""

# 2) few-shot — a SAFE function teaches the "no finding" shape (the exercise)
FEWSHOT_USER = """<contract>
function deposit() public payable { bal[msg.sender] += msg.value; }
</contract>
<task>Find the single most severe vulnerability.</task>
<format><finding><severity/><line/><why/></finding></format>"""

FEWSHOT_ASSISTANT = """<finding>
  <severity>none</severity>
  <line></line>
  <why>State is updated with checked arithmetic and there is no external call; nothing exploitable.</why>
</finding>"""

# the real contract to screen (state update AFTER the external call -> reentrancy)
TARGET = """<contract>
function withdraw() public {
  (bool ok,) = msg.sender.call{value: bal[msg.sender]}("");
  require(ok);
  bal[msg.sender] = 0;
}
</contract>
<task>Find the single most severe vulnerability.</task>
<format><finding><severity/><line/><why/></finding></format>"""


def audit(contract_prompt: str) -> str:
    """Run the auditor with the few-shot pair primed in the message history."""
    resp = ollama.chat(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM},
            # 2) few-shot exemplar: safe input -> "no finding" output
            {"role": "user", "content": FEWSHOT_USER},
            {"role": "assistant", "content": FEWSHOT_ASSISTANT},
            # now the real question, same format
            {"role": "user", "content": contract_prompt},
        ],
        options={"temperature": 0},
    )
    return resp["message"]["content"].strip()


if __name__ == "__main__":
    print("=== vulnerable withdraw() — expect a reentrancy finding ===")
    print(audit(TARGET))

    print("\n=== safe view function — expect severity=none ===")
    safe = """<contract>
function balanceOf(address a) public view returns (uint) { return bal[a]; }
</contract>
<task>Find the single most severe vulnerability.</task>
<format><finding><severity/><line/><why/></finding></format>"""
    print(audit(safe))
