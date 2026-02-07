/**
 * LLM Retry Utility
 *
 * Provides automatic retry logic for transient LLM API failures with:
 * - Exponential backoff (1s → 2s → 4s)
 * - Jitter to prevent thundering herd
 * - Smart error classification (retries 429/500/network, skips 400/401)
 * - Per-model metrics tracking
 *
 * Integrated at the `createTrackedLLM` middleware level so all 13 agents
 * get retry protection with zero code changes.
 */

import { logger } from "./logger.js";
import { CircuitOpenError } from "./circuit-breaker.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface RetryConfig {
    /** Maximum number of retry attempts (not including the initial call). */
    maxRetries: number;
    /** Base delay in milliseconds before first retry. */
    baseDelayMs: number;
    /** Percentage of jitter to add (0–100). Randomizes delay to prevent thundering herd. */
    jitterPercent: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: parseInt(process.env.RETRY_MAX_ATTEMPTS || "3", 10),
    baseDelayMs: parseInt(process.env.RETRY_BASE_DELAY_MS || "1000", 10),
    jitterPercent: parseInt(process.env.RETRY_JITTER_PERCENT || "30", 10),
};

// ============================================================================
// METRICS
// ============================================================================

export const retryMetrics = {
    /** Total number of initial attempts made. */
    totalCalls: 0,
    /** Total number of retry attempts (not counting the initial call). */
    totalRetries: 0,
    /** Calls that succeeded on the first attempt. */
    firstAttemptSuccesses: 0,
    /** Calls that succeeded after one or more retries. */
    retriedSuccesses: 0,
    /** Calls that failed after exhausting all retries. */
    exhausted: 0,
};

/** Reset metrics (for testing). */
export function resetRetryMetrics(): void {
    retryMetrics.totalCalls = 0;
    retryMetrics.totalRetries = 0;
    retryMetrics.firstAttemptSuccesses = 0;
    retryMetrics.retriedSuccesses = 0;
    retryMetrics.exhausted = 0;
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * HTTP status codes extracted from various LLM API error formats.
 */
function extractStatusCode(error: Error): number | undefined {
    // Many LLM SDKs include status in the error message: "429 Too Many Requests"
    const messageMatch = error.message.match(/\b(4\d{2}|5\d{2})\b/);
    if (messageMatch) {
        return parseInt(messageMatch[1]!, 10);
    }

    // Check common error properties
    const err = error as any;
    if (typeof err.status === "number") return err.status;
    if (typeof err.statusCode === "number") return err.statusCode;
    if (err.response?.status) return err.response.status;

    return undefined;
}

/**
 * Determines whether an error is transient (worth retrying) or permanent.
 *
 * Retryable (transient):
 *   - 429 (rate limit)
 *   - 500, 502, 503, 504 (server/gateway errors)
 *   - Network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND, etc.)
 *
 * NOT retryable (permanent):
 *   - 400 (bad request — malformed input)
 *   - 401 (auth error — wrong API key)
 *   - 403 (forbidden)
 *   - BudgetExceededError
 *   - CircuitOpenError
 *   - Content policy violations
 */
export function isRetryableError(error: Error): boolean {
    // Never retry circuit breaker or budget errors
    if (error.name === "CircuitOpenError" || error instanceof CircuitOpenError) return false;
    if (error.name === "BudgetExceededError") return false;

    // Never retry content policy / moderation errors
    const msg = error.message.toLowerCase();
    if (msg.includes("content_policy") || msg.includes("content policy") || msg.includes("moderation")) {
        return false;
    }

    // Check status code
    const status = extractStatusCode(error);
    if (status !== undefined) {
        // Retryable status codes
        if ([429, 500, 502, 503, 504].includes(status)) return true;
        // Non-retryable client errors
        if (status >= 400 && status < 500) return false;
    }

    // Network-level errors are retryable
    const networkCodes = ["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EPIPE", "EAI_AGAIN"];
    const errCode = (error as any).code;
    if (errCode && networkCodes.includes(errCode)) return true;

    // Heuristic: common transient error messages
    if (msg.includes("timeout") || msg.includes("timed out")) return true;
    if (msg.includes("network") || msg.includes("socket hang up")) return true;
    if (msg.includes("econnreset") || msg.includes("econnrefused")) return true;
    if (msg.includes("rate limit") || msg.includes("too many requests")) return true;
    if (msg.includes("internal server error")) return true;
    if (msg.includes("bad gateway") || msg.includes("service unavailable")) return true;
    if (msg.includes("gateway timeout")) return true;

    // Default: don't retry unknown errors (fail-safe)
    return false;
}

// ============================================================================
// DELAY CALCULATION
// ============================================================================

/**
 * Calculate retry delay with exponential backoff and jitter.
 *
 * delay = baseDelay * 2^attempt + random jitter
 *
 * Example with defaults (base=1000ms, jitter=30%):
 *   Attempt 0: 1000ms + 0–300ms  →  1.0s–1.3s
 *   Attempt 1: 2000ms + 0–600ms  →  2.0s–2.6s
 *   Attempt 2: 4000ms + 0–1200ms →  4.0s–5.2s
 */
export function calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
    const jitterMax = exponentialDelay * (config.jitterPercent / 100);
    const jitter = Math.random() * jitterMax;
    return Math.floor(exponentialDelay + jitter);
}

// ============================================================================
// RETRY WRAPPER
// ============================================================================

export interface RetryOptions extends Partial<RetryConfig> {
    /** Label for logging (e.g., "Router", "Builder"). */
    label?: string;
    /** Override sleep function (for testing). */
    _sleep?: (ms: number) => Promise<void>;
}

/**
 * Execute an async function with automatic retry on transient errors.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration overrides
 * @returns The result of the function
 * @throws The last error if all retries are exhausted, or immediately for non-retryable errors
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
): Promise<T> {
    const config: RetryConfig = {
        maxRetries: options.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries,
        baseDelayMs: options.baseDelayMs ?? DEFAULT_RETRY_CONFIG.baseDelayMs,
        jitterPercent: options.jitterPercent ?? DEFAULT_RETRY_CONFIG.jitterPercent,
    };
    const label = options.label || "LLM";
    const sleepFn = options._sleep || sleep;

    retryMetrics.totalCalls++;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            const result = await fn();

            // Track metrics
            if (attempt === 0) {
                retryMetrics.firstAttemptSuccesses++;
            } else {
                retryMetrics.retriedSuccesses++;
            }

            return result;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry non-transient errors
            if (!isRetryableError(lastError)) {
                retryMetrics.exhausted++;
                throw lastError;
            }

            // Don't retry if we've used all attempts
            if (attempt >= config.maxRetries) {
                retryMetrics.exhausted++;
                logger.error(`🔄 ${label}: All ${config.maxRetries} retries exhausted`, {
                    error: lastError.message,
                } as any);
                throw lastError;
            }

            // Calculate delay and wait
            const delayMs = calculateDelay(attempt, config);
            retryMetrics.totalRetries++;

            logger.warn(`🔄 ${label}: Retry ${attempt + 1}/${config.maxRetries} in ${delayMs}ms`, {
                error: lastError.message,
                attempt: attempt + 1,
                delayMs,
            } as any);

            await sleepFn(delayMs);
        }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError!;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Promise-based sleep. Exported for test mocking. */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
