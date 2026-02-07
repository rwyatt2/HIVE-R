/**
 * HTTP Metrics Middleware for HIVE-R
 *
 * Hono middleware that records Prometheus metrics for every request:
 * - hive_http_requests_total (counter)
 * - hive_http_request_duration_seconds (histogram)
 *
 * Paths are normalised to prevent label cardinality explosion.
 */

import type { MiddlewareHandler } from "hono";
import { httpRequestsTotal, httpRequestDuration } from "./metrics.js";

// ============================================================================
// PATH NORMALISATION
// ============================================================================

/**
 * Normalise URL paths to prevent high-cardinality labels.
 * UUIDs, numeric IDs, and thread IDs are replaced with `:id`.
 */
function normalisePath(path: string): string {
    return path
        // UUID segments
        .replace(
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
            ":id",
        )
        // thread_ prefixed IDs
        .replace(/thread_[a-zA-Z0-9]+/g, ":id")
        // Pure numeric segments
        .replace(/\/\d+(?=\/|$)/g, "/:id");
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Hono middleware that records HTTP request metrics.
 *
 * Mount this BEFORE auth middleware so that it captures all requests,
 * including those rejected by auth.
 */
export const metricsMiddleware = (): MiddlewareHandler => {
    return async (c, next) => {
        const end = httpRequestDuration.startTimer();
        const method = c.req.method;
        const rawPath = c.req.path;

        await next();

        const status = String(c.res.status);
        const path = normalisePath(rawPath);

        // Record counter
        httpRequestsTotal.inc({ method, path, status });

        // Record histogram (stop timer)
        end({ method, path, status });
    };
};
