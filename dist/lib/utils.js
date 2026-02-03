import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { AgentState } from "./state.js";
/**
 * Safe agent wrapper with error handling and retry logic
 */
export const safeAgentCall = async (fn, agentName, fallbackMessage = "I encountered an error processing this request.") => {
    const maxRetries = 2;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
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
export const formatContributorContext = (contributors) => {
    if (!contributors || contributors.length === 0) {
        return "";
    }
    return `\n\n**Agents who have already contributed**: ${contributors.join(", ")}`;
};
/**
 * Create consistent agent response
 */
export const createAgentResponse = (content, agentName) => {
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
/**
 * Extract the user's original query from messages
 */
export const extractUserQuery = (messages) => {
    // Find the first human message (the original user request)
    for (const msg of messages) {
        if (msg._getType() === "human" && !("name" in msg)) {
            return typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
        }
    }
    // Fallback to last message content
    const last = messages[messages.length - 1];
    return typeof last?.content === "string" ? last.content : "";
};
//# sourceMappingURL=utils.js.map