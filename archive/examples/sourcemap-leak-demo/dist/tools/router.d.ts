/**
 * CONFIDENTIAL — Tool routing layer
 *
 * Maps tool names to execution strategies.
 * Includes retry logic, permission checks, and sandboxing rules.
 */
export declare function routeTool(toolName: string, args: Record<string, unknown>): Promise<string>;
