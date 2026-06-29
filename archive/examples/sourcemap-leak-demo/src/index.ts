/**
 * Public API — this is the only part users are supposed to see.
 * The internal agent orchestration, prompt templates, and tool routing
 * logic should remain proprietary.
 */
export { createAgent } from "./agent/orchestrator";
export type { AgentConfig, AgentResponse } from "./agent/types";
