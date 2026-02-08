import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { AgentState } from "./state.js";
import { logger } from "./logger.js";
import { recordAgentInvocation } from "./metrics.js";
import { withSpan } from "./tracer.js";
import { semanticCache } from "./semantic-cache.js";
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
export const safeAgentCall = async (fn, agentName, messages = [], options, fallbackMessage = "I encountered an error processing this request.") => {
    recordAgentInvocation(agentName);
    return withSpan(`hive.agent.${agentName}`, async (span) => {
        span.setAttribute("agent.name", agentName);
        const startMs = Date.now();
        // ── Cache check ─────────────────────────────────────────────
        if (!options?.skipCache && semanticCache.isCacheable(agentName)) {
            const query = extractUserQuery(messages);
            if (query) {
                const cached = await semanticCache.get(agentName, query);
                if (cached) {
                    span.setAttribute("cache.hit", true);
                    span.setAttribute("agent.duration_ms", Date.now() - startMs);
                    logger.info({ agentName, event: "cache_hit" }, `${agentName}: cache hit`);
                    return cached;
                }
                span.setAttribute("cache.hit", false);
            }
        }
        // ── Agent invocation with retries ────────────────────────────
        const maxRetries = 2;
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await fn();
                span.setAttribute("agent.duration_ms", Date.now() - startMs);
                // Cache the successful result
                if (!options?.skipCache && semanticCache.isCacheable(agentName)) {
                    const query = extractUserQuery(messages);
                    if (query) {
                        // Fire-and-forget cache write
                        semanticCache.set(agentName, query, result).catch((err) => {
                            logger.warn({ err, agentName }, "Cache set failed (non-fatal)");
                        });
                    }
                }
                return result;
            }
            catch (error) {
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
export const formatContributorContext = (contributors) => {
    if (!contributors || contributors.length === 0) {
        return "";
    }
    return `\n\n**Agents who have already contributed**: ${contributors.join(", ")}`;
};
/**
 * Create consistent agent response with optional direct handoff
 */
export const createAgentResponse = (content, agentName, options) => {
    const messageContent = typeof content === "string"
        ? content
        : JSON.stringify(content, null, 2);
    const response = {
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
//# sourceMappingURL=utils.js.map