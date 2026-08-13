# Google Skills Repository — same family as Claude's SKILL.md ecosystem: distilled
# knowledge packaged as trigger-matched skills. Simulates the lookup mechanism: a
# list of {trigger_keywords, action} matched against free-text input.

from dataclasses import dataclass


@dataclass
class Skill:
    name: str
    trigger_keywords: list[str]
    action: str


SKILLS = [
    Skill("architecture-review", ["architecture", "design doc", "scalability"], "Run the architecture review checklist"),
    Skill("product-launch", ["launch", "go-to-market", "rollout"], "Apply the product launch playbook"),
    Skill("best-practice-code", ["code review", "refactor", "best practice"], "Apply the coding best-practices skill"),
]


def match_skill(user_input: str) -> Skill | None:
    """Same trigger-matching idea a SKILL.md description drives: the first skill
    whose keywords appear in the input wins."""
    lowered = user_input.lower()
    for skill in SKILLS:
        if any(keyword in lowered for keyword in skill.trigger_keywords):
            return skill
    return None


if __name__ == "__main__":
    print("Google Skills Repository — trigger-keyword matching against user input\n")

    inputs = [
        "Can you review this architecture for scalability issues?",
        "We're planning the launch and need a go-to-market plan.",
        "Please refactor this function, following best practice.",
        "What's the weather like today?",
    ]

    for text in inputs:
        skill = match_skill(text)
        if skill:
            print(f"input: {text!r}\n  -> matched skill '{skill.name}': {skill.action}\n")
        else:
            print(f"input: {text!r}\n  -> no skill matched\n")
