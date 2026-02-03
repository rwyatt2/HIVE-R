import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { AgentState } from "./state.js";

/**
 * Safe agent wrapper with error handling and retry logic
 */
export const safeAgentCall = async <T>(
    fn: () => Promise<T>,
    agentName: string,
    fallbackMessage: string = "I encountered an error processing this request."
): Promise<{ messages: BaseMessage[]; contributors: string[] }> => {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn() as { messages: BaseMessage[]; contributors: string[] };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`⚠️ ${agentName} attempt ${attempt}/${maxRetries} failed:`, lastError.message);

            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
        }
    }

    // All retries exhausted, return error message
    console.error(`❌ ${agentName} failed after ${maxRetries} attempts`);

    return {
        messages: [
            new HumanMessage({
                content: `**[${agentName} Error]**: ${fallbackMessage}\n\n_Error: ${lastError?.message}_`,
                name: agentName,
            }),
        ],
        contributors: [agentName],
    };
};

/**
 * Format contributors for router context
 */
export const formatContributorContext = (contributors: string[]): string => {
    if (!contributors || contributors.length === 0) {
        return "";
    }
    return `\n\n**Agents who have already contributed**: ${contributors.join(", ")}`;
};

/**
 * Create consistent agent response
 */
export const createAgentResponse = (
    content: string | object,
    agentName: string
): { messages: BaseMessage[]; contributors: string[] } => {
    const messageContent = typeof content === "string"
        ? content
        : JSON.stringify(content, null, 2);

    return {
        messages: [
            new HumanMessage({
                content: messageContent,
                name: agentName,
            }),
        ],
        contributors: [agentName],
    };
};
