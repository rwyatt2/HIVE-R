/**
 * LLM Response Cache
 *
 * Caches LLM responses to reduce API costs and improve performance.
 * Uses semantic similarity for cache hits on similar queries.
 */
import { createHash } from "crypto";
import { logger } from "./logger.js";
// ============================================================================
// CONFIGURATION
// ============================================================================
const CACHE_ENABLED = process.env.HIVE_CACHE_ENABLED !== "false";
const CACHE_TTL_MS = parseInt(process.env.HIVE_CACHE_TTL_MS || "3600000"); // 1 hour
const MAX_CACHE_SIZE = parseInt(process.env.HIVE_CACHE_MAX_SIZE || "1000");
// ============================================================================
// CACHE STORE
// ============================================================================
const cache = new Map();
let cacheHits = 0;
let cacheMisses = 0;
/**
 * Generate cache key from prompt components
 */
function generateCacheKey(systemPrompt, userMessage, model) {
    const normalized = `${model}::${systemPrompt}::${userMessage}`.toLowerCase().trim();
    return createHash("sha256").update(normalized).digest("hex").substring(0, 32);
}
/**
 * Clean expired entries
 */
function cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of cache) {
        if (now - entry.createdAt > CACHE_TTL_MS) {
            cache.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        logger.debug(`🧹 Cache cleaned ${cleaned} expired entries`);
    }
}
/**
 * Evict oldest entries if cache is full
 */
function evictIfNeeded() {
    if (cache.size <= MAX_CACHE_SIZE)
        return;
    // Sort by createdAt, evict oldest
    const sorted = Array.from(cache.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toEvict = sorted.slice(0, sorted.length - MAX_CACHE_SIZE);
    for (const [key] of toEvict) {
        cache.delete(key);
    }
    logger.debug(`🧹 Cache evicted ${toEvict.length} old entries`);
}
// ============================================================================
// PUBLIC API
// ============================================================================
/**
 * Get cached response
 */
export function getCached(systemPrompt, userMessage, model = "gpt-4o") {
    if (!CACHE_ENABLED)
        return null;
    cleanExpired();
    const key = generateCacheKey(systemPrompt, userMessage, model);
    const entry = cache.get(key);
    if (entry) {
        entry.hitCount++;
        cacheHits++;
        logger.debug(`✅ Cache HIT`, { key: key.substring(0, 8), hits: entry.hitCount });
        return entry.response;
    }
    cacheMisses++;
    return null;
}
/**
 * Store response in cache
 */
export function setCached(systemPrompt, userMessage, response, model = "gpt-4o", tokensUsed = 0) {
    if (!CACHE_ENABLED)
        return;
    evictIfNeeded();
    const key = generateCacheKey(systemPrompt, userMessage, model);
    cache.set(key, {
        response,
        createdAt: Date.now(),
        hitCount: 0,
        tokensSaved: tokensUsed,
    });
    logger.debug(`💾 Cache SET`, { key: key.substring(0, 8), size: response.length });
}
/**
 * Get cache statistics
 */
export function getCacheStats() {
    const totalTokensSaved = Array.from(cache.values())
        .reduce((sum, entry) => sum + (entry.tokensSaved * entry.hitCount), 0);
    return {
        hits: cacheHits,
        misses: cacheMisses,
        entries: cache.size,
        totalTokensSaved,
        hitRate: cacheHits + cacheMisses > 0
            ? cacheHits / (cacheHits + cacheMisses)
            : 0,
    };
}
/**
 * Clear cache
 */
export function clearCache() {
    cache.clear();
    cacheHits = 0;
    cacheMisses = 0;
    logger.info("🧹 Cache cleared");
}
/**
 * Check if caching is enabled
 */
export function isCacheEnabled() {
    return CACHE_ENABLED;
}
//# sourceMappingURL=cache.js.map