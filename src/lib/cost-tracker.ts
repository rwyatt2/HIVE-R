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
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { optimizeDatabase } from "./db-init.js";
import { logger } from "./logger.js";
import type {
    LLMUsageEntry,
    LogUsageInput,
    DailyCost,
    AgentCost,
    ModelCost,
    CostSummary,
    ModelPricing,
} from "../types/cost-tracking.js";

// ============================================================================
// MODEL PRICING (per 1M tokens, USD)
// Update when OpenAI changes pricing.
// ============================================================================

export const MODEL_PRICING: Record<string, ModelPricing> = {
    "gpt-4o": { inputPer1M: 5.00, outputPer1M: 15.00 },
    "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.60 },
    "gpt-4-turbo": { inputPer1M: 10.00, outputPer1M: 30.00 },
    "gpt-4": { inputPer1M: 30.00, outputPer1M: 60.00 },
    "gpt-3.5-turbo": { inputPer1M: 0.50, outputPer1M: 1.50 },
    "claude-3-5-sonnet": { inputPer1M: 3.00, outputPer1M: 15.00 },
    "claude-3-haiku": { inputPer1M: 0.25, outputPer1M: 1.25 },
};

/** Default pricing for unknown models */
const DEFAULT_PRICING: ModelPricing = { inputPer1M: 5.00, outputPer1M: 15.00 };

// ============================================================================
// DATABASE
// ============================================================================

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";
let db: Database.Database | null = null;

function getDb(): Database.Database {
    if (!db) {
        const dbDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        db = new Database(DB_PATH);
        optimizeDatabase(db);

        // Create table + indexes inline so the table is always available
        // before any budget check or query. Safe to run multiple times.
        db.exec(`
            CREATE TABLE IF NOT EXISTS llm_usage (
                id            TEXT PRIMARY KEY,
                agent_name    TEXT NOT NULL,
                model         TEXT NOT NULL,
                tokens_in     INTEGER NOT NULL,
                tokens_out    INTEGER NOT NULL,
                cost_usd      REAL NOT NULL,
                latency_ms    INTEGER NOT NULL,
                thread_id     TEXT,
                user_id       TEXT,
                metadata      TEXT,
                created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_llm_usage_agent   ON llm_usage(agent_name);
            CREATE INDEX IF NOT EXISTS idx_llm_usage_model   ON llm_usage(model);
            CREATE INDEX IF NOT EXISTS idx_llm_usage_created ON llm_usage(created_at);
            CREATE INDEX IF NOT EXISTS idx_llm_usage_user    ON llm_usage(user_id);
            CREATE INDEX IF NOT EXISTS idx_llm_usage_daily   ON llm_usage(created_at, agent_name);
            CREATE INDEX IF NOT EXISTS idx_llm_usage_covering ON llm_usage(created_at, agent_name, cost_usd, tokens_in, tokens_out);
            CREATE INDEX IF NOT EXISTS idx_llm_usage_thread  ON llm_usage(thread_id);
            CREATE INDEX IF NOT EXISTS idx_llm_usage_model_date ON llm_usage(model, created_at);
        `);
    }
    return db;
}

/** Initialize the llm_usage table and indexes. Safe to call multiple times. */
export function initCostTrackingTable(): void {
    getDb(); // Table creation happens inside getDb() on first call
    logger.info('Cost tracking table initialized');
}

// ============================================================================
// COST CALCULATION
// ============================================================================

/**
 * Calculate cost in USD for a given model and token counts.
 */
export function calculateCost(
    model: string,
    tokensIn: number,
    tokensOut: number
): number {
    const pricing = MODEL_PRICING[model] || DEFAULT_PRICING;
    const inputCost = (tokensIn / 1_000_000) * pricing.inputPer1M;
    const outputCost = (tokensOut / 1_000_000) * pricing.outputPer1M;
    return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal places
}

// ============================================================================
// CORE: LOG USAGE
// ============================================================================

/**
 * Log a single LLM API call. Cost is automatically calculated from model pricing.
 */
