/**
 * Circuit Breaker for LLM API Resilience
 *
 * Protects against cascading failures when LLM providers (OpenAI, Anthropic)
 * go down. Tracks failures per-model so an OpenAI outage doesn't block
 * Anthropic calls.
 *
 * States:
 *   CLOSED    → Normal operation. Increments failure counter on errors.
 *   OPEN      → Too many failures. Rejects all calls with CircuitOpenError.
 *   HALF_OPEN → Timeout expired. Allows ONE test call to probe recovery.
 *
 * Usage:
 *   import { circuitBreakerRegistry } from "../lib/circuit-breaker.js";
 *
 *   const cb = circuitBreakerRegistry.get("gpt-4o");
 *   if (!cb.canExecute()) throw new CircuitOpenError("gpt-4o");
 *   try { await llm.invoke(...); cb.recordSuccess(); }
 *   catch (e) { cb.recordFailure(); throw e; }
 */

import { EventEmitter } from "node:events";
import { logger } from "./logger.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface CircuitBreakerConfig {
    /** Number of consecutive failures before opening the circuit. Default: 3 */
    maxFailures: number;
    /** Milliseconds to wait in OPEN state before moving to HALF_OPEN. Default: 60000 */
    timeoutMs: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
    maxFailures: parseInt(process.env.CB_MAX_FAILURES || "3", 10),
    timeoutMs: parseInt(process.env.CB_TIMEOUT_MS || "60000", 10),
};

// ============================================================================
// CIRCUIT STATE
// ============================================================================

export enum CircuitState {
    /** Normal operation — calls proceed. */
    CLOSED = "CLOSED",
    /** Too many failures — calls are rejected. */
    OPEN = "OPEN",
    /** Probing recovery — one test call allowed. */
    HALF_OPEN = "HALF_OPEN",
}

// ============================================================================
// CIRCUIT OPEN ERROR
// ============================================================================

export class CircuitOpenError extends Error {
    public readonly modelName: string;
    public readonly retryAfterMs: number;

