/**
 * Multi-Tier Rate Limiting Middleware for HIVE-R
 *
 * Enforces per-user or per-IP rate limits with two sliding windows:
 *   1. Sustained window (1 hour) — overall throughput limit
 *   2. Burst window (1 minute) — prevents short spikes
 *
 * Tiers are resolved at request time from the JWT-authenticated user:
 *   - Anonymous   → keyed by IP
 *   - Free user   → keyed by userId
 *   - Pro/Team/Enterprise → keyed by userId, higher limits
 *   - Admin (system_owner) → unlimited
 *
 * Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After
 */

import type { MiddlewareHandler, Context } from "hono";
import { getUserById } from "../lib/user-auth.js";
import { getCustomerByUserId } from "../lib/billing.js";
import { logger } from "../lib/logger.js";

// ============================================================================
// TYPES
// ============================================================================

export type RateLimitTier = "anonymous" | "free" | "pro" | "team" | "enterprise" | "admin";

interface TierConfig {
    /** Max requests per sustained window */
    hourlyLimit: number;
    /** Max requests per burst window */
    burstLimit: number;
}

interface SlidingWindowEntry {
    /** Timestamps of requests in the sustained window */
    timestamps: number[];
    /** Timestamps of requests in the burst window */
    burstTimestamps: number[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUSTAINED_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const BURST_WINDOW_MS = 60 * 1000;           // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;   // 5 minutes

/** Defaults — overridable via env vars */
const TIER_CONFIGS: Record<RateLimitTier, TierConfig> = {
    anonymous: { hourlyLimit: int("RATE_LIMIT_ANON_HOURLY", 10), burstLimit: int("RATE_LIMIT_ANON_BURST", 5) },
    free: { hourlyLimit: int("RATE_LIMIT_FREE_HOURLY", 100), burstLimit: int("RATE_LIMIT_FREE_BURST", 20) },
    pro: { hourlyLimit: int("RATE_LIMIT_PRO_HOURLY", 500), burstLimit: int("RATE_LIMIT_PRO_BURST", 50) },
    team: { hourlyLimit: int("RATE_LIMIT_TEAM_HOURLY", 1000), burstLimit: int("RATE_LIMIT_TEAM_BURST", 100) },
    enterprise: { hourlyLimit: int("RATE_LIMIT_ENT_HOURLY", 1000), burstLimit: int("RATE_LIMIT_ENT_BURST", 100) },
    admin: { hourlyLimit: Infinity, burstLimit: Infinity },
};

/** IP whitelist — monitoring, load balancers, etc. */
const WHITELISTED_IPS: ReadonlySet<string> = new Set(
    (process.env.RATE_LIMIT_WHITELIST_IPS || "")
        .split(",")
        .map(ip => ip.trim())
        .filter(Boolean),
);

/** Paths exempt from rate limiting */
const EXEMPT_PATHS: ReadonlySet<string> = new Set([
    "/health",
    "/metrics",
    "/metrics/prometheus",
]);

const EXEMPT_PREFIXES: readonly string[] = [
    "/health/",
    "/auth/",
];

function int(envKey: string, fallback: number): number {
    const v = process.env[envKey];
    return v ? parseInt(v, 10) : fallback;
}

// ============================================================================
// SLIDING WINDOW STORE
// ============================================================================

const store = new Map<string, SlidingWindowEntry>();

/** Periodic cleanup of expired entries */
setInterval(() => {
    const now = Date.now();
    const cutoff = now - SUSTAINED_WINDOW_MS;
    let cleaned = 0;

    for (const [key, entry] of store) {
        // Remove timestamps older than the sustained window
        entry.timestamps = entry.timestamps.filter(t => t > cutoff);
        entry.burstTimestamps = entry.burstTimestamps.filter(t => t > now - BURST_WINDOW_MS);

        if (entry.timestamps.length === 0 && entry.burstTimestamps.length === 0) {
            store.delete(key);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        logger.debug({ cleaned, remaining: store.size }, "Rate limit store cleanup");
    }
}, CLEANUP_INTERVAL_MS);

// ============================================================================
// TIER RESOLUTION
// ============================================================================

/**
 * Resolve a user's rate-limit tier from their userId.
 * Priority: admin role > billing tier > free default.
 *
 * Results are cached in a lightweight LRU to avoid DB hits on every request.
 */
const tierCache = new Map<string, { tier: RateLimitTier; expiresAt: number }>();
const TIER_CACHE_TTL_MS = 60 * 1000; // 1 minute

export function resolveUserTier(userId: string): RateLimitTier {
    // Check cache first
    const cached = tierCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.tier;
    }

    let tier: RateLimitTier = "free";

    try {
        // Check role (admin bypass)
        const user = getUserById(userId);
        if (user?.role === "system_owner") {
            tier = "admin";
        } else {
            // Check billing tier
            const customer = getCustomerByUserId(userId);
            if (customer) {
                const billingTier = customer.tier; // free | pro | team | enterprise
                if (billingTier === "pro" || billingTier === "team" || billingTier === "enterprise") {
                    tier = billingTier;
                }
            }
        }
    } catch (err) {
        logger.warn({ err, userId }, "Failed to resolve rate limit tier, defaulting to free");
    }

    // Cache the result
    tierCache.set(userId, { tier, expiresAt: Date.now() + TIER_CACHE_TTL_MS });

    // Evict old cache entries (simple size cap)
    if (tierCache.size > 10000) {
        const firstKey = tierCache.keys().next().value;
        if (firstKey) tierCache.delete(firstKey);
    }

    return tier;
}

// ============================================================================
// HELPERS
// ============================================================================

function getClientIp(c: Context): string {
    return (
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
        c.req.header("x-real-ip") ||
        "0.0.0.0"
    );
}

function isExemptPath(path: string): boolean {
    if (EXEMPT_PATHS.has(path)) return true;
    for (const prefix of EXEMPT_PREFIXES) {
        if (path.startsWith(prefix)) return true;
    }
    return false;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Multi-tier rate limiting middleware.
 *
 * Mount AFTER JWT auth so `c.get("user")` is available.
 */
export const tieredRateLimiter = (): MiddlewareHandler => {
    return async (c, next) => {
        const path = c.req.path;

        // Skip exempt paths
        if (isExemptPath(path)) {
            return next();
        }

        // Determine key and tier
        const ip = getClientIp(c);

        // Skip whitelisted IPs
        if (WHITELISTED_IPS.has(ip)) {
            return next();
        }

        const user = c.get("user") as { userId: string } | undefined;
        let tier: RateLimitTier;
        let key: string;

        if (user?.userId) {
            tier = resolveUserTier(user.userId);
            key = `user:${user.userId}`;
        } else {
            tier = "anonymous";
            key = `ip:${ip}`;
        }

        // Admin bypass
        if (tier === "admin") {
            return next();
        }

        const config = TIER_CONFIGS[tier];
        const now = Date.now();

        // Get or create entry
        let entry = store.get(key);
        if (!entry) {
            entry = { timestamps: [], burstTimestamps: [] };
            store.set(key, entry);
        }

        // Prune expired timestamps
        const sustainedCutoff = now - SUSTAINED_WINDOW_MS;
        const burstCutoff = now - BURST_WINDOW_MS;
        entry.timestamps = entry.timestamps.filter(t => t > sustainedCutoff);
        entry.burstTimestamps = entry.burstTimestamps.filter(t => t > burstCutoff);

        // Check burst limit first (tighter window)
        if (entry.burstTimestamps.length >= config.burstLimit) {
            const oldestBurst = entry.burstTimestamps[0]!;
            const resetTime = oldestBurst + BURST_WINDOW_MS;
            const retryAfter = Math.ceil((resetTime - now) / 1000);

            setRateLimitHeaders(c, config.hourlyLimit, config.hourlyLimit - entry.timestamps.length, resetTime);
            c.res.headers.set("Retry-After", retryAfter.toString());

            logger.warn({ key, tier, burst: true }, "Rate limit exceeded (burst)");

            return c.json({
                error: "Rate limit exceeded",
                message: "Too many requests in a short period. Please slow down.",
                retryAfter,
                tier,
                limit: config.burstLimit,
                window: "1 minute",
            }, 429);
        }

        // Check sustained limit
        if (entry.timestamps.length >= config.hourlyLimit) {
            const oldestTimestamp = entry.timestamps[0]!;
            const resetTime = oldestTimestamp + SUSTAINED_WINDOW_MS;
            const retryAfter = Math.ceil((resetTime - now) / 1000);

            setRateLimitHeaders(c, config.hourlyLimit, 0, resetTime);
            c.res.headers.set("Retry-After", retryAfter.toString());

            logger.warn({ key, tier, burst: false }, "Rate limit exceeded (hourly)");

            return c.json({
                error: "Rate limit exceeded",
                message: "Hourly request limit reached. Upgrade your plan for higher limits.",
                retryAfter,
                tier,
                limit: config.hourlyLimit,
                window: "1 hour",
            }, 429);
        }

        // Record this request
        entry.timestamps.push(now);
        entry.burstTimestamps.push(now);

        // Set response headers
        const remaining = config.hourlyLimit - entry.timestamps.length;
        const resetTime = entry.timestamps[0]! + SUSTAINED_WINDOW_MS;
        setRateLimitHeaders(c, config.hourlyLimit, remaining, resetTime);

        await next();
    };
};

function setRateLimitHeaders(c: Context, limit: number, remaining: number, resetEpochMs: number): void {
    c.res.headers.set("X-RateLimit-Limit", limit.toString());
    c.res.headers.set("X-RateLimit-Remaining", Math.max(0, remaining).toString());
    c.res.headers.set("X-RateLimit-Reset", Math.ceil(resetEpochMs / 1000).toString());
}

// ============================================================================
// ADMIN / OBSERVABILITY
// ============================================================================

export interface RateLimitStats {
    totalTrackedKeys: number;
    tierBreakdown: Record<string, number>;
}

/**
 * Get rate limit stats for admin dashboard.
 */
export function getRateLimitStats(): RateLimitStats {
    const breakdown: Record<string, number> = { anonymous: 0, authenticated: 0 };
    for (const key of store.keys()) {
        if (key.startsWith("ip:")) {
            breakdown.anonymous = (breakdown.anonymous || 0) + 1;
        } else {
            breakdown.authenticated = (breakdown.authenticated || 0) + 1;
        }
    }
    return { totalTrackedKeys: store.size, tierBreakdown: breakdown };
}

/**
 * Clear all rate limit state (admin emergency override).
 */
export function clearRateLimits(): void {
    store.clear();
    tierCache.clear();
    logger.info("Rate limit store cleared (admin override)");
}
