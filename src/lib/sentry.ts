/**
 * Sentry Error Monitoring for HIVE-R
 * 
 * Provides centralized error tracking and alerting.
 * Set SENTRY_DSN environment variable to enable.
 */

// Sentry module reference - will be dynamically imported
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

// Track initialization state
let isInitialized = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize Sentry error tracking.
 * Call this once at server startup.
 */
export async function initSentry(): Promise<boolean> {
    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
        console.log("ℹ️ Sentry disabled (SENTRY_DSN not set)");
        return false;
    }

    try {
        // Dynamic import to avoid errors if package isn't installed
        Sentry = await import("@sentry/node");

        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || "development",
            release: process.env.npm_package_version || "1.0.0",

            // Performance monitoring - sample 10% of transactions
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),

            // Only capture errors in production by default
            beforeSend(event: { message?: string }) {
                if (process.env.NODE_ENV !== "production" && !process.env.SENTRY_DEV) {
                    console.log("🔍 Sentry event (dev mode, not sent):", event.message);
                    return null; // Don't send in dev unless explicitly enabled
                }
                return event;
            },
        });

        isInitialized = true;
        console.log("✅ Sentry initialized");
        return true;
    } catch (error) {
        console.warn("⚠️ Sentry initialization failed:", error);
        return false;
    }
}

// ============================================================================
// ERROR CAPTURE
// ============================================================================

export interface ErrorContext {
    threadId?: string;
    agentName?: string;
    userId?: string;
    [key: string]: unknown;
}

/**
 * Capture an exception and send to Sentry.
 */
export function captureError(error: Error, context?: ErrorContext): string | null {
    if (!Sentry || !isInitialized) {
        console.error("❌ Error (Sentry disabled):", error.message, context);
        return null;
    }

    const eventId = Sentry.captureException(error, {
        extra: context,
        tags: {
            agent: context?.agentName,
            thread: context?.threadId,
        },
    });

    console.error(`❌ Error captured [${eventId}]:`, error.message);
    return eventId;
}

/**
 * Capture a message (non-error) to Sentry.
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: ErrorContext): string | null {
    if (!Sentry || !isInitialized) {
        console.log(`ℹ️ Message (Sentry disabled): ${message}`);
        return null;
    }

    const eventId = Sentry.captureMessage(message, {
        level,
        extra: context,
    });

    return eventId;
}

// ============================================================================
// CONTEXT MANAGEMENT
// ============================================================================

/**
 * Set user context for Sentry.
 */
export function setUser(user: { id?: string; email?: string; username?: string }): void {
    if (!Sentry || !isInitialized) return;
    Sentry.setUser(user);
}

/**
 * Clear user context.
 */
export function clearUser(): void {
    if (!Sentry || !isInitialized) return;
    Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging.
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (!Sentry || !isInitialized) return;

    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: "info",
        timestamp: Date.now() / 1000,
    });
}

// ============================================================================
// TRANSACTION TRACING
// ============================================================================

/**
 * Start a transaction for performance monitoring.
 * Returns a function to finish the transaction.
 */
export function startTransaction(name: string, op: string): (() => void) | null {
    if (!Sentry || !isInitialized) return null;

    const transaction = Sentry.startInactiveSpan({
        name,
        op,
    });

    return () => {
        transaction?.end();
    };
}

// ============================================================================
// STATUS
// ============================================================================

/**
 * Check if Sentry is enabled and initialized.
 */
export function isSentryEnabled(): boolean {
    return isInitialized;
}

/**
 * Get Sentry status for health checks.
 */
export function getSentryStatus(): { enabled: boolean; dsn: boolean } {
    return {
        enabled: isInitialized,
        dsn: !!process.env.SENTRY_DSN,
    };
}

// ============================================================================
// HONO MIDDLEWARE
// ============================================================================

import type { Context, Next } from "hono";

/**
 * Sentry error handler middleware for Hono.
 * Catches unhandled errors and reports them to Sentry.
 */
export const sentryErrorHandler = () => {
    return async (c: Context, next: Next) => {
        try {
            await next();
        } catch (error) {
            if (error instanceof Error) {
                captureError(error, {
                    path: c.req.path,
                    method: c.req.method,
                });
            }
            throw error; // Re-throw to let other error handlers deal with it
        }
    };
};
