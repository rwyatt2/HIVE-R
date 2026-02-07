/**
 * Tests for LLM Cost Tracking Middleware
 *
 * Tests the CostTrackingCallback, createTrackedLLM factory,
 * cost calculation, and budget enforcement.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    CostTrackingCallback,
    calculateCostPer1K,
    checkBudget,
    BudgetExceededError,
    MODEL_PRICING_PER_1K,
    DAILY_BUDGET,
} from "../../src/middleware/cost-tracking.js";
import type { LLMResult } from "@langchain/core/outputs";
import Database from "better-sqlite3";

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

// Mock cost-tracker module
const mockLogUsage = vi.fn();
const mockGetDailyCost = vi.fn();

vi.mock("../../src/lib/cost-tracker.js", () => ({
    logUsage: (...args: unknown[]) => mockLogUsage(...args),
    getDailyCost: (...args: unknown[]) => mockGetDailyCost(...args),
}));

// Mock logger
vi.mock("../../src/lib/logger.js", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// ============================================================================
// TESTS
// ============================================================================

describe("calculateCostPer1K", () => {
    it("calculates GPT-4o cost correctly", () => {
        // 1000 input tokens at $0.005/1K = $0.005
        // 500 output tokens at $0.015/1K = $0.0075
        const cost = calculateCostPer1K("gpt-4o", 1000, 500);
        expect(cost).toBeCloseTo(0.0125, 6);
    });

    it("calculates GPT-4o-mini cost correctly", () => {
        // 1000 input at $0.00015/1K = $0.00015
        // 1000 output at $0.0006/1K = $0.0006
        const cost = calculateCostPer1K("gpt-4o-mini", 1000, 1000);
        expect(cost).toBeCloseTo(0.00075, 6);
    });

    it("calculates Claude 3.5 Sonnet cost correctly", () => {
        // 2000 input at $0.003/1K = $0.006
        // 1000 output at $0.015/1K = $0.015
        const cost = calculateCostPer1K("claude-3-5-sonnet", 2000, 1000);
        expect(cost).toBeCloseTo(0.021, 6);
    });

    it("calculates Claude 3 Haiku cost correctly", () => {
        // 5000 input at $0.00025/1K = $0.00125
        // 2000 output at $0.00125/1K = $0.0025
        const cost = calculateCostPer1K("claude-3-haiku", 5000, 2000);
        expect(cost).toBeCloseTo(0.00375, 6);
    });

    it("uses default pricing for unknown models", () => {
        const cost = calculateCostPer1K("unknown-model", 1000, 1000);
        // Default: $0.005 input + $0.015 output = $0.02 per 1K each
        expect(cost).toBeCloseTo(0.02, 6);
    });

    it("returns 0 for zero tokens", () => {
        const cost = calculateCostPer1K("gpt-4o", 0, 0);
        expect(cost).toBe(0);
    });

    it("handles large token counts", () => {
        // 1M input at $0.005/1K = $5.00
        // 500K output at $0.015/1K = $7.50
        const cost = calculateCostPer1K("gpt-4o", 1_000_000, 500_000);
        expect(cost).toBeCloseTo(12.5, 4);
    });
});

describe("MODEL_PRICING_PER_1K", () => {
    it("has all required models", () => {
        expect(MODEL_PRICING_PER_1K["gpt-4o"]).toBeDefined();
        expect(MODEL_PRICING_PER_1K["gpt-4o-mini"]).toBeDefined();
        expect(MODEL_PRICING_PER_1K["claude-3-5-sonnet"]).toBeDefined();
        expect(MODEL_PRICING_PER_1K["claude-3-haiku"]).toBeDefined();
    });

    it("has input and output pricing for each model", () => {
        for (const [model, pricing] of Object.entries(MODEL_PRICING_PER_1K)) {
            expect(pricing.input).toBeGreaterThan(0);
            expect(pricing.output).toBeGreaterThan(0);
            expect(pricing.output).toBeGreaterThanOrEqual(pricing.input);
        }
    });
});

describe("CostTrackingCallback", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("logs usage on handleLLMEnd with token data", async () => {
        const callback = new CostTrackingCallback("Builder", "gpt-4o");

        await callback.handleLLMStart();

        const output: LLMResult = {
            generations: [],
            llmOutput: {
                tokenUsage: {
                    promptTokens: 500,
                    completionTokens: 200,
                    totalTokens: 700,
                },
            },
        };

        await callback.handleLLMEnd(output);

        expect(mockLogUsage).toHaveBeenCalledWith(
            expect.objectContaining({
                agentName: "Builder",
                model: "gpt-4o",
                tokensIn: 500,
                tokensOut: 200,
                latencyMs: expect.any(Number),
            })
        );
    });

    it("includes threadId and userId when provided", async () => {
        const callback = new CostTrackingCallback("Router", "gpt-4o", {
            threadId: "thread-123",
            userId: "user-456",
        });

        await callback.handleLLMStart();

        const output: LLMResult = {
            generations: [],
            llmOutput: {
                tokenUsage: {
                    promptTokens: 100,
                    completionTokens: 50,
                    totalTokens: 150,
                },
            },
        };

        await callback.handleLLMEnd(output);

        expect(mockLogUsage).toHaveBeenCalledWith(
            expect.objectContaining({
                threadId: "thread-123",
                userId: "user-456",
            })
        );
    });

    it("handles missing token usage gracefully", async () => {
        const callback = new CostTrackingCallback("Builder", "gpt-4o");

        await callback.handleLLMStart();

        const output: LLMResult = {
            generations: [],
            llmOutput: undefined,
        };

        await callback.handleLLMEnd(output);

        // Should not call logUsage if no token data
        expect(mockLogUsage).not.toHaveBeenCalled();
    });

    it("handles missing completionTokens gracefully", async () => {
        const callback = new CostTrackingCallback("Builder", "gpt-4o");

        await callback.handleLLMStart();

        const output: LLMResult = {
            generations: [],
            llmOutput: {
                tokenUsage: {
                    promptTokens: 300,
                    totalTokens: 300,
                },
            },
        };

        await callback.handleLLMEnd(output);

        expect(mockLogUsage).toHaveBeenCalledWith(
            expect.objectContaining({
                tokensIn: 300,
                tokensOut: 0,
            })
        );
    });

    it("does not throw on logUsage error", async () => {
        mockLogUsage.mockImplementation(() => {
            throw new Error("DB write failed");
        });

        const callback = new CostTrackingCallback("Builder", "gpt-4o");

        await callback.handleLLMStart();

        const output: LLMResult = {
            generations: [],
            llmOutput: {
                tokenUsage: {
                    promptTokens: 100,
                    completionTokens: 50,
                    totalTokens: 150,
                },
            },
        };

        // Should NOT throw
        await expect(callback.handleLLMEnd(output)).resolves.not.toThrow();
    });

    it("measures latency between start and end", async () => {
        const callback = new CostTrackingCallback("Builder", "gpt-4o");

        await callback.handleLLMStart();
        // Small delay
        await new Promise((r) => setTimeout(r, 10));

        const output: LLMResult = {
            generations: [],
            llmOutput: {
                tokenUsage: {
                    promptTokens: 100,
                    completionTokens: 50,
                    totalTokens: 150,
                },
            },
        };

        await callback.handleLLMEnd(output);

        expect(mockLogUsage).toHaveBeenCalledWith(
            expect.objectContaining({
                latencyMs: expect.any(Number),
            })
        );

        const calledWith = mockLogUsage.mock.calls[0][0];
        expect(calledWith.latencyMs).toBeGreaterThanOrEqual(5); // at least some ms
    });
});

describe("checkBudget", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns not exceeded when daily cost is under budget", () => {
        mockGetDailyCost.mockReturnValue({
            date: "2026-02-07",
            totalCost: 10.0,
            totalTokensIn: 100000,
            totalTokensOut: 50000,
            callCount: 50,
        });

        const result = checkBudget();
        expect(result.exceeded).toBe(false);
        expect(result.dailyCost).toBe(10.0);
        expect(result.budget).toBe(DAILY_BUDGET);
    });

    it("returns exceeded when daily cost is at or over budget", () => {
        mockGetDailyCost.mockReturnValue({
            date: "2026-02-07",
            totalCost: 55.0,
            totalTokensIn: 500000,
            totalTokensOut: 200000,
            callCount: 200,
        });

        const result = checkBudget();
        expect(result.exceeded).toBe(true);
        expect(result.dailyCost).toBe(55.0);
    });

    it("returns not exceeded on getDailyCost error (graceful failure)", () => {
        mockGetDailyCost.mockImplementation(() => {
            throw new Error("DB error");
        });

        const result = checkBudget();
        expect(result.exceeded).toBe(false);
        expect(result.dailyCost).toBe(0);
    });
});

describe("BudgetExceededError", () => {
    it("includes cost and budget in message", () => {
        const err = new BudgetExceededError(55.1234, 50.0);
        expect(err.message).toContain("$55.1234");
        expect(err.message).toContain("$50.00");
        expect(err.name).toBe("BudgetExceededError");
        expect(err.dailyCost).toBe(55.1234);
        expect(err.budget).toBe(50.0);
    });
});
