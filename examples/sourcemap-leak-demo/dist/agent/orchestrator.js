"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgent = createAgent;
const templates_1 = require("../prompts/templates");
const router_1 = require("../tools/router");
/**
 * Core agent orchestrator — this is the "secret sauce" that should
 * remain proprietary. In a real scenario, this contains:
 *   - Prompt chaining logic
 *   - Tool call routing and retry strategies
 *   - Safety layer enforcement
 *   - Internal reasoning patterns
 */
function createAgent(config) {
    // Build the internal prompt chain (proprietary logic)
    const chain = buildPromptChain(config);
    return {
        async run(userMessage) {
            const toolCalls = [];
            let turnCount = 0;
            // Agentic loop — iteratively call tools until done or max turns
            while (turnCount < config.maxTurns) {
                turnCount++;
                const decision = decideNextAction(userMessage, chain, toolCalls);
                if (decision === "DONE")
                    break;
                const result = await (0, router_1.routeTool)(decision, {});
                toolCalls.push({ name: decision, args: {}, result });
            }
            return {
                content: `Processed with ${turnCount} turns`,
                toolCalls,
                turnCount,
            };
        },
    };
}
/** PROPRIETARY: builds the full prompt chain including hidden instructions */
function buildPromptChain(config) {
    return {
        systemPrompt: templates_1.SYSTEM_PROMPT,
        chainOfThought: [
            "1. Parse user intent",
            "2. Select optimal tool sequence",
            "3. Execute with retry on failure",
            "4. Synthesize results",
        ],
        hiddenInstructions: templates_1.HIDDEN_INSTRUCTIONS,
        safetyLayer: "SAFETY: reject if confidence < 0.7, escalate if ambiguous",
    };
}
/** PROPRIETARY: decides which tool to call next based on internal heuristics */
function decideNextAction(message, chain, history) {
    // Simplified decision logic — real version would be much more complex
    if (history.length === 0 && message.includes("file"))
        return "read_file";
    if (history.length === 0 && message.includes("search"))
        return "grep";
    if (history.length === 0)
        return "bash";
    return "DONE";
}
//# sourceMappingURL=orchestrator.js.map