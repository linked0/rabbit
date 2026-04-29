import { AgentConfig, AgentResponse } from "./types";
/**
 * Core agent orchestrator — this is the "secret sauce" that should
 * remain proprietary. In a real scenario, this contains:
 *   - Prompt chaining logic
 *   - Tool call routing and retry strategies
 *   - Safety layer enforcement
 *   - Internal reasoning patterns
 */
export declare function createAgent(config: AgentConfig): {
    run(userMessage: string): Promise<AgentResponse>;
};
