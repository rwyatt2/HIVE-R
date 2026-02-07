/**
 * Circuit Breaker Tests
 *
 * Verifies the three-state machine (CLOSED → OPEN → HALF_OPEN → CLOSED),
 * per-model isolation, event emission, configuration, and error messages.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    CircuitBreaker,
    CircuitState,
    CircuitOpenError,
    circuitBreakerRegistry,
} from "../../src/lib/circuit-breaker.js";

// Mock logger to suppress output
vi.mock("../../src/lib/logger.js", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

describe("CircuitBreaker", () => {
    let cb: CircuitBreaker;

    beforeEach(() => {
        cb = new CircuitBreaker("gpt-4o", { maxFailures: 3, timeoutMs: 60000 });
    });

    // ====================================================================
    // STATE TRANSITIONS
    // ====================================================================

    describe("State Transitions", () => {
        it("should start in CLOSED state", () => {
            expect(cb.state).toBe(CircuitState.CLOSED);
            expect(cb.failureCount).toBe(0);
        });

        it("should stay CLOSED after fewer failures than threshold", () => {
            cb.recordFailure();
            cb.recordFailure();
            expect(cb.state).toBe(CircuitState.CLOSED);
            expect(cb.failureCount).toBe(2);
        });

        it("should transition to OPEN after reaching maxFailures", () => {
            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();
            expect(cb.state).toBe(CircuitState.OPEN);
            expect(cb.failureCount).toBe(3);
        });

        it("should transition from OPEN to HALF_OPEN after timeout expires", () => {
            // Open the circuit
            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();
            expect(cb.state).toBe(CircuitState.OPEN);

            // Fast-forward past timeout
            vi.useFakeTimers();
            vi.advanceTimersByTime(60001);

            expect(cb.canExecute()).toBe(true);
            expect(cb.state).toBe(CircuitState.HALF_OPEN);

            vi.useRealTimers();
        });

        it("should transition from HALF_OPEN to CLOSED on success", () => {
            // Open the circuit
            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();

            // Move to HALF_OPEN
            vi.useFakeTimers();
            vi.advanceTimersByTime(60001);
            cb.canExecute();
            expect(cb.state).toBe(CircuitState.HALF_OPEN);

            // Record success — should close
            cb.recordSuccess();
            expect(cb.state).toBe(CircuitState.CLOSED);
            expect(cb.failureCount).toBe(0);

            vi.useRealTimers();
        });

        it("should transition from HALF_OPEN back to OPEN on failure", () => {
            // Open the circuit
            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();

            // Move to HALF_OPEN
            vi.useFakeTimers();
            vi.advanceTimersByTime(60001);
            cb.canExecute();
            expect(cb.state).toBe(CircuitState.HALF_OPEN);

            // Probe fails — back to OPEN
            cb.recordFailure();
            expect(cb.state).toBe(CircuitState.OPEN);

            vi.useRealTimers();
        });

        it("should reset failure count on success in CLOSED state", () => {
            cb.recordFailure();
            cb.recordFailure();
            expect(cb.failureCount).toBe(2);

            cb.recordSuccess();
            expect(cb.failureCount).toBe(0);
            expect(cb.state).toBe(CircuitState.CLOSED);
        });
    });

    // ====================================================================
    // canExecute()
    // ====================================================================

    describe("canExecute()", () => {
        it("should allow calls when CLOSED", () => {
            expect(cb.canExecute()).toBe(true);
        });

        it("should block calls when OPEN and timeout not expired", () => {
            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();
            expect(cb.canExecute()).toBe(false);
        });

        it("should allow one probe when OPEN and timeout expired", () => {
            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();

            vi.useFakeTimers();
            vi.advanceTimersByTime(60001);

            expect(cb.canExecute()).toBe(true);
            expect(cb.state).toBe(CircuitState.HALF_OPEN);

            vi.useRealTimers();
        });

        it("should allow calls when HALF_OPEN", () => {
            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();

            vi.useFakeTimers();
            vi.advanceTimersByTime(60001);
            cb.canExecute(); // triggers HALF_OPEN transition

            // Should still allow the call
            expect(cb.canExecute()).toBe(true);

            vi.useRealTimers();
        });
    });

    // ====================================================================
    // EVENT EMISSION
    // ====================================================================

    describe("Events", () => {
        it("should emit circuit_opened when transitioning to OPEN", () => {
            const handler = vi.fn();
            cb.events.on("circuit_opened", handler);

            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(
                expect.objectContaining({
                    modelName: "gpt-4o",
                    failureCount: 3,
                })
            );
        });

        it("should emit circuit_closed when recovering", () => {
            const handler = vi.fn();
            cb.events.on("circuit_closed", handler);

            // Open then recover
            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();

            vi.useFakeTimers();
            vi.advanceTimersByTime(60001);
            cb.canExecute(); // HALF_OPEN
            cb.recordSuccess(); // CLOSED

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(
                expect.objectContaining({ modelName: "gpt-4o" })
            );

            vi.useRealTimers();
        });

        it("should emit circuit_half_open when timeout expires", () => {
            const handler = vi.fn();
            cb.events.on("circuit_half_open", handler);

            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();

            vi.useFakeTimers();
            vi.advanceTimersByTime(60001);
            cb.canExecute(); // triggers HALF_OPEN

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(
                expect.objectContaining({ modelName: "gpt-4o" })
            );

            vi.useRealTimers();
        });
    });

    // ====================================================================
    // CONFIGURATION
    // ====================================================================

    describe("Configuration", () => {
        it("should respect custom maxFailures", () => {
            const cb5 = new CircuitBreaker("gpt-4o", { maxFailures: 5, timeoutMs: 1000 });

            for (let i = 0; i < 4; i++) cb5.recordFailure();
            expect(cb5.state).toBe(CircuitState.CLOSED);

            cb5.recordFailure(); // 5th failure
            expect(cb5.state).toBe(CircuitState.OPEN);
        });

        it("should respect custom timeoutMs", () => {
            const cb5s = new CircuitBreaker("gpt-4o", { maxFailures: 1, timeoutMs: 5000 });

            cb5s.recordFailure();
            expect(cb5s.state).toBe(CircuitState.OPEN);

            vi.useFakeTimers();

            // Not yet expired
            vi.advanceTimersByTime(4999);
            expect(cb5s.canExecute()).toBe(false);

            // Now expired
            vi.advanceTimersByTime(2);
            expect(cb5s.canExecute()).toBe(true);

            vi.useRealTimers();
        });
    });

    // ====================================================================
    // RESET
    // ====================================================================

    describe("reset()", () => {
        it("should reset OPEN circuit to CLOSED", () => {
            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();
            expect(cb.state).toBe(CircuitState.OPEN);

            cb.reset();
            expect(cb.state).toBe(CircuitState.CLOSED);
            expect(cb.failureCount).toBe(0);
            expect(cb.canExecute()).toBe(true);
        });
    });

    // ====================================================================
    // getState()
    // ====================================================================

    describe("getState()", () => {
        it("should return a complete state snapshot", () => {
            cb.recordFailure();

            const state = cb.getState();
            expect(state).toEqual({
                state: CircuitState.CLOSED,
                failureCount: 1,
                lastFailureTime: expect.any(Number),
                modelName: "gpt-4o",
            });
        });
    });

    // ====================================================================
    // remainingTimeoutMs
    // ====================================================================

    describe("remainingTimeoutMs", () => {
        it("should return 0 when CLOSED", () => {
            expect(cb.remainingTimeoutMs).toBe(0);
        });

        it("should return remaining time when OPEN", () => {
            vi.useFakeTimers();
            cb.recordFailure();
            cb.recordFailure();
            cb.recordFailure();

            vi.advanceTimersByTime(20000);
            // 60000 - 20000 = 40000
            expect(cb.remainingTimeoutMs).toBe(40000);

            vi.useRealTimers();
        });
    });
});

// ============================================================================
// CIRCUIT BREAKER REGISTRY
// ============================================================================

describe("CircuitBreakerRegistry", () => {
    beforeEach(() => {
        circuitBreakerRegistry.clear();
    });

    afterEach(() => {
        circuitBreakerRegistry.clear();
    });

    it("should create and cache circuit breakers per model", () => {
        const cb1 = circuitBreakerRegistry.get("gpt-4o");
        const cb2 = circuitBreakerRegistry.get("gpt-4o");
        expect(cb1).toBe(cb2); // Same instance
    });

    it("should isolate circuit breakers between models", () => {
        const openai = circuitBreakerRegistry.get("gpt-4o");
        const claude = circuitBreakerRegistry.get("claude-3-5-sonnet");

        // Open the OpenAI circuit
        openai.recordFailure();
        openai.recordFailure();
        openai.recordFailure();

        expect(openai.state).toBe(CircuitState.OPEN);
        expect(claude.state).toBe(CircuitState.CLOSED); // Unaffected!
    });

    it("should return status for all models", () => {
        circuitBreakerRegistry.get("gpt-4o");
        circuitBreakerRegistry.get("claude-3-5-sonnet");

        const status = circuitBreakerRegistry.getStatus();
        expect(status).toHaveLength(2);
        expect(status.map(s => s.modelName)).toContain("gpt-4o");
        expect(status.map(s => s.modelName)).toContain("claude-3-5-sonnet");
    });

    it("should share events across all circuit breakers", () => {
        const handler = vi.fn();
        circuitBreakerRegistry.events.on("circuit_opened", handler);

        const openai = circuitBreakerRegistry.get("gpt-4o");
        openai.recordFailure();
        openai.recordFailure();
        openai.recordFailure();

        expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({ modelName: "gpt-4o" })
        );
    });

    it("should reset all circuit breakers", () => {
        const openai = circuitBreakerRegistry.get("gpt-4o");
        const claude = circuitBreakerRegistry.get("claude-3-5-sonnet");

        openai.recordFailure();
        openai.recordFailure();
        openai.recordFailure();
        claude.recordFailure();

        circuitBreakerRegistry.resetAll();

        expect(openai.state).toBe(CircuitState.CLOSED);
        expect(claude.state).toBe(CircuitState.CLOSED);
        expect(openai.failureCount).toBe(0);
    });
});

// ============================================================================
// CIRCUIT OPEN ERROR
// ============================================================================

describe("CircuitOpenError", () => {
    it("should provide a user-friendly message", () => {
        const error = new CircuitOpenError("gpt-4o", 45000);

        expect(error.message).toContain("AI service temporarily unavailable");
        expect(error.message).toContain("gpt-4o");
        expect(error.message).toContain("45 seconds");
        expect(error.name).toBe("CircuitOpenError");
        expect(error.modelName).toBe("gpt-4o");
        expect(error.retryAfterMs).toBe(45000);
    });

    it("should handle zero retryAfterMs gracefully", () => {
        const error = new CircuitOpenError("claude-3-5-sonnet");

        expect(error.message).toContain("try again shortly");
        expect(error.retryAfterMs).toBe(0);
    });

    it("should be an instance of Error", () => {
        const error = new CircuitOpenError("gpt-4o");
        expect(error).toBeInstanceOf(Error);
    });
});
