/**
 * Tests for LLM Retry Utility
 *
 * Covers:
 * - Successful first attempt (no retry)
 * - Success on 2nd/3rd attempt after transient failure
 * - Failure after max retries exhausted
 * - Exponential backoff timing
 * - Jitter adds randomness
 * - Error classification (retryable vs non-retryable)
 * - Metrics tracking
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    withRetry,
    isRetryableError,
    calculateDelay,
    retryMetrics,
    resetRetryMetrics,
} from "../../src/lib/retry.js";
import { CircuitOpenError } from "../../src/lib/circuit-breaker.js";

// ============================================================================
// MOCKS
// ============================================================================

// Mock logger to prevent console output during tests
vi.mock("../../src/lib/logger.js", () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// No-op sleep for tests — avoids real delays
const noopSleep = vi.fn(() => Promise.resolve());

/** Default retry options for tests — instant retries */
const testOpts = (overrides = {}) => ({
    maxRetries: 3,
    _sleep: noopSleep,
    ...overrides,
});

// ============================================================================
// SETUP
// ============================================================================

beforeEach(() => {
    resetRetryMetrics();
    noopSleep.mockClear();
});

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

describe("isRetryableError", () => {
    describe("Retryable errors (transient)", () => {
        it("should retry 429 rate limit", () => {
            const error = new Error("429 Too Many Requests");
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry 500 internal server error", () => {
            const error = new Error("500 Internal Server Error");
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry 502 bad gateway", () => {
            const error = new Error("502 Bad Gateway");
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry 503 service unavailable", () => {
            const error = new Error("503 Service Unavailable");
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry 504 gateway timeout", () => {
            const error = new Error("504 Gateway Timeout");
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry ECONNRESET network error", () => {
            const error = new Error("Connection reset") as any;
            error.code = "ECONNRESET";
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry ETIMEDOUT network error", () => {
            const error = new Error("Request timed out") as any;
            error.code = "ETIMEDOUT";
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry ECONNREFUSED network error", () => {
            const error = new Error("Connection refused") as any;
            error.code = "ECONNREFUSED";
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry timeout message (heuristic)", () => {
            const error = new Error("Request timed out after 30s");
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry socket hang up", () => {
            const error = new Error("socket hang up");
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry rate limit message", () => {
            const error = new Error("Rate limit exceeded, please try again");
            expect(isRetryableError(error)).toBe(true);
        });

        it("should retry errors with status property", () => {
            const error = new Error("Server error") as any;
            error.status = 500;
            expect(isRetryableError(error)).toBe(true);
        });
    });

    describe("Non-retryable errors (permanent)", () => {
        it("should NOT retry 400 bad request", () => {
            const error = new Error("400 Bad Request: invalid model");
            expect(isRetryableError(error)).toBe(false);
        });

        it("should NOT retry 401 auth error", () => {
            const error = new Error("401 Unauthorized: invalid API key");
            expect(isRetryableError(error)).toBe(false);
        });

        it("should NOT retry 403 forbidden", () => {
            const error = new Error("403 Forbidden");
            expect(isRetryableError(error)).toBe(false);
        });

        it("should NOT retry CircuitOpenError", () => {
            const error = new CircuitOpenError("gpt-4o", 5000);
            expect(isRetryableError(error)).toBe(false);
        });

        it("should NOT retry BudgetExceededError", () => {
            const error = new Error("Over budget");
            error.name = "BudgetExceededError";
            expect(isRetryableError(error)).toBe(false);
        });

        it("should NOT retry content policy violations", () => {
            const error = new Error("content_policy_violation: flagged by moderation");
            expect(isRetryableError(error)).toBe(false);
        });

        it("should NOT retry unknown errors (fail-safe)", () => {
            const error = new Error("Something completely unknown happened");
            expect(isRetryableError(error)).toBe(false);
        });
    });
});

// ============================================================================
// DELAY CALCULATION
// ============================================================================

