/**
 * Semantic Cache for HIVE-R Agent Responses
 *
 * Uses OpenAI embeddings to find semantically similar queries.
 * Falls back to in-memory storage when Redis is unavailable.
 *
 * Usage:
 *   import { semanticCache } from "./semantic-cache.js";
 *   const cached = await semanticCache.get("Planner", "build a login form");
 *   if (!cached) { ... invoke agent ... await semanticCache.set(...); }
 */

import { createHash } from "crypto";
import { logger } from "./logger.js";
import {
    recordCacheHit,
    recordCacheMiss,
    observeCacheLatency,
} from "./metrics.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CacheEntry {
    embedding: number[];
    query: string;
    response: string;           // serialised agent response JSON
    agentName: string;
    model: string;
    createdAt: number;
    hitCount: number;
    ttl: number;                // seconds
}

export interface CacheStats {
    enabled: boolean;
    backend: "redis" | "memory";
    entries: number;
    hits: number;
    misses: number;
    hitRate: string;
    byAgent: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CACHE_ENABLED = process.env.CACHE_ENABLED !== "false";
const REDIS_URL = process.env.CACHE_REDIS_URL ?? "";
const SIMILARITY_THRESHOLD = parseFloat(
    process.env.CACHE_SIMILARITY_THRESHOLD ?? "0.95",
);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const EMBEDDING_MODEL = "text-embedding-3-small";

// TTL defaults (seconds)
const TTL_MAP: Record<string, number> = {
    Planner: 86_400,  // 24h
    Founder: 86_400,
    ProductManager: 86_400,
    UXResearcher: 86_400,
    Designer: 3_600,  // 1h
    Accessibility: 3_600,
    Security: 3_600,
    Reviewer: 3_600,
    TechWriter: 3_600,
    SRE: 3_600,
    DataAnalyst: 3_600,
};
const DEFAULT_TTL = parseInt(
    process.env.CACHE_DEFAULT_TTL_HOURS ?? "1",
    10,
) * 3600;

// Agents that must NEVER be cached (they have side effects)
const NON_CACHEABLE_AGENTS = new Set(["Builder", "Tester"]);

// ---------------------------------------------------------------------------
// Embedding helper
// ---------------------------------------------------------------------------

async function getEmbedding(text: string): Promise<number[]> {
    if (!OPENAI_API_KEY) return [];

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: OPENAI_API_KEY });

    const res = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000), // truncate to stay within limits
    });

    return res.data[0]?.embedding ?? [];
}

// ---------------------------------------------------------------------------
// Cosine similarity
// ---------------------------------------------------------------------------

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        const ai = a[i]!;
        const bi = b[i]!;
        dot += ai * bi;
        magA += ai * ai;
        magB += bi * bi;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// Storage backends
// ---------------------------------------------------------------------------

interface CacheBackend {
    get(key: string): Promise<CacheEntry | null>;
    scan(prefix: string): Promise<CacheEntry[]>;
    set(key: string, entry: CacheEntry, ttlSec: number): Promise<void>;
    delete(pattern: string): Promise<number>;
    size(): Promise<number>;
    allEntries(): Promise<CacheEntry[]>;
}

/** In-memory backend for development */
class MemoryBackend implements CacheBackend {
    private store = new Map<string, { entry: CacheEntry; expiresAt: number }>();

    async get(key: string): Promise<CacheEntry | null> {
        const item = this.store.get(key);
        if (!item) return null;
        if (Date.now() > item.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return item.entry;
    }

    async scan(prefix: string): Promise<CacheEntry[]> {
        const results: CacheEntry[] = [];
        const now = Date.now();
        for (const [key, item] of this.store) {
            if (key.startsWith(prefix)) {
                if (now > item.expiresAt) {
                    this.store.delete(key);
                } else {
                    results.push(item.entry);
                }
            }
        }
        return results;
    }

    async set(key: string, entry: CacheEntry, ttlSec: number): Promise<void> {
        this.store.set(key, {
            entry,
            expiresAt: Date.now() + ttlSec * 1000,
        });
    }

    async delete(pattern: string): Promise<number> {
        let count = 0;
        for (const key of this.store.keys()) {
            if (key.startsWith(pattern.replace("*", ""))) {
                this.store.delete(key);
                count++;
            }
        }
        return count;
    }

    async size(): Promise<number> {
        return this.store.size;
    }

    async allEntries(): Promise<CacheEntry[]> {
        const entries: CacheEntry[] = [];
        const now = Date.now();
        for (const [key, item] of this.store) {
            if (now > item.expiresAt) {
                this.store.delete(key);
            } else {
                entries.push(item.entry);
            }
        }
        return entries;
    }
}

/** Redis backend for production */
class RedisBackend implements CacheBackend {
    private client: any = null;

