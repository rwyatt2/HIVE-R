import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { AgentState } from "./state.js";
import { logger } from "./logger.js";
import { recordAgentInvocation } from "./metrics.js";
import { withSpan } from "./tracer.js";

/**
 * Safe agent wrapper with error handling and retry logic.
 * Creates an OTel span for each agent invocation.
 */
export const safeAgentCall = async <T>(
    fn: () => Promise<T>,
    agentName: string,
    fallbackMessage: string = "I encountered an error processing this request."
): Promise<{ messages: BaseMessage[]; contributors: string[] }> => {
    recordAgentInvocation(agentName);

    return withSpan(`hive.agent.${agentName}`, async (span) => {
        span.setAttribute("agent.name", agentName);
        const startMs = Date.now();
        const maxRetries = 2;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await fn() as { messages: BaseMessage[]; contributors: string[] };
                span.setAttribute("agent.duration_ms", Date.now() - startMs);
                return result;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                logger.warn({ agentName, attempt, maxRetries, err: lastError }, `${agentName} attempt ${attempt}/${maxRetries} failed`);

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                }
            }
        }

        // All retries exhausted
        span.setAttribute("agent.duration_ms", Date.now() - startMs);
        logger.error({ agentName, maxRetries, err: lastError }, `${agentName} failed after ${maxRetries} attempts`);

        return {
            messages: [
                new HumanMessage({
                    content: `**[${agentName} Error]**: ${fallbackMessage}\n\n_Error: ${lastError?.message}_`,
                    name: agentName,
                }),
            ],
            contributors: [agentName],
        };
    });
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
 * Create consistent agent response with optional direct handoff
 */
export const createAgentResponse = (
    content: string | object,
    agentName: string,
    options?: { next?: string }
): { messages: BaseMessage[]; contributors: string[]; next?: string } => {
    const messageContent = typeof content === "string"
        ? content
        : JSON.stringify(content, null, 2);

    const response: { messages: BaseMessage[]; contributors: string[]; next?: string } = {
        messages: [
            new HumanMessage({
                content: messageContent,
                name: agentName,
            }),
        ],
        contributors: [agentName],
    };

    // Support direct handoff
    if (options?.next) {
        response.next = options.next;
        logger.info({ agentName, next: options.next, event: 'handoff' }, `${agentName} requesting handoff to ${options.next}`);
    }

    return response;
};

/**
 * Extract the user's original query from messages
 */
export const extractUserQuery = (messages: BaseMessage[]): string => {
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

