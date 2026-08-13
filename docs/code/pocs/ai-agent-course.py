# AI agent build & monetize course — one piece of its arc: conversation-to-lead
# scoring, the step between an agent conversation and deciding it's worth a handoff
# to a human (or a paid follow-up), based on simple keyword signals.

BUYING_SIGNALS = {"pricing": 3, "budget": 3, "buy": 4, "demo": 2, "trial": 2, "contract": 3}
DISQUALIFYING_SIGNALS = {"just browsing": -5, "not interested": -6, "unsubscribe": -6}


def score_conversation(messages: list[str]) -> int:
    """Minimal keyword-signal scorer standing in for the course's conversation-to-lead
    step, upstream of the human-handoff and RAG chapters."""
    text = " ".join(messages).lower()
    score = 0
    for phrase, weight in BUYING_SIGNALS.items():
        if phrase in text:
            score += weight
    for phrase, weight in DISQUALIFYING_SIGNALS.items():
        if phrase in text:
            score += weight
    return score


def classify(score: int) -> str:
    if score >= 6:
        return "hot lead -> human handoff"
    if score >= 2:
        return "warm lead -> nurture sequence"
    return "not a lead -> continue automated support"


if __name__ == "__main__":
    print("AI agent course — conversation-to-lead scoring\n")

    conversations = {
        "A": ["Hi, what's your pricing for the pro plan?", "Can we set up a demo this week?"],
        "B": ["I'm just browsing, thanks."],
        "C": ["How does the trial work?"],
    }

    for name, messages in conversations.items():
        score = score_conversation(messages)
        print(f"Conversation {name}: {messages}")
        print(f"  score={score} -> {classify(score)}\n")
