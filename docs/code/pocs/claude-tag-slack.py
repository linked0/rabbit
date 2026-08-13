"""'Claude Tag' for Slack (on hold, not yet scoped): a minimal skeleton
showing the shape of the idea -- a Slack event handler that dispatches
mentions of @Claude to a stub responder.
"""

def handle_slack_event(event):
    if event.get("type") == "app_mention" and "@Claude" in event.get("text", ""):
        return claude_tag_responder(event)
    return {"handled": False, "reason": "not a Claude Tag mention"}


def claude_tag_responder(event):
    # Stub: real version would call Claude with the message + thread context
    # via Notion<->Slack connectors. Not yet scoped.
    return {
        "handled": True,
        "channel": event["channel"],
        "reply": f"(stub) Claude Tag would respond to: {event['text']!r}",
    }


mock_events = [
    {"type": "app_mention", "channel": "#general", "text": "@Claude summarize this thread"},
    {"type": "message", "channel": "#general", "text": "no mention here"},
]

for event in mock_events:
    result = handle_slack_event(event)
    print(f"event={event['type']!r} text={event['text']!r} -> {result}")
