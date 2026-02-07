/**
 * Tests for Cost Dashboard API Router
 *
 * Tests all 5 endpoints, caching behavior, input validation,
 * and error handling using mocked cost-tracker functions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

const mockGetDailyCost = vi.fn();
const mockGetAgentCosts = vi.fn();
const mockGetModelCosts = vi.fn();
const mockGetCostSummary = vi.fn();
const mockGetTopQueries = vi.fn();
const mockGetCostProjection = vi.fn();

vi.mock("../../../src/lib/cost-tracker.js", () => ({
    getDailyCost: (...args: unknown[]) => mockGetDailyCost(...args),
    getAgentCosts: (...args: unknown[]) => mockGetAgentCosts(...args),
    getModelCosts: (...args: unknown[]) => mockGetModelCosts(...args),
    getCostSummary: (...args: unknown[]) => mockGetCostSummary(...args),
    getTopQueries: (...args: unknown[]) => mockGetTopQueries(...args),
    getCostProjection: (...args: unknown[]) => mockGetCostProjection(...args),
}));

// Import AFTER mocks
import costsRouter, { clearCostCache, _getCacheSize } from "../../../src/routers/admin/costs.js";

// ============================================================================
// TEST APP — mount costs router without auth for testing
// ============================================================================

const app = new Hono();
app.route("/costs", costsRouter);

function req(path: string) {
    return app.request(`http://localhost/costs${path}`);
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_DAILY = {
    date: "2026-02-07",
    totalCost: 12.5,
    totalTokensIn: 450000,
    totalTokensOut: 180000,
    callCount: 87,
};

const SAMPLE_AGENTS = [
    { agentName: "Builder", totalCost: 5.23, totalTokensIn: 200000, totalTokensOut: 80000, callCount: 34, avgLatencyMs: 2100 },
    { agentName: "Security", totalCost: 3.12, totalTokensIn: 120000, totalTokensOut: 50000, callCount: 28, avgLatencyMs: 1800 },
];

const SAMPLE_SUMMARY = {
    period: "month",
    startDate: "2026-01-08",
    endDate: "2026-02-08",
    totalCost: 255.0,
    totalTokensIn: 9000000,
    totalTokensOut: 3600000,
    totalCalls: 1260,
    byAgent: SAMPLE_AGENTS,
    byModel: [{ model: "gpt-4o", totalCost: 200.0, totalTokensIn: 7000000, totalTokensOut: 2800000, callCount: 1000 }],
    byDay: [
        { date: "2026-02-06", totalCost: 8.5, totalTokensIn: 300000, totalTokensOut: 120000, callCount: 42 },
        { date: "2026-02-07", totalCost: 12.5, totalTokensIn: 450000, totalTokensOut: 180000, callCount: 87 },
    ],
};

const SAMPLE_TOP_QUERIES = [
    { id: "uuid-1", agentName: "Builder", model: "gpt-4o", tokensIn: 8000, tokensOut: 4000, costUsd: 0.1, latencyMs: 5200, threadId: "thread-abc", createdAt: "2026-02-07T18:30:00Z" },
    { id: "uuid-2", agentName: "Planner", model: "gpt-4o", tokensIn: 6000, tokensOut: 3000, costUsd: 0.075, latencyMs: 3800, createdAt: "2026-02-07T17:00:00Z" },
];

const SAMPLE_PROJECTION = {
    currentDailyCost: 12.34,
    projectedMonthlyCost: 370.2,
    daysAnalyzed: 7,
    dailyAverage: 12.34,
    trend: "increasing" as const,
    trendPercentage: 15,
};

// ============================================================================
// TESTS
// ============================================================================

describe("GET /costs/today", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCostCache();
    });

    it("returns today's cost with budget info", async () => {
        mockGetDailyCost.mockReturnValue(SAMPLE_DAILY);

        const res = await req("/today");
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.data.totalCost).toBe(12.5);
        expect(json.data.callCount).toBe(87);
        expect(json.budget.daily).toBe(50);
        expect(json.budget.remaining).toBeCloseTo(37.5, 1);
    });

    it("caches response for 5 minutes", async () => {
        mockGetDailyCost.mockReturnValue(SAMPLE_DAILY);

        await req("/today");
        const res2 = await req("/today");
        const json2 = await res2.json();

        expect(json2.cached).toBe(true);
        expect(mockGetDailyCost).toHaveBeenCalledTimes(1); // Only called once
    });

    it("handles errors gracefully", async () => {
        mockGetDailyCost.mockImplementation(() => { throw new Error("DB gone"); });

        const res = await req("/today");
        expect(res.status).toBe(500);

        const json = await res.json();
        expect(json.error).toContain("today");
    });
});

describe("GET /costs/by-agent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCostCache();
    });

    it("returns agent costs for default period (today)", async () => {
        mockGetAgentCosts.mockReturnValue(SAMPLE_AGENTS);

        const res = await req("/by-agent");
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.period).toBe("today");
        expect(json.data).toHaveLength(2);
        expect(json.data[0].agentName).toBe("Builder");
    });

    it("accepts period query param", async () => {
        mockGetAgentCosts.mockReturnValue(SAMPLE_AGENTS);

        const res = await req("/by-agent?period=week");
        const json = await res.json();

        expect(json.period).toBe("week");
    });

    it("rejects invalid period", async () => {
        const res = await req("/by-agent?period=year");
        expect(res.status).toBe(400);
    });
});

describe("GET /costs/trend", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCostCache();
    });

    it("returns daily trend with defaults (30 days)", async () => {
        mockGetCostSummary.mockReturnValue(SAMPLE_SUMMARY);

        const res = await req("/trend");
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.days).toBe(30);
        expect(json.trend).toHaveLength(2);
        expect(json.totals.totalCost).toBe(255.0);
    });

    it("accepts days query param", async () => {
        mockGetCostSummary.mockReturnValue(SAMPLE_SUMMARY);

        const res = await req("/trend?days=7");
        const json = await res.json();

        expect(json.days).toBe(7);
    });

    it("rejects invalid days", async () => {
        const res = await req("/trend?days=0");
        expect(res.status).toBe(400);

        const res2 = await req("/trend?days=500");
        expect(res2.status).toBe(400);

        const res3 = await req("/trend?days=abc");
        expect(res3.status).toBe(400);
    });
});

describe("GET /costs/top-queries", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCostCache();
    });

    it("returns top queries with default limit", async () => {
        mockGetTopQueries.mockReturnValue(SAMPLE_TOP_QUERIES);

        const res = await req("/top-queries");
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.limit).toBe(10);
        expect(json.data).toHaveLength(2);
        expect(json.data[0].costUsd).toBe(0.1);
    });

    it("accepts custom limit", async () => {
        mockGetTopQueries.mockReturnValue(SAMPLE_TOP_QUERIES.slice(0, 1));

        const res = await req("/top-queries?limit=1");
        const json = await res.json();

        expect(json.limit).toBe(1);
    });

    it("rejects invalid limit", async () => {
        const res = await req("/top-queries?limit=0");
        expect(res.status).toBe(400);

        const res2 = await req("/top-queries?limit=200");
        expect(res2.status).toBe(400);
    });
});

describe("GET /costs/projection", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCostCache();
    });

    it("returns cost projection", async () => {
        mockGetCostProjection.mockReturnValue(SAMPLE_PROJECTION);

        const res = await req("/projection");
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.data.projectedMonthlyCost).toBe(370.2);
        expect(json.data.trend).toBe("increasing");
        expect(json.data.trendPercentage).toBe(15);
    });

    it("caches projection", async () => {
        mockGetCostProjection.mockReturnValue(SAMPLE_PROJECTION);

        await req("/projection");
        const res2 = await req("/projection");
        const json2 = await res2.json();

        expect(json2.cached).toBe(true);
        expect(mockGetCostProjection).toHaveBeenCalledTimes(1);
    });
});

describe("Cache behavior", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCostCache();
    });

    it("clearCostCache resets all cached entries", async () => {
        mockGetDailyCost.mockReturnValue(SAMPLE_DAILY);
        mockGetCostProjection.mockReturnValue(SAMPLE_PROJECTION);

        await req("/today");
        await req("/projection");

        expect(_getCacheSize()).toBe(2);

        clearCostCache();
        expect(_getCacheSize()).toBe(0);
    });
});