describe("calculateDelay", () => {
    const config = { maxRetries: 3, baseDelayMs: 1000, jitterPercent: 0 };

    it("should use exponential backoff", () => {
        expect(calculateDelay(0, config)).toBe(1000); // 1000 * 2^0
        expect(calculateDelay(1, config)).toBe(2000); // 1000 * 2^1
        expect(calculateDelay(2, config)).toBe(4000); // 1000 * 2^2
    });

    it("should add jitter within expected range", () => {
        const jitterConfig = { maxRetries: 3, baseDelayMs: 1000, jitterPercent: 30 };
        const delays = Array.from({ length: 100 }, () => calculateDelay(0, jitterConfig));

        for (const delay of delays) {
            expect(delay).toBeGreaterThanOrEqual(1000);
            expect(delay).toBeLessThanOrEqual(1300);
        }
    });

    it("should produce varying delays with jitter (not all identical)", () => {
        const jitterConfig = { maxRetries: 3, baseDelayMs: 1000, jitterPercent: 30 };
        const delays = new Set(Array.from({ length: 50 }, () => calculateDelay(0, jitterConfig)));
        expect(delays.size).toBeGreaterThan(1);
    });

    it("should respect custom base delay", () => {
        const customConfig = { maxRetries: 3, baseDelayMs: 500, jitterPercent: 0 };
        expect(calculateDelay(0, customConfig)).toBe(500);
        expect(calculateDelay(1, customConfig)).toBe(1000);
        expect(calculateDelay(2, customConfig)).toBe(2000);
    });
});

// ============================================================================
// withRetry
// ============================================================================

describe("withRetry", () => {
    it("should succeed on first attempt without retrying", async () => {
        const fn = vi.fn().mockResolvedValue("success");

        const result = await withRetry(fn, testOpts());

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(1);
        expect(noopSleep).not.toHaveBeenCalled();
    });

    it("should succeed on 2nd attempt after transient failure", async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error("429 Too Many Requests"))
            .mockResolvedValue("success");

        const result = await withRetry(fn, testOpts());

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(2);
        expect(noopSleep).toHaveBeenCalledTimes(1);
    });

    it("should succeed on 3rd attempt after two transient failures", async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error("500 Internal Server Error"))
            .mockRejectedValueOnce(new Error("502 Bad Gateway"))
            .mockResolvedValue("success");

        const result = await withRetry(fn, testOpts());

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(3);
        expect(noopSleep).toHaveBeenCalledTimes(2);
    });

    it("should fail after exhausting all retries", async () => {
        const error = new Error("429 Too Many Requests");
        const fn = vi.fn().mockRejectedValue(error);

        await expect(withRetry(fn, testOpts())).rejects.toThrow("429 Too Many Requests");

        // Initial + 3 retries = 4 calls
        expect(fn).toHaveBeenCalledTimes(4);
        expect(noopSleep).toHaveBeenCalledTimes(3);
    });

    it("should NOT retry non-transient errors", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("401 Unauthorized"));

        await expect(withRetry(fn, testOpts())).rejects.toThrow("401 Unauthorized");

        expect(fn).toHaveBeenCalledTimes(1);
        expect(noopSleep).not.toHaveBeenCalled();
    });

    it("should NOT retry CircuitOpenError", async () => {
        const fn = vi.fn().mockRejectedValue(new CircuitOpenError("gpt-4o", 5000));

        await expect(withRetry(fn, testOpts())).rejects.toThrow("AI service temporarily unavailable");

        expect(fn).toHaveBeenCalledTimes(1);
        expect(noopSleep).not.toHaveBeenCalled();
    });

    it("should NOT retry BudgetExceededError", async () => {
        const error = new Error("Daily budget exceeded");
        error.name = "BudgetExceededError";
        const fn = vi.fn().mockRejectedValue(error);

        await expect(withRetry(fn, testOpts())).rejects.toThrow("Daily budget exceeded");

        expect(fn).toHaveBeenCalledTimes(1);
        expect(noopSleep).not.toHaveBeenCalled();
    });

    it("should respect custom maxRetries", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("500 Server Error"));

        await expect(withRetry(fn, testOpts({ maxRetries: 1 }))).rejects.toThrow("500 Server Error");

        // 1 initial + 1 retry = 2 total calls
        expect(fn).toHaveBeenCalledTimes(2);
        expect(noopSleep).toHaveBeenCalledTimes(1);
    });

    it("should handle non-Error thrown values", async () => {
        const fn = vi.fn().mockRejectedValue("string error");

        await expect(withRetry(fn, testOpts())).rejects.toThrow("string error");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should pass increasing delay to sleep (exponential backoff)", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("429 Rate Limit"));

        try { await withRetry(fn, testOpts({ baseDelayMs: 100, jitterPercent: 0 })); } catch { }

        // Verify exponential delays: 100, 200, 400
        expect(noopSleep).toHaveBeenCalledTimes(3);
        expect(noopSleep).toHaveBeenNthCalledWith(1, 100);
        expect(noopSleep).toHaveBeenNthCalledWith(2, 200);
        expect(noopSleep).toHaveBeenNthCalledWith(3, 400);
    });
});

