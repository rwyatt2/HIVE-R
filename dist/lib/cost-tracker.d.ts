/**
 * LLM Cost Tracker for HIVE-R
 *
 * Tracks every LLM API call with: agent name, model, tokens in/out,
 * cost, timestamp, latency. Provides aggregation helpers for dashboards.
 *
 * Usage:
 *   import { logUsage, getDailyCost, getAgentCosts } from "./cost-tracker.js";
 *
 *   // Log an LLM call
 *   logUsage({
 *       agentName: "Security",
 *       model: "gpt-4o",
 *       tokensIn: 1500,
 *       tokensOut: 800,
 *       latencyMs: 2340,
 *       threadId: "thread-abc",
 *   });
 *
 *   // Query costs
 *   const today = getDailyCost();             // today's cost
 *   const agents = getAgentCosts("2026-02-01", "2026-02-07");
 */
import Database from "better-sqlite3";
import type { LLMUsageEntry, LogUsageInput, DailyCost, AgentCost, ModelCost, CostSummary, ModelPricing } from "../types/cost-tracking.js";
export declare const MODEL_PRICING: Record<string, ModelPricing>;
/** Initialize the llm_usage table and indexes. Safe to call multiple times. */
export declare function initCostTrackingTable(): void;
/**
 * Calculate cost in USD for a given model and token counts.
 */
export declare function calculateCost(model: string, tokensIn: number, tokensOut: number): number;
/**
 * Log a single LLM API call. Cost is automatically calculated from model pricing.
 */
export declare function logUsage(input: LogUsageInput): LLMUsageEntry;
export declare function getDailyCost(dateStr?: string): DailyCost;
/**
 * Get cost breakdown by agent for a date range.
 * Defaults to last 30 days.
 */
export declare function getAgentCosts(startDate?: string, endDate?: string): AgentCost[];
/**
 * Get cost breakdown by model for a date range.
 */
export declare function getModelCosts(startDate?: string, endDate?: string): ModelCost[];
/**
 * Get a full cost summary for a period (day, week, month, all).
 */
export declare function getCostSummary(period?: "day" | "week" | "month" | "all"): CostSummary;
/**
 * Get total cost for a specific conversation thread.
 */
export declare function getConversationCost(threadId: string): DailyCost | null;
/**
 * Format cost summary as a human-readable text string.
 */
export declare function formatCostSummary(period?: "day" | "week" | "month" | "all"): string;
export interface TopQuery {
    id: string;
    agentName: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
    threadId?: string;
    createdAt: string;
}
/**
 * Get the N most expensive individual LLM calls.
 */
export declare function getTopQueries(limit?: number, startDate?: string, endDate?: string): TopQuery[];
export interface CostProjection {
    currentDailyCost: number;
    projectedMonthlyCost: number;
    daysAnalyzed: number;
    dailyAverage: number;
    trend: "increasing" | "decreasing" | "stable";
    trendPercentage: number;
}
/**
 * Project monthly cost based on recent burn rate.
 * Analyzes the last `daysToAnalyze` days and extrapolates to 30 days.
 */
export declare function getCostProjection(daysToAnalyze?: number): CostProjection;
/**
 * Reset the database connection (for testing).
 * @internal
 */
export declare function _resetDb(newDb?: Database.Database): void;
//# sourceMappingURL=cost-tracker.d.ts.map