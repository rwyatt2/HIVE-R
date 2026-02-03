/**
 * API Authentication Middleware for HIVE-R
 *
 * Provides API key authentication for protected endpoints.
 * Set HIVE_API_KEY to enable; if not set, auth is disabled.
 */
import { logger } from "./logger.js";
// ============================================================================
// CONFIGURATION
// ============================================================================
const API_KEY = process.env.HIVE_API_KEY;
const AUTH_ENABLED = !!API_KEY;
// Endpoints that don't require auth
const PUBLIC_ENDPOINTS = [
    "/health",
    "/metrics",
    "/metrics/prometheus",
];
// ============================================================================
// MIDDLEWARE
// ============================================================================
/**
 * API Key authentication middleware.
 * Expects: Authorization: Bearer <api-key>
 */
export const authMiddleware = async (c, next) => {
    // Skip if auth is disabled
    if (!AUTH_ENABLED) {
        return next();
    }
    // Skip public endpoints
    const path = c.req.path;
    if (PUBLIC_ENDPOINTS.some(p => path === p || path.startsWith(p))) {
        return next();
    }
    // Check Authorization header
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
        logger.warn("🔒 Unauthorized request - no auth header", { path });
        return c.json({ error: "Authorization header required" }, 401);
    }
    // Parse Bearer token
    const match = authHeader.match(/^Bearer\s+(.+)$/);
    if (!match) {
        logger.warn("🔒 Unauthorized request - invalid format", { path });
        return c.json({ error: "Invalid authorization format. Use: Bearer <api-key>" }, 401);
    }
    const providedKey = match[1];
    // Validate key
    if (providedKey !== API_KEY) {
        logger.warn("🔒 Unauthorized request - invalid key", { path });
        return c.json({ error: "Invalid API key" }, 403);
    }
    // Auth successful
    return next();
};
/**
 * Check if authentication is enabled
 */
export function isAuthEnabled() {
    return AUTH_ENABLED;
}
/**
 * Get auth status for health check
 */
export function getAuthStatus() {
    return {
        enabled: AUTH_ENABLED,
        publicEndpoints: PUBLIC_ENDPOINTS,
    };
}
//# sourceMappingURL=auth.js.map