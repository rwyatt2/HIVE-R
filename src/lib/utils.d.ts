import { BaseMessage } from "@langchain/core/messages";
/**
 * Safe agent wrapper with error handling and retry logic
 */
export declare const safeAgentCall: <T>(fn: () => Promise<T>, agentName: string, fallbackMessage?: string) => Promise<{
    messages: BaseMessage[];
    contributors: string[];
}>;
/**
 * Format contributors for router context
 */
export declare const formatContributorContext: (contributors: string[]) => string;
/**
 * Create consistent agent response
 */
export declare const createAgentResponse: (content: string | object, agentName: string) => {
    messages: BaseMessage[];
    contributors: string[];
};
//# sourceMappingURL=utils.d.ts.map