"""Slack -> Claude -> Notion pipeline: a Slack thread gets summarized by
Claude and logged to Notion, simulated as mocked function calls in sequence.
"""

def fetch_slack_thread(channel, ts):
    return {
        "channel": channel,
        "messages": [
            {"user": "jay", "text": "circuit breaker rollout looks good"},
            {"user": "dev", "text": "half-open probe needs a shorter cooldown"},
            {"user": "jay", "text": "agreed, let's ship with 30s cooldown"},
        ],
    }


def claude_summarize(thread):
    # Mocked "Claude" summarization step -- no real API call.
    texts = [m["text"] for m in thread["messages"]]
    return {
        "title": "Circuit breaker rollout decision",
        "summary": f"{len(texts)} messages -> decided: ship with 30s half-open cooldown.",
    }


def notion_write(page):
    # Mocked "Notion" write step -- no real API call.
    return {"page_id": "notion-page-001", "url": f"https://notion.so/{page['title'].replace(' ', '-')}"}


thread = fetch_slack_thread(channel="#eng", ts="1723500000.001")
print(f"1. fetched Slack thread from {thread['channel']} ({len(thread['messages'])} messages)")

summary = claude_summarize(thread)
print(f"2. Claude summarized -> \"{summary['title']}\": {summary['summary']}")

page = notion_write(summary)
print(f"3. wrote to Notion -> {page['url']} (id={page['page_id']})")
