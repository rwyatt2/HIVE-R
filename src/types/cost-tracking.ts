/**
 * LLM Cost Tracking Types
 *
 * TypeScript types for the llm_usage table and associated query results.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/** A single LLM API call usage record */
export interface LLMUsageEntry {
    id: string;
    agentName: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
    threadId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

/** Input for logging a new usage entry (id and createdAt are auto-generated) */
export interface LogUsageInput {
    agentName: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    latencyMs: number;
    threadId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// AGGREGATION TYPES
// ============================================================================

/** Cost for a single day */
export interface DailyCost {
    date: string;
    totalCost: number;
    totalTokensIn: number;
    totalTokensOut: number;
    callCount: number;
}

/** Cost breakdown by agent */
export interface AgentCost {
    agentName: string;
    totalCost: number;
    totalTokensIn: number;
    totalTokensOut: number;
    callCount: number;
    avgLatencyMs: number;
}

/** Cost breakdown by model */
export interface ModelCost {
    model: string;
    totalCost: number;
    totalTokensIn: number;
    totalTokensOut: number;
    callCount: number;
}

/** Overall cost summary for a time period */
export interface CostSummary {
    period: "day" | "week" | "month" | "all";
    startDate: string;
    endDate: string;
    totalCost: number;
    totalTokensIn: number;
    totalTokensOut: number;
    totalCalls: number;
    byAgent: AgentCost[];
    byModel: ModelCost[];
    byDay: DailyCost[];
}

// ============================================================================
// MODEL PRICING
// ============================================================================

/** Pricing per 1M tokens */
export interface ModelPricing {
    inputPer1M: number;
    outputPer1M: number;
}