    constructor(modelName: string, retryAfterMs: number = 0) {
        super(
            `AI service temporarily unavailable (${modelName}). ` +
            `The system detected repeated failures and paused requests to prevent further issues. ` +
            (retryAfterMs > 0
                ? `Please try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`
                : `Please try again shortly.`)
        );
        this.name = "CircuitOpenError";
        this.modelName = modelName;
        this.retryAfterMs = retryAfterMs;
    }
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export class CircuitBreaker {
    private _state: CircuitState = CircuitState.CLOSED;
    private _failureCount: number = 0;
    private _lastFailureTime: number = 0;
    private _lastStateChange: number = Date.now();

    public readonly modelName: string;
    public readonly config: CircuitBreakerConfig;
    public readonly events: EventEmitter;

    constructor(modelName: string, config?: Partial<CircuitBreakerConfig>, events?: EventEmitter) {
        this.modelName = modelName;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.events = events || new EventEmitter();
    }

    // ---- State Inspection ----

    get state(): CircuitState {
        return this._state;
    }

    get failureCount(): number {
        return this._failureCount;
    }

    get lastFailureTime(): number {
        return this._lastFailureTime;
    }

    /**
     * Returns a snapshot of the circuit breaker's current state.
     */
    getState(): {
        state: CircuitState;
        failureCount: number;
        lastFailureTime: number;
        modelName: string;
    } {
        return {
            state: this._state,
            failureCount: this._failureCount,
            lastFailureTime: this._lastFailureTime,
            modelName: this.modelName,
        };
    }

    // ---- Core API ----

    /**
     * Check whether a call is allowed under the current circuit state.
     *
     * - CLOSED  → always true
     * - OPEN    → check if timeout has expired; if so, transition to HALF_OPEN
     * - HALF_OPEN → true (allows one probe call)
     */
    canExecute(): boolean {
        switch (this._state) {
            case CircuitState.CLOSED:
                return true;

            case CircuitState.OPEN: {
                const elapsed = Date.now() - this._lastFailureTime;
                if (elapsed >= this.config.timeoutMs) {
                    this.transitionTo(CircuitState.HALF_OPEN);
                    return true;
                }
                return false;
            }

            case CircuitState.HALF_OPEN:
                return true;
        }
    }

    /**
     * Record a successful LLM call. Resets failure count and closes the circuit.
     */
    recordSuccess(): void {
        if (this._state === CircuitState.HALF_OPEN) {
            logger.info(`⚡ Circuit breaker CLOSED (recovered)`, {
                model: this.modelName,
            } as any);
        }

        this._failureCount = 0;
        if (this._state !== CircuitState.CLOSED) {
            this.transitionTo(CircuitState.CLOSED);
        }
    }

    /**
     * Record a failed LLM call. May open the circuit if threshold is reached.
     */
    recordFailure(): void {
        this._failureCount++;
        this._lastFailureTime = Date.now();

        if (this._state === CircuitState.HALF_OPEN) {
            // Probe failed — go back to OPEN
            logger.warn(`⚡ Circuit breaker re-OPENED (half-open probe failed)`, {
                model: this.modelName,
                failures: this._failureCount,
            } as any);
            this.transitionTo(CircuitState.OPEN);
            return;
        }

        if (this._failureCount >= this.config.maxFailures) {
            logger.warn(`⚡ Circuit breaker OPENED`, {
                model: this.modelName,
                failures: this._failureCount,
                timeoutMs: this.config.timeoutMs,
            } as any);
            this.transitionTo(CircuitState.OPEN);
        }
    }

    /**
     * Manually reset the circuit breaker to CLOSED state.
     */
    reset(): void {
        this._failureCount = 0;
        this._lastFailureTime = 0;
        this.transitionTo(CircuitState.CLOSED);
    }

    /**
     * Get remaining time (ms) before the circuit transitions from OPEN to HALF_OPEN.
     * Returns 0 if not in OPEN state.
     */
    get remainingTimeoutMs(): number {
        if (this._state !== CircuitState.OPEN) return 0;
        const elapsed = Date.now() - this._lastFailureTime;
        return Math.max(0, this.config.timeoutMs - elapsed);
    }

    // ---- Internal ----

    private transitionTo(newState: CircuitState): void {
        const oldState = this._state;
        this._state = newState;
        this._lastStateChange = Date.now();

        // Emit events
        switch (newState) {
            case CircuitState.OPEN:
                this.events.emit("circuit_opened", {
                    modelName: this.modelName,
                    failureCount: this._failureCount,
                    timestamp: this._lastStateChange,
                });
                break;
            case CircuitState.CLOSED:
                this.events.emit("circuit_closed", {
                    modelName: this.modelName,
                    timestamp: this._lastStateChange,
                });
                break;
            case CircuitState.HALF_OPEN:
                this.events.emit("circuit_half_open", {
                    modelName: this.modelName,
                    timestamp: this._lastStateChange,
                });
                break;
        }
    }
}

// ============================================================================
// REGISTRY — one CircuitBreaker per model
// ============================================================================

class CircuitBreakerRegistryImpl {
    private breakers: Map<string, CircuitBreaker> = new Map();
    public readonly events: EventEmitter = new EventEmitter();

    /**
     * Get or create a circuit breaker for a model.
     */
    get(modelName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
        let cb = this.breakers.get(modelName);
        if (!cb) {
            cb = new CircuitBreaker(modelName, config, this.events);
            this.breakers.set(modelName, cb);
        }
        return cb;
    }

    /**
     * Get all registered circuit breakers (for monitoring dashboards).
     */
    getAll(): Map<string, CircuitBreaker> {
        return new Map(this.breakers);
    }

    /**
     * Get a status summary for all registered models.
     */
    getStatus(): Array<{
        modelName: string;
        state: CircuitState;
        failureCount: number;
        remainingTimeoutMs: number;
    }> {
        return Array.from(this.breakers.values()).map(cb => ({
            modelName: cb.modelName,
            state: cb.state,
            failureCount: cb.failureCount,
            remainingTimeoutMs: cb.remainingTimeoutMs,
        }));
    }

    /**
     * Reset all circuit breakers (useful in tests).
     */
    resetAll(): void {
        for (const cb of this.breakers.values()) {
            cb.reset();
        }
    }

    /**
     * Clear all registered breakers (useful in tests).
     */
    clear(): void {
        this.breakers.clear();
        this.events.removeAllListeners();
    }
}

/** Singleton registry — one circuit breaker per model across the entire process. */
export const circuitBreakerRegistry = new CircuitBreakerRegistryImpl();
