/**
 * API Authentication Middleware for HIVE-R
 *
 * Provides API key authentication for protected endpoints.
 * Set HIVE_API_KEY to enable; if not set, auth is disabled.
 */
import type { Context, Next } from "hono";
/**
 * API Key authentication middleware.
 * Expects: Authorization: Bearer <api-key>
 */
export declare const authMiddleware: (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">)>;
/**
 * Check if authentication is enabled
 */
export declare function isAuthEnabled(): boolean;
/**
 * Get auth status for health check
 */
export declare function getAuthStatus(): {
    enabled: boolean;
    publicEndpoints: string[];
};
//# sourceMappingURL=auth.d.ts.map