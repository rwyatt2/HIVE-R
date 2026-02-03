/**
 * LLM Response Cache
 *
 * Caches LLM responses to reduce API costs and improve performance.
 * Uses semantic similarity for cache hits on similar queries.
 */
interface CacheStats {
    hits: number;
    misses: number;
    entries: number;
    totalTokensSaved: number;
    hitRate: number;
}
/**
 * Get cached response
 */
export declare function getCached(systemPrompt: string, userMessage: string, model?: string): string | null;
/**
 * Store response in cache
 */
export declare function setCached(systemPrompt: string, userMessage: string, response: string, model?: string, tokensUsed?: number): void;
/**
 * Get cache statistics
 */
export declare function getCacheStats(): CacheStats;
/**
 * Clear cache
 */
export declare function clearCache(): void;
/**
 * Check if caching is enabled
 */
export declare function isCacheEnabled(): boolean;
export {};
//# sourceMappingURL=cache.d.ts.map