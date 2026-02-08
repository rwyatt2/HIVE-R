/**
 * Cost Dashboard API Router
 *
 * 5 endpoints for LLM cost visualization behind admin auth.
 * All responses cached in-memory for 5 minutes.
 *
 * Mounted at: /admin/costs
 */

import { Hono } from "hono";
import {
    getDailyCost,
    getAgentCosts,
    getModelCosts,
    getCostSummary,
    getTopQueries,
    getCostProjection,
} from "../../lib/cost-tracker.js";
import type { DailyCost, AgentCost, CostSummary } from "../../types/cost-tracking.js";
import type { TopQuery, CostProjection } from "../../lib/cost-tracker.js";
import { validateQuery, CostPeriodSchema, TrendDaysSchema, PaginationSchema } from "../../lib/input-validation.js";

// ============================================================================
// IN-MEMORY CACHE (5 minute TTL)
// ============================================================================

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
    data: T;
    cachedAt: number;
}

const responseCache = new Map<string, CacheEntry<unknown>>();

/**
 * Get or compute a cached value. Returns cached data if within TTL,
 * otherwise calls the compute function, stores the result, and returns it.
 */
function cached<T>(key: string, compute: () => T): { data: T; cached: boolean; cachedAt: string } {
    const now = Date.now();
    const existing = responseCache.get(key) as CacheEntry<T> | undefined;

    if (existing && now - existing.cachedAt < CACHE_TTL_MS) {
        return {
            data: existing.data,
            cached: true,
            cachedAt: new Date(existing.cachedAt).toISOString(),
        };
    }

    const data = compute();
    responseCache.set(key, { data, cachedAt: now });

    return {
        data,
        cached: false,
        cachedAt: new Date(now).toISOString(),
    };
}

/** Clear cost cache (useful after manual data changes) */
export function clearCostCache(): void {
    responseCache.clear();
}

/** Expose for testing */
export function _getCacheSize(): number {
    return responseCache.size;
}

// ============================================================================
// ROUTER
// ============================================================================

const costsRouter = new Hono();

/**
 * GET /admin/costs/today
 *
 * Today's total cost, tokens, and call count.
 */
costsRouter.get("/today", (c) => {
    try {
        const result = cached<DailyCost>("today", () => getDailyCost());

        return c.json({
            ...result,
            budget: {
                daily: parseFloat(process.env.DAILY_BUDGET || "50"),
                remaining: Math.max(
                    0,
                    parseFloat(process.env.DAILY_BUDGET || "50") - result.data.totalCost
                ),
            },
        });
    } catch (err) {
        return c.json({ error: "Failed to fetch today's costs", detail: (err as Error).message }, 500);
    }
});

/**
 * GET /admin/costs/by-agent?period=today|week|month
 *
 * Cost breakdown by agent for the requested period.
 */
costsRouter.get("/by-agent", (c) => {
    // Validate period param with Zod
    const queryValidation = validateQuery(
        CostPeriodSchema,
        { period: c.req.query("period") },
        'admin_costs_by_agent_query_failed'
    );
    if (!queryValidation.success) {
        return c.json(queryValidation, 400);
    }

    const period = queryValidation.data.period ?? "today";

    try {
        const result = cached<AgentCost[]>(`by-agent:${period}`, () => {
            const now = new Date();
            const end = new Date(now);
            end.setDate(end.getDate() + 1);
            const endStr = end.toISOString().split("T")[0]!;

            let startStr: string;
            switch (period) {
                case "today":
                    startStr = now.toISOString().split("T")[0]!;
                    break;
                case "week":
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    startStr = weekAgo.toISOString().split("T")[0]!;
                    break;
                case "month":
                    const monthAgo = new Date(now);
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    startStr = monthAgo.toISOString().split("T")[0]!;
                    break;
            }

            return getAgentCosts(startStr, endStr);
        });

        return c.json({ period, ...result });
    } catch (err) {
        return c.json({ error: "Failed to fetch agent costs", detail: (err as Error).message }, 500);
    }
});

/**
 * GET /admin/costs/trend?days=30
 *
 * Daily cost aggregates over time for charting.
 */
costsRouter.get("/trend", (c) => {
    // Validate days param with Zod
    const queryValidation = validateQuery(
        TrendDaysSchema,
        { days: c.req.query("days") },
        'admin_costs_trend_query_failed'
    );
    if (!queryValidation.success) {
        return c.json(queryValidation, 400);
    }

    const days = queryValidation.data.days ?? 30;

    try {
        const result = cached<CostSummary>(`trend:${days}`, () => {
            // Use getCostSummary for the closest period match, or query directly
            if (days <= 1) return getCostSummary("day");
            if (days <= 7) return getCostSummary("week");
            if (days <= 30) return getCostSummary("month");
            return getCostSummary("all");
        });

        return c.json({
            days,
            trend: result.data.byDay,
            totals: {
                totalCost: result.data.totalCost,
                totalCalls: result.data.totalCalls,
                totalTokensIn: result.data.totalTokensIn,
                totalTokensOut: result.data.totalTokensOut,
            },
            cached: result.cached,
            cachedAt: result.cachedAt,
        });
    } catch (err) {
        return c.json({ error: "Failed to fetch cost trend", detail: (err as Error).message }, 500);
    }
});

/**
 * GET /admin/costs/top-queries?limit=10
 *
 * Most expensive individual LLM calls.
 */
costsRouter.get("/top-queries", (c) => {
    // Validate limit param with Zod
    const queryValidation = validateQuery(
        PaginationSchema,
        { limit: c.req.query("limit") },
        'admin_costs_top_queries_query_failed'
    );
    if (!queryValidation.success) {
        return c.json(queryValidation, 400);
    }

    const limit = queryValidation.data.limit ?? 10;

    try {
        const result = cached<TopQuery[]>(`top-queries:${limit}`, () => getTopQueries(limit));
        return c.json({ limit, ...result });
    } catch (err) {
        return c.json({ error: "Failed to fetch top queries", detail: (err as Error).message }, 500);
    }
});

/**
 * GET /admin/costs/projection
 *
 * Projected monthly cost based on recent burn rate.
 */
costsRouter.get("/projection", (c) => {
    try {
        const result = cached<CostProjection>("projection", () => getCostProjection());

        return c.json(result);
    } catch (err) {
        return c.json({ error: "Failed to calculate projection", detail: (err as Error).message }, 500);
    }
});

export default costsRouter;
