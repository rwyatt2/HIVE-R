import type { MiddlewareHandler } from "hono";
/**
 * Request logging middleware
 */
export declare const requestLogger: () => MiddlewareHandler;
export declare const rateLimiter: (maxRequests?: number, windowMs?: number) => MiddlewareHandler;
/**
 * Error handler middleware
 */
export declare const errorHandler: () => MiddlewareHandler;
/**
 * CORS middleware for dashboard/external access
 */
export declare const cors: (allowedOrigins?: string[]) => MiddlewareHandler;
//# sourceMappingURL=middleware.d.ts.map