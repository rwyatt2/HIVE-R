/**
 * Query Cache Utility
 * 
 * In-memory caching for expensive database queries.
 * Uses Map with TTL for simplicity (no external dependencies).
 */

import { logger } from './logger.js';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

// ─── Cache Implementation ───────────────────────────────────────────────────

class QueryCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Cleanup expired entries every 60 seconds
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Get a cached value, or undefined if not found/expired.
     */
    get<T>(key: string): T | undefined {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;

        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    /**
     * Set a cached value with TTL in seconds.
     */
    set<T>(key: string, value: T, ttlSeconds: number = 300): void {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (ttlSeconds * 1000),
        });
    }

    /**
     * Delete a cached value.
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Delete all cached values matching a prefix.
     */
    invalidatePrefix(prefix: string): number {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }

    /**
     * Clear all cached values.
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics.
     */
    stats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }

    /**
     * Remove expired entries.
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug({ cleaned }, 'Query cache cleanup');
        }
    }

    /**
     * Stop the cleanup interval (for graceful shutdown).
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Singleton instance
export const queryCache = new QueryCache();

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Execute a function with caching.
 * If cached value exists and is valid, return it.
 * Otherwise, execute the function and cache the result.
 */
export function withCache<T>(
    key: string,
    ttlSeconds: number,
    fn: () => T
): T {
    const cached = queryCache.get<T>(key);
    if (cached !== undefined) {
        return cached;
    }

    const result = fn();
    queryCache.set(key, result, ttlSeconds);
    return result;
}

/**
 * Async version of withCache.
 */
export async function withCacheAsync<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>
): Promise<T> {
    const cached = queryCache.get<T>(key);
    if (cached !== undefined) {
        return cached;
    }

    const result = await fn();
    queryCache.set(key, result, ttlSeconds);
    return result;
}
