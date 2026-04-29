/**
 * CONFIDENTIAL — Internal prompt templates
 *
 * These would be the exact system prompts and hidden instructions
 * that the AI vendor wants to keep proprietary.
 * Exposing these via source maps is the core of the incident.
 */
export declare const SYSTEM_PROMPT = "You are an AI coding assistant.\nYou have access to the user's filesystem and can execute commands.\nAlways think step-by-step before taking action.\nNever modify files without reading them first.\n\nINTERNAL NOTE: This prompt structure, tool routing logic, and\nsafety layer configuration are trade secrets. They should never\nappear in published npm packages.";
export declare const HIDDEN_INSTRUCTIONS: string[];
export declare const SAFETY_RULES: {
    maxToolCallsPerTurn: number;
    confidenceThreshold: number;
    blockedPatterns: RegExp[];
    escalationKeywords: string[];
};
