/**
 * JWT Authentication Middleware for HIVE-R
 *
 * Enforces JWT verification on all routes except explicitly public ones.
 * Attaches authenticated user info to Hono context for downstream use.
 *
 * Usage in route handlers:
 *   const user = c.get("user"); // { userId, email }
 */

import type { Context, Next } from "hono";
import { verifyAccessToken } from "../lib/user-auth.js";
import { logger } from "../lib/logger.js";

// ============================================================================
// TYPES
// ============================================================================

export interface AuthUser {
    userId: string;
    email: string;
}

// ============================================================================
// PUBLIC ROUTES (no JWT required)
// ============================================================================

/** Exact paths that are always public */
const PUBLIC_EXACT: ReadonlySet<string> = new Set([
    "/health",
    "/metrics",
]);

/** Prefix patterns — any path starting with these is public */
const PUBLIC_PREFIXES: readonly string[] = [
    "/health/",
    "/auth/",
    "/demo/",
    "/metrics/",
];

/**
 * Routes that are public only for specific HTTP methods.
 * For example, GET /plugins is public (catalog browse), but POST /plugins requires auth.
 */
const PUBLIC_METHOD_ROUTES: ReadonlyArray<{ method: string; pattern: RegExp }> = [
    { method: "GET", pattern: /^\/plugins(\/[^/]+)?$/ },           // GET /plugins, GET /plugins/:id
    { method: "GET", pattern: /^\/plugins\/[^/]+\/ratings$/ },     // GET /plugins/:id/ratings
];

// ============================================================================
// HELPERS
// ============================================================================

function isPublicRoute(method: string, path: string): boolean {
    // Exact match
    if (PUBLIC_EXACT.has(path)) return true;

    // Prefix match
    for (const prefix of PUBLIC_PREFIXES) {
        if (path.startsWith(prefix)) return true;
    }

    // Method-specific match
    const upperMethod = method.toUpperCase();
    for (const route of PUBLIC_METHOD_ROUTES) {
        if (route.method === upperMethod && route.pattern.test(path)) {
            return true;
        }
    }

    return false;
}

function extractBearerToken(header: string | undefined): string | null {
    if (!header) return null;
    const match = header.match(/^Bearer\s+(.+)$/);
    return match?.[1] ?? null;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * JWT authentication middleware.
 *
 * - Skips public routes.
 * - Extracts Bearer token from Authorization header.
 * - Verifies JWT signature and expiry.
 * - Sets `c.var.user` with `{ userId, email }` for downstream handlers.
 * - Returns 401 with a specific error code on failure.
 */
export async function jwtAuthMiddleware(c: Context, next: Next): Promise<Response | void> {
    const path = c.req.path;
    const method = c.req.method;

    // Skip public routes
    if (isPublicRoute(method, path)) {
        // If a token IS provided on a public route, still validate and attach user
        const token = extractBearerToken(c.req.header("Authorization"));
        if (token) {
            const user = verifyAccessToken(token);
            if (user) {
                c.set("user", user);
            }
        }
        return next();
    }

    // Require Authorization header
    const authHeader = c.req.header("Authorization");
    const token = extractBearerToken(authHeader);

    if (!token) {
        logger.warn("🔒 JWT: missing token", { path, method });
        return c.json(
            {
                error: "Authentication required",
                code: "TOKEN_MISSING",
                hint: "Include header: Authorization: Bearer <access_token>",
            },
            401
        );
    }

    // Verify JWT
    const user = verifyAccessToken(token);

    if (!user) {
        // Determine whether it's expired vs tampered for a better error message.
        // verifyAccessToken returns null for both cases, so we do a lightweight check.
        const isExpired = isTokenExpired(token);
        const code = isExpired ? "TOKEN_EXPIRED" : "TOKEN_INVALID";
        const message = isExpired
            ? "Access token has expired. Use /auth/refresh to get a new one."
            : "Invalid access token.";

        logger.warn(`🔒 JWT: ${code}`, { path, method });
        return c.json({ error: message, code }, 401);
    }

    // Attach user to context
    c.set("user", user);
    return next();
}

/**
 * Lightweight check: is the token structurally valid but expired?
 * Used only to provide a better error code — NOT for security decisions.
 */
function isTokenExpired(token: string): boolean {
    try {
        const parts = token.split(".");
        if (parts.length !== 3 || !parts[1]) return false;

        const payloadJson = Buffer.from(
            parts[1].replace(/-/g, "+").replace(/_/g, "/") +
            "=".repeat((4 - (parts[1].length % 4)) % 4),
            "base64"
        ).toString("utf8");

        const payload = JSON.parse(payloadJson);
        const now = Math.floor(Date.now() / 1000);
        return typeof payload.exp === "number" && payload.exp < now;
    } catch {
        return false;
    }
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export { isPublicRoute };
