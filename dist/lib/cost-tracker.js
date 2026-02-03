/**
 * Cost Tracker for HIVE-R
 *
 * Tracks token usage and estimated costs per conversation.
 */
import { logger } from "./logger.js";
// ============================================================================
// PRICING (per 1K tokens, as of 2024)
// ============================================================================
const PRICING = {
    "gpt-4o": { input: 0.005, output: 0.015 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "gpt-4-turbo": { input: 0.01, output: 0.03 },
    "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
};
// ============================================================================
// COST STORE
// ============================================================================
const conversationUsage = new Map();
// ============================================================================
// PUBLIC API
// ============================================================================
/**
 * Record token usage for a conversation
 */
export function recordUsage(threadId, inputTokens, outputTokens, model = "gpt-4o") {
    if (!conversationUsage.has(threadId)) {
        conversationUsage.set(threadId, []);
    }
    conversationUsage.get(threadId).push({
        inputTokens,
        outputTokens,
        model,
        timestamp: Date.now(),
    });
    const pricing = PRICING[model] ?? PRICING["gpt-4o"];
    const cost = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
    logger.debug("💰 Token usage recorded", {
        threadId: threadId.substring(0, 8),
        inputTokens,
        outputTokens,
        cost: `$${cost.toFixed(4)}`
    });
}
/**
 * Get cost for a specific conversation
 */
export function getConversationCost(threadId) {
    const usage = conversationUsage.get(threadId);
    if (!usage || usage.length === 0)
        return null;
    const totalInputTokens = usage.reduce((sum, u) => sum + u.inputTokens, 0);
    const totalOutputTokens = usage.reduce((sum, u) => sum + u.outputTokens, 0);
    const model = usage[0].model;
    const pricing = PRICING[model] ?? PRICING["gpt-4o"];
    return {
        threadId,
        totalInputTokens,
        totalOutputTokens,
        estimatedCost: (totalInputTokens / 1000) * pricing.input + (totalOutputTokens / 1000) * pricing.output,
        calls: usage.length,
        model,
    };
}
/**
 * Get overall cost summary
 */
export function getCostSummary() {
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCalls = 0;
    const costByModel = {};
    for (const [_, usage] of conversationUsage) {
        for (const u of usage) {
            const pricing = PRICING[u.model] ?? PRICING["gpt-4o"];
            const cost = (u.inputTokens / 1000) * pricing.input + (u.outputTokens / 1000) * pricing.output;
            totalCost += cost;
            totalInputTokens += u.inputTokens;
            totalOutputTokens += u.outputTokens;
            totalCalls++;
            costByModel[u.model] = (costByModel[u.model] ?? 0) + cost;
        }
    }
    const conversations = conversationUsage.size;
    return {
        totalCost,
        totalInputTokens,
        totalOutputTokens,
        totalCalls,
        conversations,
        avgCostPerConversation: conversations > 0 ? totalCost / conversations : 0,
        costByModel,
    };
}
/**
 * Format cost summary for display
 */
export function formatCostSummary() {
    const summary = getCostSummary();
    return `
💰 Cost Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Cost:        $${summary.totalCost.toFixed(4)}
Input Tokens:      ${summary.totalInputTokens.toLocaleString()}
Output Tokens:     ${summary.totalOutputTokens.toLocaleString()}
Total Calls:       ${summary.totalCalls}
Conversations:     ${summary.conversations}
Avg/Conversation:  $${summary.avgCostPerConversation.toFixed(4)}
━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}
/**
 * Reset cost tracking
 */
export function resetCostTracking() {
    conversationUsage.clear();
    logger.info("💰 Cost tracking reset");
}
//# sourceMappingURL=cost-tracker.js.map