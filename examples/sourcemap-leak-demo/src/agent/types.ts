export interface AgentConfig {
  model: string;
  maxTurns: number;
  tools: string[];
}

export interface AgentResponse {
  content: string;
  toolCalls: ToolCall[];
  turnCount: number;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

/** Internal — should never be visible to package consumers */
export interface InternalPromptChain {
  systemPrompt: string;
  chainOfThought: string[];
  hiddenInstructions: string[];
  safetyLayer: string;
}
