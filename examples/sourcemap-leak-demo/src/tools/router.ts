/**
 * CONFIDENTIAL — Tool routing layer
 *
 * Maps tool names to execution strategies.
 * Includes retry logic, permission checks, and sandboxing rules.
 */

interface ToolDefinition {
  name: string;
  requiresApproval: boolean;
  sandboxLevel: "none" | "basic" | "strict";
  maxRetries: number;
}

const TOOL_REGISTRY: ToolDefinition[] = [
  { name: "read_file", requiresApproval: false, sandboxLevel: "none", maxRetries: 1 },
  { name: "write_file", requiresApproval: true, sandboxLevel: "basic", maxRetries: 0 },
  { name: "bash", requiresApproval: true, sandboxLevel: "strict", maxRetries: 2 },
  { name: "grep", requiresApproval: false, sandboxLevel: "none", maxRetries: 1 },
  { name: "glob", requiresApproval: false, sandboxLevel: "none", maxRetries: 1 },
];

export async function routeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const tool = TOOL_REGISTRY.find((t) => t.name === toolName);
  if (!tool) throw new Error(`Unknown tool: ${toolName}`);

  // Permission gate — in real code this would prompt the user
  if (tool.requiresApproval) {
    console.log(`[INTERNAL] Tool "${toolName}" requires user approval`);
  }

  // Sandbox enforcement
  if (tool.sandboxLevel === "strict") {
    console.log(`[INTERNAL] Applying strict sandbox to "${toolName}"`);
  }

  // Simulate execution
  return `[${toolName}] executed with sandbox=${tool.sandboxLevel}`;
}