    constructor(private url: string) { }

    private async getClient() {
        if (!this.client) {
            const ioredis = await import("ioredis");
            // ioredis default export is the Redis class itself
            const RedisClient = (ioredis as any).default ?? ioredis;
            this.client = new RedisClient(this.url, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times: number) =>
                    times > 3 ? null : Math.min(times * 200, 2000),
                lazyConnect: true,
            });
            try {
                await this.client!.connect();
                logger.info("Redis cache connected");
            } catch (err) {
                logger.warn({ err }, "Redis cache connection failed, falling back to memory");
                this.client = null;
                throw err;
            }
        }
        return this.client!;
    }

    async get(key: string): Promise<CacheEntry | null> {
        const redis = await this.getClient();
        const raw: string | null = await redis.get(key);
        return raw ? (JSON.parse(raw) as CacheEntry) : null;
    }

    async scan(prefix: string): Promise<CacheEntry[]> {
        const redis = await this.getClient();
        const entries: CacheEntry[] = [];
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor, "MATCH", `${prefix}*`, "COUNT", 100,
            );
            cursor = nextCursor;
            if (keys.length > 0) {
                const values = await redis.mget(...keys);
                for (const v of values) {
                    if (v) entries.push(JSON.parse(v));
                }
            }
        } while (cursor !== "0");
        return entries;
    }

    async set(key: string, entry: CacheEntry, ttlSec: number): Promise<void> {
        const redis = await this.getClient();
        await redis.set(key, JSON.stringify(entry), "EX", ttlSec);
    }

    async delete(pattern: string): Promise<number> {
        const redis = await this.getClient();
        let count = 0;
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor, "MATCH", pattern, "COUNT", 100,
            );
            cursor = nextCursor;
            if (keys.length > 0) {
                await redis.del(...keys);
                count += keys.length;
            }
        } while (cursor !== "0");
        return count;
    }

    async size(): Promise<number> {
        const redis = await this.getClient();
        return redis.dbsize();
    }

    async allEntries(): Promise<CacheEntry[]> {
        return this.scan("semcache:");
    }
}

// ---------------------------------------------------------------------------
// SemanticCache
// ---------------------------------------------------------------------------

class SemanticCache {
    private backend: CacheBackend;
    private totalHits = 0;
    private totalMisses = 0;

    constructor() {
        if (REDIS_URL) {
            try {
                this.backend = new RedisBackend(REDIS_URL);
                logger.info({ url: REDIS_URL }, "Semantic cache: Redis backend");
            } catch {
                this.backend = new MemoryBackend();
                logger.info("Semantic cache: Memory backend (Redis unavailable)");
            }
        } else {
            this.backend = new MemoryBackend();
            logger.info("Semantic cache: Memory backend (no CACHE_REDIS_URL)");
        }
    }

