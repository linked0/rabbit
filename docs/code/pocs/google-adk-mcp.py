# Google ADK — agent-as-MCP-server: a small agent function served through a mock
# MCP-style tool registry (name -> handler), invoked by name the way an MCP client
# would call a tool exposed by another agent.

from typing import Callable


class MCPRegistry:
    """Mimics an MCP server's tool registry: a mapping from tool name to handler,
    with the schema an MCP `tools/list` call would return."""

    def __init__(self):
        self._tools: dict[str, Callable[[dict], dict]] = {}
        self._schemas: dict[str, dict] = {}

    def register(self, name: str, schema: dict, handler: Callable[[dict], dict]) -> None:
        self._tools[name] = handler
        self._schemas[name] = schema

    def list_tools(self) -> list[dict]:
        return [{"name": name, **schema} for name, schema in self._schemas.items()]

    def call(self, name: str, arguments: dict) -> dict:
        if name not in self._tools:
            raise KeyError(f"no MCP tool registered as '{name}'")
        return self._tools[name](arguments)


def verex_desk_subagent(arguments: dict) -> dict:
    """A stand-in for an ADK-wrapped verex-desk subagent, served as a single tool."""
    query = arguments.get("query", "")
    if "invoice" in query.lower():
        return {"answer": "Invoice status: pending approval.", "confidence": 0.9}
    return {"answer": f"No specialized handling for: {query}", "confidence": 0.2}


if __name__ == "__main__":
    print("ADK agent served as an MCP tool — mock registry, called by name\n")

    registry = MCPRegistry()
    registry.register(
        name="verex_desk.query",
        schema={"description": "Query the verex-desk subagent", "input": {"query": "string"}},
        handler=verex_desk_subagent,
    )

    print("Available tools (as an MCP client would list them):")
    for tool in registry.list_tools():
        print(f"  - {tool}")

    print("\nInvoking tool by name, as Claude would over MCP:")
    for query in ["What's the status of invoice #42?", "What's the weather?"]:
        result = registry.call("verex_desk.query", {"query": query})
        print(f"  call(verex_desk.query, query={query!r}) -> {result}")
