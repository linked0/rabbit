"""Alibaba page-agent: match a natural-language command against a small set
of in-page DOM-like actions (text-based, no screenshots/extension) and
"execute" the matched one.
"""

def click_submit():
    return "clicked #submit-button"

def fill_email(value="user@example.com"):
    return f"filled #email-input with {value!r}"

def scroll_to_pricing():
    return "scrolled to #pricing-section"


# The "DOM" of actions this page exposes to the agent, keyed by intent phrase.
PAGE_ACTIONS = {
    "click the submit button": click_submit,
    "fill in the email field": fill_email,
    "scroll to pricing": scroll_to_pricing,
}


def match_command(nl_command, actions):
    nl_command = nl_command.lower().strip()
    if nl_command in actions:
        return nl_command
    # naive fallback: substring match against known phrases
    for phrase in actions:
        if phrase in nl_command or nl_command in phrase:
            return phrase
    return None


def run_agent(nl_command):
    phrase = match_command(nl_command, PAGE_ACTIONS)
    if phrase is None:
        return f"no matching in-page action for: {nl_command!r}"
    action_result = PAGE_ACTIONS[phrase]()
    return f"matched {phrase!r} -> {action_result}"


commands = [
    "click the submit button",
    "please fill in the email field",
    "scroll to pricing",
    "delete my account",
]

for cmd in commands:
    print(f"> {cmd}\n  {run_agent(cmd)}")
