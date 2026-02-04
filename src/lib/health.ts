/**
 * Health Check System for HIVE-R
 * 
 * Provides K8s-compatible health probes:
 * - /health/live: Is the process alive?
 * - /health/ready: Is the service ready to accept traffic?
 */

import Database from "better-sqlite3";

// Cache health check results to avoid hammering dependencies
interface HealthCache {
    result: boolean;
    timestamp: number;
    error?: string;
}

const CACHE_TTL_MS = 30_000; // 30 seconds
const healthCache: Map<string, HealthCache> = new Map();

function getCached(key: string): HealthCache | null {
    const cached = healthCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached;
    }
    return null;
}

function setCache(key: string, result: boolean, error?: string): void {
    const cache: HealthCache = { result, timestamp: Date.now() };
    if (error !== undefined) {
        cache.error = error;
    }
    healthCache.set(key, cache);
}

// ============================================================================
// DATABASE CHECK
// ============================================================================

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";

export async function checkDatabase(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const cached = getCached("database");
    if (cached) {
        const result: { healthy: boolean; latencyMs: number; error?: string } = { healthy: cached.result, latencyMs: 0 };
        if (cached.error !== undefined) result.error = cached.error;
        return result;
    }

    const start = Date.now();
    try {
        const db = new Database(DB_PATH, { readonly: true });
        // Simple query to verify connection
        db.prepare("SELECT 1").get();
        db.close();

        const latencyMs = Date.now() - start;
        setCache("database", true);
        return { healthy: true, latencyMs };
    } catch (error) {
        const latencyMs = Date.now() - start;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        setCache("database", false, errorMsg);
        return { healthy: false, latencyMs, error: errorMsg };
    }
}

// ============================================================================
// OPENAI CHECK
// ============================================================================

export async function checkOpenAI(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const cached = getCached("openai");
    if (cached) {
        const result: { healthy: boolean; latencyMs: number; error?: string } = { healthy: cached.result, latencyMs: 0 };
        if (cached.error !== undefined) result.error = cached.error;
        return result;
    }

    // Skip if no API key configured
    if (!process.env.OPENAI_API_KEY) {
        return { healthy: false, latencyMs: 0, error: "OPENAI_API_KEY not configured" };
    }

    const start = Date.now();
    try {
        // Minimal API call to verify key validity
        const response = await fetch("https://api.openai.com/v1/models", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        });

        const latencyMs = Date.now() - start;

        if (response.ok) {
            setCache("openai", true);
            return { healthy: true, latencyMs };
        } else {
            const errorMsg = `API returned ${response.status}`;
            setCache("openai", false, errorMsg);
            return { healthy: false, latencyMs, error: errorMsg };
        }
    } catch (error) {
        const latencyMs = Date.now() - start;
        const errorMsg = error instanceof Error ? error.message : "Network error";
        setCache("openai", false, errorMsg);
        return { healthy: false, latencyMs, error: errorMsg };
    }
}

// ============================================================================
// MEMORY CHECK
// ============================================================================

export function checkMemory(): { healthy: boolean; usage: NodeJS.MemoryUsage; heapUsedMB: number; threshold: number } {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const threshold = parseInt(process.env.MEMORY_THRESHOLD_MB || "1024", 10);
    const healthy = heapUsedMB < threshold;

    return { healthy, usage, heapUsedMB, threshold };
}

// ============================================================================
// AGGREGATED HEALTH CHECK
// ============================================================================

export interface HealthCheckResult {
    ready: boolean;
    checks: {
        database: { healthy: boolean; latencyMs: number; error?: string };
        openai: { healthy: boolean; latencyMs: number; error?: string };
        memory: { healthy: boolean; heapUsedMB: number; threshold: number };
    };
    timestamp: string;
}

export async function runHealthChecks(): Promise<HealthCheckResult> {
    const [database, openai] = await Promise.all([
        checkDatabase(),
        checkOpenAI(),
    ]);

    const memory = checkMemory();

    // Ready if database is healthy (OpenAI can be temporarily unavailable)
    const ready = database.healthy;

    return {
        ready,
        checks: {
            database,
            openai,
            memory,
        },
        timestamp: new Date().toISOString(),
    };
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export function clearHealthCache(): void {
    healthCache.clear();
}

export function getHealthCacheStats(): { size: number; keys: string[] } {
    return {
        size: healthCache.size,
        keys: Array.from(healthCache.keys()),
    };
}