// ============================================================================
// METRICS
// ============================================================================

describe("Retry Metrics", () => {
    it("should track first attempt successes", async () => {
        const fn = vi.fn().mockResolvedValue("ok");
        await withRetry(fn, testOpts());

        expect(retryMetrics.totalCalls).toBe(1);
        expect(retryMetrics.firstAttemptSuccesses).toBe(1);
        expect(retryMetrics.totalRetries).toBe(0);
        expect(retryMetrics.retriedSuccesses).toBe(0);
        expect(retryMetrics.exhausted).toBe(0);
    });

    it("should track retried successes", async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error("429 Rate limit"))
            .mockResolvedValue("ok");

        await withRetry(fn, testOpts());

        expect(retryMetrics.totalCalls).toBe(1);
        expect(retryMetrics.firstAttemptSuccesses).toBe(0);
        expect(retryMetrics.totalRetries).toBe(1);
        expect(retryMetrics.retriedSuccesses).toBe(1);
        expect(retryMetrics.exhausted).toBe(0);
    });

    it("should track exhausted retries", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("500 Server Error"));

        try { await withRetry(fn, testOpts({ maxRetries: 2 })); } catch { }

        expect(retryMetrics.totalCalls).toBe(1);
        expect(retryMetrics.totalRetries).toBe(2);
        expect(retryMetrics.exhausted).toBe(1);
    });

    it("should track non-retryable failures as exhausted", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("401 Unauthorized"));

        try { await withRetry(fn, testOpts()); } catch { }

        expect(retryMetrics.totalCalls).toBe(1);
        expect(retryMetrics.totalRetries).toBe(0);
        expect(retryMetrics.exhausted).toBe(1);
    });

    it("should accumulate metrics across multiple calls", async () => {
        const successFn = vi.fn().mockResolvedValue("ok");
        const retryFn = vi.fn()
            .mockRejectedValueOnce(new Error("429 Rate limit"))
            .mockResolvedValue("ok");

        await withRetry(successFn, testOpts());
        await withRetry(retryFn, testOpts());
        await withRetry(vi.fn().mockResolvedValue("ok"), testOpts());

        expect(retryMetrics.totalCalls).toBe(3);
        expect(retryMetrics.firstAttemptSuccesses).toBe(2);
        expect(retryMetrics.retriedSuccesses).toBe(1);
    });

    it("should reset metrics correctly", async () => {
        const fn = vi.fn().mockResolvedValue("ok");
        await withRetry(fn, testOpts());
        expect(retryMetrics.totalCalls).toBe(1);

        resetRetryMetrics();

        expect(retryMetrics.totalCalls).toBe(0);
        expect(retryMetrics.totalRetries).toBe(0);
        expect(retryMetrics.firstAttemptSuccesses).toBe(0);
        expect(retryMetrics.retriedSuccesses).toBe(0);
        expect(retryMetrics.exhausted).toBe(0);
    });
});
