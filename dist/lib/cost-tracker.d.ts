/**
 * Cost Tracker for HIVE-R
 *
 * Tracks token usage and estimated costs per conversation.
 */
interface ConversationCost {
    threadId: string;
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCost: number;
    calls: number;
    model: string;
}
interface CostSummary {
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCalls: number;
    conversations: number;
    avgCostPerConversation: number;
    costByModel: Record<string, number>;
}
/**
 * Record token usage for a conversation
 */
export declare function recordUsage(threadId: string, inputTokens: number, outputTokens: number, model?: string): void;
/**
 * Get cost for a specific conversation
 */
export declare function getConversationCost(threadId: string): ConversationCost | null;
/**
 * Get overall cost summary
 */
export declare function getCostSummary(): CostSummary;
/**
 * Format cost summary for display
 */
export declare function formatCostSummary(): string;
/**
 * Reset cost tracking
 */
export declare function resetCostTracking(): void;
export {};
//# sourceMappingURL=cost-tracker.d.ts.map