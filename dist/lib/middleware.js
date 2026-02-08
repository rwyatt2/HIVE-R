import { randomUUID } from "crypto";
import { logger } from "./logger.js";
/**
 * Request ID middleware — generates or reads X-Request-ID and adds to context + response.
 */
export const requestId = () => {
    return async (c, next) => {
        const id = c.req.header("x-request-id") || randomUUID();
        c.set("requestId", id);
        c.res.headers.set("X-Request-ID", id);
        await next();
    };
};
/**
 * Request logging middleware — structured JSON via Pino
 */
export const requestLogger = () => {
    return async (c, next) => {
        const start = Date.now();
        const method = c.req.method;
        const path = c.req.path;
        const requestId = c.get("requestId");
        logger.info({ requestId, method, path, event: "request_start" }, `→ ${method} ${path}`);
        await next();
        const duration = Date.now() - start;
        const status = c.res.status;
        logger.info({ requestId, method, path, status, duration, event: "request_end" }, `← ${method} ${path} ${status} (${duration}ms)`);
    };
};
const rateLimitStore = new Map();
export const rateLimiter = (maxRequests = 60, windowMs = 60000) => {
    return async (c, next) => {
        // Use IP or thread ID as key
        const key = c.req.header("x-forwarded-for") ||
            c.req.header("x-real-ip") ||
            "anonymous";
        const now = Date.now();
        const entry = rateLimitStore.get(key);
        if (!entry || now > entry.resetTime) {
            // New window
            rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        }
        else if (entry.count >= maxRequests) {
            // Rate limited
            c.res.headers.set("X-RateLimit-Limit", maxRequests.toString());
            c.res.headers.set("X-RateLimit-Remaining", "0");
            c.res.headers.set("X-RateLimit-Reset", entry.resetTime.toString());
            return c.json({
                error: "Rate limit exceeded",
                retryAfter: Math.ceil((entry.resetTime - now) / 1000)
            }, 429);
        }
        else {
            // Increment
            entry.count++;
        }
        // Add rate limit headers
        const current = rateLimitStore.get(key);
        c.res.headers.set("X-RateLimit-Limit", maxRequests.toString());
        c.res.headers.set("X-RateLimit-Remaining", (maxRequests - current.count).toString());
        await next();
    };
};
/**
 * Error handler middleware
 */
export const errorHandler = () => {
    return async (c, next) => {
        try {
            await next();
        }
        catch (error) {
            const requestId = c.get("requestId");
            logger.error({ err: error, requestId, event: "unhandled_error" }, `Unhandled error: ${error instanceof Error ? error.message : "unknown"}`);
            if (error instanceof Error) {
                return c.json({
                    error: "Internal server error",
                    message: process.env.NODE_ENV === "development" ? error.message : undefined
                }, 500);
            }
            return c.json({ error: "Internal server error" }, 500);
        }
    };
};
/**
 * CORS middleware for dashboard/external access
 */
export const cors = (allowedOrigins = ["*"]) => {
    return async (c, next) => {
        const origin = c.req.header("origin") || "";
        // Check if origin is allowed
        const isAllowed = allowedOrigins.includes("*") || allowedOrigins.includes(origin);
        if (isAllowed) {
            c.res.headers.set("Access-Control-Allow-Origin", allowedOrigins.includes("*") ? "*" : origin);
            c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            c.res.headers.set("Access-Control-Max-Age", "86400");
        }
        // Handle preflight
        if (c.req.method === "OPTIONS") {
            return new Response(null, { status: 204 });
        }
        await next();
    };
};
//# sourceMappingURL=middleware.js.map