    /**
     * Check if a semantically similar query has been cached.
     * Returns the cached agent response or null on miss.
     */
    async get(
        agentName: string,
        query: string,
    ): Promise<{ messages: any[]; contributors: string[] } | null> {
        if (!CACHE_ENABLED || NON_CACHEABLE_AGENTS.has(agentName)) return null;

        const timer = Date.now();

        try {
            // 1. Exact match (fast path)
            const exactKey = this.exactKey(agentName, query);
            const exact = await this.backend.get(exactKey);
            if (exact) {
                exact.hitCount++;
                await this.backend.set(exactKey, exact, exact.ttl);
                this.totalHits++;
                recordCacheHit(agentName);
                observeCacheLatency("get", (Date.now() - timer) / 1000);
                logger.debug({ agentName, type: "exact" }, "Cache HIT (exact)");
                return JSON.parse(exact.response);
            }

            // 2. Semantic similarity search
            const embedding = await getEmbedding(query);
            if (embedding.length === 0) {
                this.totalMisses++;
                recordCacheMiss(agentName);
                return null;
            }

            const candidates = await this.backend.scan(
                `semcache:${agentName}:`,
            );

            let bestMatch: CacheEntry | null = null;
            let bestSim = 0;

            for (const entry of candidates) {
                const sim = cosineSimilarity(embedding, entry.embedding);
                if (sim > bestSim && sim >= SIMILARITY_THRESHOLD) {
                    bestSim = sim;
                    bestMatch = entry;
                }
            }

            if (bestMatch) {
                bestMatch.hitCount++;
                this.totalHits++;
                recordCacheHit(agentName);
                observeCacheLatency("get", (Date.now() - timer) / 1000);
                logger.debug(
                    { agentName, similarity: bestSim.toFixed(4), type: "semantic" },
                    "Cache HIT (semantic)",
                );
                return JSON.parse(bestMatch.response);
            }

            // Miss
            this.totalMisses++;
            recordCacheMiss(agentName);
            observeCacheLatency("get", (Date.now() - timer) / 1000);
            return null;
        } catch (err) {
            logger.warn({ err, agentName }, "Cache get failed, treating as miss");
            this.totalMisses++;
            recordCacheMiss(agentName);
            return null;
        }
    }

    /**
     * Store an agent response in the cache.
     */
    async set(
        agentName: string,
        query: string,
        response: { messages: any[]; contributors: string[] },
        model: string = "gpt-4o",
    ): Promise<void> {
        if (!CACHE_ENABLED || NON_CACHEABLE_AGENTS.has(agentName)) return;

        const timer = Date.now();

        try {
            const ttl = TTL_MAP[agentName] ?? DEFAULT_TTL;
            const embedding = await getEmbedding(query);

            const entry: CacheEntry = {
                embedding,
                query,
                response: JSON.stringify(response),
                agentName,
                model,
                createdAt: Date.now(),
                hitCount: 0,
                ttl,
            };

            // Store under both exact key and semantic key
            const exactKey = this.exactKey(agentName, query);
            const semKey = `semcache:${agentName}:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            await Promise.all([
                this.backend.set(exactKey, entry, ttl),
                this.backend.set(semKey, entry, ttl),
            ]);

            observeCacheLatency("set", (Date.now() - timer) / 1000);
            logger.debug({ agentName, ttl }, "Cache SET");
        } catch (err) {
            logger.warn({ err, agentName }, "Cache set failed (non-fatal)");
        }
    }

    /**
     * Clear cache entries. If agentName is provided, only clear that agent's entries.
     */
    async clear(agentName?: string): Promise<number> {
        const pattern = agentName
            ? `*${agentName}*`
            : "semcache:*";
        const exactPattern = agentName
            ? `cache:${agentName}:*`
            : "cache:*";

        const [semCount, exactCount] = await Promise.all([
            this.backend.delete(pattern),
            this.backend.delete(exactPattern),
        ]);

        const total = semCount + exactCount;
        logger.info({ agentName: agentName ?? "ALL", deleted: total }, "Cache cleared");
        return total;
    }

    /**
     * Cache statistics for admin endpoint.
     */
    async stats(): Promise<CacheStats> {
        const entries = await this.backend.allEntries();
        const byAgent: Record<string, number> = {};
        for (const e of entries) {
            byAgent[e.agentName] = (byAgent[e.agentName] ?? 0) + 1;
        }

        const total = this.totalHits + this.totalMisses;
        return {
            enabled: CACHE_ENABLED,
            backend: REDIS_URL ? "redis" : "memory",
            entries: entries.length,
            hits: this.totalHits,
            misses: this.totalMisses,
            hitRate: total > 0 ? `${((this.totalHits / total) * 100).toFixed(1)}%` : "0%",
            byAgent,
        };
    }

    /** Is caching enabled and is this agent cacheable? */
    isCacheable(agentName: string): boolean {
        return CACHE_ENABLED && !NON_CACHEABLE_AGENTS.has(agentName);
    }

    private exactKey(agentName: string, query: string): string {
        const hash = createHash("sha256").update(query.trim().toLowerCase()).digest("hex").slice(0, 16);
        return `cache:${agentName}:${hash}`;
    }
}

// Singleton
export const semanticCache = new SemanticCache();