export function logUsage(input: LogUsageInput): LLMUsageEntry {
    const database = getDb();
    const id = randomUUID();
    const costUsd = calculateCost(input.model, input.tokensIn, input.tokensOut);
    const createdAt = new Date().toISOString();

    database.prepare(`
        INSERT INTO llm_usage (id, agent_name, model, tokens_in, tokens_out, cost_usd, latency_ms, thread_id, user_id, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        input.agentName,
        input.model,
        input.tokensIn,
        input.tokensOut,
        costUsd,
        input.latencyMs,
        input.threadId || null,
        input.userId || null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        createdAt
    );

    return {
        id,
        agentName: input.agentName,
        model: input.model,
        tokensIn: input.tokensIn,
        tokensOut: input.tokensOut,
        costUsd,
        latencyMs: input.latencyMs,
        threadId: input.threadId,
        userId: input.userId,
        metadata: input.metadata,
        createdAt,
    };
}

// ============================================================================
// QUERIES: DAILY COST
// ============================================================================

/**
 * Get total cost for a specific date (YYYY-MM-DD). Defaults to today.
 */
// Cached prepared statement for getDailyCost (hot path — called on every LLM request)
let dailyCostStmt: Database.Statement | null = null;

export function getDailyCost(dateStr?: string): DailyCost {
    const database = getDb();
    const targetDate = dateStr || new Date().toISOString().split("T")[0]!;

    // Range query uses the covering index instead of date() function scan
    const dayStart = `${targetDate}T00:00:00.000Z`;
    const dayEnd = `${targetDate}T23:59:59.999Z`;

    if (!dailyCostStmt) {
        dailyCostStmt = database.prepare(`
            SELECT
                COALESCE(SUM(cost_usd), 0) as total_cost,
                COALESCE(SUM(tokens_in), 0) as total_tokens_in,
                COALESCE(SUM(tokens_out), 0) as total_tokens_out,
                COUNT(*) as call_count
            FROM llm_usage
            WHERE created_at >= ? AND created_at <= ?
        `);
    }

    const row = dailyCostStmt.get(dayStart, dayEnd) as {
        total_cost: number;
        total_tokens_in: number;
        total_tokens_out: number;
        call_count: number;
    };

    return {
        date: targetDate,
        totalCost: row.total_cost,
        totalTokensIn: row.total_tokens_in,
        totalTokensOut: row.total_tokens_out,
        callCount: row.call_count,
    };
}

// ============================================================================
// QUERIES: AGENT COSTS
// ============================================================================

/**
 * Get cost breakdown by agent for a date range.
 * Defaults to last 30 days.
 */
export function getAgentCosts(startDate?: string, endDate?: string): AgentCost[] {
    const database = getDb();
    const start = startDate || getDateOffset(-30);
    const end = endDate || getDateOffset(1); // tomorrow for inclusive end

    const rows = database.prepare(`
        SELECT
            agent_name,
            SUM(cost_usd) as total_cost,
            SUM(tokens_in) as total_tokens_in,
            SUM(tokens_out) as total_tokens_out,
            COUNT(*) as call_count,
            AVG(latency_ms) as avg_latency_ms
        FROM llm_usage
        WHERE created_at >= ? AND created_at < ?
        GROUP BY agent_name
        ORDER BY total_cost DESC
    `).all(start, end) as Array<{
        agent_name: string;
        total_cost: number;
        total_tokens_in: number;
        total_tokens_out: number;
        call_count: number;
        avg_latency_ms: number;
    }>;

    return rows.map((r) => ({
        agentName: r.agent_name,
        totalCost: r.total_cost,
        totalTokensIn: r.total_tokens_in,
        totalTokensOut: r.total_tokens_out,
        callCount: r.call_count,
        avgLatencyMs: Math.round(r.avg_latency_ms),
    }));
}

// ============================================================================
// QUERIES: MODEL COSTS
// ============================================================================

/**
 * Get cost breakdown by model for a date range.
 */
export function getModelCosts(startDate?: string, endDate?: string): ModelCost[] {
    const database = getDb();
    const start = startDate || getDateOffset(-30);
    const end = endDate || getDateOffset(1);

    const rows = database.prepare(`
        SELECT
            model,
            SUM(cost_usd) as total_cost,
            SUM(tokens_in) as total_tokens_in,
            SUM(tokens_out) as total_tokens_out,
            COUNT(*) as call_count
        FROM llm_usage
        WHERE created_at >= ? AND created_at < ?
        GROUP BY model
        ORDER BY total_cost DESC
    `).all(start, end) as Array<{
        model: string;
        total_cost: number;
        total_tokens_in: number;
        total_tokens_out: number;
        call_count: number;
    }>;

    return rows.map((r) => ({
        model: r.model,
        totalCost: r.total_cost,
        totalTokensIn: r.total_tokens_in,
        totalTokensOut: r.total_tokens_out,
        callCount: r.call_count,
    }));
}

// ============================================================================
// QUERIES: COST SUMMARY
// ============================================================================

/**
 * Get a full cost summary for a period (day, week, month, all).
 */
export function getCostSummary(period: "day" | "week" | "month" | "all" = "week"): CostSummary {
    const endDate = getDateOffset(1);
    let startDate: string;

    switch (period) {
        case "day":
            startDate = getDateOffset(0);
            break;
        case "week":
            startDate = getDateOffset(-7);
            break;
        case "month":
            startDate = getDateOffset(-30);
            break;
        case "all":
            startDate = "2000-01-01";
            break;
    }

    const database = getDb();

    // Totals
    const totals = database.prepare(`
        SELECT
            COALESCE(SUM(cost_usd), 0) as total_cost,
            COALESCE(SUM(tokens_in), 0) as total_tokens_in,
            COALESCE(SUM(tokens_out), 0) as total_tokens_out,
            COUNT(*) as total_calls
        FROM llm_usage
        WHERE created_at >= ? AND created_at < ?
    `).get(startDate, endDate) as {
        total_cost: number;
        total_tokens_in: number;
        total_tokens_out: number;
        total_calls: number;
    };

    // By day
    const dailyRows = database.prepare(`
        SELECT
            date(created_at) as day,
            SUM(cost_usd) as total_cost,
            SUM(tokens_in) as total_tokens_in,
            SUM(tokens_out) as total_tokens_out,
            COUNT(*) as call_count
        FROM llm_usage
        WHERE created_at >= ? AND created_at < ?
        GROUP BY day
        ORDER BY day ASC
    `).all(startDate, endDate) as Array<{
        day: string;
        total_cost: number;
        total_tokens_in: number;
        total_tokens_out: number;
        call_count: number;
    }>;

    return {
        period,
        startDate,
        endDate,
        totalCost: totals.total_cost,
        totalTokensIn: totals.total_tokens_in,
        totalTokensOut: totals.total_tokens_out,
        totalCalls: totals.total_calls,
        byAgent: getAgentCosts(startDate, endDate),
        byModel: getModelCosts(startDate, endDate),
        byDay: dailyRows.map((r) => ({
            date: r.day,
            totalCost: r.total_cost,
            totalTokensIn: r.total_tokens_in,
            totalTokensOut: r.total_tokens_out,
            callCount: r.call_count,
        })),
    };
}

// ============================================================================
// QUERIES: CONVERSATION COST
// ============================================================================

/**
 * Get total cost for a specific conversation thread.
 */
export function getConversationCost(threadId: string): DailyCost | null {
    const database = getDb();

    const row = database.prepare(`
        SELECT
            COALESCE(SUM(cost_usd), 0) as total_cost,
            COALESCE(SUM(tokens_in), 0) as total_tokens_in,
            COALESCE(SUM(tokens_out), 0) as total_tokens_out,
            COUNT(*) as call_count
        FROM llm_usage
        WHERE thread_id = ?
    `).get(threadId) as {
        total_cost: number;
        total_tokens_in: number;
        total_tokens_out: number;
        call_count: number;
    };

    if (row.call_count === 0) return null;

    return {
        date: new Date().toISOString().split("T")[0]!,
        totalCost: row.total_cost,
        totalTokensIn: row.total_tokens_in,
        totalTokensOut: row.total_tokens_out,
        callCount: row.call_count,
    };
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format cost summary as a human-readable text string.
 */
export function formatCostSummary(period: "day" | "week" | "month" | "all" = "week"): string {
    const summary = getCostSummary(period);
    const lines: string[] = [
        `📊 Cost Summary (${period})`,
        `Total: $${summary.totalCost.toFixed(4)} | ${summary.totalCalls} calls`,
        `Tokens: ${summary.totalTokensIn.toLocaleString()} in / ${summary.totalTokensOut.toLocaleString()} out`,
        "",
    ];

    if (summary.byAgent.length > 0) {
        lines.push("By Agent:");
        for (const agent of summary.byAgent) {
            lines.push(`  ${agent.agentName}: $${agent.totalCost.toFixed(4)} (${agent.callCount} calls, ~${agent.avgLatencyMs}ms avg)`);
        }
        lines.push("");
    }

    if (summary.byModel.length > 0) {
        lines.push("By Model:");
        for (const model of summary.byModel) {
            lines.push(`  ${model.model}: $${model.totalCost.toFixed(4)} (${model.callCount} calls)`);
        }
    }

    return lines.join("\n");
}

// ============================================================================
// QUERIES: TOP QUERIES (most expensive individual calls)
// ============================================================================

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
export function getTopQueries(limit: number = 10, startDate?: string, endDate?: string): TopQuery[] {
    const database = getDb();
    const start = startDate || getDateOffset(-30);
    const end = endDate || getDateOffset(1);

    const rows = database.prepare(`
        SELECT id, agent_name, model, tokens_in, tokens_out, cost_usd, latency_ms, thread_id, created_at
        FROM llm_usage
        WHERE created_at >= ? AND created_at < ?
        ORDER BY cost_usd DESC
        LIMIT ?
    `).all(start, end, limit) as Array<{
        id: string;
        agent_name: string;
        model: string;
        tokens_in: number;
        tokens_out: number;
        cost_usd: number;
        latency_ms: number;
        thread_id: string | null;
        created_at: string;
    }>;

    return rows.map((r) => ({
        id: r.id,
        agentName: r.agent_name,
        model: r.model,
        tokensIn: r.tokens_in,
        tokensOut: r.tokens_out,
        costUsd: r.cost_usd,
        latencyMs: r.latency_ms,
        threadId: r.thread_id || undefined,
        createdAt: r.created_at,
    }));
}

// ============================================================================
// QUERIES: COST PROJECTION
// ============================================================================

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
export function getCostProjection(daysToAnalyze: number = 7): CostProjection {
    const database = getDb();
    const start = getDateOffset(-daysToAnalyze);
    const end = getDateOffset(1);

    // Get daily costs for the analysis window
    const dailyRows = database.prepare(`
        SELECT
            date(created_at) as day,
            SUM(cost_usd) as total_cost
        FROM llm_usage
        WHERE created_at >= ? AND created_at < ?
        GROUP BY day
        ORDER BY day ASC
    `).all(start, end) as Array<{ day: string; total_cost: number }>;

    const daysWithData = dailyRows.length;

    if (daysWithData === 0) {
        return {
            currentDailyCost: 0,
            projectedMonthlyCost: 0,
            daysAnalyzed: 0,
            dailyAverage: 0,
            trend: "stable",
            trendPercentage: 0,
        };
    }

    const totalCost = dailyRows.reduce((sum, r) => sum + r.total_cost, 0);
    const dailyAverage = totalCost / daysWithData;
    const projectedMonthlyCost = Math.round(dailyAverage * 30 * 100) / 100;

    // Calculate trend: compare first half to second half
    let trend: "increasing" | "decreasing" | "stable" = "stable";
    let trendPercentage = 0;

    if (daysWithData >= 2) {
        const mid = Math.floor(daysWithData / 2);
        const firstHalf = dailyRows.slice(0, mid).reduce((s, r) => s + r.total_cost, 0) / mid;
        const secondHalf = dailyRows.slice(mid).reduce((s, r) => s + r.total_cost, 0) / (daysWithData - mid);

        if (firstHalf > 0) {
            trendPercentage = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
            if (trendPercentage > 5) trend = "increasing";
            else if (trendPercentage < -5) trend = "decreasing";
        }
    }

    // Today's cost
    const todayStr = new Date().toISOString().split("T")[0]!;
    const todayRow = dailyRows.find((r) => r.day === todayStr);
    const currentDailyCost = todayRow?.total_cost || 0;

    return {
        currentDailyCost: Math.round(currentDailyCost * 1_000_000) / 1_000_000,
        projectedMonthlyCost,
        daysAnalyzed: daysWithData,
        dailyAverage: Math.round(dailyAverage * 1_000_000) / 1_000_000,
        trend,
        trendPercentage,
    };
}

// ============================================================================
// HELPERS
// ============================================================================

/** Get an ISO date string offset by `days` from today */
function getDateOffset(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0]!;
}

/**
 * Reset the database connection (for testing).
 * @internal
 */
export function _resetDb(newDb?: Database.Database): void {
    db = newDb || null;
}
