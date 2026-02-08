import { BaseMessage } from "@langchain/core/messages";
/**
 * Extract the user's original query from messages
 */
export declare const extractUserQuery: (messages: BaseMessage[]) => string;
/**
 * Safe agent wrapper with error handling, retry logic, and semantic cache.
 * Creates an OTel span for each agent invocation.
 *
 * @param fn - The agent function to call
 * @param agentName - Name of the agent (used for cache key, metrics, span)
 * @param messages - Current message state (used for cache key)
 * @param options - Optional: skipCache to bypass cache for this call
 * @param fallbackMessage - Error message if all retries fail
 */
export declare const safeAgentCall: <T>(fn: () => Promise<T>, agentName: string, messages?: BaseMessage[], options?: {
    skipCache?: boolean;
}, fallbackMessage?: string) => Promise<{
    messages: BaseMessage[];
    contributors: string[];
}>;
/**
 * Format contributors for router context
 */
export declare const formatContributorContext: (contributors: string[]) => string;
/**
 * Create consistent agent response with optional direct handoff
 */
export declare const createAgentResponse: (content: string | object, agentName: string, options?: {
    next?: string;
}) => {
    messages: BaseMessage[];
    contributors: string[];
    next?: string;
};
//# sourceMappingURL=utils.d.ts.map