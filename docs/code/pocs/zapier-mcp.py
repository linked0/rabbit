# Zapier MCP — consuming someone else's MCP server as a client. Simulates an event
# trigger being matched to an allowlisted rule, which then invokes an MCP-style tool.

from dataclasses import dataclass
from typing import Callable


@dataclass
class Rule:
    event_type: str
    tool_name: str
    handler: Callable[[dict], str]


def send_email_to_self(payload: dict) -> str:
    return f"[Gmail MCP tool] sent '{payload['subject']}' to self"


def create_notion_page(payload: dict) -> str:
    return f"[Notion MCP tool] created page '{payload['title']}'"


# Explicit allowlist — same safety boundary the card's howItWorks names: an agent
# only gets tools for actions that were pre-approved, never unrestricted account access.
ALLOWED_RULES = [
    Rule(event_type="new_lead", tool_name="gmail.send_email", handler=send_email_to_self),
    Rule(event_type="new_task", tool_name="notion.create_page", handler=create_notion_page),
]


def match_rule(event_type: str) -> Rule | None:
    return next((r for r in ALLOWED_RULES if r.event_type == event_type), None)


def dispatch(event_type: str, payload: dict) -> str:
    rule = match_rule(event_type)
    if rule is None:
        return f"[blocked] no allowlisted rule for event '{event_type}'"
    result = rule.handler(payload)
    return f"trigger={event_type} -> tool={rule.tool_name} -> {result}"


if __name__ == "__main__":
    print("Zapier MCP — event trigger -> matched rule -> MCP tool invocation\n")

    events = [
        ("new_lead", {"subject": "Follow up with Acme Corp"}),
        ("new_task", {"title": "Draft Q3 roadmap"}),
        ("delete_account", {"user_id": "123"}),  # not allowlisted
    ]

    for event_type, payload in events:
        print(dispatch(event_type, payload))
