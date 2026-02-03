import type { MiddlewareHandler } from "hono";

/**
 * Request logging middleware
 */
export const requestLogger = (): MiddlewareHandler => {
    return async (c, next) => {
        const start = Date.now();
        const method = c.req.method;
        const path = c.req.path;

        console.log(`→ ${method} ${path}`);

        await next();

        const duration = Date.now() - start;
        const status = c.res.status;
        console.log(`← ${method} ${path} ${status} (${duration}ms)`);
    };
};

/**
 * Simple in-memory rate limiter
 */
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const rateLimiter = (
    maxRequests: number = 60,
    windowMs: number = 60000
): MiddlewareHandler => {
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
        } else if (entry.count >= maxRequests) {
            // Rate limited
            c.res.headers.set("X-RateLimit-Limit", maxRequests.toString());
            c.res.headers.set("X-RateLimit-Remaining", "0");
            c.res.headers.set("X-RateLimit-Reset", entry.resetTime.toString());

            return c.json({
                error: "Rate limit exceeded",
                retryAfter: Math.ceil((entry.resetTime - now) / 1000)
            }, 429);
        } else {
            // Increment
            entry.count++;
        }

        // Add rate limit headers
        const current = rateLimitStore.get(key)!;
        c.res.headers.set("X-RateLimit-Limit", maxRequests.toString());
        c.res.headers.set("X-RateLimit-Remaining", (maxRequests - current.count).toString());

        await next();
    };
};

/**
 * Error handler middleware
 */
export const errorHandler = (): MiddlewareHandler => {
    return async (c, next) => {
        try {
            await next();
        } catch (error) {
            console.error("❌ Unhandled error:", error);

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
export const cors = (allowedOrigins: string[] = ["*"]): MiddlewareHandler => {
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

