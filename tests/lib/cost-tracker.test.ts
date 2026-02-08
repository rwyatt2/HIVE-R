/**
 * LLM Cost Tracker Tests
 *
 * Tests the cost tracking module: cost calculation, usage logging,
 * and aggregation queries (daily, agent, model, summary).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import {
    calculateCost,
    logUsage,
    getDailyCost,
    getAgentCosts,
    getModelCosts,
    getCostSummary,
    initCostTrackingTable,
    MODEL_PRICING,
    _resetDb,
} from "../../src/lib/cost-tracker.js";

// ============================================================================
// TEST SETUP — use in-memory SQLite for isolation
// ============================================================================

let testDb: Database.Database;

beforeEach(() => {
    testDb = new Database(":memory:");
    _resetDb(testDb);
    // Create the table directly on testDb since _resetDb sets this as the active db
    testDb.exec(`
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
        CREATE INDEX IF NOT EXISTS idx_llm_usage_created ON llm_usage(created_at);
    `);
});

afterEach(() => {
    testDb.close();
    _resetDb();
});

// ============================================================================
// Helper to insert usage rows with specific dates
// ============================================================================

function insertUsage(overrides: {
    agentName?: string;
    model?: string;
    tokensIn?: number;
    tokensOut?: number;
    latencyMs?: number;
    createdAt?: string;
    userId?: string;
    threadId?: string;
}) {
    const entry = {
        agentName: overrides.agentName || "Security",
        model: overrides.model || "gpt-4o",
        tokensIn: overrides.tokensIn ?? 1000,
        tokensOut: overrides.tokensOut ?? 500,
        latencyMs: overrides.latencyMs ?? 1500,
        userId: overrides.userId,
        threadId: overrides.threadId,
    };

    const result = logUsage(entry);

    // Override created_at if specified (for date-based tests)
    if (overrides.createdAt) {
        testDb.prepare("UPDATE llm_usage SET created_at = ? WHERE id = ?").run(
            overrides.createdAt,
            result.id
        );
    }

    return result;
}


// ============================================================================
// calculateCost
// ============================================================================

describe("calculateCost", () => {
    it("calculates gpt-4o cost correctly", () => {
        // gpt-4o: $5.00/1M input, $15.00/1M output
        const cost = calculateCost("gpt-4o", 1_000_000, 1_000_000);
        expect(cost).toBe(20.0);
    });

    it("calculates gpt-4o-mini cost correctly", () => {
        // gpt-4o-mini: $0.15/1M input, $0.60/1M output
        const cost = calculateCost("gpt-4o-mini", 1_000_000, 1_000_000);
        expect(cost).toBe(0.75);
    });

    it("calculates small token counts precisely", () => {
        // 1000 input + 500 output on gpt-4o
        // = (1000/1M * 5.00) + (500/1M * 15.00)
        // = 0.005 + 0.0075 = 0.0125
        const cost = calculateCost("gpt-4o", 1000, 500);
        expect(cost).toBeCloseTo(0.0125, 6);
    });

    it("uses default pricing for unknown models", () => {
        // Default: $5.00/1M input, $15.00/1M output
        const cost = calculateCost("unknown-model", 1_000_000, 1_000_000);
        expect(cost).toBe(20.0);
    });

    it("handles zero tokens", () => {
        const cost = calculateCost("gpt-4o", 0, 0);
        expect(cost).toBe(0);
    });
});

// ============================================================================
// logUsage
// ============================================================================

describe("logUsage", () => {
    it("inserts a usage record and returns it", () => {
        const entry = logUsage({
            agentName: "Builder",
            model: "gpt-4o",
            tokensIn: 2000,
            tokensOut: 1000,
            latencyMs: 3000,
            threadId: "thread-123",
            userId: "user-abc",
        });

        expect(entry.id).toBeTruthy();
        expect(entry.agentName).toBe("Builder");
        expect(entry.model).toBe("gpt-4o");
        expect(entry.tokensIn).toBe(2000);
        expect(entry.tokensOut).toBe(1000);
        expect(entry.costUsd).toBeGreaterThan(0);
        expect(entry.latencyMs).toBe(3000);
        expect(entry.createdAt).toBeTruthy();
    });

    it("auto-calculates cost from model pricing", () => {
        const entry = logUsage({
            agentName: "Security",
            model: "gpt-4o",
            tokensIn: 1000,
            tokensOut: 500,
            latencyMs: 1500,
        });

        expect(entry.costUsd).toBeCloseTo(0.0125, 6);
    });

    it("stores metadata as JSON", () => {
        const entry = logUsage({
            agentName: "Planner",
            model: "gpt-4o",
            tokensIn: 500,
            tokensOut: 200,
            latencyMs: 800,
            metadata: { functionCalls: 2, retries: 0 },
        });

        // Verify it's stored in DB
        const row = testDb.prepare("SELECT metadata FROM llm_usage WHERE id = ?").get(entry.id) as { metadata: string };
        const parsed = JSON.parse(row.metadata);
        expect(parsed.functionCalls).toBe(2);
    });

    it("handles null optional fields", () => {
        const entry = logUsage({
            agentName: "Router",
            model: "gpt-4o-mini",
            tokensIn: 100,
            tokensOut: 50,
            latencyMs: 200,
        });

        expect(entry.threadId).toBeUndefined();
        expect(entry.userId).toBeUndefined();
        expect(entry.metadata).toBeUndefined();
    });
});

// ============================================================================
// getDailyCost
// ============================================================================

describe("getDailyCost", () => {
    it("returns zero for a day with no usage", () => {
        const result = getDailyCost("2020-01-01");
        expect(result.totalCost).toBe(0);
        expect(result.callCount).toBe(0);
    });

    it("sums costs for a specific day", () => {
        insertUsage({ createdAt: "2026-02-07T10:00:00Z", tokensIn: 1000, tokensOut: 500 });
        insertUsage({ createdAt: "2026-02-07T14:00:00Z", tokensIn: 2000, tokensOut: 1000 });
        insertUsage({ createdAt: "2026-02-06T14:00:00Z", tokensIn: 5000, tokensOut: 3000 }); // different day

        const result = getDailyCost("2026-02-07");
        expect(result.callCount).toBe(2);
        expect(result.totalTokensIn).toBe(3000);
        expect(result.totalTokensOut).toBe(1500);
        expect(result.totalCost).toBeGreaterThan(0);
    });
});

// ============================================================================
// getAgentCosts
// ============================================================================

describe("getAgentCosts", () => {
    it("returns empty array when no data", () => {
        const result = getAgentCosts("2026-01-01", "2026-01-02");
        expect(result).toEqual([]);
    });

    it("groups costs by agent", () => {
        insertUsage({ agentName: "Security", createdAt: "2026-02-07T10:00:00Z" });
        insertUsage({ agentName: "Security", createdAt: "2026-02-07T11:00:00Z" });
        insertUsage({ agentName: "Builder", createdAt: "2026-02-07T12:00:00Z" });

        const result = getAgentCosts("2026-02-07", "2026-02-08");
        expect(result).toHaveLength(2);

        const security = result.find((r) => r.agentName === "Security");
        expect(security?.callCount).toBe(2);

        const builder = result.find((r) => r.agentName === "Builder");
        expect(builder?.callCount).toBe(1);
    });

    it("includes average latency", () => {
        insertUsage({ agentName: "Builder", latencyMs: 1000, createdAt: "2026-02-07T10:00:00Z" });
        insertUsage({ agentName: "Builder", latencyMs: 3000, createdAt: "2026-02-07T11:00:00Z" });

        const result = getAgentCosts("2026-02-07", "2026-02-08");
        expect(result[0]!.avgLatencyMs).toBe(2000);
    });
});

// ============================================================================
// getModelCosts
// ============================================================================

describe("getModelCosts", () => {
    it("groups costs by model", () => {
        insertUsage({ model: "gpt-4o", createdAt: "2026-02-07T10:00:00Z" });
        insertUsage({ model: "gpt-4o", createdAt: "2026-02-07T11:00:00Z" });
        insertUsage({ model: "gpt-4o-mini", createdAt: "2026-02-07T12:00:00Z" });

        const result = getModelCosts("2026-02-07", "2026-02-08");
        expect(result).toHaveLength(2);

        const gpt4o = result.find((r) => r.model === "gpt-4o");
        expect(gpt4o?.callCount).toBe(2);
    });
});

// ============================================================================
// getCostSummary
// ============================================================================

describe("getCostSummary", () => {
    it("returns summary with all sub-breakdowns", () => {
        // Insert data for today
        const today = new Date().toISOString();
        insertUsage({ agentName: "Security", model: "gpt-4o", createdAt: today });
        insertUsage({ agentName: "Builder", model: "gpt-4o-mini", createdAt: today });

        const summary = getCostSummary("week");

        expect(summary.period).toBe("week");
        expect(summary.totalCalls).toBe(2);
        expect(summary.totalCost).toBeGreaterThan(0);
        expect(summary.byAgent).toHaveLength(2);
        expect(summary.byModel).toHaveLength(2);
        expect(summary.byDay.length).toBeGreaterThanOrEqual(1);
    });

    it("returns zero summary for empty period", () => {
        const summary = getCostSummary("day");
        expect(summary.totalCalls).toBe(0);
        expect(summary.totalCost).toBe(0);
        expect(summary.byAgent).toEqual([]);
        expect(summary.byModel).toEqual([]);
        expect(summary.byDay).toEqual([]);
    });
});

// ============================================================================
// MODEL_PRICING
// ============================================================================

describe("MODEL_PRICING", () => {
    it("contains all common models", () => {
        expect(MODEL_PRICING["gpt-4o"]).toBeDefined();
        expect(MODEL_PRICING["gpt-4o-mini"]).toBeDefined();
        expect(MODEL_PRICING["gpt-4-turbo"]).toBeDefined();
        expect(MODEL_PRICING["gpt-3.5-turbo"]).toBeDefined();
    });

    it("has positive pricing for all models", () => {
        for (const [model, pricing] of Object.entries(MODEL_PRICING)) {
            expect(pricing.inputPer1M).toBeGreaterThan(0);
            expect(pricing.outputPer1M).toBeGreaterThan(0);
        }
    });
});
