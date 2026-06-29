# spagetti — MCP server (Task 4)

A minimal [MCP](https://modelcontextprotocol.io) server exposing one tool,
**`recommend_spaghetti_recipe`**, over stdio. Recipes are hardcoded (mirror of
[`../lib/spaghetti.ts`](../lib/spaghetti.ts)).

## Run
```bash
cd spagetties
pnpm install          # installs @modelcontextprotocol/sdk + zod (separate from the app)
pnpm start            # node server.mjs  → MCP server on stdio
```

## Tool
- `recommend_spaghetti_recipe({ preferences?: string })` → returns one recipe (text).
  - `preferences` examples: `"spicy"`, `"크림"`, `"cheese"`, `"tomato"`, `"simple"`.

## How the rabbit chat uses it
The AI chat (`/chat`) has an **on/off toggle**. When **on**, the chat is given the
spaghetti recipe capability (v1 wires it through the same `lib/spaghetti.ts` source); when
**off**, it's a plain chat. To wire this server as a live MCP source to an MCP-capable client
(e.g. Claude Desktop), point the client at:
```json
{ "mcpServers": { "spagetti": { "command": "node", "args": ["<abs>/spagetties/server.mjs"] } } }
```

> Targets `@modelcontextprotocol/sdk` ^1.x. If your installed SDK's API differs
> (`registerTool` vs `tool`), adjust the registration call accordingly.
