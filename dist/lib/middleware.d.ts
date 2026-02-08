import type { MiddlewareHandler } from "hono";
/**
 * Request ID middleware — generates or reads X-Request-ID and adds to context + response.
 */
export declare const requestId: () => MiddlewareHandler;
/**
 * Request logging middleware — structured JSON via Pino
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