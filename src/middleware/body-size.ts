/**
 * Body Size Limiting Middleware
 * 
 * Prevents excessively large request bodies to protect against DoS attacks.
 * Returns 413 Payload Too Large if Content-Length exceeds MAX_BODY_SIZE.
 */

import type { Context, Next } from "hono";
import { logger } from "../lib/logger.js";

// 10KB max body size
export const MAX_BODY_SIZE = 10 * 1024;

/**
 * Middleware that rejects requests with Content-Length exceeding MAX_BODY_SIZE.
 * 
 * Note: This only checks the Content-Length header. For streaming bodies
 * without Content-Length, consider adding request body streaming limits.
 */
export async function bodySizeLimit(c: Context, next: Next): Promise<Response | void> {
    const contentLength = c.req.header("content-length");

    if (contentLength) {
        const size = parseInt(contentLength, 10);

        if (!isNaN(size) && size > MAX_BODY_SIZE) {
            const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

            logger.warn(`🛡️ Security: body_too_large`, {
                ip,
                contentLength: size,
                maxSize: MAX_BODY_SIZE,
                path: c.req.path,
                timestamp: new Date().toISOString(),
            } as any);

            return c.json({
                success: false,
                error: `Request body too large. Maximum size is ${Math.round(MAX_BODY_SIZE / 1024)}KB.`,
                code: "BODY_TOO_LARGE",
            }, 413);
        }
    }

    return next();
}
