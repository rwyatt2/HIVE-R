import { AgentState } from "../lib/state.js";
export declare const routerFallbackMetrics: {
    level0: number;
    level1: number;
    level2: number;
    level3: number;
    total: number;
};
interface RuleBasedResult {
    next: string;
    reasoning: string;
}
/**
 * Rule-based routing using keyword matching.
 * Used as the final fallback when all LLM providers are unavailable.
 *
 * Uses word-boundary regex to avoid false positives (e.g., "build" containing "ui").
 *
 * @param query - The user's message text
 * @returns The matched agent and reasoning
 */
export declare function ruleBasedRoute(query: string): RuleBasedResult;
export declare const routerNode: (state: typeof AgentState.State) => Promise<{
    next: string;
    turnCount?: undefined;
} | {
    next: string;
    turnCount: number;
}>;
export { HIVE_MEMBERS } from "../lib/prompts.js";
//# sourceMappingURL=router.d.ts.map