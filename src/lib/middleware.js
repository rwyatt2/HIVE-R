/**
 * Request logging middleware
 */
export const requestLogger = () => {
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
//# sourceMappingURL=middleware.js.map